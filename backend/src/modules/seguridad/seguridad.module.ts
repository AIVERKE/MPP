import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguridadService } from './seguridad.service';
import { SeguridadController } from './seguridad.controller';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { UsuarioRolUnidad } from './entities/usuario-rol-unidad.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DenySoloConsultorGuard } from '../auth/guards/deny-solo-consultor.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol, UsuarioRolUnidad, Unidad]),
  ],
  controllers: [SeguridadController],
  providers: [SeguridadService, RolesGuard, DenySoloConsultorGuard],
  exports: [SeguridadService, DenySoloConsultorGuard],
})
export class SeguridadModule {}
