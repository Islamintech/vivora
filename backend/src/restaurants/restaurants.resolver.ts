import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantModel, UpdateRestaurantInput } from './models/restaurant.model';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole, RestaurantStatus } from '../common/enums';
import { isOpenNow } from './opening-hours';

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
    const servable = await this.restaurantsService.assertServable(restaurant._id.toString());
    // Attach live open/closed so the customer page can gate ordering.
    return { ...servable.toObject(), isOpenNow: isOpenNow(servable) } as RestaurantModel;
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

  // Settings (printer IP, Telegram chat, currency…) are owner-only — a STAFF
  // login is for the kitchen/orders, not for reconfiguring the restaurant.
  @Mutation(() => RestaurantModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_ADMIN)
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
