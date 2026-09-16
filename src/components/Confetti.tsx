"use client";

import { useEffect, useState } from "react";
import { COLOR_SOLID } from "@/lib/catalog";

const COLORS = Object.values(COLOR_SOLID);
const PIECE_COUNT = 140;
const LIFETIME_MS = 4200;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  color: string;
  rotate: number;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2.6 + Math.random() * 2,
    width: 6 + Math.random() * 7,
    height: 10 + Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotate: Math.random() * 360,
  }));
}

export function Confetti() {
  const [pieces] = useState<Piece[]>(makePieces);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), LIFETIME_MS);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti-fall absolute top-0 block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            rotate: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
