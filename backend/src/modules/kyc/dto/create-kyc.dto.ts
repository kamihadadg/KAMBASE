import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class Level1DataDto {
  @ApiProperty({ required: false })
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  nationality?: string;
}

export class CreateKycDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Level1DataDto)
  level1Data?: Level1DataDto;
}

