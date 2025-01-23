import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';

export const sendMail = async (
  to: string,
  templateName: string,
  subject: string,
): Promise<void> => {
  try {
    const configService = new ConfigService();
    const smtpHost = configService.get<string>('MAILER_HOST');
    const smtpPort = configService.get<number>('MAILER_PORT');
    const smtpUser = configService.get<string>('MAILER_USERNAME');
    const smtpPass = configService.get<string>('MAILER_PASSWORD');
    const emailFrom = configService.get<string>('MAILER_USERNAME');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !emailFrom) {
      throw new InternalServerErrorException('Failed to send email');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: emailFrom,
      to,
      subject,
      html: templateName,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new InternalServerErrorException('Failed to send email');
  }
};


