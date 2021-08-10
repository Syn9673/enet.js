import { ENetList, ENetListNode } from "./list";
import { ENetBuffer } from "./other";

import {
  ENetProtocol,
  ENetUnnamedProtocol
} from "./protocol";

import {
  enet_uint16,
  enet_uint32,
  enet_uint8,
} from "./types";

import dgram from "dgram";

export const ENET_VERSION_MAJOR = 1,
  ENET_VERSION_MINOR     = 3,
  ENET_VERSION_PATCH     = 17,
  ENET_VERSION_CREATE    = (major, minor, patch) => (((major) << 16) | ((minor) << 8) | (patch)),
  ENET_VERSION_GET_MAJOR = (version) => (((version) >> 16) & 0xFF),
  ENET_VERSION_GET_MINOR = (version) => (((version) >> 8) & 0xFF),
  ENET_VERSION_GET_PATCH = (version) => ((version) & 0xFF),
  ENET_VERSION           = ENET_VERSION_CREATE(ENET_VERSION_MAJOR, ENET_VERSION_MINOR, ENET_VERSION_PATCH);

export enum ENetSocketType {
  ENET_SOCKET_TYPE_STREAM   = 1,
  ENET_SOCKET_TYPE_DATAGRAM = 2
}

export enum ENetSocketWait {
  ENET_SOCKET_WAIT_NONE      = 0,
  ENET_SOCKET_WAIT_SEND      = (1 << 0),
  ENET_SOCKET_WAIT_RECEIVE   = (1 << 1),
  ENET_SOCKET_WAIT_INTERRUPT = (1 << 2)
}

export enum ENetSocketOption {
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

export enum ENetSocketShutdown {
  ENET_SOCKET_SHUTDOWN_READ       = 0,
  ENET_SOCKET_SHUTDOWN_WRITE      = 1,
  ENET_SOCKET_SHUTDOWN_READ_WRITE = 2
}

export const ENET_HOST_ANY   = 0,
  ENET_HOST_BROADCAST = 0xFFFFFFFF,
  ENET_PORT_ANY       = 0;

export class ENetAddress {
  public host: string;
  public port: enet_uint16;
}

export enum ENetPacketFlag {
  ENET_PACKET_FLAG_RELIABLE            = (1 << 0),
  ENET_PACKET_FLAG_UNSEQUENCED         = (1 << 1),
  ENET_PACKET_FLAG_NO_ALLOCATE         = (1 << 2),
  ENET_PACKET_FLAG_UNRELIABLE_FRAGMENT = (1 << 3),
  ENET_PACKET_FLAG_SENT                = (1 << 8)
}

export type ENetPacketFreeCallback = (packet: ENetPacket) => void;

export class ENetPacket {
  public referenceCount: number;
  public flags: enet_uint32;
  public data: Buffer;
  public dataLength: number;
  public freeCallback: ENetPacketFreeCallback; // come back to the type later
  public userData: Buffer;
}

export class ENetAcknowledgement {
  public acknowledgementList: ENetListNode = new ENetListNode();
  public sentTime: enet_uint32;
  public command: ENetProtocol = new ENetProtocol();
}

export class ENetOutgoingCommand {
  public outgoingCommandList: ENetListNode = new ENetListNode();
  public reliableSequencedNumber: enet_uint16;
  public unreliableSequencedNumber: enet_uint16;
  public sentTime: enet_uint32;
  public roundTripTimeout: enet_uint32;
  public roundTripTimeoutLimit: enet_uint32;
  public fragmentOffset: enet_uint32;
  public fragmentLength: enet_uint16;
  public sendAttempts: enet_uint16;
  public command: ENetProtocol = new ENetProtocol();
  public packet: ENetPacket = new ENetPacket();
}

export class ENetIncomingCommand {
  public incomingCommandList: ENetListNode = new ENetListNode();
  public reliableSequencedNumber: enet_uint16;
  public unreliableSequencedNumber: enet_uint16;
  public command: ENetProtocol = new ENetProtocol();
  public fragmentCount: enet_uint32;
  public fragmentsRemaining: enet_uint32;
  public fragments: Buffer; // enet_uint32*
  public packet: ENetPacket = new ENetPacket();
}

export enum ENetPeerState {
  ENET_PEER_STATE_DISCONNECTED                = 0,
  ENET_PEER_STATE_CONNECTING                  = 1,
  ENET_PEER_STATE_ACKNOWLEDGING_CONNECT       = 2,
  ENET_PEER_STATE_CONNECTION_PENDING          = 3,
  ENET_PEER_STATE_CONNECTION_SUCCEEDED        = 4,
  ENET_PEER_STATE_CONNECTED                   = 5,
  ENET_PEER_STATE_DISCONNECT_LATER            = 6,
  ENET_PEER_STATE_DISCONNECTING               = 7,
  ENET_PEER_STATE_ACKNOWLEDGING_DISCONNECT    = 8,
  ENET_PEER_STATE_ZOMBIE                      = 9 
}

export const ENET_BUFFER_MAXIMUM = (1 + 2 * ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_PACKET_COMMANDS);

export enum ENetHeaderUnnamedEnum {
  ENET_HOST_RECEIVE_BUFFER_SIZE          = 256 * 1024,
  ENET_HOST_SEND_BUFFER_SIZE             = 256 * 1024,
  ENET_HOST_BANDWIDTH_THROTTLE_INTERVAL  = 1000,
  ENET_HOST_DEFAULT_MTU                  = 1400,
  ENET_HOST_DEFAULT_MAXIMUM_PACKET_SIZE  = 32 * 1024 * 1024,
  ENET_HOST_DEFAULT_MAXIMUM_WAITING_DATA = 32 * 1024 * 1024,

