import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
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
  private readonly logger = new Logger(TableSessionsService.name);

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

  /**
   * Free the table once its whole tab is settled.
   *
   * Staff tap "To'landi" per order, but a tab often holds several - a starter
   * ordered at the QR code, a dessert added later. Closing on the first
   * payment would free a table whose guests are still eating, and the next
   * party scanning that QR code would be handed the leftovers of this one.
   * So the session closes only when nothing unpaid is left on it.
   *
   * Returns true if this call was the one that freed the table.
   */
  async closeIfFullySettled(sessionId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) return false;
    const session = await this.sessionModel.findOne({
      _id: sessionId,
      status: TableSessionStatus.OPEN,
    });
    if (!session) return false;

    const outstanding = await this.orderModel.countDocuments({
      sessionId,
      status: { $ne: OrderStatus.CANCELLED },
      isPaid: { $ne: true },
    });
    if (outstanding > 0) return false;

    await this.closeById(sessionId);
    return true;
  }

  /**
   * Free tables that were served and then forgotten.
   *
   * Guests get up and leave without anyone tapping anything, and the table
   * then reads as occupied until the 4-hour stale guard expires - long enough
   * that staff seating the next party see a busy table and the guests scanning
   * the QR code inherit a stranger's tab. Twenty minutes after the last dish
   * reached the table, the tab closes itself.
   *
   * Only fully-served tabs qualify: anything still cooking means the guests
   * are demonstrably still there. Payment is deliberately not required, since
   * the point is to free the table, not to declare the money collected - the
   * orders keep their own isPaid state either way.
   */
  private static readonly AUTO_FREE_AFTER_MS = 20 * 60_000;

  @Cron(CronExpression.EVERY_MINUTE)
  async autoFreeServedTables(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - TableSessionsService.AUTO_FREE_AFTER_MS);
      const sessions = await this.sessionModel
        .find({ status: TableSessionStatus.OPEN })
        .limit(500)
        .exec();

      let freed = 0;
      for (const session of sessions) {
        const id = session._id.toString();
        const orders = await this.orderModel
          .find({ sessionId: id, status: { $ne: OrderStatus.CANCELLED } })
          .select('status servedAt updatedAt')
          .exec();

        // An empty tab is left alone: it has nothing to have been served, and
        // the stale guard already covers a tab nobody ever ordered on.
        if (!orders.length) continue;
        if (orders.some((o) => o.status !== OrderStatus.SERVED)) continue;

        // servedAt was added later, so orders served before it existed fall
        // back to updatedAt rather than being freed instantly on a null.
        const lastServed = orders.reduce((latest, o) => {
          const at = o.servedAt ?? o.updatedAt;
          return at > latest ? at : latest;
        }, new Date(0));
        if (lastServed > cutoff) continue;

        await this.closeById(id);
        freed++;
      }

      if (freed) this.logger.log(`Auto-freed ${freed} served table(s)`);
    } catch (err: any) {
      this.logger.error(`autoFreeServedTables failed: ${err.message}`);
    }
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
