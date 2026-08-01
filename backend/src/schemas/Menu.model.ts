import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// --- MenuCategory ---
export type MenuCategoryDocument = MenuCategory & Document;

@Schema({ timestamps: true })
export class MenuCategory {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  // Same arrangement as menu items: the Uzbek name is canonical, translations
  // sit beside it keyed by language code.
  @Prop({ type: Object, default: {} })
  translations: Record<string, { name?: string }>;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const MenuCategorySchema = SchemaFactory.createForClass(MenuCategory);
MenuCategorySchema.index({ restaurantId: 1, order: 1 });
MenuCategorySchema.index({ restaurantId: 1, isActive: 1 });

// --- MenuItem ---
export type MenuItemDocument = MenuItem & Document;

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MenuCategory', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  // Machine translations of name/description, keyed by language code.
  // 'name' above stays the Uzbek original: it is what the kitchen ticket, the
  // receipt and the analytics report show, and staff must read those.
  @Prop({ type: Object, default: {} })
  translations: Record<string, { name?: string; description?: string }>;

  @Prop({ required: true, min: 0 })
  price: number;

  // First of `images`, kept as its own field so every existing read path
  // (cards, kitchen tickets, receipts) keeps working unchanged.
  @Prop({ default: '' })
  imageUrl: string;

  // Every photo of the dish, in the order the owner arranged them.
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  allergens: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: false })
  isPopular: boolean;

  // --- Prep / stock tracking ---
  // When trackQuantity is true, `quantity` is the remaining portions prepped
  // for the day; the item auto-marks unavailable when it reaches 0.
  @Prop({ default: false })
  trackQuantity: boolean;

  @Prop({ default: 0, min: 0 })
  quantity: number;

  createdAt: Date;
  updatedAt: Date;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.index({ restaurantId: 1, categoryId: 1 });
MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
