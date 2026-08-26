import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, In } from 'typeorm';
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
import { SeguridadService } from '../seguridad/seguridad.service';
import {
  ESTADOS_PUBLICADOS,
  ROLES_MPP,
} from '../seguridad/roles.constants';

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
    private readonly seguridadService: SeguridadService,
    private readonly dataSource: DataSource,
  ) {}

  private async resolveUnidadIdsProcedimiento(
    procedimiento: Procedimiento,
    idInstalacionesOverride?: number[],
  ): Promise<number[]> {
    if (idInstalacionesOverride !== undefined) {
      return [...new Set(idInstalacionesOverride)];
    }
    const fromInst = (procedimiento.instalaciones || []).map(
      (u) => u.id_unidad,
    );
    if (fromInst.length > 0) return [...new Set(fromInst)];

    const proceso = await this.procesoRepository.findOne({
      where: { id_proceso: procedimiento.id_proceso },
      relations: ['unidades'],
    });
    return [...new Set((proceso?.unidades || []).map((u) => u.id_unidad))];
  }

  private intersecta(autorizadas: number[], delRecurso: number[]): boolean {
    if (autorizadas.length === 0 || delRecurso.length === 0) return false;
    const set = new Set(autorizadas);
    return delRecurso.some((id) => set.has(id));
  }

  private async assertPuedeMutarProcedimiento(
    idUsuario: number | undefined,
  ): Promise<string[]> {
    if (!idUsuario) {
      throw new ForbiddenException(
        'Se requiere autenticación para esta operación',
      );
    }
    const roleNames = await this.seguridadService.getNombresRoles(idUsuario);
    if (this.seguridadService.esSoloConsultor(roleNames)) {
      throw new ForbiddenException(
        'El rol Consultor solo puede consultar procedimientos publicados',
      );
    }
    return roleNames;
  }

  private async assertAlcanceElaborador(
    idUsuario: number,
    roleNames: string[],
    unidadIds: number[],
  ): Promise<void> {
    if (this.seguridadService.esSuperAdmin(roleNames)) return;
    if (!roleNames.includes(ROLES_MPP.ELABORADOR)) {
      if (
        roleNames.includes(ROLES_MPP.VALIDADOR_PLANIFICACION) ||
        roleNames.includes(ROLES_MPP.VALIDADOR_TECNICO)
      ) {
        return;
      }
      throw new ForbiddenException(
        'No tiene un rol autorizado para elaborar o modificar procedimientos',
      );
    }
    const autorizadas = await this.seguridadService.getUnidadesAlcance(
      idUsuario,
      ROLES_MPP.ELABORADOR,
    );
    if (!this.intersecta(autorizadas, unidadIds)) {
      throw new ForbiddenException(
        'No tiene alcance de Elaborador sobre las unidades del procedimiento',
      );
    }
  }

  private async assertAlcanceValidadorTecnico(
    idUsuario: number,
    roleNames: string[],
    unidadIds: number[],
  ): Promise<void> {
    if (this.seguridadService.esSuperAdmin(roleNames)) return;
    if (!roleNames.includes(ROLES_MPP.VALIDADOR_TECNICO)) {
      throw new ForbiddenException(
        'Se requiere el rol Validador Técnico para aprobar el procedimiento',
      );
    }
    const autorizadas = await this.seguridadService.getUnidadesAlcance(
      idUsuario,
      ROLES_MPP.VALIDADOR_TECNICO,
    );
    if (!this.intersecta(autorizadas, unidadIds)) {
      throw new ForbiddenException(
        'No tiene alcance de Validador Técnico sobre las unidades del procedimiento',
      );
    }
  }

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
      relations: ['unidades', 'cargoProcesos', 'cargoProcesos.cargo', 'cargoProcesos.unidad'],
    });
  }

  async findOneProceso(id: number): Promise<Proceso> {
    const proceso = await this.procesoRepository.findOne({
      where: { id_proceso: id },
      relations: ['unidades', 'cargoProcesos', 'cargoProcesos.cargo', 'cargoProcesos.unidad'],
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
    const roleNames = await this.assertPuedeMutarProcedimiento(idUsuario);
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

    const unidadIds =
      id_instalaciones && id_instalaciones.length > 0
        ? id_instalaciones
        : (
            await this.procesoRepository.findOne({
              where: { id_proceso: procedimientoData.id_proceso },
              relations: ['unidades'],
            })
          )?.unidades?.map((u) => u.id_unidad) || [];

    await this.assertAlcanceElaborador(
      idUsuario as number,
      roleNames,
      unidadIds,
    );

    const { versionNueva, debeRegistrar } =
      this.versionesService.resolverVersionamientoEnCreacion(
        procedimientoData.estado_version,
      );

    const procedimiento = this.procedimientoRepository.create({
      ...procedimientoData,
      version: versionNueva ?? undefined,
      id_elaborador: idUsuario ?? null,
    });

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
      return await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(procedimiento);
        const postSnapshot = await this.findOneProcedimientoWithManager(
          saved.id_procedimiento,
          manager,
        );

        if (debeRegistrar && versionNueva) {
          await this.versionesService.registrarVersionamiento(
            saved.id_procedimiento,
            '',
            versionNueva,
            idUsuario,
            manager,
          );
        }

        await this.auditoriaService.registrarCambio(
          'Procedimiento',
          saved.id_procedimiento,
          'CREATE',
          {},
          postSnapshot,
          idUsuario,
          undefined,
          manager,
        );

        return postSnapshot;
      });
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

  async findAllProcedimientos(idUsuario?: number): Promise<Procedimiento[]> {
    const all = await this.procedimientoRepository.find({
      relations: ['proceso', 'instalaciones'],
    });
    if (!idUsuario) return all;
    const roleNames = await this.seguridadService.getNombresRoles(idUsuario);
    if (this.seguridadService.esSoloConsultor(roleNames)) {
      return all.filter((p) =>
        (ESTADOS_PUBLICADOS as readonly string[]).includes(p.estado_version),
      );
    }
    return all;
  }

  async findOneProcedimiento(
    id: number,
    idUsuario?: number,
  ): Promise<Procedimiento> {
    const procedimiento = await this.procedimientoRepository.findOne({
      where: { id_procedimiento: id },
      relations: ['proceso', 'instalaciones'],
    });
    if (!procedimiento)
      throw new NotFoundException(`Procedimiento con ID ${id} no encontrado`);

    if (idUsuario) {
      const roleNames = await this.seguridadService.getNombresRoles(idUsuario);
      if (
        this.seguridadService.esSoloConsultor(roleNames) &&
        !(ESTADOS_PUBLICADOS as readonly string[]).includes(
          procedimiento.estado_version,
        )
      ) {
        throw new ForbiddenException(
          'El rol Consultor solo puede consultar procedimientos publicados',
        );
      }
    }

    return procedimiento;
  }

  async findHistorialVersionesProcedimiento(
    id: number,
    query?: { page?: number; limit?: number },
  ) {
    await this.findOneProcedimiento(id);
    return this.auditoriaService.findAll({
      tablaAfectada: 'Procedimiento',
      idRegistroOriginal: id,
      accion: 'VERSION',
      page: query?.page,
      limit: query?.limit,
    });
  }

  private async findOneProcedimientoWithManager(
    id: number,
    manager: EntityManager,
  ): Promise<Procedimiento> {
    const procedimiento = await manager.findOne(Procedimiento, {
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
    const roleNames = await this.assertPuedeMutarProcedimiento(idUsuario);
    const procedimiento = await this.findOneProcedimiento(id);
    const preSnapshot = cloneEntity(procedimiento);
    const {
      id_instalaciones,
      estado_version: nuevoEstado,
      motivo_cambio: motivoCambio,
      ...procedimientoData
    } = updateDto;

    const unidadIds = await this.resolveUnidadIdsProcedimiento(
      procedimiento,
      id_instalaciones,
    );

    const aprueba =
      nuevoEstado !== undefined &&
      nuevoEstado === 'Aprobado' &&
      preSnapshot.estado_version !== 'Aprobado';

    if (aprueba) {
      if (
        procedimiento.id_elaborador != null &&
        idUsuario === procedimiento.id_elaborador
      ) {
        throw new ForbiddenException(
          'Segregación de funciones: quien elaboró el procedimiento no puede otorgar el visto bueno técnico del mismo',
        );
      }
      await this.assertAlcanceValidadorTecnico(
        idUsuario as number,
        roleNames,
        unidadIds,
      );
    } else {
      await this.assertAlcanceElaborador(
        idUsuario as number,
        roleNames,
        unidadIds,
      );
    }

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

    const estadoCambio =
      nuevoEstado !== undefined &&
      nuevoEstado !== preSnapshot.estado_version;

    const versionAnterior = preSnapshot.version ?? null;
    const { versionNueva, debeRegistrar } =
      this.versionesService.aplicarVersionamientoSiCorresponde(
        preSnapshot,
        nuevoEstado,
      );

    if (debeRegistrar && versionNueva) {
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
      return await this.dataSource.transaction(async (manager) => {
        await manager.save(procedimiento);

        if (estadoCambio && nuevoEstado) {
          await this.versionesService.cambiarEstadoProcedimiento(
            id,
            nuevoEstado,
            idUsuario,
            motivoCambio,
            manager,
          );
        }

        const postSnapshot = await this.findOneProcedimientoWithManager(
          id,
          manager,
        );

        if (debeRegistrar && versionNueva) {
          await this.versionesService.registrarVersionamiento(
            id,
            versionAnterior || '',
            versionNueva,
            idUsuario,
            manager,
          );
        }

        await this.auditoriaService.registrarCambio(
          'Procedimiento',
          id,
          'UPDATE',
          preSnapshot,
          postSnapshot,
          idUsuario,
          undefined,
          manager,
        );

        return postSnapshot;
      });
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
    await this.assertPuedeMutarProcedimiento(idUsuario);
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
    const { id_cargo, id_proceso, id_unidad } = createDto;

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

    // Validar que la unidad exista (si se especificó)
    if (id_unidad) {
      const unidad = await this.unidadRepository.findOne({
        where: { id_unidad },
      });
      if (!unidad) {
        throw new BadRequestException(
          `La unidad con ID ${id_unidad} no existe.`,
        );
      }
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
      relations: ['cargo', 'proceso', 'unidad'],
    });
  }

  async findOneCargoProceso(id: number): Promise<CargoProceso> {
    const cargoProceso = await this.cargoProcesoRepository.findOne({
      where: { id },
      relations: ['cargo', 'proceso', 'unidad'],
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

    const { id_cargo, id_proceso, id_unidad } = updateDto;

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

    if (id_unidad) {
      const unidad = await this.unidadRepository.findOne({
        where: { id_unidad },
      });
      if (!unidad) {
        throw new BadRequestException(
          `La unidad con ID ${id_unidad} no existe.`,
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
