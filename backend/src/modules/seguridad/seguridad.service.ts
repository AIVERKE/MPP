import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UpdateUsuarioEstadoDto,
  UpdateUsuarioRolesDto,
} from './dto/usuario.dto';

@Injectable()
export class SeguridadService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  private sanitize(usuario: Usuario) {
    const { password: _password, ...rest } = usuario;
    return rest;
  }

  private async resolveRoles(roleIds: number[]): Promise<Rol[]> {
    const roles = await this.rolRepository.findBy({ id_rol: In(roleIds) });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException(
        'Uno o más roles indicados no existen',
      );
    }
    return roles;
  }

  async findAllUsuarios(incluirInactivos = false) {
    const usuarios = await this.usuarioRepository.find({
      relations: ['roles'],
      withDeleted: incluirInactivos,
      order: { id_usuario: 'ASC' },
    });
    return usuarios.map((u) => this.sanitize(u));
  }

  async findOneById(id: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['roles'],
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
      relations: ['roles'],
    });
  }

  findAllRoles() {
    return this.rolRepository.find({ order: { id_rol: 'ASC' } });
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
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const usuario = this.usuarioRepository.create({
      username: dto.username,
      correo: dto.correo,
      password: hashedPassword,
      activo: dto.activo ?? true,
      roles,
    });

    const saved = await this.usuarioRepository.save(usuario);
    return this.sanitize(saved);
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

    const saved = await this.usuarioRepository.save(usuario);
    return this.sanitize(saved);
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
    const saved = await this.usuarioRepository.save(usuario);
    return this.sanitize(saved);
  }

  async updateRoles(id: number, dto: UpdateUsuarioRolesDto) {
    const usuario = await this.findOneById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    usuario.roles = await this.resolveRoles(dto.roles);
    const saved = await this.usuarioRepository.save(usuario);
    return this.sanitize(saved);
  }
}
