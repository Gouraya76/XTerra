import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random} from 'remotion';
import {RoundedBox} from '@react-three/drei';
import {Arbre, Banc, Immeuble, Lampadaire, Rue} from './Ville3D';

type V3 = [number, number, number];
export type Cam = {pos: V3; target: V3};

// ---------- briques de base ----------
export const Bloc: React.FC<{p: V3; s: V3; c: string; r?: number; rough?: number; emissive?: string; ei?: number; rot?: V3; shadow?: boolean}> = ({p, s, c, r = 0.05, rough = 0.85, emissive, ei = 0, rot, shadow = true}) => (
  <RoundedBox args={s} radius={Math.min(r, Math.min(...s) / 2.01)} smoothness={2} position={p} rotation={rot} castShadow={shadow} receiveShadow>
    <meshStandardMaterial color={c} roughness={rough} emissive={emissive ?? '#000'} emissiveIntensity={ei} />
  </RoundedBox>
);

const texCache = new Map<string, THREE.CanvasTexture>();
const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  if (texCache.has(key)) return texCache.get(key)!;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  texCache.set(key, t);
  return t;
};

/** Plaque avec texte (enseignes, écrans). */
export const Texte3D: React.FC<{p: V3; w: number; h: number; text: string; color?: string; bg?: string; font?: number; rot?: V3; glow?: number; lines?: string[]; stroke?: string}> = ({p, w, h, text, color = '#fff', bg = 'transparent', font = 0.6, rot, glow = 0, lines, stroke}) => {
  const key = `t|${text}|${color}|${bg}|${w}|${h}|${font}|${(lines ?? []).join('/')}|${stroke}`;
  const tex = useMemo(() => canvasTex(key, Math.round(256 * w), Math.round(256 * h), (g) => {
    const W = g.canvas.width, H = g.canvas.height;
    if (bg !== 'transparent') { g.fillStyle = bg; g.fillRect(0, 0, W, H); } else g.clearRect(0, 0, W, H);
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    const all = lines ?? [text];
    const fs = font * 256;
    g.font = `900 ${fs}px ID, Arial Black, sans-serif`;
    all.forEach((l, i) => {
      const y = H / 2 + (i - (all.length - 1) / 2) * fs * 1.1;
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = fs * 0.14; g.lineJoin = 'round'; g.strokeText(l, W / 2, y); }
      g.fillText(l, W / 2, y);
    });
  }), [key]);
  return (
    <mesh position={p} rotation={rot}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} transparent={bg === 'transparent'} roughness={0.6} emissive={glow ? color : '#000'} emissiveMap={glow ? tex : null} emissiveIntensity={glow} toneMapped={!glow} />
    </mesh>
  );
};

