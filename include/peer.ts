import { ENetAcknowledgement, ENetChannel, ENetHeaderUnnamedEnum, ENetIncomingCommand, ENetOutgoingCommand, ENetPacket, ENetPacketFlag, ENetPeer, ENetPeerFlag, ENetPeerState } from "./enet";
import { ENetList, ENetListNode, enet_list_begin, enet_list_clear, enet_list_empty, enet_list_end, enet_list_insert, enet_list_next, enet_list_remove } from "./list";
import { ENET_HOST_TO_NET_16, ENET_HOST_TO_NET_32 } from "./other";
import { ENetProtocol, ENetProtocolCommand, ENetProtocolFlag, ENetUnnamedProtocol, enet_protocol_command_size } from "./protocol";
import { enet_uint16, enet_uint32, enet_uint8 } from "./types";

export const enet_peer_throttle_configure = (peer: ENetPeer,
  interval: enet_uint32,
  acceleration: enet_uint32,
  deceleration: enet_uint32
) => {
  const command = new ENetProtocol();

  peer.packetThrottleInterval = interval;
  peer.packetThrottleAcceleration = acceleration;
  peer.packetThrottleDeceleration = deceleration;

  command.header.command = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_THROTTLE_CONFIGURE;
  command.header.channelID = 0xFF;

  command.throttleConfigure.packetThrottleInterval = ENET_HOST_TO_NET_32(interval);
  command.throttleConfigure.packetThrottleAcceleration = ENET_HOST_TO_NET_32(acceleration);
  command.throttleConfigure.packetThrottleDeceleration = ENET_HOST_TO_NET_32(deceleration);

  enet_peer_queue_outgoing_command(peer, command, null, 0, 0);
}

export const enet_peer_throttle = (peer: ENetPeer, rtt: enet_uint32) => {
  if (peer.lastRoundTripTime <= peer.lastRoundTripTimeVariance)
    peer.packetThrottle = peer.packetThrottleLimit;
  else if (rtt <= peer.lastRoundTripTime) {
    peer.packetThrottle += peer.packetThrottleAcceleration;

    if (peer.packetThrottle > peer.packetThrottleLimit)
      peer.packetThrottle = peer.packetThrottleLimit;

    return 1;
  } else if (rtt > peer.lastRoundTripTime + 2 * peer.lastRoundTripTimeVariance) {
    if (peer.packetThrottle > peer.packetThrottleDeceleration)
      peer.packetThrottle -= peer.packetThrottleDeceleration;
    else
      peer.packetThrottle = 0;

    return -1;
  }

  return 0;
}

