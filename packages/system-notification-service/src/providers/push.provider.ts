import { PushNotification } from '../types/notification.types';
import { LoggerService } from '@send/shared';
import admin from 'firebase-admin';

export class PushProvider {
  constructor(private readonly logger: LoggerService) {
    if (!admin.apps.length) {
      const serviceAccount = process.env.FCM_SERVICE_ACCOUNT;
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount))
        });
      } else {
        admin.initializeApp();
      }
    }
  }

  async send(notification: PushNotification): Promise<void> {
    this.logger.info('Sending push notification', { id: notification.id });
    try {
      await admin.messaging().send({
        token: notification.deviceToken,
        notification: {
          title: notification.title,
          body: notification.message
        }
      });
      this.logger.info('Push notification sent', { id: notification.id });
    } catch (error) {
      this.logger.error('Failed to send push notification', {
        id: notification.id,
        error
      });
      throw error;
    }
  }
}
