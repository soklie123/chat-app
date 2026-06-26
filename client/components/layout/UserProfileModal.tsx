import { useState } from "react";
import { getAvatarColor, UserProfile } from "../../hooks/useChat";

type Props = {
  username: string;
  profile?: UserProfile;
  isOnline: boolean;
  onClose: () => void;
  onOpenDM: (username: string) => void;
  onCall?: () => void;
};

export default function UserProfileModal({
  username,
  profile,
  isOnline,
  onClose,
  onOpenDM,
  onCall,
}: Props) {
  const avatarBg = getAvatarColor(username);
  const [copied, setCopied] = useState(false);
  // Track *which* URL failed, rather than a plain boolean cleared by an
  // effect — this way, if avatarUrl changes to something new, the image
  // is automatically retried on render with no effect/setState needed.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imgFailed = !!profile?.avatarUrl && profile.avatarUrl === failedUrl;

  const formatDate = (d?: string | Date) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCopyUsername = async () => {
    try {
      await navigator.clipboard.writeText(`@${username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently ignore, nothing to fall back to
    }
  };

  // Stat rows — visual placeholders only, not wired to real backend counts yet.
  const statRows: { icon: JSX.Element; label: string }[] = [
    {
      label: "Photos",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      ),
    },
    {
      label: "Videos",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
      ),
    },
    {
      label: "Files",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: "Shared links",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      label: "Voice messages",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
    },
    {
      label: "GIFs",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 8v8M13 8v8M13 12h2.5a1.5 1.5 0 1 0 0-3H13M17 8v8" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[380px] max-h-[85vh] bg-[#17212b] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden border border-[#0d1821] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-end px-3 py-2.5 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#8b98a5] hover:bg-[#202b36] hover:text-white bg-transparent border-none cursor-pointer transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── Avatar + name + status ── */}
          <div className="flex flex-col items-center pt-0 pb-4 px-4">
            {profile?.avatarUrl && !imgFailed ? (
              <img
                src={profile.avatarUrl}
                alt={username}
                onError={() => setFailedUrl(profile.avatarUrl ?? null)}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#0d1821]"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-[36px] font-bold text-white border-4 border-[#0d1821]"
                style={{ background: avatarBg }}
              >
                {username[0]?.toUpperCase()}
              </div>
            )}

            <div className="mt-3 text-[19px] font-bold text-white">{username}</div>
            <div
              className={`text-[13px] mt-0.5 font-medium ${
                isOnline ? "text-[#4ade80]" : "text-[#6c7883]"
              }`}
            >
              {isOnline ? "online" : "last seen recently"}
            </div>
          </div>

          {/* ── Action row: Message / Mute / Call / More ── */}
          <div className="grid grid-cols-4 gap-1 px-4 pb-4">
            <button
              onClick={() => onOpenDM(username)}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-transparent border-none cursor-pointer text-[#5288c1] hover:bg-[#202b36] transition-colors"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="text-[11px] font-medium">Message</span>
            </button>

            <button
              title="Not wired up yet"
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-transparent border-none cursor-pointer text-[#5288c1] hover:bg-[#202b36] transition-colors"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span className="text-[11px] font-medium">Mute</span>
            </button>

            <button
              onClick={onCall}
              disabled={!onCall}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-transparent border-none cursor-pointer text-[#5288c1] hover:bg-[#202b36] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span className="text-[11px] font-medium">Call</span>
            </button>

            <button
              title="Not wired up yet"
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-transparent border-none cursor-pointer text-[#5288c1] hover:bg-[#202b36] transition-colors"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
              <span className="text-[11px] font-medium">More</span>
            </button>
          </div>

          <div className="h-2 bg-[#0e1621]" />

          {/* ── Bio / Username / Member since ── */}
          <div className="px-4 py-2 flex flex-col gap-3">
            {profile?.bio && (
              <div>
                <div className="text-[14px] text-[#e8ecf0] leading-snug">
                  &ldquo;{profile.bio}&rdquo;
                </div>
                <div className="text-[12.5px] text-[#6c7883] mt-1">Bio</div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] text-[#5288c1]">@{username}</div>
                <div className="text-[12.5px] text-[#6c7883] mt-1">Username</div>
              </div>
              <button
                onClick={handleCopyUsername}
                title="Copy username"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none text-[#6c7883] hover:bg-[#202b36] hover:text-[#8b98a5] cursor-pointer transition-colors shrink-0"
              >
                {copied ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            {(profile as any)?.createdAt && (
              <div>
                <div className="text-[14px] text-[#e8ecf0]">
                  {formatDate((profile as any).createdAt)}
                </div>
                <div className="text-[12.5px] text-[#6c7883] mt-1">Member since</div>
              </div>
            )}
          </div>

          <div className="h-2 bg-[#0e1621] mt-2" />

          {/* ── Stat rows — visual placeholders, not wired to real counts yet ── */}
          <div className="flex flex-col">
            {statRows.map((row) => (
              <button
                key={row.label}
                title="Not wired up yet"
                className="flex items-center gap-4 px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-[#202b36] transition-colors"
              >
                <span className="text-[#5288c1] shrink-0">{row.icon}</span>
                <span className="text-[14px] text-[#e8ecf0]">{row.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}