/** Sol texturé (pavés, carrelage, béton) en une seule surface. */
const Sol: React.FC<{w: number; d: number; kind: 'paves' | 'damier' | 'beton' | 'parquet'; p?: V3; c1?: string; c2?: string}> = ({w, d, kind, p = [0, 0, 0], c1, c2}) => {
  const tex = useMemo(() => canvasTex(`sol|${kind}|${c1}|${c2}`, 512, 512, (g) => {
    if (kind === 'damier') {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? (c1 ?? '#f4e2c4') : (c2 ?? '#e07a4f'); g.fillRect(x * 128, y * 128, 128, 128); }
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 4; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 512); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); }
    } else if (kind === 'paves') {
      g.fillStyle = '#cdbfa6'; g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const v = 0.92 + 0.12 * random(`pv${x}-${y}`);
        g.fillStyle = `rgb(${Math.round(236 * v)},${Math.round(222 * v)},${Math.round(196 * v)})`;
        g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 64 + 3, 58, 58);
      }
    } else if (kind === 'parquet') {
      for (let y = 0; y < 16; y++) { g.fillStyle = y % 2 ? '#b97a45' : '#c98b52'; g.fillRect(0, y * 32, 512, 32); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(((y * 137) % 512), y * 32, 4, 32); g.fillRect(0, y * 32, 512, 2); }
    } else {
      g.fillStyle = c1 ?? '#a7a49d'; g.fillRect(0, 0, 512, 512);
      for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(0,0,0,${0.04 * random(`bt${k}`)})`; g.fillRect(random(`bx${k}`) * 512, random(`by${k}`) * 512, 6, 6); }
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512);
    }
  }, [w / (kind === 'paves' ? 6 : kind === 'damier' ? 4 : 4), d / (kind === 'paves' ? 6 : 4)]), [kind, w, d, c1, c2]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p[0], p[1] + 0.01, p[2]]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
};

/** Mur de briques (une texture + liseré), face +z. */
const MurBriques: React.FC<{p: V3; w: number; h: number; rot?: V3; c?: string}> = ({p, w, h, rot, c = '#a4553f'}) => {
  const tex = useMemo(() => canvasTex(`brique|${c}`, 512, 512, (g) => {
    g.fillStyle = '#6e3a2c'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 8; y++) for (let x = -1; x < 4; x++) {
      const v = 0.85 + 0.2 * random(`br${x}${y}`);
      const col = new THREE.Color(c).multiplyScalar(v);
      g.fillStyle = `#${col.getHexString()}`;
      g.fillRect(x * 128 + (y % 2) * 64 + 5, y * 64 + 5, 118, 54);
    }
  }, [w / 3, h / 1.5]), [c, w, h]);
  return (
    <mesh position={p} rotation={rot} receiveShadow>
      <boxGeometry args={[w, h, 0.4]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
};

// ---------- éclairage ----------
export type ModeLumiere = 'jour' | 'soir' | 'nuit' | 'interieur';
const AMB: Record<ModeLumiere, {sky: string; ground: string; hemi: number; sun: string; sunI: number; sunPos: V3; fog: string; near: number; far: number; bg: string}> = {
  jour: {sky: '#dff3ff', ground: '#e9cfa8', hemi: 1.15, sun: '#fff1dc', sunI: 2.4, sunPos: [14, 24, 12], fog: '#cfeaff', near: 40, far: 140, bg: 'linear-gradient(#7fc8ff, #d8f1ff)'},
  soir: {sky: '#ffcf9e', ground: '#8a5a6a', hemi: 0.9, sun: '#ff9f5a', sunI: 2.2, sunPos: [-20, 10, 8], fog: '#f6b48a', near: 30, far: 120, bg: 'linear-gradient(#ff8a5c, #ffd59e 55%, #ffe9c8)'},
  nuit: {sky: '#4a5a9a', ground: '#1b1830', hemi: 0.55, sun: '#a9b8ff', sunI: 0.9, sunPos: [10, 20, -8], fog: '#141a3a', near: 20, far: 90, bg: 'linear-gradient(#060a22, #1b2458)'},
  interieur: {sky: '#fff1d9', ground: '#7a5a46', hemi: 0.9, sun: '#ffd9a8', sunI: 1.6, sunPos: [4, 12, 6], fog: '#2a1d18', near: 30, far: 80, bg: '#2a1d18'},
};
/** Lumières + brouillard. Mettre `fondCss(mode)` en fond du conteneur. */
export const Eclairage: React.FC<{mode: ModeLumiere; centre?: V3}> = ({mode, centre = [0, 0, 0]}) => {
  const a = AMB[mode];
  return (
    <>
      <fog attach="fog" args={[a.fog, a.near, a.far]} />
      <hemisphereLight args={[a.sky, a.ground, a.hemi]} />
      <directionalLight position={[centre[0] + a.sunPos[0], a.sunPos[1], centre[2] + a.sunPos[2]]} target-position={centre} intensity={a.sunI} color={a.sun} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
        shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-near={1} shadow-camera-far={90} />
      {mode === 'interieur' && <pointLight position={[centre[0], 6.5, centre[2] + 1]} intensity={40} distance={22} color="#ffcf8a" />}
    </>
  );
};
export const fondCss = (mode: ModeLumiere) => AMB[mode].bg;

// ---------- 7. Panneau de règle ----------
export const PanneauRegle3D: React.FC<{jour: number; texte: string; interdit?: string; p?: V3; rot?: number; scale?: number}> = ({jour, texte, interdit = 'INTERDIT', p = [0, 0, 0], rot = 0, scale = 1}) => {
  const key = `regle|${jour}|${interdit}|${texte}`;
  const tex = useMemo(() => canvasTex(key, 512, 640, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 640);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#1d1d1d'; g.font = '900 64px ID, Arial Black, sans-serif'; g.fillText(`JOUR ${jour}`, 256, 90);
    g.fillStyle = '#e0242a'; g.font = '900 86px ID, Arial Black, sans-serif'; g.fillText(interdit, 256, 230);
    g.fillStyle = '#1d1d1d'; g.font = '900 54px ID, Arial Black, sans-serif';
    const words = texte.toUpperCase().split(' '); const lines: string[] = []; let cur = '';
    for (const w of words) { if (g.measureText(`${cur} ${w}`).width > 450 && cur) { lines.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w; }
    if (cur) lines.push(cur);
    lines.forEach((l, i) => g.fillText(l, 256, 360 + i * 66));
  }), [key]);
  return (
    <group position={p} rotation={[0, rot, 0]} scale={scale}>
      <Bloc p={[-1.15, 1.3, -0.05]} s={[0.18, 2.6, 0.18]} c="#6b4a2b" />
      <Bloc p={[1.15, 1.3, -0.05]} s={[0.18, 2.6, 0.18]} c="#6b4a2b" />
      <Bloc p={[0, 3.3, -0.02]} s={[3.1, 2.9, 0.1]} c="#ffd23f" emissive="#ffc21a" ei={0.9} r={0.06} shadow={false} />
      <Bloc p={[0, 3.3, 0.04]} s={[2.9, 2.7, 0.12]} c="#c9934f" r={0.05} />
      <Bloc p={[0, 4.42, 0.12]} s={[2.4, 0.42, 0.06]} c="#3b4a66" r={0.04} />
      <Texte3D p={[0, 4.42, 0.16]} w={2.3} h={0.4} text="RÈGLES" color="#ffffff" font={0.28} />
      <mesh position={[0, 2.98, 0.12]}><planeGeometry args={[1.8, 2.25]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
    </group>
  );
};

// ---------- 2. La Boîte ----------
export const SPOTS_LA_BOITE = {
  centre: [0, 0, 0] as V3,
  devant_porte: [0, 0, 3.4] as V3,
  garde_gauche: [-2.6, 0, 3.0] as V3,
  garde_droite: [2.6, 0, 3.0] as V3,
  interieur: [0, 0, 0] as V3,
  camera_large: {pos: [7, 5.5, 15], target: [0, 3.2, 0]} as Cam,
  camera_proche: {pos: [0, 3.2, 9], target: [0, 2.8, 2]} as Cam,
};
export const LaBoite: React.FC<{p?: V3; rot?: number; t?: number; erreurs?: number}> = ({p = [0, 0, 0], rot = 0, t = 0, erreurs = 3}) => {
  const pulse = 0.8 + 0.4 * Math.sin(t * 4);
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Bloc p={[0, 3.4, 0]} s={[6.4, 6.8, 5.2]} c="#2a1748" r={0.15} rough={0.4} />
      {/* liserés néon */}
      {[[0, 6.85, 2.62, 6.5, 0.14], [0, 0.05, 2.62, 6.5, 0.14]].map(([x, y, z, w, h], i) => <Bloc key={i} p={[x, y, z]} s={[w, h, 0.12]} c="#c76bff" emissive="#c76bff" ei={2 * pulse} shadow={false} r={0.04} />)}
      {[-1, 1].map((sd) => <Bloc key={sd} p={[sd * 3.22, 3.4, 2.62]} s={[0.14, 6.8, 0.12]} c="#c76bff" emissive="#c76bff" ei={2 * pulse} shadow={false} r={0.04} />)}
      {/* portail lumineux */}
      <Bloc p={[0, 2.1, 2.62]} s={[2.4, 4.2, 0.1]} c="#140a24" r={0.03} />
      <Bloc p={[0, 4.25, 2.66]} s={[2.7, 0.16, 0.12]} c="#ff4fd8" emissive="#ff4fd8" ei={2.4 * pulse} shadow={false} r={0.04} />
      {[-1, 1].map((sd) => <Bloc key={sd} p={[sd * 1.28, 2.1, 2.66]} s={[0.16, 4.2, 0.12]} c="#ff4fd8" emissive="#ff4fd8" ei={2.4 * pulse} shadow={false} r={0.04} />)}
      <mesh position={[0, 2.1, 2.68]}><planeGeometry args={[2.3, 4.1]} /><meshBasicMaterial color="#ff7ae5" transparent opacity={0.18 + 0.08 * pulse} /></mesh>
      {/* enseigne */}
      <Texte3D p={[0, 5.5, 2.7]} w={4.8} h={1.0} text="LA BOÎTE" color="#ffd6ff" font={0.62} glow={1.6} />
      {/* compteur d'erreurs X X X */}
      {[-1, 0, 1].map((k) => (
        <group key={k} position={[k * 0.75, 4.75, 2.7]}>
          <Bloc p={[0, 0, 0]} s={[0.55, 0.55, 0.06]} c={k + 1 < erreurs ? '#ff3b3b' : '#ffffff'} emissive={k + 1 < erreurs ? '#ff2a2a' : '#000'} ei={1.2} shadow={false} r={0.08} />
          <Texte3D p={[0, 0, 0.05]} w={0.5} h={0.5} text="✕" color={k + 1 < erreurs ? '#ffffff' : '#ff3b3b'} font={0.36} />
        </group>
      ))}
      {/* plots des gardes */}
      {[-1, 1].map((sd) => <Bloc key={sd} p={[sd * 2.6, 0.1, 3.0]} s={[1.4, 0.2, 1.4]} c="#3a2a55" r={0.05} />)}
      <pointLight position={[0, 2.5, 4.2]} intensity={14} distance={9} color="#ff6ae0" />
    </group>
  );
};

