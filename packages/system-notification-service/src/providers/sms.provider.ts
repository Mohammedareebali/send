import { SMSNotification } from '../types/notification.types';
import { Logger } from 'winston';
import twilio from 'twilio';

interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  from?: string;
}

export class SMSProvider {
  private client: twilio.Twilio;
  private from?: string;

  constructor(private readonly logger: Logger) {
    const config: TwilioConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM_NUMBER
    };

    this.from = config.from;
    this.client = twilio(config.accountSid || '', config.authToken || '');
  }

  async send(notification: SMSNotification): Promise<void> {
    this.logger.info('Sending SMS notification', { id: notification.id });
    try {
      await this.client.messages.create({
        to: notification.phoneNumber,
        from: this.from,
        body: notification.message
      });
      this.logger.info('SMS sent', { id: notification.id });
    } catch (error) {
      this.logger.error('Failed to send SMS', { id: notification.id, error });
      throw error;
    }
  }
}
