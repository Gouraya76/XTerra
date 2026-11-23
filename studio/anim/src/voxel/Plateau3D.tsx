import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Bloc, Cam, Texte3D} from './Decors3D';

type V3 = [number, number, number];
export type ModePlateau = 'normal' | 'suspense' | 'revelation';

// Positions des décors dans le monde (un seul « studio » géant)
export const X_CUISINE = 40;
export const X_DEGUSTATION = -40;
export const X_COULISSES = 90;

const texCache = new Map<string, THREE.CanvasTexture>();
const tex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) => {
  if (texCache.has(key)) return texCache.get(key)!;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  texCache.set(key, t);
  return t;
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- éléments communs ----------------

/** Sol de studio noir brillant avec motif lumineux. */
const SolStudio: React.FC<{p?: V3; w?: number; d?: number; accent?: string}> = ({p = [0, 0, 0], w = 70, d = 50, accent = '#b84dff'}) => {
  const map = useMemo(() => tex(`solstudio|${accent}`, 512, 512, (g) => {
    g.fillStyle = '#0d0716'; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = accent; g.globalAlpha = 0.35; g.lineWidth = 3;
    for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, 512); g.moveTo(0, k * 64); g.lineTo(512, k * 64); g.stroke(); }
    g.globalAlpha = 0.12; g.fillStyle = accent;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x * 7 + y * 3) % 5 === 0) g.fillRect(x * 64 + 4, y * 64 + 4, 56, 56);
  }, [w / 4, d / 4]), [accent, w, d]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={add(p, [0, -0.005, 0])} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.18} metalness={0.35} />
    </mesh>
  );
};

/** Grand anneau lumineux au sol (centre de scène). */
const AnneauSol: React.FC<{p: V3; r: number; c: string; ei?: number}> = ({p, r, c, ei = 1.6}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={add(p, [0, 0.01, 0])}>
    <ringGeometry args={[r - 0.18, r, 64]} />
    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei} toneMapped={false} />
  </mesh>
);

/** Néon linéaire. */
const Neon: React.FC<{p: V3; s: V3; c: string; ei?: number; rot?: V3}> = ({p, s, c, ei = 2.2, rot}) => (
  <Bloc p={p} s={s} c={c} emissive={c} ei={ei} r={0.03} rot={rot} shadow={false} />
);

/** Faisceau de projecteur visible (cône additif), de `from` vers `to`. */
const Faisceau: React.FC<{from: V3; to: V3; c: string; r?: number; o?: number}> = ({from, to, c, r = 2.2, o = 0.07}) => {
  const {pos, quat, h} = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const dir = a.clone().sub(b); const h = dir.length(); dir.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    return {pos: [mid.x, mid.y, mid.z] as V3, quat: q, h};
  }, [from.join(), to.join()]);
  return (
    <mesh position={pos} quaternion={quat}>
      <coneGeometry args={[r, h, 24, 1, true]} />
      <meshBasicMaterial color={c} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Projecteur (boîtier) suspendu + faisceau. */
const Projecteur: React.FC<{p: V3; to: V3; c: string; o?: number}> = ({p, to, c, o}) => (
  <group>
    <Bloc p={p} s={[0.7, 0.7, 0.9]} c="#1b1b22" r={0.12} rough={0.4} shadow={false} />
    <Bloc p={add(p, [0, -0.38, 0])} s={[0.5, 0.06, 0.5]} c={c} emissive={c} ei={3} shadow={false} />
    <Faisceau from={add(p, [0, -0.4, 0])} to={to} c={c} o={o} />
  </group>
);

/** Rampe de projecteurs (truss) au plafond. */
const Rampe: React.FC<{z: number; x0: number; x1: number; y?: number; colors: string[]; t: number; cibleZ: number}> = ({z, x0, x1, y = 13, colors, t, cibleZ}) => {
  const n = colors.length;
  return (
    <group>
      <Bloc p={[(x0 + x1) / 2, y + 0.55, z]} s={[x1 - x0 + 1, 0.25, 0.25]} c="#3a3a46" r={0.03} rough={0.4} shadow={false} />
      <Bloc p={[(x0 + x1) / 2, y + 0.95, z]} s={[x1 - x0 + 1, 0.25, 0.25]} c="#3a3a46" r={0.03} rough={0.4} shadow={false} />
      {colors.map((c, i) => {
        const x = x0 + (i + 0.5) * ((x1 - x0) / n);
        const sway = Math.sin(t * 0.8 + i * 1.7) * 3;
        return <Projecteur key={i} p={[x, y, z]} to={[x * 0.6 + sway, 0, cibleZ + Math.cos(t * 0.6 + i) * 2]} c={c} />;
      })}
    </group>
  );
};

/** Caméra TV sur trépied. */
const CameraTV: React.FC<{p: V3; rot?: number}> = ({p, rot = 0}) => (
  <group position={p} rotation={[0, rot, 0]}>
    {[-1, 1, 0].map((k, i) => <Bloc key={i} p={[k * 0.45, 0.8, i === 2 ? -0.5 : 0.3]} s={[0.1, 1.7, 0.1]} c="#2a2a30" rot={[i === 2 ? 0.25 : -0.15, 0, k * 0.25]} shadow={false} />)}
    <Bloc p={[0, 1.75, 0]} s={[0.3, 0.3, 0.3]} c="#2a2a30" />
    <Bloc p={[0, 2.25, 0]} s={[0.8, 0.7, 1.5]} c="#33333c" r={0.1} rough={0.4} />
    <Bloc p={[0, 2.25, 0.95]} s={[0.55, 0.55, 0.5]} c="#15151a" r={0.1} rough={0.2} />
    <Bloc p={[0, 2.25, 1.21]} s={[0.4, 0.4, 0.03]} c="#3d6bff" emissive="#3d6bff" ei={0.6} shadow={false} />
    <Bloc p={[0, 2.75, -0.2]} s={[0.4, 0.3, 0.6]} c="#22222a" />
    <Bloc p={[0.25, 2.75, -0.15]} s={[0.12, 0.12, 0.12]} c="#ff2d2d" emissive="#ff2d2d" ei={3} shadow={false} />
  </group>
);

/** Gradins de public : silhouettes cubiques simples. */
const Gradins: React.FC<{p: V3; cols?: number; rows?: number; rot?: number; t: number; seed?: number}> = ({p, cols = 8, rows = 3, rot = 0, t, seed = 1}) => {
  const tons = ['#5b3a8a', '#3a4f8a', '#8a3a6f', '#3a7a7a', '#7a5a3a', '#4a3a6a'];
  const peau = ['#e8b48a', '#c98a5e', '#8a5a3a', '#f2c9a0'];
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    out.push(<Bloc key={`m${r}`} p={[0, 0.5 + r * 1.0, -r * 1.4]} s={[cols * 1.3 + 0.6, 1.0 + r * 2.0 - r * 1.0, 1.4]} c="#1a1426" r={0.04} />);
    for (let c = 0; c < cols; c++) {
      const k = (c * 13 + r * 7 + seed * 5) % 97;
      const x = (c - (cols - 1) / 2) * 1.3;
      const y = 1.0 + r * 1.0;
      const z = -r * 1.4;
      const clap = Math.abs(Math.sin(t * 6 + k)) * 0.08;
      out.push(<group key={`${r}-${c}`} position={[x, y + clap, z]}>
        <Bloc p={[0, 0.55, 0]} s={[0.8, 1.0, 0.6]} c={tons[k % tons.length]} r={0.1} shadow={false} />
        <Bloc p={[0, 1.4, 0]} s={[0.66, 0.66, 0.6]} c={peau[k % peau.length]} r={0.1} shadow={false} />
      </group>);
    }
  }
  return <group position={p} rotation={[0, rot, 0]}>{out}</group>;
};

