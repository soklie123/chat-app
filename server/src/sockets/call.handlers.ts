import { Server, Socket } from "socket.io";
import { getSocketId } from "./state";
import { DirectMessage, IDirectMessage } from "../models/DirectMessage"; // ← add this

const activeCalls = new Map<
  string,
  { caller: string; receiver: string; callType: "voice" | "video" }
>();

export function registerCallHandlers(io: Server, socket: Socket) {
  // 1. Caller initiates call
  socket.on("call_user", ({ to, from, type, callId, offer }: {
      to: string;
      from: string;
      type: "voice" | "video";
      callId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const recipientId = getSocketId(to);

      if (!recipientId) {
        socket.emit("call_failed", { reason: "User is offline" });
        return;
      }
      
      // ✅ SAVE CALL INFO
      activeCalls.set(callId, {
        caller: from,
        receiver: to,
        callType: type,
      });

      io.to(recipientId).emit("incoming_call", { from, type, callId, offer });
    }
  );

  // 2. Recipient answers
  socket.on("call_answer", ({ to, callId, answer }: {
      to: string;
      callId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const callerSocketId = getSocketId(to);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_answered", { callId, answer });
      }
    }
  );

  // 3. ICE candidates exchange
  socket.on("ice_candidate", ({ to, candidate }: {
      to: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const targetId = getSocketId(to);
      if (targetId) {
        io.to(targetId).emit("ice_candidate", { candidate });
      }
    }
  );
  
  // 4. End call
  socket.on("end_call", async (data) => {
    // ✅ Basic validation
    if (!data.from || !data.callType) {
      console.warn("⚠️ Ignoring invalid end_call event:", data);
      return;
    }

    const { callId } = data;

    // ✅ Prevent duplicate call end
    if (callId && !activeCalls.has(callId)) {
      console.warn("⚠️ Call already ended:", callId);
      return;
    }

    const call = callId ? activeCalls.get(callId) : null;

    const realFrom = call?.caller ?? data.from;
    const realTo   = call?.receiver ?? data.to;

    // ✅ Safety check AFTER computing values
    if (!realFrom || !realTo) {
      console.warn("⚠️ Invalid call users:", { realFrom, realTo });
      return;
    }

    const callType = call?.callType ?? data.callType;
    const duration = data.duration ?? 0;

    const callEvent =
      data.event ?? (duration === 0 ? "missed" : "ended");

    try {
      const toSocketId   = getSocketId(realTo);
      const fromSocketId = getSocketId(realFrom);

      // ✅ send to BOTH users
      if (toSocketId) {
        io.to(toSocketId).emit("call_ended", {
          callId,
          callEvent,
          duration,
        });
      }

      if (fromSocketId) {
        io.to(fromSocketId).emit("call_ended", {
          callId,
          callEvent,
          duration,
        });
      }

      console.log("✅ END CALL EVENT:");
      console.log("from:", realFrom);
      console.log("to:", realTo);
      console.log("callType:", callType);
      console.log("callEvent:", callEvent);
      console.log("duration:", duration);

      // ✅ Save message
      const saved = await DirectMessage.create({
        from: realFrom,
        to: realTo,
        text: "",
        type: "call",
        callType,
        callEvent,
        duration,
      });

      const payload = {
        _id: saved._id,
        from: realFrom,
        to: realTo,
        text: "",
        type: "call",
        callType,
        callEvent,
        duration,
        time: new Date(saved.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      if (toSocketId)   io.to(toSocketId).emit("dm_receive", payload);
      if (fromSocketId) io.to(fromSocketId).emit("dm_receive", payload);

      // ✅ Cleanup
      if (callId) {
        activeCalls.delete(callId);
      }

    } catch (err) {
      console.error("Failed to save call end:", err);
    }
  });

  socket.on("disconnect", () => {
    const username = socket.data.username;

    for (const [id, call] of activeCalls) {
      if (call.caller === username || call.receiver === username) {
        activeCalls.delete(id);
      }
    }
  });

  // 5. Reject call
  socket.on("reject_call", ({ to, callId }: { to: string; callId: string }) => {
      const targetId = getSocketId(to);
      if (targetId) {
        io.to(targetId).emit("call_rejected", { callId });
      }
    }
  );

  // 6. Renegotiation — relay new offer to remote peer
  socket.on("call_user_renegotiate", ({ to, offer }: {
      to: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const targetId = getSocketId(to);
      if (targetId) {
        io.to(targetId).emit("call_renegotiate", { offer });
      }
    }
  );

  // 7. Renegotiation answer — relay answer back to initiator
  socket.on("call_renegotiate_answer", ({ to, answer }: {
      to: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const targetId = getSocketId(to);
      if (targetId) {
        io.to(targetId).emit("call_renegotiate_answer", { answer });
      }
    }
  );

  socket.on("screen_share_event", async ({
    to,
    from,
    event,
  }: {
    to: string;
    from: string;
    event: "started" | "stopped";
  }) => {
    if (!to || !from) {
      console.warn("⚠️ Invalid screen_share_event:", { to, from, event });
      return;
    }

    const text =
      event === "started"
        ? "🖥️ Started screen sharing"
        : "🛑 Stopped screen sharing";

    const saved = await DirectMessage.create({
      from,
      to,
      text,
      type: "screen_share", // you can define this
      event, // started / stopped
    }) as IDirectMessage;

    const payload = {
      _id: saved._id,
      from,
      to,
      text,
      type: "screen_share",
      event,
      time: new Date(saved.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const toSocketId = getSocketId(to);
    const fromSocketId = getSocketId(from);

    if (toSocketId) io.to(toSocketId).emit("dm_receive", payload);
    if (fromSocketId) io.to(fromSocketId).emit("dm_receive", payload);
  });

}