// ---------- 1. Place de la Mairie ----------
export const SPOTS_PLACE_MAIRIE = {
  centre: [0, 0, 6] as V3,
  devant_mairie: [0, 0, -3] as V3,
  ecran: [9, 0, -4] as V3,
  fontaine: [0, 0, 8] as V3,
  boite: [-14, 0, 2] as V3,
  boite_devant_porte: [-14, 0, 5.4] as V3,
  banc: [7.5, 0, 12] as V3,
  camera_large: {pos: [17, 11, 36], target: [-1, 6, -3]} as Cam,
  camera_proche: {pos: [3, 3.6, 16], target: [0, 2.4, 8]} as Cam,
  camera_mairie: {pos: [0, 4, 12], target: [0, 6, -6]} as Cam,
};
export const PlaceMairie: React.FC<{t?: number; regle?: {jour: number; texte: string}; avecBoite?: boolean}> = ({t = 0, regle = {jour: 1, texte: 'de marcher'}, avecBoite = true}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[220, 220]} /><meshStandardMaterial color="#e9dcc2" roughness={0.95} /></mesh>
    <Sol w={40} d={30} kind="paves" p={[0, 0, 4]} />
    {/* Mairie / Prune Tower */}
    <group position={[0, 0, -12]}>
      <Bloc p={[0, 5.5, 0]} s={[20, 11, 8]} c="#7a4bb5" r={0.2} />
      <Bloc p={[0, 16, -1]} s={[9, 10, 6]} c="#6a3aa6" r={0.2} />
      <Bloc p={[0, 21.4, -1]} s={[9.6, 0.8, 6.6]} c="#d4af37" r={0.1} />
      <Bloc p={[0, 23, -1]} s={[2.2, 2.2, 1.2]} c="#b56cff" emissive="#b56cff" ei={0.8} r={0.3} />
      <Texte3D p={[0, 23, -0.38]} w={2} h={2} text="P" color="#ffffff" font={1.4} />
      <Bloc p={[0, 11.3, 0]} s={[21, 0.6, 9]} c="#efe3c8" r={0.1} />
      <Bloc p={[0, 0.3, 4.8]} s={[22, 0.6, 2]} c="#efe3c8" r={0.05} />
      <Bloc p={[0, 0.7, 4.3]} s={[14, 0.4, 1.4]} c="#efe3c8" r={0.05} />
      {[-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map((x) => <Bloc key={x} p={[x, 5, 4.6]} s={[0.9, 8.4, 0.9]} c="#f7efdf" r={0.12} />)}
      <Bloc p={[0, 9.6, 4.6]} s={[18, 1.2, 1.4]} c="#f7efdf" r={0.1} />
      <Bloc p={[0, 9.6, 5.32]} s={[7.6, 1.0, 0.08]} c="#2b2f6b" r={0.03} />
      <Texte3D p={[0, 9.6, 5.38]} w={7.4} h={1} text="MAIRIE" color="#ffd23f" font={0.75} />
      <Bloc p={[0, 2.4, 4.05]} s={[3.2, 4.8, 0.2]} c="#3d2160" r={0.05} />
      <Bloc p={[0, 2.4, 4.17]} s={[0.08, 4.6, 0.05]} c="#d4af37" r={0.02} />
      {[-6, -3, 3, 6].map((x) => <Bloc key={x} p={[x, 3.6, 4.05]} s={[1.6, 2.6, 0.15]} c="#bfe0ff" rough={0.15} />)}
      {[-6, -3, 0, 3, 6].map((x) => <Bloc key={`w${x}`} p={[x, 8.0 - 0, 4.05]} s={[1.6, 1.2, 0.15]} c="#ffe9a8" emissive="#ffd977" ei={0.25} rough={0.15} />)}
      {/* drapeaux */}
      {[-10.5, 10.5].map((x) => (
        <group key={x} position={[x, 0, 5.5]}>
          <Bloc p={[0, 4.5, 0]} s={[0.18, 9, 0.18]} c="#d9d9d9" rough={0.3} />
          <group position={[0.85, 8.1, 0]} rotation={[0, 0, 0.04 * Math.sin(t * 3 + x)]}>
            <Bloc p={[0, 0, 0]} s={[1.6, 1.1, 0.06]} c="#8a3cd6" r={0.02} />
            <Texte3D p={[0, 0, 0.04]} w={1} h={1} text="P" color="#ffffff" font={0.7} />
          </group>
        </group>
      ))}
    </group>
    {/* écran géant « règle du jour » */}
    <group position={[10, 0, -4]} rotation={[0, -0.45, 0]}>
      <Bloc p={[0, 2.5, 0]} s={[0.5, 5, 0.5]} c="#3b3f46" />
      <Bloc p={[0, 6.2, 0]} s={[6.4, 3.6, 0.4]} c="#1c2340" r={0.1} />
      <Bloc p={[0, 7.65, 0.22]} s={[6.0, 0.55, 0.05]} c="#e0242a" emissive="#e0242a" ei={0.9} r={0.03} shadow={false} />
      <Texte3D p={[0, 7.65, 0.26]} w={6} h={0.55} text="RÈGLE DU JOUR" color="#ffffff" font={0.38} />
      <Texte3D p={[0, 5.95, 0.22]} w={6} h={2.6} text="" lines={[`JOUR ${regle.jour}`, `INTERDIT ${regle.texte}`.toUpperCase()]} color="#9ff0ff" bg="#0d1a33" font={0.42} glow={1.1} />
    </group>
    {/* fontaine */}
    <group position={[0, 0, 8]}>
      <Bloc p={[0, 0.4, 0]} s={[5.6, 0.8, 5.6]} c="#e8e1d3" r={0.15} />
      <Bloc p={[0, 0.75, 0]} s={[4.8, 0.1, 4.8]} c="#5fc4e8" rough={0.1} r={0.04} />
      <Bloc p={[0, 1.5, 0]} s={[0.9, 1.6, 0.9]} c="#e8e1d3" r={0.12} />
      <Bloc p={[0, 2.35, 0]} s={[2.2, 0.3, 2.2]} c="#e8e1d3" r={0.1} />
      {[0, 1, 2].map((k) => <Bloc key={k} p={[0, 2.8 + ((t * 2 + k * 0.4) % 1.2), 0]} s={[0.25, 0.25, 0.25]} c="#a8e6ff" rough={0.1} shadow={false} r={0.08} />)}
    </group>
    {/* arbres, bancs, lampadaires */}
    {[[-12, 12], [12, 14], [-15, -2], [16, 4]].map(([x, z], i) => <Arbre key={i} x={x} z={z} s={1.2} />)}
    <Banc x={7.5} z={12.5} rot={-0.4} />
    <Banc x={-7.5} z={12.5} rot={0.4} />
    {[[-6, 2], [6, 2], [-6, 16], [6, 18]].map(([x, z], i) => <Lampadaire key={i} x={x} z={z} />)}
    {/* immeubles autour */}
    <Immeuble x={-24} z={-6} w={10} h={14} seed="pmA" rot={Math.PI / 2} />
    <Immeuble x={-24} z={8} w={9} h={11} seed="pmB" rot={Math.PI / 2} />
    <Immeuble x={24} z={-6} w={10} h={16} seed="pmC" rot={-Math.PI / 2} />
    <Immeuble x={24} z={8} w={9} h={12} seed="pmD" rot={-Math.PI / 2} />
    <PanneauRegle3D jour={regle.jour} texte={regle.texte} p={[5.5, 0, 6]} rot={-0.5} scale={0.9} />
    {avecBoite && <LaBoite p={[-14, 0, 2]} rot={0.5} t={t} />}
  </group>
);

