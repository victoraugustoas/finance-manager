import { NestFactory } from '@nestjs/core';
import { EntryPointModule } from './entrypoint/entrypoint.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(EntryPointModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Finance Manager API')
    .setDescription(
      'Personal finance manager: record expenses, incomes, and transfers between accounts',
    )
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
