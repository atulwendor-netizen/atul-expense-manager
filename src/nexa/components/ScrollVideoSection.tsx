import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Film,
  Radio,
  Cpu,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ScrollVideoSectionProps {
  reducedMotion?: boolean;
}

export const ScrollVideoSection: React.FC<ScrollVideoSectionProps> = ({
  reducedMotion = false,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isScrollControlled, setIsScrollControlled] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Royalty-free futuristic technology / network motion loop (open CDN)
  const videoSrc =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4';

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section || reducedMotion) return;

    // Wait until video metadata is loaded so duration is available
    const handleLoadedMetadata = () => {
      const duration = video.duration || 10;

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onUpdate: (self) => {
          if (isScrollControlled && !isPlaying) {
            const scrubTime = self.progress * duration;
            if (isFinite(scrubTime)) {
              video.currentTime = scrubTime;
              setProgress(self.progress);
            }
          }
        },
      });

      return () => trigger.kill();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Fallback if metadata was already loaded
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      ScrollTrigger.getAll()
        .filter((t) => t.trigger === section)
        .forEach((t) => t.kill());
    };
  }, [reducedMotion, isScrollControlled, isPlaying]);

  // Canvas procedural simulation fallback or visual overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoError) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.02;
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw glowing sine curves representing cognitive flow
      const numLines = 5;
      for (let l = 0; l < numLines; l++) {
        ctx.beginPath();
        const hue = 210 + l * 25;
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, 0.8)`;
        ctx.lineWidth = 2.5;

        for (let x = 0; x < canvas.width; x += 8) {
          const y =
            canvas.height / 2 +
            Math.sin(x * 0.008 + t + l * 0.4) * 80 +
            Math.cos(x * 0.004 - t * 0.5) * 40;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 450;
    render();

    return () => cancelAnimationFrame(animId);
  }, [videoError]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setIsScrollControlled(true);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
      setIsScrollControlled(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && isPlaying) {
      setProgress(video.currentTime / video.duration);
    }
  };

  const handleManualScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    const video = videoRef.current;
    if (video && isFinite(video.duration)) {
      video.currentTime = val * video.duration;
    }
  };

  return (
    <section
      id="video"
      ref={sectionRef}
      className="relative min-h-[160vh] sm:min-h-[200vh] py-20 bg-[#02040a] overflow-hidden"
    >
      {/* Background radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Sticky Presentation Frame */}
      <div className="sticky top-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-blue-500/30 text-blue-300 text-xs font-mono mb-3">
            <Film className="h-3.5 w-3.5 text-cyan-400" />
            <span>CINEMATIC SCROLL PLAYBACK</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Observe the Cognitive Engine in Real-Time Motion
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 font-normal">
            Scroll down to advance video frames progressively, or press play for continuous autonomous playback.
          </p>
        </div>

        {/* Video HUD Container */}
        <div className="relative rounded-3xl glass-panel border border-white/15 p-2 sm:p-4 shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden group">
          {/* Ambient Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-violet-600/15 pointer-events-none" />

          {/* Top HUD Telemetry Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur-md rounded-2xl mb-2 text-[11px] font-mono border border-white/5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                CAM_STREAM_4K // LIVE
              </span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">FPS: 60.0 • HDR10</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-violet-400">
                Mode: {isScrollControlled && !isPlaying ? 'Scroll-Linked' : 'Continuous Play'}
              </span>
              <span className="text-emerald-400 font-bold">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          {/* Media Player Viewport */}
          <div className="relative w-full aspect-video rounded-2xl bg-black overflow-hidden flex items-center justify-center">
            {!videoError ? (
              <video
                ref={videoRef}
                src={videoSrc}
                muted={isMuted}
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
            )}

            {/* Center Floating Play / Pause Overlay */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="absolute flex items-center justify-center h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group/btn"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 text-white" />
              ) : (
                <Play className="h-7 w-7 text-cyan-400 ml-1 group-hover/btn:text-white transition-colors" />
              )}
            </button>

            {/* Corner Futuristic Hologram Overlay */}
            <div className="absolute top-4 left-4 p-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md font-mono text-[10px] text-slate-300 hidden sm:block pointer-events-none">
              <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                NEURAL ORCHESTRATOR
              </div>
              <div className="text-slate-400 mt-0.5">Packet stream: 48.2 GB/s</div>
            </div>
          </div>

          {/* Bottom Interactive Controls */}
          <div className="mt-3 px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Play/Pause & Audio */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={togglePlayPause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Stream'}</span>
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsScrollControlled(true);
                  if (isPlaying && videoRef.current) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                  isScrollControlled && !isPlaying
                    ? 'bg-blue-600/30 text-cyan-300 border border-blue-500/30'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Sync with Scroll
              </button>
            </div>

            {/* Interactive Timeline Scrubber Slider */}
            <div className="flex items-center gap-3 w-full sm:flex-1 max-w-md">
              <span className="text-[10px] font-mono text-slate-500">00:00</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={handleManualScrub}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-cyan-400 transition-all"
                aria-label="Video scrubber timeline"
              />
              <span className="text-[10px] font-mono text-slate-400">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