/** Grand écran LED avec cadre néon. */
const EcranLED: React.FC<{p: V3; w: number; h: number; text: string; t: number; c?: string}> = ({p, w, h, text, t, c = '#ff3ec9'}) => {
  const lines = text.length > 14 && text.includes(' ') ? splitLines(text) : [text];
  const pulse = 1.4 + Math.sin(t * 2.2) * 0.25;
  return (
    <group position={p}>
      <Bloc p={[0, 0, -0.35]} s={[w + 1.2, h + 1.2, 0.5]} c="#111018" r={0.1} rough={0.4} />
      <Texte3D p={[0, 0, -0.05]} w={w} h={h} text={text} lines={lines} color="#fff3a8" bg="#24104a" font={Math.min(lines.length === 1 ? 2.3 : 1.9, (w * 0.9) / (0.62 * Math.max(...lines.map((l) => l.length))))} glow={pulse} />
      <Neon p={[0, h / 2 + 0.5, 0]} s={[w + 1.1, 0.14, 0.14]} c={c} />
      <Neon p={[0, -h / 2 - 0.5, 0]} s={[w + 1.1, 0.14, 0.14]} c={c} />
      <Neon p={[-w / 2 - 0.55, 0, 0]} s={[0.14, h + 1.1, 0.14]} c={c} />
      <Neon p={[w / 2 + 0.55, 0, 0]} s={[0.14, h + 1.1, 0.14]} c={c} />
    </group>
  );
};
const splitLines = (s: string): string[] => {
  const words = s.split(' ');
  if (words.length < 2) return [s];
  let best = 1, bestDiff = 1e9;
  for (let k = 1; k < words.length; k++) {
    const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length);
    if (d < bestDiff) { bestDiff = d; best = k; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
};

/** Pupitre de candidat numéroté. */
const Pupitre: React.FC<{p: V3; rot: number; n: number; elimine: boolean; t: number}> = ({p, rot, n, elimine, t}) => {
  const c = elimine ? '#ff2a2a' : ['#2ee6ff', '#ff3ec9', '#ffd23f', '#7dff5a', '#b16bff'][n - 1];
  const blink = elimine ? 1.6 + Math.sin(t * 8) * 0.8 : 1.8;
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Bloc p={[0, 0.8, 0]} s={[1.9, 1.6, 0.9]} c="#1c1530" r={0.12} rough={0.3} />
      <Bloc p={[0, 1.66, 0.05]} s={[2.1, 0.14, 1.1]} c="#e8e2f5" r={0.05} rough={0.3} />
      <Neon p={[0, 0.08, 0.46]} s={[1.9, 0.1, 0.06]} c={c} ei={blink} />
      <Neon p={[0, 1.55, 0.47]} s={[1.9, 0.08, 0.06]} c={c} ei={blink} />
      <Texte3D p={[0, 0.82, 0.46]} w={1.2} h={1.1} text={String(n)} color={c} font={0.95} glow={blink} />
      {elimine && <group position={[0, 0.82, 0.5]}>
        <Bloc p={[0, 0, 0]} s={[1.5, 0.22, 0.06]} c="#ff2a2a" emissive="#ff2a2a" ei={2.5} rot={[0, 0, 0.75]} shadow={false} />
        <Bloc p={[0, 0, 0.01]} s={[1.5, 0.22, 0.06]} c="#ff2a2a" emissive="#ff2a2a" ei={2.5} rot={[0, 0, -0.75]} shadow={false} />
      </group>}
    </group>
  );
};

