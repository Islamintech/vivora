import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
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

    // Block orders for restaurants that aren't approved/active.
    await this.restaurantsService.assertServable(restaurantId.toString());

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
}
