import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { UserRole } from '../../entities/user.entity';
import { User } from '../../entities/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is suspended or banned');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException({
        message: 'Email verification required',
        error: 'EMAIL_NOT_VERIFIED',
        detail: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      });
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException();
      }

      if (!user.emailVerified) {
        throw new UnauthorizedException({
          message: 'Email verification required',
          error: 'EMAIL_NOT_VERIFIED',
          detail: 'Please verify your email address before accessing the system.',
        });
      }

      const newPayload = { email: user.email, sub: user.id, role: user.role };
      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generate2FASecret(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('TWO_FACTOR_APP_NAME', 'KAMCEX Exchange')} (${user.email})`,
      issuer: this.configService.get('TWO_FACTOR_APP_NAME', 'KAMCEX Exchange'),
      length: 32,
    });

    await this.usersService.update(userId, {
      twoFactorSecret: secret.base32,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA secret not generated');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA token');
    }

    await this.usersService.update(userId, {
      twoFactorEnabled: true,
    });

    // Send email notification
    await this.emailService.send2FAEnabled(
      user.email,
      user.firstName || user.email,
    );

    return { message: '2FA enabled successfully' };
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });
  }

  async register(registerDto: RegisterDto) {
    try {
      this.logger.log(`[AuthService] Starting registration for: ${registerDto.email}`);

      // Validate DTO
      this.logger.log('[AuthService] Validating DTO fields', {
        email: registerDto.email,
        passwordLength: registerDto.password?.length,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        captchaToken: registerDto.captchaToken ? 'present' : 'missing'
      });

      // Generate verification token and expiry (24 hours from now)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      this.logger.log('[AuthService] Generated verification token');

      // Check if this is the first user (make them admin)
      const userCount = await this.usersService.count();
      const isFirstUser = userCount === 0;

      // Prepare user data
      const userData = {
        ...registerDto,
        role: isFirstUser ? UserRole.ADMIN : UserRole.USER,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationTokenExpiry,
        emailVerified: false,
      };

      this.logger.log(`[AuthService] User role set to: ${userData.role} (first user: ${isFirstUser})`);
      this.logger.log('[AuthService] Calling usersService.create with data:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hasPassword: !!userData.password
      });

      const user = await this.usersService.create(userData);
      this.logger.log(`[AuthService] User created successfully: ${user.email} (ID: ${user.id})`);

      const { password: _, ...result } = user;
      
      // Send verification email
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8081');
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
      this.logger.log(`[AuthService] Sending verification email to ${user.email} with link: ${verificationLink}`);
      
      try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.firstName || user.email,
        verificationLink,
      );
        this.logger.log('[AuthService] Verification email sent successfully');
      } catch (emailError) {
        this.logger.error('[AuthService] Failed to send verification email', emailError);
        // Don't fail registration if email fails
      }

      this.logger.log(`User registered successfully: ${user.email}`);
      
      return {
        message: 'User registered successfully. Please check your email to verify your account.',
        user: result,
      };
    } catch (error) {
      this.logger.error('User registration failed', {
        error: error.message,
        stack: error.stack,
        registerDto: registerDto,
        errorType: error.constructor.name
      });

      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Check if token is expired
    if (!user.emailVerificationTokenExpiry || user.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new verification email.');
    }

    await this.usersService.update(user.id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await this.usersService.update(userId, {
      emailVerificationToken: verificationToken,
    });

    // Send verification email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8081');
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName || user.email,
      verificationLink,
    );

    return {
      message: 'Verification email sent successfully',
    };
  }

  async resendVerificationEmailByEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If an account with this email exists and is not verified, a verification email has been sent.',
      };
    }

    if (user.emailVerified) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If an account with this email exists and is not verified, a verification email has been sent.',
      };
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await this.usersService.update(user.id, {
      emailVerificationToken: verificationToken,
    });

    // Send verification email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8081');
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName || user.email,
      verificationLink,
    );

    return {
      message: 'If an account with this email exists and is not verified, a verification email has been sent.',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    // Don't reveal if user exists or not for security
    // Also, operators cannot reset password via this method
    if (!user || user.role === 'operator') {
      return {
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry
    
    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Send reset email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8081');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName || user.email,
      resetLink,
    );

    return {
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByPasswordResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // Update password and clear reset token
    await this.usersService.update(user.id, {
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return {
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}