// ---------------- 1. Plateau TV ----------------
const CANDIDATS_ANGLE = [-0.55, -0.7, -0.85, -1.0, -1.15];
const ARC_C: V3 = [-6, 0, 3]; // centre de l'arc = côté enquêteurs
const candPos = (i: number): V3 => {
  // arc de cercle à droite/au fond, chaque pupitre tourné vers les enquêteurs
  const a = -1.05 + i * 0.2125;
  return [ARC_C[0] + Math.cos(a) * 15, 0, ARC_C[2] + Math.sin(a) * 15];
};
const candRot = (i: number) => {
  const p = candPos(i);
  return Math.atan2(ARC_C[0] - p[0], ARC_C[2] - p[2]);
};
// bureau des enquêteurs : pivote pour faire face aux candidats
const BUREAU: V3 = [-8.3, 0, 1.2];
const BUREAU_ROT = 0.42;
const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const enq = (z: number): V3 => add(BUREAU, rotY([-2.6, 0, z], BUREAU_ROT));

export const SPOTS_PLATEAU = (() => {
  const s: Record<string, any> = {
    centre: [1, 0, -1] as V3,
    presentateur: [-3, 0.35, -6] as V3,
    enqueteur_1: enq(-1.4),
    enqueteur_2: enq(1.4),
    rot_enqueteurs: Math.PI / 2 + BUREAU_ROT,
    cam_large: {pos: [-1.5, 8.5, 20.5], target: [-0.5, 2.6, -3.5]} as Cam,
    cam_presentateur: {pos: [-2.1, 3.2, -1.3], target: [-3, 2.5, -6]} as Cam,
    cam_enqueteurs: {pos: add(BUREAU, rotY([3.2, 3.3, 0.9], BUREAU_ROT)), target: add(BUREAU, rotY([-2.6, 2.5, 0], BUREAU_ROT))} as Cam,
    cam_candidats: {pos: [-5, 5.2, 6], target: [5.5, 2.2, -5]} as Cam,
    cam_face_a_face: {pos: [-1, 13, 15], target: [1, 1.5, -3]} as Cam,
  };
  for (let i = 0; i < 5; i++) {
    const p = candPos(i); const r = candRot(i);
    // le candidat se tient derrière son pupitre
    const back: V3 = [p[0] - Math.sin(r) * 1.1, 0, p[2] - Math.cos(r) * 1.1];
    s[`candidat_${i + 1}`] = back;
    s[`pupitre_${i + 1}`] = p;
    s[`rot_candidat_${i + 1}`] = r;
    const eye: V3 = [back[0] + Math.sin(r) * 5.2 + Math.cos(r) * 0.9, 3.3, back[2] + Math.cos(r) * 5.2 - Math.sin(r) * 0.9];
    s[`cam_candidat_${i + 1}`] = {pos: eye, target: [back[0], 2.75, back[2]]} as Cam;
  }
  return s as {
    centre: V3; presentateur: V3; enqueteur_1: V3; enqueteur_2: V3;
    candidat_1: V3; candidat_2: V3; candidat_3: V3; candidat_4: V3; candidat_5: V3;
    pupitre_1: V3; pupitre_2: V3; pupitre_3: V3; pupitre_4: V3; pupitre_5: V3;
    rot_enqueteurs: number; rot_candidat_1: number; rot_candidat_2: number; rot_candidat_3: number; rot_candidat_4: number; rot_candidat_5: number;
    cam_large: Cam; cam_presentateur: Cam; cam_enqueteurs: Cam; cam_candidats: Cam; cam_face_a_face: Cam;
    cam_candidat_1: Cam; cam_candidat_2: Cam; cam_candidat_3: Cam; cam_candidat_4: Cam; cam_candidat_5: Cam;
  };
})();
void CANDIDATS_ANGLE;

