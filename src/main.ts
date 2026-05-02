import { NestFactory } from '@nestjs/core';
import { EntryPointModule } from './entrypoint/entrypoint.module';

async function bootstrap() {
  const app = await NestFactory.create(EntryPointModule);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
