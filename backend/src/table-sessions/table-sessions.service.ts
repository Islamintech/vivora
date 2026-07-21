import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TableSession,
  TableSessionDocument,
} from './schemas/table-session.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus, TableSessionStatus } from '../common/enums';

// An OPEN tab with no new orders for this long is treated as abandoned
// (guests left without staff closing it) and must not leak onto the bill of
// the next party scanning the same QR code.
const STALE_AFTER_HOURS = 4;

export type SessionWithOrders = {
  session: TableSessionDocument;
  orders: OrderDocument[];
  totalAmount: number;
};

@Injectable()
export class TableSessionsService {
  constructor(
    @InjectModel(TableSession.name)
    private sessionModel: Model<TableSessionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  private staleCutoff(): Date {
    return new Date(Date.now() - STALE_AFTER_HOURS * 3600_000);
  }

  /**
   * Returns the table's OPEN session, creating one if the table has none
   * (or only a stale one). Called on every placeOrder.
   */
  async findOrCreateOpen(
    restaurantId: Types.ObjectId | string,
    tableId: Types.ObjectId | string,
    tableNumber: number,
  ): Promise<TableSessionDocument> {
    const open = await this.sessionModel.findOne({
      tableId,
      status: TableSessionStatus.OPEN,
    });
    if (open && open.lastOrderAt < this.staleCutoff()) {
      await this.closeById(open._id.toString());
    }

    try {
      return await this.sessionModel.findOneAndUpdate(
        { tableId, status: TableSessionStatus.OPEN },
        {
          $setOnInsert: { restaurantId, tableId, tableNumber },
          $set: { lastOrderAt: new Date() },
        },
        { upsert: true, new: true },
      );
    } catch (err: any) {
      // Concurrent upsert lost the race on the unique OPEN-per-table index —
      // the winner's session is the one we want.
      if (err?.code === 11000) {
        const winner = await this.sessionModel.findOne({
          tableId,
          status: TableSessionStatus.OPEN,
        });
        if (winner) return winner;
      }
      throw err;
    }
  }

  /** Sum of the session's non-cancelled orders. */
  private async runningTotal(sessionId: string): Promise<number> {
    const [row] = await this.orderModel.aggregate([
      {
        $match: {
          // aggregate $match does not cast strings to ObjectId
          sessionId: new Types.ObjectId(sessionId),
          status: { $ne: OrderStatus.CANCELLED },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return row?.total ?? 0;
  }

  private async ordersOf(sessionId: string): Promise<OrderDocument[]> {
    return this.orderModel.find({ sessionId }).sort({ createdAt: 1 }).exec();
  }

  private async withOrders(
    session: TableSessionDocument,
  ): Promise<SessionWithOrders> {
    const orders = await this.ordersOf(session._id.toString());
    const totalAmount =
      session.status === TableSessionStatus.OPEN
        ? orders
            .filter((o) => o.status !== OrderStatus.CANCELLED)
            .reduce((sum, o) => sum + o.totalAmount, 0)
        : session.totalAmount;
    return { session, orders, totalAmount };
  }

  /**
   * Customer-facing: the table's current open tab, or null. A stale tab is
   * reported as null (fresh visit) but left untouched — the next placeOrder
   * closes and replaces it.
   */
  async findOpenForTable(
    restaurantId: string,
    tableNumber: number,
  ): Promise<SessionWithOrders | null> {
    const session = await this.sessionModel.findOne({
      restaurantId,
      tableNumber,
      status: TableSessionStatus.OPEN,
    });
    if (!session || session.lastOrderAt < this.staleCutoff()) return null;
    return this.withOrders(session);
  }

  /** Dashboard: all open tabs for the restaurant, oldest first. */
  async findOpenByRestaurant(
    restaurantId: string,
  ): Promise<SessionWithOrders[]> {
    const sessions = await this.sessionModel
      .find({ restaurantId, status: TableSessionStatus.OPEN })
      .sort({ createdAt: 1 })
      .exec();
    return Promise.all(sessions.map((s) => this.withOrders(s)));
  }

  /** Open session by id, scoped to the restaurant (staff mutations). */
  async findOpenById(
    restaurantId: string,
    sessionId: string,
  ): Promise<TableSessionDocument | null> {
    return this.sessionModel.findOne({
      _id: sessionId,
      restaurantId,
      status: TableSessionStatus.OPEN,
    });
  }

  /** Reset the stale-guard clock (e.g. staff added items to the tab). */
  async touch(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: sessionId },
      { $set: { lastOrderAt: new Date() } },
    );
  }

  /** Staff marks the tab paid: snapshot the final total and close. */
  async closeSession(
    restaurantId: string,
    sessionId: string,
  ): Promise<SessionWithOrders> {
    const session = await this.sessionModel.findOne({
      _id: sessionId,
      restaurantId,
      status: TableSessionStatus.OPEN,
    });
    if (!session) throw new NotFoundException('Open table session not found');
    const closed = await this.closeById(sessionId);
    return this.withOrders(closed);
  }

  private async closeById(sessionId: string): Promise<TableSessionDocument> {
    const totalAmount = await this.runningTotal(sessionId);
    const closed = await this.sessionModel.findOneAndUpdate(
      { _id: sessionId, status: TableSessionStatus.OPEN },
      {
        $set: {
          status: TableSessionStatus.CLOSED,
          totalAmount,
          closedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!closed) throw new NotFoundException('Open table session not found');
    return closed;
  }
}
