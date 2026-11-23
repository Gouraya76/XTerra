import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import tl from '../ep02.json';
import {Perso3D, Pose} from './Perso3D';
import {CielNuit, CuisineZara, Eclairage, fondCss, LaBoite, ModeLumiere, PanneauRegle3D, PlaceMairie, QGGarage, RueNuit, Skatepark} from './Decors3D';
import {Usine3D} from './Usine3D';

type V3 = [number, number, number];
type Item = any;
const FPS = tl.fps;
const ITEMS: Item[] = tl.items as Item[];
const BEATS: Item[] = ITEMS.filter((o) => o.kind === 'beat');
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

// ---------------- polices ----------------
const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([['ID', 'fonts/InterDisplay-Black.otf'], ['IT', 'fonts/Inter-ExtraBold.otf']].map(([n, f]) =>
      new FontFace(n, `url(${staticFile(f)})`).load().then((ff) => document.fonts.add(ff)))).then(() => { setReady(true); continueRender(h); });
  }, [h]);
  return ready;
};

// ---------------- scènes ----------------
type SceneDef = {mode: ModeLumiere; centre: V3};
const SCENES: Record<string, SceneDef> = {
  place: {mode: 'jour', centre: [0, 0, 15]},
  boite: {mode: 'soir', centre: [-14, 0, 8]},
  qg: {mode: 'interieur', centre: [0, 0, 1.5]},
  cuisine: {mode: 'interieur', centre: [0, 0, 2.5]},
  skatepark: {mode: 'jour', centre: [0, 0, 4]},
  rue: {mode: 'jour', centre: [0, 0, 0]},
  rueNuit: {mode: 'nuit', centre: [0, 0, 0]},
  usine: {mode: 'soir', centre: [0, 0, 9]},
};
const USINE_AT: V3 = [300, 0, 0];

const sceneOf = (b: Item) => (b.shot === 'usine' ? 'usine' : b.scene);
const centreOf = (b: Item): V3 => {
  const s = sceneOf(b);
  if (s === 'usine') return add(USINE_AT, SCENES.usine.centre);
  if (b.shot === 'mairie') return [0, 0, 1];
  return SCENES[s].centre;
};

/** Décor + lumière d'une scène. */
const Decor: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const s = sceneOf(b);
  const regle = splitRule(ruleNow(b), b.dayNow);
  switch (s) {
    case 'place': return <><Eclairage mode="jour" centre={[0, 0, 4]} /><PlaceMairie t={t} regle={{jour: Math.max(1, b.dayNow), texte: regle.texte}} /></>;
    case 'boite': return <><Eclairage mode="soir" centre={[-10, 0, 4]} /><PlaceMairie t={t} regle={{jour: Math.max(1, b.dayNow), texte: regle.texte}} /></>;
    case 'qg': return <><Eclairage mode="interieur" centre={[0, 0, 0]} /><QGGarage t={t} /></>;
    case 'cuisine': return <><Eclairage mode="interieur" centre={[0, 0, 0]} /><CuisineZara t={t} /></>;
    case 'skatepark': return <><Eclairage mode="jour" centre={[0, 0, 2]} /><Skatepark t={t} /></>;
    case 'rue': return <><Eclairage mode="jour" centre={[0, 0, -4]} /><RueNuit night={false} t={t} /></>;
    case 'rueNuit': return <><Eclairage mode="nuit" centre={[0, 0, -4]} /><RueNuit night t={t} /><CielNuit /></>;
    case 'usine': {
      const boom = BEATS.find((x) => x.sfx === 'explosion');
      const borz = boom ? interpolate(t, [boom.vstart, boom.vstart + 3], [0, 1], clamp) : 0;
      const flash = boom && t > boom.vstart + 2 ? Math.max(0, 1 - (t - boom.vstart - 2) * 1.5) : 0;
      return <><Eclairage mode="soir" centre={USINE_AT} /><pointLight position={add(USINE_AT, [0, 9, 4])} intensity={60} distance={40} color="#d59cff" /><group position={USINE_AT}><Usine3D t={t} borz={borz} flash={flash} /></group></>;
    }
  }
  return null;
};

