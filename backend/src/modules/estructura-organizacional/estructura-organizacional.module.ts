import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstructuraOrganizacionalService } from './estructura-organizacional.service';
import { EstructuraOrganizacionalController } from './estructura-organizacional.controller';
import { Unidad } from './entities/unidad.entity';
import { Cargo } from './entities/cargo.entity';
import { Instalacion } from './entities/instalacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Unidad, Cargo, Instalacion])],
  controllers: [EstructuraOrganizacionalController],
  providers: [EstructuraOrganizacionalService],
  exports: [EstructuraOrganizacionalService],
})
export class EstructuraOrganizacionalModule {}
