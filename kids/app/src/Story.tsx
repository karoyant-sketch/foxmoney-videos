import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Loop, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from './data.json';

const FPS = 30;
const TRANS = 16; // frames of cross-zoom between scenes
const FONT = 'Fredoka, sans-serif';

type Line = {who: string; text: string; s: number; e: number};
type Scene = {
  start: number;
  dur: number;
  kind: 'story' | 'song';
  image: string;
  images?: string[];
  clip?: string | null;
  clipFrames?: number;
  clips?: string[];
  clipsFrames?: number[];
  camera?: string;
  title?: string | null;
  outro?: boolean;
  bpm?: number;
  lines: Line[];
  lyrics?: Line[];
};
type Char = {name: string; color: string; crop?: {cx: number; cy: number; size: number} | null};

const D = data as any;
const scenes: Scene[] = D.scenes;
const chars: Record<string, Char> = D.chars || {};
const amp: string = D.amp || '';
const sheetAspect: number = D.sheetAspect || 16 / 9;
const sheet: string | null = D.sheet || null;

const ampAt = (f: number) => {
  const c = amp.charCodeAt(Math.max(0, Math.min(amp.length - 1, f)));
  return Number.isFinite(c) ? Math.max(0, (c - 48) / 9) : 0;
};

function kenBurns(camera: string | undefined, p: number) {
  const e = Easing.inOut(Easing.sin)(Math.max(0, Math.min(1, p)));
  switch (camera) {
    case 'zoom_out':
      return {s: 1.26 - 0.18 * e, x: 0, y: 0};
    case 'pan_left':
      return {s: 1.2, x: 4 - 8 * e, y: 0};
    case 'pan_right':
      return {s: 1.2, x: -4 + 8 * e, y: 0};
    case 'pan_up':
      return {s: 1.2, x: 0, y: 3.5 - 7 * e};
    case 'pan_down':
      return {s: 1.2, x: 0, y: -3.5 + 7 * e};
    case 'zoom_in':
    default:
      return {s: 1.06 + 0.18 * e, x: 0, y: 0};
  }
}

