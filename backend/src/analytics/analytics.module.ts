import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsOverview, AnalyticsPeriodInput } from './models/analytics.model';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Resolver()
export class AnalyticsResolver {
  constructor(private analyticsService: AnalyticsService) {}

  @Query(() => AnalyticsOverview)
  @UseGuards(GqlAuthGuard)
  async analytics(
    @CurrentUser() user: any,
    @Args('period') period: AnalyticsPeriodInput,
  ): Promise<AnalyticsOverview> {
    return this.analyticsService.getOverview(
      user.restaurantId?.toString(),
      period.startDate,
      period.endDate,
    );
  }

  @Query(() => AnalyticsOverview)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async adminRestaurantAnalytics(
    @Args('restaurantId') restaurantId: string,
    @Args('period') period: AnalyticsPeriodInput,
  ): Promise<AnalyticsOverview> {
    return this.analyticsService.getOverview(
      restaurantId,
      period.startDate,
      period.endDate,
    );
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
