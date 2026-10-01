import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent as HttpsAgent } from 'node:https';
import { MofService } from './mof.service';
import { MofController } from './mof.controller';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // El MOF a veces sirve el leaf sin intermediate (UNABLE_TO_VERIFY_LEAF_SIGNATURE).
        // MOF_TLS_REJECT_UNAUTHORIZED=false desactiva la verificación solo para este cliente.
        const rejectUnauthorized =
          (config.get<string>('MOF_TLS_REJECT_UNAUTHORIZED') ?? 'true').toLowerCase() !==
          'false';

        return {
          baseURL: config.get<string>('MOF_API_URL'),
          timeout: 30000,
          maxRedirects: 5,
          headers: { 'X-Api-Key': config.get<string>('MOF_SERVICE_TOKEN') ?? '' },
          httpsAgent: new HttpsAgent({ rejectUnauthorized }),
        };
      },
    }),
    TypeOrmModule.forFeature([Unidad, Cargo]),
  ],
  controllers: [MofController],
  providers: [MofService],
  exports: [MofService],
})
export class MofModule {}
