// Shared in-process event bus for agent status changes
import { EventEmitter } from "events";

// Singleton
const _bus = new EventEmitter();
_bus.setMaxListeners(50);

export const statusBus = _bus;
