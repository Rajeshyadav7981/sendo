import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { Public } from '../../common/decorators/public.decorator';
import appConfig from '../../config/app.config';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-otp.dto';
import { OtpService, type VerifyOtpResult } from './otp.service';

type VerifyOtpResponse = Omit<VerifyOtpResult, 'token'>;

@ApiTags('OTP (SMS)')
@Controller('send-otp')
export class OtpController {
  constructor(
    private readonly otp: OtpService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  @Public()
  @Post('sended')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a phone OTP via Twilio' })
  send(@Body() dto: SendOtpDto): Promise<{ success: true; message: string }> {
    return this.otp.sendOtp(dto.phone);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a phone OTP and issue a JWT cookie' })
  async verify(
    @Body() dto: VerifyPhoneOtpDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<VerifyOtpResponse> {
    const result = await this.otp.verifyOtp(dto.phone, dto.otp);
    void reply.setCookie('token', result.token, {
      httpOnly: true,
      secure: this.app.env === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      signed: false,
    });
    const { token: _t, ...response } = result;
    return response;
  }
}
