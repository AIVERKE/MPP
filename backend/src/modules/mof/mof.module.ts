import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MofService } from './mof.service';
import { MofController } from './mof.controller';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forFeature([Unidad, Cargo]),
  ],
  controllers: [MofController],
  providers: [MofService],
  exports: [MofService],
})
export class MofModule {}
