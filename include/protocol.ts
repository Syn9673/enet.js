import { enet_uint16, enet_uint32, enet_uint8 } from "./types";

export enum ENetUnnamedProtocol {
  ENET_PROTOCOL_MINIMUM_MTU             = 576,
  ENET_PROTOCOL_MAXIMUM_MTU             = 4096,
  ENET_PROTOCOL_MAXIMUM_PACKET_COMMANDS = 32,
  ENET_PROTOCOL_MINIMUM_WINDOW_SIZE     = 4096,
  ENET_PROTOCOL_MAXIMUM_WINDOW_SIZE     = 65536,
  ENET_PROTOCOL_MINIMUM_CHANNEL_COUNT   = 1,
  ENET_PROTOCOL_MAXIMUM_CHANNEL_COUNT   = 255,
  ENET_PROTOCOL_MAXIMUM_PEER_ID         = 0xFFF,
  ENET_PROTOCOL_MAXIMUM_FRAGMENT_COUNT  = 1024 * 1024
}

export enum ENetProtocolCommand {
   ENET_PROTOCOL_COMMAND_NONE               = 0,
   ENET_PROTOCOL_COMMAND_ACKNOWLEDGE        = 1,
   ENET_PROTOCOL_COMMAND_CONNECT            = 2,
   ENET_PROTOCOL_COMMAND_VERIFY_CONNECT     = 3,
   ENET_PROTOCOL_COMMAND_DISCONNECT         = 4,
   ENET_PROTOCOL_COMMAND_PING               = 5,
   ENET_PROTOCOL_COMMAND_SEND_RELIABLE      = 6,
   ENET_PROTOCOL_COMMAND_SEND_UNRELIABLE    = 7,
   ENET_PROTOCOL_COMMAND_SEND_FRAGMENT      = 8,
   ENET_PROTOCOL_COMMAND_SEND_UNSEQUENCED   = 9,
   ENET_PROTOCOL_COMMAND_BANDWIDTH_LIMIT    = 10,
   ENET_PROTOCOL_COMMAND_THROTTLE_CONFIGURE = 11,
   ENET_PROTOCOL_COMMAND_SEND_UNRELIABLE_FRAGMENT = 12,
   ENET_PROTOCOL_COMMAND_COUNT              = 13,

   ENET_PROTOCOL_COMMAND_MASK               = 0x0F
}

export enum ENetProtocolFlag {
  ENET_PROTOCOL_COMMAND_FLAG_ACKNOWLEDGE = (1 << 7),
  ENET_PROTOCOL_COMMAND_FLAG_UNSEQUENCED = (1 << 6),

  ENET_PROTOCOL_HEADER_FLAG_COMPRESSED = (1 << 14),
  ENET_PROTOCOL_HEADER_FLAG_SENT_TIME  = (1 << 15),
  ENET_PROTOCOL_HEADER_FLAG_MASK       = ENET_PROTOCOL_HEADER_FLAG_COMPRESSED | ENET_PROTOCOL_HEADER_FLAG_SENT_TIME,

  ENET_PROTOCOL_HEADER_SESSION_MASK    = (3 << 12),
  ENET_PROTOCOL_HEADER_SESSION_SHIFT   = 12
}

export class ENetProtocolHeader {
  public peerID: enet_uint16;
  public sentTime: enet_uint16;
}

/**
 * Size: 4
 */
export class ENetProtocolCommandHeader {
  public command: enet_uint8;
  public channelID: enet_uint8;
  public reliableSequenceNumber: enet_uint16;
}

/**
 * Size: 8
 */
export class ENetProtocolAcknowledge {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public receivedReliableSequenceNumber: enet_uint16;
  public receivedSentTime: enet_uint16;
}

/**
 * Size: 48
 */
export class ENetProtocolConnect {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public outgoingPeerID: enet_uint16;
  public incomingSessionID: enet_uint8;
  public outgoingSessionID: enet_uint8;
  public mtu: enet_uint32;
  public windowSize: enet_uint32;
  public channelSize: enet_uint32;
  public incomingBandwidth: enet_uint32;
  public outgoingBandwidth: enet_uint32;
  public packetThrottleInterval: enet_uint32;
  public packetThrottleAcceleration: enet_uint32;
  public packetThrottleDeceleration: enet_uint32;
  public connectID: enet_uint32;
  public data: enet_uint32;
}

