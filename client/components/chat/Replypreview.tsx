export default function ReplyPreview({
  replyTo,
  fromSelf,
}: {
  replyTo: { _id: string; username: string; text: string };
  fromSelf: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 mb-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] ${
        fromSelf
          ? "bg-[#2b5278]/40 border-l-2 border-[#5288c1]"
          : "bg-[#202b36] border-l-2 border-[#5288c1]"
      }`}
    >
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="#5288c1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 opacity-80"
      >
        <polyline points="9 17 4 12 9 7" />
        <path d="M4 12h11a5 5 0 0 1 5 5v1" />
      </svg>

      <div className="min-w-0">
        <span className="font-semibold text-[#5288c1]">
          {replyTo.username}
        </span>
        <p className="text-[#8b98a5] truncate mt-0.5 leading-tight">
          {replyTo.text || "📎 File"}
        </p>
      </div>
    </div>
  );
}