import { Global, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { AlertService } from './alert.service';

@Global()
@Module({
  providers: [TelegramService, AlertService],
  exports: [TelegramService, AlertService],
})
export class TelegramModule {}
