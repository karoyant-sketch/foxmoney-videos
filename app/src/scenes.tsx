import React from 'react';
import {interpolate, Easing, random} from 'remotion';
import {C, clamp, sp, fadeUp, pop, countUp, de, Panel, Kicker, Title, Coin} from './ui';

/* ------------------------------------------------------------------ *
 * Scene library. Each scene in video.json has a "type" plus its fields.
 * See SCENES.md for the full field reference.
 * ------------------------------------------------------------------ */

export type SceneSpec = {type: string; voice?: string; [k: string]: any};
const D = 16; // wait for the camera to arrive
const col = (c?: string) => (c && (C as any)[c]) || c || C.orange;

const Wrap: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, padding: '120px 140px', boxSizing: 'border-box', ...style}}>{children}</div>
);

const Num: React.FC<{f: number; n: any; delay: number; len?: number}> = ({f, n, delay, len = 40}) => {
  if (n.countTo === undefined) return <>{n.text}</>;
  const v = countUp(f, 0, n.countTo, delay, len);
  return (
    <>
      {n.prefix ?? ''}
      {de(v, n.decimals ?? 0)}
      {n.suffix ?? ''}
    </>
  );
};

const Head: React.FC<{f: number; s: SceneSpec; color?: string; size?: number}> = ({f, s, color, size}) => (
  <>
    {s.kicker && (
      <Kicker f={f} delay={D} color={color}>
        {s.kicker}
      </Kicker>
    )}
    {s.title && (
      <Title f={f} delay={D + 4} size={size}>
        {s.title}
      </Title>
    )}
  </>
);

