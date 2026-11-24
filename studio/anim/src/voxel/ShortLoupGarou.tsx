import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame} from 'remotion';
import tl from '../ep02.json';

// Short vertical (1080×1920) tiré de l'épisode Loup-Garou : accroche en haut, sous-titres, carte « la suite » à la fin.
type Item = any;
const FPS = tl.fps;
const BEATS: Item[] = (tl.items as Item[]).filter((o) => o.kind === 'beat');
const NOMS: Record<string, string> = (tl as any).noms;
const SHORTS: {n: number; titre: string; beats: number[]}[] = (tl as any).shorts;
const FEMININ = new Set(['NADIA', 'LOUNA', 'ELISE']);
const JAUNE = '#ffcf3f', ROUGE = '#ff2d4b', ENCRE = '#1a0f30';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const pop = (t: number, t0: number, d = 9, s = 170) => spring({frame: Math.max(0, (t - t0) * FPS), fps: FPS, config: {damping: d, stiffness: s}});
export const FIN_CARTE = 3; // secondes de carte « la suite » à la fin

/** début et fin (en secondes dans l'épisode) du short n */
export const bornesShort = (n: number) => {
  const s = SHORTS.find((x) => x.n === n)!;
  const a = BEATS.find((b) => b.i === s.beats[0])!;
  const z = BEATS.find((b) => b.i === s.beats[s.beats.length - 1])!;
  const debut = Math.max(0, a.start - 0.2);
  return {s, debut, fin: z.end + 0.3, duree: z.end + 0.3 - debut + FIN_CARTE};
};

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([['ID', 'fonts/InterDisplay-Black.otf']].map(([n, f]) =>
      new FontFace(n, `url(${staticFile(f)})`).load().then((ff) => document.fonts.add(ff)))).then(() => { setReady(true); continueRender(h); });
  }, [h]);
  return ready;
};

const Mots: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const ws: {w: string; s: number; e: number}[] = b.words ?? [];
  let cur = -1;
  for (let i = 0; i < ws.length; i++) if (t >= ws[i].s - 0.05 && t < (ws[i + 1]?.s ?? ws[i].e + 0.25) - 0.05) cur = i;
  if (cur < 0) return null;
  let brut = ws[cur].w.trim();
  if (brut.startsWith('-') && cur > 0) brut = ws[cur - 1].w.trim() + brut;
  if (ws[cur + 1]?.w.trim().startsWith('-')) brut = brut + ws[cur + 1].w.trim();
  const word = brut.replace(/^[«"(]+|[»".,!?…:;)]+$/g, '');
  if (!word) return null;
  const s = pop(t, ws[cur].s, 12, 260);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1330, textAlign: 'center'}}>
      <span style={{display: 'inline-block', transform: `scale(${0.7 + 0.3 * s})`, fontFamily: 'ID', fontSize: 104, color: '#fff',
        WebkitTextStroke: '16px #000', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>{word.toLowerCase().replace(/^j$/, 'J')}</span>
    </div>
  );
};

