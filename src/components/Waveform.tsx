import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  isActive: boolean;
}

export default function Waveform({ isActive }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const numBars = 30;
      const barWidth = canvas.width / numBars;
      const centerY = canvas.height / 2;

      for (let i = 0; i < numBars; i++) {
        // Generate a smooth wave pattern
        const x = i * barWidth;
        const amplitude = isActive ? (Math.sin(time + i * 0.5) * 0.5 + 0.5) * 20 + 5 : 2;
        
        ctx.fillStyle = isActive ? '#10b981' : '#3f3f46'; // emerald-500 or zinc-700
        ctx.beginPath();
        ctx.roundRect(x + 2, centerY - amplitude / 2, barWidth - 4, amplitude, 4);
        ctx.fill();
      }

      time += 0.1;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className="w-full max-w-[200px] h-[60px]"
    />
  );
}
