import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload } from './models/auth-payload.model';
import { LoginInput, RegisterInput, AddStaffInput } from './dto/auth.input';
import { UserModel } from '../users/models/user.model';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Query(() => UserModel)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: any): Promise<UserModel> {
    return user;
  }

  // Only the restaurant owner/admin may create staff accounts — STAFF cannot.
  @Mutation(() => UserModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_ADMIN)
  async addStaff(
    @Args('input') input: AddStaffInput,
    @CurrentUser() user: any,
  ): Promise<UserModel> {
    return this.authService.addStaff(input, user);
  }
}
