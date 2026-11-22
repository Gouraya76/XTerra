import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import tl from './ep01.json';
import {Bureau, Desk, Garage, Rayons, Ville} from './decors';
import {COLOR, FPS, lineAt, LINES, Perso} from './perso';

const W = 1920, H = 1080;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SC = Object.fromEntries(tl.scenes.map((s) => [s.name, s]));
const L = (i: number) => LINES[i];
const sp = (t: number, t0: number, damping = 12, stiffness = 120) => (t < t0 ? 0 : spring({frame: (t - t0) * FPS, fps: FPS, config: {damping, stiffness}}));

const FONTS = [['ID', 'fonts/InterDisplay-Black.otf'], ['IT', 'fonts/Inter-ExtraBold.otf']];
const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FONTS.map(([n, f]) => new FontFace(n, `url(${staticFile(f)})`).load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(h));
  }, [h]);
};

// ---------- caméra ----------
type Cam = {x: number; y: number; z: number};
const POS: Record<string, Record<string, number>> = {
  garage: {ZIGO: 520, ORI: 940, PIMENT: 1400},
  garage2: {ZIGO: 560, ORI: 960, PIMENT: 1360},
};
const camTarget = (scene: string, t: number): Cam => {
  const s = SC[scene];
  if (scene === 'ville') {
    const p = interpolate(t, [s.start, s.end], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    return {x: 960, y: interpolate(p, [0, 1], [540, 690]), z: interpolate(p, [0, 1], [1, 1.55])};
  }
  if (scene === 'prune') {
    const base = {x: 960, y: 520, z: interpolate(t, [s.start, s.end], [1.02, 1.22], clamp)};
    if (t > L(13).start + 2.6) return {x: 960, y: 330, z: 1.9};
    return base;
  }
  const pos = POS[scene];
  if (!pos) return {x: 960, y: 540, z: 1};
  // gags : zooms secs
  if (scene === 'garage' && t >= L(7).start && t < L(7).start + L(7).dur) return {x: pos.PIMENT, y: 470, z: 1.75};
  if (scene === 'garage' && t >= L(8).start - 0.1 && t < L(8).start + L(8).dur + 0.15) return {x: pos.ZIGO, y: 470, z: 1.65};
  if (scene === 'garage2' && t >= L(15).start - 0.2 && t < L(15).start + L(15).dur + 0.3) {
    return {x: pos.ORI, y: 500, z: interpolate(t, [L(15).start, L(15).start + L(15).dur], [1.3, 1.6], clamp)};
  }
  if (scene === 'garage2' && t >= L(17).start - 0.1) return {x: 960, y: 560, z: 1.02};
  // sinon : on suit celui qui parle (ou la dernière personne qui a parlé)
  let who = '';
  for (const l of LINES) if (l.scene === scene && l.start - 0.25 <= t) who = l.who.split('+')[0];
  if (scene === 'garage' && t < L(5).start - 0.9) return {x: who ? (pos[who] + 730) / 2 : 730, y: 600, z: 1.22};
  if (!who || pos[who] === undefined) return {x: 960, y: 560, z: 1.05};
  return {x: (pos[who] + 960) / 2, y: 580, z: 1.18};
};
const camAt = (scene: string, t: number): Cam => {
  const n = 9; let x = 0, y = 0, z = 0;
  for (let k = 0; k < n; k++) {
    const c = camTarget(scene, Math.max(SC[scene].start, t - k * 0.04)); x += c.x; y += c.y; z += c.z;
  }
  return {x: x / n, y: y / n, z: z / n};
};
const shakeAt = (t: number) => {
  const hits = [L(5).start - 0.9, L(17).start, L(11).start + L(11).dur - 0.6];
  let a = 0;
  for (const h of hits) if (t >= h && t < h + 0.45) a = Math.max(a, 18 * (1 - (t - h) / 0.45));
  const f = Math.floor(t * FPS);
  return {dx: (random(`sx${f}`) - 0.5) * 2 * a, dy: (random(`sy${f}`) - 0.5) * 2 * a};
};

const Stage: React.FC<{cam: Cam; t: number; children: React.ReactNode}> = ({cam, t, children}) => {
  const z = cam.z;
  const x = Math.min(Math.max(cam.x, W / 2 / z), W - W / 2 / z);
  const y = Math.min(Math.max(cam.y, H / 2 / z), H - H / 2 / z);
  const s = shakeAt(t);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: W, height: H, transformOrigin: '0 0',
        transform: `translate(${W / 2 + s.dx}px, ${H / 2 + s.dy}px) scale(${z}) translate(${-x}px, ${-y}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- scènes ----------
const SceneVille: React.FC<{t: number}> = ({t}) => (
  <Stage cam={camAt('ville', t)} t={t}>
    <Ville t={t} />
    <Perso who="ZIGO" x={850} y={905} h={190} t={t} />
    <Perso who="ORI" x={960} y={900} h={200} t={t} />
    <Perso who="PIMENT" x={1070} y={905} h={190} t={t} />
  </Stage>
);

const SceneGarage: React.FC<{t: number}> = ({t}) => {
  const s = SC.garage, P = POS.garage;
  const zIn = sp(t, s.start + 0.1, 11, 140);
  const zigoX = interpolate(zIn, [0, 1], [-300, P.ZIGO]);
  const zigoJump = t > s.start + 0.1 && t < s.start + 0.6 ? -Math.sin(((t - s.start - 0.1) / 0.5) * Math.PI) * 180 : 0;
  const t0 = L(5).start - 0.9;
  const pIn = sp(t, t0, 9, 160);
  const pimentX = interpolate(pIn, [0, 1], [2300, P.PIMENT]);
  const lean = t > t0 && t < t0 + 0.6 ? interpolate(t, [t0, t0 + 0.25, t0 + 0.6], [-14, 8, 0]) : 0;
  const surprise = t > t0 && t < t0 + 0.5 ? -Math.sin(((t - t0) / 0.5) * Math.PI) * 50 : 0;
  return (
    <Stage cam={camAt('garage', t)} t={t}>
      <Garage t={t} />
      {t > t0 && t < t0 + 0.7 && <Dust x={P.PIMENT + 120} y={1000} p={(t - t0) / 0.7} />}
      <Perso who="ORI" x={P.ORI} y={1010} h={640} t={t} dy={surprise} />
      <Perso who="ZIGO" x={zigoX} y={1010} h={630} t={t} dy={zigoJump + surprise * 0.8} />
      <Perso who="PIMENT" x={pimentX} y={1010} h={640} t={t} rot={lean} />
      {t >= L(8).start - 0.05 && t < L(8).start + 0.9 && <Bubble x={P.ZIGO + 110} y={330} t={t - L(8).start} text="!" color="#7ed321" />}
    </Stage>
  );
};

const ScenePrune: React.FC<{t: number}> = ({t}) => {
  const th = L(11).start + L(11).dur - 0.6;
  const flash = t >= th ? Math.max(0, Math.exp(-(t - th) * 6) + (t > th + 0.18 && t < th + 0.3 ? 0.7 : 0)) : 0;
  const towerP = interpolate(t, [L(12).start + 1.0, L(12).start + 3.4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const laugh = t > L(11).start + L(11).dur - 1.3 && t < L(11).start + L(11).dur + 0.3 ? Math.sin(t * 40) * 6 : 0;
  return (
    <Stage cam={camAt('prune', t)} t={t}>
      <Bureau t={t} flash={Math.min(1, flash)} towerP={towerP} />
      <Perso who="PRUNE" x={960} y={1090} h={940} t={t} dy={laugh} shadow={false} />
      <Desk />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, rgba(181,108,255,0) 40%, rgba(60,0,90,0.45) 100%)'}} />
    </Stage>
  );
};

const SceneGarage2: React.FC<{t: number}> = ({t}) => {
  const P = POS.garage2;
  const sad = t >= L(14).start && t < L(14).start + L(14).dur + 0.3;
  const non = L(17).start;
  const jump = t >= non && t < non + 0.5 ? -Math.sin(((t - non) / 0.5) * Math.PI) * 90 : 0;
  const glow = t >= L(15).start ? interpolate(t, [L(15).start, L(15).start + 1, L(15).start + L(15).dur, L(15).start + L(15).dur + 0.6], [0, 1, 1, 0], clamp) : 0;
  return (
    <Stage cam={camAt('garage2', t)} t={t}>
      <Garage t={t} />
      <div style={{position: 'absolute', left: P.ORI - 500, top: 100, width: 1000, height: 900, opacity: glow,
        background: 'radial-gradient(circle, rgba(255,230,150,0.55) 0%, rgba(255,230,150,0) 60%)'}} />
      <Perso who="ZIGO" x={P.ZIGO} y={1010} h={630} t={t} sy={t >= non ? 0.9 : 1} />
      <Perso who="ORI" x={P.ORI} y={1010} h={640} t={t} dy={jump} />
      <Perso who="PIMENT" x={P.PIMENT} y={1010} h={640} t={t} dy={jump} sy={sad ? 0.9 : 1} rot={sad ? -7 : 0} />
      {t >= non && <BigWord t={t - non} text="NON !" />}
    </Stage>
  );
};

const Dust: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => (
  <>{Array.from({length: 7}, (_, i) => (
    <div key={i} style={{position: 'absolute', left: x + i * 40 * p + random(`d${i}`) * 60, top: y - 40 - random(`e${i}`) * 50 * p,
      width: 70 + 80 * p, height: 70 + 80 * p, borderRadius: '50%', background: 'rgba(210,200,190,0.5)', filter: 'blur(10px)', opacity: 1 - p}} />
  ))}</>
);

const Bubble: React.FC<{x: number; y: number; t: number; text: string; color: string}> = ({x, y, t, text, color}) => {
  const s = spring({frame: t * FPS, fps: FPS, config: {damping: 8, stiffness: 200}});
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, width: 110, height: 110, borderRadius: '50%',
      background: '#fff', border: `8px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'ID', fontSize: 80, color, boxShadow: '0 8px 20px rgba(0,0,0,0.4)'}}>{text}</div>
  );
};

