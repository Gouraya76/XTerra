import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import tl from '../ep01.json';
import {Perso3D, Pose} from './Perso3D';
import {CouloirCoulisses, CuisineEpreuve, EclairagePlateau, fondPlateau, PlateauTV, SalleDegustation, SPOTS_COULISSES, SPOTS_CUISINE, SPOTS_DEGUSTATION, SPOTS_PLATEAU} from './Plateau3D';

type V3 = [number, number, number];
type Item = any;
type Cam = {pos: V3; target: V3; fov: number};
const FPS = tl.fps;
const ITEMS: Item[] = tl.items as Item[];
const BEATS: Item[] = ITEMS.filter((o) => o.kind === 'beat');
const CANDIDATS = ['MARCEL', 'YASMINE', 'BRUNO', 'JULES', 'COLETTE'];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const S: any = SPOTS_PLATEAU, SC: any = SPOTS_CUISINE, SD: any = SPOTS_DEGUSTATION, SK: any = SPOTS_COULISSES;

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([['ID', 'fonts/InterDisplay-Black.otf'], ['IT', 'fonts/Inter-ExtraBold.otf']].map(([n, f]) =>
      new FontFace(n, `url(${staticFile(f)})`).load().then((ff) => document.fonts.add(ff)))).then(() => { setReady(true); continueRender(h); });
  }, [h]);
  return ready;
};

// ------------- qui est où -------------
const lumiereOf = (b: Item): 'normal' | 'suspense' | 'revelation' => {
  let l: any = 'normal';
  for (const x of BEATS) { if (x.i > b.i) break; if (x.lumiere) l = x.lumiere; }
  return l;
};
const ecranOf = (b: Item) => { let e = 'QUI EST LE VRAI CHEF ?'; for (const x of BEATS) { if (x.i > b.i) break; if (x.ecran) e = x.ecran; } return e; };
/** candidats éliminés AVANT cette réplique (ils ont quitté le plateau) */
const partis = (b: Item): number[] => {
  const el: number[] = b.elimines ?? [];
  const avant = b.elimine !== undefined ? el.slice(0, -1) : el;
  return avant.filter((k) => k !== 4 && k !== 1);
};
const castOf = (b: Item): Record<string, V3> => {
  const pos: Record<string, V3> = {};
  const restants = CANDIDATS.filter((_, k) => !partis(b).includes(k));
  if (b.scene === 'plateau') {
    pos.SACHA = S.presentateur; pos.LEO = S.enqueteur_1; pos.INES = S.enqueteur_2;
    CANDIDATS.forEach((c, k) => { if (restants.includes(c)) pos[c] = S[`candidat_${k + 1}`]; });
  } else if (b.scene === 'cuisine') {
    pos.SACHA = SC.presentateur ?? add(SC.poste_1, [0, 0, 5]);
    CANDIDATS.forEach((c, k) => { if (restants.includes(c)) pos[c] = SC[`poste_${k + 1}`]; });
  } else if (b.scene === 'degustation') {
    pos.SACHA = add(SD.centre, [-7.5, 0, 0.5]);
    const r = restants.filter((c) => c !== 'MARCEL' && c !== 'BRUNO');
    r.forEach((c, k) => { pos[c] = SD[`place_${k + 1}`] ?? add(SD.centre, [(k - (r.length - 1) / 2) * 2.6, 0, -1.4]); });
  } else if (b.scene === 'coulisses') {
    const names = b.act ? Object.keys(b.act).filter((n) => CANDIDATS.includes(n)) : [b.who];
    names.forEach((n, k) => { pos[n] = add(SK.centre, [(k - (names.length - 1) / 2) * 2.3, 0, 0]); });
  }
  return pos;
};

