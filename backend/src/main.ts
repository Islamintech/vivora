import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // NOTE: `whitelist` is intentionally OFF. GraphQL's schema already enforces
  // input field types and required-ness, and class-validator's whitelist strips
  // any property lacking a class-validator decorator — which would wipe every
  // GraphQL InputType field that only carries an @Field() decorator (menu, table,
  // order, feedback inputs), breaking those mutations. We keep transform only.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Server running at http://localhost:${port}/graphql`);
  console.log(`🔌 WebSocket subscriptions at ws://localhost:${port}/graphql`);
}

bootstrap();
