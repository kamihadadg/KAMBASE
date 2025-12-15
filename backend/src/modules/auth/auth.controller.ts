import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { UsersService } from '../users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { ResendVerificationByEmailDto } from './dto/resend-verification-by-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private captchaService: CaptchaService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto, @Request() req) {
    console.log('[AuthController] Register request received:', {
      ip: req.ip,
      headers: req.headers,
      body: registerDto,
    });

    // Verify CAPTCHA only if token is provided
    if (registerDto.captchaToken) {
      console.log('[AuthController] Verifying CAPTCHA token');
      await this.captchaService.verifyToken(registerDto.captchaToken, req.ip);
    } else {
      console.log('[AuthController] No CAPTCHA token provided');
    }

    const result = await this.authService.register(registerDto);
    console.log('[AuthController] Register successful:', result.user?.email);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    // Verify CAPTCHA only if token is provided
    if (loginDto.captchaToken) {
      await this.captchaService.verifyToken(loginDto.captchaToken, req.ip);
    }
    
    // Validate user credentials
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Double check email verification
    if (!user.emailVerified) {
      throw new UnauthorizedException({
        message: 'Email verification required',
        error: 'EMAIL_NOT_VERIFIED',
        detail: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      });
    }

    // Update last login
    await this.usersService.updateLastLogin(
      user.id,
      req.ip || 'unknown',
    );

    // If 2FA is enabled, require 2FA code
    if (user.twoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return {
          requires2FA: true,
          message: '2FA code required',
        };
      }

      const isValid = await this.authService.verify2FA(
        user.id,
        loginDto.twoFactorCode,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  async generate2FA(@Request() req) {
    return this.authService.generate2FASecret(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA' })
  async enable2FA(@Request() req, @Body() enable2FADto: Enable2FADto) {
    return this.authService.enable2FA(req.user.userId, enable2FADto.token);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA token' })
  async verify2FA(@Body() verify2FADto: Verify2FADto) {
    const isValid = await this.authService.verify2FA(
      verify2FADto.userId,
      verify2FADto.token,
    );
    return { valid: isValid };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiQuery({ name: 'token', required: true, description: 'Email verification token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend verification email (requires authentication)' })
  async resendVerification(@Request() req) {
    return this.authService.resendVerificationEmail(req.user.userId);
  }

  @Post('resend-verification-by-email')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Resend verification email by email address (no authentication required)',
    description: 'Rate limited to 3 requests per 15 minutes per IP address to prevent abuse'
  })
  async resendVerificationByEmail(@Body() resendDto: ResendVerificationByEmailDto) {
    return this.authService.resendVerificationEmailByEmail(resendDto.email);
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Request password reset (Available for admin and users, not operators)',
    description: 'Rate limited to 3 requests per 15 minutes per IP address to prevent abuse'
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token from email' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }
}

