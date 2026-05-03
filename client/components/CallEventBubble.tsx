import {
  MdPhoneMissed,
  MdCallEnd,
  MdPhoneDisabled,
  MdVideocam,
  MdPhone,
} from "react-icons/md";


import { CallType } from "../types/chat";

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
} : {
    callEvent: CallEvent;
    callType: CallType;
    callDuration?: number;
    fromSelf: boolean;
    username: string;
    time: string;
}) {
    const isVideo = callType === "video";

    const config = {
        missed: {
            Icon: MdPhoneMissed,
            label: fromSelf ? "No answer" : " Missed call",
            color: "text-red-500",
            bg: "bg-red-50 border-red-100",
            iconColor: "#ef4444",
        },
        ended: {
        Icon:  isVideo ? MdVideocam : MdPhone,
        label: "Call ended",
        color: "text-green-600",
        bg:    "bg-green-50 border-green-100",
        iconColor: "#16a34a",
        },
        rejected: {
        Icon:  MdPhoneDisabled,
        label: fromSelf ? "Call declined" : "You declined",
        color: "text-orange-500",
        bg:    "bg-orange-50 border-orange-100",
        iconColor: "#f97316",
        },
    }[callEvent];

    const { Icon } = config;
    return (
        <div className={`flex ${fromSelf ? "justify-end self-end" : "justify-start"} w-full`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-sm ${config.bg} max-w-[220px]`}>

                {/* Icon */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Icon size={15} color={config.iconColor} />
                </div>

                <div className="flex-1 min-w-0">
                <div className={`font-medium text-[12px] ${config.color}`}>
                    {config.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    {isVideo
                    ? <MdVideocam size={10} className="text-slate-400" />
                    : <MdPhone size={10} className="text-slate-400" />
                    }
                    {isVideo ? "Video" : "Voice"} call
                    {callDuration ? ` · ${formatDuration(callDuration)}` : ""}
                </div>
                </div>

                {/* Time */}
                <span className="text-[10px] text-slate-400 flex-shrink-0 self-end">
                {time}
                </span>
            </div>
        </div>
    );
}