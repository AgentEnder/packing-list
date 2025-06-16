import Confetti from 'react-confetti-boom';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@packing-list/state';

interface ActiveBurst {
  id: number;
  source: { x: number; y: number; w: number; h: number } | null;
  startTime: number;
}

export function ConfettiBurst() {
  const { burstId, source } = useAppSelector((s) => s.ui.confetti);
  const [activeBursts, setActiveBursts] = useState<ActiveBurst[]>([]);

  useEffect(() => {
    if (!burstId) return;

    // Check if this burst ID already exists
    const existingBurst = activeBursts.find((burst) => burst.id === burstId);
    if (existingBurst) return;

    // Add new burst
    const newBurst: ActiveBurst = {
      id: burstId,
      source,
      startTime: Date.now(),
    };

    setActiveBursts((prev) => [...prev, newBurst]);

    // Remove after 3 seconds
    const timer = setTimeout(() => {
      setActiveBursts((prev) => prev.filter((burst) => burst.id !== burstId));
    }, 3000);

    return () => clearTimeout(timer);
  }, [burstId, source, activeBursts]);

  return (
    <>
      {activeBursts.map((burst) => {
        // Convert pixel coordinates to position ratios (0-1)
        const windowWidth =
          typeof window !== 'undefined' ? window.innerWidth : 1;
        const windowHeight =
          typeof window !== 'undefined' ? window.innerHeight : 1;

        const x = burst.source ? burst.source.x / windowWidth : 0.5;
        const y = burst.source ? burst.source.y / windowHeight : 0.5;

        return (
          <Confetti
            key={burst.id}
            mode="boom"
            x={x}
            y={y}
            particleCount={100}
            deg={270}
            colors={['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']}
          />
        );
      })}
    </>
  );
}
