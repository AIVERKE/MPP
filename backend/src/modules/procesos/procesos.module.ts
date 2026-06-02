import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcesosService } from './procesos.service';
import { ProcesosController } from './procesos.controller';
import { Proceso } from './entities/proceso.entity';
import { Procedimiento } from './entities/procedimiento.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { CargoProceso } from './entities/cargo-proceso.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proceso,
      Procedimiento,
      CargoProceso,
      Unidad,
      Cargo,
    ]),
  ],
  controllers: [ProcesosController],
  providers: [ProcesosService],
  exports: [ProcesosService],
})
export class ProcesosModule {}
