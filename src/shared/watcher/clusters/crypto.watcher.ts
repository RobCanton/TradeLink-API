import { Logger } from '@nestjs/common';
import { Market } from '../../../models/market.model';
import { RedisService } from '../../redis/redis.service';
import { Watcher } from './watcher';
import { WatcherDelegate, Message, Crypto } from '../../../models/watcher.model';
//import { CryptoConsumer } from '../consumers/crypto_consumer';

export class CryptoWatcher extends Watcher {

  //private consumer:CryptoConsumer;

  private permalink = "BTC-USD";

  constructor(
    delegate: WatcherDelegate,
    apiKey: string,
    redisService: RedisService) {

    super(Market.Cluster.crypto, delegate, apiKey, redisService);


    //this.consumer = new CryptoConsumer(firebaseService, redisService);
  }

  async onConnect() {
    // console.log('onConnect');
    // await this.redisService.sadd(`watchers_${this.cluster}:${this.permalink}`, 'permalink');


    // this.subscribeToSymbol(this.permalink);
  }

  onDisconnect() {

  }

  nextTick() {
    //this.consumer.nextTick();
  }

  handleMessage(msg: Message) {
    if (msg == undefined || msg == null) {
      return;
    }

    //this.logger.log(`Message [${msg.ev}.${msg.}]`);
    switch (msg.ev) {
      case "XQ":
      let quote = msg as Crypto.QuoteMessage;
      this.delegate.sendMessage(msg.ev, quote.pair, quote);
      break;
      case "XT":
      let trade = msg as Crypto.TradeMessage;
      //this.consumer.consumeTrade(trade);
      this.delegate.sendMessage(msg.ev, trade.pair, trade);
      break;
      case "XA":
      let aggregate = msg as Crypto.AggregateMessage;
      //console.dir(aggregate);
      //this.delegate.sendMessage(msg.ev, aggregate.pair, aggregate);
      //this.consumer.consumeAggregate(aggregate);
      break;
      default:
      break;
    }
  }

  async subscribeToSymbol(symbol: string) {
    this.sendWebsocketMessage(`{"action":"subscribe","params":"XT.${symbol}"}`);
  }

  async subscribeToSymbols(symbol: string[]) {

  }

  async unsubscribeFrom(symbol: string) {
    this.sendWebsocketMessage(`{"action":"unsubscribe","params":"XT.${symbol}"}`);
    /*
    let socketSymbol = "BTC-USD";//await this.marketService.socketSymbol(symbol);
    try {
      let results = await this.redisService.hgetall(`${this.cluster}_watchers:${symbol}`) as string[];
      if (results) {
        this.logger.log(`Remain subscribed to ${symbol}: other watchers`);
        return;
      } else {
        this.logger.log(`Unsubscribe from ${symbol}`);
        this.sendWebsocketMessage(`{"action":"unsubscribe","params":"XQ.${socketSymbol},XT.${socketSymbol},XA.${socketSymbol}"}`);
        await this.redisService.srem(`${this.cluster}_watchlist`, symbol);
      }
    } catch (error) {
      console.log(error);
      return;
    }*/
  }


}