export const ShortLoupGarou: React.FC<{n: number}> = ({n}) => {
  const ready = useFonts();
  const {s, debut, fin, duree} = bornesShort(n);
  const f = useCurrentFrame();
  const lt = f / FPS; // temps dans le short
  const t = debut + lt; // temps dans l'épisode
  const b = BEATS.find((x) => t >= x.start && t < x.end && s.beats.includes(x.i));
  const carte = lt > fin - debut;
  const debutCarte = fin - debut;
  const nom = b ? (b.shot === 'camera' ? 'LE_J' : b.shot === 'meneur' ? 'MENEUR' : b.who) : null;
  // vidéo 16:9 agrandie pour remplir le 9:16 (centre de l'image), fond flou derrière
  const H = 1340, W = Math.round(H * 16 / 9), HAUT = 390;
  const video = (style: React.CSSProperties) => (
    <OffthreadVideo src={staticFile('ep02/fond.mp4')} muted trimBefore={Math.round(debut * FPS)} style={style} />
  );
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {/* fond : même image, plein cadre et floutée */}
      {video({position: 'absolute', height: 1920, width: 3413, left: (1080 - 3413) / 2, top: 0, filter: 'blur(28px) brightness(0.45)'})}
      {video({position: 'absolute', height: H, width: W, left: (1080 - W) / 2, top: HAUT,
        transform: `scale(${1 + 0.04 * lt / duree})`, filter: carte ? 'blur(14px) brightness(0.5)' : 'none',
        boxShadow: '0 0 60px rgba(0,0,0,0.6)'})}
      {ready && !carte && (
        <>
          {/* accroche : reste à l'écran tout le short */}
          <div style={{position: 'absolute', top: 210, left: 60, right: 60, textAlign: 'center', transform: `scale(${pop(lt, 0.05, 10, 150)})`}}>
            <div style={{display: 'inline-block', background: JAUNE, color: ENCRE, fontFamily: 'ID', fontSize: 64, lineHeight: 1.12, padding: '18px 34px',
              borderRadius: 26, border: `7px solid ${ENCRE}`, boxShadow: `0 12px 0 ${ENCRE}`, transform: 'rotate(-2deg)'}}>{s.titre.toUpperCase()}</div>
          </div>
          <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center'}}>
            <span style={{fontFamily: 'ID', fontSize: 38, color: '#fff', background: 'rgba(12,8,20,0.8)', padding: '6px 22px', borderRadius: 12}}>
              <span style={{color: JAUNE}}>LE J</span> · LOUP-GAROU · PARTIE {n}/10</span>
          </div>
          {b && nom && NOMS[nom] && lt - (b.start - debut) < 2.6 && (
            <div style={{position: 'absolute', left: 60, top: 1180, transform: `translateX(${(1 - pop(t, b.start + 0.1, 12, 200)) * -500}px)`,
              background: JAUNE, color: ENCRE, fontFamily: 'ID', fontSize: 52, padding: '6px 26px', borderRadius: 14}}>{NOMS[nom]}</div>
          )}
          {b?.elimine && t > b.vstart + 0.1 && (
            <div style={{position: 'absolute', left: 540, top: 960, transform: `translate(-50%,-50%) scale(${pop(t, b.vstart + 0.1)}) rotate(-5deg)`,
              background: ROUGE, color: '#fff', fontFamily: 'ID', fontSize: 72, padding: '10px 40px', borderRadius: 24, border: '8px solid #fff', whiteSpace: 'nowrap'}}>
              {NOMS[b.elimine]} · ÉLIMINÉ{FEMININ.has(b.elimine) ? 'E' : ''}</div>
          )}
          {b && <Mots b={b} t={t} />}
          {/* barre de progression */}
          <div style={{position: 'absolute', left: 0, bottom: 0, height: 14, width: `${(100 * lt) / debutCarte}%`, background: JAUNE}} />
        </>
      )}
      {ready && carte && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 70}}>
          <div style={{transform: `scale(${pop(lt, debutCarte, 8, 160)}) rotate(-3deg)`}}>
            <div style={{fontFamily: 'ID', fontSize: 120, color: JAUNE, WebkitTextStroke: `16px ${ENCRE}`, paintOrder: 'stroke fill', lineHeight: 1}}>LA SUITE ?</div>
            <div style={{marginTop: 40, display: 'inline-block', background: ROUGE, color: '#fff', fontFamily: 'ID', fontSize: 58, padding: '16px 40px', borderRadius: 24,
              border: '7px solid #fff', lineHeight: 1.15}}>ÉPISODE COMPLET<br />SUR LA CHAÎNE</div>
            <div style={{marginTop: 46, fontFamily: 'ID', fontSize: 52, color: '#fff', opacity: interpolate(lt, [debutCarte + 0.6, debutCarte + 1], [0, 1], clamp)}}>
              QUI SONT LES LOUPS ? 🐺</div>
          </div>
        </AbsoluteFill>
      )}
      <Audio src={staticFile('ep02/audio.mp3')} trimBefore={Math.round(debut * FPS)}
        volume={(fr) => interpolate(fr / FPS, [debutCarte, debutCarte + 1.2], [1, 0.25], clamp)} />
    </AbsoluteFill>
  );
};
