import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, MaxLength, Min, MinLength } from 'class-validator';

@ObjectType()
export class MenuCategoryModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID)
  restaurantId: any;

  @Field()
  name: string;

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