// ------------- caméra -------------
const camFrom = (c: any): Cam => ({pos: c.pos, target: c.target, fov: 40});
const drift = (c: Cam, k: number, amt = 0.08): Cam => {
  const d = sub(c.target, c.pos);
  return {...c, pos: add(c.pos, [d[0] * amt * k - k * 0.6, 0, d[2] * amt * k])};
};
const camFor = (b: Item, t: number, pos: Record<string, V3>): Cam => {
  const k = Math.min(1, Math.max(0, (t - b.start) / Math.max(1, b.end - b.start)));
  const shot: string = b.shot;
  const face = shot.match(/^([A-Z]+)_face$/);
  const closeOn = (p: V3): Cam => {
    const ref = b.scene === 'coulisses' ? SK.cam_large : b.scene === 'cuisine' ? SC.cam_large : b.scene === 'degustation' ? SD.cam_large : S.cam_large;
    const toward = sub(ref?.pos ?? [0, 5, 20], p);
    const n = Math.hypot(toward[0], toward[2]) || 1;
    const dir: V3 = [toward[0] / n, 0, toward[2] / n];
    const side = hash(b.text) % 2 ? 0.9 : -0.9;
    return {pos: add(p, [dir[0] * (4.6 - k * 0.6) + dir[2] * side, 2.85, dir[2] * (4.6 - k * 0.6) - dir[0] * side]), target: add(p, [0, 2.45, 0]), fov: 38};
  };
  if (face) return closeOn(pos[face[1]] ?? [0, 0, 0]);
  if (b.scene === 'coulisses') return shot === 'large' ? drift(camFrom(SK.cam_large), k) : closeOn(pos[b.who] ?? SK.centre);
  if (b.scene === 'cuisine') {
    const m = shot.match(/^poste_(\d)$/);
    if (m) return drift(camFrom(SC[`cam_poste_${m[1]}`] ?? SC.cam_large), k, 0.05);
    return drift(camFrom(SC.cam_large), k);
  }
  if (b.scene === 'degustation') return drift(camFrom(SD.cam_large), k);
  const m = shot.match(/^candidat_(\d)$/);
  if (m) return drift(camFrom(S[`cam_candidat_${m[1]}`]), k, 0.07);
  const map: Record<string, string> = {large: 'cam_large', presentateur: 'cam_presentateur', enqueteurs: 'cam_enqueteurs', candidats: 'cam_candidats', face_a_face: 'cam_face_a_face'};
  return drift(camFrom(S[map[shot] ?? 'cam_large']), k);
};
const CamCtl: React.FC<{cam: Cam}> = ({cam}) => {
  const {camera} = useThree();
  const pc = camera as THREE.PerspectiveCamera;
  pc.position.set(...cam.pos); pc.fov = cam.fov; pc.near = 0.1; pc.far = 500; pc.lookAt(...cam.target); pc.updateProjectionMatrix();
  return null;
};

// ------------- jeu d'acteur -------------
const talkOf = (who: string, b: Item, t: number) => {
  if (!b.who.split('+').includes(who)) return 0;
  const i = Math.floor((t - b.vstart) * FPS);
  if (i < 0 || i >= b.env.length) return 0;
  return ((b.env[i - 1] ?? 0) + 2 * b.env[i] + (b.env[i + 1] ?? 0)) / 4;
};
const actOf = (b: Item, who: string): string | undefined => (b.act ? b.act[who] ?? b.act.ALL : undefined);

