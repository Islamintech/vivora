import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  TelegramService,
  TelegramUpdate,
  SERVED_CALLBACK_PREFIX,
} from './telegram.service';
import { OrdersService } from '../orders/orders.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { OrderStatus } from '../common/enums';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Long-polls Telegram for button taps and acts on them. Lives in its own module
 * (imports OrdersModule) so the low-level TelegramService stays dependency-free
 * and there's no circular DI with OrdersService.
 *
 * Currently handles the waiter "Served" button: marks the order SERVED, which
 * also publishes the live status update to the kitchen/dashboard.
 */
@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('TelegramBot');
  private running = false;
  private offset = 0;

  constructor(
    private readonly telegram: TelegramService,
    private readonly ordersService: OrdersService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  onApplicationBootstrap() {
    if (!this.telegram.isConfigured) {
      this.logger.log('TELEGRAM_BOT_TOKEN not set — bot polling disabled.');
      return;
    }
    this.running = true;
    void this.poll();
    this.logger.log('Telegram bot polling started.');
  }

  onModuleDestroy() {
    this.running = false;
  }

  private async poll() {
    while (this.running) {
      const updates = await this.telegram.getUpdates(this.offset, 30);
      for (const update of updates) {
        this.offset = update.update_id + 1;
        try {
          await this.handleUpdate(update);
        } catch (err) {
          this.logger.warn(`Failed handling update: ${(err as Error).message}`);
        }
      }
      // Guard against a tight loop if getUpdates returns early (e.g. network error).
      if (!updates.length) await sleep(1000);
    }
  }

  private async handleUpdate(update: TelegramUpdate) {
    const cq = update.callback_query;
    if (!cq?.data || !cq.data.startsWith(SERVED_CALLBACK_PREFIX)) return;

    const orderId = cq.data.slice(SERVED_CALLBACK_PREFIX.length);
    const chatId = cq.message?.chat.id;

    const order = await this.ordersService.findById(orderId);
    if (!order) {
      await this.telegram.answerCallbackQuery(cq.id, 'Order not found');
      return;
    }

    // Only accept taps from the restaurant's own staff group.
    const restaurant = await this.restaurantsService.findById(order.restaurantId.toString());
    if (chatId && restaurant?.telegramChatId && String(chatId) !== restaurant.telegramChatId) {
      await this.telegram.answerCallbackQuery(cq.id, 'Not allowed');
      return;
    }

    if (order.status === OrderStatus.SERVED) {
      await this.telegram.answerCallbackQuery(cq.id, 'Already served ✅');
      if (cq.message && chatId !== undefined) {
        await this.telegram.editMessageText(
          chatId,
          cq.message.message_id,
          `${escapeHtml(cq.message.text ?? 'Order')}\n\n✅ <b>Served</b>`,
        );
      }
      return;
    }

    await this.ordersService.updateStatus(order.restaurantId.toString(), {
      orderId,
      status: OrderStatus.SERVED,
    });
    await this.telegram.answerCallbackQuery(cq.id, 'Marked as served ✅');

    if (cq.message && chatId !== undefined) {
      await this.telegram.editMessageText(
        chatId,
        cq.message.message_id,
        `${escapeHtml(cq.message.text ?? 'Order')}\n\n✅ <b>Served</b>`,
      );
    }
  }
}
