// schemas/restaurant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RestaurantStatus } from '../libs/enums/restaurant.enum';

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

  // Wide photo behind the restaurant name on the customer menu. Empty falls
  // back to the plain gradient, so a restaurant is never obliged to have one.
  @Prop({ default: '' })
  coverImage: string;

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

  // Opening hours, "HH:mm" in the restaurant's own timezone. Customers can
  // only order while open. closingTime <= openingTime means the shift runs
  // past midnight (e.g. 18:00 -> 02:00). alwaysOpen skips the check entirely.
  //
  // New restaurants start alwaysOpen so a fresh signup is never blocked by
  // hours it hasn't configured yet; the times below are just the starting
  // values shown in Settings once the owner turns 24/7 off.
  @Prop({ default: '09:00' })
  openingTime: string;

  @Prop({ default: '22:00' })
  closingTime: string;

  @Prop({ default: true })
  alwaysOpen: boolean;

  // IANA zone used to evaluate the hours above.
  @Prop({ default: 'Asia/Seoul' })
  timezone: string;

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
