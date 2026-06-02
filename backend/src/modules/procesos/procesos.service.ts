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
  ) {}

  // --- Procesos ---

  async createProceso(createDto: CreateProcesoDto): Promise<Proceso> {
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
      return await this.procesoRepository.save(proceso);
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
  ): Promise<Proceso> {
    const proceso = await this.findOneProceso(id);
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
      return await this.procesoRepository.save(proceso);
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

  async removeProceso(id: number): Promise<void> {
    const proceso = await this.findOneProceso(id);
    await this.procesoRepository.softRemove(proceso);
  }

  // --- Procedimientos ---

  async createProcedimiento(
    createDto: CreateProcedimientoDto,
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
      return await this.procedimientoRepository.save(procedimiento);
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
  ): Promise<Procedimiento> {
    const procedimiento = await this.findOneProcedimiento(id);
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
      return await this.procedimientoRepository.save(procedimiento);
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

  async removeProcedimiento(id: number): Promise<void> {
    const procedimiento = await this.findOneProcedimiento(id);
    await this.procedimientoRepository.softRemove(procedimiento);
  }

  // --- CargoProcesos ---

  async createCargoProceso(
    createDto: CreateCargoProcesoDto,
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
    return await this.cargoProcesoRepository.save(cargoProceso);
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
  ): Promise<CargoProceso> {
    const cargoProceso = await this.findOneCargoProceso(id);

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
    return await this.cargoProcesoRepository.save(cargoProceso);
  }

  async removeCargoProceso(id: number): Promise<void> {
    const cargoProceso = await this.findOneCargoProceso(id);
    await this.cargoProcesoRepository.softRemove(cargoProceso);
  }
}
