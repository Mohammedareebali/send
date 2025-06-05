import { InAppProvider } from "../../providers/inapp.provider";
import {
  NotificationChannel,
  InAppNotification,
  NotificationStatus,
  NotificationPriority,
} from "../../types/notification.types";
import { Logger } from "winston";

const mockEmit = jest.fn();
const mockConnect = jest.fn();
const mockOn = jest.fn();

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    emit: mockEmit,
    connect: mockConnect,
    on: mockOn,
    connected: true,
  })),
}));

const logger: Logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
} as unknown as Logger;

const sampleNotification: InAppNotification = {
  id: "1",
  userId: "u1",
  title: "Hello",
  message: "Message",
  channel: NotificationChannel.IN_APP,
  priority: NotificationPriority.LOW,
  status: NotificationStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("InAppProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("emits notification over websocket", async () => {
    const provider = new InAppProvider(logger);
    await provider.send(sampleNotification);
    expect(mockEmit).toHaveBeenCalledWith("notification", sampleNotification);
  });

  it("logs and throws on error", async () => {
    mockEmit.mockImplementation(() => {
      throw new Error("fail");
    });
    const provider = new InAppProvider(logger);
    await expect(provider.send(sampleNotification)).rejects.toThrow("fail");
    expect(logger.error).toHaveBeenCalled();
  });
});
