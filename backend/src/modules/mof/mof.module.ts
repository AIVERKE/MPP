import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MofService } from './mof.service';
import { MofController } from './mof.controller';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('MOF_API_URL'),
        timeout: 30000,
        maxRedirects: 5,
        headers: { 'X-Api-Key': config.get<string>('MOF_SERVICE_TOKEN') ?? '' },
      }),
    }),
    TypeOrmModule.forFeature([Unidad, Cargo]),
  ],
  controllers: [MofController],
  providers: [MofService],
  exports: [MofService],
})
export class MofModule {}
