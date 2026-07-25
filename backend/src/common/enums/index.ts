import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  STAFF = 'STAFF',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

// How the guest wants the order served. Chosen when they scan the QR; the
// kitchen needs it to know whether to plate or pack.
export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKE_OUT = 'TAKE_OUT',
}

// Service-fee invoice lifecycle: generated → owner reports bank transfer →
// super admin confirms receipt.
export enum BillingStatus {
  PENDING = 'PENDING',
  AWAITING_REVIEW = 'AWAITING_REVIEW',
  PAID = 'PAID',
}

export enum ErrorLogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

// Onboarding/approval lifecycle for a restaurant. A fresh signup starts as
// PENDING_REVIEW and cannot serve customers until a super admin APPROVES it.
export enum RestaurantStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// One dine-in visit at a table. OPEN collects orders into a running tab;
// staff closes it when the bill is paid.
export enum TableSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(TableSessionStatus, { name: 'TableSessionStatus' });
registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(BillingStatus, { name: 'BillingStatus' });
registerEnumType(OrderType, { name: 'OrderType' });
registerEnumType(ErrorLogLevel, { name: 'ErrorLogLevel' });
registerEnumType(RestaurantStatus, { name: 'RestaurantStatus' });