  ENET_PEER_DEFAULT_ROUND_TRIP_TIME      = 500,
  ENET_PEER_DEFAULT_PACKET_THROTTLE      = 32,
  ENET_PEER_PACKET_THROTTLE_SCALE        = 32,
  ENET_PEER_PACKET_THROTTLE_COUNTER      = 7, 
  ENET_PEER_PACKET_THROTTLE_ACCELERATION = 2,
  ENET_PEER_PACKET_THROTTLE_DECELERATION = 2,
  ENET_PEER_PACKET_THROTTLE_INTERVAL     = 5000,
  ENET_PEER_PACKET_LOSS_SCALE            = (1 << 16),
  ENET_PEER_PACKET_LOSS_INTERVAL         = 10000,
  ENET_PEER_WINDOW_SIZE_SCALE            = 64 * 1024,
  ENET_PEER_TIMEOUT_LIMIT                = 32,
  ENET_PEER_TIMEOUT_MINIMUM              = 5000,
  ENET_PEER_TIMEOUT_MAXIMUM              = 30000,
  ENET_PEER_PING_INTERVAL                = 500,
  ENET_PEER_UNSEQUENCED_WINDOWS          = 64,
  ENET_PEER_UNSEQUENCED_WINDOW_SIZE      = 1024,
  ENET_PEER_FREE_UNSEQUENCED_WINDOWS     = 32,
  ENET_PEER_RELIABLE_WINDOWS             = 16,
  ENET_PEER_RELIABLE_WINDOW_SIZE         = 0x1000,
  ENET_PEER_FREE_RELIABLE_WINDOWS        = 8
}

export class ENetChannel {
  public outgoingReliableSequenceNumber: enet_uint16;
  public outgoingUnreliableSequenceNumber: enet_uint16;
  public usedReliableWindows: enet_uint16;
  public reliableWindows: Buffer; // enet_uint16 array with size ENET_PEER_RELIABLE_WINDOWS
  public incomingReliableSequenceNumber: enet_uint16;
  public incomingUnreliableSequenceNumber: enet_uint16;
  public incomingReliableCommands: ENetList = new ENetList();
  public incomingUnreliableCommands: ENetList = new ENetList();
}

export enum ENetPeerFlag {
  ENET_PEER_FLAG_NEEDS_DISPATCH = (1 << 0)
}

export class ENetPeer {
  public dispatchList: ENetListNode = new ENetListNode();
  public host: ENetHost;
  public outgoingPeerID: enet_uint16;
  public incomingPeerID: enet_uint16;
  public connectID: enet_uint32;
  public outgoingSessionID: enet_uint8;
  public incomingSessionID: enet_uint8;
  public address: ENetAddress;
  public data: any;
  public state: ENetPeerState;
  public channels: ENetChannel[];
  public channelCount: number;
  public incomingBandwitdh: enet_uint32;
  public outgoingBandwidth: enet_uint32;
  public incomingBandwidthThrottleEpoch: enet_uint32;
  public outgoingBandwidthThrottleEpoch: enet_uint32;
  public incomingDataTotal: enet_uint32;
  public outgoingDataTotal: enet_uint32;
  public lastSendTime: enet_uint32;
  public lastReceiveTime: enet_uint32;
  public nextTimeout: enet_uint32;
  public earliestTimeout: enet_uint32;
  public packetLossEpoch: enet_uint32;
  public packetsSent: enet_uint32;
  public packetsLost: enet_uint32;
  public packetLoss: enet_uint32;
  public packetLossVariance: enet_uint32;
  public packetThrottle: enet_uint32;
  public packetThrottleLimit: enet_uint32;
  public packetThrottleCounter: enet_uint32;
  public packetThrottleEpoch: enet_uint32;
  public packetThrottleAcceleration: enet_uint32;
  public packetThrottleDeceleration: enet_uint32;
  public packetThrottleInterval: enet_uint32;
  public pingInterval: enet_uint32;
  public timeoutLimit: enet_uint32;
  public timeoutMaximum: enet_uint32;
  public timeoutMinimum: enet_uint32;
  public lastRoundtripTime: enet_uint32;
  public lowestRoundtripTime: enet_uint32;
  public lastRoundTripTimeVariance: enet_uint32;
  public highestRoundTripTimeVariance: enet_uint32;
  public roundTripTime: enet_uint32;
  public roundTripTimeVariance: enet_uint32;
  public mtu: enet_uint32;
  public windowSize: enet_uint32;
  public reliableDataInTransit: enet_uint32;
  public outgoingReliableSequenceNumber: enet_uint16;
  public acknowledgements: ENetList = new ENetList();
  public sentReliableCommands: ENetList = new ENetList();
  public sentUnreliableCommands: ENetList = new ENetList();
  public outgoingCommands: ENetList = new ENetList();
  public dispatchedCommands: ENetList = new ENetList();
  public flags: enet_uint16;
  public reserved: enet_uint16;
  public incomingUnsequencedGroup: enet_uint16;
  public outgoingUnsequencedGroup: enet_uint16;
  public unsequencedWindow: Buffer; // enet_uint32 array with size ENET_PEER_UNSEQUENCED_WINDOW_SIZE / 32
  public eventData: enet_uint32;
  public totalWaitingData: number;
}

export class ENetCompressor {
  public context: any;

