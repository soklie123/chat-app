export default function ReplyBar({
  replyTo,
  onCancel,
}: {
  replyTo: { _id: string; username: string; text: string };
  onCancel: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "7px 16px 7px 12px",
      background: "#17212b",
      borderTop: "1px solid #0d1821",
    }}>
      {/* Reply arrow icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5288c1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="9 17 4 12 9 7" />
        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
      </svg>

      {/* Blue accent + text */}
      <div style={{ display: "flex", alignItems: "stretch", gap: "9px", flex: 1, minWidth: 0 }}>
        <div style={{
          width: "2px",
          minHeight: "34px",
          background: "#5288c1",
          borderRadius: "2px",
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#5288c1",
            marginBottom: "1px",
            lineHeight: 1.3,
          }}>
            {replyTo.username}
          </div>
          <div style={{
            fontSize: "12.5px",
            color: "#8b98a5",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}>
            {replyTo.text || "📎 File"}
          </div>
        </div>
      </div>

      {/* Cancel */}
      <button
        title="Cancel reply"
        onClick={onCancel}
        style={{
          width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: "#6c7883",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "#202b36";
          (e.currentTarget as HTMLButtonElement).style.color = "#c5cdd6";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#6c7883";
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}