import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  audioUrl,
  audioDuration = 0,
  fromSelf,
}: {
  audioUrl: string;
  audioDuration?: number;
  fromSelf: boolean;
}) {
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const sourceRef    = useRef<MediaElementAudioSourceNode | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const barsRef      = useRef<number[]>([]);
  const ctxInitialized = useRef(false); // ← guard against double-init

  const [playing,     setPlaying]     = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [duration,    setDuration]    = useState(audioDuration);
  const [currentTime, setCurrentTime] = useState(0);

  // ── Draw helpers ──────────────────────────────────────────────────────────

  const drawBarsFromData = (heights: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.offsetWidth || 120;
    canvas.width  = w;
    canvas.height = 32;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = 3;
    const barGap   = 2;
    const color    = fromSelf ? "#4ade80" : "#0088cc";

    heights.forEach((h, i) => {
      const height = Math.max(3, h * canvas.height);
      const x      = i * (barWidth + barGap);
      const y      = (canvas.height - height) / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, height, 2);
      ctx.fill();
    });
  };

  const generateStaticBars = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w        = canvas.offsetWidth || 120;
    const barWidth = 3;
    const barGap   = 2;
    const count    = Math.floor(w / (barWidth + barGap));
    barsRef.current = Array.from({ length: count }, () => 0.15 + Math.random() * 0.6);
    drawBarsFromData(barsRef.current);
  };

  useEffect(() => {
    const timeout = setTimeout(() => generateStaticBars(), 50);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (!playing && barsRef.current.length > 0) drawBarsFromData(barsRef.current);
    });
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, [playing]);

  // ── Live waveform animation ───────────────────────────────────────────────

  const animate = () => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = 3;
    const barGap   = 2;
    const barCount = Math.floor(canvas.width / (barWidth + barGap));
    const step     = Math.floor(bufferLength / barCount);
    const color    = fromSelf ? "#4ade80" : "#0088cc";

    for (let i = 0; i < barCount; i++) {
      const value  = dataArray[i * step] / 255;
      const height = Math.max(3, value * canvas.height);
      const x      = i * (barWidth + barGap);
      const y      = (canvas.height - height) / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, height, 2);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // ── Audio context — initialised once, lazily ─────────────────────────────

  const ensureAudioContext = () => {
    const audio = audioRef.current;
    if (!audio) return false;

    // Guard: only create once even under React StrictMode double-invoke
    if (ctxInitialized.current) return true;
    ctxInitialized.current = true;

    audioCtxRef.current = new AudioContext();
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioCtxRef.current.destination);

    return true;
  };

  // ── Play / Pause ──────────────────────────────────────────────────────────

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setPlaying(false);
      drawBarsFromData(barsRef.current);
      return;
    }

    // Init Web Audio on first play (requires user gesture)
    ensureAudioContext();

    try {
      // Must resume BEFORE play — some browsers need this
      await audioCtxRef.current!.resume();
      await audio.play();
      setPlaying(true);
      animate();
    } catch (err) {
      console.error("AudioPlayer play failed:", err);
    }
  };

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center gap-2 mt-1 min-w-[180px] max-w-[220px]">
      {/* crossOrigin is required for Web Audio API on cross-origin URLs */}
      <audio
        ref={audioRef}
        src={audioUrl}
        crossOrigin="anonymous"
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (!audio) return;
          setCurrentTime(audio.currentTime);
          setProgress(audio.currentTime / (audio.duration || 1));
        }}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio && isFinite(audio.duration)) setDuration(audio.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrentTime(0);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          drawBarsFromData(barsRef.current);
        }}
      />

      {/* Play / Pause button */}
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          fromSelf
            ? "bg-[#4ade80]/30 hover:bg-[#4ade80]/50 text-[#1c3906]"
            : "bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc]"
        }`}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Waveform canvas + progress bar */}
      <div className="flex-1 flex flex-col gap-1">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            const audio = audioRef.current;
            if (!audio) return;
            const rect  = (e.target as HTMLCanvasElement).getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            audio.currentTime = ratio * (audio.duration || 0);
          }}
        />
        <div className="w-full h-0.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              fromSelf ? "bg-[#4ade80]" : "bg-[#0088cc]"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Time display */}
      <span className={`text-[10px] tabular-nums flex-shrink-0 ${
        fromSelf ? "text-[#4a7a3a]" : "text-slate-400"
      }`}>
        {formatTime(playing ? currentTime : duration)}
      </span>
    </div>
  );
}