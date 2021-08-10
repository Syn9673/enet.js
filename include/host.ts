import { ENetAddress, ENetCompressor, ENetHeaderUnnamedEnum, ENetHost, ENetPeer, ENET_HOST_ANY } from "./enet";
import { ENetUnnamedProtocol } from "./protocol";
import { enet_uint32 } from "./types";
import dgram from "dgram";
import { ENetList, enet_list_clear } from "./list";

export const enet_host_random_seed = () => Date.now();

export const enet_socket_bind = (host: ENetHost, address: ENetAddress) => {
  host.socket.bind(address.port,
    address.host,
    () => {
      host.socket.setBroadcast(true);
      host.socket.setRecvBufferSize(ENetHeaderUnnamedEnum.ENET_HOST_RECEIVE_BUFFER_SIZE);
      host.socket.setSendBufferSize(ENetHeaderUnnamedEnum.ENET_HOST_SEND_BUFFER_SIZE);
    });
}

export const enet_host_create = (address: ENetAddress,
  peerCount:  number,
  channelLimit: number,
  incomingBandwidth: enet_uint32,
  outgoingBandwidth: enet_uint32
) => {
  const host = new ENetHost();
  if (peerCount > ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_PEER_ID)
    return null;

  host.peers = new Array(peerCount)
    .fill(new ENetPeer());
  host.socket = dgram.createSocket("udp4");

  enet_socket_bind(host, address);

  if (address)
    host.address = address;

  if (!channelLimit || channelLimit > ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_CHANNEL_COUNT)
    channelLimit = ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_CHANNEL_COUNT;
  else if (channelLimit < ENetUnnamedProtocol.ENET_PROTOCOL_MINIMUM_CHANNEL_COUNT)
    channelLimit = ENetUnnamedProtocol.ENET_PROTOCOL_MINIMUM_CHANNEL_COUNT;

  host.randomSeed = Math.floor(Math.random() * Math.random() * 2147483647);
  host.randomSeed += enet_host_random_seed();
  host.randomSeed = (host.randomSeed << 16) | (host.randomSeed >> 16);

  host.channelLimit = channelLimit;
  host.incomingBandwidth = incomingBandwidth;
  host.outgoingBandwidth = outgoingBandwidth;

  host.bandwidthThrottleEpoch = 0;
  host.recalculateBandwidthLimits = 0;
  host.mtu = ENetHeaderUnnamedEnum.ENET_HOST_DEFAULT_MTU;
  host.peerCount = peerCount;
  host.commandCount = 0;
  host.bufferCount = 0;
  host.checksum = null;
  
  host.receivedAddress = new ENetAddress();

  host.receivedAddress.host = "";
  host.receivedAddress.port = 0;
  host.receivedData = null;
  host.receivedDataLength = 0;

  host.totalSentData = 0;
  host.totalSentPackets = 0;
  host.totalReceivedData = 0;
  host.totalReceivedPackets = 0;

  host.connectedPeers = 0;
  host.bandwidthLimitedPeers = 0;
  host.duplicatePeers = ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_PEER_ID;
  host.maximumPacketSize = ENetHeaderUnnamedEnum.ENET_HOST_DEFAULT_MAXIMUM_PACKET_SIZE;
  host.maximumWaitingData = ENetHeaderUnnamedEnum.ENET_HOST_DEFAULT_MAXIMUM_WAITING_DATA;

  host.compressor = new ENetCompressor();

  host.compressor.context = null;
  host.compressor.compress = null;
  host.compressor.decompress = null;
  host.compressor.destroy = null;

  host.intercept = null;
  host.dispatchQueue = new ENetList();

  enet_list_clear(host.dispatchQueue);

  for (let i = 0; i < host.peerCount; i++) {
    const currentPeer = host.peers[i];

    currentPeer.host = host;
    currentPeer.incomingPeerID = i;
    currentPeer.outgoingSessionID = currentPeer.incomingPeerID = 0xFF;
    currentPeer.data = null;

    enet_list_clear(currentPeer.acknowledgements);
    enet_list_clear(currentPeer.sentReliableCommands);
    enet_list_clear(currentPeer.sentUnreliableCommands);
    enet_list_clear(currentPeer.outgoingCommands);
    enet_list_clear(currentPeer.dispatchedCommands);

    
  }

  return host;
}