import { Controller, Get, Post, Delete, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Market } from './models/market.model';
import { Subscription } from './models/subscription.model';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getWatchlist() {
    return this.appService.getWatchlist();
  }

  @Post()
  subscribe(
    @Body('key') key: string,
    @Body('cluster') cluster: string,
    @Body('symbol') symbol:string
  ) {

    let subscription:Subscription = {
      key: key,
      cluster: cluster as Market.Cluster,
      symbol: symbol
    };

    return this.appService.subscribeTo(subscription);
  }

  @Delete()
  unsubscribe(
    @Body('key') key: string,
    @Body('cluster') cluster: string,
    @Body('symbol') symbol:string
  ) {
    let subscription:Subscription = {
      key: key,
      cluster: cluster as Market.Cluster,
      symbol: symbol
    };

    return this.appService.unsubscribeFrom(subscription);
  }

  @Delete('clear')
  clearAll() {
    return this.appService.clearAll();
  }
}
