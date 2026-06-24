import { useEffect, useRef, useState} from "react";
import { Socket } from "socket.io-client";
import { CallType, CallState, CallInfo } from "../types/chat";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

export function useCall(
    socket: Socket | null, 
    username: string, 
    onCallEvent?: (event: {
        type: "missed" | "ended" | "rejected";
        callType: CallType;
        with: string;
        duration: number;
    }) => void
) {
    const [callState, setCallState] = useState<CallState>("idle");
    const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
    const callInfoRef = useRef<CallInfo | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    const audioCtxRef    = useRef<AudioContext | null>(null);
    const gainNodeRef    = useRef<GainNode | null>(null);
    const sourceNodeRef  = useRef<MediaElementAudioSourceNode | null>(null);

    const pcRef          = useRef<RTCPeerConnection | null>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);
    const callStartRef   = useRef<number | null>(null);
    const socketRef      = useRef<Socket | null>(null); // ← keep socket in ref

    // Keep socketRef current
    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    // Keep callInfoRef current
    useEffect(() => {
        callInfoRef.current = callInfo;
    }, [callInfo]);

    // ── Cleanup ────────────────────────────────────────────
    const cleanup = () => {
        gainNodeRef.current?.disconnect();
        sourceNodeRef.current?.disconnect();
        audioCtxRef.current?.close();
        audioCtxRef.current   = null;
        gainNodeRef.current   = null;
        sourceNodeRef.current = null;
        setIsSpeaker(false);

        screenTrackRef.current?.stop();
        screenTrackRef.current = null;
        pcRef.current?.close();
        pcRef.current = null;
        localStream?.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setCallState("idle");
        setCallInfo(null);
        setIsMuted(false);
        setIsCamOff(true);
        setIsSharing(false);
    };

    // ── Get media stream ───────────────────────────────────
    const getStream = async () => {
        return await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });
    };

    // ── Create peer connection ─────────────────────────────
    const createPC = (stream: MediaStream, to: string) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current) {
                socketRef.current.emit("ice_candidate", { to, candidate: e.candidate });
            }
        };

        pc.ontrack = (e) => setRemoteStream(e.streams[0]);

        return pc;
    };

    // ── Renegotiate ────────────────────────────────────────
    const renegotiate = async () => {
        if (!pcRef.current || !socketRef.current || !callInfoRef.current) return;

        if (pcRef.current.signalingState !== "stable") {
            console.warn("Skipping renegotiate, wrong state:", pcRef.current.signalingState);
            return; // ← was missing before
        }

        const to = callInfoRef.current.from === username
            ? callInfoRef.current.to
            : callInfoRef.current.from;

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socketRef.current.emit("call_user_renegotiate", { to, offer });
    };

    // ── Toggle speaker ─────────────────────────────────────
    const toggleSpeaker = async () => {
        try {
            const audioEl = document.querySelector(
                "audio[autoplay]"
            ) as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };

            if (!audioEl) {
                console.warn("No audio element found");
                return;
            }

            if (!isSpeaker) {
                if (!audioCtxRef.current) {
                    audioCtxRef.current = new AudioContext();
                }
                const ctx = audioCtxRef.current;
                await ctx.resume();

                audioEl.muted = true;

                if (!sourceNodeRef.current) {
                    sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
                }
                if (!gainNodeRef.current) {
                    gainNodeRef.current = ctx.createGain();
                    gainNodeRef.current.gain.value = 2.0;
                }

                sourceNodeRef.current.connect(gainNodeRef.current);
                gainNodeRef.current.connect(ctx.destination);
                setIsSpeaker(true);
            } else {
                gainNodeRef.current?.disconnect();
                sourceNodeRef.current?.disconnect();
                gainNodeRef.current   = null;
                sourceNodeRef.current = null;

                await audioCtxRef.current?.close();
                audioCtxRef.current = null;

                audioEl.muted = false;
                if (remoteStream) {
                    audioEl.srcObject = remoteStream;
                    await audioEl.play().catch(() => {});
                }
                setIsSpeaker(false);
            }
        } catch (err) {
            console.warn("Speaker toggle error:", err);
            setIsSpeaker((s) => !s);
        }
    };

    // ── Socket listeners ───────────────────────────────────
    useEffect(() => {
    if (!socket) return;

    socket.on("incoming_call", async ({ from, type, callId, offer }) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        await pc.setRemoteDescription(offer);

        setCallInfo({ callId, from, to: username, type });
        setCallState("receiving");

        const missedTimer = setTimeout(() => {
            if (callInfoRef.current?.callId === callId) {
                
                socketRef.current?.emit("end_call", {
                    to: from,
                    from: username,
                    callId,
                    callType: type,
                    duration: 0,
                });

                onCallEvent?.({ type: "missed", callType: type, with: from, duration: 0 });
                cleanup();
            }
        }, 30000);
        (window as any).__missedCallTimer = missedTimer;
    });

    socket.on("call_answered", async ({ answer }) => {
        if (pcRef.current) {
            await pcRef.current.setRemoteDescription(answer);
            setCallState("connected");
            callStartRef.current = Date.now();
        }
    });

    socket.on("ice_candidate", async ({ candidate }) => {
        try {
            if (pcRef.current) await pcRef.current.addIceCandidate(candidate);
        } catch (e) {
            console.warn("ICE candidate error:", e);
        }
    });

    // Receiver side — caller already emitted call_message in endCall()
    socket.on("call_ended", () => {
        const info = callInfoRef.current;
        const duration = callStartRef.current
            ? Math.floor((Date.now() - callStartRef.current) / 1000)
            : 0;
        const otherUser =
            info?.from === username ? info?.to : info?.from;

        // ← NO call_message emit here
        onCallEvent?.({
            type:     "ended",
            callType: info?.type ?? "voice",
            with: otherUser ?? "",
            duration,
        });
        callStartRef.current = null;
        cleanup();
    });

    // Caller side — receiver already rejected, caller emits call_message
    socket.on("call_rejected", () => {
        const info = callInfoRef.current;
        socketRef.current?.emit("end_call", {
            to: info?.to ?? "",
            from: username,
            callId: info?.callId,
            callType: info?.type ?? "voice",
            duration: 0,
            event: "rejected", // 🔥 optional improvement
        });
        onCallEvent?.({
            type:     "rejected",
            callType: info?.type ?? "voice",
            with:     info?.to ?? "",
            duration: 0,
        });
        cleanup();
        alert("Call was declined.");
    });

    // Caller side — no answer timeout from server
    socket.on("call_failed", ({ reason }) => {
        const info = callInfoRef.current;
        socketRef.current?.emit("end_call", {
            to: info?.to ?? "",
            from: username,
            callId: info?.callId,
            callType: info?.type ?? "voice",
            duration: 0,
        });

        onCallEvent?.({
            type:     "missed",
            callType: info?.type ?? "voice",
            with:     info?.to ?? "",
            duration: 0,
        });
        cleanup();
        alert(`Call failed: ${reason}`);
    });

    socket.on("call_renegotiate", async ({ offer }) => {
        if (!pcRef.current || !socket) return;
        const info = callInfoRef.current;
        const to = info?.from === username ? info?.to : info?.from;
        if (!to) return;

        if (pcRef.current.signalingState !== "stable") {
            console.warn("Ignoring renegotiate offer, wrong state:", pcRef.current.signalingState);
            return;
        }

        await pcRef.current.setRemoteDescription(offer);
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("call_renegotiate_answer", { to, answer });
    });

    socket.on("call_renegotiate_answer", async ({ answer }) => {
        if (!pcRef.current) return;
        if (pcRef.current.signalingState === "have-local-offer") {
            await pcRef.current.setRemoteDescription(answer);
        } else {
            console.warn("Ignoring renegotiate answer, wrong state:", pcRef.current.signalingState);
        }
    });

        return () => {
            socket.off("incoming_call");
            socket.off("call_answered");
            socket.off("ice_candidate");
            socket.off("call_ended");
            socket.off("call_rejected");
            socket.off("call_failed");
            socket.off("call_renegotiate");
            socket.off("call_renegotiate_answer");
        };
    }, [socket, username]);

    // ── Start call ─────────────────────────────────────────
    const startCall = async (to: string, type: CallType) => {
        if (!socket) return;
        const callId = `${username}-${to}-${Date.now()}`;

        try {
            const stream = await getStream();
            setLocalStream(stream);
            setIsCamOff(true);
            setIsMuted(false);

            const pc = createPC(stream, to);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            setCallInfo({ callId, from: username, to, type });
            setCallState("calling");

            socket.emit("call_user", { to, from: username, type, callId, offer });
        } catch (err) {
            alert("Could not access camera/microphone.");
            cleanup();
        }
    };

    // ── Answer call ────────────────────────────────────────
    const answerCall = async () => {
        if ((window as any).__missedCallTimer) {
            clearTimeout((window as any).__missedCallTimer);
        }

        if (!socket || !callInfo || !pcRef.current) return;

        try {
            const stream = await getStream();
            setLocalStream(stream);
            setIsCamOff(true);
            setIsMuted(false);

            stream.getTracks().forEach((track) =>
                pcRef.current!.addTrack(track, stream)
            );

            pcRef.current.onicecandidate = (e) => {
                if (e.candidate && socket) {
                    socket.emit("ice_candidate", { to: callInfo.from, candidate: e.candidate });
                }
            };
            pcRef.current.ontrack = (e) => setRemoteStream(e.streams[0]);

            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            socket.emit("call_answer", {
                to:     callInfo.from,
                callId: callInfo.callId,
                answer,
            });

            setCallState("connected");
            callStartRef.current = Date.now();
        } catch (err) {
            console.error("Answer error:", err);
            alert("Could not access microphone.");
            cleanup();
        }
    };

    // ── End call ───────────────────────────────────────────
    const endCall = () => {
        
        const info = callInfoRef.current;
        if (!socketRef.current || !info) return;

        const to = info.from === username ? info.to : info.from;
        const duration = callStartRef.current
            ? Math.floor((Date.now() - callStartRef.current) / 1000)
            : 0;

        socketRef.current.emit("end_call", {
            to,
            from:      username, // ← whoever ends the call
            callId: info.callId,
            callType:  info.type,
            // callEvent: "ended",
            duration,
        });
        onCallEvent?.({ type: "ended", callType: info.type, with: to, duration });
        callStartRef.current = null;
        // socketRef.current.emit("end_call", { to, callId: info.callId });
        cleanup();
    };


    // ── Reject call ────────────────────────────────────────
    const rejectCall = () => {
        if ((window as any).__missedCallTimer) clearTimeout((window as any).__missedCallTimer);
        const info = callInfoRef.current;
        if (!socketRef.current || !info) return;

        socketRef.current.emit("reject_call", { to: info.from, callId: info.callId });
        // ← NO call_message — call_rejected listener on caller side handles it
        onCallEvent?.({ type: "rejected", callType: info.type, with: info.from, duration: 0 });
        cleanup();
    };

    // ── Toggle mute ────────────────────────────────────────
    const toggleMute = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach((t) => {
            t.enabled = !t.enabled;
        });
        setIsMuted((m) => !m);
    };

    // ── Toggle camera ──────────────────────────────────────
    const toggleCamera = async () => {
        if (!pcRef.current || !localStream) return;

        if (isCamOff) {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];

                const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                } else {
                    pcRef.current.addTrack(videoTrack, localStream);
                }

                localStream.addTrack(videoTrack);
                setLocalStream(new MediaStream(localStream.getTracks()));
                setIsCamOff(false);
                setIsSharing(false);

                if (screenTrackRef.current) {
                    screenTrackRef.current.stop();
                    screenTrackRef.current = null;
                }

                await renegotiate();
            } catch (err) {
                alert("Could not access camera.");
            }
        } else {
            localStream.getVideoTracks().forEach((t) => {
                t.stop();
                localStream.removeTrack(t);
            });
            const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
            if (sender) await sender.replaceTrack(null);
            setLocalStream(new MediaStream(localStream.getTracks()));
            setIsCamOff(true);

            await renegotiate();
        }
    };

    // ── Toggle screen share ────────────────────────────────
    const toggleScreenShare = async () => {
        if (!pcRef.current || !localStream) return;

        if (isSharing) {
            if (screenTrackRef.current) {
                screenTrackRef.current.stop();
                screenTrackRef.current = null;
            }
            const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");

            if (!isCamOff) {
                try {
                    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const camTrack = camStream.getVideoTracks()[0];
                    if (sender) await sender.replaceTrack(camTrack);
                    localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t));
                    localStream.addTrack(camTrack);
                    setLocalStream(new MediaStream(localStream.getTracks()));
                    await renegotiate();
                } catch {}
            } else {
                if (sender) await sender.replaceTrack(null);
                localStream.getVideoTracks().forEach((t) => {
                    t.stop();
                    localStream.removeTrack(t);
                });
                setLocalStream(new MediaStream(localStream.getTracks()));
                await renegotiate();
            }
            
            socketRef.current?.emit("screen_share_event", {
            to: callInfoRef.current?.to,
            from: username,
            event: "stopped",
            });

            setIsSharing(false);
        } else {
            try {
                const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
                    video: true,
                    audio: false,
                });     
                socketRef.current?.emit("screen_share_event", {
                to: callInfoRef.current?.to,
                from: username,
                event: "started",
                });

                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;

                const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(screenTrack);
                } else {
                    pcRef.current.addTrack(screenTrack, localStream);
                }

                localStream.getVideoTracks().forEach((t) => {
                    t.stop();
                    localStream.removeTrack(t);
                });
                localStream.addTrack(screenTrack);
                setLocalStream(new MediaStream(localStream.getTracks()));
                setIsSharing(true);
                setIsCamOff(true);

                await renegotiate();

                screenTrack.onended = async () => {
                    setIsSharing(false);
                    setIsCamOff(true);
                    screenTrackRef.current = null;
                    socketRef.current?.emit("screen_share_event", {
                        to: callInfoRef.current?.to,
                        from: username,
                        event: "stopped",
                    });

                    const s = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
                    if (s) await s.replaceTrack(null);
                    await renegotiate();
                };
            } catch (err: any) {
                if (
                    err?.name === "NotAllowedError" ||
                    err?.message?.includes("Permission denied") ||
                    err?.message?.includes("cancelled")
                ) {
                    return;
                }
                console.warn("Screen share error:", err);
                alert("Screen sharing failed. Please try again.");
            }
        }
    };

    return {
        callState,
        callInfo,
        localStream,
        remoteStream,
        isMuted,
        isCamOff,
        isSharing,
        isSpeaker,
        startCall,
        answerCall,
        endCall,
        rejectCall,
        toggleCamera,
        toggleMute,
        toggleScreenShare,
        toggleSpeaker,
    };
}