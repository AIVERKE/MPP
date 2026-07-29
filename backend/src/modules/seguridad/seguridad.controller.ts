import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SeguridadService } from './seguridad.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UpdateUsuarioEstadoDto,
  UpdateUsuarioRolesDto,
} from './dto/usuario.dto';

@ApiTags('Seguridad')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
@Controller('seguridad')
export class SeguridadController {
  constructor(private readonly seguridadService: SeguridadService) {}

  @Get('usuarios')
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'Por defecto excluye usuarios con soft delete. Usar incluirInactivos=true para incluirlos.',
  })
  @ApiQuery({
    name: 'incluirInactivos',
    required: false,
    type: Boolean,
    description: 'Si es true, incluye usuarios soft-deleted',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de Administrador.' })
  findAllUsuarios(@Query('incluirInactivos') incluirInactivos?: string) {
    const include =
      incluirInactivos === 'true' || incluirInactivos === '1';
    return this.seguridadService.findAllUsuarios(include);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles del sistema' })
  @ApiResponse({ status: 200, description: 'Lista de roles obtenida.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de Administrador.' })
  findAllRoles() {
    return this.seguridadService.findAllRoles();
  }

  @Post('usuarios')
  @ApiOperation({ summary: 'Crear un nuevo usuario con roles' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o duplicados.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de Administrador.' })
  createUsuario(@Body() dto: CreateUsuarioDto) {
    return this.seguridadService.createUsuario(dto);
  }

  @Put('usuarios/:id')
  @ApiOperation({ summary: 'Actualizar datos de un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de Administrador.' })
  updateUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.seguridadService.updateUsuario(id, dto);
  }

  @Delete('usuarios/:id')
  @ApiOperation({
    summary: 'Eliminar usuario (soft delete)',
    description: 'Setea deletedAt; no elimina el registro físicamente.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario dado de baja.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de Administrador.' })
  async removeUsuario(@Param('id', ParseIntPipe) id: number) {
    await this.seguridadService.removeUsuario(id);
    return { message: 'Usuario eliminado (soft delete)' };
  }

  @Patch('usuarios/:id/estado')
  @ApiOperation({ summary: 'Cambiar estado activo/inactivo del usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Estado actualizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de Administrador.' })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioEstadoDto,
  ) {
    return this.seguridadService.updateEstado(id, dto);
  }

  @Put('usuarios/:id/roles')
  @ApiOperation({
    summary: 'Actualizar roles del usuario',
    description: 'Reemplaza la relación ManyToMany completa con los id_rol indicados.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Roles actualizados.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de Administrador.' })
  updateRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioRolesDto,
  ) {
    return this.seguridadService.updateRoles(id, dto);
  }
}
