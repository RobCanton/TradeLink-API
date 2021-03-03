import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from './shared/redis/redis.service';
import { WatcherService } from './shared/watcher/watcher.service';
import { Market } from './models/market.model';

interface Subscription {
  key: string
  cluster: string
  symbol: string
}

@Injectable()
export class AppService {

  private logger: Logger = new Logger('AppService');
  private subscribeTo_channel = "subscribeTo";
  private unsubscribeFrom_channel = "unsubscribeFrom";

  constructor(
    private readonly redisService:RedisService,
    private readonly watcherService:WatcherService
  ) {
    setTimeout(()=> {
      this.initialize();
    }, 1000);
  }
  getHello(): string {
    return 'Hello World!';
  }

  @Cron('*/30 * * * * *')
  async ping() {
    this.logger.log("Ping!");
    this.redisService.publish("ping", "Ping!");
  }

  private async initialize() {
    this.logger.log("Initalizing...");

    this.redisService.onMessage((channel, message) => {
      let subscription:Subscription = JSON.parse(message);
      switch (channel) {
        case this.subscribeTo_channel:
        this.subscribeTo(subscription);
        break;
        case this.unsubscribeFrom_channel:
        this.unsubscribeFrom(subscription);
        break;
        default:
        break;
      }

    })

    this.redisService.subscribe(this.subscribeTo_channel);
    this.redisService.subscribe(this.unsubscribeFrom_channel);

    this.logger.log("Initialized.");
  }

  private async subscribeTo(subscription:Subscription) {
    let watcherKey = `watchers_${subscription.cluster}:${subscription.symbol}`;
    let memberKey = subscription.key;

    let watcher = await this.redisService.sismember(watcherKey, memberKey);
    if (watcher != 0) {
      this.logger.log(`${watcherKey}: ${memberKey} is already watching`);
      return;
    }

    this.logger.log(`${watcherKey} - ${memberKey} = ${watcher}`);

    await this.redisService.sadd(watcherKey, memberKey);
    await this.watcherService.subscribeTo(subscription.symbol, Market.Cluster.crypto);

  }

  private async unsubscribeFrom(subscription:Subscription) {
    let watcherKey = `watchers_${subscription.cluster}:${subscription.symbol}`;
    let memberKey = subscription.key;
    await this.redisService.srem(watcherKey, memberKey);

    let members = await this.redisService.smembers(watcherKey) as string[];

    if (members.length == 0) {
      console.log(`unsub: ${subscription.symbol}`);
      await this.watcherService.unsubscribeFrom(subscription.symbol, Market.Cluster.crypto);
    }

  }



}
