import React from 'react';
import {AbsoluteFill} from 'remotion';
import data from './data.json';
import {C} from './ui';
import {Character, CharSpec} from './characters';
import {Coin3D} from './three';

/* YouTube thumbnail 1280x720. Spec in video.json "thumbnail":
 * {top: "BITCOIN", big: "−20 %", bottom: "WAS JETZT?", color: "red|green|orange|yellow", arrow: "down|up|none",
 *  character: {kind, mood}, coin: "₿"}
 * Rules: max ~5 words total, huge contrast, one emotion, one number.
 */
const col = (c?: string) => (c && (C as any)[c]) || c || C.red;

export const Thumbnail: React.FC = () => {
  const t: any = (data as any).thumbnail ?? {};
  const c = col(t.color ?? 'red');
  const ch: CharSpec = t.character ?? {kind: 'host', mood: 'shocked'};
  const big = String(t.big ?? '');
  const bigSize = Math.min(250, 1350 / Math.max(3, big.length));
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 70% 40%, ${c}55 0%, #0a1030 45%, #04060f 100%)`, fontFamily: 'Inter, sans-serif', overflow: 'hidden'}}>
      {/* rays */}
      <AbsoluteFill style={{background: `repeating-conic-gradient(from 0deg at 72% 45%, ${c}18 0deg 6deg, transparent 6deg 18deg)`}} />
      {/* grid floor */}
      <div style={{position: 'absolute', left: -400, right: -400, bottom: -260, height: 520, transform: 'perspective(600px) rotateX(62deg)', backgroundImage: `linear-gradient(${c}55 2px, transparent 2px), linear-gradient(90deg, ${c}55 2px, transparent 2px)`, backgroundSize: '80px 80px', opacity: 0.6}} />
      {t.coin !== false && (
        <Coin3D size={300} color={C.yellow} label={t.coin ?? '₿'} f={38} speed={1} tilt={14} style={{position: 'absolute', right: 300, top: 60, filter: `drop-shadow(0 0 50px ${C.yellow}88)`}} />
      )}
      {t.arrow !== 'none' && (
        <svg width={420} height={420} viewBox="0 0 100 100" style={{position: 'absolute', right: 360, top: 250, filter: `drop-shadow(0 0 30px ${c})`, transform: t.arrow === 'up' ? 'rotate(-35deg)' : 'rotate(35deg)'}}>
          <path d={t.arrow === 'up' ? 'M50 4 L92 50 L66 50 L66 96 L34 96 L34 50 L8 50 Z' : 'M50 96 L92 50 L66 50 L66 4 L34 4 L34 50 L8 50 Z'} fill={c} stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
        </svg>
      )}
      <div style={{position: 'absolute', right: -10, bottom: -30}}>
        <Character c={ch} f={20} height={700} />
      </div>
      {/* text block */}
      <div style={{position: 'absolute', left: 50, top: 50, width: 760}}>
        {t.top && (
          <div style={{display: 'inline-block', background: C.yellow, color: '#0a0f20', fontSize: 64, fontWeight: 900, padding: '4px 22px', borderRadius: 10, transform: 'rotate(-2deg)', boxShadow: '0 8px 0 rgba(0,0,0,0.4)'}}>
            {t.top}
          </div>
        )}
        <div style={{fontSize: bigSize, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: -6, marginTop: 18, WebkitTextStroke: `6px ${c}`, paintOrder: 'stroke fill', textShadow: `0 0 40px ${c}, 0 10px 0 rgba(0,0,0,0.5)`}}>
          {big}
        </div>
        {t.bottom && (
          <div style={{fontSize: 92, fontWeight: 900, color: c, lineHeight: 1, marginTop: 14, WebkitTextStroke: '4px #fff', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.6)'}}>
            {t.bottom}
          </div>
        )}
      </div>
      <div style={{position: 'absolute', left: 50, bottom: 36, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontWeight: 900, fontSize: 34, letterSpacing: 2}}>
        <div style={{width: 20, height: 20, borderRadius: 10, background: C.orange, boxShadow: `0 0 20px ${C.orange}`}} />
        FOXMONEY
      </div>
    </AbsoluteFill>
  );
};
