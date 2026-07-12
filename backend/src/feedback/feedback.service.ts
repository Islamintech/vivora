import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { SubmitFeedbackInput } from './models/feedback.model';
import { RestaurantsService } from '../restaurants/restaurants.service';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    private restaurantsService: RestaurantsService,
  ) {}

  async submit(input: SubmitFeedbackInput): Promise<FeedbackDocument> {
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    // Feedback only for real, live restaurants — otherwise it's junk-data spam.
    await this.restaurantsService.assertServable(input.restaurantId.toString());
    if (input.orderId && !Types.ObjectId.isValid(input.orderId)) {
      throw new BadRequestException('Invalid order id');
    }
    return this.feedbackModel.create(input);
  }

  async getByRestaurant(restaurantId: string, limit = 50): Promise<FeedbackDocument[]> {
    return this.feedbackModel
      .find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getSummary(restaurantId: string) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurant id');
    }
    // Aggregation bypasses Mongoose casting — must match on a real ObjectId.
    const agg = await this.feedbackModel.aggregate([
      { $match: { restaurantId: new Types.ObjectId(restaurantId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const recent = await this.getByRestaurant(restaurantId, 10);

    return {
      averageRating: agg[0]?.averageRating ?? 0,
      totalCount: agg[0]?.totalCount ?? 0,
      recent,
    };
  }
}
