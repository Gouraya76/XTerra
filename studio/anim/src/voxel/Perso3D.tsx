import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';

export type Acc =
  | 'headphones' | 'headset' | 'sunglasses' | 'hoops' | 'backpack' | 'cap' | 'capBack'
  | 'glassesRect' | 'glassesRound' | 'apron' | 'tie' | 'bowtie' | 'neckerchief' | 'necklace'
  | 'micro' | 'carnet' | 'tattoo' | 'lashes';

export type Hair = 'court' | 'banane' | 'chauve' | 'tresses' | 'chignon' | 'boucles' | 'meche';

/** Description d'un personnage en style voxel. */
export type Look = {
  head?: 'bouteille' | 'humain';   // défaut : bouteille (ancien style)
  skin?: string;        // peau (tête humaine + mains)
  bottle?: string;      // couleur de la bouteille (tête-bouteille + mains)
  cap?: string;         // bouchon (tête-bouteille)
  hair?: Hair;
  hairColor?: string;
  mustache?: string;    // couleur de la moustache
  beardShort?: string;  // couleur de la barbe courte
  toque?: 'normale' | 'petite';
  blush?: boolean;
  top: string;          // haut (veste, sweat, t-shirt)
  topRough?: number;    // 0.3 = cuir / satiné
  sparkle?: boolean;    // paillettes
  hood?: boolean;       // capuche dans le dos
  chef?: boolean;       // veste de chef croisée (2 rangées de boutons + col)
  inner?: string;       // vêtement visible sous une veste ouverte
  bigBelly?: boolean;
  bodyW?: number;       // largeur du torse (défaut 1)
  sleevesLong?: boolean; // manches trop longues (mains à moitié cachées)
  pants: string;
  pantsPattern?: 'pied-de-poule';
  stripe?: string;
  shoe: string;
  shoeAccent: string;
  shoeStyle?: 'sneaker' | 'boot' | 'dress' | 'sabot';
  brows?: string;
  browThick?: number;
  eyesSquint?: boolean;
  hatColor?: string;
  apronColor?: string;   // tablier uni
  apronFloral?: string[]; // tablier à fleurs : [fond, fleurs…]
  accColor?: string;
  scale?: number;
  acc?: Acc[];
};

const CHEF = '#f7f6f1';
const SK = {claire: '#f2c9a5', claireMate: '#e2b088', rosee: '#f6bfa2', mate: '#c98a5c', brune: '#8a5737', fonce: '#6e4229'};

