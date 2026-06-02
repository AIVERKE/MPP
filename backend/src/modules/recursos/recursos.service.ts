import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Requisitos } from './entities/requisitos.entity';
import { Riesgo } from './entities/riesgo.entity';
import { Control } from './entities/control.entity';
import { SistemaInformacion } from './entities/sistema-informacion.entity';
import { Equipo } from './entities/equipo.entity';
import { DocumentoReferencia } from './entities/documento-referencia.entity';
import { CreateRequisitosDto, UpdateRequisitosDto } from './dto/requisitos.dto';
import { CreateRiesgoDto, UpdateRiesgoDto } from './dto/riesgo.dto';
import { CreateControlDto, UpdateControlDto } from './dto/control.dto';
import {
  CreateSistemaInformacionDto,
  UpdateSistemaInformacionDto,
} from './dto/sistema-informacion.dto';
import { CreateEquipoDto, UpdateEquipoDto } from './dto/equipo.dto';
import {
  CreateDocumentoReferenciaDto,
  UpdateDocumentoReferenciaDto,
} from './dto/documento-referencia.dto';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Operacion } from '../flujo/entities/operacion.entity';

@Injectable()
export class RecursosService {
  constructor(
    @InjectRepository(Requisitos)
    private readonly requisitosRepository: Repository<Requisitos>,
    @InjectRepository(Riesgo)
    private readonly riesgoRepository: Repository<Riesgo>,
    @InjectRepository(Control)
    private readonly controlRepository: Repository<Control>,
    @InjectRepository(SistemaInformacion)
    private readonly sistemaInformacionRepository: Repository<SistemaInformacion>,
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(DocumentoReferencia)
    private readonly documentoReferenciaRepository: Repository<DocumentoReferencia>,
    @InjectRepository(Procedimiento)
    private readonly procedimientoRepository: Repository<Procedimiento>,
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
  ) {}

  // --- Requisitos ---

