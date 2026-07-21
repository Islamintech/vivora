import {
  Field,
  Float,
  ID,
  InputType,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../../common/enums';

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

  @Field(() => Int)
  tableNumber: number;

  @Field(() => [OrderItemModel])
  items: OrderItemModel[];

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  totalAmount: number;

  @Field({ nullable: true })
  customerNote?: string;

  @Field()
  language: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// --- DTOs ---

@InputType()
export class OrderItemInput {
  @Field(() => ID)
  menuItemId: any;

  @Field(() => Int)
  @Min(1)
  @Max(100)
  quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(300)
  notes?: string;
}

@InputType()
export class PlaceOrderInput {
  @Field(() => ID)
  restaurantId: any;

  @Field(() => Int)
  @Min(1)
  tableNumber: number;

  @Field(() => [OrderItemInput])
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  customerNote?: string;

  @Field({ nullable: true, defaultValue: 'en' })
  @IsOptional()
  @MaxLength(10)
  language?: string;
}

// Staff-side: append items (taken verbally by a waiter) to an open table
// session so the final bill is correct.
@InputType()
export class AddOrderToSessionInput {
  @Field(() => ID)
  sessionId: any;

  @Field(() => [OrderItemInput])
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => ID)
  orderId: any;

  @Field(() => OrderStatus)
  status: OrderStatus;
}
