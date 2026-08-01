import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ErrorLogLevel } from '../../enums/error-log.enum';

@ObjectType()
export class ErrorLogModel {
  @Field(() => ID)
  _id: any;

  @Field(() => ID, { nullable: true })
  restaurantId?: any;

  @Field(() => ErrorLogLevel)
  level: ErrorLogLevel;

  @Field()
  message: string;

  @Field({ nullable: true })
  stack?: string;

  @Field({ nullable: true })
  context?: string;

  @Field()
  createdAt: Date;
}
