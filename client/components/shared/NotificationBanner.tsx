import { useEffect, useState } from "react";
import Avatar from "./Avatar";

export type ToastKind = "dm" | "room" | "call";

export type Toast = {
  id: number;
  from: string;
  text: string;
  isDM: boolean;
  room?: string;
  kind?: ToastKind;
};

let toastId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    from: string,
    text: string,
    isDM: boolean,
    room?: string,
    kind: ToastKind = isDM ? "dm" : "room"
  ) => {
    const id = ++toastId;
    setToasts((prev) => [{ id, from, text, isDM, room, kind }, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

function KindBadge({ kind, room }: { kind?: ToastKind; room?: string }) {
  if (kind === "call") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[#4ade80] bg-[#4ade80]/10 px-1.5 py-0.5 rounded-full shrink-0">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Call
      </span>
    );
  }
  if (kind === "room") {
    return (
      <span className="text-[10px] text-[#8b98a5] shrink-0">
        #{room}
      </span>
    );
  }
  return (
    <span className="text-[10px] text-[#5288c1] bg-[#5288c1]/15 px-1.5 py-0.5 rounded-full shrink-0">
      DM
    </span>
  );
}

function ToastCard({
  toast,
  onOpen,
  onDismiss,
}: {
  toast: Toast;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLeaving(true);
    setTimeout(onDismiss, 180);
  };

  const handleOpen = () => {
    setLeaving(true);
    setTimeout(onOpen, 140);
  };

  return (
    <div
      onClick={handleOpen}
      role="button"
      style={{
        transform: leaving
          ? "translateX(380px) scale(0.96)"
          : entered
          ? "translateX(0) scale(1)"
          : "translateX(380px) scale(0.98)",
        opacity: leaving ? 0 : entered ? 1 : 0,
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
      }}
      className="w-[320px] bg-[#1c2733] border border-[#28323d] rounded-2xl shadow-[0_10px_32px_rgba(0,0,0,0.45)] px-3.5 py-3 flex items-start gap-3 cursor-pointer select-none pointer-events-auto"
    >
      <div className="shrink-0 mt-0.5">
        <Avatar name={toast.from} size={38} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[13.5px] font-semibold text-[#e8ecf0] truncate">
            {toast.from}
          </span>
          <KindBadge kind={toast.kind} room={toast.room} />
        </div>
        <p className="text-[12.5px] text-[#9aa5b1] truncate leading-snug">
          {toast.text || "Sent a file"}
        </p>
      </div>

      <button
        title="Dismiss"
        onClick={handleDismiss}
        className="w-6 h-6 -mt-0.5 -mr-0.5 flex items-center justify-center rounded-full border-none bg-transparent text-[#566372] cursor-pointer transition-colors duration-150 hover:bg-[#28323d] hover:text-[#c5cdd6] shrink-0"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function NotificationBanner({
  toasts,
  onDismiss,
  onOpenDM,
  onJoinRoom,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
  onOpenDM: (username: string) => void;
  onJoinRoom: (room: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onOpen={() => {
            if (toast.isDM) onOpenDM(toast.from);
            else if (toast.room) onJoinRoom(toast.room);
          }}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}