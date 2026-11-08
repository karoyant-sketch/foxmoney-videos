import React from 'react';
import {random} from 'remotion';
import {C} from './ui';

/* CSS-3D building blocks: real perspective, extrusion and lighting, rendered fast in headless Chrome. */

export const Coin3D: React.FC<{size: number; color: string; label: string; f: number; speed?: number; tilt?: number; style?: React.CSSProperties}> = ({
  size, color, label, f, speed = 3, tilt = 12, style,
}) => {
  const layers = 9;
  const depth = size * 0.12;
  const rot = (f * speed) % 360;
  return (
    <div style={{width: size, height: size, perspective: 900, ...style}}>
      <div style={{position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateX(${tilt}deg) rotateY(${rot}deg)`}}>
        {Array.from({length: layers}).map((_, k) => {
          const z = -depth / 2 + (depth * k) / (layers - 1);
          const face = k === 0 || k === layers - 1;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                transform: `translateZ(${z}px)${k === 0 ? ' rotateY(180deg)' : ''}`,
                background: face ? `radial-gradient(circle at 35% 30%, #fff9 0%, ${color} 38%, ${color}cc 100%)` : `${color}`,
                filter: face ? undefined : 'brightness(0.62)',
                border: face ? `${size * 0.05}px solid ${color}` : undefined,
                boxShadow: face ? `inset 0 0 ${size * 0.15}px rgba(0,0,0,0.35)` : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1200',
                fontWeight: 900,
                fontSize: size * 0.5,
                fontFamily: 'DejaVu Sans, sans-serif',
                backfaceVisibility: 'hidden',
              }}
            >
              {face ? label : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* Extruded 3D bar: front, right side and top faces. */
export const Bar3D: React.FC<{w: number; h: number; d?: number; color: string}> = ({w, h, d = 70, color}) => (
  <div style={{position: 'relative', width: w, height: h, transformStyle: 'preserve-3d'}}>
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${color}, ${color}aa)`, borderRadius: 6, boxShadow: `0 0 50px ${color}55`}} />
    <div style={{position: 'absolute', top: 0, left: w, width: d, height: h, background: color, filter: 'brightness(0.55)', transformOrigin: 'left center', transform: 'rotateY(90deg)'}} />
    <div style={{position: 'absolute', top: 0, left: 0, width: w, height: d, background: color, filter: 'brightness(1.35)', transformOrigin: 'top center', transform: 'rotateX(-90deg)'}} />
  </div>
);

/* Floating 3D background props (coins + cubes) at different depths – parallax layer. */
export const Floaters: React.FC<{f: number; seed: string; camX: number; camY: number}> = ({f, seed, camX, camY}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
    {Array.from({length: 14}).map((_, k) => {
      const depth = 0.15 + random(`${seed}z${k}`) * 0.35;
      const size = 40 + depth * 160;
      const x = ((random(`${seed}x${k}`) * 4000 - camX * depth) % 2400 + 2400) % 2400 - 240;
      const y = ((random(`${seed}y${k}`) * 3000 - camY * depth + Math.sin(f / 40 + k) * 30) % 1500 + 1500) % 1500 - 210;
      const kind = k % 3;
      const colr = [C.yellow, C.blue, C.orange][kind];
      return (
        <div key={k} style={{position: 'absolute', left: x, top: y, opacity: 0.12 + depth * 0.35, filter: `blur(${(0.5 - depth) * 6}px)`}}>
          {kind === 2 ? (
            <Cube size={size * 0.7} color={colr} f={f + k * 30} />
          ) : (
            <Coin3D size={size} color={colr} label={kind === 0 ? '₿' : 'Ξ'} f={f + k * 20} speed={1 + depth * 2} tilt={20} />
          )}
        </div>
      );
    })}
  </div>
);

export const Cube: React.FC<{size: number; color: string; f: number}> = ({size, color, f}) => {
  const s = size;
  const face = (t: string, b: number) => (
    <div style={{position: 'absolute', width: s, height: s, background: color, filter: `brightness(${b})`, border: `2px solid ${color}`, transform: t, opacity: 0.9}} />
  );
  return (
    <div style={{width: s, height: s, perspective: 800}}>
      <div style={{position: 'relative', width: s, height: s, transformStyle: 'preserve-3d', transform: `rotateX(${f * 0.8}deg) rotateY(${f * 1.2}deg)`}}>
        {face(`translateZ(${s / 2}px)`, 1)}
        {face(`rotateY(180deg) translateZ(${s / 2}px)`, 0.6)}
        {face(`rotateY(90deg) translateZ(${s / 2}px)`, 0.75)}
        {face(`rotateY(-90deg) translateZ(${s / 2}px)`, 0.75)}
        {face(`rotateX(90deg) translateZ(${s / 2}px)`, 1.2)}
        {face(`rotateX(-90deg) translateZ(${s / 2}px)`, 0.5)}
      </div>
    </div>
  );
};
