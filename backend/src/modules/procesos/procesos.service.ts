import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Proceso } from './entities/proceso.entity';
import { Procedimiento } from './entities/procedimiento.entity';
import { CargoProceso } from './entities/cargo-proceso.entity';
import { CreateProcesoDto, UpdateProcesoDto } from './dto/proceso.dto';
import {
  CreateProcedimientoDto,
  UpdateProcedimientoDto,
} from './dto/procedimiento.dto';
import {
  CreateCargoProcesoDto,
  UpdateCargoProcesoDto,
} from './dto/cargo-proceso.dto';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { AuditoriaService } from '../versiones/auditoria.service';
import { VersionesService } from '../versiones/versiones.service';

function cloneEntity<T>(entity: T): T {
  return JSON.parse(JSON.stringify(entity));
}


@Injectable()
export class ProcesosService {
  constructor(
    @InjectRepository(Proceso)
    private readonly procesoRepository: Repository<Proceso>,
    @InjectRepository(Procedimiento)
    private readonly procedimientoRepository: Repository<Procedimiento>,
    @InjectRepository(CargoProceso)
    private readonly cargoProcesoRepository: Repository<CargoProceso>,
    @InjectRepository(Unidad)
    private readonly unidadRepository: Repository<Unidad>,
    @InjectRepository(Cargo)
    private readonly cargoRepository: Repository<Cargo>,
    private readonly auditoriaService: AuditoriaService,
    private readonly versionesService: VersionesService,
  ) {}

  // --- Procesos ---

  async createProceso(
    createDto: CreateProcesoDto,
    idUsuario?: number,
  ): Promise<Proceso> {
    const { id_unidades, ...procesoData } = createDto;

    // Verificar unicidad de código
    if (procesoData.codigo) {
      const existing = await this.procesoRepository.findOne({
        where: { codigo: procesoData.codigo },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un proceso con el código ${procesoData.codigo}`,
        );
      }
    }

    const proceso = this.procesoRepository.create(procesoData);

    if (id_unidades && id_unidades.length > 0) {
      const unidades = await this.unidadRepository.findBy({
        id_unidad: In(id_unidades),
      });
      if (unidades.length !== id_unidades.length) {
        throw new BadRequestException(
          'Una o más unidades especificadas no existen',
        );
      }
      proceso.unidades = unidades;
    }

    try {
      const saved = await this.procesoRepository.save(proceso);
      const postSnapshot = await this.findOneProceso(saved.id_proceso);
      await this.auditoriaService.registrarCambio(
        'Proceso',
        saved.id_proceso,
        'CREATE',
        {},
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        throw new ConflictException(
          `Ya existe un proceso con el código ${procesoData.codigo}`,
        );
      }
      throw error;
    }
  }

  async findAllProcesos(): Promise<Proceso[]> {
    return await this.procesoRepository.find({
      relations: ['unidades', 'cargoProcesos', 'cargoProcesos.cargo'],
    });
  }

  async findOneProceso(id: number): Promise<Proceso> {
    const proceso = await this.procesoRepository.findOne({
      where: { id_proceso: id },
      relations: ['unidades', 'cargoProcesos', 'cargoProcesos.cargo'],
    });
    if (!proceso)
      throw new NotFoundException(`Proceso con ID ${id} no encontrado`);
    return proceso;
  }

  async updateProceso(
    id: number,
    updateDto: UpdateProcesoDto,
    idUsuario?: number,
  ): Promise<Proceso> {
    const proceso = await this.findOneProceso(id);
    const preSnapshot = cloneEntity(proceso);
    const { id_unidades, ...procesoData } = updateDto;

    // Verificar unicidad de código si está cambiando
    if (procesoData.codigo && procesoData.codigo !== proceso.codigo) {
      const existing = await this.procesoRepository.findOne({
        where: { codigo: procesoData.codigo },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un proceso con el código ${procesoData.codigo}`,
        );
      }
    }

    Object.assign(proceso, procesoData);

    if (id_unidades) {
      const unidades =
        id_unidades.length > 0
          ? await this.unidadRepository.findBy({ id_unidad: In(id_unidades) })
          : [];
      if (id_unidades.length > 0 && unidades.length !== id_unidades.length) {
        throw new BadRequestException(
          'Una o más unidades especificadas no existen',
        );
      }
      proceso.unidades = unidades;
    }

    try {
      await this.procesoRepository.save(proceso);
      const postSnapshot = await this.findOneProceso(id);
      await this.auditoriaService.registrarCambio(
        'Proceso',
        id,
        'UPDATE',
        preSnapshot,
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        throw new ConflictException(
          `Ya existe un proceso con el código ${procesoData.codigo}`,
        );
      }
      throw error;
    }
  }