/* hook: {kicker, countTo|text, prefix, suffix, decimals, line, sub, color} */
const Hook: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const c = col(s.color ?? 'red');
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);
  const glitch = f > 48 && f < 58 ? (random(f) - 0.5) * 30 : 0;
  const len = String(s.text ?? `${s.prefix ?? ''}${s.countTo}${s.suffix ?? ''}`).length;
  return (
    <Wrap style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${c}${Math.round(30 + pulse * 40).toString(16)} 0%, transparent 60%)`}} />
      {s.kicker && <Kicker f={f} color={c}>{s.kicker}</Kicker>}
      <div
        style={{
          ...pop(f, 2),
          fontSize: Math.min(300, 2600 / Math.max(6, len)),
          fontWeight: 900,
          color: C.text,
          letterSpacing: -8,
          lineHeight: 1.05,
          textShadow: `${glitch}px 0 ${C.red}, ${-glitch}px 0 ${C.blue}, 0 0 80px ${c}88`,
          margin: '10px 0',
        }}
      >
        <Num f={f} n={s} delay={4} len={45} />
      </div>
      {s.line && <div style={{...fadeUp(f, 40), fontSize: 64, fontWeight: 900, color: C.orange}}>{s.line}</div>}
      {s.sub && <div style={{...fadeUp(f, 80), fontSize: 44, color: C.dim, marginTop: 24, fontWeight: 700}}>{s.sub}</div>}
    </Wrap>
  );
};

/* stat: {kicker, title, countTo|text, prefix, suffix, decimals, label, note, color, icon} */
const Stat: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const c = col(s.color ?? 'green');
  return (
    <Wrap style={{display: 'flex', alignItems: 'center', gap: 110}}>
      <div style={{...pop(f, D + 4), fontSize: 380, lineHeight: 1, filter: `drop-shadow(0 0 60px ${c}66)`, transform: `${pop(f, D + 4).transform} translateY(${Math.sin(f / 12) * 12}px)`}}>
        {s.icon ?? '📊'}
      </div>
      <div>
        <Head f={f} s={{kicker: s.kicker} as any} color={c} />
        <div style={{...fadeUp(f, D + 10), fontSize: 170, fontWeight: 900, color: c, letterSpacing: -6, textShadow: `0 0 60px ${c}66`}}>
          <Num f={f} n={s} delay={D + 14} />
        </div>
        {s.label && <div style={{...fadeUp(f, D + 30), fontSize: 52, color: C.text, fontWeight: 800}}>{s.label}</div>}
        {s.note && (
          <div style={{...fadeUp(f, D + 70), marginTop: 30}}>
            <Panel style={{padding: '20px 32px', fontSize: 38, color: C.text, fontWeight: 700, display: 'inline-block'}}>{s.note}</Panel>
          </div>
        )}
      </div>
    </Wrap>
  );
};

/* bars: {kicker, title, bars:[{label, value, display, color}], callout, calloutSub} */
const Bars: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const bars: any[] = s.bars ?? [];
  const max = Math.max(...bars.map((b) => Math.abs(b.value)));
  const w = Math.min(300, 1000 / bars.length - 40);
  const x0 = s.callout ? 820 : 160;
  const span = 1780 - x0;
  return (
    <Wrap>
      <Head f={f} s={s} />
      {bars.map((b, k) => {
        const g = sp(f, D + 10 + k * 18, 20);
        const c = col(b.color ?? (k === bars.length - 1 ? 'red' : 'blue'));
        return (
          <div key={k} style={{position: 'absolute', left: x0 + (span / bars.length) * k + (span / bars.length - w) / 2, bottom: 120, width: w, textAlign: 'center'}}>
            <div style={{color: c, fontSize: 56, fontWeight: 900, opacity: g}}>{b.display ?? de(b.value)}</div>
            <div style={{height: (600 * Math.abs(b.value)) / max * g, background: `linear-gradient(180deg, ${c}, ${c}55)`, borderRadius: '20px 20px 0 0', boxShadow: `0 0 50px ${c}66`}} />
            <div style={{color: C.text, fontSize: 36, fontWeight: 800, marginTop: 16}}>{b.label}</div>
          </div>
        );
      })}
      {s.callout && (
        <div style={{position: 'absolute', left: 140, top: 500, width: 600, ...pop(f, D + 20 + bars.length * 18)}}>
          <div style={{fontSize: 220, fontWeight: 900, color: C.orange, lineHeight: 1, textShadow: `0 0 60px ${C.orange}88`}}>{s.callout}</div>
          {s.calloutSub && <div style={{fontSize: 40, color: C.dim, fontWeight: 700}}>{s.calloutSub}</div>}
        </div>
      )}
    </Wrap>
  );
};

/* yearbars: {kicker, title, data:[{label, value}], highlight:[labels], badge, note} – positive/negative bars */
const YearBars: React.FC<{s: SceneSpec; f: number; dur: number}> = ({s, f, dur}) => {
  const data: any[] = s.data ?? [];
  const max = Math.max(...data.map((d) => Math.abs(d.value)));
  const hl = s.highlight && f > dur * 0.42;
  const step = 1640 / data.length;
  const base = 640;
  return (
    <Wrap>
      <Head f={f} s={s} size={80} />
      <div style={{position: 'absolute', left: 140, right: 140, top: base, height: 2, background: C.dim}} />
      {data.map((d, k) => {
        const g = sp(f, D + 20 + k * 6, 18);
        const h = (Math.abs(d.value) / max) * 300 * g;
        const c = d.value >= 0 ? C.green : C.red;
        const mark = hl && s.highlight.includes(d.label);
        return (
          <div key={k} style={{position: 'absolute', left: 140 + k * step + step * 0.15, width: step * 0.7, top: 0, height: '100%', opacity: hl && !mark ? 0.3 : 1}}>
            <div style={{position: 'absolute', left: 0, width: '100%', top: d.value >= 0 ? base - h : base + 2, height: h, background: c, borderRadius: d.value >= 0 ? '14px 14px 0 0' : '0 0 14px 14px', boxShadow: mark ? `0 0 40px ${c}` : undefined}} />
            <div style={{position: 'absolute', width: '100%', textAlign: 'center', top: d.value >= 0 ? base - h - 40 : base + 10 + h, fontSize: 28, fontWeight: 900, color: c, opacity: g}}>{d.display ?? `${d.value > 0 ? '+' : ''}${de(d.value, 1)}`}</div>
            <div style={{position: 'absolute', width: '100%', textAlign: 'center', top: d.value >= 0 ? base + 16 : base - 44, fontSize: 26, color: mark ? C.yellow : C.dim, fontWeight: 800}}>{d.label}</div>
          </div>
        );
      })}
      {s.badge && (
        <div style={{position: 'absolute', right: 140, top: 130, ...pop(f, D + 90)}}>
          <Panel glow={C.green} style={{padding: '18px 34px', fontSize: 46, fontWeight: 900, color: C.green}}>{s.badge}</Panel>
        </div>
      )}
      {s.note && (
        <div style={{position: 'absolute', left: 140, bottom: 40, ...fadeUp(f, s.highlight ? dur * 0.42 : D + 120)}}>
          <Panel glow={C.yellow} style={{padding: '16px 30px', fontSize: 36, fontWeight: 800, color: C.text}}>{s.note}</Panel>
        </div>
      )}
    </Wrap>
  );
};

/* chart: {kicker, title, points:[numbers], priceLabel, ticks:[{sym, val, up}]} – candle chart */
const Chart: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const pts: number[] = s.points ?? [];
  const n = pts.length - 1;
  const prog = interpolate(f, [D, D + 75], [0, n], clamp);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const pad = (hi - lo) * 0.1 || 1;
  const y = (p: number) => 640 - ((p - lo + pad) / (hi - lo + 2 * pad)) * 580;
  const cw = Math.min(40, 880 / Math.max(1, n));
  const ticks: any[] = s.ticks ?? [];
  const wide = ticks.length === 0;
  const up = pts[pts.length - 1] >= pts[0];
  return (
    <Wrap>
      <Head f={f} s={s} color={up ? C.green : C.red} />
      <svg width={wide ? 1640 : 1050} height={700} style={{position: 'absolute', left: 140, top: 330}}>
        {pts.slice(1).map((c, k) => {
          if (k > prog) return null;
          const o = pts[k];
          const isUp = c >= o;
          const cc = isUp ? C.green : C.red;
          const top = y(Math.max(o, c));
          const h = Math.max(6, Math.abs(y(o) - y(c)));
          const x = 20 + k * (wide ? cw * 1.8 : cw * 1.15);
          return (
            <g key={k}>
              <line x1={x + cw * 0.35} x2={x + cw * 0.35} y1={top - 14} y2={top + h + 14} stroke={cc} strokeWidth={3} />
              <rect x={x} y={top} width={cw * 0.7} height={h} fill={cc} rx={3} />
            </g>
          );
        })}
      </svg>
      {s.priceLabel && (
        <div style={{position: 'absolute', left: wide ? 1300 : 820, top: 340, ...pop(f, D + 75)}}>
          <Panel glow={up ? C.green : C.red} style={{padding: '14px 30px', fontSize: 56, fontWeight: 900, color: up ? C.green : C.red}}>{s.priceLabel}</Panel>
        </div>
      )}
      {!wide && (
        <div style={{position: 'absolute', right: 140, top: 440, width: 520}}>
          {ticks.map((t, k) => (
            <div key={k} style={{...fadeUp(f, D + 40 + k * 15), display: 'flex', justifyContent: 'space-between', fontSize: 50, fontWeight: 900, padding: '14px 0', borderBottom: `2px solid ${C.stroke}`}}>
              <span style={{color: C.text}}>{t.sym}</span>
              <span style={{color: t.up ? C.green : C.red}}>{t.up ? '▲' : '▼'} {t.val}</span>
            </div>
          ))}
        </div>
      )}
    </Wrap>
  );
};

/* cards: {kicker, title, cards:[{icon, title, sub}]} – 1 to 6 cards */
const Cards: React.FC<{s: SceneSpec; f: number; dur: number}> = ({s, f, dur}) => {
  const cards: any[] = s.cards ?? [];
  const cols = cards.length <= 3 ? cards.length : 2;
  const gap = Math.min(32, (dur - D - 60) / Math.max(1, cards.length));
  return (
    <Wrap>
      <Head f={f} s={s} />
      <div style={{position: 'absolute', left: 140, right: 140, top: 420, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 30}}>
        {cards.map((c, k) => (
          <div key={k} style={pop(f, D + 30 + k * gap)}>
            <Panel glow={c.color ? col(c.color) : undefined} style={{padding: 30, display: 'flex', gap: 24, alignItems: 'center', minHeight: cards.length > 3 ? 170 : 300, boxSizing: 'border-box', flexDirection: cards.length <= 3 ? 'column' : 'row', textAlign: cards.length <= 3 ? 'center' : 'left', justifyContent: 'center'}}>
              <div style={{fontSize: cards.length <= 3 ? 110 : 80}}>{c.icon}</div>
              <div>
                <div style={{fontSize: 44, fontWeight: 900, color: C.text}}>{c.title}</div>
                {c.sub && <div style={{fontSize: 32, color: C.dim, fontWeight: 700, marginTop: 6}}>{c.sub}</div>}
              </div>
            </Panel>
          </div>
        ))}
      </div>
    </Wrap>
  );
};

/* flows: {kicker, title, lock?, rows:[{label, countTo, prefix, suffix, decimals, up}], total:{label, countTo, ...}, note} */
const Flows: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const rows: any[] = s.rows ?? [];
  const lock = s.lock ? sp(f, D + 6, 10) : 0;
  const t0 = s.lock ? D + 90 : D + 20;
  return (
    <Wrap>
      <Head f={f} s={s} color={C.red} />
      {s.lock && (
        <div style={{position: 'absolute', left: 140, top: 400, opacity: f > t0 ? interpolate(f, [t0, t0 + 15], [1, 0.25], clamp) : lock, transform: `scale(${0.5 + lock * 0.5})`}}>
          <Panel glow={C.red} style={{padding: '40px 60px', textAlign: 'center'}}>
            <div style={{fontSize: 140}}>{s.lock.icon ?? '🔒'}</div>
            <div style={{fontSize: 52, fontWeight: 900, color: C.red, whiteSpace: 'pre-line'}}>{s.lock.title}</div>
            {s.lock.sub && <div style={{fontSize: 36, color: C.dim, marginTop: 10, fontWeight: 700}}>{s.lock.sub}</div>}
          </Panel>
        </div>
      )}
      <div style={{position: 'absolute', left: s.lock ? 820 : 300, top: 360, width: s.lock ? 960 : 1320}}>
        {rows.map((r, k) => {
          const c = r.up ? C.green : C.red;
          return (
            <div key={k} style={{...fadeUp(f, t0 + k * 15), display: 'flex', alignItems: 'center', gap: 30, marginBottom: 30}}>
              <div style={{fontSize: 80, color: c, transform: `translateY(${Math.sin(f / 5) * 8}px)`}}>{r.up ? '⬆' : '⬇'}</div>
              <div style={{fontSize: 40, color: C.text, width: 320, fontWeight: 800}}>{r.label}</div>
              <div style={{fontSize: 84, color: c, fontWeight: 900}}><Num f={f} n={r} delay={t0 + k * 15} /></div>
            </div>
          );
        })}
        {s.total && (
          <div style={{...pop(f, t0 + rows.length * 15 + 30)}}>
            <Panel glow={C.orange} style={{padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontSize: 44, fontWeight: 900, color: C.text}}>{s.total.label}</span>
              <span style={{fontSize: 90, fontWeight: 900, color: C.orange}}><Num f={f} n={s.total} delay={t0 + rows.length * 15 + 30} /></span>
            </Panel>
          </div>
        )}
        {s.note && <div style={{...fadeUp(f, t0 + 10), fontSize: 30, color: C.dim, marginTop: 16, fontWeight: 700}}>{s.note}</div>}
      </div>
    </Wrap>
  );
};

/* dates: {kicker, title, items:[{top, big, title, sub, color}]} – calendar cards */
const Dates: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const items: any[] = s.items ?? [];
  const palette = ['orange', 'blue', 'red', 'green'];
  return (
    <Wrap>
      <Head f={f} s={s} />
      <div style={{position: 'absolute', left: 140, right: 140, top: 400, display: 'flex', gap: 50}}>
        {items.map((it, k) => {
          const c = col(it.color ?? palette[k % 4]);
          return (
            <div key={k} style={{flex: 1, ...pop(f, D + 30 + k * 45)}}>
              <Panel glow={c} style={{overflow: 'hidden', textAlign: 'center'}}>
                <div style={{background: c, color: '#0a0f20', fontSize: 40, fontWeight: 900, padding: 14, letterSpacing: 6}}>{it.top}</div>
                <div style={{fontSize: 160, fontWeight: 900, color: C.text, lineHeight: 1.2}}>{it.big}</div>
                <div style={{fontSize: 40, fontWeight: 900, color: C.text, padding: '0 20px'}}>{it.title}</div>
                <div style={{fontSize: 30, color: C.dim, fontWeight: 700, padding: '10px 0 34px'}}>{it.sub ?? ''}</div>
              </Panel>
            </div>
          );
        })}
      </div>
    </Wrap>
  );
};

/* compare: {kicker, title, left:{title, icon, points[]}, right:{...}, slogan} – left = bad, right = good */
const Compare: React.FC<{s: SceneSpec; f: number; dur: number}> = ({s, f, dur}) => {
  const side = (o: any, good: boolean, d: number, x: number) => {
    const c = good ? C.green : C.red;
    return (
      <div style={{position: 'absolute', left: x, top: 360, width: 760, ...pop(f, d)}}>
        <Panel glow={c} style={{padding: 40}}>
          <div style={{fontSize: 100}}>{o.icon}</div>
          <div style={{fontSize: 54, fontWeight: 900, color: c}}>{o.title}</div>
          {(o.points ?? []).map((p: string, k: number) => (
            <div key={k} style={{...fadeUp(f, d + 15 + k * 10), fontSize: 36, color: C.text, marginTop: 14, fontWeight: 700}}>
              {good ? '✅' : '❌'} {p}
            </div>
          ))}
        </Panel>
      </div>
    );
  };
  const sl = sp(f, dur - 110, 10);
  return (
    <Wrap>
      <Head f={f} s={s} />
      {s.left && side(s.left, false, D + 25, 140)}
      {s.right && side(s.right, true, D + 75, 1020)}
      {s.slogan && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center', opacity: sl, transform: `scale(${0.6 + sl * 0.4})`}}>
          <span style={{fontSize: 72, fontWeight: 900, color: C.orange, textShadow: `0 0 40px ${C.orange}88`}}>{s.slogan}</span>
        </div>
      )}
    </Wrap>
  );
};

/* link: {kicker, title, from, to, stamp, stat:{countTo|text, prefix, suffix, decimals, label}} – arc between two points */
const Link: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const line = interpolate(f, [D + 20, D + 60], [0, 1], clamp);
  const stamp = sp(f, D + 55, 9);
  return (
    <Wrap>
      <Head f={f} s={s} />
      <svg width={1640} height={700} style={{position: 'absolute', left: 140, top: 340}}>
        {Array.from({length: 240}).map((_, k) => (
          <circle key={k} cx={random(`x${k}`) * 1640} cy={60 + random(`y${k}`) * 560} r={4} fill={C.blue} opacity={0.25} />
        ))}
        <path d="M 1350 170 Q 900 -40 520 360" stroke={C.red} strokeWidth={8} fill="none" pathLength={1} style={{strokeDasharray: `${line} 1`}} />
        <circle cx={1350} cy={170} r={22 + Math.sin(f / 4) * 6} fill={C.red} />
        <text x={1350} y={245} textAnchor="middle" fill="#fff" fontSize={40} fontWeight={900}>{s.from}</text>
        <circle cx={520} cy={360} r={22} fill={C.yellow} opacity={line} />
        <text x={520} y={430} textAnchor="middle" fill="#fff" fontSize={40} fontWeight={900} opacity={line}>{s.to}</text>
      </svg>
      {s.stamp && (
        <div style={{position: 'absolute', right: 160, top: 130, border: `10px solid ${C.red}`, color: C.red, fontSize: 72, fontWeight: 900, padding: '10px 40px', borderRadius: 16, transform: `rotate(-12deg) scale(${2.5 - stamp * 1.5})`, opacity: stamp}}>
          {s.stamp}
        </div>
      )}
      {s.stat && (
        <div style={{position: 'absolute', left: 140, bottom: 90, ...fadeUp(f, D + 80)}}>
          <Panel glow={C.red} style={{padding: '24px 40px', display: 'flex', alignItems: 'center', gap: 24}}>
            <span style={{fontSize: 90, fontWeight: 900, color: C.red}}><Num f={f} n={s.stat} delay={D + 80} /></span>
            <span style={{fontSize: 36, color: C.text, fontWeight: 700, whiteSpace: 'pre-line'}}>{s.stat.label}</span>
          </Panel>
        </div>
      )}
    </Wrap>
  );
};

/* vault: {kicker, title, label, sublabel, info:{title, text}} – door opens, coins fly out */
const Vault: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const open = interpolate(f, [D + 20, D + 45], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <Wrap>
      <Head f={f} s={s} />
      <div style={{position: 'absolute', left: 1120, top: 330, width: 560, height: 560}}>
        <Panel glow={C.yellow} style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...pop(f, D + 6)}}>
          <div style={{color: C.yellow, fontSize: 46, fontWeight: 900, textAlign: 'center'}}>{s.label}<br /><span style={{fontSize: 30, color: C.dim}}>{s.sublabel}</span></div>
        </Panel>
        <div style={{position: 'absolute', inset: 0, borderRadius: 28, background: 'linear-gradient(135deg,#2a3768,#141c38)', border: `4px solid ${C.yellow}`, transformOrigin: 'right center', transform: `perspective(1400px) rotateY(${open * 100}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sp(f, D + 6)}}>
          <div style={{width: 220, height: 220, borderRadius: 110, border: `14px solid ${C.yellow}`, transform: `rotate(${f * 4}deg)`}} />
        </div>
        {Array.from({length: 22}).map((_, k) => {
          const t = interpolate(f, [D + 40 + k * 3, D + 90 + k * 3], [0, 1], clamp);
          const ang = random(`a${k}`) * Math.PI * 2;
          const dist = 400 + random(`d${k}`) * 500;
          return (
            <Coin key={k} size={70} color={k % 3 === 0 ? C.blue : C.yellow} label={k % 3 === 0 ? 'Ξ' : '₿'}
              style={{position: 'absolute', left: 245, top: 245, opacity: t > 0 && t < 1 ? 1 : 0, transform: `translate(${Math.cos(ang) * dist * t}px, ${Math.sin(ang) * dist * t - 200 * Math.sin(t * Math.PI)}px) rotate(${t * 720}deg)`}} />
          );
        })}
      </div>
      {s.info && (
        <div style={{position: 'absolute', left: 140, top: 560, width: 760, ...fadeUp(f, D + 60)}}>
          <Panel style={{padding: 36}}>
            <div style={{fontSize: 34, color: C.yellow, fontWeight: 900}}>{s.info.title}</div>
            <div style={{fontSize: 34, color: C.text, marginTop: 12, lineHeight: 1.35}}>{s.info.text}</div>
          </Panel>
        </div>
      )}
    </Wrap>
  );
};

