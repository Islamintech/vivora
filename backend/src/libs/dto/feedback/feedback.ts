// models/feedback.model.ts
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

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
