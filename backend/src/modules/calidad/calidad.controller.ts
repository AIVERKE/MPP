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
} from '@nestjs/common';
import { CalidadService } from './calidad.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateNormativaDto, UpdateNormativaDto } from './dto/normativa.dto';
import { CreateIndicadorDto, UpdateIndicadorDto } from './dto/indicador.dto';
import { Normativa } from './entities/normativa.entity';
import { Indicador } from './entities/indicador.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DenySoloConsultorGuard } from '../auth/guards/deny-solo-consultor.guard';

@ApiTags('Marco Normativo y Calidad')
@Controller('calidad')
export class CalidadController {
  constructor(private readonly service: CalidadService) {}

  // ============================
  // NORMATIVAS
  // ============================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('normativas')
  @ApiOperation({ summary: 'Crear una nueva normativa' })
  @ApiResponse({
    status: 201,
    description: 'La normativa ha sido creada exitosamente.',
    type: Normativa,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'Conflicto de duplicidad.' })
  createNormativa(@Body() createDto: CreateNormativaDto, @Req() req: any) {
    return this.service.createNormativa(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
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
    @Req() req: any,
  ) {
    return this.service.updateNormativa(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('normativas/:id')
  @ApiOperation({ summary: 'Eliminar (soft delete) una normativa por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la normativa' })
  @ApiResponse({
    status: 200,
    description: 'Normativa eliminada exitosamente.',
    type: Normativa,
  })
  @ApiResponse({ status: 404, description: 'Normativa no encontrada.' })
  removeNormativa(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeNormativa(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // ============================
  // INDICADORES
  // ============================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('indicadores')
  @ApiOperation({ summary: 'Crear un nuevo indicador' })
  @ApiResponse({
    status: 201,
    description: 'El indicador ha sido creado exitosamente.',
    type: Indicador,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'Conflicto de duplicidad.' })
  createIndicador(@Body() createDto: CreateIndicadorDto, @Req() req: any) {
    return this.service.createIndicador(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
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
    @Req() req: any,
  ) {
    return this.service.updateIndicador(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('indicadores/:id')
  @ApiOperation({ summary: 'Eliminar (soft delete) un indicador por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del indicador' })
  @ApiResponse({
    status: 200,
    description: 'Indicador eliminado exitosamente.',
    type: Indicador,
  })
  @ApiResponse({ status: 404, description: 'Indicador no encontrado.' })
  removeIndicador(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeIndicador(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }
}
