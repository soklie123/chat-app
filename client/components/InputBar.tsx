import { useState, useRef } from "react";
import axios from "axios";
import FilePreview from "./FilePreview";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

const UPLOAD_URL = "http://localhost:4000/upload";

type FileData = {
  fileUrl: string; fileName: string; fileType: string; isImage: boolean;
};

type AudioData = {
  audioUrl: string; 
  audioDuration: number;
};

export default function InputBar({
  currentRoom,
  onSend,
  onTyping,
}: {
  currentRoom: string;
  onSend: (text: string, file?: FileData, audio?: AudioData) => void;
  onTyping: (value: string) => void;
}) {
  const [message, setMessage]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<FileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRecorded = async (blob: Blob, duration: number) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, `voice-${Date.now()}.webm`);
      const res = await axios.post(UPLOAD_URL, formData);
      onSend("", undefined, {
        audioUrl: res.data.url,
        audioDuration: duration,
      });
    } catch {
      alert("Voice upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const { recording, start, stop } = useVoiceRecorder(handleRecorded);

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
      alert("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white flex-shrink-0">
      {/* File preview */}
      {preview && (
        <div className="px-3 pt-2 flex items-start gap-2">
          <FilePreview {...preview} />
          <button
            aria-label="pre"
            onClick={() => setPreview(null)}
            className="mt-1 text-slate-400 hover:text-red-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="px-4 py-2 flex items-center gap-2 text-red-500 text-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording… release to send
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* File button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recording}
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
          aria-label="File input"
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc"
          onChange={handleFileChange}
        />

        <input
          className="flex-1 px-3.5 py-2 rounded-full border border-gray-200 bg-[#f1f3f4] text-sm text-gray-800 outline-none focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20 transition-all placeholder:text-gray-400"
          value={message}
          onChange={(e) => { setMessage(e.target.value); onTyping(e.target.value); }}
          placeholder={recording ? "Recording…" : preview ? "Add a caption…" : `Message #${currentRoom}…`}
          disabled={recording}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        {/* Voice button — hold to record */}
        {!message.trim() && !preview ? (
          <button
            aria-label="Button voice"
            onMouseDown={start}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchEnd={stop}
            disabled={uploading}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all active:scale-95 ${
              recording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-[#0088cc] hover:bg-[#0077b6]"
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
          // Send button when typing
          <button
            onClick={handleSend}
            aria-label="Send button"
            disabled={!message.trim() && !preview}
            className="w-9 h-9 rounded-full bg-[#0088cc] flex items-center justify-center text-white flex-shrink-0 hover:bg-[#0077b6] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}