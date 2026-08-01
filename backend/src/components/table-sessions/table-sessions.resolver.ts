import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TableSessionsService, SessionWithOrders } from './table-sessions.service';
import { TableSessionModel } from '../../libs/dto/table-session/table-session';
import { GqlAuthGuard, GqlThrottlerGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/authUser.decorator';

function toModel(sw: SessionWithOrders): TableSessionModel {
  return {
    ...sw.session.toObject(),
    orders: sw.orders,
    totalAmount: sw.totalAmount,
  } as TableSessionModel;
}

@Resolver(() => TableSessionModel)
export class TableSessionsResolver {
  constructor(private sessionsService: TableSessionsService) {}

  // Public — the customer's running tab. Polled by every device at the
  // venue, which shares one NAT'd IP, hence the generous per-IP limit.
  @Query(() => TableSessionModel, { nullable: true })
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  async tableSession(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Args('tableNumber', { type: () => Int }) tableNumber: number,
  ): Promise<TableSessionModel | null> {
    const sw = await this.sessionsService.findOpenForTable(
      restaurantId,
      tableNumber,
    );
    return sw ? toModel(sw) : null;
  }

  @Query(() => [TableSessionModel])
  @UseGuards(GqlAuthGuard)
  async openTableSessions(
    @CurrentUser() user: any,
  ): Promise<TableSessionModel[]> {
    const rows = await this.sessionsService.findOpenByRestaurant(
      user.restaurantId?.toString(),
    );
    return rows.map(toModel);
  }

  @Mutation(() => TableSessionModel)
  @UseGuards(GqlAuthGuard)
  async closeTableSession(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @CurrentUser() user: any,
  ): Promise<TableSessionModel> {
    const sw = await this.sessionsService.closeSession(
      user.restaurantId?.toString(),
      sessionId,
    );
    return toModel(sw);
  }
}
