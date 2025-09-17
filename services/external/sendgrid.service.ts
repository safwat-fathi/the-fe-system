import { ServiceResponse } from "@/types/services/base";

export interface SendGridEmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface SendGridResponse {
  messageId: string;
}

class SendGridService {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "";
    this.defaultFrom = process.env.SENDGRID_DEFAULT_FROM || "";
  }

  /**
   * Send an email using SendGrid
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendEmail(
    _options: SendGridEmailOptions,
  ): Promise<ServiceResponse<SendGridResponse>> {
    try {
      // In a real implementation, you would use the SendGrid SDK here:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // await sgMail.send(msg);

      // For now, we'll simulate a successful email send
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        success: true,
        data: {
          messageId: "msg_" + Date.now().toString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }

  /**
   * Send a verification email
   */
  async sendVerificationEmail(
    to: string,
    verificationToken: string,
  ): Promise<ServiceResponse<SendGridResponse>> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`;

    return this.sendEmail({
      to,
      from: this.defaultFrom,
      subject: "Verify your email address",
      html: `
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create an account, you can ignore this email.</p>
      `,
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<ServiceResponse<SendGridResponse>> {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to,
      from: this.defaultFrom,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can ignore this email.</p>
      `,
    });
  }
}

// Export singleton instance
export default new SendGridService();
