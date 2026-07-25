import { Logger } from '@nestjs/common';

// Single source of truth for the JWT secret. Signing (JwtModule) and
// verification (JwtStrategy, WS subscriptions) must use the same value —
// two different fallbacks would mint tokens that never verify.
export function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    new Logger('Auth').warn(
      'JWT_SECRET not set — using insecure dev fallback. Set JWT_SECRET in .env.',
    );
    return 'dev-only-insecure-secret';
  }
  return secret;
}