const play = (b: Item, who: string, base: V3, t: number, cam: Cam, pos: Record<string, V3>) => {
  const talk = talkOf(who, b, t);
  const seed = hash(who) % 100;
  const speaker = b.who.split('+')[0];
  // orientation : vers celui qui parle, sinon 3/4 caméra
  const target = who !== speaker && pos[speaker] ? pos[speaker] : cam.pos;
  let rot = Math.atan2(target[0] - base[0], target[2] - base[2]);
  if (who === speaker) rot = rot * 0.6 + Math.atan2(cam.pos[0] - base[0], cam.pos[2] - base[2]) * 0.4;
  if (b.scene === 'coulisses') rot = Math.atan2(cam.pos[0] - base[0], cam.pos[2] - base[2]);
  const baseRot = b.scene === 'plateau' ? (CANDIDATS.includes(who) ? S[`rot_candidat_${CANDIDATS.indexOf(who) + 1}`] : who === 'LEO' || who === 'INES' ? S.rot_enqueteurs : undefined) : b.scene === 'cuisine' && CANDIDATS.includes(who) ? 0 : undefined;
  if (baseRot !== undefined) {
    let d = rot - baseRot; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    rot = baseRot + Math.max(-0.55, Math.min(0.55, d));
  }
  const pose: Pose = {talk, blink: ((t * 0.37 + seed * 0.13) % 3.3) < 0.08 ? 1 : 0, brows: talk > 0.55 ? 0.35 : 0, headTurn: Math.sin(t * 0.8 + seed) * 0.07};
  let p = base;
  const a = actOf(b, who);
  const lt = t - b.start;
  switch (a) {
    case 'accueil': pose.armL = 2.2; pose.armR = 2.2; pose.armSideL = 0.7; pose.armSideR = 0.7; pose.bob = Math.abs(Math.sin(t * 5)) * 0.08; break;
    case 'pointe': pose.armR = 1.6; pose.brows = 0.5; break;
    case 'salut': case 'coucou': pose.armR = 2.8 + Math.sin(t * 10) * 0.25; pose.armSideR = 0.3 + Math.sin(t * 10) * 0.2; break;
    case 'sceptique': pose.brows = -0.8; pose.smile = 0.2; pose.headTilt = 0.08; pose.look = [0.4, 0]; break;
    case 'reflechit': pose.armR = 2.1; pose.armSideR = -0.45; pose.headTilt = 0.12; pose.brows = -0.4; pose.smile = 0.3; pose.look = [0.3, 0.6]; break;
    case 'question': pose.armR = 1.5; pose.brows = -0.5; break;
    case 'transpire': pose.squash = 0.04 + Math.abs(Math.sin(t * 20)) * 0.04; pose.brows = 1; pose.armL = 0.6; break;
    case 'facepalm': pose.armR = 2.7; pose.armSideR = -0.5; pose.headTilt = 0.25; pose.smile = 0.3; break;
    case 'rire': pose.bob = Math.abs(Math.sin(t * 13)) * 0.1; pose.headTilt = -0.18; pose.talk = Math.max(talk, 0.5 + 0.4 * Math.sin(t * 18)); break;
    case 'fier': case 'muscles': pose.armL = 2.0; pose.armR = 2.0; pose.armSideL = 1.2; pose.armSideR = 1.2; pose.headTilt = -0.12; break;
    case 'nerveux': pose.bob = Math.abs(Math.sin(t * 16)) * 0.04; pose.brows = 0.8; pose.look = [Math.sin(t * 3) * 0.8, 0]; pose.armL = 0.8; break;
    case 'serieuse': pose.smile = 0.25; pose.brows = -0.2; break;
    case 'sourit': pose.smile = 1; pose.headTilt = 0.06; break;
    case 'triste': pose.smile = 0.1; pose.headTilt = 0.28; pose.brows = -0.2; pose.look = [0, -0.8]; break;
    case 'revele': pose.armSideL = 0.9; pose.armSideR = 0.9; pose.armL = 0.4; pose.armR = 0.4; pose.brows = 0.6; break;
    case 'coupe_vite': pose.armR = 0.9 + Math.abs(Math.sin(t * 22)) * 0.5; pose.armL = 0.8; pose.headTilt = 0.25; pose.brows = -0.6; pose.smile = 0.2; break;
    case 'frappe': pose.armR = lt % 0.6 < 0.3 ? 2.6 : 0.6; pose.brows = -1; pose.squash = lt % 0.6 < 0.3 ? 0 : 0.08; break;
    case 'pleure': pose.headTilt = 0.2; pose.blink = 0.8; pose.armL = 2.4; pose.armSideL = -0.4; pose.bob = Math.abs(Math.sin(t * 9)) * 0.05; break;
    case 'tranquille': pose.armR = 0.9 + Math.sin(t * 4) * 0.15; pose.smile = 1; pose.headTilt = 0.15; break;
    case 'goute': pose.armR = lt % 3 < 1.4 ? 2.4 : 0.5; pose.armSideR = -0.3; pose.blink = lt % 3 > 1 && lt % 3 < 2 ? 0.9 : 0; break;
    case 'emue': pose.headTilt = 0.15; pose.smile = 0.6; pose.blink = Math.abs(Math.sin(t * 0.8)) > 0.97 ? 1 : 0.25; pose.armL = 1.0; break;
    case 'accord': pose.headTilt = Math.sin(t * 6) * 0.12; break;
    case 'cheer': pose.bob = Math.abs(Math.sin(t * 7 + seed)) * 0.35; pose.armL = 2.9; pose.armR = 2.9; pose.armSideL = 0.3; pose.armSideR = 0.3; pose.talk = Math.max(talk, 0.4); break;
  }
  return {p, rot, pose};
};

