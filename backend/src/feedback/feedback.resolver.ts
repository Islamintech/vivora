import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackModel, FeedbackSummary, SubmitFeedbackInput } from './models/feedback.model';
import { GqlAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Resolver()
export class FeedbackResolver {
  constructor(private feedbackService: FeedbackService) {}

  @Mutation(() => FeedbackModel)
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
