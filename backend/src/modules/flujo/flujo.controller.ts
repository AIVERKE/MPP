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
import { FlujoService } from './flujo.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DenySoloConsultorGuard } from '../auth/guards/deny-solo-consultor.guard';
import { CreateAccionDto, UpdateAccionDto } from './dto/accion.dto';
import { AccionResponseDto } from './dto/accion-response.dto';
import { CreateFiguraDto, UpdateFiguraDto } from './dto/figura.dto';
import { FiguraResponseDto } from './dto/figura-response.dto';
import { CreateActividadDto, UpdateActividadDto } from './dto/actividad.dto';
import { CreateOperacionDto, UpdateOperacionDto } from './dto/operacion.dto';
import {
  CreateOperacionCargoDto,
  UpdateOperacionCargoDto,
} from './dto/operacion-cargo.dto';
import { CreateTareaDto, UpdateTareaDto } from './dto/tarea.dto';
import {
  CreateCondicionTareaDto,
  UpdateCondicionTareaDto,
} from './dto/condicion-tarea.dto';

@ApiTags('Flujo de Procedimientos')
@Controller('flujo')
export class FlujoController {
  constructor(private readonly service: FlujoService) {}

  // --- Operaciones ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('operaciones')
  @ApiOperation({ summary: 'Crear una nueva operación' })
  @ApiResponse({ status: 201, description: 'Operación creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createOperacion(@Body() createDto: CreateOperacionDto, @Req() req: any) {
    return this.service.createOperacion(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('operaciones')
  @ApiOperation({ summary: 'Listar operaciones (Consultor: solo de publicados)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de operaciones obtenida exitosamente.',
  })
  findAllOperaciones(
    @Req() req: any,
    @Query('id_procedimiento', new ParseIntPipe({ optional: true }))
    id_procedimiento?: number,
  ) {
    return this.service.findAllOperaciones(
      req.user?.userId ? Number(req.user.userId) : undefined,
      id_procedimiento,
    );
  }

  @Get('operaciones/:id')
  @ApiOperation({ summary: 'Obtener una operación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la operación' })
  @ApiResponse({ status: 200, description: 'Operación encontrada.' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada.' })
  findOneOperacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneOperacion(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('operaciones/:id')
  @ApiOperation({ summary: 'Actualizar una operación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la operación' })
  @ApiResponse({
    status: 200,
    description: 'Operación actualizada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Operación no encontrada.' })
  updateOperacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateOperacionDto,
    @Req() req: any,
  ) {
    return this.service.updateOperacion(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('operaciones/:id')
  @ApiOperation({ summary: 'Eliminar una operación (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la operación' })
  @ApiResponse({
    status: 200,
    description: 'Operación eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Operación no encontrada.' })
  removeOperacion(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeOperacion(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Actividades ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('actividades')
  @ApiOperation({ summary: 'Crear una nueva actividad' })
  @ApiResponse({ status: 201, description: 'Actividad creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createActividad(@Body() createDto: CreateActividadDto, @Req() req: any) {
    return this.service.createActividad(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('actividades')
  @ApiOperation({ summary: 'Listar todas las actividades' })
  @ApiResponse({
    status: 200,
    description: 'Lista de actividades obtenida exitosamente.',
  })
  findAllActividades() {
    return this.service.findAllActividades();
  }

  @Get('actividades/:id')
  @ApiOperation({ summary: 'Obtener una actividad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({ status: 200, description: 'Actividad encontrada.' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada.' })
  findOneActividad(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneActividad(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('actividades/:id')
  @ApiOperation({ summary: 'Actualizar una actividad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({
    status: 200,
    description: 'Actividad actualizada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada.' })
  updateActividad(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateActividadDto,
    @Req() req: any,
  ) {
    return this.service.updateActividad(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('actividades/:id')
  @ApiOperation({ summary: 'Eliminar una actividad (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la actividad' })
  @ApiResponse({
    status: 200,
    description: 'Actividad eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada.' })
  removeActividad(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeActividad(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Figuras ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('figuras')
  @ApiOperation({
    summary: 'Crear una nueva figura',
    description:
      'Registra una forma del catálogo de diagramas. El campo codigo es la clave estable que el frontend usa para renderizar (no depender del nombre de la acción).',
  })
  @ApiBody({ type: CreateFiguraDto })
  @ApiCreatedResponse({
    description: 'Figura creada exitosamente.',
    type: FiguraResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos o codigo duplicado.' })
  createFigura(@Body() createDto: CreateFiguraDto, @Req() req: any) {
    return this.service.createFigura(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('figuras')
  @ApiOperation({
    summary: 'Listar todas las figuras',
    description:
      'Catálogo completo de formas disponibles para asignar a acciones.',
  })
  @ApiOkResponse({
    description: 'Lista de figuras obtenida exitosamente.',
    type: FiguraResponseDto,
    isArray: true,
  })
  findAllFiguras() {
    return this.service.findAllFiguras();
  }

  @Get('figuras/:id')
  @ApiOperation({ summary: 'Obtener una figura por ID' })
  @ApiParam({ name: 'id', description: 'ID de la figura' })
  @ApiOkResponse({ description: 'Figura encontrada.', type: FiguraResponseDto })
  @ApiNotFoundResponse({ description: 'Figura no encontrada.' })
  findOneFigura(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneFigura(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('figuras/:id')
  @ApiOperation({ summary: 'Actualizar una figura por ID' })
  @ApiParam({ name: 'id', description: 'ID de la figura' })
  @ApiBody({ type: UpdateFiguraDto })
  @ApiOkResponse({
    description: 'Figura actualizada exitosamente.',
    type: FiguraResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Figura no encontrada.' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o codigo duplicado.' })
  updateFigura(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFiguraDto,
    @Req() req: any,
  ) {
    return this.service.updateFigura(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('figuras/:id')
  @ApiOperation({ summary: 'Eliminar una figura (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la figura' })
  @ApiNoContentResponse({ description: 'Figura eliminada exitosamente.' })
  @ApiNotFoundResponse({ description: 'Figura no encontrada.' })
  removeFigura(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeFigura(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Acciones ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('acciones')
  @ApiOperation({
    summary: 'Crear una nueva acción',
    description:
      'Crea un tipo de paso vinculado a una figura del catálogo (id_figura). La respuesta incluye el objeto figura anidado.',
  })
  @ApiBody({ type: CreateAccionDto })
  @ApiCreatedResponse({
    description: 'Acción creada exitosamente.',
    type: AccionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o figura referenciada no existe.',
  })
  createAccion(@Body() createDto: CreateAccionDto, @Req() req: any) {
    return this.service.createAccion(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('acciones')
  @ApiOperation({
    summary: 'Listar todas las acciones',
    description:
      'Cada acción incluye su figura (codigo, nombre) para renderizar el diagrama sin hardcodear por nombre_accion.',
  })
  @ApiOkResponse({
    description: 'Lista de acciones obtenida exitosamente.',
    type: AccionResponseDto,
    isArray: true,
  })
  findAllAcciones() {
    return this.service.findAllAcciones();
  }

  @Get('acciones/:id')
  @ApiOperation({ summary: 'Obtener una acción por ID' })
  @ApiParam({ name: 'id', description: 'ID de la acción' })
  @ApiOkResponse({ description: 'Acción encontrada.', type: AccionResponseDto })
  @ApiNotFoundResponse({ description: 'Acción no encontrada.' })
  findOneAccion(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneAccion(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('acciones/:id')
  @ApiOperation({ summary: 'Actualizar una acción por ID' })
  @ApiParam({ name: 'id', description: 'ID de la acción' })
  @ApiBody({ type: UpdateAccionDto })
  @ApiOkResponse({
    description: 'Acción actualizada exitosamente.',
    type: AccionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Acción no encontrada.' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o figura referenciada no existe.',
  })
  updateAccion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAccionDto,
    @Req() req: any,
  ) {
    return this.service.updateAccion(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('acciones/:id')
  @ApiOperation({ summary: 'Eliminar una acción (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la acción' })
  @ApiNoContentResponse({ description: 'Acción eliminada exitosamente.' })
  @ApiNotFoundResponse({ description: 'Acción no encontrada.' })
  removeAccion(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeAccion(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Operación-Cargo ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('operacion-cargos')
  @ApiOperation({ summary: 'Crear una nueva relación Operación-Cargo' })
  @ApiResponse({ status: 201, description: 'Relación creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createOperacionCargo(
    @Body() createDto: CreateOperacionCargoDto,
    @Req() req: any,
  ) {
    return this.service.createOperacionCargo(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('operacion-cargos')
  @ApiOperation({ summary: 'Listar todas las relaciones Operación-Cargo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de relaciones obtenida exitosamente.',
  })
  findAllOperacionCargos() {
    return this.service.findAllOperacionCargos();
  }

  @Get('operacion-cargos/:id')
  @ApiOperation({ summary: 'Obtener una relación Operación-Cargo por ID' })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  @ApiResponse({ status: 200, description: 'Relación encontrada.' })
  @ApiResponse({ status: 404, description: 'Relación no encontrada.' })
  findOneOperacionCargo(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneOperacionCargo(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('operacion-cargos/:id')
  @ApiOperation({ summary: 'Actualizar una relación Operación-Cargo por ID' })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  @ApiResponse({
    status: 200,
    description: 'Relación actualizada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Relación no encontrada.' })
  updateOperacionCargo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateOperacionCargoDto,
    @Req() req: any,
  ) {
    return this.service.updateOperacionCargo(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('operacion-cargos/:id')
  @ApiOperation({
    summary: 'Eliminar una relación Operación-Cargo (Borrado lógico)',
  })
  @ApiParam({ name: 'id', description: 'ID de la relación' })
  @ApiResponse({ status: 200, description: 'Relación eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Relación no encontrada.' })
  removeOperacionCargo(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeOperacionCargo(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Tareas ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('tareas')
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createTarea(@Body() createDto: CreateTareaDto, @Req() req: any) {
    return this.service.createTarea(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('tareas')
  @ApiOperation({ summary: 'Listar todas las tareas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tareas obtenida exitosamente.',
  })
  findAllTareas() {
    return this.service.findAllTareas();
  }

  @Get('tareas/:id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea encontrada.' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada.' })
  findOneTarea(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneTarea(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('tareas/:id')
  @ApiOperation({ summary: 'Actualizar una tarea por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada.' })
  updateTarea(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTareaDto,
    @Req() req: any,
  ) {
    return this.service.updateTarea(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('tareas/:id')
  @ApiOperation({ summary: 'Eliminar una tarea (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada.' })
  removeTarea(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeTarea(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Condiciones de Tarea ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('condiciones')
  @ApiOperation({ summary: 'Crear una condición IF/ELSE para una tarea' })
  @ApiResponse({ status: 201, description: 'Condición creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createCondicion(
    @Body() createDto: CreateCondicionTareaDto,
    @Req() req: any,
  ) {
    return this.service.createCondicion(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('condiciones/tarea/:idTarea')
  @ApiOperation({
    summary: 'Listar condiciones asociadas a una tarea',
  })
  @ApiParam({ name: 'idTarea', description: 'ID de la tarea' })
  @ApiResponse({
    status: 200,
    description: 'Lista de condiciones obtenida exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Tarea no encontrada.' })
  findCondicionesByTarea(@Param('idTarea', ParseIntPipe) idTarea: number) {
    return this.service.findCondicionesByTarea(idTarea);
  }

  @Get('condiciones/:id')
  @ApiOperation({ summary: 'Obtener una condición por ID' })
  @ApiParam({ name: 'id', description: 'ID de la condición' })
  @ApiResponse({ status: 200, description: 'Condición encontrada.' })
  @ApiResponse({ status: 404, description: 'Condición no encontrada.' })
  findOneCondicion(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneCondicion(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('condiciones/:id')
  @ApiOperation({ summary: 'Actualizar una condición por ID' })
  @ApiParam({ name: 'id', description: 'ID de la condición' })
  @ApiResponse({
    status: 200,
    description: 'Condición actualizada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Condición no encontrada.' })
  updateCondicion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCondicionTareaDto,
    @Req() req: any,
  ) {
    return this.service.updateCondicion(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('condiciones/:id')
  @ApiOperation({ summary: 'Eliminar una condición (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID de la condición' })
  @ApiResponse({
    status: 200,
    description: 'Condición eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Condición no encontrada.' })
  removeCondicion(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeCondicion(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }
}
