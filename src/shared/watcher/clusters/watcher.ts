import { Logger } from '@nestjs/common';
import { Market } from '../../../models/market.model';
import { RedisService } from '../../redis/redis.service';
import * as Models from '../../../models/watcher.model';
import * as WebSocket from "ws"

export abstract class Watcher {

    protected cluster: Market.Cluster;
    protected delegate: Models.WatcherDelegate;
    protected logger: Logger;

    private ws;
    private apiKey;
    private socketURL;
    private isConnectionAlive = false;

    constructor(
      cluster: Market.Cluster,
      delegate: Models.WatcherDelegate,
      apiKey: string,
      protected readonly redisService: RedisService
    ) {
      this.delegate = delegate;
      this.cluster = cluster;
      this.logger = new Logger(`Watcher ${cluster}`);
      this.socketURL = `wss://socket.polygon.io/${cluster}`;

      this.apiKey = apiKey;

      // Connection Opened:
      this.websocketConnect();

    }

    websocketConnect() {
      this.ws = new WebSocket(this.socketURL);
      this.ws.on('open', async () => {
        this.isConnectionAlive = true;
        this.logger.log(`Connected to ${this.socketURL}`);
        this.logger.log(`Authenticating w/: ${this.apiKey}`);
        this.ws.send(`{"action":"auth","params":"${this.apiKey}"}`);

        this.onConnect();
        /*
        let results = await this.redisService.smembers(`${this.cluster}_watchlist`) as string[];
        results.forEach( symbol => {
          this.subscribeToSymbol(symbol);
        })*/
      })

      this.ws.on('pong', () => {
        if (!this.isConnectionAlive) {
          this.logger.log(`Connection is dead: ${this.isConnectionAlive}`);
        }
      })

      this.ws.on('close', async () => {
        this.isConnectionAlive = false;
        if (this.logger) {
          this.logger.log(`Disconnected from ${this.socketURL}`);
        }
        this.onDisconnect();

        this.websocketConnect();
      });

      this.ws.on('message', (data) => {
        data = JSON.parse(data)
        data.map((msg) => {
          if (msg.ev === 'status') {
            this.logger.log(`Message [${msg.message}]`);
            return;
          }

          this.handleMessage(msg as Models.Message);
        })
      })

    }

    ping() {
      if (this.isConnectionAlive) {
        this.ws.ping();
      }
    }

    sendWebsocketMessage(message:string) {
      this.ws.send(message);
    }

    protected paramStringForSymbols(symbols:string[], channel:string):string {
      var params = "";
      symbols.forEach( symbol => {
        if (params == "") {
          params = `${channel}.${symbol}`;
        } else {
          params += `,${channel}.${symbol}`
        }
      })
      return params;
    }

    abstract onConnect():void
    abstract onDisconnect():void
    abstract nextTick():void

    abstract handleMessage(message: any): void

    abstract subscribeToSymbol(symbol: string): void
    abstract subscribeToSymbols(symbols: string[]): void

    abstract unsubscribeFrom(symbol: string): void
}
