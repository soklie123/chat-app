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
  audioUrl:       string;
  audioDuration?: number;
  fromSelf:       boolean;
}) {
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const sourceRef    = useRef<MediaElementAudioSourceNode | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const barsRef      = useRef<number[]>([]); // ← store static bar heights

  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(audioDuration);
  const [currentTime, setCurrentTime] = useState(0);


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
    const canvas   = canvasRef.current;
    if (!canvas) return;
    const w        = canvas.offsetWidth || 120;
    const barWidth = 3;
    const barGap   = 2;
    const count    = Math.floor(w / (barWidth + barGap));
    // Generate random heights and store them
    barsRef.current = Array.from({ length: count }, () =>
      0.15 + Math.random() * 0.6
    );
    drawBarsFromData(barsRef.current);
  };

  // Draw static bars after canvas is in DOM
  useEffect(() => {
    const timeout = setTimeout(() => generateStaticBars(), 50); // small delay ensures canvas is mounted
    return () => clearTimeout(timeout);
  }, []);

  // Redraw on resize
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (!playing && barsRef.current.length > 0) {
        drawBarsFromData(barsRef.current);
      }
    });
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, [playing]);

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

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }

    if (playing) {
      audio.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setPlaying(false);
      drawBarsFromData(barsRef.current); // restore static bars
    } else {
      await audioCtxRef.current.resume();
      await audio.play();
      setPlaying(true);
      animate();
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1 min-w-[180px] max-w-[220px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => {
        const audio = audioRef.current;
        if (audio) {
            setCurrentTime(audio.currentTime); // ← add this
            setProgress(audio.currentTime / (audio.duration || 1));
        }
        }}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio && isFinite(audio.duration)) setDuration(audio.duration);
        }}
        onEnded={() => {
            setPlaying(false);
            setProgress(0);
            setCurrentTime(0); // ← add this
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            drawBarsFromData(barsRef.current);
        }}
      />

      {/* Play/pause */}
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

      {/* Waveform + progress */}
      <div className="flex-1 flex flex-col gap-1">
        <canvas
          ref={canvasRef}
          height={32}
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

      {/* Duration */}
      <span className={`text-[10px] tabular-nums flex-shrink-0 ${
        fromSelf ? "text-[#4a7a3a]" : "text-slate-400"
      }`}>
        {formatTime(playing ? currentTime : duration)}
      </span>
    </div>
  );
}