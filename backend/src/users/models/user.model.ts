import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRole } from '../../common/enums';

@ObjectType()
export class UserModel {
  @Field(() => ID)
  _id: any;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => ID, { nullable: true })
  restaurantId?: any;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}
