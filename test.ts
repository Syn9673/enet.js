import { ENetAddress } from "./include/enet";
import * as Host from "./include/host";

const address = new ENetAddress();
address.port = 17091

const host = Host.enet_host_create(address, 1, 1, 1, 1);
host.socket.on("listening", () => console.log("Now listening on port:", host.address.port));