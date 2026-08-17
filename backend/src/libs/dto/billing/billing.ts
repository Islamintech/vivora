import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { BillingStatus } from '../../enums/billing.enum';

@ObjectType()
export class BillingBank {
  @Field() bankName: string;
  @Field() cardNumber: string;
  @Field() holder: string;
}

@ObjectType()
export class BillingInvoiceModel {
  @Field(() => ID) _id: any;
  @Field(() => ID) restaurantId: any;
  @Field({ nullable: true }) restaurantName?: string;
  @Field() period: string;
  @Field(() => Float) revenue: number;
  @Field({ nullable: true }) revenueCurrency?: string;
  @Field(() => Float) feeAmount: number;
  @Field(() => Float) amountDue: number;
  @Field() currency: string;
  @Field(() => BillingStatus) status: BillingStatus;
  @Field({ nullable: true }) paidReportedAt?: Date;
  @Field({ nullable: true }) confirmedAt?: Date;
  @Field() createdAt: Date;
}

// The owner's billing view: what they owe this month + Vivora's bank details
// + their past invoices.
@ObjectType()
export class MyBilling {
  @Field() currentPeriod: string;
  @Field(() => Float) currentRevenue: number;
  // Revenue is in the restaurant's own currency; the fee is in Vivora's.
  @Field({ nullable: true }) currentRevenueCurrency?: string;
  @Field(() => Float) currentFee: number;
  @Field(() => Float) feeAmount: number; // flat monthly price, e.g. 79000
  @Field() currency: string;
  @Field(() => BillingBank) bank: BillingBank;
  @Field(() => [BillingInvoiceModel]) invoices: BillingInvoiceModel[];
}
