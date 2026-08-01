import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });

// How the guest wants the order served. Chosen when they scan the QR; the
// kitchen needs it to know whether to plate or pack.
export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKE_OUT = 'TAKE_OUT',
}
registerEnumType(OrderType, { name: 'OrderType' });
