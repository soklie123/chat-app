import { useEffect, useRef } from "react";
import { CallState, CallInfo } from "../types/chat";
import Avatar from "./Avatar";

import {
  MdMic, MdMicOff,
  MdVideocam, MdVideocamOff,
  MdScreenShare, MdStopScreenShare,
  MdCallEnd, MdCall,
  MdPhoneDisabled,
} from "react-icons/md";

export default function CallScreen({
  callState,
  callInfo,
  localStream,
  remoteStream,
  isMuted,
  isCamOff,
  isSharing,
  username,
  onAnswer,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}: {
  callState:           CallState;
  callInfo:            CallInfo | null;
  localStream:         MediaStream | null;
  remoteStream:        MediaStream | null;
  isMuted:             boolean;
  isCamOff:            boolean;
  isSharing:           boolean;
  username:            string;
  onAnswer:            () => void;
  onReject:            () => void;
  onEnd:               () => void;
  onToggleMute:        () => void;
  onToggleCamera:      () => void;
  onToggleScreenShare: () => void;
}) {
  const localVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === "idle" || !callInfo) return null;

  const otherUser   = callInfo.from === username ? callInfo.to : callInfo.from;
  const hasLocalVid = !isCamOff || isSharing;
  const hasRemoteVid = remoteStream && remoteStream.getVideoTracks().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col">

      {/* ── Main area ── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">

        {/* Remote video or avatar */}
        {hasRemoteVid ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl">
              <Avatar name={otherUser} size={112} />
            </div>
            <div className="text-white text-2xl font-semibold">{otherUser}</div>
            <div className="text-white/50 text-sm tracking-wide">
              {callState === "calling"   && "Calling…"}
              {callState === "receiving" && `Incoming ${callInfo.type} call`}
              {callState === "connected" && "Connected"}
            </div>
          </div>
        )}

        {/* Local preview (picture-in-picture) */}
        {hasLocalVid && callState === "connected" && (
          <div className="absolute bottom-4 right-4 w-32 h-44 rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isSharing ? "scale-x-[-1]" : ""}`}
            />
            {/* Label */}
            <div className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] text-white/60">
              {isSharing ? "Sharing screen" : "You"}
            </div>
          </div>
        )}

        {/* Incoming call overlay */}
        {callState === "receiving" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20">
              <Avatar name={otherUser} size={80} />
            </div>
            <p className="text-white text-lg font-semibold">{otherUser}</p>
            <p className="text-white/50 text-sm">
              Incoming {callInfo.type} call…
            </p>
          </div>
        )}

        {/* Top bar — call info */}
        <div className="absolute top-0 left-0 right-0 px-5 py-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div>
            <p className="text-white font-semibold">{otherUser}</p>
            <p className="text-white/50 text-xs">
              {callState === "connected" ? "In call" : callState === "calling" ? "Calling…" : "Incoming"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              callState === "connected" ? "bg-green-400" : "bg-yellow-400 animate-pulse"
            }`} />
            <span className="text-white/60 text-xs capitalize">{callInfo.type}</span>
          </div>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="bg-[#161b22] px-6 py-5 flex items-center justify-center gap-4">

        {/* Incoming call */}
        {callState === "receiving" && (
          <>
            {/* Reject call button */}
            <button onClick={onReject} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg">
              <MdPhoneDisabled size={26} color="white" />
            </button>
            {/* Answer button */}
            <button onClick={onAnswer} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg">
              <MdCall size={26} color="white" />
            </button>
          </>
        )}

        {/* In call / calling controls */}
        {(callState === "calling" || callState === "connected") && (
          <>
            {/* Mute */}
            <ControlButton
              active={isMuted}
              activeColor="bg-red-500"
              onClick={onToggleMute}
              label={isMuted ? "Unmute" : "Mute"}
              icon={isMuted
                ? <MdMicOff size={20} />
                : <MdMic size={20} />
              }
            />

            {/* Camera */}
            <ControlButton
              active={isCamOff}
              activeColor="bg-red-500"
              onClick={onToggleCamera}
              label={isCamOff ? "Cam On" : "Cam Off"}
              icon={isCamOff
                ? <MdVideocamOff size={20} />
                : <MdVideocam size={20} />
              }
            />

            {/* Screen share */}
            <ControlButton
              active={isSharing}
              activeColor="bg-[#0088cc]"
              onClick={onToggleScreenShare}
              label={isSharing ? "Stop Share" : "Share Screen"}
              icon={isSharing
                ? <MdStopScreenShare size={20} />
                : <MdScreenShare size={20} />
              }
            />

            {/* End call */}
            <button onClick={onEnd} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg">
              <MdCallEnd size={26} color="white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Reusable control button ────────────────────────────────
function ControlButton({
  active,
  activeColor,
  onClick,
  icon,
  label,
}: {
  active:      boolean;
  activeColor: string;
  onClick:     () => void;
  icon:        React.ReactNode;
  label:       string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors text-white ${
          active ? activeColor : "bg-white/15 hover:bg-white/25"
        }`}
      >
        {icon}
      </button>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}