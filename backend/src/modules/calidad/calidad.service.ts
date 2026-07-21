import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Normativa } from './entities/normativa.entity';
import { Indicador } from './entities/indicador.entity';
import { CreateNormativaDto, UpdateNormativaDto } from './dto/normativa.dto';
import { CreateIndicadorDto, UpdateIndicadorDto } from './dto/indicador.dto';
import { AuditoriaService } from '../versiones/auditoria.service';

function cloneEntity<T>(entity: T): T {
  return JSON.parse(JSON.stringify(entity));
}

@Injectable()
export class CalidadService {
  constructor(
    @InjectRepository(Normativa)
    private readonly normativaRepository: Repository<Normativa>,
    @InjectRepository(Indicador)
    private readonly indicadorRepository: Repository<Indicador>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private handleDatabaseError(error: unknown): never {
    const dbError = error as { code?: string };
    if (dbError.code === '23505') {
      throw new ConflictException('El registro ya existe (duplicado).');
    }
    if (dbError.code === '23503') {
      throw new BadRequestException(
        'El registro hace referencia a una entidad que no existe.',
      );
    }
    throw new InternalServerErrorException(
      'Error inesperado en la base de datos.',
    );
  }

  // ============================
  // NORMATIVA
  // ============================

  async createNormativa(createDto: CreateNormativaDto, idUsuario?: number) {
    try {
      const { id_procedimientos, ...rest } = createDto;
      const nuevaNormativa = this.normativaRepository.create(rest);

      if (id_procedimientos && id_procedimientos.length > 0) {
        nuevaNormativa.procedimientos = id_procedimientos.map((id) => ({
          id_procedimiento: id,
        })) as unknown as any;
      }

      const saved = await this.normativaRepository.save(nuevaNormativa);
      const postSnapshot = await this.findOneNormativa(saved.id_normativa);
      await this.auditoriaService.registrarCambio(
        'Normativa',
        saved.id_normativa,
        'CREATE',
        {},
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAllNormativas() {
    return this.normativaRepository.find({ relations: ['procedimientos'] });
  }

  async findOneNormativa(id: number) {
    const normativa = await this.normativaRepository.findOne({
      where: { id_normativa: id },
      relations: ['procedimientos'],
    });

    if (!normativa) {
      throw new NotFoundException(`Normativa con ID ${id} no encontrada`);
    }

    return normativa;
  }

  async updateNormativa(
    id: number,
    updateDto: UpdateNormativaDto,
    idUsuario?: number,
  ) {
    const normativa = await this.findOneNormativa(id);
    const preSnapshot = cloneEntity(normativa);
    const { id_procedimientos, ...rest } = updateDto;

    Object.assign(normativa, rest);

    if (id_procedimientos !== undefined) {
      normativa.procedimientos = id_procedimientos.map((idProc) => ({
        id_procedimiento: idProc,
      })) as unknown as any;
    }

    try {
      await this.normativaRepository.save(normativa);
      const postSnapshot = await this.findOneNormativa(id);
      await this.auditoriaService.registrarCambio(
        'Normativa',
        id,
        'UPDATE',
        preSnapshot,
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeNormativa(id: number, idUsuario?: number) {
    const normativa = await this.findOneNormativa(id);
    const preSnapshot = cloneEntity(normativa);
    try {
      await this.normativaRepository.softRemove(normativa);
      await this.auditoriaService.registrarCambio(
        'Normativa',
        id,
        'DELETE',
        preSnapshot,
        null,
        idUsuario,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================
  // INDICADOR
  // ============================

  async createIndicador(createDto: CreateIndicadorDto, idUsuario?: number) {
    try {
      const { id_procedimientos, ...rest } = createDto;
      const nuevoIndicador = this.indicadorRepository.create(rest);

      if (id_procedimientos && id_procedimientos.length > 0) {
        nuevoIndicador.procedimientos = id_procedimientos.map((id) => ({
          id_procedimiento: id,
        })) as unknown as any;
      }

      const saved = await this.indicadorRepository.save(nuevoIndicador);
      const postSnapshot = await this.findOneIndicador(saved.id_indicador);
      await this.auditoriaService.registrarCambio(
        'Indicador',
        saved.id_indicador,
        'CREATE',
        {},
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAllIndicadores() {
    return this.indicadorRepository.find({ relations: ['procedimientos'] });
  }

  async findOneIndicador(id: number) {
    const indicador = await this.indicadorRepository.findOne({
      where: { id_indicador: id },
      relations: ['procedimientos'],
    });

    if (!indicador) {
      throw new NotFoundException(`Indicador con ID ${id} no encontrado`);
    }

    return indicador;
  }

  async updateIndicador(
    id: number,
    updateDto: UpdateIndicadorDto,
    idUsuario?: number,
  ) {
    const indicador = await this.findOneIndicador(id);
    const preSnapshot = cloneEntity(indicador);
    const { id_procedimientos, ...rest } = updateDto;

    Object.assign(indicador, rest);

    if (id_procedimientos !== undefined) {
      indicador.procedimientos = id_procedimientos.map((idProc) => ({
        id_procedimiento: idProc,
      })) as unknown as any;
    }

    try {
      await this.indicadorRepository.save(indicador);
      const postSnapshot = await this.findOneIndicador(id);
      await this.auditoriaService.registrarCambio(
        'Indicador',
        id,
        'UPDATE',
        preSnapshot,
        postSnapshot,
        idUsuario,
      );
      return postSnapshot;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeIndicador(id: number, idUsuario?: number) {
    const indicador = await this.findOneIndicador(id);
    const preSnapshot = cloneEntity(indicador);
    try {
      await this.indicadorRepository.softRemove(indicador);
      await this.auditoriaService.registrarCambio(
        'Indicador',
        id,
        'DELETE',
        preSnapshot,
        null,
        idUsuario,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