export const LOOKS: Record<string, Look> = {
  // ----- l'émission -----
  SACHA: {head: 'humain', skin: SK.claireMate, hair: 'banane', hairColor: '#141218', top: '#1f4fe8', sparkle: true, inner: '#ffffff', pants: '#1c45cc', shoe: '#111114', shoeAccent: '#111114', shoeStyle: 'dress', acc: ['bowtie', 'micro']},
  LEO: {head: 'humain', skin: SK.claire, hair: 'meche', hairColor: '#6b4524', top: '#d9a521', hood: true, pants: '#3b5a86', shoe: '#ffffff', shoeAccent: '#e6e6e6', acc: ['glassesRect', 'carnet']},
  INES: {head: 'humain', skin: SK.brune, hair: 'tresses', hairColor: '#17120f', top: '#b81f1a', topRough: 0.32, inner: '#ffffff', pants: '#17171b', shoe: '#e02a22', shoeAccent: '#ffffff', acc: ['hoops', 'lashes']},
  // ----- les 5 candidats (même tenue de chef) -----
  MARCEL: {head: 'humain', skin: SK.rosee, blush: true, hair: 'court', hairColor: '#c2581f', mustache: '#c2581f', toque: 'normale', top: CHEF, chef: true, bigBelly: true, bodyW: 1.22,
    pants: '#2a2a2a', pantsPattern: 'pied-de-poule', shoe: '#121214', shoeAccent: '#121214', shoeStyle: 'sabot', apronColor: '#dfe3e8', brows: '#a9481a', browThick: 1.2},
  YASMINE: {head: 'humain', skin: SK.mate, hair: 'chignon', hairColor: '#120f0d', toque: 'normale', top: CHEF, chef: true, pants: '#26262b', shoe: '#18181b', shoeAccent: '#18181b', shoeStyle: 'dress', browThick: 0.6, accColor: '#1c2a5c', acc: ['neckerchief', 'lashes']},
  BRUNO: {head: 'humain', skin: SK.fonce, hair: 'chauve', beardShort: '#141010', toque: 'petite', top: CHEF, chef: true, bodyW: 1.24, pants: '#2b2b30', shoe: '#121214', shoeAccent: '#121214', shoeStyle: 'boot', scale: 1.12, brows: '#120d0b', browThick: 1.25, acc: ['tattoo']},
  JULES: {head: 'humain', skin: SK.claire, hair: 'boucles', hairColor: '#e8c25a', toque: 'normale', top: CHEF, chef: true, sleevesLong: true, bodyW: 0.94, pants: '#3a3a40', shoe: '#ffffff', shoeAccent: '#2f6fd6', scale: 0.95, brows: '#b8902e'},
  COLETTE: {head: 'humain', skin: SK.claire, blush: true, hair: 'chignon', hairColor: '#ecebea', toque: 'normale', top: CHEF, chef: true, pants: '#6a6a72', shoe: '#7a4a2a', shoeAccent: '#5a3418', shoeStyle: 'dress', scale: 0.9, brows: '#cfcfcf',
    apronFloral: ['#ffe4ee', '#ff6f9a', '#ff9fbf', '#e0407a'], acc: ['glassesRound']},
  // ----- figurants -----
  PUBLIC1: {head: 'humain', skin: SK.claire, hair: 'court', hairColor: '#3a2416', top: '#2f9e5b', pants: '#2b3344', shoe: '#ffffff', shoeAccent: '#2f9e5b'},
  PUBLIC2: {head: 'humain', skin: SK.brune, hair: 'boucles', hairColor: '#16110e', top: '#f08a24', pants: '#3a3a44', shoe: '#ffffff', shoeAccent: '#f08a24', acc: ['lashes']},
  PUBLIC3: {head: 'humain', skin: SK.mate, hair: 'court', hairColor: '#120f0d', top: '#7a3fc4', pants: '#24304a', shoe: '#222', shoeAccent: '#555', hatColor: '#d93a3a', acc: ['capBack']},
  PUBLIC4: {head: 'humain', skin: SK.rosee, hair: 'chignon', hairColor: '#e0a040', top: '#2bb3c4', pants: '#f2f2f2', shoe: '#ffffff', shoeAccent: '#2bb3c4', acc: ['lashes', 'glassesRound']},
  TECH: {head: 'humain', skin: SK.claireMate, hair: 'court', hairColor: '#2a1c12', beardShort: '#2a1c12', top: '#151518', pants: '#151518', shoe: '#0c0c0e', shoeAccent: '#2a2a2e', shoeStyle: 'boot', acc: ['headset']},
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
const floralTexture = (bg: string, petals: string[]) => mkTex(`floral|${bg}|${petals.join()}`, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 22; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 20 + rnd() * 16, col = petals[i % petals.length];
    g.fillStyle = '#5c9a48';
    g.fillRect(x - r * 1.4, y + r * 0.3, r * 0.9, r * 0.45);
    g.fillStyle = col;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill();
  }
});
const sparkleTexture = (base: string) => mkTex(`sparkle|${base}`, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  let s = 11;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 2 + rnd() * 4;
    g.fillStyle = rnd() < 0.5 ? 'rgba(190,215,255,0.9)' : 'rgba(40,70,190,0.8)';
    g.fillRect(x, y, r, r);
  }
}, 256);
const checkTexture = () => mkTex('pdp', (g) => {
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1a1a1a';
  const n = 16, c = 256 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2 === 0) {
    g.fillRect(x * c, y * c, c, c);
    g.fillRect(x * c + c, y * c + c * 0.35, c * 0.35, c * 0.3);
  }
}, 256);

// ---------- bloc arrondi ----------
type V3 = [number, number, number];
type BP = {p: V3; s: V3; c: string; r?: number; rough?: number; clear?: boolean; map?: THREE.Texture | null; rot?: V3; metal?: number; emissive?: string};
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