/* steps: {kicker, title, steps:[text]} – numbered explainer list */
const Steps: React.FC<{s: SceneSpec; f: number; dur: number}> = ({s, f, dur}) => {
  const steps: string[] = s.steps ?? [];
  const gap = (dur - D - 40) / Math.max(1, steps.length);
  return (
    <Wrap>
      <Head f={f} s={s} />
      <div style={{position: 'absolute', left: 140, right: 140, top: 380}}>
        {steps.map((t, k) => (
          <div key={k} style={{...fadeUp(f, D + 20 + k * gap), display: 'flex', alignItems: 'center', gap: 34, marginBottom: 26}}>
            <div style={{width: 96, height: 96, borderRadius: 48, background: C.orange, color: '#0a0f20', fontSize: 52, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{k + 1}</div>
            <Panel style={{padding: '22px 34px', fontSize: 42, color: C.text, fontWeight: 800, flex: 1}}>{t}</Panel>
          </div>
        ))}
      </div>
    </Wrap>
  );
};

/* outro: {question, disclaimer} */
const Outro: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const click = interpolate(f, [D + 50, D + 56, D + 62], [1, 0.9, 1], clamp);
  const subbed = f > D + 56;
  return (
    <Wrap style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
      <div style={{...pop(f, D), fontSize: 150, fontWeight: 900, color: C.text, letterSpacing: 4}}>FOX<span style={{color: C.orange}}>MONEY</span></div>
      {s.question && <div style={{...fadeUp(f, D + 20), fontSize: 48, color: C.text, fontWeight: 800, margin: '20px 0 50px'}}>{s.question} 💬</div>}
      <div style={{...pop(f, D + 30), transform: `scale(${click})`}}>
        <div style={{background: subbed ? '#3a3f55' : C.red, color: '#fff', fontSize: 56, fontWeight: 900, padding: '26px 70px', borderRadius: 60, boxShadow: subbed ? 'none' : `0 0 50px ${C.red}88`}}>
          {subbed ? '✓ ABONNIERT 🔔' : 'ABONNIEREN'}
        </div>
      </div>
      <div style={{...fadeUp(f, D + 80), fontSize: 30, color: C.dim, marginTop: 70, fontWeight: 700}}>{s.disclaimer ?? 'Keine Anlageberatung'}</div>
    </Wrap>
  );
};

export function renderScene(s: SceneSpec, f: number, dur: number) {
  switch (s.type) {
    case 'hook': return <Hook s={s} f={f} />;
    case 'stat': return <Stat s={s} f={f} />;
    case 'bars': return <Bars s={s} f={f} />;
    case 'yearbars': return <YearBars s={s} f={f} dur={dur} />;
    case 'chart': return <Chart s={s} f={f} />;
    case 'cards': return <Cards s={s} f={f} dur={dur} />;
    case 'flows': return <Flows s={s} f={f} />;
    case 'dates': return <Dates s={s} f={f} />;
    case 'compare': return <Compare s={s} f={f} dur={dur} />;
    case 'link': return <Link s={s} f={f} />;
    case 'vault': return <Vault s={s} f={f} />;
    case 'steps': return <Steps s={s} f={f} dur={dur} />;
    case 'outro': return <Outro s={s} f={f} />;
    default: return <Cards s={{...s, cards: s.cards ?? []}} f={f} dur={dur} />;
  }
}
