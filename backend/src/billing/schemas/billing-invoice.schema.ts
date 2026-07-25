import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BillingStatus } from '../../common/enums';

export type BillingInvoiceDocument = BillingInvoice & Document;

// One monthly service-fee invoice for a restaurant: 0.3% of the order revenue
// that flowed through Vivora that month. restaurantId is stored as a plain
// string, matching how orders store it (avoids the Mixed/ObjectId pitfall).
@Schema({ timestamps: true })
export class BillingInvoice {
  @Prop({ required: true, index: true })
  restaurantId: string;

  // Billing month, 'YYYY-MM'.
  @Prop({ required: true })
  period: string;

  // Total non-cancelled order value in the period.
  @Prop({ required: true, min: 0 })
  revenue: number;

  // Rate snapshot (e.g. 0.003) so historical invoices stay correct if it changes.
  @Prop({ required: true })
  feeRate: number;

  @Prop({ required: true, min: 0 })
  amountDue: number;

  @Prop({ default: 'KRW' })
  currency: string;

  @Prop({ type: String, enum: BillingStatus, default: BillingStatus.PENDING })
  status: BillingStatus;

  // When the owner reported they made the bank transfer.
  @Prop({ type: Date, default: null })
  paidReportedAt: Date | null;

  // When a super admin confirmed the money arrived.
  @Prop({ type: Date, default: null })
  confirmedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const BillingInvoiceSchema = SchemaFactory.createForClass(BillingInvoice);
// One invoice per restaurant per month.
BillingInvoiceSchema.index({ restaurantId: 1, period: 1 }, { unique: true });
BillingInvoiceSchema.index({ period: 1, status: 1 });