  async removeProceso(id: number, idUsuario?: number): Promise<void> {
    const proceso = await this.findOneProceso(id);
    const preSnapshot = cloneEntity(proceso);
    await this.procesoRepository.softRemove(proceso);
    await this.auditoriaService.registrarCambio(
      'Proceso',
      id,
      'DELETE',
      preSnapshot,
      null,
      idUsuario,
    );
  }

  // --- Procedimientos ---

  async createProcedimiento(
    createDto: CreateProcedimientoDto,
    idUsuario?: number,
  ): Promise<Procedimiento> {
    const { id_instalaciones, ...procedimientoData } = createDto;

    // Verificar unicidad de código
    if (procedimientoData.codigo) {
      const existing = await this.procedimientoRepository.findOne({
        where: { codigo: procedimientoData.codigo },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un procedimiento con el código ${procedimientoData.codigo}`,
        );
      }
    }

    const procedimiento =
      this.procedimientoRepository.create(procedimientoData);

    if (id_instalaciones && id_instalaciones.length > 0) {
      const instalaciones = await this.unidadRepository.findBy({
        id_unidad: In(id_instalaciones),
      });
      if (instalaciones.length !== id_instalaciones.length) {
        throw new BadRequestException(
          'Una o más instalaciones (unidades) especificadas no existen',
        );
      }
      procedimiento.instalaciones = instalaciones;
    }

    try {
      const saved = await this.procedimientoRepository.save(procedimiento);
      const postSnapshot = await this.findOneProcedimiento(
        saved.id_procedimiento,
      );
      await this.auditoriaService.registrarCambio(
        'Procedimiento',
        saved.id_procedimiento,
        'CREATE',
        {},
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        throw new ConflictException(
          `Ya existe un procedimiento con el código ${procedimientoData.codigo}`,
        );
      }
      throw error;
    }
  }

  async findAllProcedimientos(): Promise<Procedimiento[]> {
    return await this.procedimientoRepository.find({
      relations: ['proceso', 'instalaciones'],
    });
  }

  async findOneProcedimiento(id: number): Promise<Procedimiento> {
    const procedimiento = await this.procedimientoRepository.findOne({
      where: { id_procedimiento: id },
      relations: ['proceso', 'instalaciones'],
    });
    if (!procedimiento)
      throw new NotFoundException(`Procedimiento con ID ${id} no encontrado`);
    return procedimiento;
  }

  async updateProcedimiento(
    id: number,
    updateDto: UpdateProcedimientoDto,
    idUsuario?: number,
  ): Promise<Procedimiento> {
    const procedimiento = await this.findOneProcedimiento(id);
    const preSnapshot = cloneEntity(procedimiento);
    const { id_instalaciones, ...procedimientoData } = updateDto;

    // Verificar unicidad de código si está cambiando
    if (
      procedimientoData.codigo &&
      procedimientoData.codigo !== procedimiento.codigo
    ) {
      const existing = await this.procedimientoRepository.findOne({
        where: { codigo: procedimientoData.codigo },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un procedimiento con el código ${procedimientoData.codigo}`,
        );
      }
    }

    Object.assign(procedimiento, procedimientoData);

    const versionAnterior = preSnapshot.version;
    let versionNueva = versionAnterior;

    // Solo se incrementa la versión si el nuevo estado es 'Aprobado' y el anterior no lo era
    if (
      procedimientoData.estado_version === 'Aprobado' &&
      preSnapshot.estado_version !== 'Aprobado'
    ) {
      versionNueva = this.versionesService.calcularNuevaVersion(versionAnterior);
      procedimiento.version = versionNueva;
    }

    if (id_instalaciones) {
      const instalaciones =
        id_instalaciones.length > 0
          ? await this.unidadRepository.findBy({
              id_unidad: In(id_instalaciones),
            })
          : [];
      if (
        id_instalaciones.length > 0 &&
        instalaciones.length !== id_instalaciones.length
      ) {
        throw new BadRequestException(
          'Una o más instalaciones (unidades) especificadas no existen',
        );
      }
      procedimiento.instalaciones = instalaciones;
    }

    try {
      await this.procedimientoRepository.save(procedimiento);
      const postSnapshot = await this.findOneProcedimiento(id);

      if (versionNueva !== versionAnterior) {
        await this.versionesService.registrarVersionamiento(
          id,
          versionAnterior || '',
          versionNueva,
          idUsuario,
        );
      }

      await this.auditoriaService.registrarCambio(
        'Procedimiento',
        id,
        'UPDATE',
        preSnapshot,
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        throw new ConflictException(
          `Ya existe un procedimiento con el código ${procedimientoData.codigo}`,
        );
      }
      throw error;
    }
  }

