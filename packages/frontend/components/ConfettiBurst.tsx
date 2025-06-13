import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@packing-list/state';

export function ConfettiBurst() {
  const { burstId, source } = useAppSelector((s) => s.ui.confetti);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateSize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!burstId) return;
    if (burstId !== activeId) {
      setActiveId(burstId);
      const timer = setTimeout(() => setActiveId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [burstId, activeId]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (activeId === null || prefersReducedMotion) return null;

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      numberOfPieces={150}
      recycle={false}
      confettiSource={source ?? undefined}
    />
  );
}