const BigWord: React.FC<{t: number; text: string}> = ({t, text}) => {
  const s = spring({frame: t * FPS, fps: FPS, config: {damping: 7, stiffness: 220}});
  return (
    <div style={{position: 'absolute', left: 960, top: 300, transform: `translate(-50%,-50%) scale(${s * 1.1}) rotate(-6deg)`,
      fontFamily: 'ID', fontSize: 260, color: '#ffd23f', WebkitTextStroke: '14px #1a0a00', paintOrder: 'stroke fill', letterSpacing: -4,
      textShadow: '0 16px 0 rgba(0,0,0,0.35)', whiteSpace: 'nowrap'}}>{text}</div>
  );
};

const SceneTitre: React.FC<{t: number}> = ({t}) => {
  const letters = 'BORZ'.split('');
  const colors = ['#ffffff', '#7ed321', '#ff3b30', '#ffffff'];
  return (
    <AbsoluteFill>
      <Rayons t={t} c1="#140a24" c2="#2c1650" />
      <div style={{position: 'absolute', top: 70, width: W, textAlign: 'center'}}>
        {letters.map((c, i) => {
          const s = sp(t, 0.5 + i * 0.12, 8, 180);
          return <span key={i} style={{display: 'inline-block', fontFamily: 'ID', fontSize: 300, lineHeight: 1, color: colors[i],
            WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', transform: `scale(${s}) rotate(${(1 - s) * 30}deg)`, margin: '0 6px',
            textShadow: '0 14px 0 rgba(0,0,0,0.4)'}}>{c}</span>;
        })}
      </div>
      <div style={{position: 'absolute', top: 400, width: W, textAlign: 'center', opacity: interpolate(t, [1.3, 1.7], [0, 1], clamp),
        transform: `translateY(${interpolate(t, [1.3, 1.7], [30, 0], clamp)}px)`}}>
        <span style={{fontFamily: 'ID', fontSize: 56, color: '#140a24', background: '#ffd23f', padding: '10px 34px', borderRadius: 14, letterSpacing: 2}}>ÉPISODE 1 · LE GRAND DÉFI</span>
      </div>
      <Perso who="ZIGO" x={interpolate(sp(t, 0.9), [0, 1], [-200, 560])} y={1150} h={600} t={t} />
      <Perso who="ORI" x={960} y={interpolate(sp(t, 1.1), [0, 1], [1800, 1180])} h={640} t={t} />
      <Perso who="PIMENT" x={interpolate(sp(t, 1.0), [0, 1], [2200, 1360])} y={1150} h={600} t={t} />
    </AbsoluteFill>
  );
};