const ruleNow = (b: Item): string | undefined => { let r: string | undefined; for (const x of BEATS) { if (x.i > b.i) break; if (x.rule) r = x.rule; } return r; };
const splitRule = (rule: string | undefined, day: number) => {
  if (!rule) return {interdit: 'INTERDIT', texte: '…', jour: day};
  const m = rule.match(/^(INTERDIT|OBLIGATOIRE)\s+(.*)$/);
  return m ? {interdit: m[1], texte: m[2], jour: day} : {interdit: 'INTERDIT', texte: rule, jour: day};
};

// ---------------- placement des personnages ----------------
const castOf = (b: Item): string[] => (b.cast ?? []).filter((c: string) => c !== 'PASSANTS');
const placeCast = (b: Item): Record<string, V3> => {
  const cast = castOf(b);
  const c = centreOf(b);
  const pos: Record<string, V3> = {};
  const front = cast.length > 6 ? cast.slice(0, Math.ceil(cast.length / 2)) : cast;
  const back = cast.length > 6 ? cast.slice(Math.ceil(cast.length / 2)) : [];
  const row = (names: string[], z: number, sp: number) => names.forEach((n, i) => {
    const x = (i - (names.length - 1) / 2) * sp;
    pos[n] = add(c, [x, 0, z - 0.04 * x * x]);
  });
  row(front, 0, cast.length <= 2 ? 2.6 : 2.15);
  row(back, -3, 2.3);
  // l'ordre ORI au centre pour le trio
  if (cast.length === 3 && cast.includes('ORI') && cast.includes('ZIGO') && cast.includes('PIMENT')) {
    pos.ZIGO = add(c, [-2.2, 0, -0.3]); pos.ORI = add(c, [0, 0, 0.2]); pos.PIMENT = add(c, [2.2, 0, -0.3]);
  }
  return pos;
};

// ---------------- caméra ----------------
type Cam = {pos: V3; target: V3; fov: number};
const camFor = (b: Item, t: number, pos: Record<string, V3>): Cam => {
  const lt = t - b.start, D = b.end - b.start;
  const k = Math.min(1, Math.max(0, lt / Math.max(1, D)));
  const c = centreOf(b);
  const shot: string = b.shot;
  const face = shot.match(/^(\w+)_face$/);
  if (face) {
    const who = face[1].toUpperCase();
    const p = pos[who] ?? c;
    const side = (hash(b.text) % 2 ? 1 : -1) * 1.1;
    return {pos: add(p, [side * (1 - k * 0.2), 2.85, 4.6 - k * 0.7]), target: add(p, [0, 2.45, 0]), fov: 38};
  }
  switch (shot) {
    case 'drone': {
      const a = -0.6 + k * 0.5;
      return {pos: add(c, [Math.sin(a) * 26, 15 - k * 3, Math.cos(a) * 26]), target: add(c, [0, 1.5, -4]), fov: 42};
    }
    case 'regle': {
      const P = panelPos(b);
      return {pos: add(P, [0.4 - k * 0.4, 2.7, 6.2 - k * 1.6]), target: add(P, [0, 2.65, 0]), fov: 36};
    }
    case 'boite': return {pos: [-14 + 5 - k * 2, 4.2, 2 + 15 - k * 2], target: [-14, 3, 3], fov: 40};
    case 'mairie': return {pos: [0 + k * 2, 3.6, 13 - k * 2], target: [0, 4.5, -4], fov: 44};
    case 'usine': return {pos: add(USINE_AT, [6 - k * 6, 7, 22 - k * 3]), target: add(USINE_AT, [0, 2, 0]), fov: 46};
    case 'trio': {
      const ps = ['ZIGO', 'ORI', 'PIMENT'].map((n) => pos[n]).filter(Boolean) as V3[];
      const m = ps.length ? ps.reduce((a, p) => add(a, [p[0] / ps.length, 0, p[2] / ps.length]), [0, 0, 0] as V3) : c;
      return {pos: add(m, [1.2 - k * 1.2, 3.3, 9.5 - k * 1]), target: add(m, [0, 2.3, 0]), fov: 40};
    }
    default: {
      const n = castOf(b).length;
      const dist = 11 + n * 1.0;
      return {pos: add(c, [3.5 - k * 3, 4.5 + n * 0.25, dist - k * 1.5]), target: add(c, [0, 2, -1]), fov: 42};
    }
  }
};
const panelPos = (b: Item): V3 => add(SCENES[sceneOf(b)]?.centre ?? [0, 0, 0], [6.5, 0, 2]);

