import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FeedbackService } from './feedback.service';
import { FeedbackModel, FeedbackSummary } from '../../libs/dto/feedback/feedback';
import { SubmitFeedbackInput } from '../../libs/dto/feedback/feedback.input';
import { GqlAuthGuard, GqlThrottlerGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/authUser.decorator';

@Resolver()
export class FeedbackResolver {
  constructor(private feedbackService: FeedbackService) {}

  // Public — throttled per IP to curb review spam (shared venue WiFi in mind).
  @Mutation(() => FeedbackModel)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async submitFeedback(@Args('input') input: SubmitFeedbackInput): Promise<FeedbackModel> {
    return this.feedbackService.submit(input);
  }

  @Query(() => FeedbackSummary)
  @UseGuards(GqlAuthGuard)
  async feedbackSummary(@CurrentUser() user: any): Promise<FeedbackSummary> {
    return this.feedbackService.getSummary(user.restaurantId?.toString());
  }

  @Query(() => [FeedbackModel])
  @UseGuards(GqlAuthGuard)
  async feedbackList(@CurrentUser() user: any): Promise<FeedbackModel[]> {
    return this.feedbackService.getByRestaurant(user.restaurantId?.toString());
  }
}
