import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { PlatformStats, AdminRestaurantView } from './models/admin-stats.model';
import { ErrorLogModel } from '../error-logs/models/error-log.model';
import { OrderModel } from '../orders/models/order.model';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ErrorLogsModule } from '../error-logs/error-logs.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Resolver()
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminResolver {
  constructor(private adminService: AdminService) {}

  @Query(() => PlatformStats)
  async platformStats(): Promise<PlatformStats> {
    return this.adminService.getPlatformStats();
  }

  @Query(() => [AdminRestaurantView])
  async adminRestaurants(): Promise<AdminRestaurantView[]> {
    return this.adminService.getAdminRestaurantViews();
  }

  @Query(() => [ErrorLogModel])
  async errorLogs(
    @Args('restaurantId', { type: () => ID, nullable: true }) restaurantId?: string,
  ): Promise<ErrorLogModel[]> {
    return this.adminService.getErrorLogs(restaurantId);
  }

  @Query(() => [OrderModel])
  async allOrders(
    @Args('limit', { nullable: true }) limit?: number,
  ): Promise<OrderModel[]> {
    return this.adminService.getAllOrders(Math.min(Math.max(limit || 100, 1), 500));
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    RestaurantsModule,
    UsersModule,
    OrdersModule,
    ErrorLogsModule,
  ],
  providers: [AdminService, AdminResolver],
})
export class AdminModule {}
