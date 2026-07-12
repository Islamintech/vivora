import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { RestaurantStatus } from '../../common/enums';

@ObjectType()
export class PlatformStats {
  @Field(() => Int)
  totalRestaurants: number;

  @Field(() => Int)
  activeRestaurants: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalOrders: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Int)
  totalErrorLogs: number;
}

@ObjectType()
export class AdminRestaurantView {
  @Field(() => ID)
  _id: any;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  isActive: boolean;

  @Field(() => RestaurantStatus)
  status: RestaurantStatus;

  @Field(() => Int)
  orderCount: number;

  @Field(() => Float)
  revenue: number;

  @Field()
  createdAt: Date;
}
