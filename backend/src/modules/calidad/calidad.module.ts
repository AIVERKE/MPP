import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalidadService } from './calidad.service';
import { CalidadController } from './calidad.controller';
import { Normativa } from './entities/normativa.entity';
import { Indicador } from './entities/indicador.entity';
import { VersionesModule } from '../versiones/versiones.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Normativa, Indicador]),
    VersionesModule,
    AuthModule,
  ],
  controllers: [CalidadController],
  providers: [CalidadService],
  exports: [CalidadService],
})
export class CalidadModule {}
