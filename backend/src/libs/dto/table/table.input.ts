import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsOptional, MaxLength, Min, MinLength } from 'class-validator';

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
