export class ENetBuffer {
  public dataLength: number;
  public data: Buffer;
}

export type ENetSocket = number;

export const htonl = (n: number) => {
  const chunk = Buffer.alloc(4);
  chunk.writeUInt32LE(n);

  return chunk.readUInt32BE();
}

export const htons = (n: number) => {
  const chunk = Buffer.alloc(2);
  chunk.writeUInt16LE(n);

  return chunk.readUInt16BE();
}

export const ENET_HOST_TO_NET_32 = (value: number) => htonl(value);
export const ENET_HOST_TO_NET_16 = (value: number) => htons(value);