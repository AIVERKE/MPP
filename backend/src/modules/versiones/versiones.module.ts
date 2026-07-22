import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaCambios } from './entities/auditoria-cambios.entity';
import { AuditoriaService } from './auditoria.service';
import { VersionesController } from './versiones.controller';
import { AuthModule } from '../auth/auth.module';
import { VersionesService } from './versiones.service';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditoriaCambios, Procedimiento]),
    AuthModule,
  ],
  controllers: [VersionesController],
  providers: [AuditoriaService, VersionesService],
  exports: [TypeOrmModule, AuditoriaService, VersionesService],
})
export class VersionesModule {}