export const PlateauTV: React.FC<{t?: number; ecran?: string; elimines?: number[]; lumiere?: ModePlateau}> = ({t = 0, ecran = 'QUI EST LE VRAI CHEF ?', elimines = [], lumiere = 'normal'}) => {
  const proj = lumiere === 'suspense' ? ['#2f6bff', '#1a3cff', '#3a8bff', '#2f6bff', '#1a3cff', '#3a8bff']
    : lumiere === 'revelation' ? ['#ffd23f', '#ffb21a', '#fff0a0', '#ffd23f', '#ffb21a', '#fff0a0']
    : ['#ff3ec9', '#2ee6ff', '#ffd23f', '#b16bff', '#ff3ec9', '#2ee6ff'];
  const accent = lumiere === 'suspense' ? '#2f6bff' : lumiere === 'revelation' ? '#ffc21a' : '#b84dff';
  return (
    <group>
      <SolStudio accent={accent} />
      {/* scène centrale */}
      <Bloc p={[1, 0.08, -1]} s={[13, 0.16, 11]} c="#1a1030" r={0.08} rough={0.2} />
      <AnneauSol p={[1, 0.16, -1]} r={5.6} c={accent} />
      <AnneauSol p={[1, 0.16, -1]} r={3.6} c="#ff3ec9" ei={1} />
      {/* mur du fond */}
      <Bloc p={[0, 8, -16.5]} s={[70, 16, 0.6]} c="#140b24" r={0.05} />
      {[-30, -24, 24, 30].map((x) => <Neon key={x} p={[x, 7.5, -16.1]} s={[0.18, 13, 0.1]} c={x < 0 ? '#2ee6ff' : '#ff3ec9'} />)}
      {/* grand écran */}
      <EcranLED p={[1, 7.2, -14.6]} w={15} h={6.4} text={ecran} t={t} c={accent} />
      <Texte3D p={[1, 1.3, -14.25]} w={9} h={0.9} text="★ PRIME TIME ★" color="#ffd23f" font={0.6} glow={1.3} />
      {/* podium du présentateur */}
      <group position={[-3, 0, -6]}>
        <Bloc p={[0, 0.17, 0]} s={[3.2, 0.34, 3.2]} c="#2a1a46" r={0.2} rough={0.2} />
        <AnneauSol p={[0, 0.34, 0]} r={1.55} c="#ffd23f" ei={2} />
        <Bloc p={[1.9, 0.95, -0.3]} s={[0.9, 1.6, 0.6]} c="#2a1a46" r={0.1} rough={0.25} />
        <Bloc p={[1.9, 1.8, -0.3]} s={[1.0, 0.1, 0.7]} c="#ffd23f" emissive="#ffd23f" ei={0.5} />
      </group>
      {/* bureau des enquêteurs (à gauche, face aux candidats) */}
      <group position={BUREAU} rotation={[0, BUREAU_ROT, 0]}>
        <Bloc p={[0, 0.65, 0]} s={[1.6, 1.3, 6.2]} c="#21183a" r={0.12} rough={0.3} />
        <Bloc p={[0, 1.36, 0]} s={[1.9, 0.12, 6.6]} c="#f2ecff" r={0.05} rough={0.2} />
        <Neon p={[0.81, 0.15, 0]} s={[0.06, 0.1, 6.1]} c="#2ee6ff" />
        <Texte3D p={[0.82, 0.78, 0]} w={5} h={0.7} text="ENQUÊTEURS" color="#2ee6ff" font={0.5} rot={[0, Math.PI / 2, 0]} glow={1.5} />
        {[-1.4, 1.4].map((z) => <group key={z}>
          <Bloc p={[0.2, 1.5, z]} s={[0.7, 0.18, 0.5]} c="#f5f5f5" rot={[0, 0, 0.1]} />
          <Bloc p={[0.3, 1.55, z + 0.7]} s={[0.12, 0.2, 0.12]} c="#ffd23f" emissive="#ffd23f" ei={1.5} shadow={false} />
        </group>)}
      </group>
      {/* fauteuils des enquêteurs */}
      {[-1.4, 1.4].map((z) => <group key={z} position={add(BUREAU, rotY([-3.5, 0, z], BUREAU_ROT))} rotation={[0, BUREAU_ROT, 0]}>
        <Bloc p={[0, 0.6, 0]} s={[1.2, 0.3, 1.2]} c="#7a1f5a" r={0.12} />
        <Bloc p={[-0.55, 1.4, 0]} s={[0.2, 1.6, 1.2]} c="#7a1f5a" r={0.08} />
        <Bloc p={[0, 0.25, 0]} s={[0.2, 0.5, 0.2]} c="#c0c0c8" rough={0.2} />
      </group>)}
      {/* pupitres candidats */}
      {[0, 1, 2, 3, 4].map((i) => <Pupitre key={i} p={candPos(i)} rot={candRot(i)} n={i + 1} elimine={elimines.includes(i)} t={t} />)}
      {/* gradins */}
      <Gradins p={[-20, 0, -9]} rot={0.45} t={t} seed={1} />
      <Gradins p={[22, 0, -9]} rot={-0.45} t={t} seed={2} />
      {/* rampes de projecteurs */}
      <Rampe z={-9} x0={-16} x1={18} colors={proj} t={t} cibleZ={-1} />
      <Rampe z={6} x0={-14} x1={16} colors={proj.slice(0, 4)} t={t + 3} cibleZ={-2} />
      {/* caméras TV */}
      <CameraTV p={[-3, 0, 9]} rot={0.25} />
      <CameraTV p={[9, 0, 8]} rot={-0.6} />
      {/* néons au sol */}
      <Neon p={[1, 0.05, 4.6]} s={[13, 0.08, 0.12]} c={accent} />
    </group>
  );
};

