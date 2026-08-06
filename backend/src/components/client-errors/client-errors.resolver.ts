import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ClientErrorsService } from './client-errors.service';
import { ReportClientErrorInput } from '../../libs/dto/client-error/client-error.input';
import { GqlThrottlerGuard } from '../auth/guards/auth.guard';
import { RestaurantsService } from '../restaurants/restaurants.service';

@Resolver()
export class ClientErrorsResolver {
  constructor(
    private clientErrors: ClientErrorsService,
    private restaurants: RestaurantsService,
  ) {}

  /**
   * Public: the guests who hit a broken menu image are never logged in, so
   * this cannot require a session. Three defences instead - a tight per-IP
   * throttle here, length caps on the input, and an hourly ceiling on how many
   * of these may raise a Telegram alert (see ClientErrorsService).
   *
   * Returns true whether or not the report was acted on. A caller learns
   * nothing about the platform from it, and a browser has no use for the
   * distinction.
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async reportClientError(
    @Args('input') input: ReportClientErrorInput,
  ): Promise<boolean> {
    // Resolve the slug ourselves rather than trusting a client-supplied id -
    // otherwise anyone could file errors against another restaurant.
    let restaurantId: string | undefined;
    if (input.restaurantSlug) {
      const r = await this.restaurants
        .findBySlug(input.restaurantSlug)
        .catch(() => null);
      restaurantId = r?._id?.toString();
    }
    await this.clientErrors.report(input, restaurantId);
    return true;
  }
}
