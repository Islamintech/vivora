import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { GqlExceptionFilter } from './common/filters/gql-exception.filter';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenuModule } from './menu/menu.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ErrorLogsModule } from './error-logs/error-logs.module';
import { AdminModule } from './admin/admin.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { TelegramModule } from './telegram/telegram.module';
import { TelegramBotModule } from './telegram/telegram-bot.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-platform',
      {
        retryAttempts: 5,
        retryDelay: 2000,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 20,
      },
    ),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
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
    PubSubModule,
    TelegramModule,
    TelegramBotModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MenuModule,
    TablesModule,
    OrdersModule,
    AnalyticsModule,
    FeedbackModule,
    ErrorLogsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GqlExceptionFilter },
  ],
})
export class AppModule {}
