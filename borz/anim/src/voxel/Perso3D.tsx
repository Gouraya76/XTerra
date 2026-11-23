import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';

export type Acc =
  | 'headphones' | 'sunglasses' | 'shades' | 'hoops' | 'towel' | 'cane' | 'skateboard' | 'backpack'
  | 'cap' | 'capBack' | 'beard' | 'beardDark' | 'goatee' | 'glassesRect' | 'glassesRound' | 'headscarf'
  | 'apron' | 'spoon' | 'pot' | 'toolbelt' | 'hair' | 'lashes' | 'tie' | 'longcoat' | 'skirt' | 'muscles'
  | 'bag' | 'handbag' | 'earpiece' | 'scarf' | 'collar' | 'overalls' | 'necklace' | 'chain' | 'clipboard' | 'pocketSquare';

/** Description d'un personnage BORZ en style voxel. */
export type Look = {
  bottle: string;      // couleur de la bouteille (tête + mains)
  cap: string;         // bouchon
  top: string;         // sweat / veste
  topText?: string;    // texte sur le torse
  topTextColor?: string;
  topPattern?: 'plaid' | 'floral';
  patternColors?: string[];
  inner?: string;      // vêtement visible sous une veste ouverte (crop top, chemise, gilet)
  belly?: boolean;     // ventre visible sous le crop top
  vest?: string;       // doudoune / gilet sans manches par-dessus
  sleeves?: string;    // couleur des manches si différente (veste teddy)
  bareArms?: boolean;  // bras nus (débardeur)
  pants: string;
  stripe?: string;     // bande sur le pantalon
  shorts?: boolean;
  sock?: string;
  shoe: string;
  shoeAccent: string;
  shoeStyle?: 'sneaker' | 'boot' | 'dress';
  brows?: string;
  browThick?: number;
  eyesSquint?: boolean;
  hairColor?: string;
  hatColor?: string;   // casquette
  accColor?: string;   // couleur principale des accessoires (foulard, écharpe…)
  scale?: number;
  acc?: Acc[];
  extra?: 'clipboard' | 'none';
};

const P = {
  // passants : déclinaisons simples
};
void P;

export const LOOKS: Record<string, Look> = {
  ORI: {bottle: '#eef1f4', cap: '#ffffff', top: '#f4f4f4', topText: 'BORZ', topTextColor: '#151515', pants: '#e9e9e9', stripe: '#151515', shoe: '#ffffff', shoeAccent: '#d9d9d9'},
  ZIGO: {bottle: '#8fd629', cap: '#1f9e1f', top: '#4f7a1c', topText: 'BORZ', topTextColor: '#e8ffd0', pants: '#4a7019', stripe: '#2e4710', shoe: '#ffffff', shoeAccent: '#2f8f2f', extra: 'clipboard'},
  PIMENT: {bottle: '#ff3326', cap: '#d0160e', top: '#b3150f', topText: 'BORZ', topTextColor: '#ffd21f', pants: '#a3120d', stripe: '#ffd21f', shoe: '#ffffff', shoeAccent: '#d41a12'},
  KENZO: {bottle: '#1f6fff', cap: '#1452d1', top: '#1d4fd6', vest: '#17181c', pants: '#1f4fc9', shoe: '#ffffff', shoeAccent: '#1a1a1a', acc: ['headphones', 'bag']},
  LOLA: {bottle: '#ff69b4', cap: '#e0347f', top: '#ee4f98', inner: '#ffffff', belly: true, pants: '#f0559c', stripe: '#ffffff', shoe: '#ffffff', shoeAccent: '#ffc1dc', acc: ['sunglasses', 'hoops', 'lashes', 'handbag', 'necklace']},
  TANK: {bottle: '#ff8a1c', cap: '#e86a00', top: '#141416', bareArms: true, pants: '#141416', stripe: '#ff8a1c', shorts: true, sock: '#ffffff', shoe: '#ffffff', shoeAccent: '#ff8a1c', scale: 1.08, acc: ['muscles', 'towel']},
  PRUNE: {bottle: '#9b4dff', cap: '#6e2bd1', top: '#2a2233', inner: '#3b3046', pants: '#2a2233', shoe: '#0d0d0f', shoeAccent: '#0d0d0f', shoeStyle: 'dress', acc: ['glassesRect', 'goatee', 'tie', 'longcoat', 'pocketSquare', 'chain']},
  SKATTY: {bottle: '#ffd21f', cap: '#f0b800', top: '#ffc61a', pants: '#24231f', shoe: '#ffffff', shoeAccent: '#e8b400', hatColor: '#18181a', acc: ['capBack', 'backpack', 'skateboard']},
  PAPI: {bottle: '#e8352b', cap: '#c41e15', top: '#7a4a2a', inner: '#5c3018', pants: '#3a2c24', shoe: '#6b4423', shoeAccent: '#4a2e16', shoeStyle: 'boot', brows: '#ffffff', browThick: 1.3, eyesSquint: true, accColor: '#9e2a2a', acc: ['beard', 'collar', 'scarf', 'cane']},
  NINO: {bottle: '#22c7c2', cap: '#0f9c98', top: '#1d5f63', sleeves: '#f4f1e6', inner: '#ffffff', pants: '#6e6b4a', shoe: '#ffffff', shoeAccent: '#1d6f73', hatColor: '#1d8f8f', scale: 0.82, acc: ['capBack', 'backpack']},
  ZARA: {bottle: '#b15fd6', cap: '#8a2fc0', top: '#6e2b6e', pants: '#6e2b6e', shoe: '#4a2a1a', shoeAccent: '#3a1e10', shoeStyle: 'dress', accColor: '#5b3a8c', acc: ['headscarf', 'glassesRound', 'skirt', 'apron', 'spoon', 'pot']},
  ROCCO: {bottle: '#6fae2a', cap: '#3f7d16', top: '#4a4f45', topPattern: 'plaid', patternColors: ['#3c4038', '#1e211c', '#7c8070'], pants: '#3f4c63', shoe: '#6b4423', shoeAccent: '#3e2814', shoeStyle: 'boot', hatColor: '#23252b', acc: ['cap', 'beardDark', 'toolbelt', 'overalls']},
  NOVA: {bottle: '#f2f2f2', cap: '#ffffff', top: '#3a3b40', inner: '#ffffff', belly: true, pants: '#bcbcbc', stripe: '#111111', shoe: '#ffffff', shoeAccent: '#e6e6e6', hairColor: '#141414', hatColor: '#2a2a2e', acc: ['hair', 'cap', 'headphones', 'lashes']},
  GARDE: {bottle: '#5b2a86', cap: '#3d1a5e', top: '#111114', inner: '#1a1a1f', pants: '#111114', shoe: '#050505', shoeAccent: '#050505', shoeStyle: 'dress', scale: 1.08, acc: ['shades', 'earpiece', 'tie']},
  PASSANT1: {bottle: '#f2994a', cap: '#d9772a', top: '#3f6fb5', pants: '#2b2f3a', shoe: '#ffffff', shoeAccent: '#c0392b', hatColor: '#c0392b', acc: ['cap']},
  PASSANT2: {bottle: '#56ccf2', cap: '#2d9cdb', top: '#f2c94c', pants: '#4f4f4f', shoe: '#ffffff', shoeAccent: '#2d9cdb', hairColor: '#6b3e1e', acc: ['hair', 'lashes']},
  PASSANT3: {bottle: '#9b9b9b', cap: '#6f6f6f', top: '#8e44ad', pants: '#34495e', shoe: '#222222', shoeAccent: '#555555', acc: ['backpack']},
  PASSANT4: {bottle: '#27ae60', cap: '#1e8449', top: '#e74c3c', pants: '#2c3e50', stripe: '#ffffff', shoe: '#ffffff', shoeAccent: '#e74c3c', acc: ['headphones']},
};