  public compress: (context: any,
    inBuffers: ENetBuffer[],
    inBufferCount: number,
    inLimit: number,
    outData: Buffer,
    outLimit: number) => number;

  public decompress: (context: any,
    inData: Buffer,
    inLimit: number,
    outData: Buffer,
    outLimit: number) => number;

  public destroy: (context) => void;
}

export type ENetChecksumCallback = (buffers: ENetBuffer[], bufferCount: number) => enet_uint32;
export type ENetInterceptCallback = (host: ENetHost, event: ENetEvent) => number;

export class ENetHost {
  public socket: dgram.Socket;
  public address: ENetAddress;
  public incomingBandwidth: enet_uint32;
  public outgoingBandwidth: enet_uint32;
  public bandwidthThrottleEpoch: enet_uint32;
  public mtu: enet_uint32;
  public randomSeed: enet_uint32;
  public recalculateBandwidthLimits: number; // int
  public peers: ENetPeer[];
  public peerCount: number;
  public channelLimit: number;
  public serviceTime: enet_uint32;
  public dispatchQueue: ENetList = new ENetList();
  public continueSending: number; // int
  public packetSize: number;
  public headerFlags: enet_uint16;
  public commands: ENetProtocol[]; // max length: ENET_PROTOCOL_MAXIMUM_PACKET_COMMANDS
  public commandCount: number;
  public buffers: ENetBuffer[]; // max length: ENET_BUFFER_MAXIMUM
  public bufferCount: number;
  public checksum: ENetChecksumCallback;
  public compressor: ENetCompressor;
  public packetData: enet_uint8[][]; // 2d array
  public receivedAddress: ENetAddress;
  public receivedData: Buffer;
  public receivedDataLength: number;
  public totalSentData: enet_uint32;
  public totalSentPackets: enet_uint32;
  public totalReceivedData: enet_uint32;
  public totalReceivedPackets: enet_uint32;
  public intercept: ENetInterceptCallback;
  public connectedPeers: number;
  public bandwidthLimitedPeers: number;
  public duplicatePeers: number;
  public maximumPacketSize: number;
  public maximumWaitingData: number;
}

export enum ENetEventType {
  ENET_EVENT_TYPE_NONE       = 0,  
  ENET_EVENT_TYPE_CONNECT    = 1,  
  ENET_EVENT_TYPE_DISCONNECT = 2,  
  ENET_EVENT_TYPE_RECEIVE    = 3
}

export class ENetEvent {
  public type: ENetEventType;
  public peer: ENetPeer;
  public channelID: enet_uint8;
  public data: enet_uint32;
  public packet: ENetPacket = new ENetPacket();
}