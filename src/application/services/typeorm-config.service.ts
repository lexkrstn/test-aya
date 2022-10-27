import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  private logger = new Logger(TypeOrmConfigService.name);

  public constructor(private config: ConfigService) {}

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    try {
      const url = new URL(this.config.get<string>('DATABASE_URL'));
      return {
        type: 'postgres',
        host: url.hostname,
        port: parseInt(url.port, 10),
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        autoLoadEntities: true,
        synchronize: true,
      };
    } catch (err) {
      this.logger.error(`DATABASE_URL env is not defined or invalid`);
      throw err;
    }
  }
}
