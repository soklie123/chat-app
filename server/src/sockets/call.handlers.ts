import { Server, Socket } from "socket.io";
import { getSocketId } from "./state";

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
  socket.on("end_call", ({ to, callId }: { to: string; callId: string }) => {
    const targetId = getSocketId(to);
    if (targetId) {
      io.to(targetId).emit("call_ended", { callId });
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
}