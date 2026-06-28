import { Server, Socket } from "socket.io";

/**
 * DM delete logic has been consolidated into dm.handlers.ts.
 *
 * The "dm_delete_for_everyone" and "dm_delete_for_me" socket events are
 * both handled there. This file is kept so the import in index.ts doesn't
 * break — just remove the registerDmDeleteHandlers() call from index.ts
 * and delete this file when convenient.
 */
export function registerDmDeleteHandlers(_io: Server, _socket: Socket) {
  // intentionally empty — see dm.handlers.ts
}