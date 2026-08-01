import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

/** One language's version of a menu entry. */
@ObjectType()
export class LocalizedText {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;
}
@ObjectType()
export class Translations {
  @Field(() => LocalizedText, { nullable: true })
  en?: LocalizedText;

  @Field(() => LocalizedText, { nullable: true })
  ru?: LocalizedText;

  @Field(() => LocalizedText, { nullable: true })
  ko?: LocalizedText;
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
