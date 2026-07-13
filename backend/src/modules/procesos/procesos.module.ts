import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcesosService } from './procesos.service';
import { ProcesosController } from './procesos.controller';
import { Proceso } from './entities/proceso.entity';
import { Procedimiento } from './entities/procedimiento.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { CargoProceso } from './entities/cargo-proceso.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { VersionesModule } from '../versiones/versiones.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proceso,
      Procedimiento,
      CargoProceso,
      Unidad,
      Cargo,
    ]),
    VersionesModule,
    AuthModule,
  ],
  controllers: [ProcesosController],
  providers: [ProcesosService],
  exports: [ProcesosService],
})
export class ProcesosModule {}
