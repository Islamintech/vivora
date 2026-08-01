import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  Context,
  ID,
  Int,
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
import { OrderModel } from '../../libs/dto/order/order';
import { AddItemsToOrderInput, AddOrderToSessionInput, PlaceOrderInput, UpdateOrderStatusInput } from '../../libs/dto/order/order.input';
import { PUB_SUB, ORDER_CREATED, ORDER_STATUS_UPDATED } from '../../pubsub/pubsub.module';
import { Throttle } from '@nestjs/throttler';
import { GqlAuthGuard, GqlThrottlerGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/authUser.decorator';
import { OrderStatus } from '../../libs/enums/order.enum';
import { UserRole } from '../../libs/enums/user.enum';

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
    @Args('unpaidOnly', { nullable: true }) unpaidOnly?: boolean,
  ): Promise<OrderModel[]> {
    return this.ordersService.findByRestaurant(
      user.restaurantId?.toString(),
      status,
      Math.min(Math.max(limit || 50, 1), 200),
      unpaidOnly ?? false,
    );
  }

  /** Staff add a verbally-requested item to an order already on the board. */
  @Mutation(() => OrderModel)
  @UseGuards(GqlAuthGuard)
  async addItemsToOrder(
    @Args('input') input: AddItemsToOrderInput,
    @CurrentUser() user: any,
  ): Promise<OrderModel> {
    return this.ordersService.addItemsToOrder(user.restaurantId?.toString(), input);
  }

  /** Staff collected payment - removes the order from the kitchen board. */
  @Mutation(() => OrderModel)
  @UseGuards(GqlAuthGuard)
  async markOrderPaid(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: any,
  ): Promise<OrderModel> {
    return this.ordersService.markPaid(user.restaurantId?.toString(), orderId);
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
  async addOrderToSession(
    @Args('input') input: AddOrderToSessionInput,
    @CurrentUser() user: any,
  ): Promise<OrderModel> {
    return this.ordersService.addOrderToSession(
      user.restaurantId?.toString(),
      input,
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

  // Called by the print agent when a kitchen ticket prints — advance-only, so
  // it never regresses an order a staff member already marked done.
  @Mutation(() => OrderModel, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async markOrderPreparing(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: any,
  ): Promise<OrderModel | null> {
    return this.ordersService.advanceStatus(
      user.restaurantId?.toString(),
      orderId,
      OrderStatus.PREPARING,
    );
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

  // --- Customer subscription ---
  // Public on purpose: a guest has no account, and the same
  // (restaurantId, tableNumber) pair already returns this table's whole tab
  // through the public tableSession query, so watching it live reveals
  // nothing that asking repeatedly would not.
  @Subscription(() => OrderModel, {
    filter: (payload, variables) => {
      const order = payload.orderCreated ?? payload.orderStatusUpdated;
      return (
        payload.restaurantId === variables.restaurantId &&
        order?.tableNumber === variables.tableNumber
      );
    },
    // Two different event names feed this one subscription, so pick whichever
    // key the payload carries.
    resolve: (payload) => payload.orderCreated ?? payload.orderStatusUpdated,
  })
  tableOrderChanged(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Args('tableNumber', { type: () => Int }) tableNumber: number,
  ) {
    return this.pubSub.asyncIterator([ORDER_CREATED, ORDER_STATUS_UPDATED]);
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