  async createRequisitos(createDto: CreateRequisitosDto): Promise<Requisitos> {
    if (createDto.id_operacion) {
      const operacion = await this.operacionRepository.findOne({
        where: { id_operaciones: createDto.id_operacion },
      });
      if (!operacion) {
        throw new BadRequestException(
          `La operación con ID ${createDto.id_operacion} no existe.`,
        );
      }
    }

    const requisito = this.requisitosRepository.create(createDto);
    try {
      return await this.requisitosRepository.save(requisito);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAllRequisitos(): Promise<Requisitos[]> {
    return await this.requisitosRepository.find({ relations: ['operacion'] });
  }

  async findOneRequisitos(id: number): Promise<Requisitos> {
    const requisito = await this.requisitosRepository.findOne({
      where: { id_requisitos: id },
      relations: ['operacion'],
    });
    if (!requisito)
      throw new NotFoundException(`Requisito con ID ${id} no encontrado`);
    return requisito;
  }

  async updateRequisitos(
    id: number,
    updateDto: UpdateRequisitosDto,
  ): Promise<Requisitos> {
    const requisito = await this.findOneRequisitos(id);

    if (updateDto.id_operacion) {
      const operacion = await this.operacionRepository.findOne({
        where: { id_operaciones: updateDto.id_operacion },
      });
      if (!operacion) {
        throw new BadRequestException(
          `La operación con ID ${updateDto.id_operacion} no existe.`,
        );
      }
    }

    Object.assign(requisito, updateDto);
    try {
      return await this.requisitosRepository.save(requisito);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeRequisitos(id: number): Promise<void> {
    const requisito = await this.findOneRequisitos(id);
    await this.requisitosRepository.softRemove(requisito);
  }

  // --- Riesgo ---

  async createRiesgo(createDto: CreateRiesgoDto): Promise<Riesgo> {
    if (createDto.id_operacion) {
      const operacion = await this.operacionRepository.findOne({
        where: { id_operaciones: createDto.id_operacion },
      });
      if (!operacion) {
        throw new BadRequestException(
          `La operación con ID ${createDto.id_operacion} no existe.`,
        );
      }
    }

    const riesgo = this.riesgoRepository.create(createDto);
    try {
      return await this.riesgoRepository.save(riesgo);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAllRiesgos(): Promise<Riesgo[]> {
    return await this.riesgoRepository.find({ relations: ['operacion'] });
  }

  async findOneRiesgo(id: number): Promise<Riesgo> {
    const riesgo = await this.riesgoRepository.findOne({
      where: { id_riesgo: id },
      relations: ['operacion'],
    });
    if (!riesgo)
      throw new NotFoundException(`Riesgo con ID ${id} no encontrado`);
    return riesgo;
  }

  async updateRiesgo(id: number, updateDto: UpdateRiesgoDto): Promise<Riesgo> {
    const riesgo = await this.findOneRiesgo(id);

    if (updateDto.id_operacion) {
      const operacion = await this.operacionRepository.findOne({
        where: { id_operaciones: updateDto.id_operacion },
      });
      if (!operacion) {
        throw new BadRequestException(
          `La operación con ID ${updateDto.id_operacion} no existe.`,
        );
      }
    }

    Object.assign(riesgo, updateDto);
    try {
      return await this.riesgoRepository.save(riesgo);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeRiesgo(id: number): Promise<void> {
    const riesgo = await this.findOneRiesgo(id);
    await this.riesgoRepository.softRemove(riesgo);
  }

  // --- Control ---

  async createControl(createDto: CreateControlDto): Promise<Control> {
    if (createDto.id_operacion) {
      const operacion = await this.operacionRepository.findOne({
        where: { id_operaciones: createDto.id_operacion },
      });
      if (!operacion) {
        throw new BadRequestException(
          `La operación con ID ${createDto.id_operacion} no existe.`,
        );
      }
    }

    const control = this.controlRepository.create(createDto);
    try {
      return await this.controlRepository.save(control);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAllControles(): Promise<Control[]> {
    return await this.controlRepository.find({ relations: ['operacion'] });
  }

  async findOneControl(id: number): Promise<Control> {
    const control = await this.controlRepository.findOne({
      where: { id_control: id },
      relations: ['operacion'],
    });
    if (!control)
      throw new NotFoundException(`Control con ID ${id} no encontrado`);
    return control;
  }

  async updateControl(
    id: number,
    updateDto: UpdateControlDto,
  ): Promise<Control> {
    const control = await this.findOneControl(id);

    if (updateDto.id_operacion) {
      const operacion = await this.operacionRepository.findOne({
        where: { id_operaciones: updateDto.id_operacion },
      });
      if (!operacion) {
        throw new BadRequestException(
          `La operación con ID ${updateDto.id_operacion} no existe.`,
        );
      }
    }

    Object.assign(control, updateDto);
    try {
      return await this.controlRepository.save(control);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeControl(id: number): Promise<void> {
    const control = await this.findOneControl(id);
    await this.controlRepository.softRemove(control);
  }

  // --- SistemaInformacion ---

  async createSistemaInformacion(
    createDto: CreateSistemaInformacionDto,
  ): Promise<SistemaInformacion> {
    const { id_procedimientos, ...data } = createDto;
    const sistema = this.sistemaInformacionRepository.create(data);

    if (id_procedimientos && id_procedimientos.length > 0) {
      const procedimientos = await this.procedimientoRepository.findBy({
        id_procedimiento: In(id_procedimientos),
      });
      if (procedimientos.length !== id_procedimientos.length) {
        throw new BadRequestException(`Uno o más procedimientos no existen.`);
      }
      sistema.procedimientos = procedimientos;
    }

    try {
      return await this.sistemaInformacionRepository.save(sistema);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAllSistemasInformacion(): Promise<SistemaInformacion[]> {
    return await this.sistemaInformacionRepository.find({
      relations: ['procedimientos'],
    });
  }

  async findOneSistemaInformacion(id: number): Promise<SistemaInformacion> {
    const sistema = await this.sistemaInformacionRepository.findOne({
      where: { id_sistema_informacion: id },
      relations: ['procedimientos'],
    });
    if (!sistema)
      throw new NotFoundException(
        `Sistema de Información con ID ${id} no encontrado`,
      );
    return sistema;
  }

  async updateSistemaInformacion(
    id: number,
    updateDto: UpdateSistemaInformacionDto,
  ): Promise<SistemaInformacion> {
    const sistema = await this.findOneSistemaInformacion(id);
    const { id_procedimientos, ...data } = updateDto;

    Object.assign(sistema, data);

    if (id_procedimientos) {
      if (id_procedimientos.length > 0) {
        const procedimientos = await this.procedimientoRepository.findBy({
          id_procedimiento: In(id_procedimientos),
        });
        if (procedimientos.length !== id_procedimientos.length) {
          throw new BadRequestException(`Uno o más procedimientos no existen.`);
        }
        sistema.procedimientos = procedimientos;
      } else {
        sistema.procedimientos = [];
      }
    }

    try {
      return await this.sistemaInformacionRepository.save(sistema);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeSistemaInformacion(id: number): Promise<void> {
    const sistema = await this.findOneSistemaInformacion(id);
    await this.sistemaInformacionRepository.softRemove(sistema);
  }

  // --- Equipo ---

  async createEquipo(createDto: CreateEquipoDto): Promise<Equipo> {
    const { id_procedimientos, ...data } = createDto;
    const equipo = this.equipoRepository.create(data);

    if (id_procedimientos && id_procedimientos.length > 0) {
      const procedimientos = await this.procedimientoRepository.findBy({
        id_procedimiento: In(id_procedimientos),
      });
      if (procedimientos.length !== id_procedimientos.length) {
        throw new BadRequestException(`Uno o más procedimientos no existen.`);
      }
      equipo.procedimientos = procedimientos;
    }

    try {
      return await this.equipoRepository.save(equipo);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAllEquipos(): Promise<Equipo[]> {
    return await this.equipoRepository.find({ relations: ['procedimientos'] });
  }

  async findOneEquipo(id: number): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOne({
      where: { id_equipos: id },
      relations: ['procedimientos'],
    });
    if (!equipo)
      throw new NotFoundException(`Equipo con ID ${id} no encontrado`);
    return equipo;
  }

  async updateEquipo(id: number, updateDto: UpdateEquipoDto): Promise<Equipo> {
    const equipo = await this.findOneEquipo(id);
    const { id_procedimientos, ...data } = updateDto;

    Object.assign(equipo, data);

    if (id_procedimientos) {
      if (id_procedimientos.length > 0) {
        const procedimientos = await this.procedimientoRepository.findBy({
          id_procedimiento: In(id_procedimientos),
        });
        if (procedimientos.length !== id_procedimientos.length) {
          throw new BadRequestException(`Uno o más procedimientos no existen.`);
        }
        equipo.procedimientos = procedimientos;
      } else {
        equipo.procedimientos = [];
      }
    }

    try {
      return await this.equipoRepository.save(equipo);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeEquipo(id: number): Promise<void> {
    const equipo = await this.findOneEquipo(id);
    await this.equipoRepository.softRemove(equipo);
  }

  // --- DocumentoReferencia ---

  async createDocumentoReferencia(
    createDto: CreateDocumentoReferenciaDto,
  ): Promise<DocumentoReferencia> {
    const { id_operaciones, ...data } = createDto;
    const documento = this.documentoReferenciaRepository.create(data);

    if (id_operaciones && id_operaciones.length > 0) {
      const operaciones = await this.operacionRepository.findBy({
        id_operaciones: In(id_operaciones),
      });
      if (operaciones.length !== id_operaciones.length) {
        throw new BadRequestException(`Uno o más operaciones no existen.`);
      }
      documento.operaciones = operaciones;
    }

    try {
      return await this.documentoReferenciaRepository.save(documento);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAllDocumentosReferencia(): Promise<DocumentoReferencia[]> {
    return await this.documentoReferenciaRepository.find({
      relations: ['operaciones'],
    });
  }

  async findOneDocumentoReferencia(id: number): Promise<DocumentoReferencia> {
    const documento = await this.documentoReferenciaRepository.findOne({
      where: { id_documento_referencia: id },
      relations: ['operaciones'],
    });
    if (!documento)
      throw new NotFoundException(
        `Documento de Referencia con ID ${id} no encontrado`,
      );
    return documento;
  }

  async updateDocumentoReferencia(
    id: number,
    updateDto: UpdateDocumentoReferenciaDto,
  ): Promise<DocumentoReferencia> {
    const documento = await this.findOneDocumentoReferencia(id);
    const { id_operaciones, ...data } = updateDto;

    Object.assign(documento, data);

    if (id_operaciones) {
      if (id_operaciones.length > 0) {
        const operaciones = await this.operacionRepository.findBy({
          id_operaciones: In(id_operaciones),
        });
        if (operaciones.length !== id_operaciones.length) {
          throw new BadRequestException(`Uno o más operaciones no existen.`);
        }
        documento.operaciones = operaciones;
      } else {
        documento.operaciones = [];
      }
    }

    try {
      return await this.documentoReferenciaRepository.save(documento);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeDocumentoReferencia(id: number): Promise<void> {
    const documento = await this.findOneDocumentoReferencia(id);
    await this.documentoReferenciaRepository.softRemove(documento);
  }

  private handleDatabaseError(error: unknown): never {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if ((error as any).code === '23505') {
      throw new ConflictException('Ya existe un registro con estos datos.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if ((error as any).code === '23503') {
      throw new BadRequestException(
        'Una o más relaciones especificadas no existen.',
      );
    }
    throw error;
  }
}
