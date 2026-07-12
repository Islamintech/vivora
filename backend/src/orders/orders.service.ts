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
  PlaceOrderInput,
  UpdateOrderStatusInput,
} from './models/order.model';
import { MenuService } from '../menu/menu.service';
import { TablesService } from '../tables/tables.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { TelegramService } from '../telegram/telegram.service';
import { PUB_SUB, ORDER_CREATED, ORDER_STATUS_UPDATED } from '../pubsub/pubsub.module';
import { OrderStatus } from '../common/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject(PUB_SUB) private pubSub: PubSub,
    private menuService: MenuService,
    private tablesService: TablesService,
    private restaurantsService: RestaurantsService,
    private telegram: TelegramService,
  ) {}

  async placeOrder(input: PlaceOrderInput): Promise<OrderDocument> {
    const { restaurantId, tableNumber, items, customerNote, language } = input;

    // Block orders for restaurants that aren't approved/active.
    await this.restaurantsService.assertServable(restaurantId.toString());

    // Resolve table
    const table = await this.tablesService.findByNumber(restaurantId, tableNumber);
    if (!table) throw new NotFoundException(`Table ${tableNumber} not found`);

    // Resolve, snapshot, and (for tracked items) atomically reserve quantity.
    // Reserving up front closes the check-then-write race where two concurrent
    // orders could both pass the availability check and oversell the kitchen.
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
          this.menuService.releaseQuantity(restaurantId.toString(), r.itemId, r.qty),
        ),
      );
    };

    try {
      for (const orderItem of items) {
        // Scoped to this restaurant — items from other restaurants must 404.
        const menuItem = await this.menuService.findItemForRestaurant(
          restaurantId.toString(),
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
            restaurantId.toString(),
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

    let order: OrderDocument;
    try {
      order = await this.orderModel.create({
        restaurantId,
        tableId: table._id,
        tableNumber,
        items: resolvedItems,
        totalAmount,
        customerNote: customerNote || '',
        language: language || 'en',
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