const Public: React.FC<{b: Item; t: number}> = ({b, t}) => {
  if (b.scene !== 'plateau' || !S.public) return null;
  const clap = b.act?.PUBLIC === 'applaudit' || lumiereOf(b) === 'revelation';
  return <>{(S.public as V3[]).map((p, i) => (
    <Perso3D key={i} who={['PUBLIC1', 'PUBLIC2', 'PUBLIC3', 'PUBLIC4'][i % 4]} position={p} rotation={Math.atan2(-p[0], -p[2])}
      pose={clap ? {armL: 1.3 + Math.abs(Math.sin(t * 14 + i)) * 0.3, armR: 1.3 + Math.abs(Math.sin(t * 14 + i)) * 0.3, armSideL: -0.25, armSideR: -0.25, bob: Math.abs(Math.sin(t * 7 + i)) * 0.06} : {}} />
  ))}</>;
};

const Scene3D: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const pos = castOf(b);
  const cam = camFor(b, t, pos);
  const lum = lumiereOf(b);
  const elim = b.elimines ?? [];
  return (
    <>
      <CamCtl cam={cam} />
      {/* lumière de face « plateau TV » qui suit la caméra : visages toujours bien éclairés */}
      <pointLight position={add(cam.pos, [0.5, 1.2, 0])} intensity={45} distance={30} decay={2} color="#fff1e0" />
      <EclairagePlateau mode={b.scene === 'coulisses' ? 'suspense' : lum} />
      {b.scene === 'plateau' && <PlateauTV t={t} ecran={ecranOf(b)} elimines={elim.filter((k: number) => k !== 1 || lum !== 'revelation')} lumiere={lum} />}
      {b.scene === 'cuisine' && <CuisineEpreuve t={t} />}
      {b.scene === 'degustation' && <SalleDegustation t={t} />}
      {b.scene === 'coulisses' && <CouloirCoulisses t={t} />}
      {Object.entries(pos).map(([n, base]) => {
        const {p, rot, pose} = play(b, n, base, t, cam, pos);
        return <Perso3D key={n} who={n} position={p} rotation={rot} pose={pose} />;
      })}
      <Public b={b} t={t} />
    </>
  );
};

// ------------- habillage TV -------------
const pop = (t: number, t0: number, d = 9, s = 170) => spring({frame: Math.max(0, (t - t0) * FPS), fps: FPS, config: {damping: d, stiffness: s}});

