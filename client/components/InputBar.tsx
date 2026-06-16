import { useState, useRef } from "react";
import axios from "axios";
import FilePreview from "./FilePreview";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import ReplyBar from "./ReplyBar";

const UPLOAD_URL = "http://localhost:4000/upload";

type FileData = { fileUrl: string; fileName: string; fileType: string; isImage: boolean };
type AudioData = { audioUrl: string; audioDuration: number };

export default function InputBar({
  currentRoom,
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  forwardMsg,
  onCancelForward,
  onForwardSend,
}: {
  currentRoom: string;
  onSend: (text: string, file?: FileData, audio?: AudioData, replyTo?: { _id: string; username: string; text: string }) => void;
  onTyping: (value: string) => void;
  replyTo?: { _id: string; username: string; text: string };
  onCancelReply?: () => void;
  forwardMsg?: { text: string; fromUsername: string };
  onCancelForward?: () => void;
  onForwardSend?: (text: string, fromUsername: string, caption: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<FileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRecorded = async (blob: Blob, duration: number) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, `voice-${Date.now()}.webm`);
      const res = await axios.post(UPLOAD_URL, formData);
      onSend("", undefined, { audioUrl: res.data.url, audioDuration: duration });
    } catch {
      alert("Voice upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const { recording, start, stop } = useVoiceRecorder(handleRecorded);

  const handleSend = () => {
    if (forwardMsg && onForwardSend) {
      onForwardSend(forwardMsg.text, forwardMsg.fromUsername, message.trim());
      setMessage("");
      setPreview(null);
      return;
    }
    if (!message.trim() && !preview) return;
    onSend(message, preview ?? undefined, undefined, replyTo);
    setMessage("");
    setPreview(null);
    onCancelReply?.();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(UPLOAD_URL, formData);
      setPreview({ fileUrl: res.data.url, fileName: res.data.originalName, fileType: res.data.mimetype, isImage: res.data.isImage });
    } catch {
      alert("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white border-t border-slate-100 flex-shrink-0">

      {/* Reply bar */}
      {replyTo && onCancelReply && (
        <ReplyBar replyTo={replyTo} onCancel={onCancelReply} />
      )}

      {/* Forward bar */}
      {forwardMsg && onCancelForward && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 flex items-center gap-3">
          <div className="w-1 h-8 bg-amber-400 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-amber-600">Forwarded from @{forwardMsg.fromUsername}</div>
            <div className="text-[11px] text-slate-500 truncate">{forwardMsg.text || "📎 File"}</div>
          </div>
          <button onClick={() => { setMessage(""); setPreview(null); onCancelForward?.(); }} className="text-slate-400 hover:text-slate-600 p-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* File preview */}
      {preview && (
        <div className="px-4 pt-3 flex items-start gap-2">
          <FilePreview {...preview} />
          <button onClick={() => setPreview(null)} className="mt-1 text-slate-400 hover:text-red-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="px-4 py-2 flex items-center gap-2 text-red-500 text-sm bg-red-50">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording… release to send
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Attach file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recording}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0088cc] hover:bg-slate-100 transition-all flex-shrink-0"
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

        <input aria-label="File input" ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc" onChange={handleFileChange} />

        {/* Text input */}
        <input
          className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/15 transition-all placeholder:text-slate-400"
          value={message}
          onChange={(e) => { setMessage(e.target.value); onTyping(e.target.value); }}
          placeholder={
            recording ? "Recording…"
            : preview ? "Add a caption…"
            : forwardMsg ? `Add a caption…`
            : replyTo ? `Replying to @${replyTo.username}…`
            : `Message #${currentRoom}…`
          }
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        {/* Voice / Send */}
        {!message.trim() && !preview && !forwardMsg ? (
          <button
            aria-label="Voice record"
            onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
            onTouchStart={start} onTouchEnd={stop}
            disabled={uploading}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all active:scale-95 ${
              recording ? "bg-red-500 animate-pulse" : "bg-[#0088cc] hover:bg-[#0077b6]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            aria-label="Send"
            disabled={!forwardMsg && !message.trim() && !preview}
            className="w-9 h-9 rounded-full bg-[#0088cc] flex items-center justify-center text-white flex-shrink-0 hover:bg-[#0077b6] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}