const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex); c.multiplyScalar(k); return `#${c.getHexString()}`;
};

/** Coiffures en blocs, sur une tête cube x∈[-0.5,0.5], y∈[0.12,1.12], z∈[-0.45,0.45]. */
const Coiffure: React.FC<{hair: Hair; c: string; toque: boolean}> = ({hair, c, toque}) => {
  const H = (p: V3, s: V3, rot?: V3, r = 0.05) => <B key={`${p}${s}`} p={p} s={s} c={c} r={r} rough={0.6} rot={rot} />;
  if (hair === 'chauve') return null;
  const parts: React.ReactNode[] = [];
  const top = !toque;
  // base commune : arrière + côtés
  parts.push(H([0, 0.8, -0.49], [1.06, 0.66, 0.12]));
  [-1, 1].forEach((sd) => parts.push(H([sd * 0.52, 0.92, -0.08], [0.1, 0.38, 0.78])));
  if (top) parts.push(H([0, 1.17, -0.02], [1.08, 0.2, 0.98]));
  switch (hair) {
    case 'court':
      parts.push(H([0, 1.06, 0.46], [1.0, 0.12, 0.08]));
      break;
    case 'banane':
      parts.push(H([0, 1.06, 0.46], [1.0, 0.12, 0.08]));
      if (top) { parts.push(H([0, 1.36, 0.16], [0.86, 0.32, 0.62], [-0.25, 0, 0], 0.12)); parts.push(H([0, 1.3, 0.47], [0.8, 0.22, 0.2], [-0.4, 0, 0], 0.08)); }
      break;
    case 'meche':
      parts.push(H([-0.12, 1.02, 0.47], [0.72, 0.18, 0.1], [0, 0, -0.22]));
      parts.push(H([0.3, 1.08, 0.46], [0.36, 0.1, 0.08]));
      break;
    case 'tresses':
      parts.push(H([0, 1.08, 0.46], [1.0, 0.1, 0.06]));
      parts.push(H([0, 0.45, -0.5], [1.02, 0.85, 0.1]));
      [-1, 1].forEach((sd) => [0, 1, 2, 3, 4].forEach((k) => parts.push(H([sd * 0.36, 0.3 - k * 0.24, -0.32], [0.17, 0.2, 0.17], undefined, 0.06))));
      [-1, 1].forEach((sd) => parts.push(H([sd * 0.36, 0.3 - 5 * 0.24 + 0.06, -0.32], [0.12, 0.12, 0.12], undefined, 0.04)));
      break;
    case 'chignon':
      parts.push(H([0, 1.07, 0.46], [1.0, 0.1, 0.06]));
      parts.push(H(toque ? [0, 0.86, -0.64] : [0, 1.36, -0.2], [0.42, 0.38, 0.36], undefined, 0.12));
      break;
    case 'boucles': {
      const curls: V3[] = toque
        ? [[-0.42, 1.08, 0.42], [-0.18, 1.1, 0.48], [0.12, 1.1, 0.48], [0.38, 1.08, 0.42], [-0.56, 0.9, 0.15], [0.56, 0.9, 0.15], [-0.56, 0.68, -0.1], [0.56, 0.68, -0.1], [-0.3, 0.6, -0.56], [0.3, 0.6, -0.56], [0, 0.72, -0.58]]
        : [[-0.36, 1.26, 0.3], [0, 1.3, 0.34], [0.36, 1.26, 0.3], [-0.3, 1.3, -0.1], [0.3, 1.3, -0.1], [0, 1.32, -0.3], [-0.56, 0.95, 0.15], [0.56, 0.95, 0.15]];
      curls.forEach((p) => parts.push(H(p, [0.26, 0.24, 0.26], undefined, 0.1)));
      break;
    }
  }
  return <>{parts}</>;
};