const Logo: React.FC = () => (
  <div style={{position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(20,10,40,0.85)', padding: '8px 20px', borderRadius: 14, border: '3px solid #ffcf3f'}}>
    <svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 11a4 4 0 0 1 3-6 4 4 0 0 1 8 0 4 4 0 0 1 3 6v3H5z" fill="#fff" /><rect x="5" y="15" width="14" height="5" rx="1" fill="#fff" /></svg>
    <span style={{fontFamily: 'ID', fontSize: 30, color: '#fff'}}>QUI EST LE <span style={{color: '#ffcf3f'}}>VRAI CHEF</span> ?</span>
  </div>
);
const Restants: React.FC<{b: Item}> = ({b}) => {
  const el: number[] = (b.elimines ?? []).filter((k: number) => k !== 4 && k !== 1);
  return (
    <div style={{position: 'absolute', right: 40, top: 34, display: 'flex', gap: 8}}>
      {CANDIDATS.map((c, k) => (
        <div key={c} style={{width: 54, height: 54, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ID', fontSize: 30,
          background: el.includes(k) ? '#ff2d4b' : 'rgba(20,10,40,0.85)', color: '#fff', border: '3px solid rgba(255,255,255,0.25)'}}>{el.includes(k) ? '✕' : k + 1}</div>
      ))}
    </div>
  );
};
const NameTag: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const m = String(b.shot).match(/^candidat_(\d)$/);
  if (!m || b.scene !== 'plateau') return null;
  const k = +m[1]; const s = pop(t, b.start + 0.2, 12, 200);
  return (
    <div style={{position: 'absolute', left: 80, bottom: 260, transform: `translateX(${(1 - s) * -400}px)`, display: 'flex', alignItems: 'stretch'}}>
      <div style={{background: '#ffcf3f', color: '#1a0f30', fontFamily: 'ID', fontSize: 54, padding: '6px 22px', borderRadius: '14px 0 0 14px'}}>N°{k}</div>
      <div style={{background: 'rgba(20,10,40,0.92)', color: '#fff', fontFamily: 'ID', fontSize: 54, padding: '6px 28px', borderRadius: '0 14px 14px 0'}}>{CANDIDATS[k - 1]}</div>
    </div>
  );
};
const Bandeaux: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const els: React.ReactNode[] = [];
  if (b.elimine !== undefined && b.elimine !== 4) {
    const t0 = b.vstart + 0.1;
    if (t > t0) els.push(<div key="el" style={{position: 'absolute', left: 960, top: 260, transform: `translate(-50%,-50%) scale(${pop(t, t0)}) rotate(-5deg)`,
      background: '#ff2d4b', color: '#fff', fontFamily: 'ID', fontSize: 92, padding: '10px 50px', borderRadius: 24, border: '8px solid #fff', boxShadow: '0 14px 0 #7a0016'}}>ÉLIMINÉ{CANDIDATS[b.elimine] === 'MARCEL' || CANDIDATS[b.elimine] === 'BRUNO' || CANDIDATS[b.elimine] === 'JULES' ? '' : 'E'}</div>);
  }
  if (b.hud === 'RÉVÉLATION') els.push(<div key="rv" style={{position: 'absolute', left: 960, top: 90, transform: `translateX(-50%) scale(${pop(t, b.start + 0.2)})`,
    background: '#7a3cff', color: '#fff', fontFamily: 'ID', fontSize: 52, padding: '8px 36px', borderRadius: 16}}>RÉVÉLATION : {b.who}</div>);
  if (b.hud === 'ABONNE' && t > b.vstart + 0.4) els.push(<div key="ab" style={{position: 'absolute', left: 960, bottom: 250, transform: `translateX(-50%) scale(${pop(t, b.vstart + 0.4)})`,
    display: 'flex', alignItems: 'center', gap: 16, background: '#ff1f4b', color: '#fff', fontFamily: 'ID', fontSize: 52, padding: '18px 44px', borderRadius: 60, boxShadow: '0 10px 0 #9a0022'}}>
    <svg width="50" height="50" viewBox="0 0 24 24"><path d="M12 2a6 6 0 0 0-6 6v4l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0" fill="#fff" /></svg>ABONNE-TOI</div>);
  return <>{els}</>;
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
      <span style={{display: 'inline-block', transform: `scale(${0.7 + 0.3 * s})`, fontFamily: 'ID', fontSize: 86, color: '#fff', WebkitTextStroke: '14px #000', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>{word.toLowerCase()}</span>
    </div>
  );
};
const MancheCard: React.FC<{o: Item; t: number}> = ({o, t}) => {
  const lt = t - o.start, D = o.end - o.start;
  const out = interpolate(lt, [D - 0.3, D], [1, 0], clamp);
  const [a, bb] = String(o.day).split(' : ');
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: `rgba(15,6,35,${0.55 * out})`}}>
      <div style={{transform: `scale(${pop(t, o.start + 0.1, 8, 170)})`, opacity: out, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: '#ffcf3f', color: '#1a0f30', fontFamily: 'ID', fontSize: 150, padding: '6px 60px', borderRadius: 30, border: '10px solid #1a0f30', transform: 'rotate(-3deg)'}}>{a}</div>
        <div style={{marginTop: 26, fontFamily: 'ID', fontSize: 70, color: '#fff', WebkitTextStroke: '12px #1a0f30', paintOrder: 'stroke fill'}}>{bb}</div>
      </div>
    </AbsoluteFill>
  );
};
const Titre: React.FC<{t: number}> = ({t}) => {
  if (t > 6) return null;
  const o = interpolate(t, [5.2, 6], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `scale(${pop(t, 0.3, 10, 140)})`}}>
      <div style={{fontFamily: 'ID', fontSize: 130, color: '#ffcf3f', WebkitTextStroke: '18px #1a0f30', paintOrder: 'stroke fill', lineHeight: 1}}>QUI EST LE VRAI CHEF ?</div>
      <div style={{display: 'inline-block', marginTop: 18, background: '#ff2d4b', color: '#fff', fontFamily: 'ID', fontSize: 50, padding: '10px 34px', borderRadius: 18, border: '6px solid #1a0f30'}}>5 CANDIDATS · 4 IMPOSTEURS</div>
    </div>
  );
};

