import { useState, useRef, useEffect } from "react";
import { getAvatarColor } from "../../hooks/useChat";
import { getToken } from "../../lib/api";
import axios from "axios";

const API = "http://localhost:4000";

type ProfileData = {
  username: string;
  email: string;
  bio: string;
  avatarUrl: string;
  lastSeen?: string | Date;
  createdAt?: string | Date;
};

type Tab = "profile" | "password";

// Shared helper: axios errors carry `response.data.error` from our API;
// anything else falls back to a generic message. This replaces the
// `catch (err: any)` pattern (which trips the no-explicit-any lint rule)
// with a properly narrowed `unknown` catch.
function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const apiMessage = err.response?.data?.error;
    if (typeof apiMessage === "string" && apiMessage.length > 0) {
      return apiMessage;
    }
  }
  return fallback;
}

export default function ProfilePanel({
  username,
  onClose,
  onAvatarChange,
}: {
  username: string;
  onClose: () => void;
  onAvatarChange?: (url: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<ProfileData>({
    username,
    email: "",
    bio: "",
    avatarUrl: "",
  });
  const [editBio, setEditBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);

  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      flash("Not logged in.", true);
      return;
    }
    axios
      .get(`${API}/auth/me`, { headers: authHeaders() })
      .then((res) => {
        const u = res.data.user;
        setProfile(u);
        setBioValue(u.bio ?? "");
      })
      .catch((err: unknown) => {
        flash(getErrorMessage(err, "Failed to load profile."), true);
      });
  }, []);

  const flash = (msg: string, isError = false) => {
    if (isError) setErrorMsg(msg);
    else setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.patch(`${API}/auth/profile`, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });
      const url = res.data.user.avatarUrl;
      setProfile((p) => ({ ...p, avatarUrl: url }));
      // Notify parent (Sidebar) so the bottom self-row and menu avatar update instantly.
      // The server also broadcasts "user_profile_updated" via socket so all other
      // connected clients pick up the new URL through useChat → userProfiles.
      onAvatarChange?.(url);
      flash("Avatar updated!");
    } catch (err: unknown) {
      flash(getErrorMessage(err, "Failed to upload avatar."), true);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("bio", bioValue);
      const res = await axios.patch(`${API}/auth/profile`, formData, {
        headers: authHeaders(),
      });
      setProfile((p) => ({ ...p, bio: res.data.user.bio }));
      setEditBio(false);
      flash("Bio saved!");
    } catch (err: unknown) {
      flash(getErrorMessage(err, "Failed to save bio."), true);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      flash("All fields are required.", true);
      return;
    }
    if (newPw !== confirmPw) {
      flash("New passwords don't match.", true);
      return;
    }
    if (newPw.length < 6) {
      flash("New password must be at least 6 characters.", true);
      return;
    }
    setSaving(true);
    try {
      await axios.patch(
        `${API}/auth/change-password`,
        { currentPassword: currentPw, newPassword: newPw },
        { headers: authHeaders() }
      );
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      flash("Password changed successfully!");
    } catch (err: unknown) {
      flash(getErrorMessage(err, "Failed to change password."), true);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d?: string | Date) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const avatarBg = getAvatarColor(username);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] max-h-[90vh] bg-[#17212b] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden border border-[#0d1821]">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#0d1821] shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none text-[#8b98a5] hover:bg-[#202b36] hover:text-white cursor-pointer transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-[16px] font-semibold text-white">My Profile</span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex shrink-0 border-b border-[#0d1821]">
          {(["profile", "password"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[13px] font-semibold border-none bg-transparent cursor-pointer transition-colors capitalize ${
                tab === t
                  ? "text-[#5288c1] border-b-2 border-[#5288c1]"
                  : "text-[#6c7883] hover:text-[#8b98a5]"
              }`}
            >
              {t === "profile" ? "Profile" : "Security"}
            </button>
          ))}
        </div>

        {/* ── Flash message ── */}
        {(successMsg || errorMsg) && (
          <div
            className={`mx-4 mt-3 px-3 py-2 rounded-xl text-[13px] font-medium shrink-0 ${
              errorMsg
                ? "bg-red-500/15 text-red-400"
                : "bg-[#5288c1]/15 text-[#5288c1]"
            }`}
          >
            {successMsg || errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ══ Profile tab ══ */}
          {tab === "profile" && (
            <div className="flex flex-col">

              {/* Avatar + name */}
              <div className="flex flex-col items-center pt-6 pb-5 px-4 bg-[#17212b]">
                <div className="relative group">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={username}
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

                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                  >
                    {uploadingAvatar ? (
                      <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span className="text-[10px] text-white mt-1 font-medium">Change</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="mt-3 text-[18px] font-bold text-white">{profile.username}</div>
                <div className="text-[13px] text-[#4ade80] mt-0.5">online</div>
              </div>

              {/* Info cards */}
              <div className="px-4 pb-4 flex flex-col gap-1">

                {/* Bio */}
                <div className="bg-[#202b36] rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide">Bio</span>
                    {!editBio && (
                      <button
                        onClick={() => {
                          setEditBio(true);
                          setTimeout(() => bioInputRef.current?.focus(), 50);
                        }}
                        className="text-[11px] text-[#5288c1] hover:text-[#7aabdc] bg-transparent border-none cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editBio ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        ref={bioInputRef}
                        value={bioValue}
                        onChange={(e) => setBioValue(e.target.value.slice(0, 140))}
                        rows={3}
                        placeholder="Write something about yourself…"
                        className="w-full bg-[#17212b] border border-[#0d1821] rounded-lg px-3 py-2 text-[13.5px] text-white outline-none resize-none focus:border-[#5288c1] placeholder:text-[#4a5568] transition-colors"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#4a5568]">{bioValue.length}/140</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditBio(false);
                              setBioValue(profile.bio);
                            }}
                            className="px-3 py-1 text-[12px] text-[#8b98a5] bg-transparent border-none cursor-pointer hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveBio}
                            disabled={saving}
                            className="px-3 py-1 text-[12px] bg-[#5288c1] text-white rounded-lg border-none cursor-pointer hover:bg-[#4377aa] disabled:opacity-50"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13.5px] text-[#e8ecf0] leading-relaxed">
                      {profile.bio || (
                        <span className="text-[#4a5568] italic">No bio yet</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="bg-[#202b36] rounded-xl px-4 py-3">
                  <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide mb-1">Email</div>
                  <div className="text-[13.5px] text-[#e8ecf0]">{profile.email || "—"}</div>
                </div>

                {/* Username */}
                <div className="bg-[#202b36] rounded-xl px-4 py-3">
                  <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide mb-1">Username</div>
                  <div className="text-[13.5px] text-[#e8ecf0]">@{profile.username}</div>
                </div>

                {/* Member since */}
                <div className="bg-[#202b36] rounded-xl px-4 py-3">
                  <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide mb-1">Member Since</div>
                  <div className="text-[13.5px] text-[#e8ecf0]">{formatDate(profile.createdAt)}</div>
                </div>

                {/* Last seen */}
                <div className="bg-[#202b36] rounded-xl px-4 py-3">
                  <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide mb-1">Last Seen</div>
                  <div className="text-[13.5px] text-[#e8ecf0]">{formatDate(profile.lastSeen)}</div>
                </div>

              </div>
            </div>
          )}

          {/* ══ Security tab ══ */}
          {tab === "password" && (
            <div className="px-4 py-5 flex flex-col gap-3">
              <div className="text-[13px] text-[#6c7883] mb-1">
                Choose a strong password with at least 6 characters.
              </div>

              {/* Current password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#202b36] border border-[#0d1821] rounded-xl px-4 py-2.5 text-[13.5px] text-white outline-none focus:border-[#5288c1] placeholder:text-[#4a5568] transition-colors pr-10"
                  />
                  <button
                    onClick={() => setShowCurrentPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c7883] hover:text-[#8b98a5] bg-transparent border-none cursor-pointer"
                  >
                    {showCurrentPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-[#202b36] border border-[#0d1821] rounded-xl px-4 py-2.5 text-[13.5px] text-white outline-none focus:border-[#5288c1] placeholder:text-[#4a5568] transition-colors pr-10"
                  />
                  <button
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c7883] hover:text-[#8b98a5] bg-transparent border-none cursor-pointer"
                  >
                    {showNewPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Strength bar */}
                {newPw.length > 0 && (
                  <div className="flex gap-1 mt-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          newPw.length >= i * 3
                            ? newPw.length >= 12
                              ? "bg-[#4ade80]"
                              : newPw.length >= 8
                              ? "bg-yellow-400"
                              : "bg-red-400"
                            : "bg-[#2c3e50]"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  placeholder="Repeat new password"
                  className={`w-full bg-[#202b36] border rounded-xl px-4 py-2.5 text-[13.5px] text-white outline-none placeholder:text-[#4a5568] transition-colors ${
                    confirmPw && confirmPw !== newPw
                      ? "border-red-500/50"
                      : "border-[#0d1821] focus:border-[#5288c1]"
                  }`}
                />
                {confirmPw && confirmPw !== newPw && (
                  <span className="text-[11px] text-red-400">Passwords don&apos;t match</span>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={saving || !currentPw || !newPw || !confirmPw}
                className="mt-1 w-full py-2.5 bg-[#5288c1] text-white text-[14px] font-semibold rounded-xl border-none cursor-pointer hover:bg-[#4377aa] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Updating…" : "Change Password"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}