export const enet_peer_send = (peer: ENetPeer,
  channelID: enet_uint8,
  packet: ENetPacket
) => {
  const command = new ENetProtocol();

  let fragmentLength: number,
    channel: ENetChannel;

  if (peer.state !== ENetPeerState.ENET_PEER_STATE_CONNECTED ||
      channelID >= peer.channelCount ||
      packet.dataLength > peer.host.maximumPacketSize)
    return -1;

  channel = peer.channels[channelID];
  fragmentLength = peer.mtu - 28;

  if (peer.host.checksum)
    fragmentLength -= 4;

  if (packet.dataLength > fragmentLength) {
    const fragmentCount = (packet.dataLength + fragmentLength - 1) / fragmentLength;

    let fragmentNumber: enet_uint32,
      fragmentOffset: enet_uint32,
      commandNumber: enet_uint8,
      startSequenceNumber: enet_uint16;

    const fragments = new ENetList();
    let fragment: ENetOutgoingCommand;

    if (fragmentCount > ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_FRAGMENT_COUNT)
      return -1;

    if ((packet.flags & (ENetPacketFlag.ENET_PACKET_FLAG_RELIABLE | ENetPacketFlag.ENET_PACKET_FLAG_UNRELIABLE_FRAGMENT)) == ENetPacketFlag.ENET_PACKET_FLAG_UNRELIABLE_FRAGMENT &&
      channel.outgoingUnreliableSequenceNumber < 0xFFFF
    ) {
      commandNumber = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_SEND_UNRELIABLE_FRAGMENT;
      startSequenceNumber = ENET_HOST_TO_NET_16(channel.outgoingUnreliableSequenceNumber + 1);
    } else {
      commandNumber = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_SEND_FRAGMENT | ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_ACKNOWLEDGE;
      startSequenceNumber = ENET_HOST_TO_NET_16(channel.outgoingReliableSequenceNumber + 1);
    }
      
    enet_list_clear(fragments);
    for (fragmentNumber = 0,
      fragmentOffset = 0;
      fragmentOffset < packet.dataLength;
      fragmentNumber++,
      fragmentOffset += fragmentLength
    ) {
      if (packet.dataLength - fragmentOffset < fragmentLength)
        fragmentLength = packet.dataLength - fragmentOffset;

      fragment = new ENetOutgoingCommand();
      
      fragment.fragmentOffset = fragmentOffset;
      fragment.fragmentLength = fragmentLength;
      fragment.packet = packet;
      fragment.command.header.command = commandNumber;
      fragment.command.header.channelID = channelID;
      fragment.command.sendFragment.startSequenceNumber = startSequenceNumber;
      fragment.command.sendFragment.dataLength = ENET_HOST_TO_NET_16(fragmentLength);
      fragment.command.sendFragment.fragmentCount = ENET_HOST_TO_NET_32(fragmentCount);
      fragment.command.sendFragment.fragmentNumber = ENET_HOST_TO_NET_32(fragmentNumber);
      fragment.command.sendFragment.totalLength = ENET_HOST_TO_NET_32(packet.dataLength);
      fragment.command.sendFragment.fragmentOffset = ENET_HOST_TO_NET_32(fragmentOffset);

      enet_list_insert(
        enet_list_end(fragments),
        fragment.outgoingCommandList
      );
    }

    packet.referenceCount += fragmentNumber;
    while (!enet_list_empty(fragments)) {
      fragment.outgoingCommandList = enet_list_remove(enet_list_begin(fragments));

      enet_peer_setup_outgoing_command(peer, fragment);
    }

    return 0;
  }

  command.header.channelID = channelID;

  if ((packet.flags & (ENetPacketFlag.ENET_PACKET_FLAG_RELIABLE | ENetPacketFlag.ENET_PACKET_FLAG_UNSEQUENCED)) == ENetPacketFlag.ENET_PACKET_FLAG_UNSEQUENCED) {
    command.header.command = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_SEND_UNSEQUENCED | ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_UNSEQUENCED;
    command.sendUnsequenced.dataLength = ENET_HOST_TO_NET_16(packet.dataLength);
  } else if (packet.flags & ENetPacketFlag.ENET_PACKET_FLAG_RELIABLE || channel.outgoingUnreliableSequenceNumber >= 0xFFFF) {
   command.header.command = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_SEND_RELIABLE | ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_ACKNOWLEDGE;
   command.sendReliable.dataLength = ENET_HOST_TO_NET_16(packet.dataLength);
  } else {
    command.header.command = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_SEND_UNRELIABLE;
    command.sendUnreliable.dataLength = ENET_HOST_TO_NET_16(packet.dataLength);
  }

  if (!enet_peer_queue_outgoing_command(peer, command, packet, 0, packet.dataLength))
    return -1;

  return 0;
}

export const enet_peer_receive = (peer: ENetPeer, channelID: enet_uint8) => {
  let incomingCommand: ENetIncomingCommand,
    packet: ENetPacket;

  if (enet_list_empty(peer.dispatchedCommands))
    return null;

  incomingCommand.incomingCommandList = enet_list_remove(enet_list_begin(peer.dispatchedCommands));

  if (channelID)
    channelID = incomingCommand.command.header.channelID;

  packet = incomingCommand.packet;
  packet.referenceCount--;

  if (incomingCommand.fragments)
    delete incomingCommand.fragments;

  peer.totalWaitingData -= packet.dataLength;
  return packet;
}

