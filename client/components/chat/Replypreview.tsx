export default function ReplyPreview({
  replyTo,
  fromSelf,
}: {
  replyTo:  { _id: string; username: string; text: string };
  fromSelf: boolean;
}) {
  return (
    <div className={`flex items-start gap-1.5 mb-1.5 px-2 py-1.5 rounded-lg text-[11px] ${
      fromSelf
        ? "bg-[#b7e4a0]/50 border-l-2 border-[#4ade80]"
        : "bg-gray-100 border-l-2 border-[#0088cc]"
    }`}>
      <div className="min-w-0">
        <span className={`font-semibold ${fromSelf ? "text-[#2d6a1f]" : "text-[#0088cc]"}`}>
          @{replyTo.username}
        </span>
        <p className="text-slate-500 truncate mt-0.5">
          {replyTo.text || "📎 File"}
        </p>
      </div>
    </div>
  );
}