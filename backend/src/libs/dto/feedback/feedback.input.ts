// models/feedback.model.ts
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsOptional, Max, MaxLength, Min } from 'class-validator';

@InputType()
export class SubmitFeedbackInput {
  @Field(() => ID)
  restaurantId: any;

  @Field(() => ID, { nullable: true })
  orderId?: any;

  @Field(() => Int)
  @Min(1)
  @Max(5)
  rating: number;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(1000)
  comment?: string;

  @Field({ nullable: true, defaultValue: 'en' })
  @IsOptional()
  @MaxLength(10)
  language?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Min(0)
  tableNumber?: number;
}
