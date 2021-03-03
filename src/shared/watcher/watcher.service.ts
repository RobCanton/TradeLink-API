import { Injectable, Inject, HttpService, InternalServerErrorException, Logger } from '@nestjs/common';
import * as WebSocket from "ws";
import { RedisService } from '../redis/redis.service';
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

  constructor(@Inject('CONFIG_OPTIONS') private options,
    private readonly redisService: RedisService
  ) {

    this.watchers = {};
    this.watchers[Market.Cluster.stocks] = new StocksWatcher(this, this.options.api_key, redisService);
    this.watchers[Market.Cluster.crypto] = new CryptoWatcher(this, this.options.api_key, redisService);

  }

  @Cron('*/6 * * * * *')
  keepAlive() {
    // console.log(`keepAlive`);
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
    this.redisService.publish('data', JSON.stringify(data));
    //console.log(`${symbol}: ${Date.now()}`);

  }


}
