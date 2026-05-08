import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor])],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService, TypeOrmModule],
})
export class VendorModule {}
