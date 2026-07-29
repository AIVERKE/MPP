import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SeguridadService } from '../../seguridad/seguridad.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly seguridadService: SeguridadService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authUser = request.user;

    if (!authUser?.userId && !authUser?.username) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    let usuario = null;
    if (authUser.userId) {
      usuario = await this.seguridadService.findOneById(
        Number(authUser.userId),
      );
    }
    if (!usuario && authUser.username) {
      usuario = await this.seguridadService.findOneByUsername(
        authUser.username,
      );
    }

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const userRoleNames = (usuario.roles || []).map((r) => r.nombre);
    const hasRole = requiredRoles.some((role) =>
      userRoleNames.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        'No tiene permisos suficientes para esta operación',
      );
    }

    return true;
  }
}
