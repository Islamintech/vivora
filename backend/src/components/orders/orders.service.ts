import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PubSub } from 'graphql-subscriptions';
import { Order, OrderDocument } from '../../schemas/Order.model';
import { AddItemsToOrderInput, AddOrderToSessionInput, OrderItemInput, PlaceOrderInput, UpdateOrderStatusInput } from '../../libs/dto/order/order.input';
import { MenuService } from '../menu/menu.service';
import { TablesService } from '../tables/tables.service';
import { TableSessionsService } from '../table-sessions/table-sessions.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { TelegramService } from '../telegram/telegram.service';
import { PUB_SUB, ORDER_CREATED, ORDER_STATUS_UPDATED } from '../../pubsub/pubsub.module';
import { OrderStatus, OrderType } from '../../libs/enums/order.enum';

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

    // A collection order phoned in has no table: nobody is sitting anywhere,
    // so it neither resolves a table nor joins a tab. Everything else must
    // still name a real one.
    const isCollection =
      (input.orderType ?? OrderType.DINE_IN) === OrderType.TAKE_OUT &&
      (tableNumber === undefined || tableNumber === null);

    let table: { _id: any } | null = null;
    if (!isCollection) {
      if (tableNumber === undefined || tableNumber === null) {
        throw new BadRequestException('A table is required for a dine-in order');
      }
      table = await this.tablesService.findByNumber(restaurantId, tableNumber);
      if (!table) throw new NotFoundException(`Table ${tableNumber} not found`);
    }

    const { resolvedItems, totalAmount, rollbackReservations } =
      await this.resolveAndReserveItems(restaurantId.toString(), items);

    // Attach the order to the table's open tab (visit) so repeat orders from
    // the same sitting share one bill.
    let order: OrderDocument;
    try {
      const session = isCollection
        ? null
        : await this.tableSessionsService.findOrCreateOpen(
            restaurantId,
            table!._id,
            tableNumber as number,
          );
      order = await this.orderModel.create({
        restaurantId,
        tableId: table?._id ?? null,
        sessionId: session?._id ?? null,
        tableNumber: isCollection ? null : tableNumber,
        items: resolvedItems,
        totalAmount,
        customerNote: customerNote || '',
        language: language || 'en',
        orderType: orderType || OrderType.DINE_IN,
        status: OrderStatus.PENDING,
        customerName: input.customerName || '',
        customerPhone: input.customerPhone || '',
        scheduledFor: input.scheduledFor ?? null,
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
        customerName: order.customerName,
        scheduledFor: order.scheduledFor,
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

    const patch: Record<string, unknown> = { status };
    // Stamp the cooking start once, on the first move into PREPARING, so the
    // auto-serve clock doesn't restart if staff tap through the stage twice.
    if (status === OrderStatus.PREPARING && !before.preparingAt) {
      patch.preparingAt = new Date();
    }
    if (status === OrderStatus.SERVED && !before.servedAt) {
      patch.servedAt = new Date();
    }

    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, restaurantId },
      { $set: patch },
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
   * Append items to an order already on the board (a guest asked for
   * something extra after ordering). Stock is reserved exactly as for a new
   * order, and the total grows so staff still collect one payment.
   */
  async addItemsToOrder(
    restaurantId: string,
    input: AddItemsToOrderInput,
  ): Promise<OrderDocument> {
    const orderId = input.orderId?.toString() ?? '';
    // A malformed id would otherwise blow up as a Mongoose cast error (500).
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findOne({ _id: orderId, restaurantId });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) {
      throw new BadRequestException('This order is already paid');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('This order was cancelled');
    }

    const { resolvedItems, totalAmount, rollbackReservations } =
      await this.resolveAndReserveItems(restaurantId, input.items);

    try {
      order.items.push(...resolvedItems);
      order.totalAmount += totalAmount;
      order.markModified('items');
      await order.save();
    } catch (err) {
      await rollbackReservations();
      throw err;
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
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, restaurantId, isPaid: { $ne: true } },
      { $set: { isPaid: true, paidAt: new Date() } },
      { new: true },
    );
    if (order) {
      // Paying the last outstanding order on the tab frees the table, so the
      // next guests to scan that QR code start their own bill instead of
      // joining one that has already been settled.
      if (order.sessionId) {
        try {
          await this.tableSessionsService.closeIfFullySettled(
            order.sessionId.toString(),
          );
        } catch (err: any) {
          // The payment is recorded; failing to free the table must not undo
          // that, and the 20-minute sweep will pick it up anyway.
          this.logger.warn(
            `Freeing table for order ${orderId} failed: ${err.message}`,
          );
        }
      }
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
    if (status === OrderStatus.PREPARING && !order.preparingAt) {
      order.preparingAt = new Date();
    }
    if (status === OrderStatus.SERVED) order.servedAt = new Date();
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

  // The kitchen board moves itself along, because a busy chef does not stop to
  // tap every stage. A new order that nobody accepted or rejected is taken as
  // accepted after 2 minutes, and an order being cooked is taken as handed over
  // 10 minutes after cooking started. Staff can still tap ahead of both clocks,
  // and rejecting still has to be a human decision - it just has to happen in
  // the first 2 minutes.
  //
  // The last stage closes itself too: an order handed over 30 minutes ago has
  // in practice been settled at the till, and leaving it on the board only
  // buries the orders that still need attention. Note what this means for the
  // books - an order nobody collected on is still recorded as paid, exactly as
  // if staff had tapped "To'landi", and counts towards income and the service
  // fee. That is the intended trade: a board that stays readable without
  // anyone tending it.
  private static readonly AUTO_PREPARING_MS = 2 * 60_000; // 2 min
  private static readonly AUTO_SERVE_MS = 10 * 60_000; // 10 min
  private static readonly AUTO_PAID_MS = 30 * 60_000; // 30 min
  private static readonly AUTO_BATCH = 200;

  @Cron(CronExpression.EVERY_MINUTE)
  async autoAdvanceOrders(): Promise<void> {
    try {
      await this.autoAdvanceStage(
        [OrderStatus.PENDING],
        OrdersService.AUTO_PREPARING_MS,
        OrderStatus.PREPARING,
      );
      await this.autoAdvanceStage(
        [OrderStatus.PREPARING, OrderStatus.READY],
        OrdersService.AUTO_SERVE_MS,
        OrderStatus.SERVED,
      );
      await this.autoMarkPaid();
    } catch (err: any) {
      this.logger.error(`autoAdvanceOrders failed: ${err.message}`);
    }
  }

  /**
   * Settles orders that have sat in the final stage for 30 minutes.
   *
   * Separate from autoAdvanceStage because paying is not a status change:
   * it flips isPaid, and it has to free the table session as well, which is
   * why this goes through markPaid rather than writing the flag itself.
   */
  private async autoMarkPaid(): Promise<void> {
    const cutoff = new Date(Date.now() - OrdersService.AUTO_PAID_MS);
    // Orders served before servedAt was recorded fall back to when they were
    // last touched, so an old row cannot sit unpaid on the board forever.
    const servedAt = { $ifNull: ['$servedAt', '$updatedAt'] };

    const due = await this.orderModel
      .find({
        status: OrderStatus.SERVED,
        isPaid: { $ne: true },
        $expr: { $lt: [servedAt, cutoff] },
      })
      .limit(OrdersService.AUTO_BATCH);

    if (due.length === OrdersService.AUTO_BATCH) {
      this.logger.warn(
        `Auto-payment hit its ${OrdersService.AUTO_BATCH}-order batch cap; ` +
        'the remainder waits for the next run.',
      );
    }

    for (const order of due) {
      try {
        // markPaid publishes the update and closes a fully settled tab.
        await this.markPaid(order.restaurantId.toString(), order._id.toString());
      } catch (err: any) {
        // One bad order must not strand the rest of the sweep.
        this.logger.warn(
          `Auto-payment for order ${order._id} failed: ${err.message}`,
        );
      }
    }

    if (due.length) {
      this.logger.log(`Auto-marked ${due.length} order(s) paid`);
    }
  }

  private async autoAdvanceStage(
    from: OrderStatus[],
    afterMs: number,
    to: OrderStatus,
  ): Promise<void> {
    const cutoff = new Date(Date.now() - afterMs);
    // The clock starts when this stage did. For cooking that is preparingAt;
    // for a brand new order it is the later of "placed" and "wanted for", so a
    // phone order taken at 18:00 for 19:00 is not started two minutes later.
    // Orders from before preparingAt existed fall back to the same baseline.
    const startedAt = {
      $ifNull: [
        '$preparingAt',
        { $max: ['$createdAt', { $ifNull: ['$scheduledFor', '$createdAt'] }] },
      ],
    };

    const due = await this.orderModel
      .find({
        status: { $in: from },
        $expr: { $lt: [startedAt, cutoff] },
      })
      .limit(OrdersService.AUTO_BATCH);

    // Self-draining (an advanced order leaves the filter), so a full batch just
    // means the rest wait a minute. Say so, because the alternative is orders
    // quietly sitting on the board with nobody knowing why.
    if (due.length === OrdersService.AUTO_BATCH) {
      this.logger.warn(
        `Auto-advance to ${to} hit its ${OrdersService.AUTO_BATCH}-order batch ` +
        'cap; the remainder waits for the next run.',
      );
    }

    for (const order of due) {
      order.status = to;
      if (to === OrderStatus.PREPARING && !order.preparingAt) {
        order.preparingAt = new Date();
      }
      if (to === OrderStatus.SERVED && !order.servedAt) {
        order.servedAt = new Date();
      }
      await order.save();
      await this.pubSub.publish(ORDER_STATUS_UPDATED, {
        orderStatusUpdated: order,
        restaurantId: order.restaurantId.toString(),
      });
    }

    if (due.length) {
      this.logger.log(`Auto-advanced ${due.length} order(s) to ${to}`);
    }
  }
}
