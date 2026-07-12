// models/feedback.model.ts
import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, Max, MaxLength, Min } from 'class-validator';

@ObjectType()
export class FeedbackModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID)
  restaurantId: any;

  @Field(() => ID, { nullable: true })
  orderId?: any;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  language: string;

  @Field(() => Int)
  tableNumber: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class FeedbackSummary {
  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  totalCount: number;

  @Field(() => [FeedbackModel])
  recent: FeedbackModel[];
}

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
