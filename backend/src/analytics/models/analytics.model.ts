import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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

@InputType()
export class AnalyticsPeriodInput {
  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  // IANA zone of the viewer (e.g. "Asia/Seoul") so daily grouping matches
  // their local midnight instead of UTC. Invalid values fall back to UTC.
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