export type Pose = {
  walk?: number;        // phase de marche (radians), undefined = immobile
  walkAmp?: number;     // amplitude 0..1
  talk?: number;        // ouverture de la bouche 0..1
  look?: [number, number]; // direction du regard (-1..1)
  brows?: number;       // -1 fâché, 0 normal, 1 surpris
  blink?: number;       // 0 ouvert .. 1 fermé
  armL?: number;        // levée du bras gauche (radians, + = devant/haut)
  armR?: number;
  armSideL?: number;    // écartement latéral
  armSideR?: number;
  headTurn?: number;    // rotation de la tête (radians)
  headTilt?: number;
  bob?: number;         // saut vertical (unités)
  squash?: number;      // écrasement (0 = normal)
  smile?: number;       // 1 = grand sourire (défaut), 0 = bouche fermée sérieuse
};

// ---------- textures ----------
const texCache = new Map<string, THREE.CanvasTexture>();
const mkTex = (key: string, draw: (g: CanvasRenderingContext2D) => void, size = 512) => {
  if (texCache.has(key)) return texCache.get(key)!;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  texCache.set(key, t);
  return t;
};
const textTexture = (text: string, color: string, bg: string) => mkTex(`txt|${text}|${color}|${bg}`, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
  g.fillStyle = color; g.font = '900 150px ID, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 230);
});
const plaidTexture = (cols: string[]) => mkTex(`plaid|${cols.join()}`, (g) => {
  const [a, b, c] = cols;
  g.fillStyle = a; g.fillRect(0, 0, 512, 512);
  g.globalAlpha = 0.85; g.fillStyle = b;
  for (let i = 0; i < 512; i += 128) { g.fillRect(i, 0, 44, 512); g.fillRect(0, i, 512, 44); }
  g.globalAlpha = 0.9; g.fillStyle = c;
  for (let i = 64; i < 512; i += 128) { g.fillRect(i, 0, 10, 512); g.fillRect(0, i, 512, 10); }
  g.globalAlpha = 1;
}, 256);
const floralTexture = (bg: string, petals: string[]) => mkTex(`floral|${bg}|${petals.join()}`, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 26; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 18 + rnd() * 18, col = petals[i % petals.length];
    g.fillStyle = '#4f8a3a';
    g.fillRect(x - r * 1.4, y + r * 0.3, r * 0.9, r * 0.45);
    g.fillStyle = col;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill();
  }
});