export const enet_peer_reset_outgoing_commands = (queue: ENetList) => {
  let outgoingCommand: ENetOutgoingCommand;

  while (!enet_list_empty(queue)) {
    outgoingCommand.outgoingCommandList = enet_list_remove(enet_list_begin(queue));

    if (outgoingCommand.packet) {
      outgoingCommand.packet.referenceCount--;

      // destroy packet here
      //if (outgoingCommand.packet.referenceCount === 0)
    }
  }
}

export const enet_peer_remove_incoming_commands = (queue: ENetList,
  startCommand: ENetListNode,
  endCommand: ENetListNode,
  excludeCommand: ENetIncomingCommand
) => {
  let currentCommand: ENetListNode;

  for (currentCommand = startCommand; currentCommand !== endCommand;) {
    const incomingCommand = new ENetIncomingCommand();
    incomingCommand.incomingCommandList = currentCommand;

    currentCommand = enet_list_next(currentCommand);
    if (incomingCommand === excludeCommand)
      continue;

    enet_list_remove(incomingCommand.incomingCommandList);

    if (incomingCommand.packet) {
      incomingCommand.packet.referenceCount--;

      // destroy packet here
      //if (outgoingCommand.packet.referenceCount === 0)
    }

    if (incomingCommand.fragments)
      delete incomingCommand.fragments;
  }
}

export const enet_peer_reset_incoming_commands = (queue: ENetList) => {
  enet_peer_remove_incoming_commands(queue, enet_list_begin(queue), enet_list_end(queue), null);
}

export const enet_peer_reset_queues = (peer: ENetPeer) => {
  if (peer.flags & ENetPeerFlag.ENET_PEER_FLAG_NEEDS_DISPATCH) {
    enet_list_remove(peer.dispatchList);

    peer.flags &= ~ENetPeerFlag.ENET_PEER_FLAG_NEEDS_DISPATCH;
  }

  while (!enet_list_empty(peer.acknowledgements))
    enet_list_remove(enet_list_begin(peer.acknowledgements));

  enet_peer_reset_outgoing_commands(peer.sentReliableCommands);
  enet_peer_reset_outgoing_commands(peer.sentUnreliableCommands);
  enet_peer_reset_outgoing_commands(peer.outgoingCommands);
  enet_peer_reset_incoming_commands(peer.dispatchedCommands);

  if (peer.channels && peer.channelCount > 0) {
    for (let i = 0; i < peer.channelCount; i++) {
      const channel = peer.channels[i];

      enet_peer_reset_incoming_commands(channel.incomingReliableCommands);
      enet_peer_reset_incoming_commands(channel.incomingUnreliableCommands);
    }

    delete peer.channels;
  }

  peer.channels = null;
  peer.channelCount = 0;
}

export const enet_peer_on_connect = (peer: ENetPeer) => {
  if (peer.state !== ENetPeerState.ENET_PEER_STATE_CONNECTED && peer.state !== ENetPeerState.ENET_PEER_STATE_DISCONNECT_LATER) {
    if (peer.incomingBandwidth !== 0)
      peer.host.bandwidthLimitedPeers++;

    peer.host.connectedPeers;
  }
}

export const enet_peer_on_disconnect = (peer: ENetPeer) => {
  if (peer.state === ENetPeerState.ENET_PEER_STATE_CONNECTED ||
    peer.state === ENetPeerState.ENET_PEER_STATE_DISCONNECT_LATER) {
    if (peer.incomingBandwidth !== 0)
      peer.host.bandwidthLimitedPeers--;

    peer.host.connectedPeers--;
  }
}

