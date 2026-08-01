import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { TableSessionStatus } from '../../enums/table-session.enum';
import { OrderModel } from '../order/order';

@ObjectType()
export class TableSessionModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID)
  restaurantId: any;

  @Field(() => ID)
  tableId: any;

  @Field(() => Int)
  tableNumber: number;

  @Field(() => TableSessionStatus)
  status: TableSessionStatus;

  // Running total while OPEN, final bill once CLOSED.
  @Field(() => Float)
  totalAmount: number;

  @Field(() => [OrderModel])
  orders: OrderModel[];

  @Field()
  lastOrderAt: Date;

  @Field({ nullable: true })
  closedAt?: Date;

  @Field()
  createdAt: Date;
}
