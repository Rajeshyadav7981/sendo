import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import jwtConfig from '../../config/jwt.config';
import { MailService } from '../notification/mail.service';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignUpDto,
  VerifyOtpDto,
} from './dto';
import { User, UserRole } from './entities/user.entity';
import type { AuthUser, JwtPayload } from './interfaces/auth-user.interface';
import { OtpStore } from './otp.store';

const OTP_SCOPE_RESET = 'auth-reset';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly otpStore: OtpStore,
    @Inject(jwtConfig.KEY) private readonly jwtCfg: ConfigType<typeof jwtConfig>,
  ) {}

  async signUp(dto: SignUpDto): Promise<{ message: string }> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('User already exists. Please log in.');

    const password = await bcrypt.hash(dto.password, 12);
    await this.users.save(
      this.users.create({
        email: dto.email,
        fullName: dto.fullName,
        password,
        role: UserRole.ADMIN,
      }),
    );
    return { message: 'User registered successfully!' };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; token: string }> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return { user: this.toAuthUser(user), token: this.signToken(user) };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User Not Exists');
    const otp = await this.otpStore.issue(OTP_SCOPE_RESET, dto.email);
    await this.mail.send({
      to: dto.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It expires in 5 minutes.`,
    });
    return { message: 'OTP sent to email' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const ok = await this.otpStore.verify(OTP_SCOPE_RESET, dto.email, dto.userOtp);
    if (!ok) throw new BadRequestException('Invalid or expired OTP');
    return { message: 'OTP verified successfully' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User Not Exists');
    user.password = await bcrypt.hash(dto.password, 12);
    await this.users.save(user);
    return { message: 'Password Updated Successfully' };
  }

  signToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.sign(payload, {
      secret: this.jwtCfg.secret,
      expiresIn: this.jwtCfg.expiresIn as unknown as number,
    });
  }

  toAuthUser(user: User): AuthUser {
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
  }
}