// ---------------- 2. Cuisine d'épreuve ----------------
export const SPOTS_CUISINE = (() => {
  const s: Record<string, any> = {centre: [X_CUISINE, 0, 0] as V3, cam_large: {pos: [X_CUISINE + 1, 7.5, 20], target: [X_CUISINE, 4, -2]} as Cam};
  for (let i = 0; i < 5; i++) {
    const x = X_CUISINE + (i - 2) * 4.6;
    s[`poste_${i + 1}`] = [x, 0, -1.6] as V3;
    s[`cam_poste_${i + 1}`] = {pos: [x + 0.8, 3.6, 4.2], target: [x, 2.2, -1.2]} as Cam;
  }
  s.chrono = [X_CUISINE, 9, -9] as V3;
  return s as {centre: V3; chrono: V3; cam_large: Cam; poste_1: V3; poste_2: V3; poste_3: V3; poste_4: V3; poste_5: V3;
    cam_poste_1: Cam; cam_poste_2: Cam; cam_poste_3: Cam; cam_poste_4: Cam; cam_poste_5: Cam};
})();

const PosteCuisine: React.FC<{p: V3; n: number; t: number}> = ({p, n, t}) => {
  const c = ['#2ee6ff', '#ff3ec9', '#ffd23f', '#7dff5a', '#b16bff'][n - 1];
  const fume = 0.5 + Math.sin(t * 3 + n) * 0.1;
  return (
    <group position={p}>
      {/* plan de travail devant le candidat (côté caméra) */}
      <group position={[0, 0, 1.4]}>
        <Bloc p={[0, 0.55, 0]} s={[3.8, 1.1, 1.6]} c="#dfe4ea" r={0.06} rough={0.35} />
        <Bloc p={[0, 1.15, 0]} s={[4.0, 0.12, 1.8]} c="#3a3f4a" r={0.03} rough={0.25} />
        <Neon p={[0, 0.1, 0.81]} s={[3.8, 0.08, 0.06]} c={c} />
        <Texte3D p={[0, 0.62, 0.81]} w={1} h={0.8} text={String(n)} color={c} font={0.6} glow={1.6} />
        {/* planche + couteau + oignons */}
        <Bloc p={[-0.8, 1.25, 0.1]} s={[1.4, 0.08, 0.9]} c="#c68a4a" r={0.02} />
        <Bloc p={[-0.6, 1.32, 0.1]} s={[0.9, 0.04, 0.14]} c="#d9dde3" rough={0.15} r={0.01} />
        <Bloc p={[-1.15, 1.33, 0.1]} s={[0.32, 0.08, 0.16]} c="#222" r={0.02} />
        {[0, 1, 2].map((k) => <Bloc key={k} p={[-1.25 + k * 0.32, 1.42, -0.25]} s={[0.26, 0.26, 0.26]} c="#e8d3a0" r={0.1} />)}
        {/* plaque + poêle */}
        <Bloc p={[0.9, 1.23, 0]} s={[1.3, 0.04, 1.0]} c="#111" rough={0.15} r={0.02} />
        <Bloc p={[0.9, 1.3, 0]} s={[0.9, 0.12, 0.9]} c="#2b2b2f" r={0.06} rough={0.3} />
        <Bloc p={[0.9, 1.33, 0.75]} s={[0.12, 0.08, 0.7]} c="#2b2b2f" r={0.03} />
        <Bloc p={[0.9, 1.9 + fume * 0.3, 0]} s={[0.35, 0.35, 0.35]} c="#ffffff" r={0.15} shadow={false} />
        <Bloc p={[0.75, 2.4 + fume * 0.4, -0.05]} s={[0.25, 0.25, 0.25]} c="#ffffff" r={0.12} shadow={false} />
      </group>
      {/* étagère arrière */}
      <Bloc p={[0, 2.6, -1.0]} s={[3.6, 0.12, 0.6]} c="#8a5a3a" r={0.02} />
      {['#e94b3c', '#f2c14e', '#7ac74f', '#ffffff'].map((col, k) => <Bloc key={k} p={[-1.2 + k * 0.8, 2.95, -1.0]} s={[0.35, 0.6, 0.35]} c={col} r={0.08} />)}
    </group>
  );
};

