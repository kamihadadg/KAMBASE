import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CaptchaService {
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
    if (!this.secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY is not set. CAPTCHA verification will be disabled.');
    }
  }

  async verifyToken(token: string | undefined, remoteip?: string): Promise<boolean> {
    // If secret key is not set, skip verification (for development)
    if (!this.secretKey) {
      return true;
    }

    // If no token provided but secret key is set, require token
    if (!token) {
      throw new BadRequestException('CAPTCHA token is required when CAPTCHA is enabled');
    }

    try {
      const response = await axios.post(this.verifyUrl, null, {
        params: {
          secret: this.secretKey,
          response: token,
          remoteip: remoteip,
        },
      });

      const { success, score } = response.data;

      // For reCAPTCHA v2, success is boolean
      // For reCAPTCHA v3, check score (typically > 0.5 is human)
      if (typeof success === 'boolean') {
        return success;
      }

      // If score exists (v3), check if it's above threshold
      if (typeof score === 'number') {
        return score >= 0.5;
      }

      return false;
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      throw new BadRequestException('CAPTCHA verification failed');
    }
  }
}

