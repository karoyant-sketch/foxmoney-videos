import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, random, staticFile, useCurrentFrame} from 'remotion';
import data from './data.json';
import {renderScene, SceneSpec} from './scenes';
import {C, sp} from './ui';
import {Character, CharSpec} from './characters';
import {Floaters} from './three';

const W = 1920;
const H = 1080;
const TRANS = 22; // frames of camera flight between scenes
const ease = Easing.bezier(0.65, 0, 0.35, 1);

type Timed = SceneSpec & {start: number; dur: number};
const scenes = data.scenes as Timed[];
const seed = String((data as any).seed ?? 'fox');

// Every video gets its own random path through the world, so the camera
// always flies somewhere new between scenes.
const POS = scenes.map((_, i) => {
  if (i === 0) return {x: 0, y: 0, r: 0};
  return null as any;
});
for (let i = 1; i < scenes.length; i++) {
  const prev = POS[i - 1];
  const ang = (random(`${seed}a${i}`) - 0.5) * Math.PI * 1.3 + (i % 2 ? 0.3 : -0.3);
  const dist = 2500 + random(`${seed}d${i}`) * 900;
  POS[i] = {
    x: prev.x + Math.cos(ang) * dist,
    y: prev.y + Math.abs(Math.sin(ang)) * dist * 0.8 + 900,
    r: Math.round((random(`${seed}r${i}`) - 0.5) * 12),
  };
}

function drift(i: number, local: number) {
  const p = POS[i];
  const t = local / 30;
  return {
    x: p.x + Math.sin(t * 0.6 + i) * 40 + Math.min(local, 300) * 0.12 - 18,
    y: p.y + Math.cos(t * 0.5 + i) * 25,
    s: 1 + Math.min(local, 400) * 0.0002,
    r: p.r + Math.sin(t * 0.4 + i) * 0.8,
  };
}

