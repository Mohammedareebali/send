export interface Connection {
  createChannel: () => any;
  close: () => Promise<void>;
}
export interface Channel {
  assertExchange: () => any;
  assertQueue: () => any;
  bindQueue: () => any;
  publish: () => any;
  consume: () => any;
  close: () => any;
}
export const connect = async () => ({
  createChannel: async () => ({
    assertExchange: () => {},
    assertQueue: () => {},
    bindQueue: () => {},
    publish: () => {},
    consume: () => {},
    close: () => {}
  }),
  close: async () => {}
});