// ---------- 3. QG Garage ----------
export const SPOTS_QG_GARAGE = {
  centre: [0, 0, 1] as V3,
  canape: [5.2, 0, -2.2] as V3,
  frigo: [-6, 0, -3] as V3,
  etabli: [-3.6, 0, -3.4] as V3,
  porte: [0, 0, 7] as V3,
  camera_large: {pos: [0, 5.2, 13], target: [0, 2.6, -1]} as Cam,
  camera_proche: {pos: [1.5, 3.3, 7.5], target: [0, 2.6, 0]} as Cam,
};
export const QGGarage: React.FC<{t?: number}> = ({t = 0}) => {
  const flick = 1.6 + 0.3 * Math.sin(t * 17) * Math.sin(t * 2.3);
  return (
    <group>
      <Sol w={18} d={14} kind="beton" p={[0, 0, 1]} c1="#8f8c86" />
      <MurBriques p={[0, 4, -5.2]} w={18} h={8} />
      <MurBriques p={[-9, 4, 1]} w={12.4} h={8} rot={[0, Math.PI / 2, 0]} />
      <MurBriques p={[9, 4, 1]} w={12.4} h={8} rot={[0, -Math.PI / 2, 0]} />
      <Bloc p={[0, 8.1, 1]} s={[18.4, 0.3, 12.8]} c="#2b2430" r={0.02} shadow={false} />
      {[-6, -2, 2, 6].map((x) => <Bloc key={x} p={[x, 7.7, 1]} s={[0.5, 0.5, 12.4]} c="#4a3b30" r={0.05} shadow={false} />)}
      {/* néon BORZ */}
      <Bloc p={[0, 6.1, -4.9]} s={[6.4, 1.9, 0.12]} c="#1a1a1a" r={0.08} />
      <Texte3D p={[0, 6.1, -4.82]} w={6} h={1.8} text="BORZ" color="#8dff3a" font={1.35} glow={2.2} />
      <pointLight position={[0, 6, -3.8]} intensity={10 * flick / 1.6} distance={9} color="#8dff3a" />
      <Texte3D p={[0, 4.75, -4.95]} w={6} h={0.5} text="QG DU QUARTIER" color="#ffffff" font={0.3} />
      {/* canapé rouge */}
      <group position={[5.2, 0, -3.3]}>
        <Bloc p={[0, 0.55, 0]} s={[4.2, 0.9, 1.7]} c="#c3262f" r={0.15} />
        <Bloc p={[0, 1.45, -0.65]} s={[4.2, 1.2, 0.5]} c="#a81f27" r={0.15} />
        {[-1, 1].map((sd) => <Bloc key={sd} p={[sd * 2.0, 1.1, 0]} s={[0.5, 1.2, 1.7]} c="#a81f27" r={0.15} />)}
        <Bloc p={[-0.9, 1.1, 0.1]} s={[0.9, 0.5, 0.6]} c="#ffd23f" r={0.15} />
      </group>
      {/* frigo + glaçons au plafond */}
      <group position={[-7, 0, -3.8]}>
        <Bloc p={[0, 2.1, 0]} s={[1.9, 4.2, 1.5]} c="#e3e7ec" r={0.15} rough={0.3} />
        <Bloc p={[0, 2.9, 0.78]} s={[1.85, 0.06, 0.05]} c="#9aa1ab" />
        <Bloc p={[0.7, 3.6, 0.8]} s={[0.12, 0.8, 0.1]} c="#9aa1ab" rough={0.3} />
        <Bloc p={[0.7, 1.8, 0.8]} s={[0.12, 1.0, 0.1]} c="#9aa1ab" rough={0.3} />
        <Bloc p={[-0.3, 1.2, 0.78]} s={[0.9, 0.55, 0.03]} c="#ffd23f" rot={[0, 0, -0.12]} />
        <Texte3D p={[-0.3, 1.2, 0.8]} w={0.9} h={0.55} text="NE PAS OUVRIR" color="#222" font={0.1} rot={[0, 0, -0.12]} />
      </group>
      {Array.from({length: 7}, (_, i) => <Bloc key={i} p={[-8 + i * 0.35, 7.6 - (0.3 + random(`ic${i}`) * 0.5) / 2, -3.5 + random(`iz${i}`)]} s={[0.18, 0.3 + random(`ic${i}`) * 0.5, 0.18]} c="#bfefff" rough={0.1} shadow={false} r={0.04} />)}
      {/* établi + outils */}
      <group position={[-3.4, 0, -4.3]}>
        <Bloc p={[0, 1.4, 0]} s={[3.6, 0.25, 1.4]} c="#a8703f" r={0.05} />
        {[-1, 1].map((sd) => <Bloc key={sd} p={[sd * 1.6, 0.65, 0]} s={[0.2, 1.3, 1.2]} c="#6b4a2b" />)}
        <Bloc p={[-0.8, 1.7, 0]} s={[0.9, 0.35, 0.5]} c="#e0242a" r={0.05} />
        <Bloc p={[0.6, 1.62, 0.1]} s={[1.1, 0.12, 0.18]} c="#9aa1ab" rough={0.3} />
        <Bloc p={[0, 3.2, -0.55]} s={[3.4, 2.4, 0.08]} c="#8a6a48" r={0.02} />
        {[-1.2, -0.4, 0.4, 1.2].map((x) => <Bloc key={x} p={[x, 3.2, -0.45]} s={[0.12, 1.0, 0.1]} c="#5a5f68" rough={0.3} />)}
      </group>
      {/* étagère de bouteilles BORZ */}
      <group position={[0.2, 0, -4.7]}>
        {[2.2, 3.4].map((y) => <Bloc key={y} p={[0, y, 0]} s={[3.2, 0.15, 0.6]} c="#6b4a2b" />)}
        {['#8fd629', '#ffffff', '#ff3326', '#2f7bff', '#ffd23f', '#ff5fa2', '#9b4dff', '#ff8a1f'].map((c, i) => (
          <group key={i} position={[-1.3 + (i % 4) * 0.85, i < 4 ? 2.6 : 3.8, 0]}>
            <Bloc p={[0, 0, 0]} s={[0.4, 0.65, 0.4]} c={c} rough={0.3} r={0.08} />
            <Bloc p={[0, 0.42, 0]} s={[0.24, 0.18, 0.24]} c={c} rough={0.3} r={0.04} />
          </group>
        ))}
      </group>
      {/* tapis + lampes suspendues */}
      <Bloc p={[0, 0.03, 1]} s={[7, 0.05, 4.4]} c="#7a1e2b" r={0.02} shadow={false} />
      {[-4, 4].map((x) => (
        <group key={x} position={[x, 0, 1]}>
          <Bloc p={[0, 7.2, 0]} s={[0.06, 1.0, 0.06]} c="#111" shadow={false} />
          <Bloc p={[0, 6.55, 0]} s={[1.0, 0.4, 1.0]} c="#2b2b2b" r={0.1} shadow={false} />
          <Bloc p={[0, 6.32, 0]} s={[0.5, 0.1, 0.5]} c="#fff3c4" emissive="#ffe8a0" ei={2} shadow={false} />
        </group>
      ))}
      <Bloc p={[3.5, 0.6, 2.8]} s={[1.2, 1.2, 1.2]} c="#b98a55" r={0.04} />
      <Bloc p={[3.5, 1.21, 2.8]} s={[1.0, 0.02, 0.15]} c="#d9c39a" r={0.005} />
    </group>
  );
};

