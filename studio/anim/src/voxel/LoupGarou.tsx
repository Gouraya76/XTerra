import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame} from 'remotion';
import tl from '../ep02.json';

// Habillage de l'épisode Loup-Garou, posé sur la vidéo rendue par Blender (public/ep02/fond.mp4).
type Item = any;
const FPS = tl.fps;
const ITEMS: Item[] = tl.items as Item[];
const BEATS: Item[] = ITEMS.filter((o) => o.kind === 'beat');
const NOMS: Record<string, string> = (tl as any).noms;
const JOUEURS: string[] = (tl as any).joueurs;
const FEMININ = new Set(['NADIA', 'LOUNA', 'ELISE']);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const pop = (t: number, t0: number, d = 9, s = 170) => spring({frame: Math.max(0, (t - t0) * FPS), fps: FPS, config: {damping: d, stiffness: s}});
const JAUNE = '#ffcf3f', NUIT = '#0d1530', ROUGE = '#ff2d4b';

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([['ID', 'fonts/InterDisplay-Black.otf'], ['IT', 'fonts/Inter-ExtraBold.otf']].map(([n, f]) =>
      new FontFace(n, `url(${staticFile(f)})`).load().then((ff) => document.fonts.add(ff)))).then(() => { setReady(true); continueRender(h); });
  }, [h]);
  return ready;
};

/** joueurs éliminés AVANT cette réplique */
const eliminesAvant = (b: Item): string[] => {
  const out: string[] = [];
  for (const x of BEATS) { if (x.i >= b.i) break; if (x.elimine) out.push(x.elimine); }
  return out;
};

const Logo: React.FC<{nuit: boolean}> = ({nuit}) => (
  <div style={{position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(12,8,20,0.85)',
    padding: '8px 20px', borderRadius: 14, border: `3px solid ${nuit ? '#7fa8ff' : JAUNE}`}}>
    <span style={{fontFamily: 'ID', fontSize: 34, color: JAUNE}}>LE J</span>
    <span style={{fontFamily: 'ID', fontSize: 30, color: '#fff'}}>· LOUP-GAROU</span>
  </div>
);

const Restants: React.FC<{b: Item}> = ({b}) => {
  const el = eliminesAvant(b);
  return (
    <div style={{position: 'absolute', right: 40, top: 34, display: 'flex', gap: 8}}>
      {JOUEURS.map((j) => (
        <div key={j} style={{height: 46, minWidth: 46, padding: '0 10px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ID', fontSize: 20, background: el.includes(j) ? ROUGE : 'rgba(12,8,20,0.85)', color: '#fff', border: '3px solid rgba(255,255,255,0.25)',
          textDecoration: el.includes(j) ? 'line-through' : 'none'}}>{NOMS[j].replace('PAPI ', '')}</div>
      ))}
    </div>
  );
};

const NameTag: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const nom = b.shot === 'camera' ? 'LE_J' : b.shot === 'meneur' ? 'MENEUR' : b.shot === 'couloir' ? 'LOUNA' : b.shot;
  if (!NOMS[nom] || t > b.start + 3.2) return null;
  const s = pop(t, b.start + 0.15, 12, 200);
  const out = interpolate(t, [b.start + 2.8, b.start + 3.2], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 80, bottom: 250, opacity: out, transform: `translateX(${(1 - s) * -400}px)`, display: 'flex'}}>
      <div style={{background: JAUNE, color: '#1a0f30', fontFamily: 'ID', fontSize: 50, padding: '6px 26px', borderRadius: 14}}>{NOMS[nom]}</div>
    </div>
  );
};

const Bandeaux: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const els: React.ReactNode[] = [];
  if (b.elimine && t > b.vstart + 0.1) {
    const fem = FEMININ.has(b.elimine);
    els.push(<div key="el" style={{position: 'absolute', left: 960, top: 230, transform: `translate(-50%,-50%) scale(${pop(t, b.vstart + 0.1)}) rotate(-5deg)`,
      background: ROUGE, color: '#fff', fontFamily: 'ID', fontSize: 84, padding: '10px 50px', borderRadius: 24, border: '8px solid #fff', boxShadow: '0 14px 0 #7a0016', whiteSpace: 'nowrap'}}>
      {NOMS[b.elimine]} · ÉLIMINÉ{fem ? 'E' : ''}</div>);
  }
  if (b.hud === 'VOTE') els.push(<div key="vo" style={{position: 'absolute', left: 960, top: 110, transform: `translateX(-50%) scale(${pop(t, b.start + 0.1)})`,
    background: '#7a3cff', color: '#fff', fontFamily: 'ID', fontSize: 64, padding: '8px 44px', borderRadius: 18, border: '6px solid #1a0f30'}}>VOTE</div>);
  if (b.i === BEATS[BEATS.length - 1].i && t > b.vstart + 0.4) els.push(<div key="ab" style={{position: 'absolute', left: 960, bottom: 250,
    transform: `translateX(-50%) scale(${pop(t, b.vstart + 0.4)})`, display: 'flex', alignItems: 'center', gap: 16, background: '#ff1f4b', color: '#fff',
    fontFamily: 'ID', fontSize: 52, padding: '18px 44px', borderRadius: 60, boxShadow: '0 10px 0 #9a0022'}}>
    <svg width="50" height="50" viewBox="0 0 24 24"><path d="M12 2a6 6 0 0 0-6 6v4l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0" fill="#fff" /></svg>ABONNE-TOI</div>);
  return <>{els}</>;
};