/** Personnage voxel. Les pieds sont à y=0, hauteur totale ≈ 3,3 unités (avant échelle). */
export const Perso3D: React.FC<{who: string; pose?: Pose; position?: V3; rotation?: number; scale?: number}> = ({who, pose = {}, position = [0, 0, 0], rotation = 0, scale = 1}) => {
  const L = LOOKS[who] ?? LOOKS.SACHA;
  const A = new Set<Acc>(L.acc ?? []);
  const human = L.head === 'humain';
  const skin = L.skin ?? L.bottle ?? '#f2c9a5';
  const glossy = !human;
  const {walk, walkAmp = 1, talk = 0, look = [0, 0], brows = 0, blink = 0, armL = 0, armR = 0, armSideL = 0, armSideR = 0, headTurn = 0, headTilt = 0, bob = 0, squash = 0, smile = 1} = pose;
  const sw = walk === undefined ? 0 : Math.sin(walk) * 0.6 * walkAmp;
  const walkBob = walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 0.08 * walkAmp;
  const topMap = useMemo(() => (L.sparkle ? sparkleTexture(L.top) : null), [L]);
  const pantsMap = useMemo(() => (L.pantsPattern ? checkTexture() : null), [L]);
  const apronMap = useMemo(() => (L.apronFloral ? floralTexture(L.apronFloral[0], L.apronFloral.slice(1)) : null), [L]);

  const s0 = scale * (L.scale ?? 1);
  const legH = 0.75, bodyH = 0.95, bodyY = 0.2 + legH;
  const bodyW = L.bodyW ?? 1.0;
  const armX = bodyW / 2 + 0.14;
  const armW = bodyW > 1.15 ? 0.32 : 0.28;
  const headY = bodyY + bodyH;          // bas de la tête
  const squint = !!L.eyesSquint;
  const eyeOpen = squint ? 0.18 : Math.max(0.08, 1 - blink);
  const mouthH = 0.04 + 0.09 * smile + talk * 0.18;
  const browRot = brows < 0 ? 0.35 * -brows : 0;
  const browUp = brows > 0 ? 0.08 * brows : 0;
  const shoeStyle = L.shoeStyle ?? 'sneaker';
  const rolled = A.has('tattoo');
  // géométrie du visage
  const faceZ = human ? 0.455 : 0.415;
  const eyeY = human ? 0.72 : 0.8;
  const eyeX = human ? 0.2 : 0.215;
  const eyeW = human ? 0.3 : 0.33, eyeH = human ? 0.34 : 0.38;
  const mouthY = human ? (L.mustache ? 0.27 : 0.3) : 0.36;
  const browCol = L.brows ?? (human ? (L.hairColor ?? '#1a1410') : '#141414');
  const toque = human && !!L.toque;
  const tq = L.toque === 'petite' ? 0.78 : 1;

  return (
    <group position={[position[0], position[1] + bob + walkBob, position[2]]} rotation={[0, rotation, 0]} scale={[s0 * (1 + squash * 0.15), s0 * (1 - squash * 0.2), s0 * (1 + squash * 0.15)]}>
      {/* jambes */}
      {[-1, 1].map((side) => {
        const a = side * sw;
        return (
          <group key={side} position={[side * 0.24, 0.2 + legH, 0]} rotation={[a, 0, 0]}>
            <B p={[0, -legH / 2, 0]} s={[0.4, legH, 0.42]} c={L.pants} map={pantsMap} />
            {L.stripe && <B p={[side * 0.205, -legH / 2, 0]} s={[0.02, legH * 0.95, 0.12]} c={L.stripe} r={0.005} />}
            {shoeStyle === 'dress' ? (
              <B p={[0, -legH - 0.13, 0.06]} s={[0.4, 0.15, 0.56]} c={L.shoe} r={0.06} rough={0.15} />
            ) : shoeStyle === 'sabot' ? (<>
              <B p={[0, -legH - 0.1, 0.08]} s={[0.46, 0.22, 0.6]} c={L.shoe} r={0.1} rough={0.25} />
              <B p={[0, -legH - 0.18, 0.08]} s={[0.47, 0.06, 0.61]} c="#f0f0f0" r={0.02} rough={0.5} />
            </>) : shoeStyle === 'boot' ? (<>
              <B p={[0, -legH - 0.03, 0.02]} s={[0.46, 0.34, 0.5]} c={L.shoe} r={0.06} rough={0.7} />
              <B p={[0, -legH - 0.16, 0.1]} s={[0.48, 0.1, 0.6]} c={L.shoeAccent} r={0.04} rough={0.8} />
            </>) : (<>
              <B p={[0, -legH - 0.1, 0.06]} s={[0.44, 0.2, 0.58]} c={L.shoe} r={0.07} rough={0.5} />
              <B p={[0, -legH - 0.04, 0.0]} s={[0.46, 0.1, 0.4]} c={L.shoeAccent} r={0.04} rough={0.5} />
            </>)}
          </group>
        );
      })}
      {/* corps */}
      <B p={[0, bodyY + bodyH / 2, 0]} s={[bodyW, bodyH, 0.56]} c={L.top} r={0.1} map={topMap} rough={L.topRough ?? (L.sparkle ? 0.35 : 0.75)} metal={L.sparkle ? 0.35 : 0} />
      {L.bigBelly && <B p={[0, bodyY + 0.36, 0.22]} s={[bodyW * 0.82, 0.62, 0.28]} c={L.top} r={0.16} />}
      {/* veste ouverte : vêtement intérieur */}
      {L.inner && <B p={[0, bodyY + bodyH / 2, 0.27]} s={[0.4, bodyH * 0.96, 0.05]} c={L.inner} r={0.03} />}
      {/* veste de chef croisée */}
      {L.chef && <>
        <B p={[0.12, bodyY + bodyH / 2 + 0.02, 0.29 + (L.bigBelly ? 0.14 : 0)]} s={[bodyW * 0.62, bodyH * 0.9, 0.03]} c={shade(L.top, 0.96)} r={0.02} />
        {[-1, 1].map((sd) => [0, 1, 2].map((k) => (
          <B key={`${sd}${k}`} p={[sd * 0.2 + 0.08, bodyY + 0.75 - k * 0.24, 0.32 + (L.bigBelly ? 0.14 : 0)]} s={[0.08, 0.08, 0.04]} c="#2c2c33" r={0.03} rough={0.3} />
        )))}
        <B p={[0, headY + 0.03, 0.02]} s={[0.66, 0.12, 0.6]} c={L.top} r={0.04} />
      </>}
      {/* tablier */}
      {(L.apronColor || L.apronFloral) && <>
        <B p={[0, bodyY + 0.6, 0.3 + (L.bigBelly ? 0.14 : 0)]} s={[0.5, 0.42, 0.03]} c={L.apronColor ?? '#ffffff'} map={apronMap} r={0.02} />
        <B p={[0, 0.62, 0.36 + (L.bigBelly ? 0.12 : 0)]} s={[0.84, 0.82, 0.03]} c={L.apronColor ?? '#ffffff'} map={apronMap} r={0.03} />
        <B p={[0, bodyY + 0.05, 0]} s={[bodyW + 0.04, 0.08, 0.62 + (L.bigBelly ? 0.28 : 0)]} c={L.apronColor ? shade(L.apronColor, 0.85) : L.apronFloral![2]} r={0.02} />
      </>}
      {/* nœud papillon */}
      {A.has('bowtie') && <>
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.1, headY - 0.1, 0.31]} s={[0.15, 0.13, 0.05]} c="#0c0c0e" r={0.03} rot={[0, 0, sd * 0.2]} />)}
        <B p={[0, headY - 0.1, 0.33]} s={[0.06, 0.07, 0.05]} c="#0c0c0e" r={0.02} />
      </>}
      {/* foulard de cou */}
      {A.has('neckerchief') && <>
        <B p={[0, headY - 0.02, 0.3]} s={[0.42, 0.12, 0.06]} c={L.accColor ?? '#1c2a5c'} r={0.03} />
        <B p={[0.04, headY - 0.17, 0.32]} s={[0.16, 0.2, 0.05]} c={L.accColor ?? '#1c2a5c'} r={0.03} rot={[0, 0, 0.5]} />
      </>}
      {A.has('tie') && <>
        <B p={[0, bodyY + 0.62, 0.32]} s={[0.1, 0.5, 0.03]} c={L.accColor ?? '#0b0b0d'} r={0.02} />
        <B p={[0, bodyY + 0.88, 0.32]} s={[0.13, 0.08, 0.03]} c={L.accColor ?? '#0b0b0d'} r={0.02} />
      </>}
      {A.has('necklace') && <B p={[0, bodyY + 0.9, 0.29]} s={[0.36, 0.03, 0.02]} c="#e9c14a" r={0.01} metal={0.8} rough={0.3} />}
      {/* sac à dos */}
      {A.has('backpack') && <>
        <B p={[0, bodyY + 0.48, -0.44]} s={[0.78, 0.82, 0.34]} c={L.accColor ?? '#2f3542'} r={0.1} />
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.3, bodyY + 0.6, 0.29]} s={[0.1, 0.62, 0.03]} c="#1a1a1a" r={0.02} />)}
      </>}
      {/* casque audio autour du cou */}
      {A.has('headphones') && <>
        <B p={[0, headY + 0.06, 0.38]} s={[0.78, 0.09, 0.1]} c="#f4f4f4" r={0.03} rough={0.35} />
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.43, headY + 0.08, 0.24]} s={[0.16, 0.3, 0.3]} c="#ffffff" r={0.07} rough={0.3} />)}
      </>}
      {/* capuche */}
      {L.hood && <B p={[0, headY + 0.02, -0.22]} s={[0.86, 0.22, 0.26]} c={L.top} r={0.1} />}
      {/* bras */}
      {[-1, 1].map((side) => {
        const lift = side < 0 ? armL : armR;
        const spread = side < 0 ? armSideL : armSideR;
        const a = -side * sw * 0.9 - lift;
        const sleeveCol = L.top;
        return (
          <group key={side} position={[side * armX, bodyY + bodyH - 0.12, 0]} rotation={[a, 0, side * (0.08 + spread)]}>
            {rolled ? <>
              <B p={[0, -0.2, 0]} s={[armW + 0.02, 0.42, 0.34]} c={sleeveCol} r={0.09} map={topMap} />
              <B p={[0, -0.44, 0]} s={[armW + 0.05, 0.1, 0.36]} c={shade(sleeveCol, 0.93)} r={0.04} />
              <B p={[0, -0.6, 0]} s={[armW - 0.02, 0.36, 0.28]} c={skin} r={0.08} />
              {side > 0 && <B p={[0, -0.6, 0.145]} s={[0.16, 0.18, 0.02]} c="#22365e" r={0.02} />}
            </> : <B p={[0, L.sleevesLong ? -0.42 : -0.36, 0]} s={[armW, L.sleevesLong ? 0.84 : 0.72, 0.32]} c={sleeveCol} r={0.09} map={topMap} rough={L.topRough ?? 0.75} metal={L.sparkle ? 0.35 : 0} />}
            <B p={[0, L.sleevesLong ? -0.88 : -0.8, 0.02]} s={[L.sleevesLong ? 0.2 : 0.26, L.sleevesLong ? 0.12 : 0.22, L.sleevesLong ? 0.22 : 0.28]} c={skin} r={0.06} clear={glossy} rough={0.7} />
            {A.has('micro') && side > 0 && (
              <group position={[0, -0.86, 0.14]} rotation={[-0.25, 0, 0]}>
                <B p={[0, 0, 0.12]} s={[0.08, 0.08, 0.34]} c="#1a1a1e" r={0.03} rough={0.4} />
                <B p={[0, 0.02, 0.34]} s={[0.17, 0.17, 0.17]} c="#5b5d66" r={0.08} rough={0.35} metal={0.5} />
                <B p={[0, 0.02, 0.27]} s={[0.11, 0.11, 0.03]} c="#d02b2b" r={0.02} />
              </group>
            )}
            {A.has('carnet') && side < 0 && (
              <group position={[0.04, -0.84, 0.22]} rotation={[0.25 + lift * 0.4, 0, 0]}>
                <B p={[0, 0, 0]} s={[0.36, 0.46, 0.06]} c="#1f3d7a" r={0.02} />
                <B p={[0.0, 0, 0.035]} s={[0.3, 0.4, 0.02]} c="#f5f1e4" r={0.01} />
                <B p={[0.12, 0.05, 0.06]} s={[0.04, 0.34, 0.04]} c="#e8b42a" r={0.015} rot={[0, 0, -0.4]} />
              </group>
            )}
          </group>
        );
      })}
      {/* ----- tête ----- */}
      <group position={[0, headY, 0]} rotation={[headTilt, headTurn, 0]}>
        {human ? <>
          <B p={[0, 0.06, 0]} s={[0.42, 0.14, 0.4]} c={shade(skin, 0.92)} r={0.04} rough={0.7} />
          <B p={[0, 0.62, 0]} s={[1.0, 1.0, 0.9]} c={skin} r={0.1} rough={0.7} />
          {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.52, 0.62, 0.02]} s={[0.08, 0.22, 0.16]} c={shade(skin, 0.94)} r={0.03} rough={0.7} />)}
          <B p={[0, 0.5, faceZ + 0.04]} s={[0.14, 0.14, 0.1]} c={shade(skin, 0.9)} r={0.04} rough={0.7} />
          {L.blush && [-1, 1].map((sd) => <B key={sd} p={[sd * 0.32, 0.48, faceZ + 0.005]} s={[0.17, 0.08, 0.02]} c="#f2869a" r={0.02} rough={0.8} />)}
          {L.hair && <Coiffure hair={L.hair} c={L.hairColor ?? '#1a1410'} toque={toque} />}
          {toque && <group position={[0, 1.12, 0]} scale={[tq, tq, tq]}>
            <B p={[0, 0.12, 0]} s={[1.06, 0.26, 0.96]} c="#ffffff" r={0.05} rough={0.85} />
            <B p={[0, 0.58, 0]} s={[1.18, 0.7, 1.06]} c="#ffffff" r={0.22} rough={0.9} />
            {[-0.3, 0, 0.3].map((x) => <B key={x} p={[x, 0.58, 0.535]} s={[0.04, 0.6, 0.02]} c="#ececec" r={0.01} />)}
          </group>}
          {L.mustache && <>
            <B p={[0, 0.41, faceZ + 0.04]} s={[0.56, 0.15, 0.1]} c={L.mustache} r={0.05} rough={0.8} />
            {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.33, 0.45, faceZ + 0.03]} s={[0.2, 0.1, 0.08]} c={L.mustache!} r={0.04} rough={0.8} rot={[0, 0, sd * 0.45]} />)}
          </>}
          {L.beardShort && <>
            <B p={[0, 0.22, faceZ + 0.01]} s={[0.98, 0.28, 0.06]} c={L.beardShort} r={0.06} rough={0.9} />
            {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.5, 0.42, 0.18]} s={[0.04, 0.46, 0.5]} c={L.beardShort!} r={0.02} rough={0.9} />)}
          </>}
          {A.has('headset') && <>
            <B p={[0, 1.2, 0]} s={[1.1, 0.08, 0.16]} c="#2a2a30" r={0.03} />
            {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.56, 0.68, 0.02]} s={[0.14, 0.34, 0.32]} c="#1c1c20" r={0.06} />)}
            <B p={[-0.38, 0.38, 0.4]} s={[0.4, 0.05, 0.05]} c="#2a2a30" r={0.02} rot={[0, -0.5, 0.3]} />
          </>}
        </> : <>
          <B p={[0, 0.62, 0]} s={[0.98, 1.24, 0.82]} c={L.bottle ?? '#eee'} r={0.16} clear />
          <B p={[0, 1.3, 0]} s={[0.66, 0.18, 0.6]} c={L.bottle ?? '#eee'} r={0.08} clear />
          <B p={[0, 1.46, 0]} s={[0.44, 0.16, 0.42]} c={L.bottle ?? '#eee'} r={0.05} clear />
          <B p={[0, 1.57, 0]} s={[0.56, 0.06, 0.54]} c={L.cap ?? '#fff'} r={0.02} />
          <B p={[0, 1.71, 0]} s={[0.52, 0.24, 0.5]} c={L.cap ?? '#fff'} r={0.05} rough={0.45} />
        </>}
        {/* casquette */}
        {(A.has('cap') || A.has('capBack')) && <>
          <B p={[0, human ? 1.2 : 1.18, 0]} s={[1.06, 0.26, 0.94]} c={L.hatColor ?? '#222'} r={0.12} rough={0.6} />
          <B p={[0, human ? 1.1 : 1.07, A.has('capBack') ? -0.64 : 0.64]} s={[0.84, 0.06, 0.44]} c={L.hatColor ?? '#222'} r={0.03} rough={0.6} />
        </>}
        {/* créoles */}
        {A.has('hoops') && [-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * (human ? 0.57 : 0.56), human ? 0.42 : 0.3, 0.06]} rotation={[0, sd * 0.5, 0]} castShadow>
            <torusGeometry args={[0.12, 0.025, 8, 20]} />
            <meshStandardMaterial color="#e5b73b" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
        {/* yeux */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * eyeX, eyeY, faceZ]}>
            {squint ? (<>
              <B p={[0, 0.0, 0.01]} s={[0.28, 0.07, 0.04]} c="#1a1209" r={0.03} />
              <B p={[-0.13, -0.05, 0.01]} s={[0.07, 0.1, 0.04]} c="#1a1209" r={0.03} />
              <B p={[0.13, -0.05, 0.01]} s={[0.07, 0.1, 0.04]} c="#1a1209" r={0.03} />
            </>) : (<>
              <B p={[0, 0, 0]} s={[eyeW, eyeH * eyeOpen, 0.04]} c="#ffffff" r={0.04} rough={0.3} />
              <B p={[look[0] * 0.06, look[1] * 0.06 * eyeOpen - 0.01, 0.025]} s={[eyeW * 0.46, eyeH * 0.5 * eyeOpen, 0.03]} c="#24150b" r={0.03} rough={0.2} />
              <B p={[look[0] * 0.06 + 0.035, look[1] * 0.06 * eyeOpen + 0.035, 0.045]} s={[0.05, 0.05 * eyeOpen, 0.01]} c="#ffffff" r={0.005} rough={0.1} />
            </>)}
            {A.has('lashes') && !squint && <>
              <B p={[side * 0.15, eyeH * 0.42 * eyeOpen + 0.02, 0.03]} s={[0.1, 0.05, 0.03]} c="#111" r={0.015} rot={[0, 0, side * 0.6]} />
              <B p={[side * 0.17, eyeH * 0.2 * eyeOpen + 0.02, 0.03]} s={[0.08, 0.04, 0.03]} c="#111" r={0.015} rot={[0, 0, side * 0.3]} />
            </>}
            {A.has('glassesRect') && <Frame w={0.4} h={0.36} t={0.05} c="#111116" z={0.06} />}
            {A.has('glassesRound') && <Frame w={0.38} h={0.38} t={0.045} c="#8a5a2a" z={0.06} />}
            {/* sourcil */}
            <group position={[0, eyeH * 0.5 + 0.11 + browUp, 0.02]} rotation={[0, 0, side * (browRot - 0.12)]}>
              <B p={[0, 0, 0]} s={[0.34, 0.1 * (L.browThick ?? 1), 0.06]} c={browCol} r={0.035} />
            </group>
          </group>
        ))}
        {(A.has('glassesRect') || A.has('glassesRound')) && <B p={[0, eyeY + 0.02, faceZ + 0.065]} s={[0.08, 0.045, 0.04]} c={A.has('glassesRect') ? '#111116' : '#8a5a2a'} r={0.01} />}
        {/* bouche */}
        {(() => {
          const z = faceZ + (L.beardShort ? 0.05 : 0.005);
          const mw = human ? 0.42 : 0.46;
          return <>
            <B p={[0, mouthY, z]} s={[mw, mouthH, 0.03]} c="#3a0d0d" r={0.03} rough={0.6} />
            {smile > 0.4 && [-1, 1].map((sd) => <B key={sd} p={[sd * (mw / 2 + 0.03), mouthY + mouthH / 2 - 0.02, z]} s={[0.1, 0.07, 0.03]} c="#3a0d0d" r={0.02} rough={0.6} />)}
            <B p={[0, mouthY + mouthH / 2 - 0.03, z + 0.013]} s={[mw - 0.06, 0.055, 0.015]} c="#ffffff" r={0.01} rough={0.4} />
            <B p={[0, mouthY - mouthH / 2 + 0.035, z + 0.013]} s={[mw * 0.52, Math.min(0.07, mouthH * 0.35), 0.012]} c="#ff7a8a" r={0.01} />
          </>;
        })()}
      </group>
    </group>
  );
};
