import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { AuditoriaService } from './auditoria.service';

export interface VersionamientoResult {
  versionNueva: string | null;
  debeRegistrar: boolean;
}

function cloneEntity<T>(entity: T): T {
  return JSON.parse(JSON.stringify(entity));
}

@Injectable()
export class VersionesService {
  constructor(
    private readonly auditoriaService: AuditoriaService,
    @InjectRepository(Procedimiento)
    private readonly procedimientoRepository: Repository<Procedimiento>,
  ) {}

  /**
   * Incrementa la versión cuando el estado pasa a 'Aprobado' desde cualquier otro estado
   * (incluye Renovado → Aprobado). No incrementa si ya estaba Aprobado o si no se aprueba.
   */
  debeIncrementarVersion(
    estadoAnterior: Procedimiento['estado_version'],
    estadoNuevo?: Procedimiento['estado_version'],
  ): boolean {
    return estadoNuevo === 'Aprobado' && estadoAnterior !== 'Aprobado';
  }

  calcularNuevaVersion(versionActual: string | null | undefined): string {
    const normalized = versionActual?.trim();
    if (!normalized) {
      return '1.0';
    }
    const parts = normalized.split('.');
    if (parts.length === 0) return '1.0';
    if (parts.length === 1) {
      const major = parseInt(parts[0], 10);
      return isNaN(major) ? '1.0' : `${major}.1`;
    }
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    if (isNaN(major) || isNaN(minor)) return '1.0';
    return `${major}.${minor + 1}`;
  }

  aplicarVersionamientoSiCorresponde(
    pre: Pick<Procedimiento, 'version' | 'estado_version'>,
    estadoVersionNuevo?: Procedimiento['estado_version'],
  ): VersionamientoResult {
    const versionAnterior = pre.version ?? null;
    const estadoNuevo = estadoVersionNuevo ?? pre.estado_version;

    if (!this.debeIncrementarVersion(pre.estado_version, estadoNuevo)) {
      return { versionNueva: versionAnterior, debeRegistrar: false };
    }

    const versionNueva = this.calcularNuevaVersion(versionAnterior);
    return {
      versionNueva,
      debeRegistrar: versionNueva !== versionAnterior,
    };
  }

  resolverVersionamientoEnCreacion(
    estadoVersion?: Procedimiento['estado_version'],
  ): VersionamientoResult {
    if (estadoVersion === 'Aprobado') {
      return { versionNueva: '1.0', debeRegistrar: true };
    }
    return { versionNueva: null, debeRegistrar: false };
  }

  async registrarVersionamiento(
    procedimientoId: number,
    versionAnterior: string,
    versionNueva: string,
    idUsuario?: number,
    manager?: EntityManager,
  ): Promise<void> {
    await this.auditoriaService.registrarCambio(
      'Procedimiento',
      procedimientoId,
      'VERSION',
      { version: versionAnterior },
      { version: versionNueva },
      idUsuario,
      undefined,
      manager,
    );
  }

  /**
   * Actualiza el estado_version de un procedimiento y registra auditoría CAMBIO_ESTADO
   * con snapshots completos (incluyendo relaciones).
   */
  async cambiarEstadoProcedimiento(
    procedimientoId: number,
    nuevoEstado: Procedimiento['estado_version'],
    idUsuario?: number,
    motivo?: string,
    manager?: EntityManager,
  ): Promise<Procedimiento> {
    const repository = manager
      ? manager.getRepository(Procedimiento)
      : this.procedimientoRepository;

    const procedimiento = await repository.findOne({
      where: { id_procedimiento: procedimientoId },
      relations: ['proceso', 'instalaciones'],
    });

    if (!procedimiento) {
      throw new NotFoundException(
        `Procedimiento con ID ${procedimientoId} no encontrado`,
      );
    }

    const preSnapshot = cloneEntity(procedimiento);
    procedimiento.estado_version = nuevoEstado;
    await repository.save(procedimiento);

    const postSnapshot = await repository.findOne({
      where: { id_procedimiento: procedimientoId },
      relations: ['proceso', 'instalaciones'],
    });

    if (!postSnapshot) {
      throw new NotFoundException(
        `Procedimiento con ID ${procedimientoId} no encontrado`,
      );
    }

    await this.auditoriaService.registrarCambio(
      'Procedimiento',
      procedimientoId,
      'CAMBIO_ESTADO',
      preSnapshot,
      postSnapshot,
      idUsuario,
      motivo,
      manager,
    );

    return postSnapshot;
  }
}
