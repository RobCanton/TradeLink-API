
import * as redis from 'redis';

export class RedisClient {
  private client;

  constructor(name:string, url:string) {
    this.client = redis.createClient({
      url: url
    });

    this.client.hset(`clients`, name, Date.now());
  }

  async expire(key: string, timeout: number) {
    return new Promise ((resolve, reject) => {
      this.client.expire(key, timeout, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      })
    })
  }

  async get(key: string) {
    return new Promise ((resolve, reject) => {
      this.client.get(key, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      })
    })

  }

  async set(key: string, value: any, expire?:number) {
    return new Promise( (resolve, reject) => {
      if (expire) {
        this.client.set(key, value, 'EX', expire, function (err, resp) {
          if (err) {
            reject(err);
          } else {
            resolve(resp);
          }
        });
      } else {
        this.client.set(key, value, function (err, resp) {
          if (err) {
            reject(err);
          } else {
            resolve(resp);
          }
        });
      }

    });
  }

  async del(key: string) {
    return new Promise( (resolve, reject) => {
      this.client.del(key, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async delMultiple(keys: string[]) {
    return new Promise ( (resolve, reject) => {
      this.client.del(keys, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      })
    })
  }

  async hset(key: string, field: string, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.hset(key, field, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async hsetnx(key:string, field: string, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.hsetnx(key, field, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async hkeys(key: string) {
    return new Promise( (resolve, reject) => {
      this.client.hkeys(key, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async hmset(key: string, object:any) {
    return new Promise( (resolve, reject) => {
      this.client.hmset(key, object, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      })
    });
  }

  async hget(key: string, field: string) {
    return new Promise ( (resolve, reject) => {
      this.client.hget(key, field, (err, resp) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(resp)
        }
      });
    })
  }

  async hgetall(key: string) {
    return new Promise( (resolve, reject) => {
      this.client.hgetall(key, (err, resp) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(resp);
        }
      })
    });
  }

  async hdel(key: string, field: string) {
    return new Promise( (resolve, reject) => {
      this.client.hdel(key, field, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async sadd(key: string, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.sadd(key, value, function (err, resp) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async srem(key: string, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.srem(key, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async sremMultiple(key: string, values: any[]) {
    return new Promise( (resolve, reject) => {
      this.client.srem(key, values, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async smembers(key: string) {
    return new Promise( (resolve, reject) => {
      this.client.smembers(key, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async sismember(key: string, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.sismember(key, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  /* SORTED SETS */
  async zadd(key: string, score:number, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.zadd(key, score, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }


  async zrem(key: string, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.zrem(key, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async zremMultiple(key: string, values: any[]) {
    return new Promise( (resolve, reject) => {
      this.client.zrem(key, values, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async zrange(key: string, min:number, max:number) {
    return new Promise( (resolve, reject) => {
      this.client.zrange(key, min, max, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async zrangebyscore(key: string, min:number, max:number) {
    return new Promise( (resolve, reject) => {
      this.client.zrangebyscore(key, min, max, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  /* LISTS */
  async rpush(key: string, value: any) {
    return new Promise( (resolve, reject) => {
      this.client.rpush(key, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async rpushMultiple(key: string, args: any[]) {
    return new Promise( (resolve, reject) => {
      this.client.rpush(key, args, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async lrange(key: string, min:Number, max:Number) {
    return new Promise( (resolve, reject) => {
      this.client.lrange(key, min, max, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  async lrem(key: string, count: number, value: string) {
    return new Promise( (resolve, reject) => {
      this.client.lrem(key, count, value, function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  multi() {
    return this.client.multi();
  }

  publish(channel: string, message:string) {
    this.client.publish(channel, message);
  }

  subscribe(channel: string) {
    this.client.subscribe(channel);
  }

  onMessage(handler: (channel:string, message:string) => void) {
    this.client.on("message", handler);
  }

  flushall() {
    this.client.flushall();
  }

}
