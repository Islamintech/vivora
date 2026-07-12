import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, MaxLength, Min, MinLength } from 'class-validator';

@ObjectType()
export class TableModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID)
  restaurantId: any;

  @Field(() => Int)
  number: number;

  @Field()
  name: string;

  @Field()
  qrCodeDataUrl: string;

  @Field(() => Int)
  capacity: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}

@InputType()
export class CreateTableInput {
  @Field(() => Int)
  @Min(1)
  number: number;

  @Field()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  capacity?: number;
}

@InputType()
export class UpdateTableInput {
  @Field(() => ID)
  tableId: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  capacity?: number;

  @Field({ nullable: true })
  isActive?: boolean;
}
