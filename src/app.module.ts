import { Module, NestModule, MiddlewareConsumer  } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './shared/redis/redis.module';
import { WatcherModule } from './shared/watcher/watcher.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    RedisModule.register({
      url: process.env.REDIS
    }),
    WatcherModule.register({
      api_key: process.env.POLYGON_API_KEY
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule  implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
