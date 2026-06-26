import { useState } from "react";
import { getAvatarColor } from "../../hooks/useChat";

export default function Avatar({
  name,
  size = 34,
  ring = false,
  avatarUrl,
}: {
  name: string;
  size?: number;
  ring?: boolean;
  /** Real profile photo. When provided, renders the image instead of the colored initial. */
  avatarUrl?: string;
}) {
  const safeName = name || "?";

  // Track *which* URL failed, rather than a plain boolean reset via an
  // effect. Comparing the current avatarUrl against the last-failed one
  // on every render means a new URL is retried automatically — no
  // useEffect/setState-in-effect needed at all.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!avatarUrl && avatarUrl !== failedUrl;

  if (showImage) {
    return (
      <img
        src={avatarUrl}
        alt={safeName}
        onError={() => setFailedUrl(avatarUrl ?? null)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: ring ? "2px solid #5288c1" : "none",
          flexShrink: 0,
          userSelect: "none",
        }}
      />
    );
  }

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