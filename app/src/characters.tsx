import React from 'react';

/* Original caricature characters (no real people). SVG viewBox 0 0 400 620.
 * kind: host | hacker | banker | investor | trader
 * mood: happy | explaining | shocked | worried | thinking | angry
 */
export type CharSpec = {kind?: string; mood?: string; side?: 'left' | 'right'; say?: string};

type Look = {
  skin: string; hair: string; shirt: string; pants: string; accent: string;
  hairStyle: 'short' | 'bald' | 'ponytail' | 'hood' | 'messy'; glasses?: boolean; beard?: boolean; tie?: string; headset?: boolean;
};

const LOOKS: Record<string, Look> = {
  host: {skin: '#f2c3a0', hair: '#5a3a22', shirt: '#ff8a1f', pants: '#24304f', accent: '#ffffff', hairStyle: 'short', beard: true},
  hacker: {skin: '#d9b8a0', hair: '#111', shirt: '#1b1f2e', pants: '#141826', accent: '#22e39a', hairStyle: 'hood'},
  banker: {skin: '#f0c8a8', hair: '#9aa0aa', shirt: '#3b4258', pants: '#2a3044', accent: '#ffffff', hairStyle: 'bald', glasses: true, tie: '#ff3b4e'},
  investor: {skin: '#e8b48f', hair: '#2b1a10', shirt: '#4d8bff', pants: '#1f2a44', accent: '#ffffff', hairStyle: 'ponytail'},
  trader: {skin: '#c99272', hair: '#1a1a1a', shirt: '#e8ecf5', pants: '#2b3350', accent: '#4d8bff', hairStyle: 'messy', glasses: true, headset: true},
};

