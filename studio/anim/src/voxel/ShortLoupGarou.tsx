import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Freeze, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import tl from '../ep02.json';

/*
 Short vertical (1080×1920) tiré de l'épisode Loup-Garou. Règles des skills « short-form-video » et « hook-viral » :
 1. ACCROCHE (in medias res) : 1 à 3 s du moment le plus fort, titre à l'écran dès la 1re image.
 2. RETOUR EN ARRIÈRE : flash + « ⏪ X SECONDES PLUS TÔT », puis la scène depuis son début.
 3. Changement de plan toutes les 2 à 4 s (zoom alterné par réplique, coup de zoom sur les bruitages).
 4. FIN : la boucle reste ouverte (cliffhanger), question pour les commentaires, ABONNE-TOI, renvoi vers l'épisode.
 Zones sûres YouTube : rien d'important dans les 150 px du haut, les 340 px du bas ni les 130 px de droite.
 Fond : public/ep02/shorts/NN.mp4 (images Blender rendues en bande centrale, à partir de l'image `fond`).
*/
type Item = any;
type Short = {n: number; titre: string; beats: number[]; accroche: [number, number]; question: string; fond: number};
const FPS = tl.fps;
const BEATS: Item[] = (tl.items as Item[]).filter((o) => o.kind === 'beat');
const NOMS: Record<string, string> = (tl as any).noms;
const SHORTS: Short[] = (tl as any).shorts;
const FEMININ = new Set(['NADIA', 'LOUNA', 'ELISE']);
const JAUNE = '#ffcf3f', ROUGE = '#ff2d4b', ENCRE = '#1a0f30';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const pop = (t: number, t0: number, d = 9, s = 170) => spring({frame: Math.max(0, (t - t0) * FPS), fps: FPS, config: {damping: d, stiffness: s}});
const FIN_CARTE = 3.6; // secondes de carte de fin
const FLASH = 1.0; // durée du bandeau « ⏪ … PLUS TÔT »