const Picture: React.FC<{src: string; camera?: string; p: number; bounce: number; sway: number}> = ({src, camera, p, bounce, sway}) => {
  const k = kenBurns(camera, p);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(${k.x}%, ${k.y}%) scale(${k.s * (1 + bounce)}) rotate(${sway}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const ClipFill: React.FC<{src: string; frames: number; total: number; fade: boolean}> = ({src, frames, total, fade}) => {
  const f = useCurrentFrame();
  const rate = Math.max(0.7, Math.min(1, frames / total));
  const op = fade ? interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  const video = <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  return (
    <AbsoluteFill style={{opacity: op, transform: `scale(${1.02 + 0.03 * (f / total)})`}}>
      {frames / rate >= total ? video : <Loop durationInFrames={Math.max(30, Math.floor(frames / rate))}>{video}</Loop>}
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{sc: Scene; i: number}> = ({sc, i}) => {
  const f = useCurrentFrame(); // local, starts TRANS frames before sc.start (except first)
  const lead = i === 0 ? 0 : TRANS;
  const local = f - lead;
  const total = sc.dur + lead;
  const p = (f) / total;
  const fadeIn = i === 0 ? 1 : interpolate(f, [0, TRANS], [0, 1], {extrapolateRight: 'clamp'});
  const pop = i === 0 ? 1 : interpolate(f, [0, TRANS], [1.08, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const t = local / FPS;
  const sway = Math.sin(t * 0.7 + i) * 0.35;

  let content: React.ReactNode;
  if (sc.kind === 'song' && sc.clips && sc.clips.length) {
    const n = sc.clips.length;
    const per = Math.ceil(total / n);
    content = (
      <>
        {sc.clips.map((c, k) => {
          const cf = (sc.clipsFrames || [])[k] || 150;
          const len = per + (k < n - 1 ? 12 : 0);
          return (
            <Sequence key={k} from={k * per} durationInFrames={len}>
              <ClipFill src={c} frames={cf} total={len} fade={k > 0} />
            </Sequence>
          );
        })}
      </>
    );
  } else if (sc.kind === 'song') {
    const bpm = sc.bpm || 110;
    const beat = (Math.max(0, local) / FPS) * (bpm / 60);
    const bounce = 0.018 * Math.pow(Math.max(0, Math.cos(beat * Math.PI * 2)), 6);
    const imgs = sc.images && sc.images.length ? sc.images : [sc.image];
    const per = Math.max(60, Math.round((FPS * 60 * 8) / bpm)); // 8 beats per picture
    const idx = Math.floor(Math.max(0, local) / per) % imgs.length;
    const within = (Math.max(0, local) % per) / per;
    const prevIdx = (idx - 1 + imgs.length) % imgs.length;
    const xf = local >= per ? interpolate(Math.max(0, local) % per, [0, 12], [0, 1], {extrapolateRight: 'clamp'}) : 1;
    const cams = ['zoom_in', 'pan_right', 'zoom_out', 'pan_left', 'pan_up'];
    content = (
      <>
        {xf < 1 && <Picture src={imgs[prevIdx]} camera={cams[prevIdx % cams.length]} p={1} bounce={bounce} sway={sway} />}
        <AbsoluteFill style={{opacity: xf}}>
          <Picture src={imgs[idx]} camera={cams[idx % cams.length]} p={within} bounce={bounce} sway={sway} />
        </AbsoluteFill>
      </>
    );
  } else if (sc.clip) {
    content = <ClipFill src={sc.clip} frames={sc.clipFrames || 150} total={total} fade={false} />;
  } else {
    content = <Picture src={sc.image} camera={sc.camera} p={p} bounce={0} sway={sway} />;
  }

  return (
    <AbsoluteFill style={{opacity: fadeIn, transform: `scale(${pop})`}}>
      {content}
      {sc.title && <TitleCard text={sc.title} local={local} />}
      {sc.outro && <OutroCard local={local} dur={sc.dur} />}
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{text: string; local: number}> = ({text, local}) => {
  const words = text.split(' ');
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 100%)'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1500, gap: '0 28px'}}>
        {words.map((w, k) => {
          const d = local - 8 - k * 4;
          const sc = interpolate(d, [0, 8, 14], [0, 1.18, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const bob = Math.sin((local + k * 9) / 9) * 6;
          const colors = ['#FFD23F', '#FF6B6B', '#4ECDC4', '#A78BFA', '#FF9F1C', '#6BCB77'];
          return (
            <span
              key={k}
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 128,
                color: colors[k % colors.length],
                WebkitTextStroke: '10px #3B2A6B',
                paintOrder: 'stroke fill',
                textShadow: '0 12px 0 rgba(59,42,107,0.55)',
                transform: `translateY(${bob}px) scale(${sc})`,
                display: 'inline-block',
                lineHeight: 1.15,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const OutroCard: React.FC<{local: number; dur: number}> = ({local}) => {
  const sc = interpolate(local, [10, 22, 28], [0, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wob = Math.sin(local / 7) * 3;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 90}}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 92,
          color: '#fff',
          background: '#FF4D6D',
          border: '10px solid #fff',
          borderRadius: 80,
          padding: '18px 64px',
          boxShadow: '0 14px 0 rgba(0,0,0,0.25)',
          transform: `scale(${sc}) rotate(${wob}deg)`,
        }}
      >
        Abonnieren & bis bald! 👋
      </div>
    </AbsoluteFill>
  );
};

const Badge: React.FC<{who: string; level: number; appear: number}> = ({who, level, appear}) => {
  const c = chars[who];
  if (!c || !c.crop || !sheet) return null;
  const S = 250;
  const imgH = S / c.crop.size;
  const imgW = imgH * sheetAspect;
  const left = S / 2 - c.crop.cx * imgW;
  const top = S / 2 - c.crop.cy * imgH;
  const scale = appear * (1 + level * 0.09);
  return (
    <div style={{position: 'absolute', left: 60, bottom: 320, transform: `scale(${scale}) rotate(${(level - 0.3) * 4}deg)`, transformOrigin: 'center bottom'}}>
      <div style={{width: S, height: S, borderRadius: '50%', overflow: 'hidden', border: `12px solid ${c.color}`, background: '#fff', boxShadow: '0 12px 0 rgba(0,0,0,0.25)', position: 'relative'}}>
        <Img src={staticFile(sheet)} style={{position: 'absolute', width: imgW, height: imgH, left, top}} />
      </div>
      <div style={{marginTop: -28, textAlign: 'center'}}>
        <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, color: '#fff', background: c.color, borderRadius: 30, padding: '4px 26px', border: '6px solid #fff'}}>{c.name}</span>
      </div>
    </div>
  );
};

const Captions: React.FC<{frame: number}> = ({frame}) => {
  let sc: Scene | null = null;
  for (const s of scenes) if (frame >= s.start && frame < s.start + s.dur) sc = s;
  if (!sc) return null;
  const local = frame - sc.start;
  const list = sc.kind === 'song' ? sc.lyrics || [] : sc.lines;
  const cur = list.find((l) => local >= l.s && local < l.e + 6);
  if (!cur) return null;
  const appear = interpolate(local - cur.s, [0, 6], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const c = chars[cur.who];
  const color = sc.kind === 'song' ? '#FF4D6D' : c ? c.color : '#3B2A6B';
  return (
    <>
      {sc.kind !== 'song' && cur.who !== 'narrator' && <Badge who={cur.who} level={ampAt(frame)} appear={appear} />}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: sc.kind === 'song' ? 66 : 56,
            lineHeight: 1.2,
            color: '#2B2350',
            background: 'rgba(255,255,255,0.93)',
            border: `8px solid ${color}`,
            borderRadius: 44,
            padding: '16px 44px',
            maxWidth: 1500,
            textAlign: 'center',
            boxShadow: '0 10px 0 rgba(0,0,0,0.2)',
            opacity: appear,
            transform: `translateY(${(1 - appear) * 30}px)`,
          }}
        >
          {sc.kind === 'song' ? '♪ ' : ''}
          {cur.text}
          {sc.kind === 'song' ? ' ♪' : ''}
        </div>
      </AbsoluteFill>
    </>
  );
};

const Logo: React.FC = () => (
  <div style={{position: 'absolute', top: 36, right: 44, fontFamily: FONT, fontWeight: 700, fontSize: 38, color: '#fff', background: 'rgba(59,42,107,0.75)', borderRadius: 30, padding: '6px 26px', border: '5px solid #FFD23F'}}>
    🌈 Schlaue Kinder
  </div>
);

export const Story: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#FFF6E5'}}>
      {scenes.map((sc, i) => {
        const lead = i === 0 ? 0 : TRANS;
        return (
          <Sequence key={i} from={sc.start - lead} durationInFrames={sc.dur + lead + (i === scenes.length - 1 ? 0 : TRANS)}>
            <SceneView sc={sc} i={i} />
          </Sequence>
        );
      })}
      <Captions frame={frame} />
      <Logo />
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
