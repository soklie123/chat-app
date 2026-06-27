"use client";
import { useEffect, useRef } from "react";

function Item({
  emoji,
  label,
  onClick,
  onClose,
  danger = false,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={() => {
        onClick();
        onClose();
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] bg-transparent border-none cursor-pointer rounded-lg transition-colors text-left ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-[#e8ecf0] hover:bg-[#2b3a4a]"
      }`}
    >
      <span className="text-[15px] w-5 text-center">{emoji}</span>
      {label}
    </button>
  );
}

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  isPinned: boolean;
  isArchived: boolean;
  isCreator: boolean;
  onPin: () => void;
  onArchive: () => void;
  onLeave: () => void;
  onDelete: () => void;
};

export default function ChatContextMenu({
  x,
  y,
  onClose,
  isPinned,
  isArchived,
  isCreator,
  onPin,
  onArchive,
  onLeave,
  onDelete,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const menuW = 200;
  const menuH = 180;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  return (
    <div
      ref={ref}
      className="fixed z-[9999] bg-[#17212b] border border-[#0d1821] rounded-xl shadow-2xl p-1.5 min-w-[190px]"
      style={{ left, top }}
    >
      <Item
        emoji="📌"
        label={isPinned ? "Unpin Chat" : "Pin Chat"}
        onClick={onPin}
        onClose={onClose}
      />
      <Item
        emoji="📥"
        label={isArchived ? "Unarchive" : "Archive"}
        onClick={onArchive}
        onClose={onClose}
      />
      <div className="h-px bg-[#0d1821] my-1" />
      {isCreator ? (
        <Item
          emoji="🗑️"
          label="Delete Group"
          onClick={onDelete}
          onClose={onClose}
          danger
        />
      ) : (
        <Item
          emoji="🚪"
          label="Leave Group"
          onClick={onLeave}
          onClose={onClose}
          danger
        />
      )}
    </div>
  );
}