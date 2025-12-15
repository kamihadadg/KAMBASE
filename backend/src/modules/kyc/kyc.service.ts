import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc, KycLevel, KycStatus } from '../../entities/kyc.entity';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private kycRepository: Repository<Kyc>,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async create(userId: string, createKycDto: CreateKycDto): Promise<Kyc> {
    // Check if KYC already exists
    const existing = await this.kycRepository.findOne({
      where: { userId },
    });

    if (existing) {
      throw new NotFoundException('KYC record already exists');
    }

    const kyc = this.kycRepository.create({
      userId,
      level: KycLevel.LEVEL1,
      status: KycStatus.PENDING,
      level1Data: createKycDto.level1Data,
      dailyWithdrawLimit: 100, // Default limit for level 1
    });

    return this.kycRepository.save(kyc);
  }

  async findOne(userId: string): Promise<Kyc> {
    const kyc = await this.kycRepository.findOne({
      where: { userId },
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    return kyc;
  }

  async update(userId: string, updateKycDto: UpdateKycDto): Promise<Kyc> {
    const kyc = await this.findOne(userId);

    if (updateKycDto.level2Data) {
      kyc.level = KycLevel.LEVEL2;
      kyc.level2Data = updateKycDto.level2Data;
      kyc.dailyWithdrawLimit = 1000; // Level 2 limit
    }

    if (updateKycDto.level3Data) {
      kyc.level = KycLevel.LEVEL3;
      kyc.level3Data = updateKycDto.level3Data;
      kyc.dailyWithdrawLimit = 10000; // Level 3 limit
    }

    return this.kycRepository.save(kyc);
  }

  async approve(userId: string, reviewedBy: string, notes?: string): Promise<Kyc> {
    const kyc = await this.findOne(userId);
    kyc.status = KycStatus.APPROVED;
    kyc.reviewedBy = reviewedBy;
    kyc.reviewNotes = notes;
    const savedKyc = await this.kycRepository.save(kyc);
    
    // Send email notification
    const user = await this.usersService.findById(userId);
    if (user && user.email) {
      await this.emailService.sendKYCStatusUpdate(
        user.email,
        'approved',
        kyc.level,
        user.firstName || user.email,
      );
    }
    
    return savedKyc;
  }

  async reject(userId: string, reviewedBy: string, notes: string): Promise<Kyc> {
    const kyc = await this.findOne(userId);
    kyc.status = KycStatus.REJECTED;
    kyc.reviewedBy = reviewedBy;
    kyc.reviewNotes = notes;
    const savedKyc = await this.kycRepository.save(kyc);
    
    // Send email notification
    const user = await this.usersService.findById(userId);
    if (user && user.email) {
      await this.emailService.sendKYCStatusUpdate(
        user.email,
        'rejected',
        kyc.level,
        user.firstName || user.email,
      );
    }
    
    return savedKyc;
  }

  async findAll(status?: KycStatus): Promise<Kyc[]> {
    const where = status ? { status } : {};
    return this.kycRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}

