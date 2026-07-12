import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantModel, UpdateRestaurantInput } from './models/restaurant.model';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole, RestaurantStatus } from '../common/enums';

@Resolver(() => RestaurantModel)
export class RestaurantsResolver {
  constructor(private restaurantsService: RestaurantsService) {}

  @Query(() => RestaurantModel)
  @UseGuards(GqlAuthGuard)
  async myRestaurant(@CurrentUser() user: any): Promise<RestaurantModel> {
    return this.restaurantsService.findById(user.restaurantId?.toString());
  }

  @Query(() => RestaurantModel)
  async publicRestaurant(
    @Args('slug') slug: string,
  ): Promise<RestaurantModel> {
    const restaurant = await this.restaurantsService.findBySlug(slug);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    // Customers may only reach approved, active restaurants.
    return this.restaurantsService.assertServable(restaurant._id.toString());
  }

  @Query(() => [RestaurantModel])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async allRestaurants(): Promise<RestaurantModel[]> {
    return this.restaurantsService.findAll();
  }

  // Review queue for the super admin: restaurants awaiting approval.
  @Query(() => [RestaurantModel])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async pendingRestaurants(): Promise<RestaurantModel[]> {
    return this.restaurantsService.findByStatus(RestaurantStatus.PENDING_REVIEW);
  }

  @Mutation(() => RestaurantModel)
  @UseGuards(GqlAuthGuard)
  async updateRestaurant(
    @Args('input') input: UpdateRestaurantInput,
    @CurrentUser() user: any,
  ): Promise<RestaurantModel> {
    return this.restaurantsService.update(user.restaurantId?.toString(), input);
  }

  @Mutation(() => RestaurantModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async adminToggleRestaurant(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ): Promise<RestaurantModel> {
    return this.restaurantsService.toggleActive(restaurantId);
  }

  @Mutation(() => RestaurantModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async approveRestaurant(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ): Promise<RestaurantModel> {
    return this.restaurantsService.approve(restaurantId);
  }

  @Mutation(() => RestaurantModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async rejectRestaurant(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<RestaurantModel> {
    return this.restaurantsService.reject(restaurantId, reason ?? '');
  }
}
