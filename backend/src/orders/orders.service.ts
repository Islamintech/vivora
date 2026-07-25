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
    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, restaurantId },
      { $set: { status } },
      { new: true },
    );
    if (!order) throw new NotFoundException('Order not found');

    await this.pubSub.publish(ORDER_STATUS_UPDATED, {
      orderStatusUpdated: order,
      restaurantId: order.restaurantId.toString(),
    });

    return order;
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
  ): Promise<OrderDocument[]> {
    const filter: any = { restaurantId };
    if (status) filter.status = status;
    return this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
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

  // How long an order may sit before it's auto-served, and how quickly a
  // never-printed order is assumed to be in the kitchen. Kept generous — the
  // point is to keep the board clean when 2-3 staff can't tap every stage,
  // not to be precise.
  private static readonly AUTO_SERVE_MS = 20 * 60_000; // 20 min
  private static readonly AUTO_PREP_MS = 60_000; // 1 min

  /**
   * Keeps order status moving without staff taps. Runs every minute:
   *   1. anything still open after 20 min is auto-served (safety net),
   *   2. fresh PENDING orders slide to PREPARING after ~1 min, so the customer
   *      sees progress even at restaurants with no printer (printers advance
   *      it instantly via the print agent).
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoAdvanceOrders(): Promise<void> {
    const now = Date.now();
    const serveCutoff = new Date(now - OrdersService.AUTO_SERVE_MS);
    const prepCutoff = new Date(now - OrdersService.AUTO_PREP_MS);

    const publish = async (order: OrderDocument) => {
      await order.save();
      await this.pubSub.publish(ORDER_STATUS_UPDATED, {
        orderStatusUpdated: order,
        restaurantId: order.restaurantId.toString(),
      });
    };

    try {
      // 1. Auto-serve anything left open past the timeout.
      const toServe = await this.orderModel
        .find({
          status: { $in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY] },
          createdAt: { $lt: serveCutoff },
        })
        .limit(200);
      for (const order of toServe) {
        order.status = OrderStatus.SERVED;
        await publish(order);
      }

      // 2. Nudge still-pending (but not yet stale) orders into PREPARING.
      const toPrep = await this.orderModel
        .find({
          status: OrderStatus.PENDING,
          createdAt: { $lt: prepCutoff, $gte: serveCutoff },
        })
        .limit(200);
      for (const order of toPrep) {
        order.status = OrderStatus.PREPARING;
        await publish(order);
      }

      if (toServe.length || toPrep.length) {
        this.logger.log(
          `Auto-advanced orders: ${toPrep.length} → preparing, ${toServe.length} → served`,
        );
      }
    } catch (err: any) {
      this.logger.error(`autoAdvanceOrders failed: ${err.message}`);
    }
  }
}
