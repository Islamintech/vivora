import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import {
  MenuCategory,
  MenuCategoryDocument,
  MenuItem,
  MenuItemDocument,
} from '../../schemas/Menu.model';
import { CreateCategoryInput, UpdateCategoryInput, CreateMenuItemInput, UpdateMenuItemInput, UpdateItemAvailabilityInput } from '../../libs/dto/menu/menu.input';
import { TranslationService, TARGET_LANGS } from './translation.service';

// Plain (lean) documents rather than Mongoose ones: these are cached and
// handed to several requests at once, so they must not carry per-request
// document state that a caller could mutate.
type PublicMenuSections = {
  category: Record<string, any>;
  items: Record<string, any>[];
}[];

@Injectable()
export class MenuService implements OnModuleInit {
  private readonly logger = new Logger(MenuService.name);

  onModuleInit(): void {
    // A missing key made translation skip silently, which is indistinguishable
    // from a translator that is merely slow - say it once at boot instead.
    if (!this.translation.configured) {
      this.logger.warn(
        'GEMINI_API_KEY is not set - menu translation is disabled and menus will stay in Uzbek.',
      );
    }
  }

  constructor(
    @InjectModel(MenuCategory.name)
    private categoryModel: Model<MenuCategoryDocument>,
    @InjectModel(MenuItem.name)
    private itemModel: Model<MenuItemDocument>,
    private translation: TranslationService,
  ) {}

  /**
   * The customer menu is the only query the whole internet can reach without
   * a login, and every QR scan runs it. Two collection reads per scan is
   * wasted work when a menu changes a few times a day, so hold the assembled
   * result briefly.
   *
   * The TTL is deliberately short and every write invalidates its restaurant
   * anyway: a dish that has just sold out must disappear from the customer's
   * menu, not linger. Cache is per-process, which is coherent today because
   * the API runs as a single instance (see PubSubModule) - if it is ever
   * replicated this becomes a per-instance cache, still correct but with each
   * instance expiring on its own.
   */
  private static readonly PUBLIC_MENU_TTL_MS = 15_000;
  private readonly publicMenuCache = new Map<
    string,
    { at: number; sections: PublicMenuSections }
  >();

  private invalidatePublicMenu(restaurantId?: string | null): void {
    if (restaurantId) this.publicMenuCache.delete(String(restaurantId));
  }

