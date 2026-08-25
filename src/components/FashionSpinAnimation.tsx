'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export const FASHION_ANIMATION_FRAMES = [
  '/an1.png',
  '/an2.png',
  '/an3.png',
  '/an4.png',
  '/an5.png',
  '/an6.png',
] as const;

type Props = {
  className?: string;
  /** ms per frame — lower = faster spin */
  intervalMs?: number;
  autoplay?: boolean;
  showGlow?: boolean;
  priority?: boolean;
};

export default function FashionSpinAnimation({
  className = '',
  intervalMs = 160,
  autoplay = true,
  showGlow = true,
  priority = false,
}: Props) {
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!autoplay || paused) return;
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % FASHION_ANIMATION_FRAMES.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoplay, paused, intervalMs]);

  return (
    <div
      className={`relative select-none ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      role="img"
      aria-label="Pangolin outfit 360 degree view animation"
    >
      {showGlow && (
        <div className="absolute inset-[8%] rounded-full bg-vbrown-gold/15 blur-3xl animate-pulse pointer-events-none" />
      )}

      <div className="relative aspect-[3/4] w-full max-w-md mx-auto">
        <Image
          key={frame}
          src={FASHION_ANIMATION_FRAMES[frame]}
          alt="Pangolin fashion look"
          fill
          priority={priority && frame === 0}
          sizes="(max-width: 768px) 80vw, 420px"
          className="object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
        />
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {FASHION_ANIMATION_FRAMES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show angle ${i + 1}`}
            onClick={() => setFrame(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === frame ? 'w-6 bg-vbrown-gold' : 'w-1.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
