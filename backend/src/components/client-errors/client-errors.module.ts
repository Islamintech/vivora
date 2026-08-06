import { Module } from '@nestjs/common';
import { ClientErrorsService } from './client-errors.service';
import { ClientErrorsResolver } from './client-errors.resolver';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [RestaurantsModule],
  providers: [ClientErrorsService, ClientErrorsResolver],
})
export class ClientErrorsModule {}
