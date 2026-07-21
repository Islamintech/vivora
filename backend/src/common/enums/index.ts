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
registerEnumType(ErrorLogLevel, { name: 'ErrorLogLevel' });
registerEnumType(RestaurantStatus, { name: 'RestaurantStatus' });
