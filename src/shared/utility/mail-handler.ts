import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';

export const sendMail = async (
  to: string,
  templateName: string,
  subject: string,
  templateVars: Record<string, any> = {},
): Promise<any> => {
  try {
    const configService = new ConfigService();
    const domain = configService.get<string>('EMAIL_SERVICE_DOMAIN');
    const privateKey = configService.get<string>('EMAIL_SERVICE_PRIVATE_KEY');

    if (!domain || !privateKey) {
      throw new Error('Missing email service configuration');
    }

    const form = new FormData();
    form.append('to', to);
    form.append('template', templateName);
    form.append('subject', subject);
    form.append('from', 'mailgun@sandbox2e57d910bd024b2d9f42f9f1ca4b27a8.mailgun.org');
    Object.keys(templateVars).forEach((key) =>
      form.append(`v:${key}`, templateVars[key]),
    );

    const username = 'api';
    const token = Buffer.from(`${username}:${privateKey}`).toString('base64');

    const response = await axios({
      method: 'post',
      url: `https://api.mailgun.net/v3/${domain}/messages`,
      headers: {
        Authorization: `Basic ${token}`,
        contentType: 'multipart/form-data',
      },
      data: form,
    });
    return response;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send email');
  }
};

