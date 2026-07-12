import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TableModel, CreateTableInput, UpdateTableInput } from './models/table.model';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { GqlAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Resolver(() => TableModel)
export class TablesResolver {
  constructor(
    private tablesService: TablesService,
    private restaurantsService: RestaurantsService,
  ) {}

  @Query(() => [TableModel])
  @UseGuards(GqlAuthGuard)
  async tables(@CurrentUser() user: any): Promise<TableModel[]> {
    return this.tablesService.findByRestaurant(user.restaurantId?.toString());
  }

  @Mutation(() => TableModel)
  @UseGuards(GqlAuthGuard)
  async createTable(
    @Args('input') input: CreateTableInput,
    @CurrentUser() user: any,
  ): Promise<TableModel> {
    const restaurantId = user.restaurantId?.toString();
    const restaurant = await this.restaurantsService.findById(restaurantId);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return this.tablesService.create(restaurantId, restaurant.slug, input, frontendUrl);
  }

  @Mutation(() => TableModel)
  @UseGuards(GqlAuthGuard)
  async updateTable(
    @Args('input') input: UpdateTableInput,
    @CurrentUser() user: any,
  ): Promise<TableModel> {
    return this.tablesService.update(user.restaurantId?.toString(), input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteTable(
    @Args('tableId', { type: () => ID }) tableId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.tablesService.delete(user.restaurantId?.toString(), tableId);
  }

  @Mutation(() => TableModel)
  @UseGuards(GqlAuthGuard)
  async regenerateQrCode(
    @Args('tableId', { type: () => ID }) tableId: string,
    @CurrentUser() user: any,
  ): Promise<TableModel> {
    const restaurantId = user.restaurantId?.toString();
    const restaurant = await this.restaurantsService.findById(restaurantId);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return this.tablesService.regenerateQr(restaurantId, tableId, restaurant.slug, frontendUrl);
  }
}
