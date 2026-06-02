import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { MofUnidadDto } from './dto/mof-unidad.dto';
import { MofPersonalDto } from './dto/mof-personal.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MofService implements OnModuleInit {
  private readonly logger = new Logger(MofService.name);
  private readonly mofApiUrl =
    'https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/mof/unidades';
  private lastSync: Date | null = null;
  private syncStatus: string = 'Nunca sincronizado';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Unidad)
    private readonly unidadRepository: Repository<Unidad>,
    @InjectRepository(Cargo)
    private readonly cargoRepository: Repository<Cargo>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    if (isProd) {
      this.logger.log(
        'Entorno de producción detectado. Iniciando sincronización MOF automática...',
      );
      await this.sync();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Iniciando sincronización MOF programada...');
    await this.sync();
  }

  async fetchUnidades(): Promise<MofUnidadDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ data: MofUnidadDto[] }>(this.mofApiUrl),
      );
      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al conectar con el MOF: ${message}`);
      throw error;
    }
  }

  async healthCheck() {
    try {
      await this.fetchUnidades();
      return { status: 'OK', message: 'Conectividad con MOF establecida' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        status: 'Error',
        message: `Sin conexión con MOF: ${message}`,
      };
    }
  }

  /**
   * Sincroniza Unidades desde el MOF usando Upsert seguro.
   *
   * IMPORTANTE: Este método reemplaza el antiguo TRUNCATE CASCADE que destruía
   * todas las relaciones con procesos y procedimientos al re-sincronizar.
   *
   * Estrategia:
   * - Si la Unidad existe (por id_unidad) → UPDATE solo campos de texto
   * - Si no existe → INSERT
   * - Si existía antes pero ya no viene del MOF → Soft Delete (deleted_at)
   */
  async sync() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Obteniendo datos del MOF...');
      const mofUnidades = await this.fetchUnidades();

      this.logger.log(
        `MOF retornó ${mofUnidades.length} unidades. Iniciando upsert...`,
      );

      const unidadesToSave = mofUnidades.map((u) => ({
        id_unidad: u.id,
        nombre: u.nombre,
        sigla: u.codigo,
        nivel: u.nivel,
        tipo_unidad: u.tipo,
      }));

      // Upsert: preserva los IDs existentes y sus relaciones con procesos
      await queryRunner.manager.upsert(Unidad, unidadesToSave, ['id_unidad']);

      // Soft delete: desactivar las unidades que ya no existen en el MOF
      const mofIds = unidadesToSave.map((u) => u.id_unidad);
      if (mofIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .softDelete()
          .from(Unidad)
          .where('id_unidad NOT IN (:...ids) AND deleted_at IS NULL', {
            ids: mofIds,
          })
          .execute();
      }

      await queryRunner.commitTransaction();

      this.lastSync = new Date();
      this.syncStatus = 'Éxito';
      this.logger.log('Sincronización MOF de unidades completada exitosamente.');

      return {
        total: unidadesToSave.length,
        timestamp: this.lastSync,
        status: this.syncStatus,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.syncStatus = 'Error';
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Fallo en la sincronización MOF: ${message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getStatus() {
    return {
      lastSync: this.lastSync,
      status: this.syncStatus,
      apiUrl: this.mofApiUrl,
    };
  }

  async fetchPersonalByUnidad(id_unidad: number): Promise<MofPersonalDto[]> {
    const url = `https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/unidades/${id_unidad}/personal`;
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ data: MofPersonalDto[] }>(url),
      );
      return response.data.data || [];
    } catch (error: unknown) {
      // Si es un 404, simplemente la unidad no tiene personal asignado en el MOF
      if ((error as any).response?.status === 404) {
        this.logger.warn(
          `Unidad ${id_unidad} no tiene personal registrado en el MOF (404).`,
        );
        return [];
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al obtener personal de unidad ${id_unidad}: ${message}`,
      );
      throw error;
    }
  }

  async getCargos(): Promise<Cargo[]> {
    return await this.cargoRepository.find();
  }

  /**
   * Sincroniza Cargos desde el MOF usando Upsert seguro.
   *
   * IMPORTANTE: Este método reemplaza el antiguo TRUNCATE CASCADE que destruía
   * todas las asignaciones de cargos en procesos y procedimientos.
   *
   * Estrategia:
   * - Si el Cargo existe (por id_cargo) → UPDATE nombre y descripcion
   * - Si no existe → INSERT
   * - Si existía antes pero ya no viene del MOF → Soft Delete (deleted_at)
   * - Tabla pivote unidad_cargos: solo INSERT nuevas relaciones (ON CONFLICT DO NOTHING)
   */
  async syncCargos() {
    try {
      this.logger.log('Iniciando sincronización de cargos desde MOF...');
      const unidades = await this.unidadRepository.find();

      if (unidades.length === 0) {
        throw new Error(
          'No hay unidades sincronizadas. Sincronice unidades primero.',
        );
      }

      const cargosMap = new Map<number, { id_cargo: number; nombre: string; descripcion: string }>();
      const unitCargosMap = new Map<number, number[]>();

      this.logger.log(`Procesando ${unidades.length} unidades en lotes...`);

      const BATCH_SIZE = 10;
      for (let i = 0; i < unidades.length; i += BATCH_SIZE) {
        const batch = unidades.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (unidad) => {
            this.logger.log(
              `Solicitando personal para unidad ${unidad.id_unidad} (${unidad.nombre})...`,
            );
            try {
              const personal = await this.fetchPersonalByUnidad(
                unidad.id_unidad,
              );
              this.logger.log(
                `Unidad ${unidad.id_unidad} retornó ${personal.length} cargos.`,
              );
              const cargoIds: number[] = [];

              for (const p of personal) {
                if (!cargosMap.has(p.id)) {
                  cargosMap.set(p.id, {
                    id_cargo: p.id,
                    nombre: p.descripcion,
                    descripcion: p.detalle || '',
                  });
                }
                cargoIds.push(p.id);
              }
              unitCargosMap.set(unidad.id_unidad, cargoIds);
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : String(error);
              this.logger.warn(
                `Saltando unidad ${unidad.id_unidad} debido a error: ${message}`,
              );
            }
          }),
        );
        this.logger.log(
          `Progreso: ${Math.min(i + BATCH_SIZE, unidades.length)}/${unidades.length} unidades procesadas.`,
        );
        // Pequeño retraso para no saturar el API externo
        if (i + BATCH_SIZE < unidades.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const cargosToSave = Array.from(cargosMap.values());

        // Upsert: preserva los IDs existentes y sus relaciones con procesos
        this.logger.log(`Realizando upsert de ${cargosToSave.length} cargos únicos...`);
        await queryRunner.manager.upsert(Cargo, cargosToSave, ['id_cargo']);

        // Soft delete: desactivar los cargos que ya no existen en el MOF
        const mofCargoIds = Array.from(cargosMap.keys());
        if (mofCargoIds.length > 0) {
          await queryRunner.manager
            .createQueryBuilder()
            .softDelete()
            .from(Cargo)
            .where('id_cargo NOT IN (:...ids) AND deleted_at IS NULL', {
              ids: mofCargoIds,
            })
            .execute();
        }

        // Tabla pivote: insertar SOLO relaciones nuevas sin borrar las existentes
        const relations: { id_unidad: number; id_cargo: number }[] = [];
        for (const [id_unidad, cargoIds] of unitCargosMap.entries()) {
          for (const id_cargo of cargoIds) {
            relations.push({ id_unidad, id_cargo });
          }
        }

        this.logger.log(`Total cargos únicos encontrados: ${cargosMap.size}`);
        this.logger.log(
          `Total relaciones unidad-cargo encontradas: ${relations.length}`,
        );

        if (relations.length > 0) {
          // ON CONFLICT DO NOTHING preserva relaciones existentes sin duplicar
          // Insertar en fragmentos de 500 para evitar límites de parámetros de SQL
          const RELATION_BATCH_SIZE = 500;
          for (let i = 0; i < relations.length; i += RELATION_BATCH_SIZE) {
            const batch = relations.slice(i, i + RELATION_BATCH_SIZE);
            const values = batch
              .map((r) => `(${r.id_unidad}, ${r.id_cargo})`)
              .join(', ');
            await queryRunner.query(
              `INSERT INTO unidad_cargos (id_unidad, id_cargo) VALUES ${values} ON CONFLICT DO NOTHING`,
            );
          }
        }

        await queryRunner.commitTransaction();
        this.logger.log('Sincronización de cargos completada exitosamente.');

        return {
          total_cargos: cargosToSave.length,
          unidades_procesadas: unitCargosMap.size,
          timestamp: new Date(),
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Fallo en la sincronización de cargos: ${message}`);
      throw error;
    }
  }
}