export const enet_peer_reset = (peer: ENetPeer) => {
  enet_peer_on_disconnect(peer);

  peer.outgoingPeerID = ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_PEER_ID;
  peer.connectID = 0;

  peer.state = ENetPeerState.ENET_PEER_STATE_DISCONNECTED;

  peer.incomingBandwidth = 0;
  peer.outgoingBandwidth = 0;
  peer.incomingBandwidthThrottleEpoch = 0;
  peer.outgoingBandwidthThrottleEpoch = 0;
  peer.incomingDataTotal = 0;
  peer.outgoingDataTotal = 0;
  peer.lastSendTime = 0;
  peer.lastReceiveTime = 0;
  peer.nextTimeout = 0;
  peer.earliestTimeout = 0;
  peer.packetLossEpoch = 0;
  peer.packetsSent = 0;
  peer.packetsLost = 0;
  peer.packetLoss = 0;
  peer.packetLossVariance = 0;
  peer.packetThrottle = ENetHeaderUnnamedEnum.ENET_PEER_PACKET_THROTTLE_SCALE;
  peer.packetThrottleLimit = ENetHeaderUnnamedEnum.ENET_PEER_PACKET_THROTTLE_SCALE;
  peer.packetThrottleCounter = 0;
  peer.packetThrottleEpoch = 0;
  peer.packetThrottleAcceleration = ENetHeaderUnnamedEnum.ENET_PEER_PACKET_THROTTLE_ACCELERATION;
  peer.packetThrottleDeceleration = ENetHeaderUnnamedEnum.ENET_PEER_PACKET_THROTTLE_DECELERATION;
  peer.packetThrottleInterval = ENetHeaderUnnamedEnum.ENET_PEER_PACKET_THROTTLE_INTERVAL;
  peer.pingInterval = ENetHeaderUnnamedEnum.ENET_PEER_PING_INTERVAL;
  peer.timeoutLimit = ENetHeaderUnnamedEnum.ENET_PEER_TIMEOUT_LIMIT;
  peer.timeoutMinimum = ENetHeaderUnnamedEnum.ENET_PEER_TIMEOUT_MINIMUM;
  peer.timeoutMaximum = ENetHeaderUnnamedEnum.ENET_PEER_TIMEOUT_MAXIMUM;
  peer.lastRoundTripTime = ENetHeaderUnnamedEnum.ENET_PEER_DEFAULT_ROUND_TRIP_TIME;
  peer.lowestRoundTripTime = ENetHeaderUnnamedEnum.ENET_PEER_DEFAULT_ROUND_TRIP_TIME;
  peer.lastRoundTripTimeVariance = 0;
  peer.highestRoundTripTimeVariance = 0;
  peer.roundTripTime = ENetHeaderUnnamedEnum.ENET_PEER_DEFAULT_ROUND_TRIP_TIME;
  peer.roundTripTimeVariance = 0;
  peer.mtu = peer.host.mtu;
  peer.reliableDataInTransit = 0;
  peer.outgoingReliableSequenceNumber = 0;
  peer.windowSize = ENetUnnamedProtocol.ENET_PROTOCOL_MAXIMUM_WINDOW_SIZE;
  peer.incomingUnsequencedGroup = 0;
  peer.outgoingUnsequencedGroup = 0;
  peer.eventData = 0;
  peer.totalWaitingData = 0;
  peer.flags = 0;
  
  peer.unsequencedWindow = Buffer.alloc(4 * ENetHeaderUnnamedEnum.ENET_PEER_UNSEQUENCED_WINDOW_SIZE / 32)

  enet_peer_reset_queues(peer);
}

export const enet_peer_ping = (peer: ENetPeer) => {
  const command = new ENetProtocol();

  if (peer.state !== ENetPeerState.ENET_PEER_STATE_CONNECTED)
    return;

  command.header.command = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_PING | ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_ACKNOWLEDGE;
  command.header.channelID = 0XFF;

  enet_peer_queue_outgoing_command(peer, command, null, 0, 0);
}

export const enet_peer_timeout = (peer: ENetPeer,
  timeoutLimit: enet_uint32,
  timeoutMinimum: enet_uint32,
  timeoutMaximum: enet_uint32
) => {
  peer.timeoutLimit = timeoutLimit ? timeoutLimit : ENetHeaderUnnamedEnum.ENET_PEER_TIMEOUT_LIMIT;
  peer.timeoutMinimum = timeoutMinimum ? timeoutMinimum : ENetHeaderUnnamedEnum.ENET_PEER_TIMEOUT_MINIMUM;
  peer.timeoutMaximum = timeoutMaximum ? timeoutMaximum : ENetHeaderUnnamedEnum.ENET_PEER_TIMEOUT_MAXIMUM;
}

