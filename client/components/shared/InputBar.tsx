import { useState, useRef } from "react";
import axios from "axios";
import FilePreview from "./FilePreview";
import useVoiceRecorder from "../../hooks/useVoiceRecorder";
import ReplyBar from "../chat/ReplyBar";

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

  const hasContent = !!(message.trim() || preview || forwardMsg);

  return (
    <div className="bg-[#17212b] border-t border-[#0d1821] shrink-0">

      {/* Reply bar */}
      {replyTo && onCancelReply && (
        <ReplyBar replyTo={replyTo} onCancel={onCancelReply} />
      )}

      {/* Forward bar */}
      {forwardMsg && onCancelForward && (
        <div className="flex items-center gap-2.5 px-3.5 py-[7px] border-t border-[#0d1821]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f4a93f" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
            <polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" />
          </svg>
          <div className="flex items-stretch gap-2.5 flex-1 min-w-0">
            <div className="w-0.5 min-h-[34px] bg-[#f4a93f] rounded-sm shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-[#f4a93f] mb-px">Forwarded from {forwardMsg.fromUsername}</div>
              <div className="text-[12.5px] text-[#8b98a5] truncate">{forwardMsg.text || "📎 File"}</div>
            </div>
          </div>
          <button
            onClick={() => { setMessage(""); setPreview(null); onCancelForward?.(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-[#c5cdd6] shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* File preview */}
      {preview && (
        <div className="flex items-start gap-2 px-4 pt-2.5">
          <FilePreview {...preview} />
          <button
            onClick={() => setPreview(null)}
            className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-white shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="px-4 py-2 flex items-center gap-2 text-red-400 text-[13px] bg-[#1c2a38] border-t border-[#0d1821]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording… release to send
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-1.5 px-2.5 py-2">

        {/* Attach file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recording}
          className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#202b36] hover:text-[#5288c1] ${uploading ? "text-[#5288c1]" : "text-[#8b98a5]"}`}
        >
          {uploading ? (
            <svg className="animate-spin" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>

        <input aria-label="File input" ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc" onChange={handleFileChange} />

        {/* Text input */}
        <input
          className="flex-1 h-10 bg-[#242f3d] border-none rounded-[22px] px-[18px] text-[14.5px] text-white outline-none placeholder:text-[#6c7883]"
          value={message}
          onChange={(e) => { setMessage(e.target.value); onTyping(e.target.value); }}
          placeholder={
            recording ? "Recording…"
            : preview ? "Add a caption…"
            : forwardMsg ? "Add a caption…"
            : replyTo ? `Replying to @${replyTo.username}…`
            : `Message #${currentRoom}…`
          }
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        {/* Voice / Send */}
        {!hasContent ? (
          <button
            aria-label="Voice record"
            onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
            onTouchStart={start} onTouchEnd={stop}
            disabled={uploading}
            className={`w-10 h-10 flex items-center justify-center rounded-full border-none text-white cursor-pointer transition-all active:scale-95 shrink-0 ${
              recording ? "bg-red-500 animate-pulse" : "bg-[#5288c1] hover:bg-[#4377aa]"
            }`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            className="w-10 h-10 flex items-center justify-center rounded-full border-none bg-[#5288c1] text-white cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#4377aa] active:scale-95"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}