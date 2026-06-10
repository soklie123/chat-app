export default function ReplyBar({
    replyTo,
    onCancel
}: {
    replyTo: {
        _id: string;
        username: string;
        text: string;
    };
    onCancel: () => void;
}) {
    return(
        <div className="px-3 py-2 bg-[#f1f3f4] border-t border-gray-200 flex items-center gap-2">
        {/* Left accent bar */}
        <div className="w-1 h-8 bg-[#0088cc] rounded-full flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-[#0088cc]">
            @{replyTo.username}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {replyTo.text || "📎 File"}
          </div>
        </div>

        {/* Cancel */}
        <button
          title="cancel"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );   
}