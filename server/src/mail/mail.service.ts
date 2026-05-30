import { Injectable } from '@nestjs/common';

const Brevo = require('sib-api-v3-sdk');

@Injectable()
export class MailService {
  private api: any;

  constructor() {
    const client = Brevo.ApiClient.instance;
    client.authentications['api-key'].apiKey = process.env.BREVO_API;
    this.api = new Brevo.TransactionalEmailsApi();
  }

  async sendMail(options: {
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
  }) {
    const toList = Array.isArray(options.to)
      ? options.to.map((email) => ({ email }))
      : [{ email: options.to }];

    await this.api.sendTransacEmail({
      sender: { email: process.env.SMTP_FROM || 'support@brixlore.tv' },
      to: toList,
      subject: options.subject,
      htmlContent: options.html,
      replyTo: options.replyTo ? { email: options.replyTo } : undefined,
    });

    return true;
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    return this.sendMail({
      to,
      subject: 'Reset your password',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to set a new password (valid for 1 hour):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });
  }

  async sendVerificationEmail(to: string, verificationLink: string) {
    return this.sendMail({
      to,
      subject: 'Verify your email address',
      html: `
        <p>Welcome to Brixlore!</p>
        <p>Please click the link below to verify your email address and activate your account:</p>
        <p><a href="${verificationLink}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#f5d90a;color:#111;text-decoration:none;">Verify Email</a></p>
        <p>If you didn't create an account, you can ignore this email.</p>
      `,
    });
  }

  async sendAdminInviteEmail(to: string, inviteLink: string) {
    return this.sendMail({
      to,
      subject: 'You have been invited as an admin',
      html: `
        <p>You have been invited to manage the platform.</p>
        <p>Click the button below to activate your account and set a password:</p>
        <p><a href="${inviteLink}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#f5d90a;color:#111;text-decoration:none;">Activate account</a></p>
        <p>If you did not expect this, you can ignore this email.</p>
      `,
    });
  }

  async sendSupportReplyEmail(
    to: string,
    subject: string,
    replyMessage: string,
    originalMessage?: string,
  ) {
    return this.sendMail({
      to,
      subject: `Re: ${subject}`,
      html: `
        <p>Hi,</p>
        <p>Thanks for contacting us. Here's our response:</p>
        <blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#111;">
          ${replyMessage.replace(/\n/g, '<br />')}
        </blockquote>
        ${originalMessage ? `<p style="margin-top:16px;color:#6b7280;"><strong>Your original message:</strong><br />${originalMessage.replace(/\n/g, '<br />')}</p>` : ''}
        <p style="margin-top:16px;">If you have more questions, just reply to this email.</p>
      `,
      replyTo: process.env.SUPPORT_REPLY_TO,
    });
  }
}
