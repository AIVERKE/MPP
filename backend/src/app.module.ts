import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { SeguridadModule } from './modules/seguridad/seguridad.module';
import { EstructuraOrganizacionalModule } from './modules/estructura-organizacional/estructura-organizacional.module';
import { ProcesosModule } from './modules/procesos/procesos.module';
import { FlujoModule } from './modules/flujo/flujo.module';
import { RecursosModule } from './modules/recursos/recursos.module';
import { CalidadModule } from './modules/calidad/calidad.module';
import { MofModule } from './modules/mof/mof.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'mpp_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    SeguridadModule,
    EstructuraOrganizacionalModule,
    ProcesosModule,
    FlujoModule,
    RecursosModule,
    CalidadModule,
    MofModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
