import { useState, useRef, useEffect } from "react";
import axios from "axios";
<<<<<<< HEAD
import { createPortal } from "react-dom";
import FilePreview from "./FilePreview";
import useVoiceRecorder from "../../hooks/useVoiceRecorder";
import ReplyBar from "../chat/ReplyBar";
import { MdOutlineEmojiEmotions } from "react-icons/md";
=======
import FilePreview from "./FilePreview";
import useVoiceRecorder from "../../hooks/useVoiceRecorder";
import ReplyBar from "../chat/ReplyBar";
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc

const UPLOAD_URL = "http://localhost:4000/upload";

type FileData = { fileUrl: string; fileName: string; fileType: string; isImage: boolean };
type AudioData = { audioUrl: string; audioDuration: number };

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🫨", "🫠", "😮", "🫣", "🥱", "😴", "🤤", "😪", "😮‍💨", "😵", "😵‍💫", "🫥", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🚀", "✨", "🔥"
];

const TECH_STICKERS = [
  { id: "st_pepe_happy", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f438/512.webp", name: "Happy Frog" },
  { id: "st_fire", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp", name: "Lit Fire" },
  { id: "st_party", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp", name: "Party Face" },
  { id: "st_mind_blown", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp", name: "Mind Blown" },
  { id: "st_cool", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp", name: "Sunglasses Cool" },
  { id: "st_programmer", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bb/512.webp", name: "Laptop Coding" },
  { id: "st_heart_glowing", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp", name: "Red Heart" }
];

<<<<<<< HEAD
const TRENDING_GIFS = [
  { id: "gif_dance", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWdtcm93d3J4bW9qdG15ZXZ3amg3bXF5amR2ZzM1YmJhNHo5cjFmOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3V0lsG3Js1ZK9y1O/giphy.gif", title: "Dance Party" },
  { id: "gif_cat", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXN6bnloYTZ3YWN5NHpmaG5sd295MGZpaWl5ZHcycm54cGFwZXRvZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VbnUQirBP0c36/giphy.gif", title: "Coding Cat" },
  { id: "gif_deal_with_it", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcXk4eGk3YXRpc2o5cDFqNDRxbDdocjNxZXIxZWg1czhkcGR6byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c6DIpCp1922KQ/giphy.gif", title: "Deal With It" },
=======
// Curated Telegram-style high-quality animated loops
const TRENDING_GIFS = [
  { id: "gif_dance", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWdtcm93d3J4bW9qdG15ZXZ3amg3bXF5amR2ZzM1YmJhNHo5cjFmOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3V0lsG3Js1ZK9y1O/giphy.gif", title: "Dance Party" },
  { id: "gif_cat", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXN6bnloYTZ3YWN5NHpmaG5sd295MGZpaWl5ZHcycm54cGFwZXRvZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VbnUQirBP0c36/giphy.gif", title: "Coding Cat" },
  { id: "gif_deal_with_it", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcXk4eGk3YXRpc2o5cDFqNDRxbDdocjNxZXIxZWg5czhkcGR6byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c6DIpCp1922KQ/giphy.gif", title: "Deal With It" },
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
  { id: "gif_hype", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWRhMnZka29mdWNwNnY5cW0xaDN1NG91NmNsc3A1Nzh4NWR3cGxtdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/w8g5zUCbH215kUjycc/giphy.gif", title: "Let's Go" },
  { id: "gif_mind_blown", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1cGphYTZrb3o5ZTNlYml0MDRiNXp3bThubXdzbHozYWthYXN6dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2rqEdFug5kn84/giphy.gif", title: "Mind Blown Animation" },
  { id: "gif_thumbs_up", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3AwaGV3ZGgycHF1cmJkaTZudGR4cGw4cHF1dzI2MWd4dW8waGNpZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XreQmk7ETCPe0/giphy.gif", title: "Thumbs Up" }
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"emoji" | "stickers" | "gifs">("emoji");
<<<<<<< HEAD

=======
  
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

<<<<<<< HEAD
const [pickerPos, setPickerPos] = useState<{ bottom: number; right: number } | null>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
=======
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current && 
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
        !pickerRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

<<<<<<< HEAD
  const inputRef = useRef<HTMLInputElement | null>(null);

  const appendEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    const newText =
      message.substring(0, start) +
      emoji +
      message.substring(end);

    setMessage(newText);
    onTyping(newText);

    // move cursor after emoji
    setTimeout(() => {
      input.focus();
      input.selectionStart = input.selectionEnd = start + emoji.length;
    }, 0);
=======
  const appendEmoji = (emoji: string) => {
    const updatedMessage = message + emoji;
    setMessage(updatedMessage);
    onTyping(updatedMessage);
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
  };

  const handleStickerSend = (stickerUrl: string, stickerName: string) => {
    const stickerPayload: FileData = {
      fileUrl: stickerUrl,
      fileName: `${stickerName}.webp`,
      fileType: "image/webp",
      isImage: true,
    };
    onSend("", stickerPayload, undefined, replyTo);
    setShowEmojiPicker(false);
    onCancelReply?.();
  };

<<<<<<< HEAD
=======
  // Instant send feature for animated GIFs
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
  const handleGifSend = (gifUrl: string, gifTitle: string) => {
    const gifPayload: FileData = {
      fileUrl: gifUrl,
      fileName: `${gifTitle}.gif`,
      fileType: "image/gif",
      isImage: true,
    };
    onSend("", gifPayload, undefined, replyTo);
    setShowEmojiPicker(false);
    onCancelReply?.();
  };

  const hasContent = !!(message.trim() || preview || forwardMsg);

  return (
<<<<<<< HEAD
    <div className="relative bg-[#17212b] border-t border-[#0d1821] shrink-0">

      {/* ── TELEGRAM STYLE PICKER OVERLAY ── */}
      {showEmojiPicker && pickerPos && createPortal(
        <div
          ref={pickerRef}
          style={{
            position: "fixed",
            bottom: pickerPos.bottom,
            right: pickerPos.right,
            width: 360,
            height: 440,
            zIndex: 9999,
          }}
          className="bg-[#17212b] border border-[#101921] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-[#101921] p-1">
=======
    <div className="bg-[#17212b] border-t border-[#0d1821] shrink-0" style={{ position: "relative" }}>
      
      <style>{`
        .tg-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .tg-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .tg-scrollbar::-webkit-scrollbar-thumb {
          background: #202b36;
          border-radius: 10px;
        }
        .tg-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2b394a;
        }
      `}</style>

      {/* ── TELEGRAM STYLE PICKER OVERLAY ── */}
      {showEmojiPicker && (
        <div 
          ref={pickerRef}
          style={{
            position: "absolute",
            bottom: "100%",
            right: "14px",
            marginBottom: "10px",
            width: "360px",
            height: "440px",
            background: "#17212b",
            border: "1px solid #101921",
            borderRadius: "14px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Tabs Navigation Header */}
          <div style={{ display: "flex", borderBottom: "1px solid #101921", padding: "4px" }}>
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
            {(["emoji", "stickers", "gifs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
<<<<<<< HEAD
                className={`flex-1 bg-transparent border-none py-2.5 text-[14px] font-semibold cursor-pointer uppercase transition-all duration-150 border-b-2 ${
                  activeTab === tab
                    ? "text-[#5288c1] border-[#5288c1]"
                    : "text-[#7e8b98] border-transparent"
                }`}
=======
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: activeTab === tab ? "#5288c1" : "#7e8b98",
                  padding: "10px 0",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  borderBottom: activeTab === tab ? "2px solid #5288c1" : "2px solid transparent",
                  transition: "all 0.15s"
                }}
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
              >
                {tab}
              </button>
            ))}
          </div>

<<<<<<< HEAD
          {/* Search */}
          <div className="px-3 py-2">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="w-full px-3 py-2 rounded-lg border-none bg-[#101921] text-white text-[13.5px] outline-none placeholder:text-[#6c7883]"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202b36] [&::-webkit-scrollbar-thumb]:rounded-[10px]">
            {activeTab === "emoji" && (
              <div>
                <div className="text-[12px] font-semibold text-[#5288c1] my-2 uppercase tracking-[0.5px]">Emoji & People</div>
                <div className="grid grid-cols-8 gap-1.5">
=======
          {/* Search Box Section */}
          <div style={{ padding: "8px 12px" }}>
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                background: "#101921",
                color: "white",
                fontSize: "13.5px",
                outline: "none"
              }}
            />
          </div>

          {/* Content Viewer Grid Panels */}
          <div className="tg-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
            
            {/* EMOJI COMPONENT TAB VIEW */}
            {activeTab === "emoji" && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#5288c1", margin: "8px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Emoji & People
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "6px" }}>
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
                  {POPULAR_EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => appendEmoji(emoji)}
<<<<<<< HEAD
                      className="bg-transparent border-none text-2xl p-1 cursor-pointer rounded-lg flex items-center justify-center transition-colors duration-100 hover:bg-[#202b36]"
=======
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "24px",
                        padding: "4px",
                        cursor: "pointer",
                        borderRadius: "8px",
                        transition: "background 0.1s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#202b36")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
<<<<<<< HEAD
            {activeTab === "stickers" && (
              <div>
                <div className="text-[12px] font-semibold text-[#5288c1] my-2 uppercase tracking-[0.5px]">Trending Stickers</div>
                <div className="grid grid-cols-4 gap-2.5 mt-2">
=======

            {/* STICKER COMPONENT TAB VIEW */}
            {activeTab === "stickers" && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#5288c1", margin: "8px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Trending Stickers
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "8px" }}>
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
                  {TECH_STICKERS.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => handleStickerSend(sticker.url, sticker.name)}
                      title={sticker.name}
<<<<<<< HEAD
                      className="bg-transparent border-none p-1.5 cursor-pointer rounded-[10px] flex items-center justify-center transition-all duration-200 hover:bg-[#202b36] hover:scale-[1.08]"
                    >
                      <img src={sticker.url} alt={sticker.name} className="w-16 h-16 object-contain" />
=======
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "6px",
                        cursor: "pointer",
                        borderRadius: "10px",
                        transition: "transform 0.2s, background 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#202b36";
                        e.currentTarget.style.transform = "scale(1.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <img 
                        src={sticker.url} 
                        alt={sticker.name} 
                        style={{ width: "64px", height: "64px", objectFit: "contain" }}
                      />
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
                    </button>
                  ))}
                </div>
              </div>
            )}
<<<<<<< HEAD
            {activeTab === "gifs" && (
              <div>
                <div className="text-[12px] font-semibold text-[#5288c1] my-2 uppercase tracking-[0.5px]">Trending GIFs</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
=======

            {/* GIF COMPONENT TAB VIEW — INSTANT SEND CLICK */}
            {activeTab === "gifs" && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#5288c1", margin: "8px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Trending GIFs
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginTop: "8px" }}>
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
                  {TRENDING_GIFS.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleGifSend(gif.url, gif.title)}
                      title={gif.title}
<<<<<<< HEAD
                      className="bg-[#101921] border-none p-0 cursor-pointer rounded-lg overflow-hidden h-[110px] flex items-center justify-center transition-all duration-200 hover:scale-[1.03] hover:opacity-90"
                    >
                      <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
=======
                      style={{
                        background: "#101921",
                        border: "none",
                        padding: "0",
                        cursor: "pointer",
                        borderRadius: "8px",
                        overflow: "hidden",
                        height: "110px",
                        transition: "transform 0.2s, opacity 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.opacity = "0.9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      <img 
                        src={gif.url} 
                        alt={gif.title} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
<<<<<<< HEAD
        </div>,
        document.body
=======
        </div>
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
      )}

      {/* Reply bar */}
      {replyTo && onCancelReply && (
        <ReplyBar replyTo={replyTo} onCancel={onCancelReply} />
      )}

      {/* Forward bar */}
      {forwardMsg && onCancelForward && (
        <div className="flex items-center gap-2.5 px-3.5 py-[7px] border-t border-[#0d1821]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f4a93f" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
<<<<<<< HEAD
            <polyline points="15 17 20 12 15 7" />
            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
=======
            <polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" />
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
          </svg>
          <div className="flex items-stretch gap-2.5 flex-1 min-w-0">
            <div className="w-0.5 min-h-[34px] bg-[#f4a93f] rounded-sm shrink-0" />
            <div className="flex-1 min-w-0">
<<<<<<< HEAD
              <div className="text-[12.5px] font-semibold text-[#f4a93f] mb-px">
                Forwarded from {forwardMsg.fromUsername}
              </div>
              <div className="text-[12.5px] text-[#8b98a5] truncate">
                {forwardMsg.text || "📎 File"}
              </div>
=======
              <div className="text-[12.5px] font-semibold text-[#f4a93f] mb-px">Forwarded from {forwardMsg.fromUsername}</div>
              <div className="text-[12.5px] text-[#8b98a5] truncate">{forwardMsg.text || "📎 File"}</div>
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
            </div>
          </div>
          <button
            onClick={() => { setMessage(""); setPreview(null); onCancelForward?.(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-[#c5cdd6] shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
<<<<<<< HEAD
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
=======
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
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
<<<<<<< HEAD
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
=======
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
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
<<<<<<< HEAD
          className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#202b36] hover:text-[#5288c1] ${
            uploading ? "text-[#5288c1]" : "text-[#8b98a5]"
          }`}
=======
          className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#202b36] hover:text-[#5288c1] ${uploading ? "text-[#5288c1]" : "text-[#8b98a5]"}`}
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
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

<<<<<<< HEAD
        <input
          aria-label="File input"
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc"
          onChange={handleFileChange}
        />

        {/* Text input with smiley button */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            className="w-full h-10 bg-[#242f3d] border-none rounded-[22px] pl-[18px] pr-14 text-[14.5px] text-white outline-none placeholder:text-[#6c7883] relative z-0"
=======
        <input aria-label="File input" ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc" onChange={handleFileChange} />

        {/* Text Input Container with integrated Trigger Smiley Button */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <input
            className="flex-1 h-10 bg-[#242f3d] border-none rounded-[22px] pl-[18px] pr-[44px] text-[14.5px] text-white outline-none placeholder:text-[#6c7883]"
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
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
<<<<<<< HEAD

          {/* Smiley toggle button */}
          <button
            type="button"
            ref={toggleButtonRef}
            onClick={() => {
              if (!showEmojiPicker && toggleButtonRef.current) {
                const rect = toggleButtonRef.current.getBoundingClientRect();
                setPickerPos({
                  bottom: window.innerHeight - rect.top + 8,
                  right: window.innerWidth - rect.right - 8,
                });
              }
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              w-8 h-8
              flex items-center justify-center
              z-10
              text-[20px]
              text-[#8b98a5]
              cursor-pointer
              transition-transform
              hover:scale-110
            `}
          >
            <MdOutlineEmojiEmotions size={22} />
          </button>
        </div>
        
=======
          
          {/* Smiley Toggle Button Icon */}
          <button
            ref={toggleButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              position: "absolute",
              right: "12px",
              background: "transparent",
              border: "none",
              color: showEmojiPicker ? "#5288c1" : "#6c7883",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s"
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
        </div>

>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
        {/* Voice / Send */}
        {!hasContent ? (
          <button
            aria-label="Voice record"
<<<<<<< HEAD
            onMouseDown={start}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchEnd={stop}
=======
            onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
            onTouchStart={start} onTouchEnd={stop}
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
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