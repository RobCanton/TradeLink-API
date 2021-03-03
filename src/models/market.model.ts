// MARKET
export enum MarketType {
  stocks = "stocks",
  forex = "forex",
  crypto = "crypto"
}


export namespace Market {
  export enum Cluster {
    none = "none",
    stocks = "stocks",
    forex = "forex",
    crypto = "crypto"
  }

  export interface Item {
    symbol: string
    base: string
    socketSymbol: string
    name: string
    cluster: Cluster
  }

}
