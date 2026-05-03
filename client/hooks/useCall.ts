import { useEffect, useRef, useState} from "react";
import { Socket } from "socket.io-client";
import { CallType, CallState, CallInfo } from "../types/chat";
import { connect } from "net";
import { send } from "process";

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
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false); // camera off by default
    const [isSharing, setIsSharing] = useState(false); // screen share

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);

    const callStartRef = useRef<number | null>(null);
    // const callIdRef = useRef<string>("");
    // const offerRef = useRef<RTCSessionDescriptionInit | null>(null);

    // _____ Clean up _________________________
    const cleanup = () => {

        // Stop screen share of active
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
        }

        pcRef.current?.close();
        pcRef.current = null;
        //offerRef.current = null;
        localStream?.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setCallState("idle");
        setCallInfo(null);
        setIsMuted(false);
        setIsCamOff(true);
        setIsSharing(false);
    }
    // ── Get media stream ───────────────────────────────────
    // Mic ON, camera OFF by default
    const getStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false, // always start with camera off
        });
        return stream;
        // return await navigator.mediaDevices.getUserMedia({
        //     audio: true,
        //     video: false
        // });
    };
    // ── Create peer connection ─────────────────────────────
    const createPC = (stream: MediaStream, to: string) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Send ICE candidates to remote peer
        pc.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit("ice_candidate", { to, candidate: e.candidate });
            }
        };

        // Recieve remote stream
        pc.ontrack = (e) => setRemoteStream(e.streams[0]);

        return pc;
    };

    // ── Socket listeners ───────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        // Incoming call — just store the offer, don't create PC yet
        socket.on("incoming_call", async ({ from, type, callId, offer } : {
            
            from: string;
            type: CallType;
            callId: string;
            offer: RTCSessionDescriptionInit;
        }) => {
            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;
            await pc.setRemoteDescription(offer);
            console.log("📞 Incoming call received from:", from); 

            setCallInfo({ callId, from, to: username, type });
            setCallState("receiving");

            const missedTimer = setTimeout(() => {
                if (callState === "receiving") {
                    onCallEvent?.({
                        type: "missed",
                        callType: type,
                        with: from, 
                        duration: 0,
                    });
                    cleanup();
                }
            }, 30000);
            // Store timer to clear on answer/ reject
            (window as any).__missedCallTimer = missedTimer;
        });

        // Call answered by reciptient
        socket.on("call_answered", async ({ answer } : {
            callId: string;
            answer: RTCSessionDescriptionInit;
        }) => {
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(answer);
                setCallState("connected");
            }
        });
        // ICE candidate recieved
        socket.on("ice_candidate", async ({ candidate } : {
            candidate: RTCIceCandidateInit;
        })=> {
            try {
                if (pcRef.current) await pcRef.current?.addIceCandidate(candidate);
            } catch (e) {
                console.warn("ICE candidate error:", e);
            }
            // if (pcRef.current) {
            //     await pcRef.current.addIceCandidate(candidate);
            // }
        });

        // Remote ended call
        socket.on("call_ended", () => {
            const duration = callStartRef.current
                ? Math.floor((Date.now() - callStartRef.current) / 1000)
                : 0;
            
            onCallEvent?.({
                type:     "ended",
                callType: callInfo?.type ?? "voice",
                with:     callInfo?.from === username ? callInfo?.to ?? "" : callInfo?.from ?? "",
                duration,
            });
            callStartRef.current = null;
            cleanup();
        });
            
        
        // Remote rejected call
        socket.on("call_rejected", () => {
            onCallEvent?.({
                type:     "rejected",
                callType: callInfo?.type ?? "voice",
                with:     callInfo?.to ?? "",
                duration: 0,
            });
            cleanup();
            alert("Call was declined.");
        });

        // No answer (timeout)
        socket.on("call_failed", ({ reason } : {
            reason: string;
        }) => {
            onCallEvent?.({
                type: "missed",
                callType: callInfo?.type ?? "voice",
                with: callInfo?.to ?? "",
                duration: 0,
            });
            cleanup();
            alert(`"Call failed: ${reason}"`);
        });

        return () => {
            socket.off("incoming_call");
            socket.off("call_answered");
            socket.off("ice_candidate");
            socket.off("call_ended");
            socket.off("call_rejected");
            socket.off("call_failed");
        };
    }, [socket, username]);

    // ===== Start Call ==============================
    const startCall = async (to: string, type: CallType) => {
        if (!socket) return;

        const callId = `${username}-${to}-${Date.now()}`;
        // callIdRef.current = callId;

        try {
            const stream = await getStream(); // mic on, cam off
            setLocalStream(stream);
            setIsCamOff(true); // cam starts off
            setIsMuted(false); // mic starts on

            const pc = createPC(stream, to);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            setCallInfo({ callId, from: username, to, type });
            setCallState("calling");

            socket.emit("call_user", { to, from: username, type, callId, offer });
        } catch (err) {
            alert("Could not access camera/microphone.")
            cleanup();
        }
    };
    // ==== Answer Call ======================
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

            //  Create answer
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

    // ── End / reject call ──────────────────────────────────
    const endCall = () => {
        if (!socket || !callInfo) return;
        const to = callInfo.from === username ? callInfo.to : callInfo.from;

        const duration = callStartRef.current
            ? Math.floor((Date.now() - callStartRef.current) / 1000)
            : 0;

        console.log("endCall firing onCallEvent:", { to, duration });


        // Notify chat about ended call
        onCallEvent?.({
            type: "ended",
            callType: callInfo.type,
            with: to,
            duration,
        });
        callStartRef.current = null;
        cleanup();
        socket.emit("end_call", { to, callId: callInfo.callId });
    };

    const rejectCall = () => {

        if ((window as any).__missedCallTimer) {
            clearTimeout((window as any).__missedCallTimer);
        }

        if (!socket || !callInfo) return;
        socket.emit("reject_call", { to: callInfo.from, callId: callInfo.callId });

        // Notify chat about reject call
        onCallEvent?.({
            type: "rejected",
            callType: callInfo.type,
            with: callInfo.from,
            duration: 0,
        });

        cleanup();
    }

    // ── Mute / camera toggle ───────────────────────────────
    const toggleMute = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach((t) => {
            t.enabled = !t.enabled;
        });
        setIsMuted((m) => !m);
    }
    
    // ── Toggle camera ──────────────────────────────────────
    const toggleCamera = async () => {
        if (!pcRef.current || !localStream) return;

        if (isCamOff) {
            // Turn the camera ON - get video tracks
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];

                // Replace or add video track in peer connection
                const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                } else {
                    pcRef.current.addTrack(videoTrack, localStream);
                }

                // Add local stream so preview works
                localStream.addTrack(videoTrack);
                setLocalStream(new MediaStream(localStream.getTracks()));
                setIsCamOff(false);
                setIsSharing(false);

                // Stop screen share if active
                if (screenTrackRef.current) {
                    screenTrackRef.current.stop();
                    screenTrackRef.current = null;
                }
            } catch (err) {
                alert("Could not access camera.");
            }
        } else {
            // Turn camera OFF
            localStream.getVideoTracks().forEach((t) => {
                t.stop();
                localStream.removeTrack(t);
            });
            const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
            if (sender) await sender.replaceTrack(null);
            setLocalStream(new MediaStream(localStream.getTracks()));
            setIsCamOff(true);
        }
    };
    // ── Screen share ───────────────────────────────────────
    const toggleScreenShare = async () => {
        if (!pcRef.current || !localStream) return;

        if (isSharing) {
            // stop screen share - go back to camera or blank
            if (screenTrackRef.current) {
                screenTrackRef.current.stop();
                screenTrackRef.current = null;
            }
            const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");

            if (!isCamOff) {
                // switch back to camera
                try {
                    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const camTrack = camStream.getVideoTracks()[0];
                    if (sender) await sender.replaceTrack(camTrack);
                    localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t));
                    localStream.addTrack(camTrack);
                    setLocalStream(new MediaStream(localStream.getTracks()));
                } catch {}
            } else {
                if (sender) await sender.replaceTrack(null);
                localStream.getVideoTracks().forEach((t) => {
                    t.stop();
                    localStream.removeTrack(t);
                });
                setLocalStream(new MediaStream(localStream.getTracks()));
            }

            setIsSharing(false);
        } else {
            // Start screen share
            try {
                const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
                    video: true,
                    audio: false,
                });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;

                // Replace video sender with screen track
                const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(screenTrack);
                } else {
                    pcRef.current.addTrack(screenTrack, localStream);
                }

                // Replace in local stream for preview
                localStream.getVideoTracks().forEach((t) => {
                    t.stop();
                    localStream.removeTrack(t);
                });
                localStream.addTrack(screenTrack);
                setLocalStream(new MediaStream(localStream.getTracks()));
                setIsSharing(true);
                setIsCamOff(true); // Camera is effectively off when sharing
                
                // Auto stop when user clicks browser's stop sharing
                screenTrack.onended = () => {
                    setIsSharing(false);
                    setIsCamOff(true);
                    screenTrackRef.current = null;
                };
            } catch (err: any) {
                // User cancelled the dialog - not real error, ignore silently
                if (
                    err?.name === "NotAllowedError" || 
                    err?.message?.includes("Permission denied") ||
                    err?.message.includes("cancelled")
                ) {
                    return; // user just cancelled, do nothing
                }
                // Real error - 
                console.warn("Screen share cancelled or fail: ", err);
                alert("Screen sharing failed. Please try again.");
            }
        }
    }

    return {
        callState,
        callInfo,
        localStream,
        remoteStream,
        isMuted,
        isCamOff,
        isSharing,
        startCall,
        answerCall,
        endCall,
        rejectCall,
        toggleCamera,
        toggleMute,
        toggleScreenShare,
    };

}