export const CuisineEpreuve: React.FC<{t?: number; chrono?: number}> = ({t = 0, chrono}) => {
  const secondes = chrono ?? Math.max(0, 30 - Math.floor(t % 31));
  const txt = `00:${String(secondes).padStart(2, '0')}`;
  const rouge = secondes <= 10;
  return (
    <group>
      <SolStudio p={[X_CUISINE, 0, 0]} w={44} d={36} accent="#2ee6ff" />
      <Bloc p={[X_CUISINE, 7, -10]} s={[44, 14, 0.6]} c="#140b24" r={0.05} />
      {/* chrono LED */}
      <group position={[X_CUISINE, 9, -9.5]}>
        <Bloc p={[0, 0, -0.2]} s={[9.6, 3.6, 0.4]} c="#0a0a10" r={0.1} />
        <Texte3D p={[0, 0, 0.02]} w={9} h={3} text={txt} color={rouge ? '#ff3030' : '#ffd23f'} bg="#120808" font={2.0} glow={2.2} />
        <Neon p={[0, 2, 0]} s={[9.8, 0.12, 0.12]} c="#ff3ec9" />
        <Neon p={[0, -2, 0]} s={[9.8, 0.12, 0.12]} c="#ff3ec9" />
      </group>
      <Texte3D p={[X_CUISINE, 5.6, -9.65]} w={14} h={1.1} text="ÉPREUVE EN CUISINE" color="#2ee6ff" font={0.75} glow={1.6} />
      {[0, 1, 2, 3, 4].map((i) => <PosteCuisine key={i} p={SPOTS_CUISINE[`poste_${i + 1}` as 'poste_1']} n={i + 1} t={t} />)}
      <Rampe z={-4} x0={X_CUISINE - 14} x1={X_CUISINE + 14} y={12} colors={['#2ee6ff', '#ffd23f', '#ff3ec9', '#2ee6ff', '#ffd23f']} t={t} cibleZ={-1} />
      <CameraTV p={[X_CUISINE - 9, 0, 9]} rot={0.4} />
    </group>
  );
};

// ---------------- 3. Salle de dégustation ----------------
export const SPOTS_DEGUSTATION = (() => {
  const s: Record<string, any> = {centre: [X_DEGUSTATION, 0, 0] as V3, cam_large: {pos: [X_DEGUSTATION + 1, 6.5, 17], target: [X_DEGUSTATION, 3.6, -2]} as Cam,
    jury_1: [X_DEGUSTATION - 1.6, 0, 3.6] as V3, jury_2: [X_DEGUSTATION + 1.6, 0, 3.6] as V3};
  for (let i = 0; i < 5; i++) {
    const x = X_DEGUSTATION + (i - 2) * 3.2;
    s[`place_${i + 1}`] = [x, 0, -2.2] as V3;
    s[`assiette_${i + 1}`] = [x, 1.25, -0.4] as V3;
    s[`cam_place_${i + 1}`] = {pos: [x + 0.6, 3.4, 3.8], target: [x, 2.2, -1.4]} as Cam;
  }
  s.cam_assiettes = {pos: [X_DEGUSTATION, 4.2, 6], target: [X_DEGUSTATION, 1.3, -0.4]} as Cam;
  return s as {centre: V3; cam_large: Cam; cam_assiettes: Cam; jury_1: V3; jury_2: V3;
    place_1: V3; place_2: V3; place_3: V3; place_4: V3; place_5: V3;
    assiette_1: V3; assiette_2: V3; assiette_3: V3; assiette_4: V3; assiette_5: V3;
    cam_place_1: Cam; cam_place_2: Cam; cam_place_3: Cam; cam_place_4: Cam; cam_place_5: Cam};
})();

const Cloche: React.FC<{p: V3; n: number; ouverte?: boolean}> = ({p, n, ouverte}) => (
  <group position={p}>
    <Bloc p={[0, 0.03, 0]} s={[1.5, 0.06, 1.5]} c="#ffffff" r={0.03} rough={0.2} />
    <group position={[0, ouverte ? 1.0 : 0, ouverte ? -0.3 : 0]} rotation={[ouverte ? -0.5 : 0, 0, 0]}>
      <Bloc p={[0, 0.3, 0]} s={[1.2, 0.45, 1.2]} c="#c9ced6" r={0.2} rough={0.15} />
      <Bloc p={[0, 0.62, 0]} s={[0.8, 0.25, 0.8]} c="#d6dbe2" r={0.12} rough={0.15} />
      <Bloc p={[0, 0.82, 0]} s={[0.18, 0.18, 0.18]} c="#e8ecf2" r={0.08} rough={0.1} />
    </group>
    <Texte3D p={[0, 0.25, 0.77]} w={0.5} h={0.4} text={String(n)} color="#1a1030" bg="#ffd23f" font={0.32} />
  </group>
);

