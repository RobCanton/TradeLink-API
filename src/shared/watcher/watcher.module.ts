import { Module, DynamicModule, Global, HttpModule } from '@nestjs/common';
import { WatcherService } from './watcher.service';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: []
})
export class WatcherModule {
  static register(options): DynamicModule {
    return {
      module: WatcherModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        WatcherService
      ],
      exports: [WatcherService]
    };
  }
}