// ---------- 4. Cuisine de Mamie Zara ----------
export const SPOTS_CUISINE_ZARA = {
  centre: [0, 0, 1.5] as V3,
  fourneau: [-3.6, 0, -2.6] as V3,
  table: [3, 0, 1.8] as V3,
  chaise_gauche: [1.6, 0, 1.8] as V3,
  chaise_droite: [4.4, 0, 1.8] as V3,
  camera_large: {pos: [1, 5.5, 13], target: [0, 2.4, -1]} as Cam,
  camera_proche: {pos: [-1.5, 3.4, 6.5], target: [-3, 2.4, -2]} as Cam,
};
export const CuisineZara: React.FC<{t?: number}> = ({t = 0}) => (
  <group>
    <Sol w={16} d={12} kind="damier" p={[0, 0, 1]} c1="#f4e2c4" c2="#e8a06a" />
    <Bloc p={[0, 4, -5.2]} s={[16, 8, 0.4]} c="#f6c99a" r={0.02} />
    <Bloc p={[-8, 4, 1]} s={[0.4, 8, 12.4]} c="#f2bd88" r={0.02} />
    <Bloc p={[8, 4, 1]} s={[0.4, 8, 12.4]} c="#f2bd88" r={0.02} />
    <Bloc p={[0, 8.1, 1]} s={[16.4, 0.3, 12.4]} c="#e9d9c0" r={0.02} shadow={false} />
    {/* carrelage mural derrière le plan */}
    <Bloc p={[-2, 2.4, -4.98]} s={[11, 1.4, 0.05]} c="#ffffff" r={0.01} />
    {/* plan de travail + placards */}
    <group position={[-2, 0, -4.2]}>
      <Bloc p={[0, 0.85, 0]} s={[11, 1.7, 1.5]} c="#e8d4b0" r={0.08} />
      <Bloc p={[0, 1.78, 0]} s={[11.2, 0.18, 1.6]} c="#b98a55" r={0.05} />
      {[-4.5, -2.25, 0, 2.25, 4.5].map((x) => <Bloc key={x} p={[x, 0.9, 0.77]} s={[2.0, 1.4, 0.05]} c="#f3e3c8" r={0.04} />)}
      {[-4.5, -2.25, 0, 2.25, 4.5].map((x) => <Bloc key={`h${x}`} p={[x + 0.7, 1.2, 0.82]} s={[0.3, 0.08, 0.05]} c="#8a6a48" />)}
      {/* placards hauts */}
      {[-4, -1.5, 1, 3.5].map((x) => <Bloc key={`u${x}`} p={[x, 5.2, 0.1]} s={[2.2, 1.8, 1.0]} c="#f3e3c8" r={0.08} />)}
      {/* fourneau + marmite fumante */}
      <Bloc p={[-1.6, 1.92, 0]} s={[2.2, 0.12, 1.3]} c="#3b3f46" r={0.03} />
      <group position={[-1.6, 2.0, 0]}>
        <Bloc p={[0, 0.45, 0]} s={[1.2, 0.9, 1.2]} c="#a65a2e" r={0.2} rough={0.5} />
        <Bloc p={[0, 0.95, 0]} s={[1.3, 0.1, 1.3]} c="#7a3e1c" r={0.04} />
        {[-1, 1].map((sd) => <Bloc key={sd} p={[sd * 0.72, 0.6, 0]} s={[0.15, 0.15, 0.4]} c="#7a3e1c" r={0.04} />)}
        {[0, 1, 2, 3].map((k) => {
          const ph = (t * 0.6 + k * 0.25) % 1;
          return <Bloc key={k} p={[Math.sin(k * 2 + t) * 0.2, 1.3 + ph * 2.2, 0]} s={[0.4 + ph * 0.5, 0.4 + ph * 0.5, 0.4 + ph * 0.5]} c="#ffffff" r={0.2} shadow={false} rough={1} emissive="#ffffff" ei={0.2 * (1 - ph)} />;
        })}
      </group>
      <Bloc p={[3.2, 2.05, 0]} s={[1.6, 0.3, 1.0]} c="#c9d6df" r={0.05} rough={0.3} />
    </group>
    {/* fenêtre */}
    <Bloc p={[4.5, 4.4, -4.98]} s={[3.2, 2.4, 0.1]} c="#ffffff" r={0.04} />
    <Bloc p={[4.5, 4.4, -4.9]} s={[2.8, 2.0, 0.06]} c="#9fd8ff" emissive="#bfe6ff" ei={0.5} rough={0.1} />
    {/* guirlandes colorées */}
    {Array.from({length: 22}, (_, i) => {
      const x = -7 + i * (14 / 21);
      const y = 7.2 - Math.sin((i / 21) * Math.PI) * 0.8;
      const cols = ['#ff4f5e', '#ffd23f', '#3fd27a', '#4fa3ff', '#c56bff'];
      return <Bloc key={i} p={[x, y, -4.7]} s={[0.3, 0.38, 0.1]} c={cols[i % 5]} emissive={cols[i % 5]} ei={0.6} shadow={false} r={0.06} rot={[0, 0, i % 2 ? 0.3 : -0.3]} />;
    })}
    {/* table + chaises */}
    <group position={[3, 0, 1.8]}>
      <Bloc p={[0, 1.5, 0]} s={[3.6, 0.2, 2.2]} c="#c98b52" r={0.06} />
      <Bloc p={[0, 1.62, 0]} s={[3.2, 0.03, 1.9]} c="#ffffff" r={0.01} />
      {[[-1.6, -0.9], [1.6, -0.9], [-1.6, 0.9], [1.6, 0.9]].map(([x, z], i) => <Bloc key={i} p={[x, 0.7, z]} s={[0.2, 1.4, 0.2]} c="#8a5a30" />)}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 2.6, 0, 0]}>
          <Bloc p={[0, 0.95, 0]} s={[1.1, 0.15, 1.1]} c="#e8a06a" r={0.05} />
          <Bloc p={[sd * 0.5, 1.7, 0]} s={[0.15, 1.4, 1.1]} c="#e8a06a" r={0.05} />
          {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].map(([x, z], i) => <Bloc key={i} p={[x, 0.45, z]} s={[0.12, 0.9, 0.12]} c="#8a5a30" />)}
        </group>
      ))}
      {[-0.8, 0.8].map((x) => <Bloc key={x} p={[x, 1.72, 0]} s={[0.8, 0.12, 0.8]} c="#ffffff" r={0.05} rough={0.3} />)}
      <Bloc p={[0, 1.85, 0]} s={[0.7, 0.3, 0.7]} c="#d65a3a" r={0.1} />
    </group>
  </group>
);

