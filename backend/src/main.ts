import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS')!.split(','),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.enableShutdownHooks(); // ensures Prisma onModuleDestroy ($disconnect) fires on SIGTERM/SIGINT

  // Expose Swagger only outside production — the docs reveal the full endpoint
  // and DTO inventory, which we don't want public on a deployed finance API.
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('FinTrack API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));
  }

  await app.listen(config.get<number>('PORT')!, '0.0.0.0');
}
bootstrap();
