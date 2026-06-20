import { MessageStatus } from "../../types/chat";

const CHECK = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const DOUBLE = (
  <svg width="18" height="12" viewBox="0 0 30 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 10 13 20 3" />
    <polyline points="12 9 16 13 26 3" />
  </svg>
);

export default function MessageStatusIcon({ status }: { status?: MessageStatus }) {
  if (!status || status === "sending")
    return <svg className="animate-spin-tg opacity-40" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>;
  if (status === "sent")
    return <span className="opacity-50">{CHECK}</span>;
  if (status === "delivered")
    return <span className="opacity-50">{DOUBLE}</span>;
  return <span className="text-[#2196f3]">{DOUBLE}</span>;
}