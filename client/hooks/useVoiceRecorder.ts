<<<<<<< HEAD
import { useEffect, useRef, useState } from "react";

export default function useVoiceRecorder(
  onRecorded: (blob: Blob, duration: number) => void,
  waveCanvasRef?: React.RefObject<HTMLCanvasElement | null>,
  scrollCanvasRef?: React.RefObject<HTMLCanvasElement | null>
=======
import { useRef, useState } from "react";

export default function useVoiceRecorder(
  onRecorded: (blob: Blob, duration: number) => void
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
<<<<<<< HEAD
  const cancelledRef = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scrollBufferRef = useRef<number[]>([]); // amplitude history

  const [recording, setRecording] = useState(false);

  const stopWaveform = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    scrollBufferRef.current = []; // clear history
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;

    const canvas = waveCanvasRef?.current;
    if (canvas) {
      const c = canvas.getContext("2d");
      if (c) c.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  useEffect(() => {
    return () => {
      stopWaveform();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startWaveform = (stream: MediaStream) => {
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const BAR_W = 3;
    const GAP = 2.5;
    const STEP = BAR_W + GAP;
    const LIVE_COUNT = 6; // rightmost bars that animate live

    const recorded: number[] = []; // already-recorded bars, static + dimmed
    let frameCount = 0;

    const drawBar = (
      ctx: CanvasRenderingContext2D,
      x: number,
      amp: number,
      H: number,
      alpha: number
    ) => {
      const centerY = H / 2;
      const halfH = 2 + amp * (centerY - 5);
      const intensity = Math.min(amp * 1.5, 1);
      const r = Math.round(82  + intensity * 80);
      const g = Math.round(136 + intensity * 50);
      const b = Math.round(193 + intensity * 62);

      // top
      ctx.fillStyle = `rgba(${r},${g},${b},${(0.45 + intensity * 0.55) * alpha})`;
      ctx.beginPath();
      ctx.roundRect(x, centerY - halfH, BAR_W, halfH, [2, 2, 0, 0]);
      ctx.fill();

      // bottom mirror
      ctx.fillStyle = `rgba(${r},${g},${b},${0.25 * alpha})`;
      ctx.beginPath();
      ctx.roundRect(x, centerY + 1, BAR_W, halfH * 0.5, [0, 0, 2, 2]);
      ctx.fill();
    };

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      const canvas = waveCanvasRef?.current;
      if (!canvas || !analyserRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // get current amplitude
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const amp = Math.max((sum / bufferLength / 255) * 2.5, 0.05);

      ctx.clearRect(0, 0, targetW, targetH);
      ctx.save();
      ctx.scale(dpr, dpr);

      const W = rect.width;
      const H = rect.height;
      const totalBars = Math.floor(W / STEP);
      const recordedCount = totalBars - LIVE_COUNT;

      // push to recorded buffer every 2 frames
      frameCount++;
      if (frameCount % 2 === 0) {
        recorded.push(amp);
        if (recorded.length > recordedCount) recorded.shift();
      }

      const startX = W - totalBars * STEP;

      // ── Left: recorded bars (dimmed, static) ──
      for (let i = 0; i < recorded.length; i++) {
        drawBar(ctx, startX + i * STEP, recorded[i], H, 0.4);
      }

      // ── Right: live animated bars ──
      const liveStartX = startX + recorded.length * STEP;
      const now = Date.now();
      for (let i = 0; i < LIVE_COUNT; i++) {
        const liveAmp = Math.max(
          amp * (0.6 + 0.4 * Math.sin(now / 80 + i * 0.9)),
          0.05
        );
        drawBar(ctx, liveStartX + i * STEP, liveAmp, H, 1.0);
      }

      // ── Playhead: thin white line between recorded and live ──
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(liveStartX - 1.5, 4, 1.5, H - 8);

      ctx.restore();
    };

    draw();
  };
  
  const start = async () => {
    try {
      cancelledRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
=======

  const [recording, setRecording] = useState(false);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

<<<<<<< HEAD
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
=======
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

<<<<<<< HEAD
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const duration = (Date.now() - startTimeRef.current) / 1000;
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (!cancelledRef.current) {
          onRecorded(blob, duration);
        }
      };

      mediaRecorder.start(100); // collect data every 100ms
      setRecording(true);

      // small delay so canvas is rendered and has a measurable size
      setTimeout(() => startWaveform(stream), 80);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied.");
=======
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
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
    }
  };

  const stop = () => {
<<<<<<< HEAD
    stopWaveform();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    if (
      mediaRecorderRef.current && 
      mediaRecorderRef.current.state !== "inactive") 
    {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
  };

  const cancel = () => {
    cancelledRef.current = true;
    stop();
  };

  return { recording, start, stop, cancel };
=======
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
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
}