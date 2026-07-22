// schemas/restaurant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RestaurantStatus } from '../../common/enums';

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  ownerId: Types.ObjectId | null;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  logo: string;

  // Korean won (ISO 4217); Intl renders it as ₩ with no decimals.
  @Prop({ default: 'KRW' })
  currency: string;

  // Telegram group chat ID for staff order alerts (paired with platform bot token)
  @Prop({ default: '' })
  telegramChatId: string;

  // Kitchen ticket auto-printing, driven by the local print-agent (see
  // print-agent/README.md) — it reads these via myRestaurant after login.
  @Prop({ default: false })
  printerEnabled: boolean;

  @Prop({ default: '' })
  printerIp: string;

  @Prop({ default: 9100 })
  printerPort: number;

  @Prop({ default: true })
  isActive: boolean;

  // Approval workflow: new signups start PENDING_REVIEW and only go live once a
  // super admin approves. isActive (above) is a separate suspend toggle for an
  // already-approved restaurant.
  @Prop({
    type: String,
    enum: RestaurantStatus,
    default: RestaurantStatus.PENDING_REVIEW,
  })
  status: RestaurantStatus;

  // Populated when a super admin rejects, so the owner can see why.
  @Prop({ default: '' })
  rejectionReason: string;

  // When the super admin last actioned (approved/rejected) this restaurant.
  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
RestaurantSchema.index({ ownerId: 1 });
RestaurantSchema.index({ isActive: 1, createdAt: -1 });
RestaurantSchema.index({ status: 1, createdAt: -1 });
