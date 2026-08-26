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
import { RecursosService } from './recursos.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DenySoloConsultorGuard } from '../auth/guards/deny-solo-consultor.guard';
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

@ApiTags('Recursos, Riesgos y Controles')
@Controller('recursos')
export class RecursosController {
  constructor(private readonly service: RecursosService) {}

  // --- Requisitos ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('requisitos')
  @ApiOperation({ summary: 'Crear un nuevo requisito' })
  @ApiResponse({ status: 201, description: 'Requisito creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createRequisitos(@Body() createDto: CreateRequisitosDto, @Req() req: any) {
    return this.service.createRequisitos(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('requisitos')
  @ApiOperation({ summary: 'Listar todos los requisitos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de requisitos obtenida exitosamente.',
  })
  findAllRequisitos() {
    return this.service.findAllRequisitos();
  }

  @Get('requisitos/:id')
  @ApiOperation({ summary: 'Obtener un requisito por ID' })
  @ApiParam({ name: 'id', description: 'ID del requisito' })
  @ApiResponse({ status: 200, description: 'Requisito encontrado.' })
  @ApiResponse({ status: 404, description: 'Requisito no encontrado.' })
  findOneRequisitos(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneRequisitos(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('requisitos/:id')
  @ApiOperation({ summary: 'Actualizar un requisito por ID' })
  @ApiParam({ name: 'id', description: 'ID del requisito' })
  @ApiResponse({
    status: 200,
    description: 'Requisito actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Requisito no encontrado.' })
  updateRequisitos(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRequisitosDto,
    @Req() req: any,
  ) {
    return this.service.updateRequisitos(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('requisitos/:id')
  @ApiOperation({ summary: 'Eliminar un requisito (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del requisito' })
  @ApiResponse({
    status: 200,
    description: 'Requisito eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Requisito no encontrado.' })
  removeRequisitos(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeRequisitos(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Riesgos ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('riesgos')
  @ApiOperation({ summary: 'Crear un nuevo riesgo' })
  @ApiResponse({ status: 201, description: 'Riesgo creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createRiesgo(@Body() createDto: CreateRiesgoDto, @Req() req: any) {
    return this.service.createRiesgo(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('riesgos')
  @ApiOperation({ summary: 'Listar todos los riesgos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de riesgos obtenida exitosamente.',
  })
  findAllRiesgos() {
    return this.service.findAllRiesgos();
  }

  @Get('riesgos/:id')
  @ApiOperation({ summary: 'Obtener un riesgo por ID' })
  @ApiParam({ name: 'id', description: 'ID del riesgo' })
  @ApiResponse({ status: 200, description: 'Riesgo encontrado.' })
  @ApiResponse({ status: 404, description: 'Riesgo no encontrado.' })
  findOneRiesgo(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneRiesgo(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('riesgos/:id')
  @ApiOperation({ summary: 'Actualizar un riesgo por ID' })
  @ApiParam({ name: 'id', description: 'ID del riesgo' })
  @ApiResponse({ status: 200, description: 'Riesgo actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Riesgo no encontrado.' })
  updateRiesgo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRiesgoDto,
    @Req() req: any,
  ) {
    return this.service.updateRiesgo(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('riesgos/:id')
  @ApiOperation({ summary: 'Eliminar un riesgo (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del riesgo' })
  @ApiResponse({ status: 200, description: 'Riesgo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Riesgo no encontrado.' })
  removeRiesgo(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeRiesgo(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Controles ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('controles')
  @ApiOperation({ summary: 'Crear un nuevo control' })
  @ApiResponse({ status: 201, description: 'Control creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createControl(@Body() createDto: CreateControlDto, @Req() req: any) {
    return this.service.createControl(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('controles')
  @ApiOperation({ summary: 'Listar todos los controles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de controles obtenida exitosamente.',
  })
  findAllControles() {
    return this.service.findAllControles();
  }

  @Get('controles/:id')
  @ApiOperation({ summary: 'Obtener un control por ID' })
  @ApiParam({ name: 'id', description: 'ID del control' })
  @ApiResponse({ status: 200, description: 'Control encontrado.' })
  @ApiResponse({ status: 404, description: 'Control no encontrado.' })
  findOneControl(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneControl(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('controles/:id')
  @ApiOperation({ summary: 'Actualizar un control por ID' })
  @ApiParam({ name: 'id', description: 'ID del control' })
  @ApiResponse({
    status: 200,
    description: 'Control actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Control no encontrado.' })
  updateControl(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateControlDto,
    @Req() req: any,
  ) {
    return this.service.updateControl(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('controles/:id')
  @ApiOperation({ summary: 'Eliminar un control (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del control' })
  @ApiResponse({ status: 200, description: 'Control eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Control no encontrado.' })
  removeControl(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeControl(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Sistemas de Información ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('sistemas-informacion')
  @ApiOperation({ summary: 'Crear un nuevo sistema de información' })
  @ApiResponse({
    status: 201,
    description: 'Sistema de información creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createSistemaInformacion(
    @Body() createDto: CreateSistemaInformacionDto,
    @Req() req: any,
  ) {
    return this.service.createSistemaInformacion(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('sistemas-informacion')
  @ApiOperation({ summary: 'Listar todos los sistemas de información' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sistemas de información obtenida exitosamente.',
  })
  findAllSistemasInformacion() {
    return this.service.findAllSistemasInformacion();
  }

  @Get('sistemas-informacion/:id')
  @ApiOperation({ summary: 'Obtener un sistema de información por ID' })
  @ApiParam({ name: 'id', description: 'ID del sistema de información' })
  @ApiResponse({
    status: 200,
    description: 'Sistema de información encontrado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sistema de información no encontrado.',
  })
  findOneSistemaInformacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneSistemaInformacion(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('sistemas-informacion/:id')
  @ApiOperation({ summary: 'Actualizar un sistema de información por ID' })
  @ApiParam({ name: 'id', description: 'ID del sistema de información' })
  @ApiResponse({
    status: 200,
    description: 'Sistema de información actualizado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sistema de información no encontrado.',
  })
  updateSistemaInformacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSistemaInformacionDto,
    @Req() req: any,
  ) {
    return this.service.updateSistemaInformacion(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('sistemas-informacion/:id')
  @ApiOperation({
    summary: 'Eliminar un sistema de información (Borrado lógico)',
  })
  @ApiParam({ name: 'id', description: 'ID del sistema de información' })
  @ApiResponse({
    status: 200,
    description: 'Sistema de información eliminado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sistema de información no encontrado.',
  })
  removeSistemaInformacion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.service.removeSistemaInformacion(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Equipos ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('equipos')
  @ApiOperation({ summary: 'Crear un nuevo equipo' })
  @ApiResponse({ status: 201, description: 'Equipo creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createEquipo(@Body() createDto: CreateEquipoDto, @Req() req: any) {
    return this.service.createEquipo(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('equipos')
  @ApiOperation({ summary: 'Listar todos los equipos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipos obtenida exitosamente.',
  })
  findAllEquipos() {
    return this.service.findAllEquipos();
  }

  @Get('equipos/:id')
  @ApiOperation({ summary: 'Obtener un equipo por ID' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiResponse({ status: 200, description: 'Equipo encontrado.' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado.' })
  findOneEquipo(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneEquipo(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('equipos/:id')
  @ApiOperation({ summary: 'Actualizar un equipo por ID' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiResponse({ status: 200, description: 'Equipo actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado.' })
  updateEquipo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEquipoDto,
    @Req() req: any,
  ) {
    return this.service.updateEquipo(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('equipos/:id')
  @ApiOperation({ summary: 'Eliminar un equipo (Borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiResponse({ status: 200, description: 'Equipo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado.' })
  removeEquipo(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.removeEquipo(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  // --- Documentos de Referencia ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Post('documentos-referencia')
  @ApiOperation({ summary: 'Crear un nuevo documento de referencia' })
  @ApiResponse({
    status: 201,
    description: 'Documento de referencia creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createDocumentoReferencia(
    @Body() createDto: CreateDocumentoReferenciaDto,
    @Req() req: any,
  ) {
    return this.service.createDocumentoReferencia(
      createDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @Get('documentos-referencia')
  @ApiOperation({ summary: 'Listar todos los documentos de referencia' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos de referencia obtenida exitosamente.',
  })
  findAllDocumentosReferencia() {
    return this.service.findAllDocumentosReferencia();
  }

  @Get('documentos-referencia/:id')
  @ApiOperation({ summary: 'Obtener un documento de referencia por ID' })
  @ApiParam({ name: 'id', description: 'ID del documento de referencia' })
  @ApiResponse({
    status: 200,
    description: 'Documento de referencia encontrado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento de referencia no encontrado.',
  })
  findOneDocumentoReferencia(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneDocumentoReferencia(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Patch('documentos-referencia/:id')
  @ApiOperation({ summary: 'Actualizar un documento de referencia por ID' })
  @ApiParam({ name: 'id', description: 'ID del documento de referencia' })
  @ApiResponse({
    status: 200,
    description: 'Documento de referencia actualizado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento de referencia no encontrado.',
  })
  updateDocumentoReferencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDocumentoReferenciaDto,
    @Req() req: any,
  ) {
    return this.service.updateDocumentoReferencia(
      id,
      updateDto,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, DenySoloConsultorGuard)
  @Delete('documentos-referencia/:id')
  @ApiOperation({
    summary: 'Eliminar un documento de referencia (Borrado lógico)',
  })
  @ApiParam({ name: 'id', description: 'ID del documento de referencia' })
  @ApiResponse({
    status: 200,
    description: 'Documento de referencia eliminado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento de referencia no encontrado.',
  })
  removeDocumentoReferencia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.service.removeDocumentoReferencia(
      id,
      req.user?.userId ? Number(req.user.userId) : undefined,
    );
  }
}
