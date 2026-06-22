type ReplyDraft = { _id: string; username: string; text: string };

/**
 * Shown above the input box while composing a reply — distinct from
 * ReplyPreview, which renders inline inside an already-sent message
 * bubble. This one is interactive (has a cancel button); that one isn't.
 */
export default function ReplyBar({
  replyTo,
  onCancel,
}: {
  replyTo: ReplyDraft;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#1c2733] border-t border-[#0d1821]">
      <div className="w-[3px] h-9 rounded-full bg-[#5288c1] shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-[#5288c1] leading-tight">
          Reply to {replyTo.username}
        </div>
        <div className="text-[12.5px] text-[#8b98a5] truncate leading-tight mt-0.5">
          {replyTo.text || "📎 File"}
        </div>
      </div>

      <button
        onClick={onCancel}
        aria-label="Cancel reply"
        className="w-7 h-7 rounded-full flex items-center justify-center text-[#8b98a5] hover:text-white hover:bg-[#2c3e50] transition-colors shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}