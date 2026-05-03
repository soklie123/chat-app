import { useEffect, useRef, useState } from 'react';

export function useNotifications(username: string) {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Request permission on mount
    useEffect(() => {
        if (!("Notification" in window)) return;
        setPermission(Notification.permission);
        if(Notification.permission === "default") {
            Notification.requestPermission().then((p) => setPermission(p));
        }
    }, []);
    // Play a soft ping sound using Web Audio API
    const playSound = () => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContext();
            }
            const ctx = audioCtxRef.current;

            // Create a pleasant two-tone ping
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
            playTone(880, now, 0.15, 0.3); // first ping
            playTone(660, now + 0.15, 0.2, 0.2); // second ping
        } catch (err) {
            console.warn("Audio Notification failed: ", err);
        }
    };
    // Show a browser notification
    const showBrowserNotification = (title: string, body: string, icon?: string) => {
        if (permission !== "granted") return;
        if (document.visibilityState === "visible") return; // Only when tab is hidden
        try {
            const notification = new Notification(title, {
                body,
                icon: icon ?? "/favicon.ico",
                badge: "/favicon.ico",
                silent: true, // We handle sound ourselves
            });

            // auto-close after 4 seconds
            setTimeout(() => notification.close(), 4000);

            // Focus tab when clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (err) {
            console.warn("Browser Notification failed: ", err);
        }
    };

    const notifyMessage = (from: string, text: string, isDM = false) => {
        if (from === username) return; // Don't notify for own messages

        playSound();

        const title = isDM ? `💬 ${from}` : `#${from}`;
        const body = text || (isDM ? "Sent you a message" : "New Message");
        showBrowserNotification(title, body);
    };
    const notifyDM = (from: string, text: string) => {
        notifyMessage(from, text, true);
    };

    return {
        permission,
        notifyMessage,
        notifyDM,

    }
}