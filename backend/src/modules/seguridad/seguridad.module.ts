import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguridadService } from './seguridad.service';
import { SeguridadController } from './seguridad.controller';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  controllers: [SeguridadController],
  providers: [SeguridadService, RolesGuard],
  exports: [SeguridadService],
})
export class SeguridadModule {}
