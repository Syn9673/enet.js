import { ENetListNode } from "./list";
import { ENetProtocol } from "./protocol";
import {
  enet_uint16,
  enet_uint32,
} from "./types";

const ENET_VERSION_MAJOR = 1,
  ENET_VERSION_MINOR     = 3,
  ENET_VERSION_PATCH     = 17,
  ENET_VERSION_CREATE    = (major, minor, patch) => (((major) << 16) | ((minor) << 8) | (patch)),
  ENET_VERSION_GET_MAJOR = (version) => (((version) >> 16) & 0xFF),
  ENET_VERSION_GET_MINOR = (version) => (((version) >> 8) & 0xFF),
  ENET_VERSION_GET_PATCH = (version) => ((version) & 0xFF),
  ENET_VERSION           = ENET_VERSION_CREATE(ENET_VERSION_MAJOR, ENET_VERSION_MINOR, ENET_VERSION_PATCH);

enum ENetSocketType {
  ENET_SOCKET_TYPE_STREAM   = 1,
  ENET_SOCKET_TYPE_DATAGRAM = 2
}

enum ENetSocketWait {
  ENET_SOCKET_WAIT_NONE      = 0,
  ENET_SOCKET_WAIT_SEND      = (1 << 0),
  ENET_SOCKET_WAIT_RECEIVE   = (1 << 1),
  ENET_SOCKET_WAIT_INTERRUPT = (1 << 2)
}

enum ENetSocketOption {
  ENET_SOCKOPT_NONBLOCK  = 1,
  ENET_SOCKOPT_BROADCAST = 2,
  ENET_SOCKOPT_RCVBUF    = 3,
  ENET_SOCKOPT_SNDBUF    = 4,
  ENET_SOCKOPT_REUSEADDR = 5,
  ENET_SOCKOPT_RCVTIMEO  = 6,
  ENET_SOCKOPT_SNDTIMEO  = 7,
  ENET_SOCKOPT_ERROR     = 8,
  ENET_SOCKOPT_NODELAY   = 9
}

enum ENetSocketShutdown {
  ENET_SOCKET_SHUTDOWN_READ       = 0,
  ENET_SOCKET_SHUTDOWN_WRITE      = 1,
  ENET_SOCKET_SHUTDOWN_READ_WRITE = 2
}

const ENET_HOST_ANY   = 0,
  ENET_HOST_BROADCAST = 0xFFFFFFFF,
  ENET_PORT_ANY       = 0;

class ENetAddress {
  public host: enet_uint32;
  public port: enet_uint16;
}

enum ENetPacketFlag {
  ENET_PACKET_FLAG_RELIABLE            = (1 << 0),
  ENET_PACKET_FLAG_UNSEQUENCED         = (1 << 1),
  ENET_PACKET_FLAG_NO_ALLOCATE         = (1 << 2),
  ENET_PACKET_FLAG_UNRELIABLE_FRAGMENT = (1 << 3),
  ENET_PACKET_FLAG_SENT                = (1<<8)
}

type ENetPacketFreeCallback = (packet: ENetPacket) => void;

class ENetPacket {
  public referenceCount: number;
  public flags: enet_uint32;
  public data: Buffer;
  public dataLength: number;
  public freeCallback: ENetPacketFreeCallback; // come back to the type later
  public userData: Buffer;
}

class ENetAcknowledgement {
  public acknowledgementList: ENetListNode;
  public sentTime: enet_uint32;
  public command: ENetProtocol;
}

class ENetOutgoingCommand {
  public outgoingCommandList: ENetListNode;
  public reliableSequencedNumber: enet_uint16;
  public unreliableSequencedNumber: enet_uint16;
  public sentTime: enet_uint32;
  public roundTripTimeout: enet_uint32;
  public roundTripTimeoutLimit: enet_uint32;
  public fragmentOffset: enet_uint32;
  public fragmentLength: enet_uint16;
  public sendAttempts: enet_uint16;
  public command: ENetProtocol;
  public packet: ENetPacket;
}