import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus } from '../common/enums';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async getOverview(restaurantId: string, startDate: Date, endDate: Date) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurant id');
    }
    // Orders store restaurantId as a plain string (the schema path is Mixed,
    // so nothing is ever cast) — $match must use the string, not an ObjectId.
    const filter = {
      restaurantId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Basic counts
    const [totalOrders, servedOrders, pendingOrders] = await Promise.all([
      this.orderModel.countDocuments(filter),
      this.orderModel.countDocuments({ ...filter, status: OrderStatus.SERVED }),
      this.orderModel.countDocuments({ ...filter, status: OrderStatus.PENDING }),
    ]);

    // Total revenue from served orders
    const revenueAgg = await this.orderModel.aggregate([
      { $match: { ...filter, status: { $in: [OrderStatus.SERVED, OrderStatus.READY] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Popular items
    const popularItems = await this.orderModel.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          totalOrdered: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 },
      {
        $project: {
          menuItemId: { $toString: '$_id' },
          name: { $ifNull: ['$name', 'Unknown Item'] },
          totalOrdered: 1,
          revenue: 1,
        },
      },
    ]);

    // Daily revenue
    const dailyRevenue = await this.orderModel.aggregate([
      { $match: { ...filter, status: { $in: [OrderStatus.SERVED, OrderStatus.READY] } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, orderCount: 1 } },
    ]);

    // Table turnover
    const tableTurnover = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$tableId',
          tableNumber: { $first: '$tableNumber' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { totalOrders: -1 } },
      {
        $project: {
          tableNumber: 1,
          tableName: { $concat: ['Table ', { $toString: '$tableNumber' }] },
          totalOrders: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      pendingOrders,
      servedOrders,
      popularItems,
      dailyRevenue,
      tableTurnover,
    };
  }
}
