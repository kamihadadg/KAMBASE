import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found in environment variables. Email service will be disabled.');
      return;
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@kamcore.com');
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'KAMCEX Exchange');
    
    this.logger.log(`Email service initialized with from: ${this.fromEmail}`);
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Email service is not configured. Skipping email send.');
      return false;
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      if (result.error) {
        this.logger.error(
          `Failed to send email to ${to}: ${result.error.message || JSON.stringify(result.error)}`,
        );
        return false;
      }

      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      return false;
    }
  }

  async sendWithdrawalConfirmation(
    to: string,
    amount: string,
    coinSymbol: string,
    toAddress: string,
    confirmationLink: string,
  ): Promise<boolean> {
    const subject = `Withdrawal Confirmation - ${amount} ${coinSymbol}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KAMCEX Exchange</h1>
            </div>
            <div class="content">
              <h2>Withdrawal Confirmation Required</h2>
              <p>You have requested to withdraw <strong>${amount} ${coinSymbol}</strong> to the following address:</p>
              <div class="info">
                <strong>Amount:</strong> ${amount} ${coinSymbol}<br>
                <strong>To Address:</strong> ${toAddress}
              </div>
              <p>Please confirm this withdrawal by clicking the button below:</p>
              <a href="${confirmationLink}" class="button">Confirm Withdrawal</a>
              <p>If you did not request this withdrawal, please ignore this email or contact support immediately.</p>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} KAMCEX Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  async send2FAEnabled(to: string, userName?: string): Promise<boolean> {
    const subject = '2FA Enabled - KAMCEX Exchange';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert { background: #10b981; color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KAMCEX Exchange</h1>
            </div>
            <div class="content">
              <h2>Two-Factor Authentication Enabled</h2>
              <div class="alert">
                <strong>✓ Security Enhanced</strong>
              </div>
              <p>Hello${userName ? ` ${userName}` : ''},</p>
              <p>Two-factor authentication (2FA) has been successfully enabled on your KAMCEX account.</p>
              <p>From now on, you will need to enter a verification code from your authenticator app when logging in.</p>
              <p><strong>Important:</strong> Keep your authenticator app secure and do not share your backup codes with anyone.</p>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} KAMCEX Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendKYCStatusUpdate(
    to: string,
    status: string,
    level: string,
    userName?: string,
  ): Promise<boolean> {
    const subject = `KYC Status Update - ${status}`;
    const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .status { background: ${statusColor}; color: white; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KAMCEX Exchange</h1>
            </div>
            <div class="content">
              <h2>KYC Verification Status Update</h2>
              <p>Hello${userName ? ` ${userName}` : ''},</p>
              <p>Your KYC verification (Level ${level}) status has been updated:</p>
              <div class="status">
                ${status.toUpperCase()}
              </div>
              ${status === 'approved' 
                ? '<p>Congratulations! Your identity has been verified. You now have access to higher withdrawal limits.</p>'
                : status === 'rejected'
                ? '<p>Unfortunately, your KYC verification was rejected. Please review your submitted documents and try again.</p>'
                : '<p>Your KYC verification is currently under review. We will notify you once the review is complete.</p>'
              }
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} KAMCEX Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendWelcomeEmail(to: string, userName?: string): Promise<boolean> {
    const subject = 'Welcome to KAMCEX Exchange';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to KAMCEX Exchange</h1>
            </div>
            <div class="content">
              <h2>Hello${userName ? ` ${userName}` : ''}!</h2>
              <p>Thank you for joining KAMCEX Exchange. We're excited to have you on board!</p>
              <p>Your account has been successfully created. You can now:</p>
              <ul>
                <li>Start trading cryptocurrencies</li>
                <li>Deposit funds to your wallet</li>
                <li>Explore our markets</li>
                <li>Complete KYC verification for higher limits</li>
              </ul>
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} KAMCEX Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendVerificationEmail(to: string, userName: string, verificationLink: string): Promise<boolean> {
    const subject = 'Verify Your Email - KAMCEX Exchange';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KAMCEX Exchange</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hello ${userName},</p>
              <p>Thank you for registering with KAMCEX Exchange!</p>
              <div class="alert">
                <strong>⚠️ Important:</strong> You must verify your email address before you can use your account.
              </div>
              <p>Please click the button below to verify your email address:</p>
              <a href="${verificationLink}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280; font-size: 12px;">${verificationLink}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you did not create an account with KAMCEX Exchange, please ignore this email.</p>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} KAMCEX Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, userName: string, resetLink: string): Promise<boolean> {
    const subject = 'Reset Your Password - KAMCEX Exchange';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello${userName ? ` ${userName}` : ''}!</h2>
              <p>We received a request to reset your password for your KAMCEX Exchange account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${resetLink}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} KAMCEX Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