export const SalleDegustation: React.FC<{t?: number; ouvertes?: number[]}> = ({t = 0, ouvertes = []}) => (
  <group>
    <SolStudio p={[X_DEGUSTATION, 0, 0]} w={40} d={34} accent="#ffd23f" />
    <Bloc p={[X_DEGUSTATION, 7, -9]} s={[40, 14, 0.6]} c="#1c0f1e" r={0.05} />
    {/* table longue nappée */}
    <group position={[X_DEGUSTATION, 0, -0.4]}>
      <Bloc p={[0, 1.05, 0]} s={[16.5, 0.18, 2.4]} c="#f7f2ea" r={0.04} />
      <Bloc p={[0, 0.6, 1.15]} s={[16.5, 0.9, 0.1]} c="#a3142e" r={0.02} />
      <Bloc p={[0, 0.6, -1.15]} s={[16.5, 0.9, 0.1]} c="#a3142e" r={0.02} />
      {[-7.8, 7.8].map((x) => <Bloc key={x} p={[x, 0.5, 0]} s={[0.3, 1.0, 2.0]} c="#6a4a2a" />)}
      <Neon p={[0, 0.12, 1.25]} s={[16.4, 0.08, 0.06]} c="#ffd23f" />
    </group>
    {[0, 1, 2, 3, 4].map((i) => <Cloche key={i} p={SPOTS_DEGUSTATION[`assiette_${i + 1}` as 'assiette_1']} n={i + 1} ouverte={ouvertes.includes(i)} />)}
    {/* bandeaux suspendus */}
    {[-6, 6].map((x) => <group key={x} position={[X_DEGUSTATION + x, 8.5, -6]}>
      <Bloc p={[0, 0, 0]} s={[5.6, 2.2, 0.12]} c="#a3142e" r={0.05} />
      <Texte3D p={[0, 0, 0.08]} w={5.2} h={1.6} text="DÉGUSTATION" color="#ffd23f" font={0.62} glow={0.6} />
      <Bloc p={[-2.6, 1.8, 0]} s={[0.05, 1.6, 0.05]} c="#888" shadow={false} />
      <Bloc p={[2.6, 1.8, 0]} s={[0.05, 1.6, 0.05]} c="#888" shadow={false} />
    </group>)}
    <Texte3D p={[X_DEGUSTATION, 6.2, -8.65]} w={18} h={2.2} text="À L'AVEUGLE" color="#ffffff" font={1.3} glow={1.4} />
    {/* lustre */}
    <group position={[X_DEGUSTATION, 10, -0.4]}>
      <Bloc p={[0, 0, 0]} s={[3, 0.2, 1.2]} c="#d4af37" rough={0.3} r={0.05} />
      {[-1.2, -0.4, 0.4, 1.2].map((x) => <Bloc key={x} p={[x, -0.5, 0]} s={[0.25, 0.6, 0.25]} c="#fff4c9" emissive="#ffe08a" ei={2.5} shadow={false} />)}
    </group>
    <Faisceau from={[X_DEGUSTATION, 9.6, -0.4]} to={[X_DEGUSTATION, 1, -0.4]} c="#ffe08a" r={6} o={0.06} />
    {/* chaises du jury */}
    {[-1.6, 1.6].map((x) => <group key={x} position={[X_DEGUSTATION + x, 0, 4.3]}>
      <Bloc p={[0, 0.6, 0]} s={[1.1, 0.25, 1.1]} c="#7a1f5a" r={0.1} />
      <Bloc p={[0, 1.3, 0.5]} s={[1.1, 1.4, 0.2]} c="#7a1f5a" r={0.08} />
    </group>)}
    <Rampe z={-5} x0={X_DEGUSTATION - 14} x1={X_DEGUSTATION + 14} y={12} colors={['#ffd23f', '#ff3ec9', '#ffd23f', '#ff3ec9']} t={t} cibleZ={-1} />
  </group>
);

// ---------------- 4. Coulisses ----------------
export const SPOTS_COULISSES = {
  centre: [X_COULISSES, 0, 0] as V3,
  porte_gauche: [X_COULISSES - 2.4, 0, -4] as V3,
  porte_droite: [X_COULISSES + 2.4, 0, -8] as V3,
  fond: [X_COULISSES, 0, -14] as V3,
  cam_large: {pos: [X_COULISSES + 1, 3.6, 9], target: [X_COULISSES, 2.4, -6]} as Cam,
  cam_proche: {pos: [X_COULISSES + 1.2, 3.2, 3.5], target: [X_COULISSES, 2.6, -1]} as Cam,
};

