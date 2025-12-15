import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { KycStatus } from '../../entities/kyc.entity';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard)
  @ApiOperation({ summary: 'Submit KYC level 1' })
  create(@Request() req, @Body() createKycDto: CreateKycDto) {
    return this.kycService.create(req.user.userId, createKycDto);
  }

  @Get()
  @UseGuards(EmailVerifiedGuard)
  @ApiOperation({ summary: 'Get user KYC status' })
  findOne(@Request() req) {
    return this.kycService.findOne(req.user.userId);
  }

  @Patch()
  @UseGuards(EmailVerifiedGuard)
  @ApiOperation({ summary: 'Update KYC (level 2 or 3)' })
  update(@Request() req, @Body() updateKycDto: UpdateKycDto) {
    return this.kycService.update(req.user.userId, updateKycDto);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all KYC records (Admin only)' })
  findAll(@Query('status') status?: KycStatus) {
    return this.kycService.findAll(status);
  }

  @Post(':userId/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve KYC (Admin only)' })
  approve(
    @Param('userId') userId: string,
    @Request() req,
    @Body() approveKycDto: ApproveKycDto,
  ) {
    return this.kycService.approve(userId, req.user.userId, approveKycDto.notes);
  }

  @Post(':userId/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject KYC (Admin only)' })
  reject(
    @Param('userId') userId: string,
    @Request() req,
    @Body('notes') notes: string,
  ) {
    return this.kycService.reject(userId, req.user.userId, notes);
  }
}

