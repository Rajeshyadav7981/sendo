import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from '../../config/app.config';
import { Diesel } from './entities/diesel.entity';
import { Expense } from './entities/expense.entity';
import { OilService } from './entities/oil-service.entity';
import { OtherExpense } from './entities/other-expense.entity';
import { SparePart } from './entities/spare-part.entity';
import { TruckMaintenance } from './entities/truck-maintenance.entity';
import { TyreReplacement } from './entities/tyre-replacement.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { DieselService } from './services/diesel.service';
import { ExpenseService } from './services/expense.service';
import { MultipartHelper } from './services/multipart.helper';
import { OilServiceService } from './services/oil-service.service';
import { SparePartService } from './services/spare-part.service';
import { TruckMaintenanceService } from './services/truck-maintenance.service';
import { TyreService } from './services/tyre.service';
import { VehicleController } from './vehicle.controller';
import { VehicleOpsController } from './vehicle-ops.controller';
import { VehicleService } from './services/vehicle.service';
import { WheelseyeService } from './services/wheelseye.service';
import { DocumentExpiryWatchdog } from './services/document-expiry.watchdog';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      VehicleDocument,
      Diesel,
      OilService,
      SparePart,
      Expense,
      OtherExpense,
      TruckMaintenance,
      TyreReplacement,
    ]),
    ConfigModule.forFeature(appConfig),
  ],
  controllers: [VehicleController, VehicleOpsController],
  providers: [
    VehicleService,
    DieselService,
    OilServiceService,
    SparePartService,
    ExpenseService,
    TruckMaintenanceService,
    TyreService,
    WheelseyeService,
    MultipartHelper,
    DocumentExpiryWatchdog,
  ],
  exports: [VehicleService, MultipartHelper, TypeOrmModule],
})
export class VehicleModule {}
