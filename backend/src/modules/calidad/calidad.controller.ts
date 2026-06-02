import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CalidadService } from './calidad.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateNormativaDto, UpdateNormativaDto } from './dto/normativa.dto';
import { CreateIndicadorDto, UpdateIndicadorDto } from './dto/indicador.dto';
import { Normativa } from './entities/normativa.entity';
import { Indicador } from './entities/indicador.entity';

@ApiTags('Marco Normativo y Calidad')
@Controller('calidad')
export class CalidadController {
  constructor(private readonly service: CalidadService) {}

  // ============================
  // NORMATIVAS
  // ============================

  @Post('normativas')
  @ApiOperation({ summary: 'Crear una nueva normativa' })
  @ApiResponse({
    status: 201,
    description: 'La normativa ha sido creada exitosamente.',
    type: Normativa,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'Conflicto de duplicidad.' })
  createNormativa(@Body() createDto: CreateNormativaDto) {
    return this.service.createNormativa(createDto);
  }

  @Get('normativas')
  @ApiOperation({ summary: 'Obtener todas las normativas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de normativas.',
    type: [Normativa],
  })
  findAllNormativas() {
    return this.service.findAllNormativas();
  }

  @Get('normativas/:id')
  @ApiOperation({ summary: 'Obtener una normativa por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la normativa' })
  @ApiResponse({
    status: 200,
    description: 'Normativa encontrada.',
    type: Normativa,
  })
  @ApiResponse({ status: 404, description: 'Normativa no encontrada.' })
  findOneNormativa(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneNormativa(id);
  }

  @Patch('normativas/:id')
  @ApiOperation({ summary: 'Actualizar una normativa por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la normativa' })
  @ApiResponse({
    status: 200,
    description: 'Normativa actualizada exitosamente.',
    type: Normativa,
  })
  @ApiResponse({ status: 404, description: 'Normativa no encontrada.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  updateNormativa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateNormativaDto,
  ) {
    return this.service.updateNormativa(id, updateDto);
  }

  @Delete('normativas/:id')
  @ApiOperation({ summary: 'Eliminar (soft delete) una normativa por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la normativa' })
  @ApiResponse({
    status: 200,
    description: 'Normativa eliminada exitosamente.',
    type: Normativa,
  })
  @ApiResponse({ status: 404, description: 'Normativa no encontrada.' })
  removeNormativa(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeNormativa(id);
  }

  // ============================
  // INDICADORES
  // ============================

  @Post('indicadores')
  @ApiOperation({ summary: 'Crear un nuevo indicador' })
  @ApiResponse({
    status: 201,
    description: 'El indicador ha sido creado exitosamente.',
    type: Indicador,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'Conflicto de duplicidad.' })
  createIndicador(@Body() createDto: CreateIndicadorDto) {
    return this.service.createIndicador(createDto);
  }

  @Get('indicadores')
  @ApiOperation({ summary: 'Obtener todos los indicadores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de indicadores.',
    type: [Indicador],
  })
  findAllIndicadores() {
    return this.service.findAllIndicadores();
  }

  @Get('indicadores/:id')
  @ApiOperation({ summary: 'Obtener un indicador por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del indicador' })
  @ApiResponse({
    status: 200,
    description: 'Indicador encontrado.',
    type: Indicador,
  })
  @ApiResponse({ status: 404, description: 'Indicador no encontrado.' })
  findOneIndicador(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneIndicador(id);
  }

  @Patch('indicadores/:id')
  @ApiOperation({ summary: 'Actualizar un indicador por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del indicador' })
  @ApiResponse({
    status: 200,
    description: 'Indicador actualizado exitosamente.',
    type: Indicador,
  })
  @ApiResponse({ status: 404, description: 'Indicador no encontrado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  updateIndicador(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateIndicadorDto,
  ) {
    return this.service.updateIndicador(id, updateDto);
  }

  @Delete('indicadores/:id')
  @ApiOperation({ summary: 'Eliminar (soft delete) un indicador por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del indicador' })
  @ApiResponse({
    status: 200,
    description: 'Indicador eliminado exitosamente.',
    type: Indicador,
  })
  @ApiResponse({ status: 404, description: 'Indicador no encontrado.' })
  removeIndicador(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeIndicador(id);
  }
}
