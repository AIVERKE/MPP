import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SeguridadService } from '../seguridad/seguridad.service';
import { Usuario } from '../seguridad/entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly seguridadService: SeguridadService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.seguridadService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: Usuario): { access_token: string; user: any } {
    const payload = { username: user.username, sub: user.id_usuario };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id_usuario,
        username: user.username,
        roles: user.roles,
      },
    };
  }
}
