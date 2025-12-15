import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  password: string;

  @ApiProperty({ required: false, example: '123456' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @ApiProperty({ example: '03AGdBq27...', description: 'reCAPTCHA token', required: false })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}

