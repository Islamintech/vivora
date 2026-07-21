import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { ErrorLogsService } from '../error-logs/error-logs.service';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus } from '../common/enums';

@Injectable()
export class AdminService {
  constructor(
    private restaurantsService: RestaurantsService,
    private usersService: UsersService,
    private ordersService: OrdersService,
    private errorLogsService: ErrorLogsService,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async getPlatformStats() {
    const [
      totalRestaurants,
      allRestaurants,
      totalUsers,
      totalOrders,
      totalErrorLogs,
    ] = await Promise.all([
      this.restaurantsService.countAll(),
      this.restaurantsService.findAll(),
      this.usersService.countAll(),
      this.ordersService.countAll(),
      this.errorLogsService.countAll(),
    ]);

    const activeRestaurants = allRestaurants.filter((r) => r.isActive).length;

    const revenueAgg = await this.orderModel.aggregate([
      { $match: { status: { $in: [OrderStatus.SERVED, OrderStatus.READY] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    return {
      totalRestaurants,
      activeRestaurants,
      totalUsers,
      totalOrders,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      totalErrorLogs,
    };
  }

  async getAdminRestaurantViews() {
    const restaurants = await this.restaurantsService.findAll();

    return Promise.all(
      restaurants.map(async (r) => {
        const rid = r._id.toString();
        const agg = await this.orderModel.aggregate([
          {
            // Orders store restaurantId as a string — match on rid, not the
            // ObjectId r._id, or this returns nothing.
            $match: {
              restaurantId: rid,
              status: { $in: [OrderStatus.SERVED, OrderStatus.READY] },
            },
          },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              revenue: { $sum: '$totalAmount' },
            },
          },
        ]);

        return {
          _id: rid,
          name: r.name,
          slug: r.slug,
          isActive: r.isActive,
          status: r.status,
          orderCount: agg[0]?.orderCount ?? 0,
          revenue: agg[0]?.revenue ?? 0,
          createdAt: (r as any).createdAt,
        };
      }),
    );
  }

  async getErrorLogs(restaurantId?: string) {
    return this.errorLogsService.findAll(restaurantId, 200);
  }

  async getAllOrders(limit = 100) {
    return this.orderModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }
}
