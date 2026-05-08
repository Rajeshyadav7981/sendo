import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import appConfig from '../../config/app.config';
import jwtConfig from '../../config/jwt.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignUpDto, VerifyOtpDto } from './dto';
import type { AuthUser } from './interfaces/auth-user.interface';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
    @Inject(jwtConfig.KEY) private readonly jwtCfg: ConfigType<typeof jwtConfig>,
  ) {}

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new admin/manager user' })
  signUp(@Body() dto: SignUpDto): Promise<{ message: string }> {
    return this.auth.signUp(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and issue JWT cookie' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ message: string; user: AuthUser }> {
    const { user, token } = await this.auth.login(dto);
    this.setAuthCookie(reply, token);
    return { message: 'Login successful', user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear JWT cookie' })
  logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): { message: string } {
    this.clearAuthCookie(reply);
    return { message: `${user.fullName} Logged Out Successfully...` };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email a reset OTP to the user' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a password-reset OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ message: string }> {
    return this.auth.verifyOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password (after OTP verification)' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.auth.resetPassword(dto);
  }

  // ──────────────────────────────────────────────────────────────────────────

  private setAuthCookie(reply: FastifyReply, token: string): void {
    void reply.setCookie('token', token, {
      httpOnly: true,
      secure: this.app.env === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      signed: false,
    });
  }

  private clearAuthCookie(reply: FastifyReply): void {
    void reply.clearCookie('token', { path: '/' });
  }
}
