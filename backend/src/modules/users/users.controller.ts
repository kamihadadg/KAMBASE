import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Get all users (Admin/Operator only). Operators only see regular users.' })
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.role);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    // Operators cannot access full profile
    if (req.user.role === 'operator') {
      return { message: 'Operators can only change password' };
    }
    // For regular users, require email verification
    return this.usersService.findById(req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    // Operators can only change password through change-password endpoint
    if (req.user.role === 'operator') {
      throw new BadRequestException('Operators can only change password. Please use /users/change-password endpoint.');
    }
    
    // For regular users, require email verification
    // Users can only update firstName, lastName, phone (password change is separate)
    const allowedFields = ['firstName', 'lastName', 'phone'];
    const filteredDto: any = {};
    for (const key of allowedFields) {
      if (updateUserDto[key]) {
        filteredDto[key] = updateUserDto[key];
      }
    }
    return this.usersService.update(req.user.userId, filteredDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password (Available for all authenticated users including operators). Requires 2FA if enabled.' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    // Get user to verify current password
    const user = await this.usersService.findById(req.user.userId);
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // If 2FA is enabled, verify 2FA code
    if (user.twoFactorEnabled) {
      if (!changePasswordDto.twoFactorCode) {
        throw new BadRequestException('2FA code is required when 2FA is enabled');
      }

      const is2FAValid = await this.authService.verify2FA(user.id, changePasswordDto.twoFactorCode);
      if (!is2FAValid) {
        throw new BadRequestException('Invalid 2FA code');
      }
    }

    // Update password
    return this.usersService.update(req.user.userId, { password: changePasswordDto.newPassword });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