const SECONDAIRES = ['KENZO', 'LOLA', 'TANK', 'SKATTY', 'PAPI', 'NINO', 'ZARA', 'ROCCO', 'NOVA', 'PRUNE'];
const SceneFin: React.FC<{t: number}> = ({t}) => {
  const s0 = SC.fin.start, lt = t - s0;
  return (
    <AbsoluteFill>
      <Rayons t={t} c1="#0f1d0a" c2="#1f3a12" />
      <div style={{position: 'absolute', top: 40, width: W, textAlign: 'center', fontFamily: 'ID', fontSize: 120, color: '#fff',
        WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', transform: `scale(${sp(lt, 0.2, 9, 160)})`}}>À SUIVRE…</div>
      {SECONDAIRES.map((w, i) => {
        const s = sp(lt, 1.2 + i * 0.22, 9, 180);
        return <Perso key={w} who={w} x={150 + i * 180} y={700} h={340 * s} t={t} opacity={s > 0.01 ? 1 : 0} />;
      })}
      <Perso who="ZIGO" x={720} y={1075} h={430} t={t} />
      <Perso who="ORI" x={960} y={1075} h={450} t={t} />
      <Perso who="PIMENT" x={1200} y={1075} h={430} t={t} />
      <div style={{position: 'absolute', right: 60, bottom: 70, transform: `scale(${sp(lt, 3.6, 8, 160)})`, background: '#ff0000', color: '#fff',
        fontFamily: 'ID', fontSize: 44, padding: '18px 36px', borderRadius: 16, boxShadow: '0 10px 0 #8a0000'}}>ABONNE-TOI !</div>
      <div style={{position: 'absolute', left: 60, bottom: 80, width: 420, fontFamily: 'IT', fontWeight: 800, fontSize: 36, color: '#fff', opacity: interpolate(lt, [3.6, 4], [0, 1], clamp),
        WebkitTextStroke: '6px #000', paintOrder: 'stroke fill'}}>Aide le Quartier à battre Monsieur Prune !</div>
    </AbsoluteFill>
  );
};

const Subtitles: React.FC<{t: number}> = ({t}) => {
  const l = lineAt(t);
  if (!l) return null;
  const names = l.who.split('+');
  const label = names.map((n) => (n === 'PRUNE' ? 'M. PRUNE' : n)).join(' & ');
  return (
    <div style={{position: 'absolute', bottom: 46, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
      <div style={{fontFamily: 'ID', fontSize: 30, color: '#111', background: COLOR[names[0]] ?? '#fff', padding: '4px 16px', borderRadius: 8}}>{label}</div>
      <div style={{maxWidth: 1500, textAlign: 'center', fontFamily: 'IT', fontWeight: 800, fontSize: 48, lineHeight: 1.18, color: '#fff',
        WebkitTextStroke: '9px #000', paintOrder: 'stroke fill'}}>{l.text}</div>
    </div>
  );
};

const SCENES: Record<string, React.FC<{t: number}>> = {titre: SceneTitre, ville: SceneVille, garage: SceneGarage, prune: ScenePrune, garage2: SceneGarage2, fin: SceneFin};

export const EP01: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = tl.scenes.find((x) => t >= x.start && t < x.end) ?? tl.scenes[tl.scenes.length - 1];
  const Comp = SCENES[s.name];
  // transition « iris » façon cartoon
  const rIn = s.name === 'titre' ? 1 : interpolate(t, [s.start, s.start + 0.45], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const rOut = s.name === 'fin' ? 1 : interpolate(t, [s.end - 0.4, s.end], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const r = Math.min(rIn, rOut) * 1150;
  const fadeEnd = interpolate(t, [tl.duration - 1.2, tl.duration], [1, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{clipPath: `circle(${r}px at 50% 50%)`, opacity: fadeEnd}}>
        <Comp t={t} />
      </AbsoluteFill>
      {s.name !== 'titre' && s.name !== 'fin' && <Subtitles t={t} />}
      <Audio src={staticFile('ep01/audio.mp3')} />
    </AbsoluteFill>
  );
};
