import React from 'react';
import {interpolate, spring, Easing} from 'remotion';

export const C = {
  bg: '#070b18',
  grid: 'rgba(90,120,255,0.07)',
  panel: 'rgba(20,28,56,0.85)',
  stroke: 'rgba(120,150,255,0.25)',
  orange: '#ff8a1f',
  red: '#ff3b4e',
  green: '#22e39a',
  blue: '#4d8bff',
  yellow: '#ffd23f',
  text: '#ffffff',
  dim: '#9aa6c8',
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const sp = (f: number, delay = 0, damping = 14) =>
  spring({frame: f - delay, fps: 30, config: {damping, mass: 0.8}});

export const fadeUp = (f: number, delay = 0): React.CSSProperties => {
  const s = sp(f, delay);
  return {opacity: interpolate(s, [0, 1], [0, 1]), transform: `translateY(${(1 - s) * 60}px)`};
};

export const pop = (f: number, delay = 0): React.CSSProperties => {
  const s = sp(f, delay, 11);
  return {opacity: Math.min(1, s * 2), transform: `scale(${0.4 + s * 0.6})`};
};

export const countUp = (f: number, from: number, to: number, delay = 0, len = 40) =>
  interpolate(f, [delay, delay + len], [from, to], {...clamp, easing: Easing.out(Easing.cubic)});

export const de = (n: number, d = 0) =>
  n.toLocaleString('de-DE', {minimumFractionDigits: d, maximumFractionDigits: d});

export const Panel: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; glow?: string}> = ({
  style,
  children,
  glow,
}) => (
  <div
    style={{
      background: C.panel,
      border: `2px solid ${glow ?? C.stroke}`,
      borderRadius: 28,
      boxShadow: glow ? `0 0 60px ${glow}55, inset 0 0 40px ${glow}22` : '0 20px 60px rgba(0,0,0,0.5)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Kicker: React.FC<{f: number; children: React.ReactNode; color?: string; delay?: number}> = ({
  f,
  children,
  color = C.orange,
  delay = 0,
}) => (
  <div
    style={{
      ...fadeUp(f, delay),
      color,
      fontSize: 34,
      fontWeight: 900,
      letterSpacing: 6,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{f: number; children: React.ReactNode; delay?: number; size?: number}> = ({
  f,
  children,
  delay = 4,
  size = 92,
}) => (
  <div style={{...fadeUp(f, delay), color: C.text, fontSize: size, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, whiteSpace: 'pre-line'}}>
    {children}
  </div>
);

export const Coin: React.FC<{size: number; color: string; label: string; style?: React.CSSProperties}> = ({
  size,
  color,
  label,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `radial-gradient(circle at 35% 30%, #fff8 0%, ${color} 35%, ${color}aa 100%)`,
      border: `${size * 0.06}px solid ${color}`,
      boxShadow: `0 0 ${size * 0.4}px ${color}88`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#1a1200',
      fontWeight: 900,
      fontSize: size * 0.5,
      fontFamily: 'DejaVu Sans, sans-serif',
      ...style,
    }}
  >
    {label}
  </div>
);
