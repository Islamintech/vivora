import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

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
