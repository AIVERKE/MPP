import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguridadService } from './seguridad.service';
import { SeguridadController } from './seguridad.controller';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  controllers: [SeguridadController],
  providers: [SeguridadService],
  exports: [SeguridadService],
})
export class SeguridadModule {}
