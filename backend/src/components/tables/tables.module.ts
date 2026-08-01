import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from '../../schemas/Table.model';
import { TablesService } from './tables.service';
import { TablesResolver } from './tables.resolver';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Table.name, schema: TableSchema }]),
    RestaurantsModule,
  ],
  providers: [TablesService, TablesResolver],
  exports: [TablesService],
})
export class TablesModule {}
