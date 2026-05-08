import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVendorDto } from './dto/vendor.dto';
import { Vendor, VendorSite } from './entities/vendor.entity';

@Injectable()
export class VendorService {
  constructor(@InjectRepository(Vendor) private readonly vendors: Repository<Vendor>) {}

  list(): Promise<Vendor[]> {
    return this.vendors.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateVendorDto): Promise<Vendor> {
    if (!dto.supplierName?.trim()) throw new BadRequestException('Supplier name is required.');

    const pan = dto.panNumber.trim().toUpperCase();
    const dup = await this.vendors.findOne({ where: { panNumber: pan } });
    if (dup) throw new ConflictException('A vendor with this PAN is already registered.');

    return this.vendors.save(
      this.vendors.create({
        ...dto,
        supplierName: dto.supplierName.trim(),
        phoneNumber: dto.phoneNumber.trim(),
        emailId: dto.emailId.trim().toLowerCase(),
        panNumber: pan,
        IFSCcode: dto.IFSCcode.trim().toUpperCase(),
        venderSiteCode: dto.venderSiteCode === 'Rental' ? VendorSite.RENTAL : VendorSite.ADHOC,
        notes: dto.notes?.trim() ?? null,
      }),
    );
  }

  async update(id: string, dto: Partial<CreateVendorDto>): Promise<Vendor> {
    const existing = await this.vendors.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Vendor not found');
    Object.assign(existing, dto);
    return this.vendors.save(existing);
  }

  async remove(id: string): Promise<void> {
    const result = await this.vendors.softDelete(id);
    if (!result.affected) throw new NotFoundException('Vendor not found');
  }
}
