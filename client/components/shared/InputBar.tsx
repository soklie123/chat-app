import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import FilePreview from "./FilePreview";
import ReplyBar from "../chat/ReplyBar";
import { MdOutlineEmojiEmotions } from "react-icons/md";

const UPLOAD_URL = "http://localhost:4000/upload";

type FileData = { fileUrl: string; fileName: string; fileType: string; isImage: boolean };
type AudioData = { audioUrl: string; audioDuration: number };

const POPULAR_EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫣","🤭","🤫","🤥","😶","😐","😑","😬","🫨","🫠","😮","🥱","😴","🤤","😪","😮‍💨","😵","😵‍💫","🫥","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","💋","🩸","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","🚀","✨","🔥",
];

const TECH_STICKERS = [
  { id: "st_pepe_happy", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f438/512.webp", name: "Happy Frog" },
  { id: "st_fire", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp", name: "Lit Fire" },
  { id: "st_party", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp", name: "Party Face" },
  { id: "st_mind_blown", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp", name: "Mind Blown" },
  { id: "st_cool", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp", name: "Sunglasses Cool" },
  { id: "st_programmer", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bb/512.webp", name: "Laptop Coding" },
  { id: "st_heart_glowing", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp", name: "Red Heart" },
];

const TRENDING_GIFS = [
  { id: "gif_dance", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWdtcm93d3J4bW9qdG15ZXZ3amg3bXF5amR2ZzM1YmJhNHo5cjFmOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3V0lsG3Js1ZK9y1O/giphy.gif", title: "Dance Party" },
  { id: "gif_cat", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXN6bnloYTZ3YWN5NHpmaG5sd295MGZpaWl5ZHcycm54cGFwZXRvZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VbnUQirBP0c36/giphy.gif", title: "Coding Cat" },
  { id: "gif_deal_with_it", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcXk4eGk3YXRpc2o5cDFqNDRxbDdocjNxZXIxZWg1czhkcGR6byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c6DIpCp1922KQ/giphy.gif", title: "Deal With It" },
  { id: "gif_hype", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWRhMnZka29mdWNwNnY5cW0xaDN1NG91NmNsc3A1Nzh4NWR3cGxtdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/w8g5zUCbH215kUjycc/giphy.gif", title: "Let's Go" },
  { id: "gif_mind_blown", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1cGphYTZrb3o5ZTNlYml0MDRiNXp3bThubXdzbHozYWthYXN6dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2rqEdFug5kn84/giphy.gif", title: "Mind Blown Animation" },
  { id: "gif_thumbs_up", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3AwaGV3ZGgycHF1cmJkaTZudGR4cGw4cHF1dzI2MWd4dW8waGNpZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XreQmk7ETCPe0/giphy.gif", title: "Thumbs Up" },
];

export default function InputBar({
  currentRoom,
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  forwardMsg,
  onCancelForward,
  onForwardSend,
  // ── Voice recording — owned by parent (DMPanel/ChatPanel) ──
  isRecording = false,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
}: {
  currentRoom: string;
  onSend: (text: string, file?: FileData, audio?: AudioData, replyTo?: { _id: string; username: string; text: string }) => void;
  onTyping: (value: string) => void;
  replyTo?: { _id: string; username: string; text: string };
  onCancelReply?: () => void;
  forwardMsg?: { text: string; fromUsername: string };
  onCancelForward?: () => void;
  onForwardSend?: (text: string, fromUsername: string, caption: string) => void;
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCancelRecording?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<FileData | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"emoji" | "stickers" | "gifs">("emoji");
  const [pickerPos, setPickerPos] = useState<{ bottom: number; right: number } | null>(null);

  const fileInputRef    = useRef<HTMLInputElement | null>(null);
  const pickerRef       = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const inputRef        = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
        toggleButtonRef.current && !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (forwardMsg && onForwardSend) {
      onForwardSend(forwardMsg.text, forwardMsg.fromUsername, message.trim());
      setMessage("");
      setPreview(null);
      setShowEmojiPicker(false);
      return;
    }
    if (!message.trim() && !preview) return;
    onSend(message, preview ?? undefined, undefined, replyTo);
    setMessage("");
    setPreview(null);
    setShowEmojiPicker(false);
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

  const appendEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart || 0;
    const end   = input.selectionEnd   || 0;
    const newText = message.substring(0, start) + emoji + message.substring(end);
    setMessage(newText);
    onTyping(newText);
    setTimeout(() => {
      input.focus();
      input.selectionStart = input.selectionEnd = start + emoji.length;
    }, 0);
  };

  const handleStickerSend = (stickerUrl: string, stickerName: string) => {
    onSend("", { fileUrl: stickerUrl, fileName: `${stickerName}.webp`, fileType: "image/webp", isImage: true }, undefined, replyTo);
    setShowEmojiPicker(false);
    onCancelReply?.();
  };

  const handleGifSend = (gifUrl: string, gifTitle: string) => {
    onSend("", { fileUrl: gifUrl, fileName: `${gifTitle}.gif`, fileType: "image/gif", isImage: true }, undefined, replyTo);
    setShowEmojiPicker(false);
    onCancelReply?.();
  };

  const hasContent = !!(message.trim() || preview || forwardMsg);

  return (
    <div className="relative bg-[#17212b] border-t border-[#0d1821] shrink-0">

      {/* ── Emoji / Sticker / GIF picker ── */}
      {showEmojiPicker && pickerPos && createPortal(
        <div
          ref={pickerRef}
          style={{ position: "fixed", bottom: pickerPos.bottom, right: pickerPos.right, width: 360, height: 440, zIndex: 9999 }}
          className="bg-[#17212b] border border-[#101921] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        >
          <div className="flex border-b border-[#101921] p-1">
            {(["emoji", "stickers", "gifs"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 bg-transparent border-none py-2.5 text-[14px] font-semibold cursor-pointer uppercase transition-all duration-150 border-b-2 ${
                  activeTab === tab ? "text-[#5288c1] border-[#5288c1]" : "text-[#7e8b98] border-transparent"
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="px-3 py-2">
            <input type="text" placeholder={`Search ${activeTab}...`}
              className="w-full px-3 py-2 rounded-lg border-none bg-[#101921] text-white text-[13.5px] outline-none placeholder:text-[#6c7883]" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202b36] [&::-webkit-scrollbar-thumb]:rounded-[10px]">
            {activeTab === "emoji" && (
              <div>
                <div className="text-[12px] font-semibold text-[#5288c1] my-2 uppercase tracking-[0.5px]">Emoji & People</div>
                <div className="grid grid-cols-8 gap-1.5">
                  {POPULAR_EMOJIS.map((emoji, i) => (
                    <button key={i} onClick={() => appendEmoji(emoji)}
                      className="bg-transparent border-none text-2xl p-1 cursor-pointer rounded-lg flex items-center justify-center transition-colors duration-100 hover:bg-[#202b36]">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "stickers" && (
              <div>
                <div className="text-[12px] font-semibold text-[#5288c1] my-2 uppercase tracking-[0.5px]">Trending Stickers</div>
                <div className="grid grid-cols-4 gap-2.5 mt-2">
                  {TECH_STICKERS.map((s) => (
                    <button key={s.id} onClick={() => handleStickerSend(s.url, s.name)} title={s.name}
                      className="bg-transparent border-none p-1.5 cursor-pointer rounded-[10px] flex items-center justify-center transition-all duration-200 hover:bg-[#202b36] hover:scale-[1.08]">
                      <img src={s.url} alt={s.name} className="w-16 h-16 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "gifs" && (
              <div>
                <div className="text-[12px] font-semibold text-[#5288c1] my-2 uppercase tracking-[0.5px]">Trending GIFs</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TRENDING_GIFS.map((g) => (
                    <button key={g.id} onClick={() => handleGifSend(g.url, g.title)} title={g.title}
                      className="bg-[#101921] border-none p-0 cursor-pointer rounded-lg overflow-hidden h-[110px] flex items-center justify-center transition-all duration-200 hover:scale-[1.03] hover:opacity-90">
                      <img src={g.url} alt={g.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Reply / Forward bars */}
      {replyTo && onCancelReply && 
        <ReplyBar 
          replyTo={replyTo} 
          onCancel={onCancelReply} 
        />
      }
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
          <button onClick={() => { setMessage(""); setPreview(null); onCancelForward?.(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-[#c5cdd6] shrink-0">
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
          <button onClick={() => setPreview(null)}
            className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-white shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-1.5 px-2.5 py-2">

        {/* Attach */}
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading || isRecording}
          className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#202b36] hover:text-[#5288c1] ${uploading ? "text-[#5288c1]" : "text-[#8b98a5]"}`}>
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
        <input aria-label="File input" ref={fileInputRef} type="file" className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc" onChange={handleFileChange} />

        {/* Text input */}
        <div className="relative flex-1">
          <input ref={inputRef}
            className="w-full h-10 bg-[#242f3d] border-none rounded-[22px] pl-[18px] pr-14 text-[14.5px] text-white outline-none placeholder:text-[#6c7883]"
            value={message}
            onChange={(e) => { setMessage(e.target.value); onTyping(e.target.value); }}
            placeholder={
              isRecording ? "Recording…"
              : preview     ? "Add a caption…"
              : forwardMsg  ? "Add a caption…"
              : replyTo     ? `Replying to @${replyTo.username}…`
              : `Message #${currentRoom}…`
            }
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button type="button" ref={toggleButtonRef}
            onClick={() => {
              if (!showEmojiPicker && toggleButtonRef.current) {
                const rect = toggleButtonRef.current.getBoundingClientRect();
                setPickerPos({ bottom: window.innerHeight - rect.top + 8, right: window.innerWidth - rect.right - 8 });
              }
              setShowEmojiPicker((v) => !v);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center z-10 text-[#8b98a5] cursor-pointer transition-transform hover:scale-110">
            <MdOutlineEmojiEmotions size={22} />
          </button>
        </div>

        {/* Mic (tap to start) or Send */}
        {!hasContent ? (
          <button
            aria-label="Voice record"
            onClick={onStartRecording}   
            disabled={uploading}
            className={`w-10 h-10 flex items-center justify-center rounded-full border-none text-white cursor-pointer transition-all active:scale-95 shrink-0 ${
              isRecording ? "bg-red-500 animate-pulse" : "bg-[#5288c1] hover:bg-[#4377aa]"
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
          <button onClick={handleSend} aria-label="Send"
            className="w-10 h-10 flex items-center justify-center rounded-full border-none bg-[#5288c1] text-white cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#4377aa] active:scale-95">
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