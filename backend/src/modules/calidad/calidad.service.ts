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

@Injectable()
export class CalidadService {
  constructor(
    @InjectRepository(Normativa)
    private readonly normativaRepository: Repository<Normativa>,
    @InjectRepository(Indicador)
    private readonly indicadorRepository: Repository<Indicador>,
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

  async createNormativa(createDto: CreateNormativaDto) {
    try {
      const { id_procedimientos, ...rest } = createDto;
      const nuevaNormativa = this.normativaRepository.create(rest);

      if (id_procedimientos && id_procedimientos.length > 0) {
        nuevaNormativa.procedimientos = id_procedimientos.map((id) => ({
          id_procedimiento: id,
        })) as unknown as any;
      }

      return await this.normativaRepository.save(nuevaNormativa);
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

  async updateNormativa(id: number, updateDto: UpdateNormativaDto) {
    const normativa = await this.findOneNormativa(id);
    const { id_procedimientos, ...rest } = updateDto;

    Object.assign(normativa, rest);

    if (id_procedimientos !== undefined) {
      normativa.procedimientos = id_procedimientos.map((idProc) => ({
        id_procedimiento: idProc,
      })) as unknown as any;
    }

    try {
      return await this.normativaRepository.save(normativa);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeNormativa(id: number) {
    const normativa = await this.findOneNormativa(id);
    try {
      return await this.normativaRepository.softRemove(normativa);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================
  // INDICADOR
  // ============================

  async createIndicador(createDto: CreateIndicadorDto) {
    try {
      const { id_procedimientos, ...rest } = createDto;
      const nuevoIndicador = this.indicadorRepository.create(rest);

      if (id_procedimientos && id_procedimientos.length > 0) {
        nuevoIndicador.procedimientos = id_procedimientos.map((id) => ({
          id_procedimiento: id,
        })) as unknown as any;
      }

      return await this.indicadorRepository.save(nuevoIndicador);
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

  async updateIndicador(id: number, updateDto: UpdateIndicadorDto) {
    const indicador = await this.findOneIndicador(id);
    const { id_procedimientos, ...rest } = updateDto;

    Object.assign(indicador, rest);

    if (id_procedimientos !== undefined) {
      indicador.procedimientos = id_procedimientos.map((idProc) => ({
        id_procedimiento: idProc,
      })) as unknown as any;
    }

    try {
      return await this.indicadorRepository.save(indicador);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeIndicador(id: number) {
    const indicador = await this.findOneIndicador(id);
    try {
      return await this.indicadorRepository.softRemove(indicador);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
