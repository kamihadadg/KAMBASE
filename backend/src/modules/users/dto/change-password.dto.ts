import { IsString, MinLength, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password (minimum 8 characters)' })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ 
    description: '2FA code (required if 2FA is enabled)',
    required: false,
    example: '123456'
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;
}

