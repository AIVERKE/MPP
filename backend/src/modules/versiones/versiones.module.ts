import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaCambios } from './entities/auditoria-cambios.entity';
import { AuditoriaService } from './auditoria.service';
import { VersionesController } from './versiones.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaCambios]), AuthModule],
  controllers: [VersionesController],
  providers: [AuditoriaService],
  exports: [TypeOrmModule, AuditoriaService],
})
export class VersionesModule {}
