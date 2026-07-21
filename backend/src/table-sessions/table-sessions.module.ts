import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TableSession,
  TableSessionSchema,
} from './schemas/table-session.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { TableSessionsService } from './table-sessions.service';
import { TableSessionsResolver } from './table-sessions.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // Order model injected directly (not OrdersService) to avoid a circular
    // dependency: OrdersService needs this module to attach sessions.
    MongooseModule.forFeature([
      { name: TableSession.name, schema: TableSessionSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    AuthModule,
  ],
  providers: [TableSessionsService, TableSessionsResolver],
  exports: [TableSessionsService],
})
export class TableSessionsModule {}
