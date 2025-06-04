export enum NotificationChannel {
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  EMAIL = 'EMAIL'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushNotification extends Notification {
  channel: NotificationChannel.PUSH;
  deviceToken: string;
  badgeCount?: number;
  sound?: string;
}

export interface InAppNotification extends Notification {
  channel: NotificationChannel.IN_APP;
  actionUrl?: string;
  icon?: string;
}

export interface SMSNotification extends Notification {
  channel: NotificationChannel.SMS;
  phoneNumber: string;
}

export interface EmailNotification extends Notification {
  channel: NotificationChannel.EMAIL;
  email: string;
  subject: string;
  htmlContent?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface NotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
} 