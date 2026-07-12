import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    new Logger('AuthModule').warn(
      'JWT_SECRET not set — using insecure dev fallback. Set JWT_SECRET in .env.',
    );
    return 'dev-only-insecure-secret';
  }
  return secret;
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: resolveJwtSecret(),
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    UsersModule,
    RestaurantsModule,
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],
  // JwtModule is exported so other modules (e.g. orders subscriptions) can
  // verify tokens arriving outside the normal HTTP guard path.
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
