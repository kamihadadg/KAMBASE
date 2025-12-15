import { IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateKycDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  level2Data?: {
    nationalCardFront?: string;
    nationalCardBack?: string;
    selfie?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  level3Data?: {
    additionalDocuments?: string[];
    notes?: string;
  };
}

