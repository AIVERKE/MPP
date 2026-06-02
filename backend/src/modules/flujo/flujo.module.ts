import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlujoService } from './flujo.service';
import { FlujoController } from './flujo.controller';
import { Operacion } from './entities/operacion.entity';
import { OperacionCargo } from './entities/operacion-cargo.entity';
import { Actividad } from './entities/actividad.entity';
import { Accion } from './entities/accion.entity';
import { Figura } from './entities/figura.entity';
import { Tarea } from './entities/tarea.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Operacion,
      OperacionCargo,
      Actividad,
      Accion,
      Figura,
      Tarea,
      Procedimiento,
      Cargo,
    ]),
  ],
  controllers: [FlujoController],
  providers: [FlujoService],
  exports: [FlujoService],
})
export class FlujoModule {}
