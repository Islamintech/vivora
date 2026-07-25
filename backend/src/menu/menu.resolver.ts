import { Resolver, Query, Mutation, Args, ID, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import {
  MenuCategoryModel,
  MenuItemModel,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  UpdateItemAvailabilityInput,
} from './models/menu.model';
import { GqlAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { AnalyticsService } from '../analytics/analytics.service';

@ObjectType()
class PublicMenuSection {
  @Field(() => MenuCategoryModel)
  category: MenuCategoryModel;

  @Field(() => [MenuItemModel])
  items: MenuItemModel[];
}

@Resolver()
export class MenuResolver {
  constructor(
    private menuService: MenuService,
    private restaurantsService: RestaurantsService,
    private analyticsService: AnalyticsService,
  ) {}

  // Public query — no auth required
  @Query(() => [PublicMenuSection])
  async publicMenu(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ) {
    // Only approved/active restaurants expose their menu to customers.
    await this.restaurantsService.assertServable(restaurantId);
    const [sections, topIds] = await Promise.all([
      this.menuService.getPublicMenu(restaurantId),
      // Sales-based recommendations: the true top sellers of the last 30 days
      // get a "best seller" badge, independent of the owner's manual flag.
      this.analyticsService.topSellingItemIds(restaurantId, 30, 5),
    ]);
    const top = new Set(topIds);
    return sections.map((s) => ({
      category: s.category,
      items: s.items.map((it) => ({
        ...it.toObject(),
        isBestSeller: top.has(it._id.toString()),
      })),
    }));
  }

  @Query(() => [MenuCategoryModel])
  @UseGuards(GqlAuthGuard)
  async categories(@CurrentUser() user: any) {
    return this.menuService.getCategories(user.restaurantId?.toString());
  }

  @Query(() => [MenuItemModel])
  @UseGuards(GqlAuthGuard)
  async menuItems(
    @CurrentUser() user: any,
    @Args('categoryId', { type: () => ID, nullable: true }) categoryId?: string,
  ) {
    return this.menuService.getItems(user.restaurantId?.toString(), categoryId);
  }

  @Mutation(() => MenuCategoryModel)
  @UseGuards(GqlAuthGuard)
  async createCategory(
    @Args('input') input: CreateCategoryInput,
    @CurrentUser() user: any,
  ) {
    return this.menuService.createCategory(user.restaurantId?.toString(), input);
  }

  @Mutation(() => MenuCategoryModel)
  @UseGuards(GqlAuthGuard)
  async updateCategory(
    @Args('input') input: UpdateCategoryInput,
    @CurrentUser() user: any,
  ) {
    return this.menuService.updateCategory(user.restaurantId?.toString(), input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteCategory(
    @Args('categoryId', { type: () => ID }) categoryId: string,
    @CurrentUser() user: any,
  ) {
    return this.menuService.deleteCategory(user.restaurantId?.toString(), categoryId);
  }

  @Mutation(() => MenuItemModel)
  @UseGuards(GqlAuthGuard)
  async createMenuItem(
    @Args('input') input: CreateMenuItemInput,
    @CurrentUser() user: any,
  ) {
    return this.menuService.createItem(user.restaurantId?.toString(), input);
  }

  @Mutation(() => MenuItemModel)
  @UseGuards(GqlAuthGuard)
  async updateMenuItem(
    @Args('input') input: UpdateMenuItemInput,
    @CurrentUser() user: any,
  ) {
    return this.menuService.updateItem(user.restaurantId?.toString(), input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteMenuItem(
    @Args('itemId', { type: () => ID }) itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.menuService.deleteItem(user.restaurantId?.toString(), itemId);
  }

  // Kitchen/chef daily food check — set remaining prep quantity / availability.
  // Open to STAFF and admins (both authenticated, scoped to their restaurant).
  @Mutation(() => MenuItemModel)
  @UseGuards(GqlAuthGuard)
  async updateItemAvailability(
    @Args('input') input: UpdateItemAvailabilityInput,
    @CurrentUser() user: any,
  ) {
    return this.menuService.updateAvailability(user.restaurantId?.toString(), input);
  }
}
