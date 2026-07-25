import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import {
  PlatformStats,
  AdminRestaurantView,
  AdminUserView,
  AdminRestaurantDetail,
  PlatformTimePoint,
} from './models/admin-stats.model';
import { ErrorLogModel } from '../error-logs/models/error-log.model';
import { OrderModel } from '../orders/models/order.model';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { ErrorLogLevel, UserRole } from '../common/enums';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { MenuModule } from '../menu/menu.module';
import { TablesModule } from '../tables/tables.module';
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
    @Args('level', { type: () => ErrorLogLevel, nullable: true }) level?: ErrorLogLevel,
  ): Promise<ErrorLogModel[]> {
    return this.adminService.getErrorLogs(restaurantId, level);
  }

  @Query(() => [OrderModel])
  async allOrders(
    @Args('limit', { nullable: true }) limit?: number,
  ): Promise<OrderModel[]> {
    return this.adminService.getAllOrders(Math.min(Math.max(limit || 100, 1), 500));
  }

  @Query(() => [AdminUserView])
  async adminUsers(): Promise<AdminUserView[]> {
    return this.adminService.getAdminUsers();
  }

  @Query(() => AdminRestaurantDetail)
  async adminRestaurantDetail(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ): Promise<AdminRestaurantDetail> {
    return this.adminService.getRestaurantDetail(restaurantId);
  }

  @Query(() => [PlatformTimePoint])
  async platformTimeseries(
    @Args('days', { type: () => Int, nullable: true }) days?: number,
  ): Promise<PlatformTimePoint[]> {
    return this.adminService.getPlatformTimeseries(days ?? 30);
  }

  @Mutation(() => Int)
  async purgeErrorLogs(
    @Args('olderThanDays', { type: () => Int }) olderThanDays: number,
  ): Promise<number> {
    // A negative value would put the cutoff in the future and wipe every log.
    return this.adminService.purgeErrorLogs(Math.max(olderThanDays, 0));
  }

  @Mutation(() => AdminUserView)
  async adminToggleUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() user: any,
  ): Promise<AdminUserView> {
    await this.adminService.toggleUser(userId, user._id?.toString());
    // Return the refreshed view (with restaurant name) for the row.
    const users = await this.adminService.getAdminUsers();
    return users.find((u) => u._id.toString() === userId)!;
  }

  @Mutation(() => Boolean)
  async adminResetUserPassword(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    // Same floor as RegisterInput/AddStaffInput — raw @Args skip class-validator.
    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      throw new BadRequestException('Password must be 8-128 characters');
    }
    return this.adminService.resetUserPassword(userId, newPassword);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    RestaurantsModule,
    UsersModule,
    OrdersModule,
    MenuModule,
    TablesModule,
    ErrorLogsModule,
  ],
  providers: [AdminService, AdminResolver],
})
export class AdminModule {}
