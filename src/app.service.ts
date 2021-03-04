import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisClient } from './shared/redis/redis.client';
import { WatcherService } from './shared/watcher/watcher.service';
import { Market } from './models/market.model';


interface Subscription {
  key: string
  cluster: Market.Cluster
  symbol: string
}

@Injectable()
export class AppService {

  private logger: Logger = new Logger('AppService');
  private subscribeTo_channel = "subscribeTo";
  private unsubscribeFrom_channel = "unsubscribeFrom";

  private redisSubscriber:RedisClient;
  private redisPublisher:RedisClient;

  constructor(

    private readonly watcherService:WatcherService
  ) {
    this.redisSubscriber = new RedisClient('tradelink_app_sub', process.env.REDIS);
    this.redisPublisher = new RedisClient('tradelink_app_pub', process.env.REDIS);

    setTimeout(()=> {
      this.initialize();
    }, 1000);
  }

  private async initialize() {
    this.logger.log("Initalizing...");

    //let members = await this.redisPublisher.smembers(watcherKey) as string[];
    //console.dir(members);

    this.redisSubscriber.onMessage((channel, message) => {
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

    this.redisSubscriber.subscribe(this.subscribeTo_channel);
    this.redisSubscriber.subscribe(this.unsubscribeFrom_channel);

    this.logger.log("Initialized.");
  }

  private async subscribeTo(subscription:Subscription) {

    console.dir(subscription);
    let symbol = subscription.symbol;
    let cluster = subscription.cluster;

    // Keys
    let watchlistKey = `watchlist:${cluster}`;
    let watcherKey = `watchers_${cluster}:${symbol}`;
    let memberKey = subscription.key;

    // Check if the member is already subscribed
    let watcher = await this.redisPublisher.sismember(watcherKey, memberKey);
    if (watcher != 0) {

      // Member is already subscribed
      this.logger.log(`${watcherKey}: ${memberKey} is already watching`);
      return;
    }

    this.logger.log(`${watcherKey} - ${memberKey} = ${watcher}`);

    // Member is not subscribed
    // Add member and subscribe to websocket
    await this.redisPublisher.sadd(watcherKey, memberKey);
    await this.redisPublisher.sadd(watchlistKey, symbol);
    await this.watcherService.subscribeTo(symbol, cluster);
  }

  private async unsubscribeFrom(subscription:Subscription) {

    let symbol = subscription.symbol;
    let cluster = subscription.cluster;

    // Keys
    let watchlistKey = `watchlist:${cluster}`;
    let watcherKey = `watchers_${cluster}:${symbol}`;
    let memberKey = subscription.key;

    // Remove member
    await this.redisPublisher.srem(watcherKey, memberKey);

    // Check number of remaining members
    let members = await this.redisPublisher.smembers(watcherKey) as string[];

    if (members.length == 0) {
      // No more members for this symbol
      // Unsubscribe from websocket
      this.logger.log(`unsub: ${symbol}`);
      this.redisPublisher.srem(watchlistKey, symbol);
      await this.watcherService.unsubscribeFrom(symbol, cluster);
    }

  }



}
