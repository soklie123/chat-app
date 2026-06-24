"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useAIChat, useSmartReplies, useTranslate, useImproveMessage } from "../../hooks/useAi";

// ── Quick action chips shown at the top ──────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "✍️ Improve my message", prompt: "improve:" },
  { label: "🌐 Translate", prompt: "translate:" },
  { label: "💡 Explain this code", prompt: "explain code:" },
  { label: "📝 Summarize chat", prompt: "summarize this conversation" },
];

const LANGUAGES = ["Spanish", "French", "Chinese", "Japanese", "Arabic", "Portuguese", "German", "Korean"];

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional: pass current chat context so AI can reference it
  currentChatContext?: { sender: string; content: string }[];
}

export default function AIChatPanel({ isOpen, onClose, currentChatContext }: AIChatPanelProps) {
  const { messages, loading, sendMessage, clearChat } = useAIChat();
  const { replies: smartReplies, fetchReplies, clearReplies } = useSmartReplies();
  const { translate, translated, loading: translating, clearTranslated } = useTranslate();
  const { improve, improved, loading: improving, clearImproved } = useImproveMessage();

  const [input, setInput] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [textToTranslate, setTextToTranslate] = useState("");
  const [showImprove, setShowImprove] = useState(false);
  const [textToImprove, setTextToImprove] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    clearReplies();
    await sendMessage(text);
    // After AI replies, fetch smart replies for the last user message
    fetchReplies(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSmartReply = (reply: string) => {
    setInput(reply);
    inputRef.current?.focus();
  };

  const handleQuickAction = (prompt: string) => {
    if (prompt === "translate:") {
      setShowLangPicker(true);
    } else if (prompt === "improve:") {
      setShowImprove(true);
    } else {
      setInput(prompt);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span className="ai-avatar">✦</span>
          <div>
            <p className="ai-name">AI Assistant</p>
            <p className="ai-status">{loading ? "Thinking..." : "Online"}</p>
          </div>
        </div>
        <div className="ai-header-actions">
          <button onClick={clearChat} title="Clear chat" className="ai-icon-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
          <button onClick={onClose} className="ai-icon-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Quick action chips */}
      <div className="ai-quick-actions">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.label} className="ai-chip" onClick={() => handleQuickAction(a.prompt)}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ${msg.role === "user" ? "ai-msg-user" : "ai-msg-ai"}`}>
            {msg.role === "ai" && <span className="ai-bubble-avatar">✦</span>}
            <div className="ai-bubble">
              <p>{msg.content}</p>
              <span className="ai-time">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="ai-msg ai-msg-ai">
            <span className="ai-bubble-avatar">✦</span>
            <div className="ai-bubble ai-typing">
              <span/><span/><span/>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Smart replies */}
      {smartReplies.length > 0 && (
        <div className="ai-smart-replies">
          <p className="ai-smart-label">Suggested replies</p>
          <div className="ai-smart-list">
            {smartReplies.map((r, i) => (
              <button key={i} className="ai-smart-btn" onClick={() => handleSmartReply(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Translate modal */}
      {showLangPicker && (
        <div className="ai-modal">
          <p className="ai-modal-title">Translate text</p>
          <textarea
            className="ai-modal-input"
            placeholder="Paste the text to translate..."
            value={textToTranslate}
            onChange={(e) => setTextToTranslate(e.target.value)}
            rows={3}
          />
          <div className="ai-lang-grid">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                className="ai-lang-btn"
                onClick={async () => {
                  await translate(textToTranslate, lang);
                }}
              >
                {lang}
              </button>
            ))}
          </div>
          {translating && <p className="ai-modal-status">Translating...</p>}
          {translated && (
            <div className="ai-modal-result">
              <p>{translated}</p>
              <button
                className="ai-chip"
                onClick={() => {
                  setInput(translated);
                  setShowLangPicker(false);
                  clearTranslated();
                  setTextToTranslate("");
                }}
              >
                Use this
              </button>
            </div>
          )}
          <button className="ai-modal-close" onClick={() => { setShowLangPicker(false); clearTranslated(); }}>
            Close
          </button>
        </div>
      )}

      {/* Improve message modal */}
      {showImprove && (
        <div className="ai-modal">
          <p className="ai-modal-title">Improve your message</p>
          <textarea
            className="ai-modal-input"
            placeholder="Paste your draft message..."
            value={textToImprove}
            onChange={(e) => setTextToImprove(e.target.value)}
            rows={3}
          />
          <button className="ai-chip" onClick={() => improve(textToImprove)} disabled={improving}>
            {improving ? "Improving..." : "Improve"}
          </button>
          {improved && (
            <div className="ai-modal-result">
              <p>{improved}</p>
              <button
                className="ai-chip"
                onClick={() => {
                  setInput(improved);
                  setShowImprove(false);
                  clearImproved();
                  setTextToImprove("");
                }}
              >
                Use this
              </button>
            </div>
          )}
          <button className="ai-modal-close" onClick={() => { setShowImprove(false); clearImproved(); }}>
            Close
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="ai-input-area">
        <textarea
          ref={inputRef}
          className="ai-input"
          placeholder="Ask AI anything... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="ai-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      <style>{`
        .ai-panel {
          position: fixed;
          bottom: 80px;
          right: 20px;
          width: 360px;
          max-height: 600px;
          background: var(--bg-primary, #1e1f22);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          z-index: 1000;
          overflow: hidden;
          font-family: inherit;
        }
        .ai-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .ai-panel-title { display: flex; align-items: center; gap: 10px; }
        .ai-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #5865f2, #7c3aed);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: white; flex-shrink: 0;
          line-height: 36px; text-align: center;
        }
        .ai-name { font-size: 14px; font-weight: 600; color: #fff; margin: 0; }
        .ai-status { font-size: 11px; color: #57f287; margin: 0; }
        .ai-header-actions { display: flex; gap: 4px; }
        .ai-icon-btn {
          background: none; border: none; color: rgba(255,255,255,0.5);
          cursor: pointer; padding: 6px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .ai-icon-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }

        .ai-quick-actions {
          display: flex; gap: 6px; padding: 10px 12px;
          overflow-x: auto; flex-shrink: 0;
          scrollbar-width: none;
        }
        .ai-quick-actions::-webkit-scrollbar { display: none; }
        .ai-chip {
          background: rgba(88,101,242,0.15);
          border: 1px solid rgba(88,101,242,0.3);
          color: #a5b4fc;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .ai-chip:hover { background: rgba(88,101,242,0.3); color: #c4b5fd; }
        .ai-chip:disabled { opacity: 0.5; cursor: not-allowed; }

        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .ai-msg { display: flex; gap: 8px; align-items: flex-end; }
        .ai-msg-user { flex-direction: row-reverse; }
        .ai-bubble-avatar {
          width: 24px; height: 24px;
          background: linear-gradient(135deg, #5865f2, #7c3aed);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: white; flex-shrink: 0;
          line-height: 24px; text-align: center;
        }
        .ai-bubble {
          max-width: 80%;
          background: rgba(255,255,255,0.06);
          border-radius: 14px 14px 14px 4px;
          padding: 10px 13px;
          position: relative;
        }
        .ai-msg-user .ai-bubble {
          background: linear-gradient(135deg, #5865f2, #7c3aed);
          border-radius: 14px 14px 4px 14px;
        }
        .ai-bubble p { margin: 0; font-size: 13.5px; line-height: 1.5; color: #fff; }
        .ai-time { font-size: 10px; color: rgba(255,255,255,0.35); display: block; margin-top: 4px; }

        .ai-typing { display: flex; gap: 4px; padding: 12px 14px; align-items: center; }
        .ai-typing span {
          width: 6px; height: 6px;
          background: rgba(255,255,255,0.4);
          border-radius: 50%;
          animation: bounce 1.2s ease-in-out infinite;
        }
        .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

        .ai-smart-replies {
          padding: 8px 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .ai-smart-label { font-size: 11px; color: rgba(255,255,255,0.4); margin: 0 0 6px; }
        .ai-smart-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .ai-smart-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ai-smart-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

        .ai-modal {
          position: absolute;
          inset: 0;
          background: var(--bg-primary, #1e1f22);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 10;
          overflow-y: auto;
        }
        .ai-modal-title { font-size: 15px; font-weight: 600; color: #fff; margin: 0; }
        .ai-modal-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #fff;
          padding: 10px 12px;
          font-size: 13px;
          resize: none;
          font-family: inherit;
        }
        .ai-modal-input:focus { outline: none; border-color: #5865f2; }
        .ai-lang-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .ai-lang-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          border-radius: 8px;
          padding: 7px 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ai-lang-btn:hover { background: rgba(88,101,242,0.3); border-color: #5865f2; color: #fff; }
        .ai-modal-status { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; }
        .ai-modal-result {
          background: rgba(87,242,135,0.08);
          border: 1px solid rgba(87,242,135,0.2);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-modal-result p { margin: 0; font-size: 13px; color: #fff; line-height: 1.5; }
        .ai-modal-close {
          background: none; border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer; font-size: 13px;
          padding: 4px; text-align: left;
          transition: color 0.15s;
        }
        .ai-modal-close:hover { color: #fff; }

        .ai-input-area {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .ai-input {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          padding: 10px 13px;
          font-size: 13.5px;
          resize: none;
          font-family: inherit;
          max-height: 100px;
          line-height: 1.4;
        }
        .ai-input:focus { outline: none; border-color: #5865f2; }
        .ai-input:disabled { opacity: 0.5; }
        .ai-input::placeholder { color: rgba(255,255,255,0.3); }
        .ai-send-btn {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #5865f2, #7c3aed);
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.1s;
        }
        .ai-send-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.05); }
        .ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}