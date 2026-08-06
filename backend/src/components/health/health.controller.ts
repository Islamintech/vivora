import { Controller, Get, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import type { Response } from 'express';

/**
 * Plain HTTP liveness check at GET /health.
 *
 * Deliberately not a GraphQL query: an uptime monitor should be able to reach
 * it with a GET and no body, and it must keep answering even if the schema
 * fails to build. It is also what a deploy platform's own health probe wants.
 *
 * A process that is up but has lost its database is not healthy - it will fail
 * every request - so that answers 503 rather than 200. Anything watching this
 * endpoint should treat "not 200" as down.
 */
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check(@Res() res: Response) {
    // 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
    const dbUp = this.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      status: dbUp ? 'ok' : 'degraded',
      db: dbUp ? 'up' : 'down',
      uptimeSeconds: Math.round(process.uptime()),
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
    });
  }
}
