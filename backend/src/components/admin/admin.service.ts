import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { MenuService } from '../menu/menu.service';
import { TablesService } from '../tables/tables.service';
import { ErrorLogsService } from '../error-logs/error-logs.service';
import { Order, OrderDocument } from '../../schemas/Order.model';
import { ErrorLogLevel } from '../../libs/enums/error-log.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { safeTimezone } from '../../libs/timezone';

@Injectable()
export class AdminService {
  constructor(
    private restaurantsService: RestaurantsService,
    private usersService: UsersService,
    private ordersService: OrdersService,
    private menuService: MenuService,
    private tablesService: TablesService,
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

  async getErrorLogs(restaurantId?: string, level?: ErrorLogLevel) {
    return this.errorLogsService.findAll(restaurantId, 200, level);
  }

  async purgeErrorLogs(olderThanDays: number): Promise<number> {
    return this.errorLogsService.purge(olderThanDays);
  }

  async getAllOrders(limit = 100) {
    return this.orderModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  // --- Users ---

  async getAdminUsers() {
    const [users, restaurants] = await Promise.all([
      this.usersService.findAll(),
      this.restaurantsService.findAll(),
    ]);
    const nameById = new Map(
      restaurants.map((r) => [r._id.toString(), r.name]),
    );
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      restaurantId: u.restaurantId,
      restaurantName: u.restaurantId
        ? nameById.get(u.restaurantId.toString())
        : null,
      isActive: u.isActive,
      createdAt: (u as any).createdAt,
    }));
  }

  async toggleUser(userId: string, currentUserId: string) {
    // A super admin must not be able to lock themselves out of the platform.
    if (userId === currentUserId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    return this.usersService.toggleActive(userId);
  }

  async resetUserPassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    await this.usersService.resetPassword(userId, newPassword);
    return true;
  }

  // --- Restaurant drill-down ---

  async getRestaurantDetail(restaurantId: string) {
    const r = await this.restaurantsService.findById(restaurantId);
    if (!r) throw new NotFoundException('Restaurant not found');

    const [staff, menuItemCount, tableCount, agg, recentOrders] =
      await Promise.all([
        this.usersService.findByRestaurantId(restaurantId),
        this.menuService.countItemsByRestaurant(restaurantId),
        this.tablesService.countByRestaurant(restaurantId),
        this.orderModel.aggregate([
          {
            $match: {
              restaurantId, // stored as a string — see getAdminRestaurantViews
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
        ]),
        this.orderModel
          .find({ restaurantId })
          .sort({ createdAt: -1 })
          .limit(10)
          .exec(),
      ]);

    return {
      _id: r._id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      address: r.address,
      phone: r.phone,
      logo: r.logo,
      currency: r.currency,
      isActive: r.isActive,
      status: r.status,
      rejectionReason: r.rejectionReason,
      menuItemCount,
      tableCount,
      orderCount: agg[0]?.orderCount ?? 0,
      revenue: agg[0]?.revenue ?? 0,
      staff: staff.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        restaurantId: u.restaurantId,
        restaurantName: r.name,
        isActive: u.isActive,
        createdAt: (u as any).createdAt,
      })),
      recentOrders,
      createdAt: (r as any).createdAt,
    };
  }

  // --- Platform trends ---

  async getPlatformTimeseries(days: number, timezone?: string) {
    const tz = safeTimezone(timezone);
    const span = Math.min(Math.max(days || 30, 1), 365);
    // Formats any instant as YYYY-MM-DD in the viewer's zone (en-CA is ISO).
    const dayFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const keyOf = (d: Date) => dayFmt.format(d);
    // Fetch a day of margin on each side of the window; the axis below only
    // picks the exact tz-local days it needs, extras are ignored.
    const start = new Date(Date.now() - (span + 1) * 86_400_000);

    const dayKey = {
      $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz },
    };

    const [orderAgg, restaurants] = await Promise.all([
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: start },
            status: { $ne: OrderStatus.CANCELLED },
          },
        },
        {
          $group: {
            _id: dayKey,
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
      ]),
      this.restaurantsService.findAll(),
    ]);

    // Signups per day come from the restaurant list (small N, no dedicated
    // aggregation service method) rather than reaching into another model here.
    const signupsByDay = new Map<string, number>();
    for (const r of restaurants) {
      const created = (r as any).createdAt as Date | undefined;
      if (!created || created < start) continue;
      const key = keyOf(created);
      signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
    }

    const orderByDay = new Map(
      orderAgg.map((o) => [o._id, { revenue: o.revenue, orders: o.orders }]),
    );

    const points: {
      date: string;
      revenue: number;
      orders: number;
      signups: number;
    }[] = [];
    for (let i = 0; i < span; i++) {
      // Step back in whole 24h units from now and label with the tz-local day.
      const key = keyOf(new Date(Date.now() - (span - 1 - i) * 86_400_000));
      const o = orderByDay.get(key);
      points.push({
        date: key,
        revenue: o?.revenue ?? 0,
        orders: o?.orders ?? 0,
        signups: signupsByDay.get(key) ?? 0,
      });
    }
    return points;
  }
}