export const CouloirCoulisses: React.FC<{t?: number}> = ({t = 0}) => {
  const X = X_COULISSES;
  const flick = 1.8 + (Math.sin(t * 23) > 0.92 ? -1.2 : 0);
  const portes: React.ReactNode[] = [];
  [-1, 1].forEach((side) => [-3, -8, -13].forEach((z, k) => {
    const nom = ['LOGE 1', 'LOGE 2', 'LOGE 3', 'LOGE 4', 'LOGE 5', 'RÉGIE'][k + (side > 0 ? 3 : 0)];
    portes.push(<group key={`${side}${z}`} position={[X + side * 3.4, 0, z]} rotation={[0, -side * Math.PI / 2, 0]}>
      <Bloc p={[0, 1.6, 0]} s={[1.8, 3.2, 0.15]} c={side < 0 ? '#5a2a7a' : '#2a4a7a'} r={0.05} />
      <Bloc p={[0.6, 1.5, 0.1]} s={[0.12, 0.12, 0.12]} c="#d4af37" rough={0.2} />
      <Texte3D p={[0, 2.5, 0.09]} w={0.9} h={0.9} text="★" color="#ffd23f" font={0.8} glow={1.2} />
      <Texte3D p={[0, 3.45, 0.09]} w={1.6} h={0.4} text={nom} color="#ffffff" bg="#1a1020" font={0.26} />
    </group>);
  }));
  return (
    <group>
      <Bloc p={[X, -0.05, -6]} s={[8, 0.1, 22]} c="#3a3540" r={0.02} rough={0.8} />
      <Bloc p={[X - 3.6, 2.5, -6]} s={[0.3, 5, 22]} c="#2b2433" r={0.03} />
      <Bloc p={[X + 3.6, 2.5, -6]} s={[0.3, 5, 22]} c="#2b2433" r={0.03} />
      <Bloc p={[X, 5.1, -6]} s={[7.6, 0.2, 22]} c="#1d1924" r={0.03} />
      <Bloc p={[X, 2.5, -17]} s={[7.6, 5, 0.3]} c="#241d2e" r={0.03} />
      {portes}
      <Neon p={[X, 4.2, -16.8]} s={[3.8, 0.1, 0.1]} c="#ff3ec9" />
      <Texte3D p={[X, 3.4, -16.8]} w={4} h={1.3} text="LOGES" color="#ff3ec9" font={0.9} glow={flick} />
      {/* néons de plafond */}
      {[-2, -7, -12].map((z) => <Neon key={z} p={[X, 4.95, z]} s={[2.4, 0.08, 0.3]} c="#e8f0ff" ei={1.6} />)}
      {/* caisses de matériel */}
      <Bloc p={[X - 2.6, 0.5, 1]} s={[1.2, 1.0, 1.0]} c="#1b1b20" r={0.06} />
      <Bloc p={[X - 2.6, 1.3, 1]} s={[1.0, 0.6, 0.9]} c="#1b1b20" r={0.06} />
      <Bloc p={[X - 2.6, 0.5, 1.51]} s={[1.0, 0.12, 0.02]} c="#c9a227" shadow={false} />
      <Bloc p={[X + 2.5, 0.45, -5.5]} s={[1.1, 0.9, 1.6]} c="#22242c" r={0.06} />
      <Bloc p={[X + 2.6, 0.35, -11]} s={[0.9, 0.7, 0.9]} c="#7a5a2a" r={0.04} />
      {/* portant de costumes */}
      <group position={[X + 2.6, 0, -1.5]}>
        <Bloc p={[0, 2.2, 0]} s={[0.08, 0.08, 2]} c="#999" />
        {[-0.8, -0.3, 0.2, 0.7].map((z, k) => <Bloc key={z} p={[0, 1.5, z]} s={[0.2, 1.3, 0.45]} c={['#ffffff', '#ff3ec9', '#2ee6ff', '#ffd23f'][k]} r={0.05} />)}
        <Bloc p={[0, 1.1, -1]} s={[0.08, 2.2, 0.08]} c="#999" /><Bloc p={[0, 1.1, 1]} s={[0.08, 2.2, 0.08]} c="#999" />
      </group>
      {/* câbles au sol */}
      {[[-1.6, 0], [-1.2, -4], [-1.8, -9], [-1.0, -13]].map(([dx, z], i) => (
        <Bloc key={i} p={[X + dx + Math.sin(i) * 0.3, 0.04, z - 2]} s={[0.1, 0.07, 4.6]} c="#0e0e12" rot={[0, 0.15 * (i % 2 ? 1 : -1), 0]} r={0.03} shadow={false} />
      ))}
      <Bloc p={[X - 1.4, 0.04, -6]} s={[0.08, 0.06, 20]} c="#ffd23f" r={0.02} shadow={false} />
    </group>
  );
};

// ---------------- 5. Éclairage ----------------
const AMBP: Record<ModePlateau, {sky: string; ground: string; hemi: number; sun: string; sunI: number; fog: string; bg: string; pts: [V3, string, number][]}> = {
  normal: {sky: '#ffe2c8', ground: '#2a1540', hemi: 0.75, sun: '#fff0dc', sunI: 1.9, fog: '#120a20', bg: 'radial-gradient(ellipse at 50% 30%, #3a1d5c, #0b0614 70%)',
    pts: [[[-8, 9, 4], '#ff3ec9', 30], [[10, 9, 2], '#2ee6ff', 30], [[1, 7, -10], '#b16bff', 25]]},
  suspense: {sky: '#6a8cff', ground: '#060818', hemi: 0.35, sun: '#9ab4ff', sunI: 0.9, fog: '#04060f', bg: 'radial-gradient(ellipse at 50% 30%, #0f1d4a, #02030a 70%)',
    pts: [[[-8, 9, 4], '#2f6bff', 28], [[10, 9, 2], '#1a3cff', 28], [[1, 7, -10], '#3a8bff', 18]]},
  revelation: {sky: '#fff1c0', ground: '#4a2a10', hemi: 1.0, sun: '#ffe08a', sunI: 2.6, fog: '#2a1806', bg: 'radial-gradient(ellipse at 50% 30%, #6a4210, #120a02 70%)',
    pts: [[[-8, 9, 4], '#ffd23f', 34], [[10, 9, 2], '#ffb21a', 34], [[1, 7, -10], '#fff0a0', 28]]},
};

/** Lumières du studio. `centre` = point visé (décor courant). */
export const EclairagePlateau: React.FC<{mode?: ModePlateau; centre?: V3}> = ({mode = 'normal', centre = [0, 0, 0]}) => {
  const a = AMBP[mode];
  return (
    <>
      <fog attach="fog" args={[a.fog, 30, 95]} />
      <hemisphereLight args={[a.sky, a.ground, a.hemi]} />
      <directionalLight position={[centre[0] + 8, 22, centre[2] + 14]} target-position={centre} intensity={a.sunI} color={a.sun} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
        shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-near={1} shadow-camera-far={80} />
      {a.pts.map(([p, c, i], k) => <pointLight key={k} position={add(centre, p)} color={c} intensity={i} distance={32} decay={1.4} />)}
    </>
  );
};
export const fondPlateau = (mode: ModePlateau = 'normal') => AMBP[mode].bg;
