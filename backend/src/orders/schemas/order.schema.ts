import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { OrderStatus, OrderType } from '../../common/enums';

export class OrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  // Null for a collection order phoned in: nobody is sitting anywhere.
  @Prop({ type: Types.ObjectId, ref: 'Table', default: null })
  tableId: Types.ObjectId | null;

  // The visit (tab) this order belongs to; null for orders that predate
  // table sessions. SchemaTypes.ObjectId (not Types.ObjectId, which mongoose
  // treats as Mixed here) so string filters are cast when querying.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'TableSession', default: null })
  sessionId: Types.ObjectId | null;

  // Null alongside tableId for collection orders.
  @Prop({ default: null })
  tableNumber: number | null;

  @Prop({ type: [Object], required: true })
  items: OrderItem[];

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // Dine-in unless the guest picked take-out when they scanned the QR.
  @Prop({ type: String, enum: OrderType, default: OrderType.DINE_IN })
  orderType: OrderType;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: '' })
  customerNote: string;

  @Prop({ default: 'en' })
  language: string;

  // --- Orders taken over the phone by staff ---
  // Who called, so whoever greets them can match the order to the person.
  @Prop({ default: '' })
  customerName: string;

  @Prop({ default: '' })
  customerPhone: string;

  // When the caller said they would arrive. Until then the order waits on
  // its own part of the kitchen board instead of being cooked, so the food
  // is not sitting under a lamp for half an hour.
  @Prop({ type: Date, default: null })
  scheduledFor: Date | null;

  // Cash collected: staff tap "To'landi" on the kitchen board once the guest
  // has paid. Paid orders leave the board and count as collected income.
  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  // When the food reached the guest. The table is freed automatically a while
  // after this, so it needs its own stamp: updatedAt moves on any edit, which
  // would keep pushing the deadline back every time the bill is touched.
  @Prop({ type: Date, default: null })
  servedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Index for efficient restaurant+status queries
OrderSchema.index({ restaurantId: 1, status: 1 });
// Kitchen board lists unpaid orders; billing sums paid ones by date.
OrderSchema.index({ restaurantId: 1, isPaid: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ tableId: 1, createdAt: -1 });
OrderSchema.index({ sessionId: 1 });
