import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agreement } from './entities/agreement.entity';
import { Customer } from './entities/customer.entity';
import { CustomerInvoice } from './entities/customer-invoice.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { GstEntry } from './entities/gst-entry.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerInvoice, CustomerPayment, Agreement, GstEntry]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService, TypeOrmModule],
})
export class CustomerModule {}
