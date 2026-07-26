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
  IsEnum,
  IsOptional,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus, OrderType } from '../../common/enums';

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

  // Omitted for a collection order phoned in - there is no table.
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  tableNumber?: number;

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

  @Field(() => OrderType, { nullable: true, defaultValue: OrderType.DINE_IN })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  // --- Set when staff take the order over the phone ---
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(120)
  customerName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(40)
  customerPhone?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  scheduledFor?: Date;
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

// Staff append a verbally-requested item to an order that's already on the
// board, so the guest still settles a single bill.
@InputType()
export class AddItemsToOrderInput {
  @Field(() => ID)
  orderId: any;

  @Field(() => [OrderItemInput])
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => ID)
  orderId: any;

  @Field(() => OrderStatus)
  status: OrderStatus;
}
