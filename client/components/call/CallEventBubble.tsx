import {
    PhoneMissed,
    PhoneIncoming,
    PhoneOff,
    PhoneCall,
    Video,
    Mic,
    Clock,
} from "lucide-react";
import { CallType } from "../../types/chat";

type CallEvent = "missed" | "ended" | "rejected";

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

type CfgEntry = {
    voiceIcon:  React.ElementType;
    videoIcon:  React.ElementType;
    label:      (fromSelf: boolean) => string;
    color:      string;
    bg:         string;
    border:     string;
    iconBg:     string;
    iconBorder: string;
    pulse:      boolean;
};

const CONFIG: Record<CallEvent, CfgEntry> = {
    missed: {
        voiceIcon:  PhoneMissed,
        videoIcon:  PhoneMissed,
        label:      (fromSelf) => (fromSelf ? "No answer" : "Missed call"),
        color:      "#f87171",
        bg:         "#1e1015",
        border:     "#3d1e24",
        iconBg:     "#2e1720",
        iconBorder: "#4a2028",
        pulse:      true,
    },
    ended: {
        voiceIcon:  PhoneIncoming,
        videoIcon:  Video,
        label:      () => "Call ended",
        color:      "#4ade80",
        bg:         "#0c1f14",
        border:     "#1a3a22",
        iconBg:     "#162b1e",
        iconBorder: "#224832",
        pulse:      false,
    },
    rejected: {
        voiceIcon:  PhoneOff,
        videoIcon:  PhoneOff,
        label:      (fromSelf) => (fromSelf ? "You declined" : "Call declined"),
        color:      "#fb923c",
        bg:         "#1e1508",
        border:     "#3d2a10",
        iconBg:     "#2a1c0c",
        iconBorder: "#4a3018",
        pulse:      false,
    },
};

export default function CallEventBubble({
    callEvent,
    callType,
    callDuration,
    fromSelf,
    time,
}: {
    callEvent:     CallEvent;
    callType:      CallType;
    callDuration?: number;
    fromSelf:      boolean;
    username:      string;
    time:          string;
}) {
    const isVideo   = callType === "video";
    const direction = fromSelf ? "Outgoing" : "Incoming";
    const cfg       = CONFIG[callEvent];
    const Icon      = isVideo ? cfg.videoIcon : cfg.voiceIcon;
    const SubIcon   = isVideo ? Video : Mic;
    const label     = cfg.label(fromSelf);
    const isPulse   = cfg.pulse && !fromSelf;

    return (
        <>
            {isPulse && (
                <style>{`
                    @keyframes callPulse {
                        0%   { box-shadow: 0 0 0 0   ${cfg.color}44; }
                        70%  { box-shadow: 0 0 0 7px ${cfg.color}00; }
                        100% { box-shadow: 0 0 0 0   ${cfg.color}00; }
                    }
                `}</style>
            )}

            <div
                style={{
                    background:  cfg.bg,
                    borderColor: cfg.border,
                    filter:      fromSelf ? "brightness(1.08)" : undefined,
                }}
                className="inline-flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border max-w-[240px] min-w-[160px]"
            >
                {/* icon ring */}
                <div
                    style={{
                        background:  cfg.iconBg,
                        borderColor: cfg.iconBorder,
                        animation:   isPulse ? "callPulse 2s ease-in-out infinite" : undefined,
                    }}
                    className="shrink-0 size-[30px] rounded-full border flex items-center justify-center"
                >
                    <Icon size={14} color={cfg.color} strokeWidth={1.75} />
                </div>

                {/* body */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    {/* label row */}
                    <div className="flex items-center gap-1.5" style={{ color: cfg.color }}>
                        <span className="text-[11.5px] font-medium leading-none">
                            {label}
                        </span>
                        <span
                            className="size-[3px] rounded-full shrink-0"
                            style={{ background: cfg.color, opacity: 0.5 }}
                        />
                        <span className="text-[11.5px] leading-none" style={{ opacity: 0.65 }}>
                            {direction}
                        </span>
                    </div>

                    {/* sub row */}
                    <div className="flex items-center gap-1 mt-0.5 text-[#5a6a7a]">
                        <SubIcon size={11} color="#5a6a7a" strokeWidth={1.75} />
                        <span className="text-[10.5px] leading-none">
                            {isVideo ? "Video" : "Voice"} call
                        </span>
                    </div>

                    {/* duration pill */}
                    {callDuration != null && (
                        <div
                            className="inline-flex items-center gap-1 mt-1 self-start px-1.5 py-0.5 rounded-[6px] text-[#6a7a8a]"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                border:     "0.5px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <Clock size={10} color="#6a7a8a" strokeWidth={1.75} />
                            <span className="text-[10px] leading-none">
                                {formatDuration(callDuration)}
                            </span>
                        </div>
                    )}
                </div>

                {/* time */}
                <span className="text-[10px] text-[#4a5a6a] shrink-0 self-end pb-0.5">
                    {time}
                </span>
            </div>
        </>
    );
}