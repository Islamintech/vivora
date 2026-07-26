import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MenuCategory,
  MenuCategoryDocument,
  MenuItem,
  MenuItemDocument,
} from './schemas/menu.schema';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  UpdateItemAvailabilityInput,
} from './models/menu.model';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(MenuCategory.name)
    private categoryModel: Model<MenuCategoryDocument>,
    @InjectModel(MenuItem.name)
    private itemModel: Model<MenuItemDocument>,
  ) {}

  async countItemsByRestaurant(restaurantId: string): Promise<number> {
    return this.itemModel.countDocuments({ restaurantId });
  }

  // --- Categories ---

  async createCategory(
    restaurantId: string,
    input: CreateCategoryInput,
  ): Promise<MenuCategoryDocument> {
    return this.categoryModel.create({ restaurantId, ...input });
  }

  async updateCategory(
    restaurantId: string,
    input: UpdateCategoryInput,
  ): Promise<MenuCategoryDocument> {
    const { categoryId, ...update } = input;
    const cat = await this.categoryModel.findOneAndUpdate(
      { _id: categoryId, restaurantId },
      { $set: update },
      { new: true },
    );
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async deleteCategory(restaurantId: string, categoryId: string): Promise<boolean> {
    const cat = await this.categoryModel.findOneAndDelete({
      _id: categoryId,
      restaurantId,
    });
    if (!cat) throw new NotFoundException('Category not found');
    await this.itemModel.deleteMany({ categoryId, restaurantId });
    return true;
  }

  async getCategories(restaurantId: string): Promise<MenuCategoryDocument[]> {
    return this.categoryModel
      .find({ restaurantId })
      .sort({ order: 1 })
      .exec();
  }

  // --- Items ---

  // A dish can carry several photos, but plenty of places want exactly one
  // (list thumbnails, kitchen tickets). Keep imageUrl pinned to the first of
  // them so those callers never have to know about the gallery.
  private withPrimaryImage<T extends { images?: string[]; imageUrl?: string }>(
    input: T,
  ): T {
    if (!input.images) return input;
    return { ...input, imageUrl: input.images[0] ?? '' };
  }

  async createItem(
    restaurantId: string,
    input: CreateMenuItemInput,
  ): Promise<MenuItemDocument> {
    return this.itemModel.create({ restaurantId, ...this.withPrimaryImage(input) });
  }

  async updateItem(
    restaurantId: string,
    input: UpdateMenuItemInput,
  ): Promise<MenuItemDocument> {
    const { itemId, ...update } = this.withPrimaryImage(input);
    const item = await this.itemModel.findOneAndUpdate(
      { _id: itemId, restaurantId },
      { $set: update },
      { new: true },
    );
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async deleteItem(restaurantId: string, itemId: string): Promise<boolean> {
    const item = await this.itemModel.findOneAndDelete({ _id: itemId, restaurantId });
    if (!item) throw new NotFoundException('Menu item not found');
    return true;
  }

  // Kitchen/chef availability + prep-quantity update (STAFF or admin).
  // When quantity tracking is on, the remaining quantity governs availability.
  async updateAvailability(
    restaurantId: string,
    input: UpdateItemAvailabilityInput,
  ): Promise<MenuItemDocument> {
    const item = await this.itemModel.findOne({ _id: input.itemId, restaurantId });
    if (!item) throw new NotFoundException('Menu item not found');

    if (input.trackQuantity !== undefined) item.trackQuantity = input.trackQuantity;
    if (input.quantity !== undefined) item.quantity = Math.max(0, input.quantity);
    if (input.isAvailable !== undefined) item.isAvailable = input.isAvailable;

    // If tracking quantity, the remaining count is the source of truth.
    if (item.trackQuantity) item.isAvailable = item.quantity > 0;

    return item.save();
  }

  // Undo a reservation (e.g. when a later item in the same order fails).
  async releaseQuantity(
    restaurantId: string,
    itemId: string,
    qty: number,
  ): Promise<MenuItemDocument | null> {
    return this.itemModel.findOneAndUpdate(
      { _id: itemId, restaurantId, trackQuantity: true },
      [
        {
          $set: {
            quantity: { $add: ['$quantity', qty] },
            isAvailable: { $gt: [{ $add: ['$quantity', qty] }, 0] },
          },
        },
      ],
      { new: true },
    );
  }

  // Atomically reserve `qty` of a tracked item for an order. Returns the updated
  // item, or null if not enough remaining. Untracked items always succeed.
  async reserveQuantity(
    restaurantId: string,
    itemId: string,
    qty: number,
  ): Promise<MenuItemDocument | null> {
    return this.itemModel.findOneAndUpdate(
      { _id: itemId, restaurantId, trackQuantity: true, quantity: { $gte: qty } },
      [
        {
          $set: {
            quantity: { $subtract: ['$quantity', qty] },
            isAvailable: { $gt: [{ $subtract: ['$quantity', qty] }, 0] },
          },
        },
      ],
      { new: true },
    );
  }

  async getItems(restaurantId: string, categoryId?: string): Promise<MenuItemDocument[]> {
    const filter: any = { restaurantId };
    if (categoryId) filter.categoryId = categoryId;
    return this.itemModel.find(filter).exec();
  }

  async getPublicMenu(restaurantId: string) {
    const categories = await this.categoryModel
      .find({ restaurantId, isActive: true })
      .sort({ order: 1 })
      .exec();

    const items = await this.itemModel
      .find({ restaurantId, isAvailable: true })
      .exec();

    return categories.map((cat) => ({
      category: cat,
      items: items.filter(
        (item) => item.categoryId.toString() === cat._id.toString(),
      ),
    }));
  }

  async getPopularItems(
    restaurantId: string,
    limit = 10,
  ): Promise<MenuItemDocument[]> {
    return this.itemModel
      .find({ restaurantId, isPopular: true, isAvailable: true })
      .limit(limit)
      .exec();
  }

  async findItemById(itemId: string): Promise<MenuItemDocument | null> {
    if (!Types.ObjectId.isValid(itemId)) return null;
    return this.itemModel.findById(itemId).exec();
  }

  // Scoped lookup for customer orders — an order for restaurant A must never
  // resolve (and price-snapshot) an item belonging to restaurant B.
  async findItemForRestaurant(
    restaurantId: string,
    itemId: string,
  ): Promise<MenuItemDocument | null> {
    if (!Types.ObjectId.isValid(itemId)) return null;
    return this.itemModel.findOne({ _id: itemId, restaurantId }).exec();
  }

  async countByRestaurant(restaurantId: string): Promise<number> {
    return this.itemModel.countDocuments({ restaurantId });
  }
}
