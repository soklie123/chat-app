import {
    MdPhoneMissed,
    MdPhoneDisabled,
    MdVideocam,
    MdPhone,
    MdMic,
} from "react-icons/md";

import { CallType } from "../../types/chat";

type CallEvent = "missed" | "ended" | "rejected";

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

export default function CallEventBubble({
    callEvent,
    callType,
    callDuration,
    fromSelf,
    username,
    time,
}: {
    callEvent:    CallEvent;
    callType:     CallType;
    callDuration?: number;
    fromSelf:     boolean;
    username:     string;
    time:         string;
}) {
    const isVideo = callType === "video";
    const direction = fromSelf ? "Outgoing" : "Incoming";

    const config = {
        missed: {
            Icon:   MdPhoneMissed,
            label:  fromSelf ? "No answer" : "Missed call",
            color:  "#f87171",
            bg:     "#2a1015",
            border: "#4a1a20",
            iconBg: "#3a1820",
        },
        ended: {
            Icon:   isVideo ? MdVideocam : MdPhone,
            label:  "Call ended",
            color:  "#4ade80",
            bg:     "#0e2a1a",
            border: "#1a4a2a",
            iconBg: "#1a3a24",
        },
        rejected: {
            Icon:   MdPhoneDisabled,
            label:  fromSelf ? "You declined" : "Call declined",
            color:  "#fb923c",
            bg:     "#2a1a08",
            border: "#4a2e10",
            iconBg: "#3a2210",
        },
    }[callEvent];

    const { Icon } = config;
    const SubIcon = isVideo ? MdVideocam : MdMic;

    return (
            <div
                style={{ background: config.bg, borderColor: config.border }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl border max-w-[240px] min-w-[160px]"
            >
                {/* Icon */}
                <div
                    style={{ background: config.iconBg }}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                >
                    <Icon size={14} color={config.color} />
                </div>

                <div className="flex-1 min-w-0">
                    <div style={{ color: config.color }} className="font-medium text-[12px]">
                        {config.label} • {direction}
                    </div>
                    <div className="text-[10px] text-[#8b98a8] mt-0.5 flex items-center gap-1">
                        <SubIcon size={10} color="#8b98a8" />
                        {direction} {isVideo ? "Video" : "Voice"} call
                        {callDuration ? ` · ${formatDuration(callDuration)}` : ""}
                    </div>
                </div>

                {/* Time */}
                <span className="text-[10px] text-[#8b98a8] flex-shrink-0 self-end pl-2">
                    {time}
                </span>
            </div>
    );
}