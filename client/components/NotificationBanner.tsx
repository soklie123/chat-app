import { useEffect, useState } from 'react';
import { getAvatarColor } from '../hooks/useChat';
import Avatar from './Avatar';

type Toast = {
    id: number;
    from: string;
    text: string;
    isDM: boolean;
    room?: string;
};

let toastId = 0;

export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (from: string, text: string, isDM: boolean, room?: string) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, from, text, isDM, room }]);
        setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };
    
    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
return { toasts, addToast, removeToast };
}

export default function NotificationBanner({
    toasts,
    onDismiss,
    onOpenDM,
    onJoinRoom,
} : {
    toasts: Toast[];
    onDismiss: (id: number) => void;
    onOpenDM: (username: string) => void;
    onJoinRoom: (room: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[280px]">
            {toasts.map((toast) => (
                <div
                    key= {toast.id}
                    className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-gray-100 p-3 flex items-start gap-3 cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all animate-slide-in"
                    onClick={() => {
                        if (toast.isDM) {
                            onOpenDM(toast.from);
                        } else if (toast.room){
                            onJoinRoom(toast.room);
                        }
                        onDismiss(toast.id);
                    }}
                >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <Avatar
                            name={toast.from} size={36}
                        />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[12px] font-semibold text-gray-900 truncate">
                                {toast.from}
                            </span>
                            {toast.isDM ? (
                                <span className="text=[10px] text-[#0088cc] bg-[#0088cc]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    DM
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                    #{toast.room}
                                </span>
                            )}
                        </div>
                        <p className="text-[12px] text-slate-500 truncate">
                            {toast.text || "Sent a file"}
                        </p>
                    </div>
                    {/* Dismiss */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
                        className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}