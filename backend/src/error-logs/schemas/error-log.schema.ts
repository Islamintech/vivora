import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ErrorLogLevel } from '../../common/enums';

export type ErrorLogDocument = ErrorLog & Document;

@Schema({ timestamps: true })
export class ErrorLog {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', default: null })
  restaurantId: Types.ObjectId | null;

  @Prop({ type: String, enum: ErrorLogLevel, default: ErrorLogLevel.ERROR })
  level: ErrorLogLevel;

  @Prop({ required: true })
  message: string;

  @Prop({ default: '' })
  stack: string;

  @Prop({ default: '' })
  context: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
ErrorLogSchema.index({ createdAt: -1 });
ErrorLogSchema.index({ restaurantId: 1, createdAt: -1 });
