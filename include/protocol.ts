import { enet_uint16, enet_uint32, enet_uint8 } from "./types";

enum ENetUnnamedProtocol {
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

enum ENetProtocolCommand {
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

enum ENetProtocolFlag {
  ENET_PROTOCOL_COMMAND_FLAG_ACKNOWLEDGE = (1 << 7),
  ENET_PROTOCOL_COMMAND_FLAG_UNSEQUENCED = (1 << 6),

  ENET_PROTOCOL_HEADER_FLAG_COMPRESSED = (1 << 14),
  ENET_PROTOCOL_HEADER_FLAG_SENT_TIME  = (1 << 15),
  ENET_PROTOCOL_HEADER_FLAG_MASK       = ENET_PROTOCOL_HEADER_FLAG_COMPRESSED | ENET_PROTOCOL_HEADER_FLAG_SENT_TIME,

  ENET_PROTOCOL_HEADER_SESSION_MASK    = (3 << 12),
  ENET_PROTOCOL_HEADER_SESSION_SHIFT   = 12
}

class ENetProtocolHeader {
  public peerID: enet_uint16;
  public sentTime: enet_uint16;
}

/**
 * Size: 4
 */
class ENetProtocolCommandHeader {
  public command: enet_uint8;
  public channelID: enet_uint8;
  public reliableSequenceNumber: enet_uint16;
}

/**
 * Size: 8
 */
class ENetProtocolAcknowledge {
  public header: ENetProtocolCommandHeader;
  public receivedReliableSequenceNumber: enet_uint16;
  public receivedSentTime: enet_uint16;
}

/**
 * Size: 48
 */
class ENetProtocolConnect {
  public header: ENetProtocolCommandHeader;
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
class ENetProtocolVerifyConnect {
  public header: ENetProtocolCommandHeader;
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
class ENetProtocolBandwidthLimit {
  public header: ENetProtocolCommandHeader;
  public incomingBandwidth: enet_uint32;
  public outgoingBandwidth: enet_uint32;
}

/**
 * Size: 16
 */
class ENetProtocolThrottleConfigure {
  public header: ENetProtocolCommandHeader;
  public packetThrottleInterval: enet_uint32;
  public packetThrottleAcceleration: enet_uint32;
  public packetThrottleDeceleration: enet_uint32;
}

/**
 * Size: 8
 */
class ENetProtocolDisconnect {
  public header: ENetProtocolCommandHeader;
  public data: enet_uint32;
}

/**
 * Size: 4
 */
class ENetProtocolPing {
  public header: ENetProtocolCommandHeader;
}

/**
 * Size: 6
 */
class ENetProtocolSendReliable {
  public header: ENetProtocolCommandHeader;
  public dataLength: enet_uint16;
}

/**
 * Size: 8
 */
class ENetProtocolSendUnreliable {
  public header: ENetProtocolCommandHeader;
  public unreliableSequenceNumber: enet_uint16;
  public dataLength: enet_uint16;
}

/**
 * Size: 8
 */
class ENetProtocolSendUnsequenced {
  public header: ENetProtocolCommandHeader;
  public unsequencedGroup: enet_uint16;
  public dataLength: enet_uint16;
}

/**
 * Size: 24
 */
class ENetProtocolSendFragment {
  public header: ENetProtocolCommandHeader;
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
class ENetProtocol {
  public header: ENetProtocolCommandHeader;
  public acknowledge: ENetProtocolAcknowledge;
  public connect: ENetProtocolConnect;
  public verifyConnect: ENetProtocolVerifyConnect;
  public disconnect: ENetProtocolDisconnect;
  public ping: ENetProtocolPing;
  public sendReliable: ENetProtocolSendReliable;
  public sendUnreliable: ENetProtocolSendUnreliable;
  public sendUnsequenced: ENetProtocolSendUnsequenced;
  public sendFragment: ENetProtocolSendFragment;
  public bandwidthLimit: ENetProtocolBandwidthLimit;
  public throttleConfigure: ENetProtocolThrottleConfigure;
}

const commandSizes = [
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

const enet_protocol_command_size = (commandNumber: enet_uint8) => (
  commandSizes[commandNumber & ENetProtocolCommand.ENET_PROTOCOL_COMMAND_MASK]
)

// todo: enet_protocol_change_state 

export {
  ENetUnnamedProtocol,
  ENetProtocolCommand,
  ENetProtocolFlag,
  ENetProtocolHeader,
  ENetProtocolCommandHeader,
  ENetProtocolAcknowledge,
  ENetProtocolConnect,
  ENetProtocolVerifyConnect,
  ENetProtocolDisconnect,
  ENetProtocolPing,
  ENetProtocolSendReliable,
  ENetProtocolSendUnreliable,
  ENetProtocolSendUnsequenced,
  ENetProtocolSendFragment,
  ENetProtocolBandwidthLimit,
  ENetProtocolThrottleConfigure,
  ENetProtocol,
}