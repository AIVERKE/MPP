import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaCambios } from './entities/auditoria-cambios.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaCambios])],
  exports: [TypeOrmModule],
})
export class VersionesModule {}
