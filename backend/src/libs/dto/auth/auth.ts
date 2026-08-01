import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../user/user';

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => UserModel)
  user: UserModel;
}
