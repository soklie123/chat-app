import { useState, useEffect, useRef } from "react";
import { DMMessage } from "../types/chat";
import Avatar from "./Avatar";
import TypingDots from "./TypingDots";
import FilePreview from "./FilePreview";
import ReactionPicker from "./ReactionPicker";
import axios from "axios";
import { useLongPress } from "../hooks/useLongPress";

import { MdPhone, MdVideocam } from "react-icons/md";
import CallEventBubble from "./CallEventBubble";


const UPLOAD_URL = "http://localhost:4000/upload";

function DMMessageWrapper({
  id,
  hoveredId,
  setHoveredId,
  children,
  className,
}: {
  id: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const longPress = useLongPress(() => setHoveredId(id));
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHoveredId(id);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => {
      setHoveredId((cur) => (cur === id ? null : cur));
    }, 300);
  };

  //  was missing return
  return (
    <div
      className={className}
      {...longPress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

export default function DMPanel({
  withUser,
  messages,
  dmTyping,
  isOnline,
  onSend,
  onTyping,
  onClose,
  onReact,
  onVideoCall,
  onVoiceCall,
}: {
  withUser: string;
  messages: DMMessage[];
  dmTyping: string | null;
  isOnline: boolean;
  onSend: (text: string, file?: {
    fileUrl: string; fileName: string; fileType: string; isImage: boolean;
  }) => void;
  onTyping: (value: string) => void;
  onClose: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
}) {
  const [message, setMessage]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null); // was missing
  const [preview, setPreview]     = useState<{
    fileUrl: string; fileName: string; fileType: string; isImage: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef   = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, dmTyping]);

  useEffect(() => {
    const dismiss = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-reaction-picker]")) return;
      setHoveredId(null);
    };
    document.addEventListener("touchstart", dismiss);
    return () => document.removeEventListener("touchstart", dismiss);
  }, []);

  const handleSend = () => {
    if (!message.trim() && !preview) return;
    onSend(message, preview ?? undefined);
    setMessage("");
    setPreview(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(UPLOAD_URL, formData);
      setPreview({
        fileUrl:  res.data.url,
        fileName: res.data.originalName,
        fileType: res.data.mimetype,
        isImage:  res.data.isImage,
      });
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-[#0088cc] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <Avatar name={withUser} size={32} />
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0088cc] ${
            isOnline ? "bg-green-400" : "bg-gray-400"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-[15px]">{withUser}</div>
          <div className="text-[11px] text-white/70">
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
        {/* Voice call */}
        <button onClick={onVoiceCall} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
          <MdPhone size={18} />
        </button>

        {/* Video call */}
        <button onClick={onVideoCall} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
          <MdVideocam size={18} />
        </button>
        <button
          onClick={onClose}
          aria-label="Close call"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 px-3 py-3.5 bg-[#e5eff5] overflow-y-auto flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <Avatar name={withUser} size={48} />
            <p className="text-sm">Start a conversation with <strong>{withUser}</strong></p>
          </div>
        )}

        {messages.map((msg, i) => {
          const id = msg._id ?? String(i);

          // Call event
          if (msg.callEvent) {
            return(
              <CallEventBubble
                key={id}
                callEvent={msg.callEvent}
                callType={msg.callType ?? "voice"}
                callDuration={msg.callDuration}
                fromSelf={msg.fromSelf}
                username={msg.username}
                time={msg.time}
              />
            );
          }

          const isHovered = hoveredId === id;

          return msg.fromSelf ? (
            // ── Own DM message ──
            <DMMessageWrapper
              key={id}
              id={id}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              className="flex justify-end self-end max-w-[80%] relative group"
            >
              {/* Reaction picker */}
              {isHovered && msg._id && onReact && (
                <div
                  data-reaction-picker
                  className="absolute right-0 -top-10 z-20"
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <ReactionPicker onSelect={(emoji) => {
                    onReact(msg._id!, emoji);
                    setHoveredId(null);
                  }} />
                </div>
              )}

              <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-[#1c3906] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                {msg.text}
                {msg.fileUrl && (
                  <FilePreview
                    fileUrl={msg.fileUrl}
                    fileName={msg.fileName}
                    fileType={msg.fileType}
                    isImage={msg.isImage}
                  />
                )}
                <div className="text-[10px] text-[#6a9c5a] mt-1 text-right">{msg.time}</div>
              </div>
            </DMMessageWrapper>

          ) : (
            // ── Other user DM message ──
            <DMMessageWrapper
              key={id}
              id={id}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              className="flex items-end gap-1.5 max-w-[80%] relative"
            >
              <Avatar name={msg.username} size={28} />
              <div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#1a1a1a] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  {msg.text}
                  {msg.fileUrl && (
                    <FilePreview
                      fileUrl={msg.fileUrl}
                      fileName={msg.fileName}
                      fileType={msg.fileType}
                      isImage={msg.isImage}
                    />
                  )}
                  <div className="text-[10px] text-slate-400 mt-1 text-right">{msg.time}</div>
                </div>
              </div>

              {/* Reaction picker */}
              {isHovered && msg._id && onReact && (
                <div
                  data-reaction-picker
                  className="absolute left-8 -top-10 z-20"
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <ReactionPicker onSelect={(emoji) => {
                    onReact(msg._id!, emoji);
                    setHoveredId(null);
                  }} />
                </div>
              )}
            </DMMessageWrapper>
          );
        })}

        {dmTyping && (
          <div className="flex items-end gap-1.5 max-w-[80%]">
            <Avatar name={withUser} size={28} />
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File preview above input */}
      {preview && (
        <div className="px-3 pt-2 bg-white flex items-start gap-2">
          <FilePreview {...preview} />
          <button
            onClick={() => setPreview(null)}
            aria-label="preview"
            className="mt-1 text-slate-400 hover:text-red-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0088cc] hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          {uploading ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>

        <input
          ref={fileInputRef}
          aria-label="change file"
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc"
          onChange={handleFileChange}
        />

        <input
          className="flex-1 px-3.5 py-2 rounded-full border border-gray-200 bg-[#f1f3f4] text-sm text-gray-800 outline-none focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20 transition-all placeholder:text-gray-400"
          value={message}
          onChange={(e) => { setMessage(e.target.value); onTyping(e.target.value); }}
          placeholder={preview ? "Add a caption…" : `Message ${withUser}…`}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          aria-label="send"
          disabled={!message.trim() && !preview}
          className="w-9 h-9 rounded-full bg-[#0088cc] flex items-center justify-center text-white flex-shrink-0 hover:bg-[#0077b6] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}