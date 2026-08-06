import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { GqlExceptionFilter } from './libs/filters/gql-exception.filter';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './components/health/health.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AuthModule } from './components/auth/auth.module';
import { UsersModule } from './components/users/users.module';
import { RestaurantsModule } from './components/restaurants/restaurants.module';
import { MenuModule } from './components/menu/menu.module';
import { TablesModule } from './components/tables/tables.module';
import { OrdersModule } from './components/orders/orders.module';
import { TableSessionsModule } from './components/table-sessions/table-sessions.module';
import { AnalyticsModule } from './components/analytics/analytics.module';
import { FeedbackModule } from './components/feedback/feedback.module';
import { ErrorLogsModule } from './components/error-logs/error-logs.module';
import { AdminModule } from './components/admin/admin.module';
import { BillingModule } from './components/billing/billing.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { TelegramModule } from './components/telegram/telegram.module';
import { TelegramBotModule } from './components/telegram/telegram-bot.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // In production the schema is generated in memory: writing it to src/
      // needs a source tree and a writable filesystem, neither of which a
      // deployed container is guaranteed to have.
      autoSchemaFile:
        process.env.NODE_ENV === 'production'
          ? true
          : join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
        },
      },
      context: ({ req, connectionParams }) => ({
        req,
        connectionParams,
      }),
    }),
    // Default bucket for endpoints guarded by GqlThrottlerGuard; the public
    // resolvers override per-endpoint with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    // Drives the automatic order-status transitions (see OrdersService).
    ScheduleModule.forRoot(),
    PubSubModule,
    TelegramModule,
    TelegramBotModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MenuModule,
    TablesModule,
    OrdersModule,
    TableSessionsModule,
    AnalyticsModule,
    FeedbackModule,
    ErrorLogsModule,
    AdminModule,
    BillingModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GqlExceptionFilter },
  ],
})
export class AppModule {}
