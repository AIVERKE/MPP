import { Controller, Get } from '@nestjs/common';
import { SeguridadService } from './seguridad.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Seguridad')
@Controller('seguridad')
export class SeguridadController {
  constructor(private readonly seguridadService: SeguridadService) {}

  @Get('usuarios')
  findAllUsuarios() {
    return this.seguridadService.findAllUsuarios();
  }

  @Get('roles')
  findAllRoles() {
    return this.seguridadService.findAllRoles();
  }
}
