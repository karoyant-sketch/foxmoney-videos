import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import data from './data.json';

const FONT = 'Fredoka, sans-serif';

export const Thumbnail: React.FC = () => {
  const t = ((data as any).thumbnail || {}) as {image?: string; top?: string; big?: string; side?: 'left' | 'right'};
  const right = t.side === 'right';
  return (
    <AbsoluteFill style={{background: '#FFD23F'}}>
      {t.image && <Img src={staticFile(t.image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
      <AbsoluteFill
        style={{
          background: right ? 'linear-gradient(270deg, rgba(59,42,107,0.55) 0%, rgba(0,0,0,0) 55%)' : 'linear-gradient(90deg, rgba(59,42,107,0.55) 0%, rgba(0,0,0,0) 55%)',
        }}
      />
      <div style={{position: 'absolute', top: 40, [right ? 'right' : 'left']: 46, width: 620, textAlign: right ? 'right' : 'left'} as any}>
        {t.top && (
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 70, color: '#fff', WebkitTextStroke: '8px #3B2A6B', paintOrder: 'stroke fill', lineHeight: 1.05} as any}>{t.top}</div>
        )}
        {t.big && (
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 118, color: '#FFD23F', WebkitTextStroke: '11px #3B2A6B', paintOrder: 'stroke fill', lineHeight: 1.0, marginTop: 6, textShadow: '0 10px 0 rgba(59,42,107,0.6)'} as any}>
            {t.big}
          </div>
        )}
      </div>
      <div style={{position: 'absolute', bottom: 26, [right ? 'right' : 'left']: 40, fontFamily: FONT, fontWeight: 700, fontSize: 34, color: '#fff', background: '#FF4D6D', borderRadius: 26, padding: '6px 22px', border: '5px solid #fff'} as any}>
        🌈 Schlaue Kinder
      </div>
    </AbsoluteFill>
  );
};