const CamCtl: React.FC<{cam: Cam}> = ({cam}) => {
  const {camera} = useThree();
  const pc = camera as THREE.PerspectiveCamera;
  pc.position.set(...cam.pos);
  pc.fov = cam.fov; pc.near = 0.1; pc.far = 400;
  pc.lookAt(...cam.target);
  pc.updateProjectionMatrix();
  return null;
};

// ---------------- jeu des personnages ----------------
const talkOf = (who: string, b: Item, t: number) => {
  if (!b.who.split('+').includes(who)) return 0;
  const i = Math.floor((t - b.vstart) * FPS);
  if (i < 0 || i >= b.env.length) return 0;
  return ((b.env[i - 1] ?? 0) + 2 * b.env[i] + (b.env[i + 1] ?? 0)) / 4;
};

type Placed = {p: V3; rot: number; pose: Pose};
const actOf = (b: Item, who: string): string | undefined => (b.act ? b.act[who] ?? b.act.ALL : undefined);

const play = (b: Item, who: string, base: V3, t: number, cam: Cam): Placed => {
  const lt = t - b.start, vt = t - b.vstart;
  const talk = talkOf(who, b, t);
  const speaker = b.who.split('+')[0];
  const seed = hash(who) % 100;
  // regarde la caméra (3/4) ou celui qui parle
  const toCam = Math.atan2(cam.pos[0] - base[0], cam.pos[2] - base[2]);
  let rot = toCam * 0.55;
  const pose: Pose = {talk, blink: ((t * 0.37 + seed * 0.13) % 3.2) < 0.08 ? 1 : 0, brows: talk > 0.5 ? 0.3 : 0};
  let p: V3 = base;
  // petit balancement de vie
  pose.headTurn = Math.sin(t * 0.9 + seed) * 0.08;
  pose.bob = 0;
  if (who !== speaker && b.cast && b.cast.includes(speaker)) pose.look = [0.5 * Math.sign((placeCast(b)[speaker]?.[0] ?? 0) - base[0]), 0];
  const a = actOf(b, who);
  const walkAt = (speed: number) => { pose.walk = t * speed; pose.walkAmp = 1; };
  switch (a) {
    case 'fierte': pose.headTilt = -0.15; pose.brows = 0.2; break;
    case 'balcon': pose.armR = 1.2; pose.armSideR = 0.3; break;
    case 'lunettes': pose.armR = 2.4; pose.brows = 0.6; break;
    case 'marche_lente': walkAt(4); pose.walkAmp = 0.5; p = add(base, [0, 0, -1.5 + lt * 0.35]); break;
    case 'skate_passe': { const x = interpolate(lt, [0, 2.6], [-16, 16], clamp); p = add(base, [x, 0.25, 1.5]); rot = Math.PI / 2; pose.armSideL = 0.6; pose.armSideR = 0.6; break; }
    case 'court': { walkAt(16); const x = interpolate(lt, [0.3, 2.2], [0, 4], clamp); p = add(base, [x, 0, 0]); rot = lt > 0.3 && lt < 2.2 ? Math.PI / 2 : rot; pose.brows = 1; break; }
    case 'fige': pose.squash = 0.15; pose.brows = 1; pose.armSideL = 0.5; pose.armSideR = 0.5; pose.look = [0, 0.5]; break;
    case 'triste': pose.headTilt = 0.28; pose.brows = -0.2; pose.smile = 0.2; pose.look = [0, -0.8]; break;
    case 'serieux': pose.smile = 0; pose.brows = -0.3; pose.headTilt = Math.sin(t * 3) * 0.02; break;
    case 'rire': pose.bob = Math.abs(Math.sin(t * 14)) * 0.12; pose.headTilt = -0.2; pose.talk = Math.max(talk, 0.6 + 0.4 * Math.sin(t * 20)); break;
    case 'siffle': pose.armR = 2.2; pose.armSideR = -0.2; pose.brows = -1; break;
    case 'arrete': case 'emmene': {
      const x = interpolate(lt, [1.2, D(b)], [0, -7], clamp);
      if (lt > 1.2) { walkAt(9); rot = -Math.PI / 2; }
      p = add(base, [x, 0, 0]); if (a === 'arrete') { pose.brows = -1; pose.armL = 1.2; } else { pose.brows = 1; pose.headTilt = 0.2; }
      break;
    }
    case 'entre_boite': { walkAt(8); const z = interpolate(lt, [0, D(b)], [0, -5.5], clamp); p = add([-14, 0, 9], [0, 0, z]); rot = Math.PI; break; }
    case 'idee': pose.armR = 2.9 + Math.sin(t * 8) * 0.1; pose.brows = 0.8; pose.bob = Math.abs(Math.sin(lt * 6)) * 0.08 * (lt < 1 ? 1 : 0); break;
    case 'retient': pose.smile = 0.1; pose.squash = 0.08 + Math.abs(Math.sin(t * 25)) * 0.05; pose.brows = -0.8; break;
    case 'panique': pose.armL = 2.8 + Math.sin(t * 18) * 0.3; pose.armR = 2.8 - Math.sin(t * 18) * 0.3; pose.brows = 1; pose.bob = Math.abs(Math.sin(t * 12)) * 0.1; break;
    case 'selfie': pose.armR = 2.2; pose.armSideR = 0.4; pose.headTilt = 0.1; break;
    case 'deguise': pose.headTurn = 0.4; break;
    case 'crie': pose.squash = -0.1; pose.armL = 1.6; pose.armR = 1.6; pose.armSideL = 0.6; pose.armSideR = 0.6; pose.brows = -1; break;
    case 'filme': pose.armR = 1.6; pose.armSideR = -0.2; break;
    case 'remue': pose.armR = 1.1 + Math.sin(t * 6) * 0.25; pose.armSideR = 0.2 + Math.cos(t * 6) * 0.15; break;
    case 'entre': { walkAt(8); const z = interpolate(lt, [0, 1.8], [6, 0], clamp); p = add(base, [0, 0, z]); if (lt < 1.8) rot = 0; pose.brows = -1; break; }
    case 'avance': { const z = interpolate(lt, [0, 1], [-0.8, 0.4], clamp); p = add(base, [0, 0, z]); if (lt < 1) walkAt(8); pose.brows = -0.4; pose.headTilt = -0.1; break; }
    case 'equipe': case 'cheer': pose.bob = Math.abs(Math.sin(t * 7 + seed)) * 0.35; pose.armL = 2.9; pose.armR = 2.9; pose.armSideL = 0.3; pose.armSideR = 0.3; pose.talk = Math.max(talk, 0.4); break;
    case 'pouces': pose.armL = 1.4; pose.armR = 1.4; pose.bob = Math.abs(Math.sin(t * 8)) * 0.15; break;
    case 'zombie': walkAt(3); pose.walkAmp = 0.4; pose.armL = 1.5; pose.armR = 1.5; pose.blink = 0.55; pose.headTilt = 0.15; p = add(base, [Math.sin(t * 0.7 + seed) * 0.5, 0, Math.sin(t * 0.5) * 0.6]); break;
    case 'baille': pose.talk = Math.max(talk, 0.9); pose.headTilt = -0.25; pose.blink = 0.6; pose.armL = 2.5; pose.armSideL = 0.4; break;
    case 'choc': pose.brows = 1; pose.squash = 0.12; pose.armSideL = 0.7; pose.armSideR = 0.7; break;
    case 'travaille': pose.armL = 1.2 + Math.sin(t * 5 + seed) * 0.5; pose.armR = 1.2 - Math.sin(t * 5 + seed) * 0.5; pose.smile = 0.2; pose.headTilt = 0.2; break;
    case 'fuit': { walkAt(15); const z = interpolate(lt, [0.8, D(b)], [0, -14], clamp); p = add(base, [0, 0, z]); if (lt > 0.8) rot = Math.PI; pose.brows = 1; break; }
    case 'rire_m': break;
    case 'zigzag': walkAt(7); p = add(base, [Math.sin(lt * 2.4 + seed) * 1.4, 0, -2 + lt * 0.5]); rot = Math.cos(lt * 2.4 + seed) * 0.9; break;
    case 'tourne': { walkAt(7); const ang = lt * 1.6; p = add(base, [Math.cos(ang) * 1.3, 0, Math.sin(ang) * 1.3]); rot = -ang; pose.brows = -0.4; break; }
    case 'decide': pose.brows = -0.9; pose.smile = 0.3; pose.headTilt = -0.05; break;
    case 'fige_m': break;
  }
  if (who === 'PRUNE' && a === 'rire') { pose.bob = Math.abs(Math.sin(t * 12)) * 0.1; pose.armR = 2.4; }
  if (who === 'PRUNE' && a === 'panique') { pose.armL = 2.8; pose.armR = 2.8; }
  void vt;
  return {p, rot, pose};
};
const D = (b: Item) => b.end - b.start;

