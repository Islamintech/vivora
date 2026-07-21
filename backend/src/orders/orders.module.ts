import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { MenuModule } from '../menu/menu.module';
import { TablesModule } from '../tables/tables.module';
import { TableSessionsModule } from '../table-sessions/table-sessions.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MenuModule,
    TablesModule,
    TableSessionsModule,
    RestaurantsModule,
    AuthModule,
  ],
  providers: [OrdersService, OrdersResolver],
  exports: [OrdersService],
})
export class OrdersModule {}
