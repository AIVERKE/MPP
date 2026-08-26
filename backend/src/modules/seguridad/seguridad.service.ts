import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { UsuarioRolUnidad } from './entities/usuario-rol-unidad.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import {
  AlcanceUnidadDto,
  CreateUsuarioDto,
  UpdateUsuarioAlcancesDto,
  UpdateUsuarioDto,
  UpdateUsuarioEstadoDto,
  UpdateUsuarioRolesDto,
} from './dto/usuario.dto';
import {
  ROLES_ALCANCE_OBLIGATORIO,
  ROLES_CON_ALCANCE_UNIDAD,
  ROLES_MPP,
  RolMppNombre,
} from './roles.constants';

@Injectable()
export class SeguridadService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(UsuarioRolUnidad)
    private readonly alcanceRepository: Repository<UsuarioRolUnidad>,
    @InjectRepository(Unidad)
    private readonly unidadRepository: Repository<Unidad>,
  ) {}

  private sanitize(usuario: Usuario) {
    const { password: _password, ...rest } = usuario;
    return rest;
  }

  private async resolveRoles(roleIds: number[]): Promise<Rol[]> {
    const uniqueIds = [...new Set(roleIds)];
    const roles = await this.rolRepository.findBy({ id_rol: In(uniqueIds) });
    if (roles.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Uno o más roles indicados no existen',
      );
    }
    return roles;
  }

  private async validateAndBuildAlcances(
    alcances: AlcanceUnidadDto[] | undefined,
    roles: Rol[],
  ): Promise<UsuarioRolUnidad[]> {
    const roleIds = new Set(roles.map((r) => r.id_rol));
    const rolesById = new Map(roles.map((r) => [r.id_rol, r]));

    const obligatorios = roles.filter((r) =>
      (ROLES_ALCANCE_OBLIGATORIO as readonly string[]).includes(r.nombre),
    );

    const items = alcances ?? [];

    for (const a of items) {
      if (!roleIds.has(a.id_rol)) {
        throw new BadRequestException(
          `El alcance referencia un rol (${a.id_rol}) no asignado al usuario`,
        );
      }
      const rol = rolesById.get(a.id_rol);
      if (
        rol &&
        !(ROLES_CON_ALCANCE_UNIDAD as readonly string[]).includes(rol.nombre)
      ) {
        throw new BadRequestException(
          `El rol "${rol.nombre}" no admite alcance por unidad`,
        );
      }
    }

    if (items.length > 0) {
      const unidadIds = [...new Set(items.map((a) => a.id_unidad))];
      const unidades = await this.unidadRepository.findBy({
        id_unidad: In(unidadIds),
      });
      if (unidades.length !== unidadIds.length) {
        throw new BadRequestException(
          'Una o más unidades de alcance no existen',
        );
      }
    }

    for (const rol of obligatorios) {
      const tiene = items.some((a) => a.id_rol === rol.id_rol);
      if (!tiene) {
        throw new BadRequestException(
          `El rol "${rol.nombre}" requiere al menos una unidad autorizada`,
        );
      }
    }

    // Deduplicar
    const seen = new Set<string>();
    const result: UsuarioRolUnidad[] = [];
    for (const a of items) {
      const key = `${a.id_rol}:${a.id_unidad}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(
        this.alcanceRepository.create({
          id_rol: a.id_rol,
          id_unidad: a.id_unidad,
        }),
      );
    }
    return result;
  }

  private usuarioRelations() {
    return {
      relations: [
        'roles',
        'alcances',
        'alcances.rol',
        'alcances.unidad',
      ],
    };
  }

  async findAllUsuarios(incluirInactivos = false) {
    const usuarios = await this.usuarioRepository.find({
      ...this.usuarioRelations(),
      withDeleted: incluirInactivos,
      order: { id_usuario: 'ASC' },
    });
    return usuarios.map((u) => this.sanitize(u));
  }

  async findOneById(id: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { id_usuario: id },
      ...this.usuarioRelations(),
    });
  }

  async findOneUsuario(id: number) {
    const usuario = await this.findOneById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return this.sanitize(usuario);
  }

  async findOneByUsername(username: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { username },
      relations: ['roles', 'alcances', 'alcances.rol', 'alcances.unidad'],
    });
  }

  findAllRoles() {
    return this.rolRepository.find({ order: { id_rol: 'ASC' } });
  }

  /**
   * IDs de unidades autorizadas para un usuario y nombre de rol.
   */
  async getUnidadesAlcance(
    idUsuario: number,
    nombreRol: RolMppNombre,
  ): Promise<number[]> {
    const alcances = await this.alcanceRepository.find({
      where: {
        id_usuario: idUsuario,
        rol: { nombre: nombreRol },
      },
      relations: ['rol'],
    });
    return alcances.map((a) => a.id_unidad);
  }

  async usuarioTieneRol(
    idUsuario: number,
    nombreRol: RolMppNombre,
  ): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: idUsuario },
      relations: ['roles'],
    });
    return (usuario?.roles || []).some((r) => r.nombre === nombreRol);
  }

  async getNombresRoles(idUsuario: number): Promise<string[]> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: idUsuario },
      relations: ['roles'],
    });
    return (usuario?.roles || []).map((r) => r.nombre);
  }

  esSuperAdmin(roleNames: string[]): boolean {
    return roleNames.includes(ROLES_MPP.SUPER_ADMIN);
  }

  /** Solo Consultor (sin roles de escritura/validación/admin). */
  esSoloConsultor(roleNames: string[]): boolean {
    if (roleNames.length === 0) return false;
    const operativosEscritura = new Set<string>([
      ROLES_MPP.ELABORADOR,
      ROLES_MPP.VALIDADOR_PLANIFICACION,
      ROLES_MPP.VALIDADOR_TECNICO,
      ROLES_MPP.SUPER_ADMIN,
    ]);
    return (
      roleNames.includes(ROLES_MPP.CONSULTOR) &&
      !roleNames.some((r) => operativosEscritura.has(r))
    );
  }

  async assertNoSoloConsultor(idUsuario?: number): Promise<void> {
    if (!idUsuario) return;
    const roleNames = await this.getNombresRoles(idUsuario);
    if (this.esSoloConsultor(roleNames)) {
      throw new ForbiddenException(
        'El rol Consultor es de solo lectura; no puede crear, modificar ni eliminar recursos',
      );
    }
  }

  async esUsuarioSoloConsultor(idUsuario?: number): Promise<boolean> {
    if (!idUsuario) return false;
    const roleNames = await this.getNombresRoles(idUsuario);
    return this.esSoloConsultor(roleNames);
  }

  async createUsuario(dto: CreateUsuarioDto) {
    const existingUsername = await this.usuarioRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('El username ya está en uso');
    }

    const existingCorreo = await this.usuarioRepository.findOne({
      where: { correo: dto.correo },
    });
    if (existingCorreo) {
      throw new BadRequestException('El correo ya está en uso');
    }

    const roles = await this.resolveRoles(dto.roles);
    const alcances = await this.validateAndBuildAlcances(dto.alcances, roles);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const usuario = this.usuarioRepository.create({
      username: dto.username,
      correo: dto.correo,
      password: hashedPassword,
      activo: dto.activo ?? true,
      roles,
      alcances,
    });

    const saved = await this.usuarioRepository.save(usuario);
    return this.findOneUsuario(saved.id_usuario);
  }

  async updateUsuario(id: number, dto: UpdateUsuarioDto) {
    const usuario = await this.findOneById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    if (dto.username && dto.username !== usuario.username) {
      const existing = await this.usuarioRepository.findOne({
        where: { username: dto.username },
      });
      if (existing) {
        throw new BadRequestException('El username ya está en uso');
      }
      usuario.username = dto.username;
    }

    if (dto.correo && dto.correo !== usuario.correo) {
      const existing = await this.usuarioRepository.findOne({
        where: { correo: dto.correo },
      });
      if (existing) {
        throw new BadRequestException('El correo ya está en uso');
      }
      usuario.correo = dto.correo;
    }

    if (dto.password) {
      usuario.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.activo !== undefined) {
      usuario.activo = dto.activo;
    }

    if (dto.roles) {
      usuario.roles = await this.resolveRoles(dto.roles);
    }

    if (dto.alcances !== undefined || dto.roles) {
      const rolesActuales = usuario.roles;
      const alcancesDto =
        dto.alcances !== undefined
          ? dto.alcances
          : (usuario.alcances || []).map((a) => ({
              id_rol: a.id_rol,
              id_unidad: a.id_unidad,
            }));
      // Filtrar alcances de roles que ya no tiene
      const roleIds = new Set(rolesActuales.map((r) => r.id_rol));
      const filtrados = alcancesDto.filter((a) => roleIds.has(a.id_rol));
      await this.alcanceRepository.delete({ id_usuario: id });
      usuario.alcances = await this.validateAndBuildAlcances(
        filtrados,
        rolesActuales,
      );
    }

    await this.usuarioRepository.save(usuario);
    return this.findOneUsuario(id);
  }

  async removeUsuario(id: number): Promise<void> {
    const usuario = await this.findOneById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    await this.usuarioRepository.softDelete({ id_usuario: id });
  }

  async updateEstado(id: number, dto: UpdateUsuarioEstadoDto) {
    const usuario = await this.findOneById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    usuario.activo = dto.activo;
    await this.usuarioRepository.save(usuario);
    return this.findOneUsuario(id);
  }

  async updateRoles(id: number, dto: UpdateUsuarioRolesDto) {
    const usuario = await this.findOneById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    usuario.roles = await this.resolveRoles(dto.roles);
    // Limpiar alcances de roles removidos y validar obligatorios
    const roleIds = new Set(usuario.roles.map((r) => r.id_rol));
    const alcancesFiltrados = (usuario.alcances || [])
      .filter((a) => roleIds.has(a.id_rol))
      .map((a) => ({ id_rol: a.id_rol, id_unidad: a.id_unidad }));
    await this.alcanceRepository.delete({ id_usuario: id });
    usuario.alcances = await this.validateAndBuildAlcances(
      alcancesFiltrados,
      usuario.roles,
    );
    await this.usuarioRepository.save(usuario);
    return this.findOneUsuario(id);
  }

  async updateAlcances(id: number, dto: UpdateUsuarioAlcancesDto) {
    const usuario = await this.findOneById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    await this.alcanceRepository.delete({ id_usuario: id });
    usuario.alcances = await this.validateAndBuildAlcances(
      dto.alcances,
      usuario.roles || [],
    );
    await this.usuarioRepository.save(usuario);
    return this.findOneUsuario(id);
  }
}
