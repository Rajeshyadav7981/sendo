import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../../config/app.config';
import storageConfig from '../../config/storage.config';
import { StorageService } from './storage.service';
import { UploadController } from './upload.controller';

@Global()
@Module({
  imports: [ConfigModule.forFeature(appConfig), ConfigModule.forFeature(storageConfig)],
  controllers: [UploadController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
