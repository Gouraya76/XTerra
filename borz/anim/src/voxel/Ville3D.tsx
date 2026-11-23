import React from 'react';
import {random} from 'remotion';
import {RoundedBox} from '@react-three/drei';

const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; c: string; r?: number; rough?: number; emissive?: string; ei?: number}> = ({p, s, c, r = 0.04, rough = 0.85, emissive, ei = 0}) => (
  <RoundedBox args={s} radius={Math.min(r, Math.min(...s) / 2.01)} smoothness={2} position={p} castShadow receiveShadow>
    <meshStandardMaterial color={c} roughness={rough} emissive={emissive ?? '#000'} emissiveIntensity={ei} />
  </RoundedBox>
);

const FACADES = ['#f3e3c3', '#e9b8a0', '#a9d3d0', '#f0c987', '#c9b6e0', '#e6e0d4', '#9fc3e6', '#f2a7a0'];

/** Immeuble cubique avec fenêtres, store et éventuelle enseigne. */
export const Immeuble: React.FC<{x: number; z: number; w: number; h: number; d?: number; seed: string; rot?: number; sign?: string}> = ({x, z, w, h, d = 6, seed, rot = 0}) => {
  const col = FACADES[Math.floor(random(seed) * FACADES.length)];
  const floors = Math.max(2, Math.floor(h / 3));
  const cols = Math.max(2, Math.floor(w / 2.4));
  const wins: React.ReactNode[] = [];
  for (let f = 1; f < floors; f++)
    for (let c = 0; c < cols; c++) {
      const wx = -w / 2 + (c + 0.5) * (w / cols);
      const wy = f * (h / floors) + 0.6;
      wins.push(<group key={`${f}-${c}`}>
        <Box p={[wx, wy, d / 2 + 0.02]} s={[1.2, 1.5, 0.12]} c="#f7f3ea" r={0.03} />
        <Box p={[wx, wy, d / 2 + 0.06]} s={[0.95, 1.25, 0.08]} c={random(`${seed}${f}${c}`) < 0.3 ? '#ffe9a8' : '#7fb6d9'} r={0.02} rough={0.15} />
        <Box p={[wx, wy - 0.85, d / 2 + 0.15]} s={[1.4, 0.15, 0.3]} c="#e8e1d3" r={0.03} />
      </group>);
    }
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} c={col} r={0.1} />
      <Box p={[0, h + 0.15, 0]} s={[w + 0.3, 0.3, d + 0.3]} c="#d9cfbf" r={0.05} />
      {/* rez-de-chaussée : vitrine + store */}
      <Box p={[0, 1.4, d / 2 + 0.03]} s={[w * 0.7, 2.2, 0.1]} c="#5c8fb0" r={0.03} rough={0.15} />
      <Box p={[0, 2.75, d / 2 + 0.5]} s={[w * 0.78, 0.25, 1.0]} c={random(`${seed}st`) < 0.5 ? '#d94c4c' : '#3f8f6a'} r={0.05} />
      {wins}
    </group>
  );
};

export const Arbre: React.FC<{x: number; z: number; s?: number}> = ({x, z, s = 1}) => (
  <group position={[x, 0, z]} scale={s}>
    <Box p={[0, 0.9, 0]} s={[0.35, 1.8, 0.35]} c="#7a4e2d" />
    <Box p={[0, 2.4, 0]} s={[1.6, 1.4, 1.6]} c="#4f9a3c" r={0.15} />
    <Box p={[0, 3.2, 0]} s={[1.0, 0.8, 1.0]} c="#5cae45" r={0.12} />
  </group>
);

export const Lampadaire: React.FC<{x: number; z: number}> = ({x, z}) => (
  <group position={[x, 0, z]}>
    <Box p={[0, 2, 0]} s={[0.15, 4, 0.15]} c="#3b3f46" />
    <Box p={[0, 4.05, 0.25]} s={[0.3, 0.18, 0.7]} c="#3b3f46" />
    <Box p={[0, 3.93, 0.4]} s={[0.22, 0.06, 0.3]} c="#fff4c9" emissive="#fff0b0" ei={0.8} />
  </group>
);

