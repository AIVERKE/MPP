import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';

@Injectable()
export class SeguridadService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  findAllUsuarios() {
    return this.usuarioRepository.find({ relations: ['roles'] });
  }

  async findOneByUsername(username: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  findAllRoles() {
    return this.rolRepository.find();
  }
}