/** découpage du short n : accroche [0, A), scène [A, A + L), carte de fin [A + L, duree) */
export const bornesShort = (n: number) => {
  const s = SHORTS.find((x) => x.n === n)!;
  const a = BEATS.find((b) => b.i === s.beats[0])!;
  const z = BEATS.find((b) => b.i === s.beats[s.beats.length - 1])!;
  const debut = Math.max(0, a.start - 0.2);
  const fin = z.end + 0.3;
  const A = s.accroche[1] - s.accroche[0];
  const L = fin - debut;
  return {s, debut, fin, A, L, duree: A + L + FIN_CARTE};
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

const nomDuPlan = (b: Item) => (b.shot === 'camera' ? 'LE_J' : b.shot === 'meneur' ? 'MENEUR' : b.who);

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
    <div style={{position: 'absolute', left: 60, right: 130, top: 1290, textAlign: 'center'}}>
      <span style={{display: 'inline-block', transform: `scale(${0.7 + 0.3 * s})`, fontFamily: 'ID', fontSize: 108, color: '#fff',
        WebkitTextStroke: '16px #000', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>{word.toLowerCase().replace(/^[jm]$/, (c) => c.toUpperCase())}</span>
    </div>
  );
};

/** image de fond (16:9 agrandie, centre) avec zoom de « changement de plan » */
const Fond: React.FC<{s: Short; t0: number; zoom: number; flou?: boolean}> = ({s, t0, zoom, flou}) => {
  const H = 1340, W = Math.round(H * 16 / 9), HAUT = 330;
  const trim = Math.max(0, Math.round(t0 * FPS) - (s.fond - 1));
  const src = staticFile(`ep02/shorts/${String(s.n).padStart(2, '0')}.mp4`);
  return (
    <>
      <OffthreadVideo src={src} muted trimBefore={trim} style={{position: 'absolute', height: 1920, width: 3413, left: (1080 - 3413) / 2, top: 0,
        filter: 'blur(30px) brightness(0.4)'}} />
      <div style={{position: 'absolute', left: 0, top: HAUT, width: 1080, height: H, overflow: 'hidden'}}>
        <OffthreadVideo src={src} muted trimBefore={trim} style={{position: 'absolute', height: H, width: W, left: (1080 - W) / 2, top: 0,
          transform: `scale(${zoom})`, transformOrigin: '50% 38%', filter: flou ? 'blur(16px) brightness(0.45)' : 'none'}} />
      </div>
    </>
  );
};

/** zoom de la scène : un cadrage différent par réplique + coup de zoom sur les bruitages et au milieu des longues répliques */
const zoomA = (t: number, s: Short) => {
  const b = BEATS.find((x) => t >= x.start && t < x.end && s.beats.includes(x.i));
  if (!b) return 1.05;
  const k = s.beats.indexOf(b.i);
  let z = k % 2 === 0 ? 1.0 : 1.14;
  if (b.end - b.start > 5 && t > (b.start + b.end) / 2) z += 0.08;
  if (b.sfx) z += 0.07 * pop(t, b.vstart, 12, 220) * interpolate(t, [b.vstart + 0.6, b.vstart + 1.2], [1, 0], clamp);
  return z;
};

const Bandeaux: React.FC<{s: Short; t: number}> = ({s, t}) => {
  const b = BEATS.find((x) => t >= x.start && t < x.end && s.beats.includes(x.i));
  if (!b) return null;
  const nom = nomDuPlan(b);
  return (
    <>
      {NOMS[nom] && t - b.start < 2.6 && (
        <div style={{position: 'absolute', left: 60, top: 1170, transform: `translateX(${(1 - pop(t, b.start + 0.1, 12, 200)) * -500}px)`,
          background: JAUNE, color: ENCRE, fontFamily: 'ID', fontSize: 52, padding: '6px 26px', borderRadius: 14}}>{NOMS[nom]}</div>
      )}
      {b.elimine && t > b.vstart + 0.1 && (
        <div style={{position: 'absolute', left: 540, top: 900, transform: `translate(-50%,-50%) scale(${pop(t, b.vstart + 0.1)}) rotate(-5deg)`,
          background: ROUGE, color: '#fff', fontFamily: 'ID', fontSize: 70, padding: '10px 40px', borderRadius: 24, border: '8px solid #fff', whiteSpace: 'nowrap'}}>
          {NOMS[b.elimine]} · ÉLIMINÉ{FEMININ.has(b.elimine) ? 'E' : ''}</div>
      )}
      <Mots b={b} t={t} />
    </>
  );
};

export const ShortLoupGarou: React.FC<{n: number}> = ({n}) => {
  const ready = useFonts();
  const {s, debut, A, L} = bornesShort(n);
  const f = useCurrentFrame();
  const lt = f / FPS;
  const phase = lt < A ? 'accroche' : lt < A + L ? 'scene' : 'fin';
  const tEp = phase === 'accroche' ? s.accroche[0] + lt : debut + (lt - A); // temps dans l'épisode
  const ilYa = Math.max(5, Math.round((s.accroche[0] - debut) / 5) * 5);
  const lc = lt - (A + L); // temps dans la carte de fin
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {/* images */}
      <Sequence durationInFrames={Math.round(A * FPS)}>
        <Fond s={s} t0={s.accroche[0]} zoom={1.12 + 0.05 * (lt / A)} />
      </Sequence>
      <Sequence from={Math.round(A * FPS)} durationInFrames={Math.round(L * FPS)}>
        <Fond s={s} t0={debut} zoom={zoomA(tEp, s)} />
      </Sequence>
      <Sequence from={Math.round((A + L) * FPS)}>
        <Freeze frame={Math.round(L * FPS) - 4}><Fond s={s} t0={debut} zoom={1.1} flou /></Freeze>
      </Sequence>

      {/* son : accroche puis scène, baisse sur la carte de fin */}
      <Sequence durationInFrames={Math.round(A * FPS)}>
        <Audio src={staticFile('ep02/audio.mp3')} trimBefore={Math.round(s.accroche[0] * FPS)} />
      </Sequence>
      <Sequence from={Math.round(A * FPS)}>
        <Audio src={staticFile('ep02/audio.mp3')} trimBefore={Math.round(debut * FPS)}
          volume={(fr) => interpolate(fr / FPS, [L, L + 1.5], [1, 0.2], clamp)} />
      </Sequence>

      {ready && phase !== 'fin' && (
        <>
          {/* titre-accroche : présent dès la 1re image, tout le short */}
          <div style={{position: 'absolute', top: 160, left: 50, right: 130, textAlign: 'center'}}>
            <div style={{display: 'inline-block', background: JAUNE, color: ENCRE, fontFamily: 'ID', fontSize: 60, lineHeight: 1.1, padding: '16px 30px',
              borderRadius: 26, border: `7px solid ${ENCRE}`, boxShadow: `0 12px 0 ${ENCRE}`,
              transform: `rotate(-2deg) scale(${0.88 + 0.12 * pop(lt, 0, 10, 160)})`}}>{s.titre.toUpperCase()}</div>
          </div>
          <Bandeaux s={s} t={tEp} />
          {phase === 'accroche' && (
            <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 220px 60px rgba(255,20,50,0.45)'}} />
          )}
          {/* retour en arrière */}
          {phase === 'scene' && lt - A < FLASH && (
            <>
              <AbsoluteFill style={{background: '#fff', opacity: interpolate(lt - A, [0, 0.25], [0.85, 0], clamp)}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: 1040, textAlign: 'center',
                opacity: interpolate(lt - A, [FLASH - 0.2, FLASH], [1, 0], clamp)}}>
                <span style={{display: 'inline-block', background: ENCRE, color: '#fff', fontFamily: 'ID', fontSize: 64, padding: '14px 36px', borderRadius: 20,
                  border: `6px solid ${JAUNE}`, transform: `scale(${pop(lt, A, 10, 220)}) rotate(2deg)`}}>⏪ {ilYa} SECONDES PLUS TÔT</span>
              </div>
            </>
          )}
        </>
      )}

      {/* carte de fin : boucle ouverte + question + abonnement */}
      {ready && phase === 'fin' && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 130px 200px 60px'}}>
          <div style={{transform: `scale(${pop(lc, 0, 8, 160)}) rotate(-3deg)`}}>
            <div style={{fontFamily: 'ID', fontSize: 116, color: JAUNE, WebkitTextStroke: `16px ${ENCRE}`, paintOrder: 'stroke fill', lineHeight: 1}}>LA SUITE ?</div>
            <div style={{marginTop: 30, fontFamily: 'ID', fontSize: 54, color: '#fff', WebkitTextStroke: `10px ${ENCRE}`, paintOrder: 'stroke fill', lineHeight: 1.15}}>
              {s.question}</div>
          </div>
          <div style={{marginTop: 46, display: 'inline-block', background: '#fff', color: ENCRE, fontFamily: 'ID', fontSize: 44, padding: '12px 30px', borderRadius: 20,
            opacity: interpolate(lc, [0.5, 0.8], [0, 1], clamp)}}>▶ ÉPISODE COMPLET : LIEN 👇</div>
          <div style={{marginTop: 36, display: 'flex', alignItems: 'center', gap: 16, background: ROUGE, color: '#fff', fontFamily: 'ID', fontSize: 58,
            padding: '18px 46px', borderRadius: 60, boxShadow: '0 10px 0 #9a0022',
            transform: `scale(${pop(lc, 1.0, 7, 180) * (1 + 0.04 * Math.sin(lc * 8))})`}}>
            <svg width="56" height="56" viewBox="0 0 24 24" style={{transform: `rotate(${12 * Math.sin(lc * 14)}deg)`}}>
              <path d="M12 2a6 6 0 0 0-6 6v4l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0" fill="#fff" /></svg>ABONNE-TOI</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