// ---------- bloc arrondi ----------
type BP = {p: [number, number, number]; s: [number, number, number]; c: string; r?: number; rough?: number; clear?: boolean; map?: THREE.Texture | null; rot?: [number, number, number]; metal?: number; emissive?: string};
const B: React.FC<BP> = ({p, s, c, r = 0.06, rough = 0.75, clear, map, rot, metal = 0, emissive}) => (
  <RoundedBox args={s} radius={Math.min(r, Math.min(...s) / 2.01)} smoothness={3} position={p} rotation={rot} castShadow receiveShadow>
    {clear ? <meshPhysicalMaterial color={c} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} />
      : <meshStandardMaterial color={map ? '#ffffff' : c} map={map ?? null} roughness={rough} metalness={metal} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.4 : 0} />}
  </RoundedBox>
);

/** Cadre de lunettes autour d'un œil (4 barres). */
const Frame: React.FC<{w: number; h: number; t: number; c: string; z: number}> = ({w, h, t, c, z}) => (
  <>
    <B p={[0, h / 2, z]} s={[w, t, 0.05]} c={c} r={0.015} rough={0.3} />
    <B p={[0, -h / 2, z]} s={[w, t, 0.05]} c={c} r={0.015} rough={0.3} />
    <B p={[-w / 2, 0, z]} s={[t, h, 0.05]} c={c} r={0.015} rough={0.3} />
    <B p={[w / 2, 0, z]} s={[t, h, 0.05]} c={c} r={0.015} rough={0.3} />
  </>
);

