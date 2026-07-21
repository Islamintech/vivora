import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { OrderStatus } from '../../common/enums';

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

  @Prop({ type: Types.ObjectId, ref: 'Table', required: true })
  tableId: Types.ObjectId;

  // The visit (tab) this order belongs to; null for orders that predate
  // table sessions. SchemaTypes.ObjectId (not Types.ObjectId, which mongoose
  // treats as Mixed here) so string filters are cast when querying.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'TableSession', default: null })
  sessionId: Types.ObjectId | null;

  @Prop({ required: true })
  tableNumber: number;

  @Prop({ type: [Object], required: true })
  items: OrderItem[];

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: '' })
  customerNote: string;

  @Prop({ default: 'en' })
  language: string;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Index for efficient restaurant+status queries
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ tableId: 1, createdAt: -1 });
OrderSchema.index({ sessionId: 1 });
