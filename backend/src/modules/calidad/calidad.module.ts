import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalidadService } from './calidad.service';
import { CalidadController } from './calidad.controller';
import { Normativa } from './entities/normativa.entity';
import { Indicador } from './entities/indicador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Normativa, Indicador])],
  controllers: [CalidadController],
  providers: [CalidadService],
  exports: [CalidadService],
})
export class CalidadModule {}
