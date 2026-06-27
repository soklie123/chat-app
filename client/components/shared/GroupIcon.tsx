// Telegram-style "two people" silhouette.
// - Used as the fallback glyph inside a group's circular avatar (white fill,
//   default size ~22-44) when there's no custom photo.
// - Also used as a small inline badge next to a group's name (pass a muted
//   `className` like "text-[#6c7883]" + fill="currentColor" via className,
//   small size ~12-14) so groups are recognizable at a glance even when
//   they DO have a custom photo.
export default function GroupIcon({
  size = 22,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={!className ? { color: "white", opacity: 0.95 } : undefined}
      aria-hidden="true"
    >
      <circle cx="15.5" cy="8.5" r="3" opacity="0.85" />
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M9 13c-3.2 0-6.5 1.6-6.5 4.2V19h13v-1.8C15.5 14.6 12.2 13 9 13z" />
      <path d="M16.3 13.2c2.7.4 4.7 1.8 4.7 4v1.8h-3v-1.8c0-1.6-.7-2.9-1.7-4z" opacity="0.85" />
    </svg>
  );
}