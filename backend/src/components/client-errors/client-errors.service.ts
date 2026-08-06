import { Injectable, Logger } from '@nestjs/common';
import { ErrorLogsService } from '../error-logs/error-logs.service';
import { AlertService } from '../telegram/alert.service';
import { ReportClientErrorInput } from '../../libs/dto/client-error/client-error.input';

/**
 * How many client-reported problems may raise a Telegram alert per hour,
 * across every visitor. The endpoint is public, so this is the ceiling on how
 * much of your attention a stranger can consume: the per-IP throttle stops one
 * device flooding, and this stops a thousand devices doing it between them.
 * Everything over the budget is still written to the error log.
 */
const ALERT_BUDGET_PER_HOUR = 20;

@Injectable()
export class ClientErrorsService {
  private readonly logger = new Logger('ClientErrors');
  private alertsThisHour = 0;
  private windowStart = Date.now();

  constructor(
    private readonly errorLogs: ErrorLogsService,
    private readonly alerts: AlertService,
  ) {}

  async report(input: ReportClientErrorInput, restaurantId?: string) {
    const url = input.url.slice(0, 500);
    const message = `Image failed to load: ${url}`;
    const context = `client.${input.kind.toLowerCase()}`;
    const meta = {
      url,
      page: input.page,
      restaurantSlug: input.restaurantSlug,
      source: 'browser',
    };

    // Always recorded, so the console keeps the full picture even when the
    // alert budget is spent.
    await this.errorLogs.warn(message, { context, restaurantId, meta });

    if (this.takeBudget()) {
      // AlertService fingerprints on context + message, so one broken image
      // reported by fifty guests is a single alert plus a rollup.
      this.alerts.capture(message, { context, restaurantId, meta });
    } else {
      this.logger.warn(
        `alert budget spent (${ALERT_BUDGET_PER_HOUR}/h) - logged only: ${message}`,
      );
    }

    return true;
  }

  private takeBudget(): boolean {
    const now = Date.now();
    if (now - this.windowStart >= 60 * 60 * 1000) {
      this.windowStart = now;
      this.alertsThisHour = 0;
    }
    if (this.alertsThisHour >= ALERT_BUDGET_PER_HOUR) return false;
    this.alertsThisHour += 1;
    return true;
  }
}
