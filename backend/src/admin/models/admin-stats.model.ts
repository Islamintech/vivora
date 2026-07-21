import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { RestaurantStatus, UserRole } from '../../common/enums';
import { OrderModel } from '../../orders/models/order.model';

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

// A user account as seen by the super admin, annotated with its restaurant's
// name (users store only a restaurantId).
@ObjectType()
export class AdminUserView {
  @Field(() => ID)
  _id: any;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => ID, { nullable: true })
  restaurantId?: any;

  @Field({ nullable: true })
  restaurantName?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}

// Full drill-down for one restaurant: profile + staff + counts + recent orders.
@ObjectType()
export class AdminRestaurantDetail {
  @Field(() => ID)
  _id: any;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field()
  currency: string;

  @Field()
  isActive: boolean;

  @Field(() => RestaurantStatus)
  status: RestaurantStatus;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field(() => Int)
  menuItemCount: number;

  @Field(() => Int)
  tableCount: number;

  @Field(() => Int)
  orderCount: number;

  @Field(() => Float)
  revenue: number;

  @Field(() => [AdminUserView])
  staff: AdminUserView[];

  @Field(() => [OrderModel])
  recentOrders: OrderModel[];

  @Field()
  createdAt: Date;
}

// One day on the platform trend charts.
@ObjectType()
export class PlatformTimePoint {
  @Field()
  date: string;

  @Field(() => Float)
  revenue: number;

  @Field(() => Int)
  orders: number;

  @Field(() => Int)
  signups: number;
}
