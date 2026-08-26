import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ProcesosService } from './procesos.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DenySoloConsultorGuard } from '../auth/guards/deny-solo-consultor.guard';
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('procesos')
  @ApiOperation({ summary: 'Crear un nuevo proceso' })
  @ApiResponse({ status: 201, description: 'Proceso creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createProceso(@Body() createDto: CreateProcesoDto, @Req() req: any) {
    return this.service.createProceso(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
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
    @Req() req: any,
  ) {
    return this.service.updateProceso(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('procesos/:id')
  @ApiOperation({ summary: 'Eliminar un proceso (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del proceso' })
  @ApiResponse({ status: 200, description: 'Proceso eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Proceso no encontrado.' })
  removeProceso(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeProceso(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Procedimientos ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('procedimientos')
  @ApiOperation({ summary: 'Crear un nuevo procedimiento' })
  @ApiResponse({
    status: 201,
    description: 'Procedimiento creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createProcedimiento(
    @Body() createDto: CreateProcedimientoDto,
    @Req() req: any,
  ) {
    return this.service.createProcedimiento(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('procedimientos')
  @ApiOperation({ summary: 'Listar procedimientos (Consultor: solo publicados)' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'id_unidad', required: false, type: Number })
  @ApiQuery({ name: 'tipo_proceso', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de procedimientos obtenida exitosamente.',
  })
  findAllProcedimientos(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('id_unidad', new ParseIntPipe({ optional: true })) id_unidad?: number,
    @Query('tipo_proceso') tipo_proceso?: string,
  ) {
    return this.service.findAllProcedimientos(
      req.user?.userId ? Number(req.user.userId) : undefined,
      { q, id_unidad, tipo_proceso },
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('procedimientos/:id/versiones')
  @ApiOperation({ summary: 'Obtener historial de versiones de un procedimiento' })
  @ApiParam({ name: 'id', description: 'ID del procedimiento' })
  @ApiResponse({
    status: 200,
    description: 'Historial de versiones del procedimiento.',
  })
  @ApiResponse({ status: 404, description: 'Procedimiento no encontrado.' })
  findHistorialVersionesProcedimiento(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.service.findHistorialVersionesProcedimiento(
      id,
      { page, limit },
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('procedimientos/:id')
  @ApiOperation({ summary: 'Obtener un procedimiento por ID' })
  @ApiParam({ name: 'id', description: 'ID del procedimiento' })
  @ApiResponse({ status: 200, description: 'Procedimiento encontrado.' })
  @ApiResponse({ status: 404, description: 'Procedimiento no encontrado.' })
  findOneProcedimiento(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.findOneProcedimiento(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
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
    @Req() req: any,
  ) {
    return this.service.updateProcedimiento(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('procedimientos/:id')
  @ApiOperation({ summary: 'Eliminar un procedimiento (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del procedimiento' })
  @ApiResponse({
    status: 200,
    description: 'Procedimiento eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Procedimiento no encontrado.' })
  removeProcedimiento(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeProcedimiento(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- CargoProcesos (Relaciones) ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('cargo-procesos')
  @ApiOperation({ summary: 'Crear una nueva relación Cargo-Proceso' })
  @ApiResponse({ status: 201, description: 'Relación creada exitosamente.' })
  createCargoProceso(
    @Body() createDto: CreateCargoProcesoDto,
    @Req() req: any,
  ) {
    return this.service.createCargoProceso(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('cargo-procesos/:id')
  @ApiOperation({ summary: 'Actualizar una relación Cargo-Proceso por ID' })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  updateCargoProceso(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCargoProcesoDto,
    @Req() req: any,
  ) {
    return this.service.updateCargoProceso(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('cargo-procesos/:id')
  @ApiOperation({
    summary: 'Eliminar una relación Cargo-Proceso (Borrado lógico)',
  })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  removeCargoProceso(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeCargoProceso(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }
}
