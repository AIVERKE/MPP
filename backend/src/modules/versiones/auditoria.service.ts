import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditoriaCambios } from './entities/auditoria-cambios.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditoriaCambios)
    private readonly auditoriaRepository: Repository<AuditoriaCambios>,
  ) {}

  async registrarCambio(
    tablaAfectada: string,
    idRegistroOriginal: number,
    accion: string,
    datosAnteriores: any,
    datosNuevos: any,
    idUsuario?: number,
    motivoCambio?: string,
    manager?: EntityManager,
  ): Promise<AuditoriaCambios> {
    const registro = new AuditoriaCambios();
    registro.tablaAfectada = tablaAfectada;
    registro.idRegistroOriginal = idRegistroOriginal;
    registro.accion = accion;
    registro.datosAnteriores = datosAnteriores || {};
    registro.datosNuevos = datosNuevos || null;
    if (idUsuario !== undefined) {
      registro.idUsuario = idUsuario;
    }
    if (motivoCambio) {
      registro.motivoCambio = motivoCambio;
    }

    const repository = manager
      ? manager.getRepository(AuditoriaCambios)
      : this.auditoriaRepository;

    return await repository.save(registro);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    tablaAfectada?: string;
    accion?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    idUsuario?: number;
    idRegistroOriginal?: number;
  }) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.auditoriaRepository.createQueryBuilder('auditoria');

    if (query.tablaAfectada) {
      queryBuilder.andWhere('auditoria.tablaAfectada = :tablaAfectada', {
        tablaAfectada: query.tablaAfectada,
      });
    }

    if (query.accion) {
      queryBuilder.andWhere('auditoria.accion = :accion', {
        accion: query.accion,
      });
    }

    if (query.idRegistroOriginal) {
      queryBuilder.andWhere(
        'auditoria.idRegistroOriginal = :idRegistroOriginal',
        {
          idRegistroOriginal: Number(query.idRegistroOriginal),
        },
      );
    }

    if (query.idUsuario) {
      queryBuilder.andWhere('auditoria.idUsuario = :idUsuario', {
        idUsuario: Number(query.idUsuario),
      });
    }

    if (query.fechaDesde) {
      queryBuilder.andWhere('auditoria.fechaCambio >= :fechaDesde', {
        fechaDesde: new Date(query.fechaDesde),
      });
    }

    if (query.fechaHasta) {
      const hasTime =
        query.fechaHasta.includes('T') || query.fechaHasta.includes(' ');
      const val = hasTime
        ? query.fechaHasta
        : `${query.fechaHasta}T23:59:59.999Z`;
      queryBuilder.andWhere('auditoria.fechaCambio <= :fechaHasta', {
        fechaHasta: new Date(val),
      });
    }

    queryBuilder
      .orderBy('auditoria.fechaCambio', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<AuditoriaCambios> {
    const registro = await this.auditoriaRepository.findOne({
      where: { id_auditoria: id },
    });
    if (!registro) {
      throw new NotFoundException(
        `Registro de auditoría con ID ${id} no encontrado`,
      );
    }
    return registro;
  }
}
