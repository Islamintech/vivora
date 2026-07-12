import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { OrdersModule } from '../orders/orders.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';

/**
 * Hosts the Telegram polling consumer. Imports OrdersModule/RestaurantsModule
 * (TelegramService itself is provided by the @Global TelegramModule), so nothing
 * depends back on this module — keeping the DI graph acyclic.
 */
@Module({
  imports: [OrdersModule, RestaurantsModule],
  providers: [TelegramBotService],
})
export class TelegramBotModule {}
