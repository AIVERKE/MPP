import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operacion } from './entities/operacion.entity';
import { Actividad } from './entities/actividad.entity';
import { Accion } from './entities/accion.entity';
import { Figura } from './entities/figura.entity';
import { OperacionCargo } from './entities/operacion-cargo.entity';
import { Tarea } from './entities/tarea.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { CreateAccionDto, UpdateAccionDto } from './dto/accion.dto';
import { CreateFiguraDto, UpdateFiguraDto } from './dto/figura.dto';
import { CreateActividadDto, UpdateActividadDto } from './dto/actividad.dto';
import { CreateOperacionDto, UpdateOperacionDto } from './dto/operacion.dto';
import {
  CreateOperacionCargoDto,
  UpdateOperacionCargoDto,
} from './dto/operacion-cargo.dto';
import { CreateTareaDto, UpdateTareaDto } from './dto/tarea.dto';

@Injectable()
export class FlujoService {
  constructor(
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Accion)
    private readonly accionRepository: Repository<Accion>,
    @InjectRepository(Figura)
    private readonly figuraRepository: Repository<Figura>,
    @InjectRepository(OperacionCargo)
    private readonly operacionCargoRepository: Repository<OperacionCargo>,
    @InjectRepository(Tarea)
    private readonly tareaRepository: Repository<Tarea>,
    @InjectRepository(Procedimiento)
    private readonly procedimientoRepository: Repository<Procedimiento>,
    @InjectRepository(Cargo)
    private readonly cargoRepository: Repository<Cargo>,
  ) {}

  // --- Figuras ---

  async createFigura(createDto: CreateFiguraDto): Promise<Figura> {
    const registro = this.figuraRepository.create(createDto);
    return await this.figuraRepository.save(registro);
  }

  async findAllFiguras(): Promise<Figura[]> {
    return await this.figuraRepository.find();
  }

  async findOneFigura(id: number): Promise<Figura> {
    const registro = await this.figuraRepository.findOne({
      where: { id_figura: id },
    });
    if (!registro) {
      throw new NotFoundException(`Figura con ID ${id} no encontrada`);
    }
    return registro;
  }

  async updateFigura(id: number, updateDto: UpdateFiguraDto): Promise<Figura> {
    const registro = await this.findOneFigura(id);
    Object.assign(registro, updateDto);
    return await this.figuraRepository.save(registro);
  }

  async removeFigura(id: number): Promise<void> {
    const registro = await this.findOneFigura(id);
    await this.figuraRepository.softRemove(registro);
  }

  // --- Acciones ---

  async createAccion(createDto: CreateAccionDto): Promise<Accion> {
    const { id_figura } = createDto;

    if (id_figura) {
      const exist = await this.figuraRepository.findOne({
        where: { id_figura },
      });
      if (!exist) {
        throw new BadRequestException(
          `Figura con ID ${id_figura} no encontrada`,
        );
      }
    }

    const registro = this.accionRepository.create(createDto);
    const saved = await this.accionRepository.save(registro);
    return await this.findOneAccion(saved.id_accion);
  }

  async findAllAcciones(): Promise<Accion[]> {
    return await this.accionRepository.find({ relations: ['figura'] });
  }

  async findOneAccion(id: number): Promise<Accion> {
    const registro = await this.accionRepository.findOne({
      where: { id_accion: id },
      relations: ['figura'],
    });
    if (!registro) {
      throw new NotFoundException(`Acción con ID ${id} no encontrada`);
    }
    return registro;
  }

  async updateAccion(id: number, updateDto: UpdateAccionDto): Promise<Accion> {
    const registro = await this.findOneAccion(id);
    const { id_figura } = updateDto;

    if (id_figura) {
      const exist = await this.figuraRepository.findOne({
        where: { id_figura },
      });
      if (!exist) {
        throw new BadRequestException(
          `Figura con ID ${id_figura} no encontrada`,
        );
      }
    }

    Object.assign(registro, updateDto);
    await this.accionRepository.save(registro);
    return await this.findOneAccion(id);
  }

  async removeAccion(id: number): Promise<void> {
    const registro = await this.findOneAccion(id);
    await this.accionRepository.softRemove(registro);
  }

  // --- Actividades ---

  async createActividad(createDto: CreateActividadDto): Promise<Actividad> {
    const { id_operaciones } = createDto;

    if (id_operaciones) {
      const exist = await this.operacionRepository.findOne({
        where: { id_operaciones },
      });
      if (!exist) {
        throw new BadRequestException(
          `Operación con ID ${id_operaciones} no encontrada`,
        );
      }
    }

    const registro = this.actividadRepository.create(createDto);
    return await this.actividadRepository.save(registro);
  }

  async findAllActividades(): Promise<Actividad[]> {
    return await this.actividadRepository.find({
      relations: ['operacion', 'tareas'],
    });
  }

  async findOneActividad(id: number): Promise<Actividad> {
    const registro = await this.actividadRepository.findOne({
      where: { id_actividad: id },
      relations: ['operacion', 'tareas'],
    });
    if (!registro) {
      throw new NotFoundException(`Actividad con ID ${id} no encontrada`);
    }
    return registro;
  }

  async updateActividad(
    id: number,
    updateDto: UpdateActividadDto,
  ): Promise<Actividad> {
    const registro = await this.findOneActividad(id);
    const { id_operaciones } = updateDto;

    if (id_operaciones) {
      const exist = await this.operacionRepository.findOne({
        where: { id_operaciones },
      });
      if (!exist) {
        throw new BadRequestException(
          `Operación con ID ${id_operaciones} no encontrada`,
        );
      }
    }

    Object.assign(registro, updateDto);
    return await this.actividadRepository.save(registro);
  }

  async removeActividad(id: number): Promise<void> {
    const registro = await this.findOneActividad(id);
    await this.actividadRepository.softRemove(registro);
  }

  // --- Operaciones ---

  async createOperacion(createDto: CreateOperacionDto): Promise<Operacion> {
    const { id_procedimiento } = createDto;

    if (id_procedimiento) {
      const exist = await this.procedimientoRepository.findOne({
        where: { id_procedimiento },
      });
      if (!exist) {
        throw new BadRequestException(
          `Procedimiento con ID ${id_procedimiento} no encontrado`,
        );
      }
    }

    const registro = this.operacionRepository.create(createDto);
    return await this.operacionRepository.save(registro);
  }

  async findAllOperaciones(): Promise<Operacion[]> {
    return await this.operacionRepository.find({
      relations: ['procedimiento', 'operacionCargos', 'actividades'],
    });
  }

  async findOneOperacion(id: number): Promise<Operacion> {
    const registro = await this.operacionRepository.findOne({
      where: { id_operaciones: id },
      relations: ['procedimiento', 'operacionCargos', 'actividades'],
    });
    if (!registro) {
      throw new NotFoundException(`Operación con ID ${id} no encontrada`);
    }
    return registro;
  }

  async updateOperacion(
    id: number,
    updateDto: UpdateOperacionDto,
  ): Promise<Operacion> {
    const registro = await this.findOneOperacion(id);
    const { id_procedimiento } = updateDto;

    if (id_procedimiento) {
      const exist = await this.procedimientoRepository.findOne({
        where: { id_procedimiento },
      });
      if (!exist) {
        throw new BadRequestException(
          `Procedimiento con ID ${id_procedimiento} no encontrado`,
        );
      }
    }

    Object.assign(registro, updateDto);
    return await this.operacionRepository.save(registro);
  }

  async removeOperacion(id: number): Promise<void> {
    const registro = await this.findOneOperacion(id);
    await this.operacionRepository.softRemove(registro);
  }

  // --- OperacionCargo ---

  async createOperacionCargo(
    createDto: CreateOperacionCargoDto,
  ): Promise<OperacionCargo> {
    const { id_operacion, id_cargo } = createDto;

    if (id_operacion) {
      const exist = await this.operacionRepository.findOne({
        where: { id_operaciones: id_operacion },
      });
      if (!exist) {
        throw new BadRequestException(
          `Operación con ID ${id_operacion} no encontrada`,
        );
      }
    }

    if (id_cargo) {
      const exist = await this.cargoRepository.findOne({ where: { id_cargo } });
      if (!exist) {
        throw new BadRequestException(`Cargo con ID ${id_cargo} no encontrado`);
      }
    }

    const registro = this.operacionCargoRepository.create(createDto);
    return await this.operacionCargoRepository.save(registro);
  }

  async findAllOperacionCargos(): Promise<OperacionCargo[]> {
    return await this.operacionCargoRepository.find({
      relations: ['operacion', 'cargo'],
    });
  }

  async findOneOperacionCargo(id: number): Promise<OperacionCargo> {
    const registro = await this.operacionCargoRepository.findOne({
      where: { id },
      relations: ['operacion', 'cargo'],
    });
    if (!registro) {
      throw new NotFoundException(
        `Relación Operación-Cargo con ID ${id} no encontrada`,
      );
    }
    return registro;
  }

  async updateOperacionCargo(
    id: number,
    updateDto: UpdateOperacionCargoDto,
  ): Promise<OperacionCargo> {
    const registro = await this.findOneOperacionCargo(id);
    const { id_operacion, id_cargo } = updateDto;

    if (id_operacion) {
      const exist = await this.operacionRepository.findOne({
        where: { id_operaciones: id_operacion },
      });
      if (!exist) {
        throw new BadRequestException(
          `Operación con ID ${id_operacion} no encontrada`,
        );
      }
    }

    if (id_cargo) {
      const exist = await this.cargoRepository.findOne({ where: { id_cargo } });
      if (!exist) {
        throw new BadRequestException(`Cargo con ID ${id_cargo} no encontrado`);
      }
    }

    Object.assign(registro, updateDto);
    return await this.operacionCargoRepository.save(registro);
  }

  async removeOperacionCargo(id: number): Promise<void> {
    const registro = await this.findOneOperacionCargo(id);
    await this.operacionCargoRepository.softRemove(registro);
  }

  // --- Tareas ---

  async createTarea(createDto: CreateTareaDto): Promise<Tarea> {
    const { id_actividad, id_accion } = createDto;

    if (id_actividad) {
      const exist = await this.actividadRepository.findOne({
        where: { id_actividad },
      });
      if (!exist) {
        throw new BadRequestException(
          `Actividad con ID ${id_actividad} no encontrada`,
        );
      }
    }

    if (id_accion) {
      const exist = await this.accionRepository.findOne({
        where: { id_accion },
      });
      if (!exist) {
        throw new BadRequestException(
          `Acción con ID ${id_accion} no encontrada`,
        );
      }
    }

    const registro = this.tareaRepository.create(createDto);
    const saved = await this.tareaRepository.save(registro);
    return await this.findOneTarea(saved.id_tarea);
  }

  async findAllTareas(): Promise<Tarea[]> {
    return await this.tareaRepository.find({
      relations: ['actividad', 'accion', 'accion.figura'],
    });
  }

  async findOneTarea(id: number): Promise<Tarea> {
    const registro = await this.tareaRepository.findOne({
      where: { id_tarea: id },
      relations: ['actividad', 'accion', 'accion.figura'],
    });
    if (!registro) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }
    return registro;
  }

  async updateTarea(id: number, updateDto: UpdateTareaDto): Promise<Tarea> {
    const registro = await this.findOneTarea(id);
    const { id_actividad, id_accion } = updateDto;

    if (id_actividad) {
      const exist = await this.actividadRepository.findOne({
        where: { id_actividad },
      });
      if (!exist) {
        throw new BadRequestException(
          `Actividad con ID ${id_actividad} no encontrada`,
        );
      }
    }

    if (id_accion) {
      const exist = await this.accionRepository.findOne({
        where: { id_accion },
      });
      if (!exist) {
        throw new BadRequestException(
          `Acción con ID ${id_accion} no encontrada`,
        );
      }
    }

    Object.assign(registro, updateDto);
    await this.tareaRepository.save(registro);
    return await this.findOneTarea(id);
  }

  async removeTarea(id: number): Promise<void> {
    const registro = await this.findOneTarea(id);
    await this.tareaRepository.softRemove(registro);
  }
}
