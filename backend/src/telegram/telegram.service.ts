import { Injectable, Logger } from '@nestjs/common';

export interface InlineKeyboardMarkup {
  inline_keyboard: { text: string; callback_data: string }[][];
}

export interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number }; text?: string };
  };
}

// callback_data prefix for the "Served" button (stays well under Telegram's 64-byte limit).
export const SERVED_CALLBACK_PREFIX = 'served:';

/**
 * Sends staff order alerts via a single platform Telegram bot.
 * Configure TELEGRAM_BOT_TOKEN in the backend env; each restaurant stores its
 * own group chat ID (telegramChatId). If either is missing, sending is a no-op.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger('TelegramService');
  private readonly token = process.env.TELEGRAM_BOT_TOKEN;

  get isConfigured(): boolean {
    return !!this.token;
  }

  /** Low-level Telegram Bot API call. Returns parsed JSON, or null on failure. */
  private async call(method: string, payload: Record<string, unknown>): Promise<any | null> {
    if (!this.token) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        this.logger.warn(`Telegram ${method} failed: ${JSON.stringify(json)}`);
        return null;
      }
      return json.result;
    } catch (err) {
      // Never let a notification/poll failure crash the caller.
      this.logger.warn(`Telegram ${method} error: ${(err as Error).message}`);
      return null;
    }
  }

  async sendMessage(
    chatId: string,
    text: string,
    replyMarkup?: InlineKeyboardMarkup,
  ): Promise<void> {
    if (!this.token || !chatId) return; // not configured for this restaurant — skip silently
    await this.call('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  }

  /** Long-poll for updates. Returns the raw update array (callback queries, etc.). */
  async getUpdates(offset: number, timeout = 30): Promise<TelegramUpdate[]> {
    const result = await this.call('getUpdates', {
      offset,
      timeout,
      allowed_updates: ['callback_query'],
    });
    return (result as TelegramUpdate[]) ?? [];
  }

  /** Acknowledge a button tap (shows a toast to the waiter, stops the spinner). */
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      ...(text ? { text } : {}),
    });
  }

  /** Replace a message's text and drop its inline keyboard (e.g. after "Served"). */
  async editMessageText(chatId: string | number, messageId: number, text: string): Promise<void> {
    await this.call('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [] },
    });
  }

  /** Escape user-supplied text for Telegram HTML parse mode. */
  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Build a formatted new-order alert message (HTML). */
  formatNewOrder(opts: {
    restaurantName: string;
    tableNumber: number;
    items: { name: string; quantity: number }[];
    totalAmount: number;
    currency: string;
    customerNote?: string;
    takeOut?: boolean;
  }): string {
    const lines = opts.items
      .map((i) => `• ${i.quantity}× ${this.escapeHtml(i.name)}`)
      .join('\n');
    const total = `${opts.totalAmount.toFixed(2)} ${this.escapeHtml(opts.currency)}`;
    const note = opts.customerNote
      ? `\n📝 <i>${this.escapeHtml(opts.customerNote)}</i>`
      : '';
    const serving = opts.takeOut ? '🥡 <b>TAKE-OUT</b>\n' : '';
    return (
      `🧾 <b>New order — Table ${opts.tableNumber}</b>\n` +
      `<b>${this.escapeHtml(opts.restaurantName)}</b>\n` +
      `${serving}\n` +
      `${lines}\n\n` +
      `💰 <b>Total: ${total}</b>${note}`
    );
  }

  /** Inline keyboard with the single "Served" button waiters tap to close an order. */
  servedButton(orderId: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: '✅ Served', callback_data: `${SERVED_CALLBACK_PREFIX}${orderId}` }],
      ],
    };
  }
}
