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
import { ProcesosService } from './procesos.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateProcesoDto, UpdateProcesoDto } from './dto/proceso.dto';
import {
  CreateProcedimientoDto,
  UpdateProcedimientoDto,
} from './dto/procedimiento.dto';
import {
  CreateCargoProcesoDto,
  UpdateCargoProcesoDto,
} from './dto/cargo-proceso.dto';

@ApiTags('Procesos')
@Controller('procesos')
export class ProcesosController {
  constructor(private readonly service: ProcesosService) {}

  // --- Procesos ---

  @Post('procesos')
  @ApiOperation({ summary: 'Crear un nuevo proceso' })
  @ApiResponse({ status: 201, description: 'Proceso creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createProceso(@Body() createDto: CreateProcesoDto) {
    return this.service.createProceso(createDto);
  }

  @Get('procesos')
  @ApiOperation({ summary: 'Listar todos los procesos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de procesos obtenida exitosamente.',
  })
  findAllProcesos() {
    return this.service.findAllProcesos();
  }

  @Get('procesos/:id')
  @ApiOperation({ summary: 'Obtener un proceso por ID' })
  @ApiParam({ name: 'id', description: 'ID del proceso' })
  @ApiResponse({ status: 200, description: 'Proceso encontrado.' })
  @ApiResponse({ status: 404, description: 'Proceso no encontrado.' })
  findOneProceso(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneProceso(id);
  }

  @Patch('procesos/:id')
  @ApiOperation({ summary: 'Actualizar un proceso por ID' })
  @ApiParam({ name: 'id', description: 'ID del proceso' })
  @ApiResponse({
    status: 200,
    description: 'Proceso actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Proceso no encontrado.' })
  updateProceso(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProcesoDto,
  ) {
    return this.service.updateProceso(id, updateDto);
  }

  @Delete('procesos/:id')
  @ApiOperation({ summary: 'Eliminar un proceso (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del proceso' })
  @ApiResponse({ status: 200, description: 'Proceso eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Proceso no encontrado.' })
  removeProceso(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeProceso(id);
  }

  // --- Procedimientos ---

  @Post('procedimientos')
  @ApiOperation({ summary: 'Crear un nuevo procedimiento' })
  @ApiResponse({
    status: 201,
    description: 'Procedimiento creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createProcedimiento(@Body() createDto: CreateProcedimientoDto) {
    return this.service.createProcedimiento(createDto);
  }

  @Get('procedimientos')
  @ApiOperation({ summary: 'Listar todos los procedimientos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de procedimientos obtenida exitosamente.',
  })
  findAllProcedimientos() {
    return this.service.findAllProcedimientos();
  }

  @Get('procedimientos/:id')
  @ApiOperation({ summary: 'Obtener un procedimiento por ID' })
  @ApiParam({ name: 'id', description: 'ID del procedimiento' })
  @ApiResponse({ status: 200, description: 'Procedimiento encontrado.' })
  @ApiResponse({ status: 404, description: 'Procedimiento no encontrado.' })
  findOneProcedimiento(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneProcedimiento(id);
  }

  @Patch('procedimientos/:id')
  @ApiOperation({ summary: 'Actualizar un procedimiento por ID' })
  @ApiParam({ name: 'id', description: 'ID del procedimiento' })
  @ApiResponse({
    status: 200,
    description: 'Procedimiento actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Procedimiento no encontrado.' })
  updateProcedimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProcedimientoDto,
  ) {
    return this.service.updateProcedimiento(id, updateDto);
  }

  @Delete('procedimientos/:id')
  @ApiOperation({ summary: 'Eliminar un procedimiento (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del procedimiento' })
  @ApiResponse({
    status: 200,
    description: 'Procedimiento eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Procedimiento no encontrado.' })
  removeProcedimiento(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeProcedimiento(id);
  }

  // --- CargoProcesos (Relaciones) ---

  @Post('cargo-procesos')
  @ApiOperation({ summary: 'Crear una nueva relación Cargo-Proceso' })
  @ApiResponse({ status: 201, description: 'Relación creada exitosamente.' })
  createCargoProceso(@Body() createDto: CreateCargoProcesoDto) {
    return this.service.createCargoProceso(createDto);
  }

  @Get('cargo-procesos')
  @ApiOperation({ summary: 'Listar todas las relaciones Cargo-Proceso' })
  findAllCargoProcesos() {
    return this.service.findAllCargoProcesos();
  }

  @Get('cargo-procesos/:id')
  @ApiOperation({ summary: 'Obtener una relación Cargo-Proceso por ID' })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  findOneCargoProceso(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneCargoProceso(id);
  }

  @Patch('cargo-procesos/:id')
  @ApiOperation({ summary: 'Actualizar una relación Cargo-Proceso por ID' })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  updateCargoProceso(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCargoProcesoDto,
  ) {
    return this.service.updateCargoProceso(id, updateDto);
  }

  @Delete('cargo-procesos/:id')
  @ApiOperation({
    summary: 'Eliminar una relación Cargo-Proceso (Borrado lógico)',
  })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  removeCargoProceso(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeCargoProceso(id);
  }
}
