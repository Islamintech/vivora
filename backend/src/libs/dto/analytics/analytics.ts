import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PopularItemStat {
  @Field(() => ID)
  menuItemId: string;

  @Field()
  name: string;

  @Field(() => Int)
  totalOrdered: number;

  @Field(() => Float)
  revenue: number;
}
@ObjectType()
export class DailyRevenue {
  @Field()
  date: string;

  @Field(() => Float)
  revenue: number;

  @Field(() => Int)
  orderCount: number;
}
@ObjectType()
export class TableTurnover {
  @Field(() => Int)
  tableNumber: number;

  @Field()
  tableName: string;

  @Field(() => Int)
  totalOrders: number;

  @Field(() => Float)
  totalRevenue: number;
}
@ObjectType()
export class AnalyticsOverview {
  @Field(() => Float)
  totalRevenue: number;

  // Cash collected via the kitchen board's "To'landi" button.
  @Field(() => Float)
  paidRevenue: number;

  @Field(() => Int)
  paidOrders: number;

  @Field(() => Int)
  totalOrders: number;

  @Field(() => Float)
  averageOrderValue: number;

  @Field(() => Int)
  pendingOrders: number;

  @Field(() => Int)
  servedOrders: number;

  @Field(() => [PopularItemStat])
  popularItems: PopularItemStat[];

  @Field(() => [DailyRevenue])
  dailyRevenue: DailyRevenue[];

  @Field(() => [TableTurnover])
  tableTurnover: TableTurnover[];
}
