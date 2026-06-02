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
import { EstructuraOrganizacionalService } from './estructura-organizacional.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateCargoDto, UpdateCargoDto } from './dto/cargo.dto';
import { CreateUnidadDto, UpdateUnidadDto } from './dto/unidad.dto';
import {
  CreateInstalacionDto,
  UpdateInstalacionDto,
} from './dto/instalacion.dto';

@ApiTags('Estructura Organizacional')
@Controller('estructura-organizacional')
export class EstructuraOrganizacionalController {
  constructor(private readonly service: EstructuraOrganizacionalService) {}

  // --- Cargos ---

  @Post('cargos')
  @ApiOperation({
    summary: 'Crear un nuevo cargo',
    description:
      '⚠️ Los cargos son gestionados por el sistema MOF externo. ' +
      'Este endpoint requiere que el ID del cargo sea provisto por el MOF. ' +
      'Para sincronizar cargos desde el MOF, utilizá POST /mof/cargos/sync.',
  })
  @ApiResponse({ status: 201, description: 'Cargo creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({
    status: 422,
    description:
      'No es posible crear el cargo. Los IDs de cargo son asignados por el sistema MOF externo. ' +
      'Utilizá POST /mof/cargos/sync para importar cargos.',
  })
  createCargo(@Body() createCargoDto: CreateCargoDto) {
    return this.service.createCargo(createCargoDto);
  }

  @Get('cargos')
  @ApiOperation({ summary: 'Listar todos los cargos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos obtenida exitosamente.',
  })
  findAllCargos() {
    return this.service.findAllCargos();
  }

  @Get('cargos/:id')
  @ApiOperation({ summary: 'Obtener un cargo por ID' })
  @ApiParam({ name: 'id', description: 'ID del cargo' })
  @ApiResponse({ status: 200, description: 'Cargo encontrado.' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado.' })
  findOneCargo(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneCargo(id);
  }

  @Patch('cargos/:id')
  @ApiOperation({ summary: 'Actualizar un cargo por ID' })
  @ApiParam({ name: 'id', description: 'ID del cargo' })
  @ApiResponse({ status: 200, description: 'Cargo actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado.' })
  updateCargo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCargoDto: UpdateCargoDto,
  ) {
    return this.service.updateCargo(id, updateCargoDto);
  }

  @Delete('cargos/:id')
  @ApiOperation({ summary: 'Eliminar un cargo (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del cargo' })
  @ApiResponse({ status: 200, description: 'Cargo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado.' })
  removeCargo(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeCargo(id);
  }

  // --- Unidades ---

  @Post('unidades')
  @ApiOperation({ summary: 'Crear una nueva unidad' })
  @ApiResponse({ status: 201, description: 'Unidad creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createUnidad(@Body() createUnidadDto: CreateUnidadDto) {
    return this.service.createUnidad(createUnidadDto);
  }

  @Get('unidades')
  @ApiOperation({ summary: 'Listar todas las unidades' })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades obtenida exitosamente.',
  })
  findAllUnidades() {
    return this.service.findAllUnidades();
  }

  @Get('unidades/:id')
  @ApiOperation({ summary: 'Obtener una unidad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la unidad' })
  @ApiResponse({ status: 200, description: 'Unidad encontrada.' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada.' })
  findOneUnidad(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneUnidad(id);
  }

  @Patch('unidades/:id')
  @ApiOperation({ summary: 'Actualizar una unidad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la unidad' })
  @ApiResponse({ status: 200, description: 'Unidad actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada.' })
  updateUnidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnidadDto: UpdateUnidadDto,
  ) {
    return this.service.updateUnidad(id, updateUnidadDto);
  }

  @Delete('unidades/:id')
  @ApiOperation({ summary: 'Eliminar una unidad (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la unidad' })
  @ApiResponse({ status: 200, description: 'Unidad eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada.' })
  removeUnidad(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeUnidad(id);
  }

  // --- Instalaciones ---

  @Post('instalaciones')
  @ApiOperation({ summary: 'Crear una nueva instalación' })
  @ApiResponse({
    status: 201,
    description: 'Instalación creada exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o unidad no encontrada.',
  })
  createInstalacion(@Body() createInstalacionDto: CreateInstalacionDto) {
    return this.service.createInstalacion(createInstalacionDto);
  }

  @Get('instalaciones')
  @ApiOperation({ summary: 'Listar todas las instalaciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de instalaciones obtenida exitosamente.',
  })
  findAllInstalaciones() {
    return this.service.findAllInstalaciones();
  }

  @Get('instalaciones/:id')
  @ApiOperation({ summary: 'Obtener una instalación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la instalación' })
  @ApiResponse({ status: 200, description: 'Instalación encontrada.' })
  @ApiResponse({ status: 404, description: 'Instalación no encontrada.' })
  findOneInstalacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneInstalacion(id);
  }

  @Patch('instalaciones/:id')
  @ApiOperation({ summary: 'Actualizar una instalación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la instalación' })
  @ApiResponse({
    status: 200,
    description: 'Instalación actualizada exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o unidad no encontrada.',
  })
  @ApiResponse({ status: 404, description: 'Instalación no encontrada.' })
  updateInstalacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstalacionDto: UpdateInstalacionDto,
  ) {
    return this.service.updateInstalacion(id, updateInstalacionDto);
  }

  @Delete('instalaciones/:id')
  @ApiOperation({ summary: 'Eliminar una instalación (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la instalación' })
  @ApiResponse({
    status: 200,
    description: 'Instalación eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Instalación no encontrada.' })
  removeInstalacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeInstalacion(id);
  }
}
