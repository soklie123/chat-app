import { MessageStatus } from "../types/chat";

export default function MessageStatusIcon({
  status,
}: {
  status?: MessageStatus;
}) {
  if (!status) return null;

  // Single grey tick — sending (thinner/lighter)
  if (status === "sending") {
    return (
      <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
        <path
          d="M1 5.5L5 9.5L11 1.5"
          stroke="#c4c4c4"  // lighter grey
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 1" // dashed = still sending
        />
      </svg>
    );
  }

  // Single grey tick — sent (solid)
  if (status === "sent") {
    return (
      <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
        <path
          d="M1 5.5L5 9.5L11 1.5"
          stroke="#9ca3af"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Double grey tick — delivered
  if (status === "delivered") {
    return (
      <svg width="18" height="10" viewBox="0 0 20 11" fill="none">
        <path
          d="M1 5.5L5 9.5L11 1.5"
          stroke="#9ca3af"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 5.5L10 9.5L16 1.5"
          stroke="#9ca3af"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Double blue tick — seen
  return (
    <svg width="18" height="10" viewBox="0 0 20 11" fill="none">
      <path
        d="M1 5.5L5 9.5L11 1.5"
        stroke="#0088cc"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 5.5L10 9.5L16 1.5"
        stroke="#0088cc"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}