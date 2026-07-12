import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  Context,
  ID,
} from '@nestjs/graphql';
import {
  UseGuards,
  Inject,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PubSub } from 'graphql-subscriptions';
import { OrdersService } from './orders.service';
import {
  OrderModel,
  PlaceOrderInput,
  UpdateOrderStatusInput,
} from './models/order.model';
import { PUB_SUB, ORDER_CREATED, ORDER_STATUS_UPDATED } from '../pubsub/pubsub.module';
import { Throttle } from '@nestjs/throttler';
import { GqlAuthGuard, GqlThrottlerGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { OrderStatus, UserRole } from '../common/enums';

@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(
    private ordersService: OrdersService,
    private jwtService: JwtService,
    @Inject(PUB_SUB) private pubSub: PubSub,
  ) {}

  // Public — no auth (customer places order). Generous limit because a whole
  // restaurant's guests can share one IP behind the venue's WiFi NAT.
  @Mutation(() => OrderModel)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async placeOrder(@Args('input') input: PlaceOrderInput): Promise<OrderModel> {
    return this.ordersService.placeOrder(input);
  }

  @Query(() => [OrderModel])
  @UseGuards(GqlAuthGuard)
  async orders(
    @CurrentUser() user: any,
    @Args('status', { type: () => OrderStatus, nullable: true }) status?: OrderStatus,
    @Args('limit', { type: () => Number, nullable: true }) limit?: number,
  ): Promise<OrderModel[]> {
    return this.ordersService.findByRestaurant(
      user.restaurantId?.toString(),
      status,
      Math.min(Math.max(limit || 50, 1), 200),
    );
  }

  @Query(() => OrderModel)
  @UseGuards(GqlAuthGuard)
  async order(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: any,
  ): Promise<OrderModel> {
    return this.ordersService.findByIdForRestaurant(
      user.restaurantId?.toString(),
      orderId,
    );
  }

  @Mutation(() => OrderModel)
  @UseGuards(GqlAuthGuard)
  async updateOrderStatus(
    @Args('input') input: UpdateOrderStatusInput,
    @CurrentUser() user: any,
  ): Promise<OrderModel> {
    return this.ordersService.updateStatus(user.restaurantId?.toString(), input);
  }

  // --- Kitchen Subscriptions ---
  // Guards don't run on the WebSocket path, so each subscribe verifies the JWT
  // sent in graphql-ws connectionParams and pins it to the requested restaurant.

  @Subscription(() => OrderModel, {
    filter: (payload, variables) =>
      payload.restaurantId === variables.restaurantId,
  })
  orderCreated(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Context() ctx: any,
  ) {
    this.assertSubscriptionAccess(ctx, restaurantId);
    return this.pubSub.asyncIterator(ORDER_CREATED);
  }

  @Subscription(() => OrderModel, {
    filter: (payload, variables) =>
      payload.restaurantId === variables.restaurantId,
  })
  orderStatusUpdated(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Context() ctx: any,
  ) {
    this.assertSubscriptionAccess(ctx, restaurantId);
    return this.pubSub.asyncIterator(ORDER_STATUS_UPDATED);
  }

  private assertSubscriptionAccess(ctx: any, restaurantId: string): void {
    const params = ctx?.connectionParams ?? {};
    const raw: string = params.authorization || params.Authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    if (!token) {
      throw new UnauthorizedException('Please login to continue');
    }

    let payload: { role?: string; restaurantId?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (
      payload.role !== UserRole.SUPER_ADMIN &&
      payload.restaurantId !== restaurantId
    ) {
      throw new ForbiddenException(
        'You can only subscribe to your own restaurant',
      );
    }
  }
}