// figurants : passants qui traversent le fond
const Passants: React.FC<{b: Item; t: number}> = ({b, t}) => {
  if (!(b.cast ?? []).includes('PASSANTS')) return null;
  const c = centreOf(b);
  return <>{[1, 2, 3, 4, 1, 3].map((n, i) => {
    const dir = i % 2 ? 1 : -1;
    const span = 34;
    const x = (((t * 1.6 + i * 7.3) % span) - span / 2) * dir;
    const z = -6 - (i % 3) * 3.5;
    return <Perso3D key={i} who={`PASSANT${n}`} position={add(c, [x, 0, z])} rotation={dir * Math.PI / 2} pose={{walk: t * 7 + i, walkAmp: 0.9}} />;
  })}</>;
};

const Scene3D: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const pos = placeCast(b);
  const cam = camFor(b, t, pos);
  const cast = castOf(b);
  const isRule = b.shot === 'regle';
  const r = splitRule(ruleNow(b), b.dayNow);
  return (
    <>
      <CamCtl cam={cam} />
      <Decor b={b} t={t} />
      {sceneOf(b) === 'boite' && <LaBoite p={[-14, 0, 2]} t={t} erreurs={3} />}
      {isRule && <PanneauRegle3D jour={b.dayNow} texte={r.texte} interdit={r.interdit} p={panelPos(b)} />}
      {cast.map((n) => {
        const {p, rot, pose} = play(b, n, pos[n], t, cam);
        const who = n === 'ZIGO' && actOf(b, 'ZIGO') === 'deguise' ? 'ZIGO' : n;
        return <Perso3D key={n} who={who} position={p} rotation={rot} pose={pose} />;
      })}
      <Passants b={b} t={t} />
    </>
  );
};

