import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  bgMusicUrl: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek?: (time: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioBuffer, 
  bgMusicUrl,
  isPlaying, 
  onPlayPause 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const bgSourceNodeRef = useRef<HTMLAudioElement | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const animationRef = useRef<number>();
  const [volume, setVolume] = useState(1.0);

  // Initialize Context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Update duration when buffer changes
  useEffect(() => {
    if (audioBuffer) {
      setDuration(audioBuffer.duration);
      pausedTimeRef.current = 0;
      setCurrentTime(0);
    }
  }, [audioBuffer]);

  // Background Music Handling
  useEffect(() => {
    if (bgMusicUrl) {
      const bgAudio = new Audio(bgMusicUrl);
      bgAudio.loop = true;
      bgAudio.volume = 0.2; // Default lower volume for background
      bgSourceNodeRef.current = bgAudio;
    }
    return () => {
      if (bgSourceNodeRef.current) {
        bgSourceNodeRef.current.pause();
        bgSourceNodeRef.current = null;
      }
    }
  }, [bgMusicUrl]);

  // Play/Pause Logic
  useEffect(() => {
    if (!audioBuffer || !audioContextRef.current || !gainNodeRef.current) return;

    if (isPlaying) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      source.onended = () => {
        // Only stop if we reached end naturally (not paused)
        // Simple check: if currentTime >= duration
      };

      const startOffset = pausedTimeRef.current;
      startTimeRef.current = audioContextRef.current.currentTime - startOffset;
      
      source.start(0, startOffset);
      sourceNodeRef.current = source;

      // Start BG Music
      if (bgSourceNodeRef.current) {
        bgSourceNodeRef.current.play().catch(e => console.warn("BG play failed", e));
      }

      // Animation Loop
      const draw = () => {
        if (!audioContextRef.current) return;
        const now = audioContextRef.current.currentTime;
        const curr = now - startTimeRef.current;
        
        if (curr >= duration) {
          onPlayPause(); // Auto stop
          pausedTimeRef.current = 0;
          setCurrentTime(duration);
        } else {
          setCurrentTime(curr);
          animationRef.current = requestAnimationFrame(draw);
        }
      };
      draw();

    } else {
      // Stop
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) { /* ignore */ }
        sourceNodeRef.current = null;
      }
      if (bgSourceNodeRef.current) {
        bgSourceNodeRef.current.pause();
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      
      // Save position
      if (audioContextRef.current) {
        pausedTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, audioBuffer]);

  // Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0); // Mono visual
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0ea5e9'; // robo-500
    
    // Draw Waveform
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
    
    // Draw Progress Overlay
    if (duration > 0) {
      const progressWidth = (currentTime / duration) * width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, progressWidth, height);
      ctx.fillStyle = '#00f3ff'; // neon cyan cursor
      ctx.fillRect(progressWidth, 0, 2, height);
    }

  }, [audioBuffer, currentTime, duration]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2 text-xs text-robo-300 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      <div className="relative h-16 bg-gray-950 rounded-lg overflow-hidden border border-gray-800 mb-4">
        <canvas ref={canvasRef} width={600} height={64} className="w-full h-full" />
        {!audioBuffer && <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">No Audio Generated</div>}
      </div>

      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <button 
             onClick={onPlayPause}
             disabled={!audioBuffer}
             className="w-12 h-12 flex items-center justify-center rounded-full bg-robo-600 hover:bg-robo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(14,165,233,0.3)]"
           >
             {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
           </button>
           <div className="flex flex-col text-xs text-gray-400">
              <span className="font-bold text-white uppercase tracking-wider">Master Output</span>
              <span>{bgMusicUrl ? '+ Background Music' : 'Voice Only'}</span>
           </div>
         </div>

         <div className="flex items-center gap-2">
           <Volume2 size={16} className="text-gray-400" />
           <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (gainNodeRef.current) gainNodeRef.current.gain.value = v;
              }}
              className="w-24 accent-robo-500"
           />
         </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
