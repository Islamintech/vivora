import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { UpdateRestaurantInput } from './models/restaurant.model';
import { RestaurantStatus } from '../common/enums';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async create(data: { name: string; ownerId: string | null }): Promise<RestaurantDocument> {
    const baseSlug = slugify(data.name, { lower: true, strict: true });
    const slug = await this.uniqueSlug(baseSlug);
    return this.restaurantModel.create({ ...data, slug });
  }

  async setOwner(restaurantId: string, ownerId: string) {
    return this.restaurantModel.findByIdAndUpdate(
      restaurantId,
      { ownerId },
      { new: true },
    );
  }

  async findById(id: string): Promise<RestaurantDocument | null> {
    // Public flows pass arbitrary IDs — a malformed one is "not found", not a 500.
    if (!id || !Types.ObjectId.isValid(id)) return null;
    return this.restaurantModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<RestaurantDocument | null> {
    return this.restaurantModel.findOne({ slug }).exec();
  }

  async findAll(): Promise<RestaurantDocument[]> {
    return this.restaurantModel.find().sort({ createdAt: -1 }).exec();
  }

  async update(restaurantId: string, input: UpdateRestaurantInput): Promise<RestaurantDocument> {
    const restaurant = await this.restaurantModel.findByIdAndUpdate(
      restaurantId,
      { $set: input },
      { new: true },
    );
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async toggleActive(restaurantId: string): Promise<RestaurantDocument> {
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    restaurant.isActive = !restaurant.isActive;
    return restaurant.save();
  }

  // --- Approval workflow (super admin) ---

  async findByStatus(status: RestaurantStatus): Promise<RestaurantDocument[]> {
    return this.restaurantModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
  }

  async approve(restaurantId: string): Promise<RestaurantDocument> {
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    restaurant.status = RestaurantStatus.APPROVED;
    restaurant.rejectionReason = '';
    restaurant.reviewedAt = new Date();
    restaurant.isActive = true;
    return restaurant.save();
  }

  async reject(restaurantId: string, reason: string): Promise<RestaurantDocument> {
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    restaurant.status = RestaurantStatus.REJECTED;
    restaurant.rejectionReason = reason || '';
    restaurant.reviewedAt = new Date();
    return restaurant.save();
  }

  /**
   * Gate for customer-facing flows (public menu, ordering). Throws unless the
   * restaurant has been approved by a super admin and is not suspended.
   */
  async assertServable(restaurantId: string): Promise<RestaurantDocument> {
    const restaurant = await this.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (restaurant.status !== RestaurantStatus.APPROVED || !restaurant.isActive) {
      throw new ForbiddenException(
        'This restaurant is not currently accepting orders',
      );
    }
    return restaurant;
  }

  // Used to roll back a half-finished registration; not exposed via the API.
  async deleteById(restaurantId: string): Promise<void> {
    await this.restaurantModel.findByIdAndDelete(restaurantId);
  }

  async countAll(): Promise<number> {
    return this.restaurantModel.countDocuments();
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let count = 0;
    while (await this.restaurantModel.exists({ slug })) {
      count++;
      slug = `${base}-${count}`;
    }
    return slug;
  }
}
