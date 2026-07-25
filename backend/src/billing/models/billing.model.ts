import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { BillingStatus } from '../../common/enums';

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
  @Field(() => Float) feeRate: number;
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
  @Field(() => Float) currentFee: number;
  @Field(() => Float) feeRate: number; // e.g. 0.003
  @Field() currency: string;
  @Field(() => BillingBank) bank: BillingBank;
  @Field(() => [BillingInvoiceModel]) invoices: BillingInvoiceModel[];
}
