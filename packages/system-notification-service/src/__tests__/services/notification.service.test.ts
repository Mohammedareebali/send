import { NotificationService } from '../../services/notification.service';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from '../../infra/messaging/rabbitmq';
import { PushProvider } from '../../providers/push.provider';
import { InAppProvider } from '../../providers/inapp.provider';
import { SMSProvider } from '../../providers/sms.provider';
import { EmailProvider } from '../../providers/email.provider';
import { NotificationStatus, NotificationChannel } from '../../types/notification.types';

type PrismaNotification = {
  update: jest.Mock;
};

type PrismaClientMock = {
  notification: PrismaNotification;
};

let mockPrisma: PrismaClientMock;

jest.mock('../../providers/push.provider');
jest.mock('../../providers/inapp.provider');
jest.mock('../../providers/sms.provider');
jest.mock('../../providers/email.provider');
jest.mock('../../infra/messaging/rabbitmq');
jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(),
      consume: jest.fn(),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}));

const mockNotification: any = {
  id: '1',
  userId: 'u1',
  title: 'title',
  message: 'message',
  channel: NotificationChannel.PUSH,
  priority: 'LOW',
  status: NotificationStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  deviceToken: 'token'
};

let notificationService: NotificationService;
let pushInstance: jest.Mocked<PushProvider>;
let inAppInstance: jest.Mocked<InAppProvider>;
let smsInstance: jest.Mocked<SMSProvider>;
let emailInstance: jest.Mocked<EmailProvider>;

beforeEach(() => {
  mockPrisma = {
    notification: {
      update: jest.fn()
    }
  } as unknown as PrismaClientMock;

  (PushProvider as jest.Mock).mockImplementation(() => ({ send: jest.fn() }));
  (InAppProvider as jest.Mock).mockImplementation(() => ({ send: jest.fn() }));
  (SMSProvider as jest.Mock).mockImplementation(() => ({ send: jest.fn() }));
  (EmailProvider as jest.Mock).mockImplementation(() => ({ send: jest.fn() }));

  notificationService = new NotificationService();

  pushInstance = (PushProvider as jest.Mock).mock.results[(PushProvider as jest.Mock).mock.results.length - 1].value;
  inAppInstance = (InAppProvider as jest.Mock).mock.results[(InAppProvider as jest.Mock).mock.results.length - 1].value;
  smsInstance = (SMSProvider as jest.Mock).mock.results[(SMSProvider as jest.Mock).mock.results.length - 1].value;
  emailInstance = (EmailProvider as jest.Mock).mock.results[(EmailProvider as jest.Mock).mock.results.length - 1].value;

  // Replace prisma in service with our mock
  (notificationService as any).prisma = mockPrisma;
});

describe('NotificationService send methods', () => {
  it('should send push notification', async () => {
    await notificationService.sendPushNotification(mockNotification);
    expect(pushInstance.send).toHaveBeenCalledWith(mockNotification);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: mockNotification.id },
      data: { status: NotificationStatus.SENT }
    });
  });

  it('should send in-app notification', async () => {
    const notif = { ...mockNotification, channel: NotificationChannel.IN_APP };
    await notificationService.sendInAppNotification(notif as any);
    expect(inAppInstance.send).toHaveBeenCalledWith(notif);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: notif.id },
      data: { status: NotificationStatus.SENT }
    });
  });

  it('should send SMS notification', async () => {
    const notif = { ...mockNotification, channel: NotificationChannel.SMS };
    await notificationService.sendSMSNotification(notif as any);
    expect(smsInstance.send).toHaveBeenCalledWith(notif);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: notif.id },
      data: { status: NotificationStatus.SENT }
    });
  });

  it('should send email notification', async () => {
    const notif = { ...mockNotification, channel: NotificationChannel.EMAIL };
    await notificationService.sendEmailNotification(notif as any);
    expect(emailInstance.send).toHaveBeenCalledWith(notif);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: notif.id },
      data: { status: NotificationStatus.SENT }
    });
  });
});