function camAt(frame: number) {
  let i = 0;
  for (let k = 0; k < scenes.length; k++) if (frame >= scenes[k].start) i = k;
  const local = frame - scenes[i].start;
  let cur = drift(i, local);
  let tilt = 0;
  if (i > 0 && local < TRANS) {
    tilt = Math.sin((local / TRANS) * Math.PI);
    const prev = drift(i - 1, scenes[i].start - scenes[i - 1].start + local);
    const e = ease(local / TRANS);
    const dip = Math.sin((local / TRANS) * Math.PI);
    cur = {
      x: prev.x + (cur.x - prev.x) * e,
      y: prev.y + (cur.y - prev.y) * e,
      s: (prev.s + (cur.s - prev.s) * e) * (1 - 0.52 * dip),
      r: prev.r + (cur.r - prev.r) * e,
    };
  }
  return {cam: cur, i, tilt, local};
}

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const {cam, i, tilt, local} = camAt(frame);
  const dir = i % 2 ? 1 : -1;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 20%, #142048 0%, ${C.bg} 60%)`, fontFamily: 'Inter, sans-serif', overflow: 'hidden', perspective: 2200}}>
      <Floaters f={frame} seed={seed} camX={cam.x} camY={cam.y} />
      <AbsoluteFill
        style={{
          transformOrigin: '0 0',
          transform: `translate(${W / 2}px, ${H / 2}px) rotateX(${tilt * 16}deg) rotateY(${dir * tilt * 12}deg) scale(${cam.s}) rotate(${-cam.r}deg) translate(${-cam.x - W / 2}px, ${-cam.y - H / 2}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: Math.min(...POS.map((p) => p.x)) - 6000,
            top: Math.min(...POS.map((p) => p.y)) - 4000,
            width: Math.max(...POS.map((p) => p.x)) - Math.min(...POS.map((p) => p.x)) + 14000,
            height: Math.max(...POS.map((p) => p.y)) - Math.min(...POS.map((p) => p.y)) + 10000,
            backgroundImage: `linear-gradient(${C.grid} 2px, transparent 2px), linear-gradient(90deg, ${C.grid} 2px, transparent 2px)`,
            backgroundSize: '120px 120px',
          }}
        />
        {scenes.map((s, k) => {
          if (Math.abs(k - i) > 1) return null;
          const p = POS[k];
          return (
            <div key={k} style={{position: 'absolute', left: p.x, top: p.y, width: W, height: H, transform: `rotate(${p.r}deg)`}}>
              <SceneWithCharacter s={s} f={frame - s.start} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)'}} />
      <div style={{position: 'absolute', left: 48, top: 40, display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontWeight: 900, fontSize: 30, letterSpacing: 2}}>
        <div style={{width: 18, height: 18, borderRadius: 9, background: C.orange, boxShadow: `0 0 20px ${C.orange}`}} />
        FOXMONEY
      </div>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 8, width: '100%', background: 'rgba(255,255,255,0.08)'}}>
        <div style={{height: '100%', width: `${(frame / data.total) * 100}%`, background: C.orange}} />
      </div>
      <Captions s={scenes[i]} local={local} />
      <Audio src={staticFile('voice.wav')} />
      {scenes.slice(1).map((s, k) => (
        <Sequence key={k} from={Math.max(0, s.start - 6)} durationInFrames={40}>
          <Audio src={staticFile('whoosh.wav')} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const LEAD_F = 15;
const defaultChar = (s: Timed): CharSpec | null => {
  if (s.character === false) return null;
  if (s.character) return s.character as CharSpec;
  if (s.type === 'hook') return {kind: 'host', mood: 'shocked', side: 'right'};
  if (s.type === 'outro') return {kind: 'host', mood: 'happy', side: 'left'};
  return null;
};

const SceneWithCharacter: React.FC<{s: Timed; f: number}> = ({s, f}) => {
  const ch = defaultChar(s);
  const speech = (s as any).speech ?? s.dur / 30;
  if (!ch) return renderScene(s, f, s.dur);
  const side = ch.side ?? 'right';
  const talking = ch.kind === 'host' && f > LEAD_F && f < LEAD_F + speech * 30;
  const inn = sp(f, 18, 13);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, transform: 'scale(0.8)', transformOrigin: side === 'right' ? '0% 50%' : '100% 50%'}}>
        {renderScene(s, f, s.dur)}
      </div>
      <div style={{position: 'absolute', bottom: 30, [side]: 40, transform: `translateX(${(1 - inn) * (side === 'right' ? 500 : -500)}px)`}}>
        {ch.say && (
          <div style={{position: 'absolute', bottom: 520, [side]: 60, width: 340, background: '#fff', color: '#0a0f20', fontSize: 30, fontWeight: 800, padding: '16px 22px', borderRadius: 24, opacity: sp(f, 40), boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
            {ch.say}
          </div>
        )}
        <Character c={ch} f={f} talking={talking} height={500} />
      </div>
    </>
  );
};

function chunks(text: string): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const out: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    const end = /[.!?:;]$/.test(w) || (/,$/.test(w) && cur.length >= 4);
    if (cur.length >= 7 || end) {
      out.push(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length) out.push(cur.join(' '));
  return out;
}

const Captions: React.FC<{s: Timed; local: number}> = ({s, local}) => {
  if (!s.voice || (data as any).captions === false) return null;
  const speech = ((s as any).speech ?? s.dur / 30) * 30;
  const t = local - LEAD_F;
  if (t < 0 || t > speech + 6) return null;
  const parts = chunks(s.voice);
  const total = parts.reduce((a, p) => a + p.length, 0);
  let acc = 0;
  let idx = parts.length - 1;
  for (let k = 0; k < parts.length; k++) {
    acc += parts[k].length;
    if (t < (acc / total) * speech) {
      idx = k;
      break;
    }
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center'}}>
      <div style={{maxWidth: 1300, background: 'rgba(5,8,20,0.72)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 42, fontWeight: 800, padding: '12px 28px', borderRadius: 14, textAlign: 'center', backdropFilter: 'blur(6px)'}}>
        {parts[idx]}
      </div>
    </div>
  );
};