export const Banc: React.FC<{x: number; z: number; rot?: number}> = ({x, z, rot = 0}) => (
  <group position={[x, 0, z]} rotation={[0, rot, 0]}>
    <Box p={[0, 0.5, 0]} s={[2, 0.12, 0.6]} c="#a8703f" />
    <Box p={[0, 0.9, -0.28]} s={[2, 0.5, 0.1]} c="#a8703f" />
    <Box p={[-0.8, 0.25, 0]} s={[0.12, 0.5, 0.5]} c="#3b3f46" /><Box p={[0.8, 0.25, 0]} s={[0.12, 0.5, 0.5]} c="#3b3f46" />
  </group>
);

/** Panneau de règle façon « 100 jours » (planche sur pied, cadre lumineux). */
export const PanneauRegle: React.FC<{x: number; z: number; rot?: number}> = ({x, z, rot = 0}) => (
  <group position={[x, 0, z]} rotation={[0, rot, 0]}>
    <Box p={[-0.9, 1.2, 0]} s={[0.15, 2.4, 0.15]} c="#6b4a2b" /><Box p={[0.9, 1.2, 0]} s={[0.15, 2.4, 0.15]} c="#6b4a2b" />
    <Box p={[0, 2.6, 0]} s={[2.4, 1.8, 0.12]} c="#c9934f" />
    <Box p={[0, 2.6, 0.08]} s={[1.6, 1.3, 0.04]} c="#ffffff" r={0.01} />
    <Box p={[0, 2.6, 0.03]} s={[2.5, 1.9, 0.06]} c="#ffd23f" emissive="#ffd23f" ei={0.6} />
  </group>
);

/** Une rue de BORZ City : chaussée, trottoirs, immeubles des deux côtés. */
export const Rue: React.FC<{len?: number}> = ({len = 80}) => {
  const items: React.ReactNode[] = [];
  let z = 10;
  let i = 0;
  while (z > -len) {
    const w = 7 + random(`w${i}`) * 4, h = 8 + random(`h${i}`) * 10;
    items.push(<Immeuble key={`L${i}`} x={-13 - 3} z={z - w / 2} w={w} h={h} seed={`L${i}`} rot={Math.PI / 2} />);
    const w2 = 7 + random(`w2${i}`) * 4, h2 = 8 + random(`h2${i}`) * 10;
    items.push(<Immeuble key={`R${i}`} x={13 + 3} z={z - w2 / 2} w={w2} h={h2} seed={`R${i}`} rot={-Math.PI / 2} />);
    if (i % 2 === 0) { items.push(<Arbre key={`a${i}`} x={-8.5} z={z - 2} />); items.push(<Lampadaire key={`l${i}`} x={8.5} z={z - 3} />); }
    else { items.push(<Arbre key={`b${i}`} x={8.5} z={z - 2} />); items.push(<Banc key={`c${i}`} x={-9} z={z - 4} rot={Math.PI / 2} />); }
    z -= Math.max(w, w2) + 0.5; i++;
  }
  return (
    <group>
      {/* chaussée + trottoirs */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -len / 2]} receiveShadow><planeGeometry args={[200, len + 120]} /><meshStandardMaterial color="#e9dcc2" roughness={0.95} /></mesh>
      <Box p={[0, 0.02, -len / 2]} s={[10, 0.04, len + 40]} c="#8d8f96" r={0.01} />
      {Array.from({length: 20}, (_, k) => <Box key={k} p={[0, 0.05, 8 - k * 5]} s={[0.25, 0.02, 2.2]} c="#f4f1e8" r={0.005} />)}
      {[-1, 1].map((sd) => <Box key={sd} p={[sd * 5.25, 0.1, -len / 2]} s={[0.5, 0.2, len + 40]} c="#cfc6b4" r={0.03} />)}
      {items}
    </group>
  );
};
