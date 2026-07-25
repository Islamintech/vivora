import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Module, UseGuards } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingService } from './billing.service';
import { MyBilling, BillingInvoiceModel } from './models/billing.model';
import {
  BillingInvoice,
  BillingInvoiceSchema,
} from './schemas/billing-invoice.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { AuthModule } from '../auth/auth.module';

@Resolver()
export class BillingResolver {
  constructor(private billing: BillingService) {}

  // ── Restaurant owner ──
  @Query(() => MyBilling)
  @UseGuards(GqlAuthGuard)
  async myBilling(@CurrentUser() user: any): Promise<MyBilling> {
    return this.billing.getMyBilling(user.restaurantId?.toString()) as any;
  }

  @Mutation(() => BillingInvoiceModel)
  @UseGuards(GqlAuthGuard)
  async reportInvoicePaid(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
    @CurrentUser() user: any,
  ): Promise<BillingInvoiceModel> {
    return this.billing.reportPaid(user.restaurantId?.toString(), invoiceId) as any;
  }

  // ── Super admin ──
  @Query(() => [BillingInvoiceModel])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async allInvoices(
    @Args('period', { nullable: true }) period?: string,
  ): Promise<BillingInvoiceModel[]> {
    return this.billing.listAll(period) as any;
  }

  @Mutation(() => Number)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async generateInvoices(@Args('period') period: string): Promise<number> {
    return this.billing.generateForPeriod(period);
  }

  @Mutation(() => BillingInvoiceModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async confirmInvoicePaid(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
  ): Promise<BillingInvoiceModel> {
    return this.billing.confirmPaid(invoiceId) as any;
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BillingInvoice.name, schema: BillingInvoiceSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    RestaurantsModule,
    AuthModule,
  ],
  providers: [BillingService, BillingResolver],
})
export class BillingModule {}
