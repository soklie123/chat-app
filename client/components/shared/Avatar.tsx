import { getAvatarColor } from "../../hooks/useChat";

export default function Avatar({
  name,
  size = 34,
  ring = false,
}: {
  name: string;
  size?: number;
  ring?: boolean;
}) {
  const safeName = name || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: getAvatarColor(safeName),
        border: ring ? "2px solid #5288c1" : "none",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        color: "#fff",
        flexShrink: 0,
        userSelect: "none",
        letterSpacing: "0.01em",
      }}
    >
      {safeName.charAt(0).toUpperCase()}
    </div>
  );
}