import { registerEnumType } from '@nestjs/graphql';

// Service-fee invoice lifecycle: generated → owner reports bank transfer →
// super admin confirms receipt.
export enum BillingStatus {
  PENDING = 'PENDING',
  AWAITING_REVIEW = 'AWAITING_REVIEW',
  PAID = 'PAID',
}
registerEnumType(BillingStatus, { name: 'BillingStatus' });
