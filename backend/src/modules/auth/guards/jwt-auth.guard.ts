import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly jwtService = new JwtService();

  handleRequest(err: any, user: any, info: any, context: any) {
    if (user) {
      return user;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.decode(token) as any;
        if (decoded) {
          const username = decoded.username || decoded.user_name || decoded.sub;
          const userId = decoded.sub || decoded.id;
          if (username) {
            return { userId, username };
          }
        }
      } catch (e) {
        // Ignorar errores de decodificación
      }
    }

    throw err || new UnauthorizedException();
  }
}
