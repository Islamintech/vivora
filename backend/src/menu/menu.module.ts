import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuCategory, MenuCategorySchema } from './schemas/menu.schema';
import { MenuItem, MenuItemSchema } from './schemas/menu.schema';
import { MenuService } from './menu.service';
import { MenuResolver } from './menu.resolver';
import { TranslationService } from './translation.service';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MenuCategory.name, schema: MenuCategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
    RestaurantsModule,
    AnalyticsModule,
  ],
  providers: [MenuService, MenuResolver, TranslationService],
  exports: [MenuService],
})
export class MenuModule {}
