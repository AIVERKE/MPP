import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SeguridadService } from '../../seguridad/seguridad.service';

/**
 * Rechaza mutaciones cuando el usuario autenticado es solo-Consultor.
 * Usar junto con JwtAuthGuard (debe ejecutarse antes).
 */
@Injectable()
export class DenySoloConsultorGuard implements CanActivate {
  constructor(private readonly seguridadService: SeguridadService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId
      ? Number(request.user.userId)
      : undefined;
    if (!userId) {
      return true;
    }
    const roleNames = await this.seguridadService.getNombresRoles(userId);
    if (this.seguridadService.esSoloConsultor(roleNames)) {
      throw new ForbiddenException(
        'El rol Consultor es de solo lectura; no puede crear, modificar ni eliminar recursos',
      );
    }
    return true;
  }
}
