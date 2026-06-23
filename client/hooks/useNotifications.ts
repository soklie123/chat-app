import { useEffect, useRef, useState, useCallback } from "react";

export type NotificationKind = "dm" | "room" | "call" | "invite";

export function useNotifications(username: string) {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ask for permission once, if not already decided
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => setPermission(p));
    }
  }, []);

  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  // Soft two-tone "pop" — used for messages
  const playSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.1);
      };
      const now = ctx.currentTime;
      playTone(880, now, 0.15, 0.3);
      playTone(660, now + 0.15, 0.2, 0.2);
    } catch (err) {
      console.warn("Audio notification failed:", err);
    }
  }, []);

  // Three-pulse ring — used for incoming calls, slightly more present
  const playCallRing = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now + offset);
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.32, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });
    } catch (err) {
      console.warn("Call ring failed:", err);
    }
  }, []);

  // Show a browser notification — only while tab is hidden
  const showBrowserNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if (permission !== "granted") return;
      if (document.visibilityState === "visible") return;
      try {
        const notification = new Notification(title, {
          body,
          icon: icon ?? "/favicon.ico",
          badge: "/favicon.ico",
          silent: true, // sound handled ourselves
        });
        setTimeout(() => notification.close(), 4000);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (err) {
        console.warn("Browser notification failed:", err);
      }
    },
    [permission]
  );

  const notifyMessage = useCallback(
    (from: string, text: string, isDM = false) => {
      if (from === username) return;
      playSound();
      const title = isDM ? `💬 ${from}` : `# ${from}`;
      const body = text || (isDM ? "Sent you a message" : "New message");
      showBrowserNotification(title, body);
    },
    [username, playSound, showBrowserNotification]
  );

  const notifyDM = useCallback(
    (from: string, text: string) => notifyMessage(from, text, true),
    [notifyMessage]
  );

  const notifyRoom = useCallback(
    (roomName: string, from: string, text: string) => {
      if (from === username) return;
      playSound();
      showBrowserNotification(`# ${roomName}`, `${from}: ${text || "New message"}`);
    },
    [username, playSound, showBrowserNotification]
  );

  const notifyCall = useCallback(
    (from: string, callType: "voice" | "video") => {
      if (from === username) return;
      playCallRing();
      showBrowserNotification(
        `📞 ${from}`,
        callType === "video" ? "Incoming video call" : "Incoming voice call"
      );
    },
    [username, playCallRing, showBrowserNotification]
  );

  const notifyInvite = useCallback(
    (roomName: string) => {
      playSound();
      showBrowserNotification(`# ${roomName}`, "You were added to the group");
    },
    [playSound, showBrowserNotification]
  );

  return {
    permission,
    notifyMessage,
    notifyDM,
    notifyRoom,
    notifyCall,
    notifyInvite,
  };
}