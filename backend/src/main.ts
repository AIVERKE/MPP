import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolveHttpsOptions } from './common/https.util';
import { resolveCorsOrigins } from './common/cors.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: resolveHttpsOptions(),
  });
  app.enableCors({ origin: resolveCorsOrigins() });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MPP API')
    .setDescription('The MPP API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
