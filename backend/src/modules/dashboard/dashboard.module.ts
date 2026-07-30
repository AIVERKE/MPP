import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Proceso } from '../procesos/entities/proceso.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Usuario } from '../seguridad/entities/usuario.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proceso, Procedimiento, Usuario, Unidad]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