export const Character: React.FC<{c: CharSpec; f: number; talking?: boolean; height?: number}> = ({c, f, talking = false, height = 440}) => {
  const L = LOOKS[c.kind ?? 'host'] ?? LOOKS.host;
  const mood = c.mood ?? 'explaining';
  const bob = Math.sin(f / 9) * 4;
  const blink = f % 95 > 90 ? 0.1 : 1;
  const talk = talking ? Math.max(0, Math.sin(f * 0.9)) * 0.9 + 0.1 : 0;
  const gesture = mood === 'explaining' || mood === 'happy' ? Math.sin(f / 7) * 10 : mood === 'thinking' ? 0 : Math.sin(f / 4) * 4;
  const shake = mood === 'shocked' ? Math.sin(f * 1.7) * 2 : 0;

  // eyebrows per mood
  const brow = {
    happy: [-4, 4], explaining: [0, 0], shocked: [-14, -14], worried: [10, -10], thinking: [-8, 6], angry: [12, -12],
  }[mood] ?? [0, 0];
  const eyeScale = mood === 'shocked' ? 1.35 : 1;

  let mouth: React.ReactNode;
  if (mood === 'shocked') mouth = <ellipse cx={200} cy={232} rx={16} ry={20 + talk * 4} fill="#5a1a1a" />;
  else if (mood === 'worried' || mood === 'angry') mouth = <path d={`M176 ${236 + talk * 3} Q200 ${222 - talk * 6} 224 ${236 + talk * 3}`} stroke="#5a1a1a" strokeWidth={6} fill="none" strokeLinecap="round" />;
  else if (talk > 0.2) mouth = <path d={`M174 224 Q200 ${236 + talk * 22} 226 224 Z`} fill="#5a1a1a" />;
  else if (mood === 'thinking') mouth = <path d="M184 232 L214 228" stroke="#5a1a1a" strokeWidth={6} strokeLinecap="round" />;
  else mouth = <path d="M174 224 Q200 250 226 224" stroke="#5a1a1a" strokeWidth={6} fill="none" strokeLinecap="round" />;

  const hood = L.hairStyle === 'hood';
  return (
    <svg viewBox="0 0 400 620" height={height} style={{overflow: 'visible', filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.55))'}}>
      <ellipse cx={200} cy={608} rx={130} ry={12} fill="rgba(0,0,0,0.35)" />
      <g transform={`translate(${shake} ${bob})`}>
        {/* legs */}
        <rect x={150} y={470} width={42} height={130} rx={18} fill={L.pants} />
        <rect x={208} y={470} width={42} height={130} rx={18} fill={L.pants} />
        <ellipse cx={168} cy={600} rx={30} ry={12} fill="#111" />
        <ellipse cx={232} cy={600} rx={30} ry={12} fill="#111" />
        {/* body */}
        <path d="M110 340 Q110 290 160 285 L240 285 Q290 290 290 340 L282 490 Q200 505 118 490 Z" fill={L.shirt} />
        {L.tie && <path d="M200 292 L188 310 L200 400 L212 310 Z" fill={L.tie} />}
        {L.tie && <path d="M160 288 L200 330 L240 288" fill="none" stroke="#fff" strokeWidth={8} />}
        {c.kind === 'host' && <circle cx={240} cy={340} r={14} fill="#fff" opacity={0.9} />}
        {c.kind === 'hacker' && <text x={200} y={400} textAnchor="middle" fontSize={44} fill={L.accent} fontFamily="DejaVu Sans Mono, monospace">{'</>'}</text>}
        {/* back arm */}
        <g transform={`rotate(${mood === 'thinking' ? -150 : mood === 'shocked' ? -160 : 8} 125 305)`}>
          <rect x={108} y={300} width={34} height={140} rx={17} fill={L.shirt} />
          <circle cx={125} cy={445} r={20} fill={L.skin} />
        </g>
        {/* gesturing arm */}
        <g transform={`rotate(${(mood === 'shocked' ? 160 : mood === 'explaining' || mood === 'happy' ? -40 : mood === 'angry' ? -70 : -10) + gesture} 275 305)`}>
          <rect x={258} y={300} width={34} height={140} rx={17} fill={L.shirt} />
          <circle cx={275} cy={445} r={20} fill={L.skin} />
        </g>
        {/* neck + head */}
        <rect x={182} y={250} width={36} height={44} fill={L.skin} />
        <g transform={`rotate(${mood === 'thinking' ? -6 : Math.sin(f / 15) * 3} 200 180)`}>
          {hood && <path d="M88 200 Q88 60 200 52 Q312 60 312 200 L300 285 L100 285 Z" fill={L.shirt} />}
          <ellipse cx={200} cy={180} rx={hood ? 86 : 98} ry={hood ? 96 : 108} fill={L.skin} />
          {hood && <ellipse cx={200} cy={180} rx={86} ry={96} fill="rgba(0,0,0,0.25)" />}
          {/* ears */}
          {!hood && <ellipse cx={102} cy={190} rx={14} ry={22} fill={L.skin} />}
          {!hood && <ellipse cx={298} cy={190} rx={14} ry={22} fill={L.skin} />}
          {/* hair */}
          {L.hairStyle === 'short' && <path d="M100 160 Q100 70 200 66 Q300 70 300 160 Q290 112 250 106 Q200 96 150 108 Q110 118 100 160 Z" fill={L.hair} />}
          {L.hairStyle === 'messy' && <path d="M100 160 L110 90 L140 110 L150 70 L180 98 L200 60 L222 98 L252 70 L262 110 L292 90 L300 160 Q260 112 200 106 Q140 112 100 160 Z" fill={L.hair} />}
          {L.hairStyle === 'bald' && <path d="M102 170 Q104 140 118 128 L118 190 Z M298 170 Q296 140 282 128 L282 190 Z" fill={L.hair} />}
          {L.hairStyle === 'ponytail' && (
            <>
              <path d="M98 180 Q92 64 200 62 Q308 64 302 180 Q290 110 200 104 Q120 108 98 180 Z" fill={L.hair} />
              <path d={`M290 110 Q360 ${150 + Math.sin(f / 8) * 10} 330 260 Q320 190 285 150 Z`} fill={L.hair} />
            </>
          )}
          {L.beard && <path d="M110 200 Q118 286 200 290 Q282 286 290 200 Q272 250 200 252 Q128 250 110 200 Z" fill={L.hair} opacity={0.85} />}
          {/* eyes */}
          <g transform={`translate(0 ${mood === 'thinking' ? -4 : 0})`}>
            {[160, 240].map((x) => (
              <g key={x} transform={`translate(${x} 175) scale(${eyeScale} ${eyeScale * blink})`}>
                <ellipse cx={0} cy={0} rx={18} ry={20} fill="#fff" />
                <circle cx={mood === 'thinking' ? 6 : 2} cy={mood === 'thinking' ? -6 : 2} r={9} fill={hood ? L.accent : '#2a1a10'} />
                <circle cx={mood === 'thinking' ? 9 : 5} cy={mood === 'thinking' ? -9 : -2} r={3} fill="#fff" />
              </g>
            ))}
            <path d={`M140 ${142 + brow[0]} L180 ${142 - brow[0] / 2}`} stroke={hood ? '#333' : L.hair === '#9aa0aa' ? '#666' : L.hair} strokeWidth={8} strokeLinecap="round" />
            <path d={`M220 ${142 - brow[1] / 2} L260 ${142 + brow[1]}`} stroke={hood ? '#333' : L.hair === '#9aa0aa' ? '#666' : L.hair} strokeWidth={8} strokeLinecap="round" />
          </g>
          {L.glasses && (
            <g fill="none" stroke="#1a1a1a" strokeWidth={6}>
              <rect x={134} y={152} width={52} height={44} rx={12} />
              <rect x={214} y={152} width={52} height={44} rx={12} />
              <path d="M186 172 L214 172" />
            </g>
          )}
          {/* nose */}
          <path d="M200 182 Q186 210 204 212" stroke="rgba(120,60,40,0.55)" strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* cheeks */}
          {(mood === 'happy' || mood === 'explaining') && !hood && (
            <>
              <circle cx={140} cy={214} r={14} fill="#ff7a7a" opacity={0.3} />
              <circle cx={260} cy={214} r={14} fill="#ff7a7a" opacity={0.3} />
            </>
          )}
          {mouth}
          {mood === 'worried' && <path d="M282 120 q8 14 0 22 q-8 -8 0 -22" fill="#7fc7ff" />}
          {L.headset && (
            <g fill="none" stroke="#222" strokeWidth={10}>
              <path d="M96 190 Q96 60 200 58 Q304 60 304 190" />
              <path d="M110 230 Q130 268 168 262" strokeWidth={6} />
            </g>
          )}
        </g>
        {mood === 'thinking' && (
          <g opacity={0.9}>
            <circle cx={330} cy={80} r={10} fill="#fff" />
            <circle cx={352} cy={46} r={16} fill="#fff" />
            <text x={352} y={56} textAnchor="middle" fontSize={26} fontWeight={900} fill="#0a0f20">?</text>
          </g>
        )}
        {mood === 'shocked' && <text x={320} y={90} fontSize={70} fontWeight={900} fill="#ffd23f">!</text>}
      </g>
    </svg>
  );
};
