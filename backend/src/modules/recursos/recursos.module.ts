import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecursosService } from './recursos.service';
import { RecursosController } from './recursos.controller';
import { Requisitos } from './entities/requisitos.entity';
import { Riesgo } from './entities/riesgo.entity';
import { Control } from './entities/control.entity';
import { DocumentoReferencia } from './entities/documento-referencia.entity';
import { Equipo } from './entities/equipo.entity';
import { SistemaInformacion } from './entities/sistema-informacion.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Operacion } from '../flujo/entities/operacion.entity';
import { VersionesModule } from '../versiones/versiones.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requisitos,
      Riesgo,
      Control,
      DocumentoReferencia,
      Equipo,
      SistemaInformacion,
      Procedimiento,
      Operacion,
    ]),
    VersionesModule,
    AuthModule,
  ],
  controllers: [RecursosController],
  providers: [RecursosService],
  exports: [RecursosService],
})
export class RecursosModule {}
