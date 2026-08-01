import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RestaurantStatus } from '../../enums/restaurant.enum';

@ObjectType()
export class RestaurantModel {
  @Field(() => ID)
  _id: any;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => ID, { nullable: true })
  ownerId?: any;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field({ nullable: true })
  coverImage?: string;

  @Field()
  currency: string;

  @Field({ nullable: true })
  telegramChatId?: string;

  @Field()
  printerEnabled: boolean;

  @Field({ nullable: true })
  printerIp?: string;

  @Field()
  printerPort: number;

  @Field()
  openingTime: string;

  @Field()
  closingTime: string;

  @Field()
  alwaysOpen: boolean;

  @Field()
  timezone: string;

  // Computed per request from the hours above (see RestaurantsResolver).
  @Field({ nullable: true })
  isOpenNow?: boolean;

  @Field()
  isActive: boolean;

  @Field(() => RestaurantStatus)
  status: RestaurantStatus;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field()
  createdAt: Date;
}
