import { Logger } from '@nestjs/common';
import { Market } from '../../../models/market.model';
import { Watcher } from './watcher';
import { WatcherDelegate, Message, Crypto } from '../../../models/watcher.model';

export class CryptoWatcher extends Watcher {

  private permalink = "BTC-USD";

  constructor(
    delegate: WatcherDelegate,
    apiKey: string) {

    super(Market.Cluster.crypto, delegate, apiKey);

  }

  async onConnect() {
    this.logger.log(`Websocket connected.`);
  }

  onDisconnect() {
    this.logger.log(`Websocket disconnected.`);
  }

  nextTick() {
    //this.consumer.nextTick();
  }

  handleMessage(msg: Message) {
    if (msg == undefined || msg == null) {
      return;
    }

    switch (msg.ev) {
      case "XQ":
      let quote = msg as Crypto.QuoteMessage;
      this.delegate.sendMessage(msg.ev, quote.pair, quote);
      break;
      case "XT":
      let trade = msg as Crypto.TradeMessage;
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
    this.sendWebsocketMessage(`{"action":"subscribe","params":"XT.${symbol},XA.${symbol}"}`);
  }

  async subscribeToSymbols(symbol: string[]) {

  }

  async unsubscribeFrom(symbol: string) {
    this.sendWebsocketMessage(`{"action":"unsubscribe","params":"XT.${symbol},XA.${symbol}"}`);
  }


}
