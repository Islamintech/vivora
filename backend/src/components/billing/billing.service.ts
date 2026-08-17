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
} from '../../schemas/BillingInvoice.model';
import { Order, OrderDocument } from '../../schemas/Order.model';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { BillingStatus } from '../../libs/enums/billing.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { RestaurantStatus } from '../../libs/enums/restaurant.enum';

// What Vivora charges and where restaurants transfer it. These are
// intentionally simple constants for now — move to env/DB config when needed.
//
// A flat monthly subscription rather than a share of turnover: the price is
// the same sentence for every restaurant, and neither side has to agree on
// which orders counted. Quoted in KRW regardless of the currency a restaurant
// prices its own menu in, so the invoice carries FEE_CURRENCY, not theirs.
const FEE_AMOUNT = Number(process.env.PLATFORM_FEE_AMOUNT || 79000);
const FEE_CURRENCY = process.env.PLATFORM_FEE_CURRENCY || 'KRW';
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
  feeAmount() {
    return FEE_AMOUNT;
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
    // revenue is still reported: it is what the owner wants to see on this
    // page, even though the fee no longer depends on it.
    return {
      currentPeriod: period,
      currentRevenue: revenue,
      currentRevenueCurrency: restaurant?.currency || 'KRW',
      currentFee: FEE_AMOUNT,
      feeAmount: FEE_AMOUNT,
      currency: FEE_CURRENCY,
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
   * Create one PENDING invoice per restaurant for a month (skips
   * already-generated ones). Returns how many were created.
   *
   * The subscription is owed whether or not the restaurant took a single
   * order, so a quiet month is still invoiced. Restaurants that were never
   * approved are not: they cannot use the platform, so there is nothing to
   * charge for.
   */
  async generateForPeriod(period: string): Promise<number> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      throw new BadRequestException('Period must be YYYY-MM');
    }
    const restaurants = await this.restaurantsService.findAll();
    let created = 0;
    for (const r of restaurants) {
      if (r.status !== RestaurantStatus.APPROVED) continue;
      const rid = r._id.toString();
      const exists = await this.invoiceModel.exists({ restaurantId: rid, period });
      if (exists) continue;
      await this.invoiceModel.create({
        restaurantId: rid,
        period,
        // Recorded for the owner's reference only - it does not set the price.
        revenue: await this.revenueFor(rid, period),
        revenueCurrency: r.currency || 'KRW',
        feeAmount: FEE_AMOUNT,
        amountDue: FEE_AMOUNT,
        currency: FEE_CURRENCY,
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
