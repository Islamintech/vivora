import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TableDocument = Table & Document;

@Schema({ timestamps: true })
export class Table {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  qrCodeDataUrl: string;

  @Prop({ default: 4 })
  capacity: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const TableSchema = SchemaFactory.createForClass(Table);
TableSchema.index({ restaurantId: 1, number: 1 }, { unique: true });
TableSchema.index({ restaurantId: 1, isActive: 1 });
