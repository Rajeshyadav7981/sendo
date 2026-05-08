import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVendorDto } from './dto/vendor.dto';
import { VendorService } from './vendor.service';

@ApiTags('Vendor')
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class VendorController {
  constructor(private readonly vendors: VendorService) {}

  @Get('vendors')
  list() {
    return this.vendors.list();
  }

  @Post('vendor')
  create(@Body() dto: CreateVendorDto) {
    return this.vendors.create(dto);
  }

  @Put('vendor/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateVendorDto>) {
    return this.vendors.update(id, dto);
  }

  @Delete('vendor/:id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.vendors.remove(id);
    return { message: 'Vendor deleted' };
  }
}
