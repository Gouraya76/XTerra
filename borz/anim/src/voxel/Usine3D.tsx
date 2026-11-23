import React from 'react';
import {Bloc, Texte3D} from './Decors3D';

type V3 = [number, number, number];

/** L'usine secrète sous La Boîte : salle violette, tapis roulants de bouteilles « Prune Energy ». */
export const Usine3D: React.FC<{t: number; borz?: number; flash?: number}> = ({t, borz = 0, flash = 0}) => {
  const belts: React.ReactNode[] = [];
  [-6, 0, 6].forEach((z, k) => {
    belts.push(<Bloc key={`b${k}`} p={[0, 0.9, z]} s={[26, 0.5, 1.6]} c="#2a2238" r={0.05} />);
    belts.push(<Bloc key={`l${k}`} p={[0, 0.45, z]} s={[26, 0.9, 1.2]} c="#3b3050" r={0.05} />);
    for (let i = 0; i < 12; i++) {
      const x = ((i * 2.3 + t * 2.2 + k * 0.9) % 27.6) - 13.8;
      const isBorz = (i + k) % 3 < Math.round(borz * 3);
      const col = isBorz ? ['#f2f2f2', '#8fd629', '#ff3326'][(i + k) % 3] : '#8b3dff';
      belts.push(<group key={`o${k}-${i}`} position={[x, 1.15, z]}>
        <Bloc p={[0, 0.3, 0]} s={[0.4, 0.6, 0.4]} c={col} r={0.08} rough={0.3} />
        <Bloc p={[0, 0.7, 0]} s={[0.22, 0.2, 0.22]} c={isBorz ? '#222' : '#5a1fb0'} r={0.04} />
      </group>);
    }
  });
  const machines: React.ReactNode[] = [];
  [-10, 10].forEach((x, k) => machines.push(
    <group key={k} position={[x, 0, -1]}>
      <Bloc p={[0, 2.5, 0]} s={[3, 5, 15]} c="#4a2a78" r={0.1} />
      {[-5, 0, 5].map((z) => <Bloc key={z} p={[k ? -1.55 : 1.55, 3.2, z]} s={[0.1, 0.8, 0.8]} c="#ff4fd8" emissive="#ff4fd8" ei={1.2 + Math.sin(t * 6 + z) * 0.5 + flash * 3} />)}
      <Bloc p={[0, 5.6, 0]} s={[1.2, 1.2, 1.2]} c="#2a2238" r={0.1} />
    </group>));
  return (
    <group>
      <Bloc p={[0, -0.1, 0]} s={[40, 0.2, 30]} c="#2b1d40" r={0.02} />
      <Bloc p={[0, 7, -13]} s={[40, 14, 0.5]} c="#3a2560" r={0.02} />
      <Bloc p={[-20, 7, 0]} s={[0.5, 14, 30]} c="#341f58" r={0.02} />
      <Bloc p={[20, 7, 0]} s={[0.5, 14, 30]} c="#341f58" r={0.02} />
      {[-12, -4, 4, 12].map((x) => <Bloc key={x} p={[x, 12.5, -12.6]} s={[5, 0.3, 0.3]} c="#ffd9ff" emissive="#ff9cf0" ei={1.5} />)}
      <Texte3D p={[0, 9.5, -12.6] as V3} w={14} h={2.6} text="PRUNE ENERGY" color="#e9c4ff" bg="#2a1250" font={1.4} glow={0.8} />
      {belts}
      {machines}
    </group>
  );
};