  /**
   * Used by the background translators, which write by document id and never
   * learn which restaurant the row belongs to. Dropping every entry is
   * cheaper than the lookup that would narrow it: the map holds one small
   * object per recently-scanned restaurant and refills on the next request.
   */
  private invalidateAllPublicMenus(): void {
    this.publicMenuCache.clear();
  }

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
        this.invalidateAllPublicMenus();
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
        this.invalidateAllPublicMenus();
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
    this.invalidatePublicMenu(restaurantId);
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
    this.invalidatePublicMenu(restaurantId);
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
    this.invalidatePublicMenu(restaurantId);
    return true;
  }

  // --- Translation backfill ------------------------------------------------

  /**
   * Re-translate anything the fire-and-forget path lost.
   *
   * Translation is deliberately not awaited by the mutation, so a dish saves
   * instantly - but that also means an in-flight call dies with the process.
   * A deploy, a crash, a dev-server rebuild, a 20-second timeout or a missing
   * API key all leave a row untranslated permanently, with nothing to retry it
   * and nothing to notice. That is why menus had untranslated entries: the
   * seed alone loses most of them, since it calls process.exit as soon as the
   * documents are written.
   *
   * This sweep is the durability the original design lacked. It only fills
   * languages that are actually missing, so a translation an owner corrected
   * by hand is never overwritten.
   */
  private static readonly BACKFILL_BATCH = 8;

  @Cron(CronExpression.EVERY_MINUTE)
  async backfillMissingTranslations(): Promise<void> {
    if (!this.translation.configured) return;
    try {
      const cats = await this.findUntranslatedCategories(
        MenuService.BACKFILL_BATCH,
      );
      const items = await this.findUntranslatedItems(
        MenuService.BACKFILL_BATCH - cats.length,
      );
      if (!cats.length && !items.length) return;

      let done = 0;
      // Sequential on purpose: a burst of parallel calls is what trips the
      // free-tier rate limit, and this is background work with no deadline.
      for (const cat of cats) {
        const fresh = await this.translation.translateCategoryName(cat.name);
        if (await this.mergeTranslations(this.categoryModel, cat, fresh)) done++;
      }
      for (const item of items) {
        const fresh = await this.translation.translateMenuText(
          item.name,
          item.description || '',
        );
        if (await this.mergeTranslations(this.itemModel, item, fresh)) done++;
      }
      if (done) this.logger.log(`Backfilled translations for ${done} menu row(s)`);
    } catch (err: any) {
      this.logger.warn(`Translation backfill failed: ${err.message}`);
    }
  }

  /** How many menu rows are still missing a translation. */
  async countUntranslated(): Promise<number> {
    const [cats, items] = await Promise.all([
      this.categoryModel.countDocuments(this.missingFilter()),
      this.itemModel.countDocuments(this.missingFilter()),
    ]);
    return cats + items;
  }

  /** Rows where at least one target language has no name yet. */
  private missingFilter() {
    return {
      $or: TARGET_LANGS.flatMap((lang) => [
        { [`translations.${lang}`]: { $exists: false } },
        { [`translations.${lang}.name`]: { $in: [null, ''] } },
      ]),
    };
  }

  private async findUntranslatedCategories(limit: number) {
    if (limit <= 0) return [];
    return this.categoryModel
      .find(this.missingFilter())
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }

  private async findUntranslatedItems(limit: number) {
    if (limit <= 0) return [];
    return this.itemModel
      .find(this.missingFilter())
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }

  /**
   * Write only the languages that were missing. Merging rather than replacing
   * keeps a hand-corrected translation intact, and stops a failed language
   * from wiping the ones that did come back.
   */
  private async mergeTranslations(
    model: Model<any>,
    doc: { _id: any; name: string; translations?: Record<string, any> },
    fresh: Record<string, { name?: string; description?: string }>,
  ): Promise<boolean> {
    const existing = doc.translations ?? {};
    const set: Record<string, any> = {};
    for (const lang of TARGET_LANGS) {
      if (existing?.[lang]?.name?.trim()) continue; // hand-written or already good
      if (!fresh?.[lang]?.name) continue;
      set[`translations.${lang}`] = fresh[lang];
    }
    if (!Object.keys(set).length) {
      this.logger.warn(`Backfill produced nothing for "${doc.name}"`);
      return false;
    }
    await model.updateOne({ _id: doc._id }, { $set: set });
    this.invalidateAllPublicMenus();
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
    this.invalidatePublicMenu(restaurantId);
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
    this.invalidatePublicMenu(restaurantId);
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
    this.invalidatePublicMenu(restaurantId);

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
    this.invalidatePublicMenu(restaurantId);
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

    this.invalidatePublicMenu(restaurantId);
    return item.save();
  }

  // Undo a reservation (e.g. when a later item in the same order fails).
  async releaseQuantity(
    restaurantId: string,
    itemId: string,
    qty: number,
  ): Promise<MenuItemDocument | null> {
    // Selling out (and coming back) changes what the customer menu shows, so
    // the cached copy cannot outlive the reservation that caused it.
    this.invalidatePublicMenu(restaurantId);
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
    this.invalidatePublicMenu(restaurantId);
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

  async getPublicMenu(restaurantId: string): Promise<PublicMenuSections> {
    const key = String(restaurantId);
    const hit = this.publicMenuCache.get(key);
    if (hit && Date.now() - hit.at < MenuService.PUBLIC_MENU_TTL_MS) {
      return hit.sections;
    }

    const [categories, items] = await Promise.all([
      this.categoryModel
        .find({ restaurantId, isActive: true })
        .sort({ order: 1 })
        .lean()
        .exec(),
      // Sold-out dishes are returned, not filtered out. A dish that simply
      // vanishes reads as "they never sell this"; shown greyed and marked
      // sold out, it tells the guest it exists and to ask again tomorrow.
      // Ordering is refused server-side either way (see placeOrder).
      this.itemModel.find({ restaurantId }).lean().exec(),
    ]);

    // Group once by category instead of scanning every item per category:
    // a 12-category, 200-item menu did 2,400 comparisons per scan.
    const byCategory = new Map<string, Record<string, any>[]>();
    for (const item of items) {
      const catId = String(item.categoryId);
      const bucket = byCategory.get(catId);
      if (bucket) bucket.push(item);
      else byCategory.set(catId, [item]);
    }

    const sections = categories.map((cat) => ({
      category: cat,
      items: byCategory.get(String(cat._id)) ?? [],
    }));

    this.publicMenuCache.set(key, { at: Date.now(), sections });
    return sections;
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
