import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [AssetsModule],
  controllers: [UploadsController],
})
export class UploadsModule {}

















