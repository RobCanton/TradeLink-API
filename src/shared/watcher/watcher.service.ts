import { Injectable, Inject, HttpService, InternalServerErrorException, Logger } from '@nestjs/common';
import * as WebSocket from "ws";
import { RedisClient } from '../redis/redis.client';
import { Dictionary } from '../../models/common.model';
import { Market } from '../../models/market.model';
import * as Models from '../../models/watcher.model';
import { Watcher } from './clusters/watcher';
import { StocksWatcher } from './clusters/stocks.watcher';
import { CryptoWatcher } from './clusters/crypto.watcher';
import { Cron } from '@nestjs/schedule';


@Injectable()
export class WatcherService {

  private logger: Logger = new Logger('WatcherService');
  private watchers:Dictionary<Watcher>;

  updatedItems:Dictionary<Models.Stocks.AggregateMessage> = {};

  private redisPublisher:RedisClient;

  constructor(
    @Inject('CONFIG_OPTIONS') private options,
  ) {

    this.redisPublisher = new RedisClient('tradelink_watcher_pub', process.env.REDIS);

    this.watchers = {};
    this.watchers[Market.Cluster.stocks] = new StocksWatcher(this, this.options.api_key);
    this.watchers[Market.Cluster.crypto] = new CryptoWatcher(this, this.options.api_key);

  }

  @Cron('*/5 * * * * *')
  ping() {
    this.redisPublisher.publish("ping", "Ping!");
    this.watchers[Market.Cluster.stocks].ping();
    this.watchers[Market.Cluster.crypto].ping();
  }

  @Cron('* * * * * *')
  nextTick() {
    this.watchers[Market.Cluster.stocks].nextTick();
    this.watchers[Market.Cluster.crypto].nextTick();
  }

  async subscribeTo(symbol: string, cluster: Market.Cluster):Promise<void> {
    if (cluster == Market.Cluster.none) { return }
    await this.watchers[cluster].subscribeToSymbol(symbol);
    return;
  }

  async subscribeToSymbols(symbols: string[], cluster: Market.Cluster):Promise<void> {
    if (cluster == Market.Cluster.none) { return }
    await this.watchers[cluster].subscribeToSymbols(symbols);
    return;
  }

  async unsubscribeFrom(symbol: string, cluster: Market.Cluster):Promise<void> {
    if (cluster == Market.Cluster.none) { return }
    await this.watchers[cluster].unsubscribeFrom(symbol);
    return;
  }

  sendMessage(ev: string, symbol: string, data: Models.Message) {
    this.redisPublisher.publish(`${ev}.${symbol}`, JSON.stringify(data));
  }


}
