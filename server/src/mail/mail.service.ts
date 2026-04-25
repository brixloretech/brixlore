import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE !== 'false';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? parseInt(port, 10) : secure ? 465 : 587,
        secure,
        auth: { user, pass },
      });
    }
  }

  /** Returns true if email was sent (or skipped in dev with log). */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@example.com';
    const subject = 'Reset your password';
    const html = `
      <p>You requested a password reset.</p>
      <p>Click the link below to set a new password (valid for 1 hour):</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `;
    const text = `Reset your password: ${resetLink}\n\nIf you didn't request this, ignore this email.`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      return true;
    }

    // Dev: log link when SMTP is not configured
    console.log('[Mail] Password reset link (SMTP not configured):', resetLink);
    return true;
  }

  /** Returns true if email was sent (or skipped in dev with log). */
  async sendAdminInviteEmail(to: string, inviteLink: string): Promise<boolean> {
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@example.com';
    const subject = 'You have been invited as an admin';
    const html = `
      <p>You have been invited to manage the platform.</p>
      <p>Click the button below to activate your account and set a password:</p>
      <p><a href="${inviteLink}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#f5d90a;color:#111;text-decoration:none;">Activate account</a></p>
      <p>If you did not expect this, you can ignore this email.</p>
    `;
    const text = `Activate your admin account: ${inviteLink}`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      return true;
    }

    console.log('[Mail] Admin invite link (SMTP not configured):', inviteLink);
    return true;
  }

  /** Returns true if email was sent (or skipped in dev with log). */
  async sendSupportReplyEmail(
    to: string,
    subject: string,
    replyMessage: string,
    originalMessage?: string,
  ): Promise<boolean> {
    const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@example.com';
    const fromName = process.env.SUPPORT_FROM_NAME ?? 'Support Team';
    const replyTo = process.env.SUPPORT_REPLY_TO;
    const from = `${fromName} <${fromAddress}>`;
    const mailSubject = `Re: ${subject}`;
    const html = `
      <p>Hi,</p>
      <p>Thanks for contacting us. Here's our response:</p>
      <blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#111;">
        ${replyMessage.replace(/\n/g, '<br />')}
      </blockquote>
      ${
        originalMessage
          ? `<p style="margin-top:16px;color:#6b7280;"><strong>Your original message:</strong><br />${originalMessage.replace(/\n/g, '<br />')}</p>`
          : ''
      }
      <p style="margin-top:16px;">If you have more questions, just reply to this email.</p>
    `;
    const text = `Support reply:\n\n${replyMessage}\n\n${
      originalMessage ? `Your original message:\n${originalMessage}\n\n` : ''
    }If you have more questions, just reply to this email.`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to,
        subject: mailSubject,
        text,
        html,
        replyTo: replyTo || undefined,
      });
      return true;
    }

    console.log('[Mail] Support reply email (SMTP not configured):', {
      to,
      subject: mailSubject,
      replyMessage,
    });
    return true;
  }
}