// ---------------- interface 2D (style « 100 jours ») ----------------
const Pill: React.FC<{children: React.ReactNode; bg?: string; color?: string}> = ({children, bg = 'rgba(20,16,30,0.82)', color = '#fff'}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, background: bg, color, fontFamily: 'ID', fontSize: 34, padding: '10px 22px', borderRadius: 16, border: '3px solid rgba(255,255,255,0.15)'}}>{children}</div>
);
const Calendrier = () => (
  <svg width="34" height="34" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" fill="#ffd23f" /><rect x="3" y="5" width="18" height="5" rx="2" fill="#ff4d4d" /><rect x="7" y="2" width="2" height="5" fill="#fff" /><rect x="15" y="2" width="2" height="5" fill="#fff" /></svg>
);
const Croix = () => (<svg width="30" height="30" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#ff3b3b" /><path d="M7 7 L17 17 M17 7 L7 17" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" /></svg>);

const Hud: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const errOri = b.errors?.ORI ?? 0;
  const newErr = Object.entries(b.newErrors ?? {}) as [string, number][];
  const pop = (t0: number) => spring({frame: Math.max(0, (t - t0) * FPS), fps: FPS, config: {damping: 9, stiffness: 160}});
  return (
    <AbsoluteFill>
      {b.dayNow > 0 && <div style={{position: 'absolute', left: 40, top: 36}}><Pill><Calendrier />JOUR {b.dayNow}</Pill></div>}
      {b.dayNow > 0 && <div style={{position: 'absolute', right: 40, top: 36}}><Pill><Croix />ERREURS : {errOri}/3</Pill></div>}
      {newErr.map(([who, n], i) => {
        const t0 = b.vstart + 0.2;
        if (t < t0 || t > t0 + 2.6) return null;
        const s = pop(t0), o = interpolate(t, [t0 + 2.2, t0 + 2.6], [1, 0], clamp);
        return (
          <div key={who} style={{position: 'absolute', left: 960, top: 300 + i * 120, transform: `translate(-50%,-50%) scale(${s}) rotate(-4deg)`, opacity: o,
            background: '#ff2d2d', color: '#fff', fontFamily: 'ID', fontSize: 64, padding: '16px 40px', borderRadius: 22, border: '6px solid #fff', boxShadow: '0 12px 0 #8a0000', whiteSpace: 'nowrap'}}>
            {who === 'ORI' ? 'ERREUR' : `${who} : ERREUR`} {n}/3
          </div>
        );
      })}
      {b.hud === 'EQUIPE' && t > b.vstart + 1.5 && (
        <div style={{position: 'absolute', left: 960, top: 140, transform: `translateX(-50%) scale(${pop(b.vstart + 1.5)})`}}>
          <Pill bg="#2fb35a">ÉQUIPE : 8 · LA RÉSISTANCE</Pill>
        </div>
      )}
      {b.hud === 'ABONNE' && t > b.vstart + 0.3 && (
        <div style={{position: 'absolute', left: 960, bottom: 230, transform: `translateX(-50%) scale(${pop(b.vstart + 0.3)})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, background: '#ff1f4b', color: '#fff', fontFamily: 'ID', fontSize: 52, padding: '18px 44px', borderRadius: 60, boxShadow: '0 10px 0 #9a0022'}}>
            <svg width="50" height="50" viewBox="0 0 24 24"><path d="M12 2a6 6 0 0 0-6 6v4l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0" fill="#fff" /></svg>ABONNE-TOI
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Sous-titres mot par mot, au centre-bas (comme la référence). */
const Mots: React.FC<{b: Item; t: number}> = ({b, t}) => {
  const ws: {w: string; s: number; e: number}[] = b.words ?? [];
  let cur = -1;
  for (let i = 0; i < ws.length; i++) if (t >= ws[i].s - 0.05 && t < (ws[i + 1]?.s ?? ws[i].e + 0.25) - 0.05) cur = i;
  if (cur < 0) return null;
  const w = ws[cur];
  const s = spring({frame: Math.max(0, (t - w.s) * FPS), fps: FPS, config: {damping: 12, stiffness: 260}});
  const word = w.w.replace(/^[«"]|[»".,!?…]+$/g, '');
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center'}}>
      <span style={{display: 'inline-block', transform: `scale(${0.7 + 0.3 * s})`, fontFamily: 'ID', fontSize: 84, color: '#fff', WebkitTextStroke: '14px #000', paintOrder: 'stroke fill', letterSpacing: 1,
        textShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>{word.toLowerCase()}</span>
    </div>
  );
};

const DayCard: React.FC<{o: Item; t: number}> = ({o, t}) => {
  const lt = t - o.start;
  const s = spring({frame: Math.max(0, (lt - 0.15) * FPS), fps: FPS, config: {damping: 8, stiffness: 170}});
  const out = interpolate(lt, [o.end - o.start - 0.25, o.end - o.start], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: `rgba(10,8,20,${0.35 * out})`}}>
      <div style={{transform: `scale(${s * (0.9 + 0.1 * out)}) rotate(-3deg)`, opacity: out, background: '#ffd23f', color: '#1a1020', fontFamily: 'ID', fontSize: 170, padding: '10px 70px',
        borderRadius: 36, border: '10px solid #1a1020', boxShadow: '0 18px 0 rgba(0,0,0,0.4)'}}>JOUR {o.day}</div>
    </AbsoluteFill>
  );
};

const Titre: React.FC<{t: number}> = ({t}) => {
  if (t > 5.5) return null;
  const s = spring({frame: Math.max(0, (t - 0.3) * FPS), fps: FPS, config: {damping: 10, stiffness: 140}});
  const o = interpolate(t, [4.8, 5.5], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
      <div style={{fontFamily: 'ID', fontSize: 120, color: '#ffd23f', WebkitTextStroke: '16px #1a1020', paintOrder: 'stroke fill', lineHeight: 1}}>100 JOURS</div>
      <div style={{display: 'inline-block', marginTop: 18, background: '#e8364a', color: '#fff', fontFamily: 'ID', fontSize: 52, padding: '12px 34px', borderRadius: 18, border: '6px solid #1a1020'}}>DANS LA VILLE DE MONSIEUR PRUNE</div>
    </div>
  );
};

export const EP02: React.FC = () => {
  const ready = useFonts();
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = f / FPS;
  const item = ITEMS.find((o) => t >= o.start && t < o.end) ?? ITEMS[ITEMS.length - 1];
  // pendant un carton « JOUR N » ou l'outro, on montre le plan large de la réplique voisine
  const b: Item = item.kind === 'beat' ? item : item.kind === 'daycard' ? BEATS.find((x) => x.start >= item.end - 0.01)! : BEATS[BEATS.length - 1];
  const sceneB = item.kind === 'daycard' ? {...b, shot: 'drone', start: item.start, end: b.end, cast: b.cast ?? ['PASSANTS']} : b;
  const mode = SCENES[sceneOf(b)]?.mode ?? 'jour';
  const flash = b.sfx === 'explosion' && t > b.vstart + 2 ? Math.max(0, 1 - (t - b.vstart - 2) * 1.2) : 0;
  return (
    <AbsoluteFill style={{background: fondCss(mode)}}>
      {ready && (
        <ThreeCanvas width={width} height={height} shadows gl={{antialias: true}} onCreated={({gl}) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
          <Scene3D b={sceneB} t={t} />
        </ThreeCanvas>
      )}
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
      {item.kind === 'beat' && <Hud b={item} t={t} />}
      {item.kind === 'beat' && <Mots b={item} t={t} />}
      {item.kind === 'daycard' && <DayCard o={item} t={t} />}
      <Titre t={t} />
      <Audio src={staticFile('ep02/audio.mp3')} />
    </AbsoluteFill>
  );
};
