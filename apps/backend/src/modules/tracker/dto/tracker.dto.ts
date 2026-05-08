import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class EmployeeAuthDto {
  @IsString()
  password!: string;
}

export class CreateEmployeeRecordDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  role?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  phone?: string;
}

export class UpdateEmployeeRecordDto {
  @IsOptional()
  @IsString()
  @Length(0, 100)
  role?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  phone?: string;
}

export class ScheduleConfigDto {
  @IsString()
  @Length(1, 64)
  vehicle!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  intervalDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  litres?: number;

  @IsOptional()
  @IsNumber()
  kmPerLitre?: number;

  @IsOptional()
  @IsInt()
  kmPerFill?: number;

  @IsOptional()
  @IsInt()
  actualKm?: number;
}

export class ScheduleBulkDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScheduleConfigDto)
  configs!: ScheduleConfigDto[];
}

export class CreateEscalationDto {
  @IsString()
  @Length(1, 64)
  vehicle!: string;

  @IsString()
  @Length(1, 100)
  category!: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  severity?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  raisedBy?: string;

  @IsOptional()
  @IsIn(['open', 'resolved', 'reopened'])
  status?: 'open' | 'resolved' | 'reopened';
}

export class UpdateEscalationDto {
  @IsOptional()
  @IsIn(['open', 'resolved', 'reopened'])
  status?: 'open' | 'resolved' | 'reopened';

  @IsOptional()
  @IsString()
  note?: string;
}

export class EscalationBulkDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateEscalationDto)
  items!: CreateEscalationDto[];
}

export class CreateFillDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'monthKey must be YYYY-MM' })
  monthKey!: string;

  @IsString()
  @Length(1, 64)
  vehicle!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateKey must be YYYY-MM-DD' })
  dateKey!: string;

  @IsOptional()
  @IsInt()
  startKm?: number;

  @IsOptional()
  @IsInt()
  endKm?: number;

  @IsOptional()
  @IsNumber()
  litres?: number;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  enteredBy?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  paidBy?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeKey must be HH:MM' })
  timeKey?: string;
}

export class FillBulkDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFillDto)
  data!: CreateFillDto[];
}

export class CreateOdometerDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey!: string;

  @IsInt()
  @Min(0)
  reading!: number;
}
