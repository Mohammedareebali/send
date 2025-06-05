import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from '../infra/messaging/rabbitmq.service';
import {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  NotificationTemplate,
  PushNotification,
  InAppNotification,
  SMSNotification,
  EmailNotification
} from '../types/notification.types';
import { logger } from '@shared/logger';
import { PushProvider } from '../providers/push.provider';
import { InAppProvider } from '../providers/inapp.provider';
import { SMSProvider } from '../providers/sms.provider';
import { EmailProvider } from '../providers/email.provider';

export class NotificationService {
  private prisma: PrismaClient;
  private rabbitMQ: RabbitMQService;
  private pushProvider: PushProvider;
  private inAppProvider: InAppProvider;
  private smsProvider: SMSProvider;
  private emailProvider: EmailProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.rabbitMQ = new RabbitMQService();
    this.pushProvider = new PushProvider(logger);
    this.inAppProvider = new InAppProvider(logger);
    this.smsProvider = new SMSProvider(logger);
    this.emailProvider = new EmailProvider(logger);
  }

  private async sendWithRetry(
    notification: Notification,
    sendFn: () => Promise<void>
  ): Promise<void> {
    const retries = Number(process.env.NOTIFICATION_RETRIES || '3');
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await sendFn();
        await this.updateNotificationStatus(notification.id, NotificationStatus.SENT);
        logger.info('Notification sent', { id: notification.id, channel: notification.channel, attempt });
        return;
      } catch (error) {
        logger.error('Failed to send notification', { id: notification.id, attempt, error });
        if (attempt === retries) {
          await this.updateNotificationStatus(notification.id, NotificationStatus.FAILED);
          throw error;
        }
      }
    }
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const preferences = await this.getUserPreferences(notification.userId);
    
    // Check if the channel is enabled in user preferences
    if (!this.isChannelEnabled(notification.channel, preferences)) {
      throw new Error(`Notification channel ${notification.channel} is disabled for user ${notification.userId}`);
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences)) {
      throw new Error('Cannot send notification during quiet hours');
    }

    const createdNotification = await (this.prisma as any).notification.create({
      data: {
        ...notification,
        status: NotificationStatus.PENDING
      }
    });

    // Publish notification to RabbitMQ for processing
    await this.rabbitMQ.publishMessage('notifications', {
      type: 'NEW_NOTIFICATION',
      data: createdNotification
    });

    return createdNotification;
  }

  async sendPushNotification(notification: PushNotification): Promise<void> {
    await this.sendWithRetry(notification, () => this.pushProvider.send(notification));
  }

  async sendInAppNotification(notification: InAppNotification): Promise<void> {
    await this.sendWithRetry(notification, () => this.inAppProvider.send(notification));
  }

  async sendSMSNotification(notification: SMSNotification): Promise<void> {
    await this.sendWithRetry(notification, () => this.smsProvider.send(notification));
  }

  async sendEmailNotification(notification: EmailNotification): Promise<void> {
    await this.sendWithRetry(notification, () => this.emailProvider.send(notification));
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = await (this.prisma as any).notificationPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) {
      preferences = await (this.prisma as any).notificationPreferences.create({
        data: {
          userId,
          pushEnabled: true,
          inAppEnabled: true,
          smsEnabled: true,
          emailEnabled: true
        }
      });
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return (this.prisma as any).notificationPreferences.update({
      where: { userId },
      data: preferences
    });
  }

  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    return (this.prisma as any).notificationTemplate.create({
      data: template
    });
  }

  async getTemplate(name: string): Promise<NotificationTemplate | null> {
    return (this.prisma as any).notificationTemplate.findUnique({
      where: { name }
    });
  }

  async updateTemplate(
    name: string,
    template: Partial<NotificationTemplate>
  ): Promise<NotificationTemplate> {
    return (this.prisma as any).notificationTemplate.update({
      where: { name },
      data: template
    });
  }

  async deleteTemplate(name: string): Promise<void> {
    await (this.prisma as any).notificationTemplate.delete({
      where: { name }
    });
  }

  async getNotificationsByUser(
    userId: string,
    options: {
      channel?: NotificationChannel;
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    return (this.prisma as any).notification.findMany({
      where: {
        userId,
        ...(options.channel && { channel: options.channel }),
        ...(options.status && { status: options.status })
      },
      take: options.limit,
      skip: options.offset,
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateNotificationStatus(
    id: string,
    status: NotificationStatus
  ): Promise<Notification> {
    return (this.prisma as any).notification.update({
      where: { id },
      data: { status }
    });
  }

  private isChannelEnabled(
    channel: NotificationChannel,
    preferences: NotificationPreferences
  ): boolean {
    switch (channel) {
      case NotificationChannel.PUSH:
        return preferences.pushEnabled;
      case NotificationChannel.IN_APP:
        return preferences.inAppEnabled;
      case NotificationChannel.SMS:
        return preferences.smsEnabled;
      case NotificationChannel.EMAIL:
        return preferences.emailEnabled;
      default:
        return false;
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours) return false;

    const now = new Date();
    const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);

    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);

    return now >= startTime && now <= endTime;
  }
} 