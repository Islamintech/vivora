import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { OrderStatus, OrderType } from '../../enums/order.enum';

@ObjectType()
export class OrderItemModel {
  @Field(() => ID)
  menuItemId: any;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  quantity: number;

  @Field({ nullable: true })
  notes?: string;
}
@ObjectType()
export class OrderModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID)
  restaurantId: any;

  @Field(() => ID)
  tableId: any;

  @Field(() => ID, { nullable: true })
  sessionId?: any;

  @Field(() => Int, { nullable: true })
  tableNumber?: number | null;

  @Field(() => [OrderItemModel])
  items: OrderItemModel[];

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => OrderType)
  orderType: OrderType;

  @Field(() => Float)
  totalAmount: number;

  @Field({ nullable: true })
  customerNote?: string;

  @Field({ nullable: true })
  customerName?: string;

  @Field({ nullable: true })
  customerPhone?: string;

  @Field(() => Date, { nullable: true })
  scheduledFor?: Date | null;

  @Field()
  language: string;

  @Field()
  isPaid: boolean;

  @Field({ nullable: true })
  paidAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
