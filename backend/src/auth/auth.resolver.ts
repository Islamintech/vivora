import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthPayload } from './models/auth-payload.model';
import { LoginInput, RegisterInput, AddStaffInput } from './dto/auth.input';
import { UserModel } from '../users/models/user.model';
import { GqlAuthGuard, RolesGuard, GqlThrottlerGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  // Public + writes to the DB — keep signup spam per IP low.
  @Mutation(() => AuthPayload)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  // Brute-force protection: 10 attempts per minute per IP.
  @Mutation(() => AuthPayload)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
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