  async removeProcedimiento(id: number, idUsuario?: number): Promise<void> {
    const procedimiento = await this.findOneProcedimiento(id);
    const preSnapshot = cloneEntity(procedimiento);
    await this.procedimientoRepository.softRemove(procedimiento);
    await this.auditoriaService.registrarCambio(
      'Procedimiento',
      id,
      'DELETE',
      preSnapshot,
      null,
      idUsuario,
    );
  }

  // --- CargoProcesos ---

  async createCargoProceso(
    createDto: CreateCargoProcesoDto,
    idUsuario?: number,
  ): Promise<CargoProceso> {
    const { id_cargo, id_proceso } = createDto;

    // Validar que el cargo exista
    const cargo = await this.cargoRepository.findOne({ where: { id_cargo } });
    if (!cargo) {
      throw new BadRequestException(`El cargo con ID ${id_cargo} no existe.`);
    }

    // Validar que el proceso exista
    const proceso = await this.procesoRepository.findOne({
      where: { id_proceso },
    });
    if (!proceso) {
      throw new BadRequestException(
        `El proceso con ID ${id_proceso} no existe.`,
      );
    }

    const cargoProceso = this.cargoProcesoRepository.create(createDto);
    const saved = await this.cargoProcesoRepository.save(cargoProceso);
    const postSnapshot = await this.findOneCargoProceso(saved.id);
    await this.auditoriaService.registrarCambio(
      'CargoProceso',
      saved.id,
      'CREATE',
      {},
      postSnapshot,
      idUsuario,
    );
    return postSnapshot;
  }

  async findAllCargoProcesos(): Promise<CargoProceso[]> {
    return await this.cargoProcesoRepository.find({
      relations: ['cargo', 'proceso'],
    });
  }

  async findOneCargoProceso(id: number): Promise<CargoProceso> {
    const cargoProceso = await this.cargoProcesoRepository.findOne({
      where: { id },
      relations: ['cargo', 'proceso'],
    });
    if (!cargoProceso)
      throw new NotFoundException(
        `Relación Cargo-Proceso con ID ${id} no encontrada`,
      );
    return cargoProceso;
  }

  async updateCargoProceso(
    id: number,
    updateDto: UpdateCargoProcesoDto,
    idUsuario?: number,
  ): Promise<CargoProceso> {
    const cargoProceso = await this.findOneCargoProceso(id);
    const preSnapshot = cloneEntity(cargoProceso);

    const { id_cargo, id_proceso } = updateDto;

    if (id_cargo) {
      const cargo = await this.cargoRepository.findOne({ where: { id_cargo } });
      if (!cargo) {
        throw new BadRequestException(`El cargo con ID ${id_cargo} no existe.`);
      }
    }

    if (id_proceso) {
      const proceso = await this.procesoRepository.findOne({
        where: { id_proceso },
      });
      if (!proceso) {
        throw new BadRequestException(
          `El proceso con ID ${id_proceso} no existe.`,
        );
      }
    }

    Object.assign(cargoProceso, updateDto);
    await this.cargoProcesoRepository.save(cargoProceso);
    const postSnapshot = await this.findOneCargoProceso(id);
    await this.auditoriaService.registrarCambio(
      'CargoProceso',
      id,
      'UPDATE',
      preSnapshot,
      postSnapshot,
      idUsuario,
    );
    return postSnapshot;
  }

  async removeCargoProceso(id: number, idUsuario?: number): Promise<void> {
    const cargoProceso = await this.findOneCargoProceso(id);
    const preSnapshot = cloneEntity(cargoProceso);
    await this.cargoProcesoRepository.softRemove(cargoProceso);
    await this.auditoriaService.registrarCambio(
      'CargoProceso',
      id,
      'DELETE',
      preSnapshot,
      null,
      idUsuario,
    );
  }
}
