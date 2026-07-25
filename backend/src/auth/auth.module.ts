import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { resolveJwtSecret } from './jwt-secret';

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
