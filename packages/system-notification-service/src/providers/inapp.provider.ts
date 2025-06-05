import { InAppNotification } from "../types/notification.types";
import { Logger } from "winston";
import { io, Socket } from "socket.io-client";

export class InAppProvider {
  private socket: Socket;

  constructor(private readonly logger: Logger) {
    const url = process.env.NOTIFICATION_WS_URL || "http://localhost:3000";
    this.socket = io(url, { autoConnect: false });

    this.socket.on("connect_error", (err) => {
      this.logger.error("WebSocket connection error", { error: err });
    });
  }

  async send(notification: InAppNotification): Promise<void> {
    this.logger.info("Sending in-app notification", { id: notification.id });
    try {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      this.socket.emit("notification", notification);
      this.logger.info("In-app notification sent", { id: notification.id });
    } catch (error) {
      this.logger.error("Failed to send in-app notification", {
        id: notification.id,
        error,
      });
      throw error;
    }
  }
}
