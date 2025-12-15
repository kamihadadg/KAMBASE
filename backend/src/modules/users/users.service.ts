import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
    private i18n: I18nService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    console.log('[UsersService] Creating user with data:', {
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: createUserDto.role,
      hasPassword: !!createUserDto.password,
      emailVerified: createUserDto.emailVerified,
      hasEmailVerificationToken: !!createUserDto.emailVerificationToken
    });

    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      console.log('[UsersService] User already exists:', createUserDto.email);
      throw new ConflictException(await this.i18n.translate('auth.register.email_exists'));
    }

    // Check if this is the first user (no users exist)
    const userCount = await this.usersRepository.count();
    const isFirstUser = userCount === 0;
    console.log(`[UsersService] User count: ${userCount}, isFirstUser: ${isFirstUser}`);

    console.log('[UsersService] Hashing password');
    const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '10'), 10);
    console.log(`[UsersService] Using bcrypt rounds: ${bcryptRounds} (type: ${typeof bcryptRounds})`);
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      bcryptRounds,
    );
    console.log('[UsersService] Password hashed successfully');

    // Role is set by auth service, use provided role or default to USER
    const role = createUserDto.role || UserRole.USER;
    console.log(`[UsersService] Using role: ${role}`);

    const userData = {
      ...createUserDto,
      password: hashedPassword,
      role,
      status: UserStatus.ACTIVE,
    };
    console.log('[UsersService] Creating user entity with final data:', {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      status: userData.status,
      emailVerified: userData.emailVerified
    });

    const user = this.usersRepository.create(userData);
    console.log('[UsersService] User entity created, saving to database');

    const savedUser = await this.usersRepository.save(user);
    console.log(`[UsersService] User saved successfully: ${savedUser.email} (ID: ${savedUser.id})`);

    return savedUser;
  }

  async findAll(operatorRole?: UserRole): Promise<User[]> {
    // Operators should only see regular users, not admins or other operators
    const where = operatorRole === UserRole.OPERATOR 
      ? { role: UserRole.USER }
      : {};
    
    return this.usersRepository.find({
      where,
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(await this.i18n.translate('users.not_found'));
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findFirstByRole(role: UserRole): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { role },
      order: { createdAt: 'ASC' },
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { emailVerificationToken: token } });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { passwordResetToken: token } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.password) {
      const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '10'), 10);
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        bcryptRounds,
      );
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async count(): Promise<number> {
    return this.usersRepository.count();
  }

}

