"use client";

import { useState } from "react";
import AIChatPanel from "./AIChatPanel";

interface AIButtonProps {
  currentChatContext?: { sender: string; content: string }[];
}

export default function AIButton({ currentChatContext }: AIButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AIChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentChatContext={currentChatContext}
      />

      {/* Only render the FAB when the panel is closed.
          The panel already has its own header close (X) button,
          so we avoid showing two close controls for one panel. */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="ai-fab"
          title="AI Assistant"
          aria-label="Open AI Assistant"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </button>
      )}

      <style>{`
        .ai-fab {
          position: fixed;
          bottom: 84px;
          right: 24px;
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #5865f2, #7c3aed);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 24px rgba(88, 101, 242, 0.5);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 999;
        }
        .ai-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 32px rgba(88, 101, 242, 0.6);
        }
        .ai-fab:active {
          transform: scale(0.95);
        }

        @media (max-width: 640px) {
          .ai-fab {
            bottom: 76px;
            right: 16px;
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </>
  );
}