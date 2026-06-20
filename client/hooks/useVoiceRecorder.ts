import { useRef, useState } from "react";

export default function useVoiceRecorder(
  onRecorded: (blob: Blob, duration: number) => void
) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const [recording, setRecording] = useState(false);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });

        const duration = (Date.now() - startTimeRef.current) / 1000;

        stream.getTracks().forEach((track) => track.stop());

        onRecorded(blob, duration);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error(error);
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  const stop = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return {
    recording,
    start,
    stop,
  };
}