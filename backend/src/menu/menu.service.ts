import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { TranslationService } from './translation.service';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectModel(MenuCategory.name)
    private categoryModel: Model<MenuCategoryDocument>,
    @InjectModel(MenuItem.name)
    private itemModel: Model<MenuItemDocument>,
    private translation: TranslationService,
  ) {}

  /**
   * Translate in the background and write the result back.
   *
   * Deliberately not awaited by the mutation: an owner typing up a menu
   * should not wait on a network call per dish, and a translation that fails
   * must leave the dish saved and readable in Uzbek.
   */
  private translateItemInBackground(id: string, name: string, description: string): void {
    if (!this.translation.configured) return;
    void this.translation
      .translateMenuText(name, description)
      .then((translations) => {
        if (!Object.keys(translations).length) return;
        return this.itemModel.updateOne({ _id: id }, { $set: { translations } });
      })
      .catch((err) => this.logger.warn(`Translating item ${id} failed: ${err.message}`));
  }

  private translateCategoryInBackground(id: string, name: string): void {
    if (!this.translation.configured) return;
    void this.translation
      .translateCategoryName(name)
      .then((translations) => {
        if (!Object.keys(translations).length) return;
        return this.categoryModel.updateOne({ _id: id }, { $set: { translations } });
      })
      .catch((err) => this.logger.warn(`Translating category ${id} failed: ${err.message}`));
  }

  async countItemsByRestaurant(restaurantId: string): Promise<number> {
    return this.itemModel.countDocuments({ restaurantId });
  }

  // --- Categories ---

  async createCategory(
    restaurantId: string,
    input: CreateCategoryInput,
  ): Promise<MenuCategoryDocument> {
    // Land new categories at the bottom. Without this every category keeps the
    // schema default of 0, and a sort on a column where every value is equal
    // puts them in whatever order Mongo feels like - so the owner's arrangement
    // would silently rearrange itself.
    const order = input.order ?? (await this.nextCategoryOrder(restaurantId));
    const cat = await this.categoryModel.create({ restaurantId, ...input, order });
    this.translateCategoryInBackground(cat._id.toString(), cat.name);
    return cat;
  }

  async updateCategory(
    restaurantId: string,
    input: UpdateCategoryInput,
  ): Promise<MenuCategoryDocument> {
    const { categoryId, ...update } = input;
    const before = await this.categoryModel.findOne({ _id: categoryId, restaurantId });
    const cat = await this.categoryModel.findOneAndUpdate(
      { _id: categoryId, restaurantId },
      { $set: update },
      { new: true },
    );
    if (!cat) throw new NotFoundException('Category not found');
    // Only when the name actually changed - renaming is rare, and reordering
    // or hiding a category should not spend a translation call.
    if (before && before.name !== cat.name) {
      this.translateCategoryInBackground(cat._id.toString(), cat.name);
    }
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

  private async nextCategoryOrder(restaurantId: string): Promise<number> {
    const last = await this.categoryModel
      .findOne({ restaurantId })
      .sort({ order: -1 })
      .select('order')
      .exec();
    return last ? last.order + 1 : 0;
  }

  /**
   * Persist a drag-and-drop rearrangement: `categoryIds` is the full list in
   * the order the owner wants them.
   *
   * One bulkWrite rather than an update per category - a half-applied reorder
   * leaves duplicate positions, and the owner would see the list jump back to
   * something they never asked for. The restaurantId sits in every filter, so
   * ids belonging to another restaurant simply match nothing.
   */
  async reorderCategories(
    restaurantId: string,
    categoryIds: string[],
  ): Promise<MenuCategoryDocument[]> {
    const valid = categoryIds.filter((id) => Types.ObjectId.isValid(id));
    if (valid.length) {
      await this.categoryModel.bulkWrite(
        valid.map((id, index) => ({
          updateOne: {
            filter: { _id: id, restaurantId },
            update: { $set: { order: index } },
          },
        })),
      );
    }
    return this.getCategories(restaurantId);
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
    const item = await this.itemModel.create({
      restaurantId,
      ...this.withPrimaryImage(input),
    });
    this.translateItemInBackground(item._id.toString(), item.name, item.description);
    return item;
  }

  async updateItem(
    restaurantId: string,
    input: UpdateMenuItemInput,
  ): Promise<MenuItemDocument> {
    const { itemId, ...update } = this.withPrimaryImage(input);
    const before = await this.itemModel.findOne({ _id: itemId, restaurantId });
    const item = await this.itemModel.findOneAndUpdate(
      { _id: itemId, restaurantId },
      { $set: update },
      { new: true },
    );
    if (!item) throw new NotFoundException('Menu item not found');

    // A hand-edited translation wins: the owner corrected it, so do not let
    // the machine overwrite them on the next price change.
    const editedByHand = update.translations !== undefined;
    const textChanged =
      !!before && (before.name !== item.name || before.description !== item.description);
    if (!editedByHand && textChanged) {
      this.translateItemInBackground(item._id.toString(), item.name, item.description);
    }
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