export const Emission: React.FC = () => {
  const ready = useFonts();
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = f / FPS;
  const item = ITEMS.find((o) => t >= o.start && t < o.end) ?? ITEMS[ITEMS.length - 1];
  const b: Item = item.kind === 'beat' ? item : item.kind === 'daycard' ? BEATS.find((x) => x.start >= item.end - 0.01)! : BEATS[BEATS.length - 1];
  const sceneB = item.kind === 'daycard' ? {...b, shot: 'large', start: item.start, end: b.end} : b;
  const confetti = lumiereOf(b) === 'revelation';
  return (
    <AbsoluteFill style={{background: fondPlateau(b.scene === 'coulisses' ? 'suspense' : lumiereOf(b))}}>
      {ready && (
        <ThreeCanvas width={width} height={height} shadows gl={{antialias: true}} onCreated={({gl}) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
          <Scene3D b={sceneB} t={t} />
        </ThreeCanvas>
      )}
      {confetti && <Confettis t={t} />}
      <Logo />
      {b.scene === 'plateau' && <Restants b={b} />}
      {item.kind === 'beat' && <NameTag b={item} t={t} />}
      {item.kind === 'beat' && <Bandeaux b={item} t={t} />}
      {item.kind === 'beat' && <Mots b={item} t={t} />}
      {item.kind === 'daycard' && <MancheCard o={item} t={t} />}
      <Titre t={t} />
      <Audio src={staticFile('ep01/audio.mp3')} />
    </AbsoluteFill>
  );
};

const Confettis: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: 70}, (_, i) => {
      const x = (i * 137.5) % 1920, sp = 160 + (i % 7) * 40;
      const y = ((t * sp + i * 97) % 1250) - 120;
      const c = ['#ffcf3f', '#ff2d4b', '#3fd0ff', '#7a3cff', '#3fff8a', '#fff'][i % 6];
      return <div key={i} style={{position: 'absolute', left: x + Math.sin(t * 2 + i) * 30, top: y, width: 14, height: 22, background: c, transform: `rotate(${t * 200 + i * 40}deg)`, borderRadius: 3}} />;
    })}
  </AbsoluteFill>
);
