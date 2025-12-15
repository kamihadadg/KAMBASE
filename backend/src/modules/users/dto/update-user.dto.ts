import { IsString, IsOptional, IsEnum, MinLength, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false, enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  twoFactorSecret?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  twoFactorEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  emailVerifiedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emailVerificationToken?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  passwordResetToken?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  passwordResetExpires?: Date | null;

  @ApiProperty({ required: false })
  @IsOptional()
  failedLoginAttempts?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  lockedUntil?: Date | null;
}

