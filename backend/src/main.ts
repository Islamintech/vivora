import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Comma-separated so a deployment can allow both the apex domain and a
  // preview/staging origin without a code change.
  const origins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
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

  // Bind 0.0.0.0 so the container is reachable from outside (Railway, Render,
  // Fly and friends route to the published port, not to localhost).
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running at http://localhost:${port}/graphql`);
  console.log(`🔌 WebSocket subscriptions at ws://localhost:${port}/graphql`);
}

bootstrap();
