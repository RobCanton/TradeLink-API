import { Logger } from '@nestjs/common';
import { Market } from '../../../models/market.model';
import { Watcher } from './watcher';
import { WatcherDelegate, Message, Stocks } from '../../../models/watcher.model';

export class StocksWatcher extends Watcher {

  private permalink = "AAPL";

  constructor(
    delegate: WatcherDelegate,
    apiKey: string) {

    super(Market.Cluster.stocks, delegate, apiKey);
  }

  async onConnect() {

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

    // this.logger.log(`Message [${msg.ev}]`);
    switch (msg.ev) {
      case "T":
      let trade = msg as Stocks.TradeMessage;
      this.delegate.sendMessage(msg.ev, trade.sym, trade);
      break;
      case "A":
      let aggregate = msg as Stocks.AggregateMessage;
      this.delegate.sendMessage(msg.ev, aggregate.sym, aggregate);
      break;
      default:
      break;
    }
  }

  async subscribeToSymbol(symbol: string) {
    this.sendWebsocketMessage(`{"action":"subscribe","params":"T.${symbol}"}`);
  }

  async subscribeToSymbols(symbols: string[]) {
    let params = this.paramStringForSymbols(symbols, "A");
    this.logger.log("subscribe to: " + params);
    this.sendWebsocketMessage(`{"action":"subscribe","params":"${params}"}`);
  }

  async unsubscribeFrom(symbol: string) {
    this.sendWebsocketMessage(`{"action":"unsubscribe","params":"T.${symbol}"}`);
  }

}