const Ecran: React.FC<{b: Item; t: number}> = ({b, t}) => {
  if (!b.ecran || t > b.start + 2.6) return null;
  const o = interpolate(t, [b.start + 2.2, b.start + 2.6], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: `rgba(10,6,20,${0.55 * o})`}}>
      <div style={{opacity: o, transform: `scale(${pop(t, b.start + 0.05, 8, 160)}) rotate(-2deg)`, fontFamily: 'ID', fontSize: 120, color: JAUNE,
        WebkitTextStroke: '16px #1a0f30', paintOrder: 'stroke fill'}}>{b.ecran}</div>
    </AbsoluteFill>
  );
};

const Mots: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const ws: {w: string; s: number; e: number}[] = b.words ?? [];
  let cur = -1;
  for (let i = 0; i < ws.length; i++) if (t >= ws[i].s - 0.05 && t < (ws[i + 1]?.s ?? ws[i].e + 0.25) - 0.05) cur = i;
  if (cur < 0) return null;
  const w = ws[cur];
  const word = w.w.replace(/^[«"(]+|[»".,!?…:;)]+$/g, '');
  if (!word) return null;
  const s = pop(t, w.s, 12, 260);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 110, textAlign: 'center'}}>
      <span style={{display: 'inline-block', transform: `scale(${0.7 + 0.3 * s})`, fontFamily: 'ID', fontSize: 86, color: '#fff',
        WebkitTextStroke: '14px #000', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>{word.toLowerCase()}</span>
    </div>
  );
};

const PhaseCard: React.FC<{o: Item; t: number}> = ({o, t}) => {
  const lt = t - o.start, D = o.end - o.start;
  const out = interpolate(lt, [D - 0.3, D], [1, 0], clamp);
  const [a, bb] = String(o.day).split(' : ');
  const nuit = !!o.nuit;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: `rgba(${nuit ? '5,10,30' : '25,12,5'},${0.6 * out})`}}>
      <div style={{transform: `scale(${pop(t, o.start + 0.1, 8, 170)})`, opacity: out, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: nuit ? NUIT : JAUNE, color: nuit ? '#bcd2ff' : '#1a0f30', fontFamily: 'ID', fontSize: 150,
          padding: '6px 60px', borderRadius: 30, border: `10px solid ${nuit ? '#7fa8ff' : '#1a0f30'}`, transform: 'rotate(-3deg)'}}>{a}</div>
        {bb && <div style={{marginTop: 26, fontFamily: 'ID', fontSize: 70, color: '#fff', WebkitTextStroke: '12px #1a0f30', paintOrder: 'stroke fill'}}>{bb}</div>}
      </div>
    </AbsoluteFill>
  );
};

const Titre: React.FC<{t: number}> = ({t}) => {
  const b = BEATS[5];
  if (!b || t < b.start + 2.6 || t > b.start + 7.5) return null;
  const o = interpolate(t, [b.start + 6.8, b.start + 7.5], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `scale(${pop(t, b.start + 2.6, 10, 140)})`}}>
      <div style={{fontFamily: 'ID', fontSize: 150, color: JAUNE, WebkitTextStroke: '18px #1a0f30', paintOrder: 'stroke fill', lineHeight: 1}}>LOUP-GAROU</div>
      <div style={{display: 'inline-block', marginTop: 18, background: ROUGE, color: '#fff', fontFamily: 'ID', fontSize: 48, padding: '10px 34px', borderRadius: 18,
        border: '6px solid #1a0f30'}}>8 JOUEURS · 1 CHALET · DES TRAÎTRES</div>
    </div>
  );
};

export const LoupGarou: React.FC = () => {
  const ready = useFonts();
  const f = useCurrentFrame();
  const t = f / FPS;
  const item = ITEMS.find((o) => t >= o.start && t < o.end) ?? ITEMS[ITEMS.length - 1];
  const b: Item = item.kind === 'beat' ? item : item.kind === 'daycard' ? BEATS.find((x) => x.start >= item.end - 0.01)! : BEATS[BEATS.length - 1];
  const nuit = b.scene === 'chalet_nuit';
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <OffthreadVideo src={staticFile('ep02/fond.mp4')} muted />
      {ready && (
        <>
          <Logo nuit={nuit} />
          {b.i > 4 && <Restants b={b} />}
          {item.kind === 'beat' && <NameTag b={item} t={t} />}
          {item.kind === 'beat' && <Bandeaux b={item} t={t} />}
          {item.kind === 'beat' && <Mots b={item} t={t} />}
          {item.kind === 'beat' && <Ecran b={item} t={t} />}
          {item.kind === 'daycard' && <PhaseCard o={item} t={t} />}
          <Titre t={t} />
        </>
      )}
      <Audio src={staticFile('ep02/audio.mp3')} />
    </AbsoluteFill>
  );
};