// ---------- 5. Skatepark ----------
export const SPOTS_SKATEPARK = {
  centre: [0, 0, 3] as V3,
  rampe_gauche: [-7.5, 0, 0] as V3,
  rampe_droite: [7.5, 0, 0] as V3,
  banc: [0, 0, 8.5] as V3,
  camera_large: {pos: [3, 9, 22], target: [0, 1.5, 0]} as Cam,
  camera_proche: {pos: [2, 3.2, 10], target: [0, 2.2, 3]} as Cam,
};
const Rampe: React.FC<{p: V3; rot?: number; c?: string}> = ({p, rot = 0, c = '#8fb4c9'}) => (
  <group position={p} rotation={[0, rot, 0]}>
    {Array.from({length: 6}, (_, i) => {
      const a = (i + 0.5) / 6 * (Math.PI / 2);
      const x = 3 - Math.cos(a) * 3, y = 3 - Math.sin(a) * 3;
      return <Bloc key={i} p={[x - 1.5, y + 0.3, 0]} s={[0.62, 0.35, 6]} c={c} rot={[0, 0, a - Math.PI / 2 + Math.PI / 2 - a * 1]} r={0.04} />;
    })}
    <Bloc p={[1.6, 1.5, 0]} s={[0.6, 3.0, 6]} c="#6f8fa3" r={0.05} />
    <Bloc p={[1.6, 3.05, 0]} s={[0.7, 0.12, 6.1]} c="#c9cdd2" rough={0.3} r={0.03} />
  </group>
);
export const Skatepark: React.FC<{t?: number}> = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[220, 220]} /><meshStandardMaterial color="#cfe3b0" roughness={0.95} /></mesh>
    <Sol w={26} d={18} kind="beton" p={[0, 0, 2]} c1="#b9b6ae" />
    {/* rampes quarter-pipe */}
    <group position={[-10.5, 0, 0]}><QuarterPipe /></group>
    <group position={[10.5, 0, 0]} rotation={[0, Math.PI, 0]}><QuarterPipe /></group>
    {/* funbox + rail */}
    <Bloc p={[0, 0.5, -2]} s={[5, 1.0, 3]} c="#e8a06a" r={0.08} />
    <Bloc p={[0, 1.05, -2]} s={[5.1, 0.1, 3.1]} c="#c9cdd2" rough={0.3} r={0.03} />
    <Bloc p={[0, 0.9, 3.5]} s={[6, 0.12, 0.12]} c="#ffd23f" rough={0.3} r={0.04} />
    {[-2.6, 2.6].map((x) => <Bloc key={x} p={[x, 0.45, 3.5]} s={[0.12, 0.9, 0.12]} c="#3b3f46" />)}
    {/* bancs */}
    <Banc x={-4} z={9} /><Banc x={4} z={9} />
    {/* grillage */}
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0, 0, -8]}>
        {Array.from({length: 9}, (_, i) => <Bloc key={i} p={[-13 + i * 3.25, 1.75, 0]} s={[0.15, 3.5, 0.15]} c="#6b7078" rough={0.4} />)}
        {Array.from({length: 7}, (_, i) => <Bloc key={`h${i}`} p={[0, 0.3 + i * 0.5, 0]} s={[26, 0.05, 0.05]} c="#8a9098" rough={0.4} shadow={false} />)}
        {Array.from({length: 27}, (_, i) => <Bloc key={`v${i}`} p={[-13 + i, 1.75, 0]} s={[0.05, 3.4, 0.05]} c="#8a9098" rough={0.4} shadow={false} />)}
        {sd > 0 && null}
      </group>
    ))}
    {/* tags sur un mur */}
    <Bloc p={[0, 2.6, -10]} s={[20, 5.2, 0.6]} c="#d8d0c0" r={0.05} />
    <Texte3D p={[-5, 4.1, -9.68]} w={6} h={2.4} text="BORZ" color="#8dff3a" font={1.5} rot={[0, 0, 0.08]} stroke="#123d00" />
    <Texte3D p={[2.5, 4.2, -9.68]} w={5} h={2} text="SKATTY" color="#ffd23f" font={0.95} rot={[0, 0, -0.06]} stroke="#5a3a00" />
    <Texte3D p={[7.5, 4.0, -9.68]} w={3} h={2} text="★" color="#ff4fd8" font={1.4} stroke="#4a0040" />
    <Arbre x={-15} z={10} s={1.2} /><Arbre x={15} z={10} s={1.2} /><Arbre x={-16} z={-6} s={1.3} /><Arbre x={16} z={-6} s={1.3} />
    <Lampadaire x={-8} z={8} /><Lampadaire x={8} z={8} />
  </group>
);
const QuarterPipe: React.FC = () => {
  const N = 7, R = 3.2, L = 6;
  return (
    <group>
      {Array.from({length: N}, (_, i) => {
        const a0 = (i / N) * (Math.PI / 2), a1 = ((i + 1) / N) * (Math.PI / 2), am = (a0 + a1) / 2;
        const x = -R + R * Math.sin(am), y = R - R * Math.cos(am);
        const len = R * (a1 - a0) + 0.06;
        return <Bloc key={i} p={[-x - R + R, y, 0]} s={[len, 0.25, L]} c="#8fb4c9" rot={[0, 0, -am]} r={0.03} />;
      })}
      <Bloc p={[-R / 2 + 0.2, R / 2, 0]} s={[R - 0.2, R, L]} c="#6f8fa3" r={0.05} />
      <Bloc p={[-0.2, R + 0.05, 0]} s={[1.2, 0.15, L + 0.1]} c="#c9cdd2" rough={0.3} r={0.03} />
      <Bloc p={[0.35, R + 0.12, 0]} s={[0.12, 0.12, L]} c="#ffd23f" rough={0.3} r={0.04} />
    </group>
  );
};
void Rampe;

