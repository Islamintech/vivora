import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsOverview } from '../../libs/dto/analytics/analytics';
import { AnalyticsPeriodInput } from '../../libs/dto/analytics/analytics.input';
import { GqlAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser, Roles } from '../auth/decorators/authUser.decorator';
import { UserRole } from '../../libs/enums/user.enum';
import { Order, OrderSchema } from '../../schemas/Order.model';

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
      period.timezone,
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
      period.timezone,
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
