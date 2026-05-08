import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CustomerService,
  type ListInvoicesQuery,
  type ListPaymentsQuery,
} from './customer.service';
import { parseBool } from '../../common/utils/pagination.util';
import {
  CreateAgreementDto,
  CreateCustomerDto,
  CreateGstEntryDto,
  CreateInvoiceDto,
  CreatePaymentDto,
} from './dto/customer.dto';

@ApiTags('Customer')
@UseGuards(JwtAuthGuard)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customers: CustomerService) {}

  @Get('invoices')
  invoices(@Query() q: Record<string, string>) {
    return this.customers.listInvoices(q as ListInvoicesQuery);
  }

  @Post('invoices')
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.customers.createInvoice(dto);
  }

  @Get('payment-status')
  payments(@Query() q: Record<string, string>) {
    return this.customers.listPayments({
      ...(q as ListPaymentsQuery),
      balanceDueGt0: parseBool(q.balanceDueGt0),
    });
  }

  @Post('payment-status')
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.customers.createPayment(dto);
  }

  @Get('agreements')
  agreements() {
    return this.customers.listAgreements();
  }

  @Post('agreements')
  createAgreement(@Body() dto: CreateAgreementDto) {
    return this.customers.createAgreement(dto);
  }

  @Get('gst')
  gst() {
    return this.customers.listGst();
  }

  @Post('gst')
  createGst(@Body() dto: CreateGstEntryDto) {
    return this.customers.createGst(dto);
  }

  // Customer onboarding (no path in legacy router but the model is here)
  @Get('list')
  list() {
    return this.customers.list();
  }

  @Post('onboarding')
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customers.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.customers.remove(id);
    return { message: 'Customer deleted' };
  }
}