// ---------- 6. Rue de nuit ----------
export const SPOTS_RUE_NUIT = {
  centre: [0, 0, 0] as V3,
  trottoir_gauche: [-7, 0, -3] as V3,
  trottoir_droit: [7, 0, -3] as V3,
  loin: [0, 0, -30] as V3,
  camera_large: {pos: [4, 4.5, 16], target: [0, 2.6, -8]} as Cam,
  camera_proche: {pos: [2.5, 3.4, 8], target: [0, 2.4, 0]} as Cam,
};
/** Rue de BORZ City ; avec `night`, fenêtres et lampadaires s'allument (à combiner avec <Eclairage mode="nuit" />). */
export const RueNuit: React.FC<{night?: boolean; t?: number}> = ({night = true}) => (
  <group>
    <Rue len={80} />
    {night && (
      <>
        {Array.from({length: 8}, (_, i) => (
          <group key={i}>
            <pointLight position={[i % 2 ? 8.5 : -8.5, 3.8, 6 - i * 9]} intensity={18} distance={11} color="#ffd98a" />
            <Bloc p={[i % 2 ? 8.5 : -8.5, 0.02, 6 - i * 9]} s={[3.5, 0.02, 3.5]} c="#ffe2a0" emissive="#ffcf70" ei={0.25} shadow={false} r={0.005} />
          </group>
        ))}
        {Array.from({length: 40}, (_, i) => {
          const sd = i % 2 ? 1 : -1;
          if (random(`nw${i}`) > 0.55) return null;
          return <Bloc key={`w${i}`} p={[sd * 12.3, 4 + Math.floor(random(`nh${i}`) * 4) * 3, 6 - Math.floor(i / 2) * 4.2]} s={[0.1, 1.2, 0.9]} c="#ffd98a" emissive="#ffc85a" ei={1.4} shadow={false} r={0.02} />;
        })}
      </>
    )}
  </group>
);

/** Fond de ciel 3D pour la nuit (étoiles + lune). */
export const CielNuit: React.FC = () => (
  <group>
    {Array.from({length: 80}, (_, i) => {
      const a = random(`sa${i}`) * Math.PI - Math.PI / 2, e = 0.25 + random(`se${i}`) * 1.1;
      return <mesh key={i} position={[Math.sin(a) * 120 * Math.cos(e), 120 * Math.sin(e) * 0.7 + 10, -Math.cos(a) * 120 * Math.cos(e) - 40]}><sphereGeometry args={[0.25 + random(`sr${i}`) * 0.35, 6, 6]} /><meshBasicMaterial color="#ffffff" fog={false} /></mesh>;
    })}
    <mesh position={[40, 55, -120]}><sphereGeometry args={[7, 24, 24]} /><meshBasicMaterial color="#fff6dc" fog={false} /></mesh>
  </group>
);
