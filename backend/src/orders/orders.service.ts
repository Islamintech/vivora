import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PubSub } from 'graphql-subscriptions';
import { Order, OrderDocument } from './schemas/order.schema';
import {
  AddOrderToSessionInput,
  OrderItemInput,
  PlaceOrderInput,
  UpdateOrderStatusInput,
} from './models/order.model';
import { MenuService } from '../menu/menu.service';
import { TablesService } from '../tables/tables.service';
import { TableSessionsService } from '../table-sessions/table-sessions.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { TelegramService } from '../telegram/telegram.service';
import { PUB_SUB, ORDER_CREATED, ORDER_STATUS_UPDATED } from '../pubsub/pubsub.module';
import { OrderStatus, OrderType } from '../common/enums';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject(PUB_SUB) private pubSub: PubSub,
    private menuService: MenuService,
    private tablesService: TablesService,
    private tableSessionsService: TableSessionsService,
    private restaurantsService: RestaurantsService,
    private telegram: TelegramService,
  ) {}

  // Resolve, snapshot, and (for tracked items) atomically reserve quantity.
  // Reserving up front closes the check-then-write race where two concurrent
  // orders could both pass the availability check and oversell the kitchen.
  // Rolls back its own reservations on failure; returns rollbackReservations
  // for the caller to invoke if a later step (order insert) fails.
  private async resolveAndReserveItems(
    restaurantId: string,
    items: OrderItemInput[],
  ): Promise<{
    resolvedItems: {
      menuItemId: any;
      name: string;
      price: number;
      quantity: number;
      notes?: string;
    }[];
    totalAmount: number;
    rollbackReservations: () => Promise<void>;
  }> {
    let totalAmount = 0;
    const reserved: { itemId: string; qty: number }[] = [];
    const resolvedItems: {
      menuItemId: any;
      name: string;
      price: number;
      quantity: number;
      notes?: string;
    }[] = [];

    const rollbackReservations = async () => {
      await Promise.all(
        reserved.map((r) =>
          this.menuService.releaseQuantity(restaurantId, r.itemId, r.qty),
        ),
      );
    };

    try {
      for (const orderItem of items) {
        // Scoped to this restaurant — items from other restaurants must 404.
        const menuItem = await this.menuService.findItemForRestaurant(
          restaurantId,
          orderItem.menuItemId,
        );
        if (!menuItem) {
          throw new NotFoundException(`Menu item ${orderItem.menuItemId} not found`);
        }
        if (!menuItem.isAvailable) {
          throw new BadRequestException(
            `${menuItem.name || 'Item'} is currently unavailable`,
          );
        }
        if (menuItem.trackQuantity) {
          const updated = await this.menuService.reserveQuantity(
            restaurantId,
            menuItem._id.toString(),
            orderItem.quantity,
          );
          if (!updated) {
            throw new BadRequestException(
              `Not enough ${menuItem.name} left for this order`,
            );
          }
          reserved.push({ itemId: menuItem._id.toString(), qty: orderItem.quantity });
        }
        totalAmount += menuItem.price * orderItem.quantity;
        resolvedItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: orderItem.quantity,
          notes: orderItem.notes,
        });
      }
    } catch (err) {
      await rollbackReservations();
      throw err;
    }

    return { resolvedItems, totalAmount, rollbackReservations };
  }

  async placeOrder(input: PlaceOrderInput): Promise<OrderDocument> {
    const { restaurantId, tableNumber, items, customerNote, language, orderType } = input;

    // Block orders for restaurants that aren't approved/active, or are closed.
    const servable = await this.restaurantsService.assertServable(restaurantId.toString());
    this.restaurantsService.assertOpen(servable);

    // Resolve table
    const table = await this.tablesService.findByNumber(restaurantId, tableNumber);
    if (!table) throw new NotFoundException(`Table ${tableNumber} not found`);

    const { resolvedItems, totalAmount, rollbackReservations } =
      await this.resolveAndReserveItems(restaurantId.toString(), items);

    // Attach the order to the table's open tab (visit) so repeat orders from
    // the same sitting share one bill.
    let order: OrderDocument;
    try {
      const session = await this.tableSessionsService.findOrCreateOpen(
        restaurantId,
        table._id,
        tableNumber,
      );
      order = await this.orderModel.create({
        restaurantId,
        tableId: table._id,
        sessionId: session._id,
        tableNumber,
        items: resolvedItems,
        totalAmount,
        customerNote: customerNote || '',
        language: language || 'en',
        orderType: orderType || OrderType.DINE_IN,
        status: OrderStatus.PENDING,
      });
    } catch (err) {
      await rollbackReservations();
      throw err;
    }

    // Publish subscription event (kitchen display)
    await this.pubSub.publish(ORDER_CREATED, {
      orderCreated: order,
      restaurantId: restaurantId.toString(),
    });

    // Fire-and-forget staff Telegram alert (never blocks order placement)
    const restaurant = await this.restaurantsService.findById(restaurantId.toString());
    if (restaurant?.telegramChatId) {
      const text = this.telegram.formatNewOrder({
        restaurantName: restaurant.name,
        tableNumber,
        items: resolvedItems.map((i) => ({ name: i.name, quantity: i.quantity })),
        totalAmount,
        currency: restaurant.currency,
        customerNote: customerNote || '',
        takeOut: order.orderType === OrderType.TAKE_OUT,
      });
      // Include the "Served" button so waiters can close the order from Telegram.
      void this.telegram.sendMessage(
        restaurant.telegramChatId,
        text,
        this.telegram.servedButton(order._id.toString()),
      );
    }

    return order;
  }

  /**
   * Staff add items a waiter took verbally to the table's open tab. The order
   * is created directly as SERVED — it only corrects the bill, so no kitchen
   * subscription event and no Telegram alert.
   */
  async addOrderToSession(
    restaurantId: string,
    input: AddOrderToSessionInput,
  ): Promise<OrderDocument> {
    const session = await this.tableSessionsService.findOpenById(
      restaurantId,
      input.sessionId.toString(),
    );
    if (!session) throw new NotFoundException('Open table session not found');

    const { resolvedItems, totalAmount, rollbackReservations } =
      await this.resolveAndReserveItems(restaurantId, input.items);

    let order: OrderDocument;
    try {
      order = await this.orderModel.create({
        restaurantId,
        tableId: session.tableId,
        sessionId: session._id,
        tableNumber: session.tableNumber,
        items: resolvedItems,
        totalAmount,
        customerNote: input.note || '',
        language: 'en',
        status: OrderStatus.SERVED,
      });
    } catch (err) {
      await rollbackReservations();
      throw err;
    }

    // Keep the tab's stale-guard clock in sync with staff activity.
    await this.tableSessionsService.touch(session._id.toString());
    return order;
  }

  async updateStatus(
    restaurantId: string,
    input: UpdateOrderStatusInput,
  ): Promise<OrderDocument> {
    const { orderId, status } = input;
    const before = await this.orderModel.findOne({ _id: orderId, restaurantId });
    if (!before) throw new NotFoundException('Order not found');

    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, restaurantId },
      { $set: { status } },
      { new: true },
    );
    if (!order) throw new NotFoundException('Order not found');

    // Rejecting an order puts its tracked items back on the shelf, so a
    // refused order doesn't silently eat the day's prepared quantity.
    if (
      status === OrderStatus.CANCELLED &&
      before.status !== OrderStatus.CANCELLED
    ) {
      await Promise.all(
        order.items.map((it) =>
          this.menuService.releaseQuantity(
            restaurantId,
            it.menuItemId.toString(),
            it.quantity,
          ),
        ),
      ).catch((err) =>
        this.logger.error(`Stock release failed for order ${orderId}: ${err.message}`),
      );
    }

    await this.pubSub.publish(ORDER_STATUS_UPDATED, {
      orderStatusUpdated: order,
      restaurantId: order.restaurantId.toString(),
    });

    return order;
  }

  /**
   * Staff collected payment for this order. Paid orders drop off the kitchen
   * board and count towards collected income. Idempotent.
   */
  async markPaid(restaurantId: string, orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, restaurantId, isPaid: { $ne: true } },
      { $set: { isPaid: true, paidAt: new Date() } },
      { new: true },
    );
    if (order) {
      await this.pubSub.publish(ORDER_STATUS_UPDATED, {
        orderStatusUpdated: order,
        restaurantId: order.restaurantId.toString(),
      });
      return order;
    }
    // Already paid (or missing) - return the current doc rather than erroring
    // on a double tap from two devices.
    const existing = await this.orderModel.findOne({ _id: orderId, restaurantId });
    if (!existing) throw new NotFoundException('Order not found');
    return existing;
  }

  /**
   * Advance-only status change used by automatic signals (e.g. the print
   * agent reporting a ticket printed). Never regresses an order that a human
   * already moved further along, and never touches a finished/cancelled one.
   */
  async advanceStatus(
    restaurantId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderDocument | null> {
    const rank: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PREPARING]: 1,
      [OrderStatus.READY]: 2,
      [OrderStatus.SERVED]: 3,
      [OrderStatus.CANCELLED]: 3,
    };
    const order = await this.orderModel.findOne({ _id: orderId, restaurantId });
    if (!order) return null;
    // Only move forward, and never out of a terminal state.
    if (rank[order.status] >= rank[status]) return order;
    if (order.status === OrderStatus.SERVED || order.status === OrderStatus.CANCELLED) {
      return order;
    }

    order.status = status;
    await order.save();
    await this.pubSub.publish(ORDER_STATUS_UPDATED, {
      orderStatusUpdated: order,
      restaurantId: order.restaurantId.toString(),
    });
    return order;
  }

  async findByRestaurant(
    restaurantId: string,
    status?: OrderStatus,
    limit = 50,
    unpaidOnly = false,
  ): Promise<OrderDocument[]> {
    const filter: any = { restaurantId };
    if (status) filter.status = status;
    // The kitchen board asks for unpaid only: settled orders drop off it, and
    // so do rejected ones — a cancelled order is never awaiting payment, and
    // leaving them in would let old rejects crowd out live orders under the
    // row limit.
    if (unpaidOnly) {
      filter.isPaid = { $ne: true };
      if (!status) filter.status = { $ne: OrderStatus.CANCELLED };
    }
    return this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Total collected (paid) between two dates - the day's cash figure. */
  async paidRevenueBetween(
    restaurantId: string,
    start: Date,
    end: Date,
  ): Promise<{ total: number; count: number }> {
    const [row] = await this.orderModel.aggregate([
      {
        $match: {
          restaurantId,
          isPaid: true,
          paidAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);
    return { total: row?.total ?? 0, count: row?.count ?? 0 };
  }

  async findById(orderId: string): Promise<OrderDocument | null> {
    return this.orderModel.findById(orderId).exec();
  }

  async findByIdForRestaurant(
    restaurantId: string,
    orderId: string,
  ): Promise<OrderDocument | null> {
    return this.orderModel.findOne({ _id: orderId, restaurantId }).exec();
  }

  async findByTable(tableId: string, limit = 20): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ tableId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByRestaurantAndDateRange(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OrderDocument[]> {
    return this.orderModel
      .find({
        restaurantId,
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countAll(): Promise<number> {
    return this.orderModel.countDocuments();
  }

  async countByRestaurant(restaurantId: string): Promise<number> {
    return this.orderModel.countDocuments({ restaurantId });
  }

  // Safety net only. New orders wait for a human to accept or reject them, so
  // PENDING is never advanced automatically — otherwise the kitchen board's
  // accept step would resolve itself. Orders staff already accepted are
  // auto-served after a long delay so the board doesn't fill up if someone
  // forgets to tap "done"; they still have to be marked paid by hand.
  private static readonly AUTO_SERVE_MS = 45 * 60_000; // 45 min

  @Cron(CronExpression.EVERY_MINUTE)
  async autoAdvanceOrders(): Promise<void> {
    const serveCutoff = new Date(Date.now() - OrdersService.AUTO_SERVE_MS);

    try {
      const toServe = await this.orderModel
        .find({
          // PENDING deliberately excluded - it needs an accept/reject decision.
          status: { $in: [OrderStatus.PREPARING, OrderStatus.READY] },
          createdAt: { $lt: serveCutoff },
        })
        .limit(200);

      for (const order of toServe) {
        order.status = OrderStatus.SERVED;
        await order.save();
        await this.pubSub.publish(ORDER_STATUS_UPDATED, {
          orderStatusUpdated: order,
          restaurantId: order.restaurantId.toString(),
        });
      }

      if (toServe.length) {
        this.logger.log(`Auto-served ${toServe.length} stale order(s)`);
      }
    } catch (err: any) {
      this.logger.error(`autoAdvanceOrders failed: ${err.message}`);
    }
  }
}
