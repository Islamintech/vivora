import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, MaxLength, Min, MinLength } from 'class-validator';

/** One language's version of a menu entry. */
@ObjectType()
export class LocalizedText {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;
}

/**
 * Translations of a menu entry, keyed by the languages the customer menu
 * offers. Uzbek is absent on purpose - it lives in `name`/`description`, which
 * stay the original and are what staff-facing screens read.
 */
@ObjectType()
export class Translations {
  @Field(() => LocalizedText, { nullable: true })
  en?: LocalizedText;

  @Field(() => LocalizedText, { nullable: true })
  ru?: LocalizedText;

  @Field(() => LocalizedText, { nullable: true })
  ko?: LocalizedText;
}

@InputType()
export class LocalizedTextInput {
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(300)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(1500)
  description?: string;
}

@InputType()
export class TranslationsInput {
  @Field(() => LocalizedTextInput, { nullable: true })
  @IsOptional()
  en?: LocalizedTextInput;

  @Field(() => LocalizedTextInput, { nullable: true })
  @IsOptional()
  ru?: LocalizedTextInput;

  @Field(() => LocalizedTextInput, { nullable: true })
  @IsOptional()
  ko?: LocalizedTextInput;
}

@ObjectType()
export class MenuCategoryModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID)
  restaurantId: any;

  @Field()
  name: string;

  @Field(() => Translations, { nullable: true })
  translations?: Translations;

  @Field(() => Int)
  order: number;

  @Field()
  isActive: boolean;
}

@ObjectType()
export class MenuItemModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID)
  restaurantId: any;

  @Field(() => ID)
  categoryId: any;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Translations, { nullable: true })
  translations?: Translations;

  @Field(() => Float)
  price: number;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => [String])
  images: string[];

  @Field(() => [String])
  allergens: string[];

  @Field(() => [String])
  tags: string[];

  @Field()
  isAvailable: boolean;

  @Field()
  isPopular: boolean;

  @Field()
  trackQuantity: boolean;

  @Field(() => Int)
  quantity: number;

  // Computed on the public menu from the last 30 days of orders — not stored.
  @Field({ nullable: true })
  isBestSeller?: boolean;
}

// --- DTOs ---

@InputType()
export class CreateCategoryInput {
  @Field()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  order?: number;
}

@InputType()
export class UpdateCategoryInput {
  @Field(() => ID)
  categoryId: any;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  order?: number;

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class CreateMenuItemInput {
  @Field(() => ID)
  categoryId: any;

  @Field()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @Field(() => Float)
  @Min(0)
  price: number;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(2000)
  imageUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  images?: string[];

  @Field(() => TranslationsInput, { nullable: true })
  @IsOptional()
  translations?: TranslationsInput;

  @Field(() => [String], { nullable: true })
  allergens?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  isAvailable?: boolean;

  @Field({ nullable: true })
  isPopular?: boolean;

  @Field({ nullable: true })
  trackQuantity?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  quantity?: number;
}

@InputType()
export class UpdateMenuItemInput {
  @Field(() => ID)
  itemId: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(2000)
  imageUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  images?: string[];

  // Supplying this marks the translation as hand-corrected, and the machine
  // stops overwriting it on later edits.
  @Field(() => TranslationsInput, { nullable: true })
  @IsOptional()
  translations?: TranslationsInput;

  @Field(() => [String], { nullable: true })
  allergens?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  isAvailable?: boolean;

  @Field({ nullable: true })
  isPopular?: boolean;

  @Field({ nullable: true })
  trackQuantity?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  quantity?: number;
}

@InputType()
export class UpdateItemAvailabilityInput {
  @Field(() => ID)
  itemId: string;

  @Field({ nullable: true })
  isAvailable?: boolean;

  @Field({ nullable: true })
  trackQuantity?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  quantity?: number;
}
