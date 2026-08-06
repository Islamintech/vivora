import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'crypto';
import { TelegramService } from './telegram.service';

export interface AlertContext {
  context?: string;
  stack?: string;
  restaurantId?: string;
  meta?: Record<string, any>;
}

/** How long one fingerprint stays muted after its first alert. */
const WINDOW_MS = 15 * 60 * 1000;
/** Telegram caps a message at 4096 characters; stay well clear. */
const MAX_LEN = 3000;

/**
 * Secrets that must never leave the process inside a stack trace. Mongo URIs
 * carry the cluster password, and an Authorization header lifted into an error
 * message would hand over a live session.
 */
const SCRUBBERS: [RegExp, string][] = [
  [/mongodb(\+srv)?:\/\/[^\s"'`]+/gi, 'mongodb://[redacted]'],
  [/(bearer\s+)[A-Za-z0-9._-]{20,}/gi, '$1[redacted]'],
  [/\beyJ[A-Za-z0-9._-]{20,}/g, '[jwt-redacted]'],
  [/\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g, '[bot-token-redacted]'],
  [/("?(?:password|secret|token|apiKey|api_key)"?\s*[:=]\s*)("?)[^\s,"'}]+/gi,
    '$1$2[redacted]'],
];

function scrub(text: string): string {
  return SCRUBBERS.reduce((acc, [re, to]) => acc.replace(re, to), text);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface Bucket {
  firstSeen: number;
  suppressed: number;
  message: string;
  context?: string;
}

/**
 * Pushes server-side failures to a Telegram chat so they are noticed in
 * minutes rather than whenever someone next opens the super admin console.
 *
 * Two things keep it from becoming noise you learn to ignore:
 *
 *  - Only 5xx-class failures reach here. A guest hitting a closed restaurant is
 *    a 403 and stays out of it (see GqlExceptionFilter).
 *  - Identical failures are fingerprinted and muted for WINDOW_MS. One bad
 *    deploy or a retry loop otherwise sends hundreds of messages, Telegram rate
 *    limits the chat, and the alerts stop arriving exactly when they matter.
 *    Repeats are counted and reported once as a rollup.
 *
 * Configure TELEGRAM_BOT_TOKEN + TELEGRAM_ALERT_CHAT_ID. Without them every
 * call is a no-op, so development and tests stay silent.
 */
@Injectable()
export class AlertService implements OnModuleDestroy {
  private readonly logger = new Logger('AlertService');
  private readonly chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  // Optional: a topic inside a supergroup, so several projects share one chat.
  private readonly threadId = process.env.TELEGRAM_ALERT_THREAD_ID;
  private readonly project = process.env.ALERT_PROJECT_NAME || 'Vivora';
  private readonly env = process.env.NODE_ENV || 'development';

  private readonly buckets = new Map<string, Bucket>();
  private readonly sweeper: NodeJS.Timeout;

  constructor(private readonly telegram: TelegramService) {
    // Flush expired windows so a burst is followed by its rollup even when the
    // error has stopped happening. unref() keeps this from holding the process
    // open at shutdown.
    this.sweeper = setInterval(() => this.flush(), 60_000);
    this.sweeper.unref?.();
  }

  onModuleDestroy() {
    clearInterval(this.sweeper);
  }

  get isConfigured(): boolean {
    return this.telegram.isConfigured && !!this.chatId;
  }

  /**
   * Report a failure. Never throws and never awaits anything the caller
   * depends on - alerting must not be able to break the request that failed.
   */
  capture(message: string, ctx: AlertContext = {}): void {
    if (!this.isConfigured) return;
    try {
      const key = this.fingerprint(message, ctx.context);
      const now = Date.now();
      const bucket = this.buckets.get(key);

      if (bucket && now - bucket.firstSeen < WINDOW_MS) {
        bucket.suppressed += 1;
        return;
      }

      this.buckets.set(key, {
        firstSeen: now,
        suppressed: 0,
        message,
        context: ctx.context,
      });
      void this.send(this.format(message, ctx));
    } catch (err) {
      this.logger.warn(`alert failed: ${(err as Error).message}`);
    }
  }

  private fingerprint(message: string, context?: string): string {
    // Ids and numbers vary between occurrences of the same fault, so they are
    // normalised out - otherwise every retry looks like a brand new error.
    const normalised = message
      .replace(/[0-9a-f]{24}/gi, '<id>')
      .replace(/\d+/g, '<n>');
    return createHash('sha1')
      .update(`${context ?? ''}|${normalised}`)
      .digest('hex')
      .slice(0, 16);
  }

  private format(message: string, ctx: AlertContext): string {
    const lines = [
      `🔴 <b>${escapeHtml(this.project)}</b> · ${escapeHtml(this.env)}`,
    ];
    if (ctx.context) lines.push(`<b>${escapeHtml(ctx.context)}</b>`);
    lines.push(escapeHtml(scrub(message)));

    if (ctx.stack) {
      // The first frame inside our own code is the useful one; the rest is
      // framework noise that would push the message over Telegram's limit.
      const frame = scrub(ctx.stack)
        .split('\n')
        .slice(1)
        .find((l) => l.includes('/src/') || l.includes('\\src\\'));
      if (frame) lines.push(`<code>${escapeHtml(frame.trim())}</code>`);
    }

    if (ctx.restaurantId) lines.push(`restaurant: <code>${escapeHtml(ctx.restaurantId)}</code>`);
    lines.push(`<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`);

    const text = lines.join('\n');
    return text.length > MAX_LEN ? `${text.slice(0, MAX_LEN)}…` : text;
  }

  /** Emit rollups for windows that have closed, and drop them. */
  private flush(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.firstSeen < WINDOW_MS) continue;
      this.buckets.delete(key);
      if (bucket.suppressed > 0) {
        const where = bucket.context ? `<b>${escapeHtml(bucket.context)}</b>\n` : '';
        void this.send(
          `🔁 <b>${escapeHtml(this.project)}</b> · ${escapeHtml(this.env)}\n${where}` +
            `${escapeHtml(scrub(bucket.message))}\n` +
            `<i>repeated ${bucket.suppressed} more time(s) in the last 15 min</i>`,
        );
      }
    }
  }

  private async send(text: string): Promise<void> {
    // sendMessage swallows its own failures; this guard is for anything the
    // formatting above might throw.
    try {
      await this.telegram.sendMessage(this.chatId!, text, undefined, this.threadId);
    } catch (err) {
      this.logger.warn(`alert send failed: ${(err as Error).message}`);
    }
  }
}