/** Personnage voxel. Les pieds sont à y=0, hauteur totale ≈ 3,3 unités (avant échelle). */
export const Perso3D: React.FC<{who: string; pose?: Pose; position?: [number, number, number]; rotation?: number; scale?: number}> = ({who, pose = {}, position = [0, 0, 0], rotation = 0, scale = 1}) => {
  const L = LOOKS[who] ?? LOOKS.ORI;
  const A = new Set<Acc>(L.acc ?? []);
  if (L.extra === 'clipboard') A.add('clipboard');
  const {walk, walkAmp = 1, talk = 0, look = [0, 0], brows = 0, blink = 0, armL = 0, armR = 0, armSideL = 0, armSideR = 0, headTurn = 0, headTilt = 0, bob = 0, squash = 0, smile = 1} = pose;
  const sw = walk === undefined ? 0 : Math.sin(walk) * 0.6 * walkAmp;
  const walkBob = walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 0.08 * walkAmp;
  const tex = useMemo(() => (L.topText ? textTexture(L.topText, L.topTextColor ?? '#000', L.top) : null), [L]);
  const topMap = useMemo(() => (L.topPattern === 'plaid' ? plaidTexture(L.patternColors ?? ['#a33', '#622', '#ddd']) : null), [L]);
  const scarfMap = useMemo(() => (A.has('headscarf') ? floralTexture(L.accColor ?? '#5b3a8c', ['#ff7aa8', '#ffb347', '#ffffff', '#ff4d6d']) : null), [L]);
  const apronMap = useMemo(() => (A.has('apron') ? floralTexture('#f5ead6', ['#e0455f', '#f08aa0', '#c9354e']) : null), [L]);
  const plaidScarf = useMemo(() => (A.has('scarf') ? plaidTexture([L.accColor ?? '#9e2a2a', '#3b1a1a', '#e0b84a']) : null), [L]);

  const s0 = scale * (L.scale ?? 1);
  const musc = A.has('muscles');
  const skirt = A.has('skirt');
  const legH = 0.75, bodyH = 0.95, bodyY = 0.2 + legH;
  const bodyW = musc ? 1.28 : 1.0;
  const armX = musc ? 0.8 : 0.64;
  const armW = musc ? 0.42 : 0.28;
  const headY = bodyY + bodyH;          // bas de la tête
  const squint = !!L.eyesSquint;
  const eyeOpen = squint ? 0.18 : Math.max(0.08, 1 - blink);
  const mouthH = 0.04 + 0.09 * smile + talk * 0.18;
  const browRot = brows < 0 ? 0.35 * -brows : 0;
  const browUp = brows > 0 ? 0.08 * brows : 0;
  const armColor = (L.bareArms ? L.bottle : L.sleeves ?? L.top);
  const bootH = L.shoeStyle === 'boot' ? 0.34 : 0.2;

  return (
    <group position={[position[0], position[1] + bob + walkBob, position[2]]} rotation={[0, rotation, 0]} scale={[s0 * (1 + squash * 0.15), s0 * (1 - squash * 0.2), s0 * (1 + squash * 0.15)]}>
      {/* jambes */}
      {[-1, 1].map((side) => {
        const a = side * sw * (skirt ? 0.35 : 1);
        return (
          <group key={side} position={[side * 0.24, 0.2 + legH, 0]} rotation={[a, 0, 0]}>
            {!skirt && !L.shorts && <B p={[0, -legH / 2, 0]} s={[0.4, legH, 0.42]} c={L.pants} />}
            {!skirt && L.shorts && <>
              <B p={[0, -0.2, 0]} s={[0.46, 0.42, 0.46]} c={L.pants} />
              <B p={[0, -0.52, 0]} s={[0.34, 0.36, 0.36]} c={L.bottle} clear />
              <B p={[0, -0.68, 0]} s={[0.36, 0.16, 0.38]} c={L.sock ?? '#ffffff'} r={0.04} />
            </>}
            {!skirt && L.stripe && <B p={[side * (L.shorts ? 0.235 : 0.205), L.shorts ? -0.2 : -legH / 2, 0]} s={[0.02, L.shorts ? 0.38 : legH * 0.95, 0.12]} c={L.stripe} r={0.005} />}
            {/* chaussure */}
            {L.shoeStyle === 'dress' ? (
              <B p={[0, -legH - 0.13, 0.06]} s={[0.4, 0.15, 0.56]} c={L.shoe} r={0.06} rough={0.15} />
            ) : L.shoeStyle === 'boot' ? (<>
              <B p={[0, -legH - 0.2 + bootH / 2 - 0.0, 0.02]} s={[0.46, bootH, 0.5]} c={L.shoe} r={0.06} rough={0.7} />
              <B p={[0, -legH - 0.16, 0.1]} s={[0.48, 0.1, 0.6]} c={L.shoeAccent} r={0.04} rough={0.8} />
            </>) : (<>
              <B p={[0, -legH - 0.1, 0.06]} s={[0.44, 0.2, 0.58]} c={L.shoe} r={0.07} rough={0.5} />
              <B p={[0, -legH - 0.04, 0.0]} s={[0.46, 0.1, 0.4]} c={L.shoeAccent} r={0.04} rough={0.5} />
            </>)}
          </group>
        );
      })}
      {/* jupe longue */}
      {skirt && <>
        <B p={[0, 0.55, 0]} s={[1.08, 0.82, 0.74]} c={L.pants} r={0.12} />
        <B p={[0, 0.22, 0]} s={[1.14, 0.2, 0.8]} c={L.pants} r={0.08} />
      </>}
      {/* longue veste (sous la taille) */}
      {A.has('longcoat') && <>
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.47, 0.62, 0.02]} s={[0.16, 0.72, 0.62]} c={L.top} r={0.05} />)}
        <B p={[0, 0.62, -0.3]} s={[1.08, 0.72, 0.1]} c={L.top} r={0.04} />
      </>}
      {/* salopette : bavette + bretelles */}
      {A.has('overalls') && <>
        <B p={[0, bodyY + 0.3, 0.285]} s={[0.62, 0.55, 0.04]} c={L.pants} r={0.03} />
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.25, bodyY + 0.72, 0.29]} s={[0.1, 0.4, 0.04]} c={L.pants} r={0.02} />)}
        <B p={[0, bodyY + 0.38, 0.31]} s={[0.24, 0.16, 0.03]} c="#2f3a4f" r={0.02} />
        <B p={[0, bodyY + 0.05, 0]} s={[bodyW + 0.02, 0.22, 0.6]} c={L.pants} r={0.05} />
      </>}
      {/* corps */}
      <B p={[0, bodyY + bodyH / 2, 0]} s={[bodyW, bodyH, 0.56]} c={L.top} r={0.1} map={topMap} />
      {musc && <>
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.27, bodyY + 0.66, 0.24]} s={[0.5, 0.36, 0.14]} c={L.bottle} r={0.1} clear />)}
        <B p={[0, bodyY + 0.5, 0.26]} s={[0.12, 0.5, 0.1]} c={L.top} r={0.03} />
      </>}
      {tex && (
        <mesh position={[0, bodyY + bodyH * 0.55, 0.283]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      )}
      {/* veste ouverte : vêtement intérieur + ventre */}
      {L.inner && (
        <B p={[0, bodyY + (L.belly ? 0.62 : bodyH / 2), 0.27]} s={[0.42, L.belly ? 0.5 : bodyH * 0.96, 0.05]} c={L.inner} r={0.03} />
      )}
      {L.belly && <B p={[0, bodyY + 0.2, 0.27]} s={[0.4, 0.3, 0.04]} c={L.bottle} r={0.03} clear />}
      {/* doudoune sans manches */}
      {L.vest && <>
        <B p={[-0.3, bodyY + bodyH / 2, 0.02]} s={[0.46, bodyH + 0.04, 0.62]} c={L.vest} r={0.12} rough={0.35} />
        <B p={[0.3, bodyY + bodyH / 2, 0.02]} s={[0.46, bodyH + 0.04, 0.62]} c={L.vest} r={0.12} rough={0.35} />
        {[0.25, 0.5, 0.75].map((h) => <B key={h} p={[0, bodyY + bodyH * h, 0.335]} s={[1.02, 0.03, 0.01]} c="#000000" r={0.005} />)}
      </>}
      {/* cravate (+ chemise) */}
      {A.has('tie') && <>
        <B p={[0, bodyY + 0.72, 0.3]} s={[0.24, 0.42, 0.03]} c="#f4f4f4" r={0.02} />
        <B p={[0, bodyY + 0.62, 0.32]} s={[0.1, 0.5, 0.03]} c={who === 'PRUNE' ? '#3a2a55' : '#0b0b0d'} r={0.02} />
        <B p={[0, bodyY + 0.88, 0.32]} s={[0.13, 0.08, 0.03]} c={who === 'PRUNE' ? '#3a2a55' : '#0b0b0d'} r={0.02} />
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.2, bodyY + 0.66, 0.3]} s={[0.1, 0.6, 0.03]} c={L.top} r={0.02} rot={[0, 0, sd * 0.25]} />)}
      </>}
      {A.has('chain') && <B p={[0.22, bodyY + 0.38, 0.3]} s={[0.26, 0.03, 0.02]} c="#d4af37" r={0.01} metal={0.8} rough={0.3} />}
      {A.has('pocketSquare') && <B p={[0.32, bodyY + 0.72, 0.3]} s={[0.12, 0.06, 0.03]} c="#b58cff" r={0.01} />}
      {A.has('necklace') && <B p={[0, bodyY + 0.9, 0.29]} s={[0.36, 0.03, 0.02]} c="#e9c14a" r={0.01} metal={0.8} rough={0.3} />}
      {/* ceinture à outils */}
      {A.has('toolbelt') && <>
        <B p={[0, bodyY + 0.06, 0]} s={[bodyW + 0.06, 0.12, 0.62]} c="#5a3a1e" r={0.03} />
        <B p={[0, bodyY + 0.06, 0.32]} s={[0.14, 0.1, 0.02]} c="#c9a24a" r={0.01} metal={0.7} />
        {[-1, 1].map((sd) => <group key={sd}>
          <B p={[sd * 0.42, bodyY - 0.1, 0.25]} s={[0.24, 0.3, 0.16]} c="#7a4e2a" r={0.03} />
          <B p={[sd * 0.38, bodyY + 0.08, 0.27]} s={[0.05, 0.22, 0.05]} c={sd < 0 ? '#e0b020' : '#d43a2a'} r={0.015} />
          <B p={[sd * 0.47, bodyY + 0.06, 0.27]} s={[0.05, 0.18, 0.05]} c="#9aa3ad" r={0.015} metal={0.6} />
        </group>)}
      </>}
      {/* sacoche en bandoulière */}
      {A.has('bag') && <>
        <B p={[0.02, bodyY + 0.5, 0.31]} s={[0.07, 1.15, 0.02]} c="#111" r={0.01} rot={[0, 0, -0.75]} />
        <B p={[-0.42, bodyY + 0.12, 0.3]} s={[0.36, 0.28, 0.14]} c="#1b1b1f" r={0.05} rough={0.5} />
        <B p={[-0.42, bodyY + 0.14, 0.38]} s={[0.12, 0.06, 0.02]} c="#c9a24a" r={0.01} metal={0.7} />
      </>}
      {/* petit sac blanc à l'épaule */}
      {A.has('handbag') && <>
        <B p={[-0.5, bodyY + 0.6, 0.12]} s={[0.05, 0.7, 0.03]} c="#f2f2f2" r={0.01} rot={[0, 0, 0.15]} />
        <B p={[-0.58, bodyY + 0.18, 0.12]} s={[0.12, 0.3, 0.38]} c="#ffffff" r={0.05} rough={0.4} />
      </>}
      {/* sac à dos */}
      {A.has('backpack') && <>
        <B p={[0, bodyY + 0.48, -0.44]} s={[0.78, 0.82, 0.34]} c={who === 'SKATTY' ? '#1d1d20' : who === 'NINO' ? '#1d4f52' : '#2f3542'} r={0.1} />
        <B p={[0, bodyY + 0.3, -0.63]} s={[0.5, 0.3, 0.06]} c={who === 'SKATTY' ? '#2a2a2e' : '#2b6b6e'} r={0.04} />
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.3, bodyY + 0.6, 0.29]} s={[0.1, 0.62, 0.03]} c="#1a1a1a" r={0.02} />)}
      </>}
      {/* col en mouton + écharpe */}
      {A.has('collar') && <B p={[0, headY + 0.0, -0.02]} s={[1.08, 0.24, 0.66]} c="#efe2c4" r={0.1} rough={0.95} />}
      {A.has('scarf') && <>
        <B p={[0, headY + 0.08, 0.0]} s={[0.92, 0.18, 0.7]} c="#ffffff" map={plaidScarf} r={0.08} />
        <B p={[0.16, bodyY + 0.6, 0.32]} s={[0.24, 0.62, 0.08]} c="#ffffff" map={plaidScarf} r={0.04} />
      </>}
      {/* serviette sur l'épaule */}
      {A.has('towel') && <>
        <B p={[0.5, headY + 0.02, 0]} s={[0.38, 0.12, 0.66]} c="#f7f7f2" r={0.05} rough={0.95} />
        <B p={[0.5, bodyY + 0.6, 0.3]} s={[0.36, 0.62, 0.08]} c="#f7f7f2" r={0.04} rough={0.95} />
      </>}
      {/* casque audio autour du cou */}
      {A.has('headphones') && <>
        <B p={[0, headY + 0.06, 0.38]} s={[0.78, 0.09, 0.1]} c="#f4f4f4" r={0.03} rough={0.35} />
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.43, headY + 0.08, 0.24]} s={[0.16, 0.3, 0.3]} c="#ffffff" r={0.07} rough={0.3} />)}
      </>}
      {/* capuche */}
      {!A.has('collar') && !A.has('tie') && !musc && <B p={[0, headY + 0.02, -0.22]} s={[0.86, 0.22, 0.26]} c={L.top} r={0.1} />}
      {/* bras */}
      {[-1, 1].map((side) => {
        const lift = side < 0 ? armL : armR;
        const spread = side < 0 ? armSideL : armSideR;
        const a = -side * sw * 0.9 - lift;
        return (
          <group key={side} position={[side * armX, bodyY + bodyH - 0.12, 0]} rotation={[a, 0, side * (0.08 + spread)]}>
            {L.bareArms ? <>
              <B p={[0, -0.12, 0]} s={[armW + 0.06, 0.26, armW + 0.06]} c={L.bottle} r={0.12} clear />
              <B p={[0, -0.44, 0]} s={[armW, 0.5, armW + 0.04]} c={L.bottle} r={0.12} clear />
            </> : <B p={[0, -0.36, 0]} s={[armW, 0.72, 0.32]} c={armColor} r={0.09} />}
            {L.sleeves && <B p={[0, -0.66, 0]} s={[armW + 0.02, 0.1, 0.34]} c={L.top} r={0.03} />}
            {musc && <B p={[0, -0.7, 0.02]} s={[0.36, 0.12, 0.36]} c="#141416" r={0.03} />}
            <B p={[0, -0.8, 0.02]} s={[musc ? 0.34 : 0.26, 0.22, musc ? 0.34 : 0.28]} c={L.bottle} r={0.08} clear />
            {A.has('clipboard') && side < 0 && (
              <group position={[0.05, -0.82, 0.24]} rotation={[0.2 + lift * 0.5, 0, 0]}>
                <B p={[0, 0, 0]} s={[0.5, 0.62, 0.05]} c="#c08a52" r={0.02} />
                <B p={[0, 0.3, 0.03]} s={[0.2, 0.08, 0.04]} c="#8c8c8c" r={0.015} rough={0.3} />
              </group>
            )}
            {A.has('cane') && side > 0 && (
              <group position={[0, -0.86, 0.16]}>
                <B p={[0, -0.42, 0]} s={[0.08, 0.86, 0.08]} c="#9c6a3a" r={0.03} />
                <B p={[0, 0.02, -0.08]} s={[0.08, 0.08, 0.24]} c="#9c6a3a" r={0.03} />
              </group>
            )}
            {A.has('skateboard') && side > 0 && (
              <group position={[0.12, -0.9, 0.18]} rotation={[0, -1.25, 0.12]}>
                <B p={[0, -0.25, 0]} s={[0.07, 1.25, 0.42]} c="#1d1d20" r={0.03} />
                <B p={[0.04, -0.25, 0]} s={[0.01, 0.9, 0.18]} c="#ff9f1a" r={0.005} />
                {[-0.65, 0.15].map((y) => [-1, 1].map((zz) => <B key={`${y}${zz}`} p={[-0.07, y, zz * 0.14]} s={[0.08, 0.1, 0.1]} c="#e8e2d0" r={0.03} />))}
              </group>
            )}
            {A.has('spoon') && side < 0 && (
              <group position={[0, -0.82, 0.18]} rotation={[0.5, 0, 0]}>
                <B p={[0, 0.25, 0]} s={[0.06, 0.6, 0.06]} c="#b5793e" r={0.02} />
                <B p={[0, 0.6, 0]} s={[0.18, 0.22, 0.08]} c="#b5793e" r={0.05} />
              </group>
            )}
            {A.has('pot') && side > 0 && (
              <group position={[-0.12, -0.84, 0.32]}>
                <B p={[0, 0, 0]} s={[0.56, 0.36, 0.48]} c="#8a4b26" r={0.08} rough={0.45} metal={0.3} />
                <B p={[0, 0.2, 0]} s={[0.6, 0.06, 0.52]} c="#a0592e" r={0.03} rough={0.45} metal={0.3} />
                <B p={[0, 0.26, 0]} s={[0.1, 0.06, 0.1]} c="#5a3a1e" r={0.02} />
              </group>
            )}
          </group>
        );
      })}
      {/* tablier (devant tout) */}
      {A.has('apron') && <>
        <B p={[0, bodyY + 0.62, 0.3]} s={[0.5, 0.5, 0.03]} c="#ffffff" map={apronMap} r={0.02} />
        <B p={[0, 0.65, 0.39]} s={[0.84, 0.8, 0.03]} c="#ffffff" map={apronMap} r={0.03} />
        <B p={[0, bodyY + 0.06, 0.3]} s={[1.02, 0.08, 0.6]} c="#f5ead6" r={0.02} />
      </>}
      {/* tête-bouteille */}
      <group position={[0, headY, 0]} rotation={[headTilt, headTurn, 0]}>
        <B p={[0, 0.62, 0]} s={[0.98, 1.24, 0.82]} c={L.bottle} r={0.16} clear />
        <B p={[0, 1.3, 0]} s={[0.66, 0.18, 0.6]} c={L.bottle} r={0.08} clear />
        <B p={[0, 1.46, 0]} s={[0.44, 0.16, 0.42]} c={L.bottle} r={0.05} clear />
        <B p={[0, 1.57, 0]} s={[0.56, 0.06, 0.54]} c={L.cap} r={0.02} />
        <B p={[0, 1.71, 0]} s={[0.52, 0.24, 0.5]} c={L.cap} r={0.05} rough={0.45} />
        {/* cheveux (derrière / côtés / frange) */}
        {A.has('hair') && <>
          <B p={[0, 0.62, -0.45]} s={[1.06, 1.18, 0.14]} c={L.hairColor ?? '#151515'} r={0.06} rough={0.5} />
          {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.53, 0.5, -0.05]} s={[0.12, 1.0, 0.76]} c={L.hairColor ?? '#151515'} r={0.05} rough={0.5} />)}
          <B p={[-0.2, 1.12, 0.38]} s={[0.62, 0.2, 0.12]} c={L.hairColor ?? '#151515'} r={0.05} rough={0.5} rot={[0, 0, -0.15]} />
          <B p={[-0.5, 0.0, -0.02]} s={[0.14, 0.35, 0.6]} c={L.hairColor ?? '#151515'} r={0.05} rough={0.5} />
        </>}
        {/* foulard fleuri */}
        {A.has('headscarf') && <>
          <B p={[0, 1.13, -0.02]} s={[1.1, 0.34, 0.92]} c="#ffffff" map={scarfMap} r={0.12} />
          {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.54, 0.6, -0.04]} s={[0.12, 1.1, 0.9]} c="#ffffff" map={scarfMap} r={0.05} />)}
          <B p={[0, 0.62, -0.46]} s={[1.1, 1.2, 0.12]} c="#ffffff" map={scarfMap} r={0.05} />
          <B p={[0, -0.02, 0.1]} s={[0.9, 0.16, 0.7]} c="#ffffff" map={scarfMap} r={0.06} />
        </>}
        {/* casquette */}
        {(A.has('cap') || A.has('capBack')) && <>
          <B p={[0, 1.18, 0]} s={[1.04, 0.3, 0.88]} c={L.hatColor ?? '#222'} r={0.12} rough={0.6} />
          <B p={[0, 1.07, A.has('capBack') ? -0.62 : 0.62]} s={[0.84, 0.06, 0.44]} c={L.hatColor ?? '#222'} r={0.03} rough={0.6} />
          {A.has('cap') && who === 'ROCCO' && <B p={[0, 1.2, 0.45]} s={[0.24, 0.16, 0.02]} c="#c9c9c9" r={0.02} />}
        </>}
        {/* lunettes de soleil posées sur le haut de la tête */}
        {A.has('sunglasses') && <group position={[0, 1.2, 0.3]} rotation={[-0.35, 0, 0]}>
          {[-1, 1].map((sd) => <group key={sd} position={[sd * 0.22, 0, 0]}>
            <B p={[0, 0, 0.02]} s={[0.36, 0.24, 0.05]} c="#111" r={0.04} rough={0.1} />
            <Frame w={0.4} h={0.28} t={0.05} c="#ffffff" z={0.05} />
          </group>)}
          <B p={[0, 0.04, 0.06]} s={[0.12, 0.05, 0.05]} c="#ffffff" r={0.015} />
        </group>}
        {/* créoles */}
        {A.has('hoops') && [-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.56, 0.3, 0.12]} rotation={[0, sd * 0.5, 0]} castShadow>
            <torusGeometry args={[0.13, 0.025, 8, 20]} />
            <meshStandardMaterial color="#e5b73b" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
        {/* oreillette */}
        {A.has('earpiece') && <>
          <B p={[0.51, 0.62, 0.05]} s={[0.06, 0.12, 0.1]} c="#2a2a2a" r={0.02} />
          <B p={[0.51, 0.3, -0.02]} s={[0.025, 0.55, 0.025]} c="#c9c9c9" r={0.01} />
        </>}
        {/* yeux */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.215, 0.8, 0.415]}>
            {squint ? (
              <group rotation={[0, 0, side * 0.0]}>
                <B p={[0, 0.0, 0.01]} s={[0.28, 0.07, 0.04]} c="#1a1209" r={0.03} />
                <B p={[-0.13, -0.05, 0.01]} s={[0.07, 0.1, 0.04]} c="#1a1209" r={0.03} />
                <B p={[0.13, -0.05, 0.01]} s={[0.07, 0.1, 0.04]} c="#1a1209" r={0.03} />
              </group>
            ) : (<>
              <B p={[0, 0, 0]} s={[0.33, 0.38 * eyeOpen, 0.04]} c="#ffffff" r={0.04} rough={0.3} />
              <B p={[look[0] * 0.06, look[1] * 0.06 * eyeOpen - 0.01, 0.025]} s={[0.15, 0.19 * eyeOpen, 0.03]} c="#24150b" r={0.03} rough={0.2} />
              <B p={[look[0] * 0.06 + 0.035, look[1] * 0.06 * eyeOpen + 0.04, 0.045]} s={[0.05, 0.05 * eyeOpen, 0.01]} c="#ffffff" r={0.005} rough={0.1} />
            </>)}
            {A.has('lashes') && !squint && <>
              <B p={[side * 0.17, 0.16 * eyeOpen + 0.02, 0.03]} s={[0.1, 0.05, 0.03]} c="#111" r={0.015} rot={[0, 0, side * 0.6]} />
              <B p={[side * 0.19, 0.08 * eyeOpen + 0.02, 0.03]} s={[0.08, 0.04, 0.03]} c="#111" r={0.015} rot={[0, 0, side * 0.3]} />
            </>}
            {A.has('glassesRect') && <Frame w={0.4} h={0.36} t={0.045} c="#1a1325" z={0.06} />}
            {A.has('glassesRound') && <Frame w={0.4} h={0.4} t={0.05} c="#3a1f55" z={0.06} />}
            {A.has('shades') && <B p={[0, 0.0, 0.07]} s={[0.4, 0.3, 0.04]} c="#08080a" r={0.05} rough={0.08} />}
            {/* sourcil */}
            <group position={[0, 0.27 + browUp, 0.02]} rotation={[0, 0, side * (browRot - 0.12)]}>
              <B p={[0, 0, 0]} s={[0.36, 0.1 * (L.browThick ?? 1), 0.06]} c={L.brows ?? '#141414'} r={0.04} />
            </group>
          </group>
        ))}
        {(A.has('glassesRect') || A.has('glassesRound')) && <B p={[0, 0.82, 0.48]} s={[0.07, 0.04, 0.04]} c="#1a1325" r={0.01} />}
        {A.has('shades') && <B p={[0, 0.84, 0.49]} s={[0.1, 0.05, 0.04]} c="#08080a" r={0.01} />}
        {/* barbe blanche (Papi) */}
        {A.has('beard') && <>
          <B p={[0, 0.2, 0.42]} s={[1.0, 0.56, 0.18]} c="#f6f6f3" r={0.12} rough={0.95} />
          <B p={[0, -0.06, 0.38]} s={[0.7, 0.3, 0.18]} c="#f6f6f3" r={0.1} rough={0.95} />
          {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.2, 0.52, 0.5]} s={[0.36, 0.12, 0.08]} c="#ffffff" r={0.05} rough={0.95} rot={[0, 0, sd * -0.15]} />)}
        </>}
        {/* barbe noire courte (Rocco) */}
        {A.has('beardDark') && <>
          <B p={[0, 0.22, 0.4]} s={[0.94, 0.4, 0.08]} c="#1e1a16" r={0.08} rough={0.9} />
          {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.46, 0.45, 0.25]} s={[0.08, 0.5, 0.3]} c="#1e1a16" r={0.03} rough={0.9} />)}
          <B p={[0, 0.5, 0.46]} s={[0.46, 0.08, 0.04]} c="#1e1a16" r={0.03} rough={0.9} />
        </>}
        {/* bouc (Prune) */}
        {A.has('goatee') && <>
          <B p={[0, 0.12, 0.43]} s={[0.12, 0.2, 0.04]} c="#141018" r={0.03} />
          {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.13, 0.53, 0.43]} s={[0.2, 0.045, 0.03]} c="#141018" r={0.015} rot={[0, 0, sd * 0.22]} />)}
        </>}
        {/* bouche souriante : bloc central + coins relevés */}
        {(() => {
          const z = A.has('beard') ? 0.52 : A.has('beardDark') ? 0.45 : 0.42;
          const mw = A.has('goatee') ? 0.34 : 0.46;
          return <>
            <B p={[0, 0.36, z]} s={[mw, mouthH, 0.03]} c="#3a0d0d" r={0.03} rough={0.6} />
            {smile > 0.4 && [-1, 1].map((sd) => <B key={sd} p={[sd * (mw / 2 + 0.03), 0.36 + mouthH / 2 - 0.02, z]} s={[0.1, 0.07, 0.03]} c="#3a0d0d" r={0.02} rough={0.6} />)}
            <B p={[0, 0.36 + mouthH / 2 - 0.03, z + 0.013]} s={[mw - 0.06, 0.055, 0.015]} c="#ffffff" r={0.01} rough={0.4} />
            <B p={[0, 0.36 - mouthH / 2 + 0.035, z + 0.013]} s={[mw * 0.52, Math.min(0.07, mouthH * 0.35), 0.012]} c="#ff7a8a" r={0.01} />
          </>;
        })()}
      </group>
    </group>
  );
};
