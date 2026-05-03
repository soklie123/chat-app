import { useRef, useState } from "react";

export function useVoiceRecorder(onRecorded: (blob:Blob, duration: number) => void) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const [recording, setRecording] = useState(false);

    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm": "audio/ogg",
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            startTimeRef.current = Date.now();

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = () => {
                const duration = (Date.now() - startTimeRef.current) / 1000;
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

                // Stop all tracks
                stream.getTracks().forEach((t) => t.stop());
                onRecorded(blob, duration);
            };
            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            alert("Microphone access denied. Please allow microphone access.");
        }
    };
    const stop = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    return { recording, start, stop };
}