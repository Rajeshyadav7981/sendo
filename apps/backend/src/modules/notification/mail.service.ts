import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import mailConfig from '../../config/mail.config';

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(@Inject(mailConfig.KEY) private readonly cfg: ConfigType<typeof mailConfig>) {
    this.transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    });
  }

  async send(opts: SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.cfg.from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
    } catch (err) {
      this.logger.error(`Mail send failed to ${opts.to}`, err as Error);
      throw err;
    }
  }
}