export const enet_peer_disconnect_now = (peer: ENetPeer, data: enet_uint32) => {
  const command = new ENetProtocol();

  if (peer.state !== ENetPeerState.ENET_PEER_STATE_ZOMBIE &&
      peer.state !== ENetPeerState.ENET_PEER_STATE_DISCONNECTING)
  {
    command.header.command = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_DISCONNECT | ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_UNSEQUENCED;
    command.header.channelID = 0XFF;
    command.disconnect.data = ENET_HOST_TO_NET_32(data);

    enet_peer_queue_outgoing_command(peer, command, null, 0, 0);

    //enet_host_flush(peer.host);
  }

  enet_peer_reset(peer);
}

export const enet_peer_disconnect = (peer: ENetPeer, data: enet_uint32) => {
  const command = new ENetProtocol();

  if (peer.state === ENetPeerState.ENET_PEER_STATE_DISCONNECTING ||
      peer.state === ENetPeerState.ENET_PEER_STATE_DISCONNECTED ||
      peer.state === ENetPeerState.ENET_PEER_STATE_ACKNOWLEDGING_DISCONNECT ||
      peer.state === ENetPeerState.ENET_PEER_STATE_ZOMBIE)
    return;

  enet_peer_reset_queues(peer);

  command.header.command = ENetProtocolCommand.ENET_PROTOCOL_COMMAND_DISCONNECT;
  command.header.channelID = 0XFF;
  command.disconnect.data = ENET_HOST_TO_NET_32(data);

  if (peer.state === ENetPeerState.ENET_PEER_STATE_CONNECTED || peer.state === ENetPeerState.ENET_PEER_STATE_DISCONNECT_LATER)
    command.header.command |= ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_ACKNOWLEDGE;
  else
    command.header.command |= ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_UNSEQUENCED;

  enet_peer_queue_outgoing_command(peer, command, null, 0, 0);

  if (peer.state === ENetPeerState.ENET_PEER_STATE_CONNECTED || peer.state === ENetPeerState.ENET_PEER_STATE_DISCONNECT_LATER) {
    enet_peer_on_disconnect(peer);

    peer.state = ENetPeerState.ENET_PEER_STATE_DISCONNECTING;
  } else {
    // enet_host_flush(peer.host);
    enet_peer_reset(peer);
  }
}

export const enet_peer_disconnect_later = (peer: ENetPeer, data: enet_uint32) => {
  if ((peer.state === ENetPeerState.ENET_PEER_STATE_CONNECTED || peer.state === ENetPeerState.ENET_PEER_STATE_DISCONNECT_LATER) &&
      !(enet_list_empty(peer.outgoingCommands) &&
        enet_list_empty(peer.sentReliableCommands)))
  {
    peer.state = ENetPeerState.ENET_PEER_STATE_DISCONNECT_LATER;
    peer.eventData = data;
  } else enet_peer_disconnect(peer, data);
}

export const enet_peer_queue_acknowledgement = (peer: ENetPeer,
  command: ENetProtocol,
  sentTime: enet_uint16
) => {
  const acknowledgement = new ENetAcknowledgement();

  if (command.header.channelID < peer.channelCount) {
    const channel = peer.channels[command.header.channelID];
    let reliableWindow = command.header.reliableSequenceNumber / ENetHeaderUnnamedEnum.ENET_PEER_RELIABLE_WINDOW_SIZE,
      currentWindow = channel.incomingReliableSequenceNumber / ENetHeaderUnnamedEnum.ENET_PEER_RELIABLE_WINDOW_SIZE;

    if (command.header.reliableSequenceNumber < channel.incomingReliableSequenceNumber)
      reliableWindow += ENetHeaderUnnamedEnum.ENET_PEER_RELIABLE_WINDOWS;

    if (reliableWindow >= currentWindow + ENetHeaderUnnamedEnum.ENET_PEER_FREE_RELIABLE_WINDOWS - 1 && reliableWindow <= currentWindow + ENetHeaderUnnamedEnum.ENET_PEER_FREE_RELIABLE_WINDOWS)
      return null;
  }

  peer.outgoingDataTotal += 210;

  acknowledgement.sentTime = sentTime;
  acknowledgement.command = command;
  
  enet_list_insert(
    enet_list_end(peer.acknowledgements),
    acknowledgement.acknowledgementList
  );

  return acknowledgement;
}