/**
 * Size: 44
 */
export class ENetProtocolVerifyConnect {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public outgoingPeerID: enet_uint16;
  public incomingSessionID: enet_uint8;
  public outgoingSessionID: enet_uint8;
  public mtu: enet_uint32;
  public windowSize: enet_uint32;
  public channelSize: enet_uint32;
  public incomingBandwidth: enet_uint32;
  public outgoingBandwidth: enet_uint32;
  public packetThrottleInterval: enet_uint32;
  public packetThrottleAcceleration: enet_uint32;
  public packetThrottleDeceleration: enet_uint32;
  public connectID: enet_uint32;
}

/**
 * Size: 12
 */
export class ENetProtocolBandwidthLimit {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public incomingBandwidth: enet_uint32;
  public outgoingBandwidth: enet_uint32;
}

/**
 * Size: 16
 */
export class ENetProtocolThrottleConfigure {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public packetThrottleInterval: enet_uint32;
  public packetThrottleAcceleration: enet_uint32;
  public packetThrottleDeceleration: enet_uint32;
}

/**
 * Size: 8
 */
export class ENetProtocolDisconnect {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public data: enet_uint32;
}

/**
 * Size: 4
 */
export class ENetProtocolPing {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
}

/**
 * Size: 6
 */
export class ENetProtocolSendReliable {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public dataLength: enet_uint16;
}

/**
 * Size: 8
 */
export class ENetProtocolSendUnreliable {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public unreliableSequenceNumber: enet_uint16;
  public dataLength: enet_uint16;
}

/**
 * Size: 8
 */
export class ENetProtocolSendUnsequenced {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public unsequencedGroup: enet_uint16;
  public dataLength: enet_uint16;
}

/**
 * Size: 24
 */
export class ENetProtocolSendFragment {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public startSequenceNumber: enet_uint16;
  public dataLength: enet_uint16;
  public fragmentCount: enet_uint32;
  public fragmentNumber: enet_uint32;
  public totalLength: enet_uint32;
  public fragmentOffset: enet_uint32;
}

/**
 * Size: 190
 */
export class ENetProtocol {
  public header: ENetProtocolCommandHeader = new ENetProtocolCommandHeader();
  public acknowledge: ENetProtocolAcknowledge = new ENetProtocolAcknowledge();
  public connect: ENetProtocolConnect = new ENetProtocolConnect();
  public verifyConnect: ENetProtocolVerifyConnect = new ENetProtocolVerifyConnect();
  public disconnect: ENetProtocolDisconnect = new ENetProtocolDisconnect();
  public ping: ENetProtocolPing = new ENetProtocolDisconnect();
  public sendReliable: ENetProtocolSendReliable = new ENetProtocolSendReliable();
  public sendUnreliable: ENetProtocolSendUnreliable = new ENetProtocolSendUnreliable();
  public sendUnsequenced: ENetProtocolSendUnsequenced = new ENetProtocolSendUnsequenced();
  public sendFragment: ENetProtocolSendFragment = new ENetProtocolSendFragment();
  public bandwidthLimit: ENetProtocolBandwidthLimit = new ENetProtocolBandwidthLimit();
  public throttleConfigure: ENetProtocolThrottleConfigure = new ENetProtocolThrottleConfigure();
}

export const commandSizes = [
  0,  // ??
  8,  // ENetProtocolAcknowledge
  48, // ENetProtocolConnect
  44, // ENetProtocolVerifyConnect
  8,  // ENetProtocolDisconnect
  4,  // ENetProtocolPing
  6,  // ENetProtocolSendReliable
  8,  // ENetProtocolSendUnreliable
  24, // ENetProtocolSendFragment,
  8,  // ENetProtocolSendUnsequenced
  12, // ENetProtocolBandwidthLimit
  16, // ENetProtocolThrottleConfigure
  24, // ENetProtocolSendFragment
]

export const enet_protocol_command_size = (commandNumber: enet_uint8) => (
  commandSizes[commandNumber & ENetProtocolCommand.ENET_PROTOCOL_COMMAND_MASK]
)

// todo: enet_protocol_change_state 