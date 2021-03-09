import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisClient } from './shared/redis/redis.client';
import { WatcherService } from './shared/watcher/watcher.service';
import { Market } from './models/market.model';
import { Subscription } from './models/subscription.model';

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

    // Subscribe to watchlist
    let clusters = [ Market.Cluster.crypto ];
    for (var i = 0; i < clusters.length; i++) {
      let cluster = clusters[i];
      let symbols = await this.redisPublisher.smembers(`watchlist:${cluster}`) as string[];
      for (var j = 0; j < symbols.length; j++) {
        await this.watcherService.subscribeTo(symbols[j], cluster);
      }
    }

    // Handle subscription messages
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

  async subscribeTo(subscription:Subscription) {

    let symbol = subscription.symbol;
    let cluster = subscription.cluster;

    // Keys
    let watchlistKey = `watchlist:${cluster}`;
    let watcherKey = `watchers:${cluster}:${symbol}`;
    let memberKey = subscription.key;

    // Check if the member is already subscribed
    let watcher = await this.redisPublisher.sismember(watcherKey, memberKey);
    if (watcher != 0) {

      // Member is already subscribed
      this.logger.log(`${watcherKey}: ${memberKey} is already watching`);
      return;
    }

    this.logger.log(`${watcherKey} ${memberKey} added`);

    // Member is not subscribed
    // Add member and subscribe to websocket
    await this.redisPublisher.sadd(watcherKey, memberKey);
    await this.redisPublisher.sadd(watchlistKey, symbol);
    await this.watcherService.subscribeTo(symbol, cluster);
  }

  async unsubscribeFrom(subscription:Subscription) {

    let symbol = subscription.symbol;
    let cluster = subscription.cluster;

    // Keys
    let watchlistKey = `watchlist:${cluster}`;
    let watcherKey = `watchers:${cluster}:${symbol}`;
    let memberKey = subscription.key;

    // Remove member
    let response = await this.redisPublisher.srem(watcherKey, memberKey);
    if (response) {
      this.logger.log(`${watcherKey} ${memberKey} removed`);
    }

    // Check number of remaining members
    let members = await this.redisPublisher.smembers(watcherKey) as string[];

    if (members.length == 0) {
      // No more members for this symbol
      // Unsubscribe from websocket
      this.redisPublisher.srem(watchlistKey, symbol);
      await this.watcherService.unsubscribeFrom(symbol, cluster);
    }

  }

  async getWatchlist() {
    var response = {};
    
    let clusters = [ Market.Cluster.crypto ];
    for (var i = 0; i < clusters.length; i++) {
      let cluster = clusters[i];
      let symbols = await this.redisPublisher.smembers(`watchlist:${cluster}`) as string[];
      var dict = {};
      for (var j = 0; j < symbols.length; j++) {
        let symbol = symbols[j];
        await this.watcherService.subscribeTo(symbol, cluster);

        let members = await this.redisPublisher.smembers(`watchers:${cluster}:${symbol}`) as string[];
        dict[symbol] = members;
      }

      response[cluster] = dict;
    }

    return response;
  }

  async clearAll() {
      await this.redisPublisher.flushall();
  }

}
