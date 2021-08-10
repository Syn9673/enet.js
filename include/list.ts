export class ENetListNode {
  public next: ENetListNode;
  public previous: ENetListNode;
}

export class ENetList {
  public sentinel: ENetListNode = new ENetListNode();
}

// definitions from real enet
export const enet_list_begin = (list) => list.sentinel.next,
  enet_list_end       = (list) => list.sentinel,
  enet_list_empty     = (list) => enet_list_begin(list) === enet_list_end(list),
  enet_list_next      = (iterator) => iterator.next,
  enet_list_previous  = (iterator) => iterator.previous,
  enet_list_front     = (list) => list.sentinel.next,
  enet_list_back      = (list) => list.sentinel.previous;


// fns
export const enet_list_clear = (list: ENetList) => {
  list.sentinel.next     = list.sentinel;
  list.sentinel.previous = list.sentinel;
}

export const enet_list_insert = (position: ENetListNode, data: ENetListNode) => {
  const result = data;

  result.previous = position.previous;
  result.next = position;

  result.previous.next = result;
  position.previous = result;

  return result;
}

export const enet_list_remove = (position: ENetListNode) => {
  position.previous.next = position.next;
  position.next.previous = position.previous;

  return position;
}

export const enet_list_move = (position: ENetListNode, first: ENetListNode, last: ENetListNode) => {
  first.previous.next = last.next;
  last.next.previous = first.previous;

  first.previous = position.previous;
  last.next = position;

  first.previous.next = first;
  position.previous = last;

  return first;
}

export const enet_list_size = (list: ENetList) => {
  let size = 0,
    position: ENetListNode;

  for (position = enet_list_begin(list);
      position !== enet_list_end(list);
      position = enet_list_next(position))
    size++;

  return size;
}