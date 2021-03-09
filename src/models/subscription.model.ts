import { Market } from './market.model';

export interface Subscription {
  key: string
  cluster: Market.Cluster
  symbol: string
}
