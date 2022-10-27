import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './application/services/typeorm-config.service';
import { SERVICES as APP_SERVICES } from './application/services';
import { CONTROLLERS as API_CONTROLLERS } from './application/api';
import { ORM_ENTITIES } from './domain/entities';
import { PROVIDERS as USE_CASE_PROVIDERS } from './domain/use-cases';
import { PROVIDERS as GATEWAY_PROVIDERS } from './infrastructure/gateways';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(ORM_ENTITIES),
  ],
  controllers: [...API_CONTROLLERS],
  providers: [...APP_SERVICES, ...USE_CASE_PROVIDERS, ...GATEWAY_PROVIDERS],
})
export class AppModule {}
