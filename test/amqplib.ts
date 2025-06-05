export interface Connection {
  createChannel(): Promise<Channel>;
  close(): Promise<void>;
}

export interface Channel {
  assertExchange(exchange: string, type: string, options?: any): Promise<any>;
  assertQueue(queue: string, options?: any): Promise<any>;
  bindQueue(queue: string, source: string, pattern: string, args?: any): Promise<any>;
  publish(exchange: string, routingKey: string, content: Buffer, options?: any): boolean;
  consume(queue: string, onMessage: (msg: any | null) => void, options?: any): Promise<any>;
  ack(message: any, allUpTo?: boolean): void;
  nack(message: any, allUpTo?: boolean, requeue?: boolean): void;
  close(): Promise<void>;
}

export const connect = async (_url: string): Promise<Connection> => ({
  createChannel: async () => ({
    assertExchange: async () => ({}),
    assertQueue: async () => ({}),
    bindQueue: async () => ({}),
    publish: () => true,
    consume: async () => ({}),
    ack: () => {},
    nack: () => {},
    close: async () => {}
  }),
  close: async () => {}
});
