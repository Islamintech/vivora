import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BillingInvoice,
  BillingInvoiceDocument,
} from './schemas/billing-invoice.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { BillingStatus, OrderStatus } from '../common/enums';

// The platform's take rate and where restaurants transfer the fee. These are
// intentionally simple constants for now — move to env/DB config when needed.
const FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.003); // 0.3%
const BANK = {
  bankName: process.env.PLATFORM_BANK_NAME || 'Ipak Yo‘li Bank',
  cardNumber: process.env.PLATFORM_BANK_CARD || '8600 0000 0000 0000',
  holder: process.env.PLATFORM_BANK_HOLDER || 'Vivora Technologies',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(BillingInvoice.name)
    private invoiceModel: Model<BillingInvoiceDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private restaurantsService: RestaurantsService,
  ) {}

  bankInfo() {
    return BANK;
  }
  feeRate() {
    return FEE_RATE;
  }

  private periodOf(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  private currentPeriod(): string {
    return this.periodOf(new Date());
  }
  private periodRange(period: string): { start: Date; end: Date } {
    const [y, m] = period.split('-').map(Number);
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
  }

  /** Non-cancelled Vivora order value for a restaurant in a given month. */
  async revenueFor(restaurantId: string, period: string): Promise<number> {
    const { start, end } = this.periodRange(period);
    const [row] = await this.orderModel.aggregate([
      {
        $match: {
          // orders store restaurantId as a string — match on the string
          restaurantId,
          status: { $ne: OrderStatus.CANCELLED },
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return row?.total ?? 0;
  }

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /** Owner-facing billing summary: live current-month fee + bank + history. */
  async getMyBilling(restaurantId: string) {
    const period = this.currentPeriod();
    const [revenue, restaurant, invoices] = await Promise.all([
      this.revenueFor(restaurantId, period),
      this.restaurantsService.findById(restaurantId),
      this.invoiceModel.find({ restaurantId }).sort({ period: -1 }).exec(),
    ]);
    const currency = restaurant?.currency || 'KRW';
    return {
      currentPeriod: period,
      currentRevenue: revenue,
      currentFee: this.round(revenue * FEE_RATE),
      feeRate: FEE_RATE,
      currency,
      bank: BANK,
      invoices,
    };
  }

  async reportPaid(restaurantId: string, invoiceId: string) {
    const inv = await this.invoiceModel.findOne({ _id: invoiceId, restaurantId });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (inv.status === BillingStatus.PENDING) {
      inv.status = BillingStatus.AWAITING_REVIEW;
      inv.paidReportedAt = new Date();
      await inv.save();
    }
    return inv;
  }

  // --- Super admin ---

  async listAll(period?: string) {
    const filter: any = {};
    if (period) filter.period = period;
    const [invoices, restaurants] = await Promise.all([
      this.invoiceModel.find(filter).sort({ period: -1, amountDue: -1 }).exec(),
      this.restaurantsService.findAll(),
    ]);
    const nameById = new Map(restaurants.map((r) => [r._id.toString(), r.name]));
    return invoices.map((i) => ({
      ...i.toObject(),
      restaurantName: nameById.get(i.restaurantId) ?? null,
    }));
  }

  async confirmPaid(invoiceId: string) {
    const inv = await this.invoiceModel.findByIdAndUpdate(
      invoiceId,
      { $set: { status: BillingStatus.PAID, confirmedAt: new Date() } },
      { new: true },
    );
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  /**
   * Create one PENDING invoice per restaurant for a month (skips zero-revenue
   * and already-generated ones). Returns how many were created.
   */
  async generateForPeriod(period: string): Promise<number> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      throw new BadRequestException('Period must be YYYY-MM');
    }
    const restaurants = await this.restaurantsService.findAll();
    let created = 0;
    for (const r of restaurants) {
      const rid = r._id.toString();
      const exists = await this.invoiceModel.exists({ restaurantId: rid, period });
      if (exists) continue;
      const revenue = await this.revenueFor(rid, period);
      if (revenue <= 0) continue;
      await this.invoiceModel.create({
        restaurantId: rid,
        period,
        revenue,
        feeRate: FEE_RATE,
        amountDue: this.round(revenue * FEE_RATE),
        currency: r.currency || 'KRW',
        status: BillingStatus.PENDING,
      });
      created++;
    }
    return created;
  }

  // Generate last month's invoices on the 1st of each month, 01:00.
  @Cron('0 1 1 * *')
  async generateLastMonth(): Promise<void> {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = this.periodOf(prev);
    try {
      const n = await this.generateForPeriod(period);
      this.logger.log(`Generated ${n} billing invoice(s) for ${period}`);
    } catch (err: any) {
      this.logger.error(`Invoice generation failed for ${period}: ${err.message}`);
    }
  }
}
