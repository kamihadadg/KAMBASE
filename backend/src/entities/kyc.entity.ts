import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum KycLevel {
  LEVEL1 = 'level1',
  LEVEL2 = 'level2',
  LEVEL3 = 'level3',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('kyc')
@Index(['userId'])
export class Kyc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: KycLevel,
    default: KycLevel.LEVEL1,
  })
  level: KycLevel;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  status: KycStatus;

  @Column({ type: 'jsonb', nullable: true })
  level1Data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  level2Data: {
    nationalCardFront?: string;
    nationalCardBack?: string;
    selfie?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  level3Data: {
    additionalDocuments?: string[];
    notes?: string;
  };

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  dailyWithdrawLimit: number;

  @Column({ nullable: true })
  reviewedBy: string; // Admin user ID

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @ManyToOne(() => User, (user) => user.kycRecords)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