export const enet_peer_setup_outgoing_command = (peer: ENetPeer, outgoingCommand: ENetOutgoingCommand) => {
  const channel = peer.channels[outgoingCommand.command.header.channelID];

  peer.outgoingDataTotal += enet_protocol_command_size(outgoingCommand.command.header.command) + outgoingCommand.fragmentLength;
  if (outgoingCommand.command.header.channelID === 0xFF) {
    peer.outgoingReliableSequenceNumber++;

    outgoingCommand.reliableSequencedNumber = peer.outgoingReliableSequenceNumber;
    outgoingCommand.unreliableSequencedNumber = 0;
  } else if (outgoingCommand.command.header.command & ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_ACKNOWLEDGE) {
    channel.outgoingReliableSequenceNumber++;
    channel.outgoingUnreliableSequenceNumber = 0;

    outgoingCommand.reliableSequencedNumber = channel.outgoingReliableSequenceNumber;
    outgoingCommand.unreliableSequencedNumber = 0;
  } else if (outgoingCommand.command.header.command & ENetProtocolFlag.ENET_PROTOCOL_COMMAND_FLAG_UNSEQUENCED) {
    peer.outgoingUnsequencedGroup++;

    outgoingCommand.reliableSequencedNumber = 0;
    outgoingCommand.unreliableSequencedNumber = 0;
  } else {
    if (outgoingCommand.fragmentOffset === 0)
      channel.outgoingUnreliableSequenceNumber++;

    outgoingCommand.reliableSequencedNumber = channel.outgoingReliableSequenceNumber;
    outgoingCommand.unreliableSequencedNumber = channel.outgoingUnreliableSequenceNumber;
  }

  outgoingCommand.sendAttempts = 0;
  outgoingCommand.sentTime = 0;
  outgoingCommand.roundTripTimeout = 0;
  outgoingCommand.roundTripTimeoutLimit = 0;
  outgoingCommand.command.header.reliableSequenceNumber = ENET_HOST_TO_NET_16(outgoingCommand.reliableSequencedNumber);

  switch (outgoingCommand.command.header.command & ENetProtocolCommand.ENET_PROTOCOL_COMMAND_MASK) {
    case ENetProtocolCommand.ENET_PROTOCOL_COMMAND_SEND_UNRELIABLE: {
      outgoingCommand.command.sendUnreliable.unreliableSequenceNumber = ENET_HOST_TO_NET_16(outgoingCommand.unreliableSequencedNumber);
    } break;

    case ENetProtocolCommand.ENET_PROTOCOL_COMMAND_SEND_UNSEQUENCED: {
      outgoingCommand.command.sendUnsequenced.unsequencedGroup = ENET_HOST_TO_NET_16 (peer.outgoingUnsequencedGroup);
    } break;
  }
  
  enet_list_insert(
    enet_list_end(peer.outgoingCommands),
    outgoingCommand.outgoingCommandList
  );
}

export const enet_peer_queue_outgoing_command = (peer: ENetPeer,
  command: ENetProtocol,
  packet: ENetPacket,
  offset: enet_uint32,
  length: enet_uint16
) => {
  const outgoingCommand = new ENetOutgoingCommand();

  outgoingCommand.command = command;
  outgoingCommand.fragmentOffset = offset;
  outgoingCommand.fragmentLength = length;
  outgoingCommand.packet = packet;

  if (packet)
    packet.referenceCount++;

  enet_peer_setup_outgoing_command(peer, outgoingCommand);

  return outgoingCommand;
}