import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';

/** Description d'un personnage BORZ en style voxel. */
export type Look = {
  bottle: string;      // couleur de la bouteille (tête + mains)
  cap: string;         // bouchon
  top: string;         // sweat / veste
  topText?: string;    // texte sur le torse
  topTextColor?: string;
  pants: string;
  stripe?: string;     // bande sur le pantalon
  shoe: string;
  shoeAccent: string;
  brows?: string;
  extra?: 'clipboard' | 'none';
};

export const LOOKS: Record<string, Look> = {
  ORI: {bottle: '#eef1f4', cap: '#ffffff', top: '#f4f4f4', topText: 'BORZ', topTextColor: '#151515', pants: '#e9e9e9', stripe: '#151515', shoe: '#ffffff', shoeAccent: '#d9d9d9'},
  ZIGO: {bottle: '#8fd629', cap: '#1f9e1f', top: '#4f7a1c', topText: 'BORZ', topTextColor: '#e8ffd0', pants: '#4a7019', stripe: '#2e4710', shoe: '#ffffff', shoeAccent: '#2f8f2f', extra: 'clipboard'},
  PIMENT: {bottle: '#ff3326', cap: '#d0160e', top: '#b3150f', topText: 'BORZ', topTextColor: '#ffd21f', pants: '#a3120d', stripe: '#ffd21f', shoe: '#ffffff', shoeAccent: '#d41a12'},
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
};

const textCache = new Map<string, THREE.CanvasTexture>();
const textTexture = (text: string, color: string, bg: string) => {
  const key = `${text}|${color}|${bg}`;
  if (textCache.has(key)) return textCache.get(key)!;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
  g.fillStyle = color; g.font = '900 150px ID, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 230);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  textCache.set(key, t);
  return t;
};

const B: React.FC<{p: [number, number, number]; s: [number, number, number]; c: string; r?: number; rough?: number; metal?: number; clear?: boolean}> = ({p, s, c, r = 0.06, rough = 0.75, clear}) => (
  <RoundedBox args={s} radius={Math.min(r, Math.min(...s) / 2.01)} smoothness={3} position={p} castShadow receiveShadow>
    {clear ? <meshPhysicalMaterial color={c} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} /> : <meshStandardMaterial color={c} roughness={rough} />}
  </RoundedBox>
);

/** Personnage voxel. Les pieds sont à y=0, hauteur totale ≈ 3,3 unités. */
export const Perso3D: React.FC<{who: string; pose?: Pose; position?: [number, number, number]; rotation?: number; scale?: number}> = ({who, pose = {}, position = [0, 0, 0], rotation = 0, scale = 1}) => {
  const L = LOOKS[who];
  const {walk, walkAmp = 1, talk = 0, look = [0, 0], brows = 0, blink = 0, armL = 0, armR = 0, armSideL = 0, armSideR = 0, headTurn = 0, headTilt = 0, bob = 0, squash = 0} = pose;
  const sw = walk === undefined ? 0 : Math.sin(walk) * 0.6 * walkAmp;
  const walkBob = walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 0.08 * walkAmp;
  const tex = useMemo(() => (L.topText ? textTexture(L.topText, L.topTextColor ?? '#000', L.top) : null), [L]);

  const legH = 0.75, bodyH = 0.95, bodyY = 0.2 + legH;
  const headY = bodyY + bodyH;          // bas de la tête
  const eyeOpen = Math.max(0.08, 1 - blink);
  const mouthH = 0.13 + talk * 0.18;
  const browRot = brows < 0 ? 0.35 * -brows : 0;
  const browUp = brows > 0 ? 0.08 * brows : 0;

  return (
    <group position={[position[0], position[1] + bob + walkBob, position[2]]} rotation={[0, rotation, 0]} scale={[scale * (1 + squash * 0.15), scale * (1 - squash * 0.2), scale * (1 + squash * 0.15)]}>
      {/* jambes */}
      {[-1, 1].map((side) => {
        const a = side * sw;
        return (
          <group key={side} position={[side * 0.24, 0.2 + legH, 0]} rotation={[a, 0, 0]}>
            <B p={[0, -legH / 2, 0]} s={[0.4, legH, 0.42]} c={L.pants} />
            {L.stripe && <B p={[side * 0.205, -legH / 2, 0]} s={[0.02, legH * 0.95, 0.12]} c={L.stripe} r={0.005} />}
            {/* chaussure */}
            <B p={[0, -legH - 0.1, 0.06]} s={[0.44, 0.2, 0.58]} c={L.shoe} r={0.07} rough={0.5} />
            <B p={[0, -legH - 0.04, 0.0]} s={[0.46, 0.1, 0.4]} c={L.shoeAccent} r={0.04} rough={0.5} />
          </group>
        );
      })}
      {/* corps */}
      <B p={[0, bodyY + bodyH / 2, 0]} s={[1.0, bodyH, 0.56]} c={L.top} r={0.1} />
      {tex && (
        <mesh position={[0, bodyY + bodyH * 0.55, 0.283]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      )}
      {/* capuche */}
      <B p={[0, headY + 0.02, -0.22]} s={[0.86, 0.22, 0.26]} c={L.top} r={0.1} />
      {/* bras */}
      {[-1, 1].map((side) => {
        const lift = side < 0 ? armL : armR;
        const spread = side < 0 ? armSideL : armSideR;
        const a = -side * sw * 0.9 - lift;
        return (
          <group key={side} position={[side * 0.64, bodyY + bodyH - 0.12, 0]} rotation={[a, 0, side * (0.08 + spread)]}>
            <B p={[0, -0.36, 0]} s={[0.28, 0.72, 0.32]} c={L.top} r={0.09} />
            <B p={[0, -0.8, 0.02]} s={[0.26, 0.22, 0.28]} c={L.bottle} r={0.08} clear />
            {L.extra === 'clipboard' && side < 0 && (
              <group position={[0.05, -0.82, 0.24]} rotation={[0.2 + lift * 0.5, 0, 0]}>
                <B p={[0, 0, 0]} s={[0.5, 0.62, 0.05]} c="#c08a52" r={0.02} />
                <B p={[0, 0.3, 0.03]} s={[0.2, 0.08, 0.04]} c="#8c8c8c" r={0.015} rough={0.3} />
              </group>
            )}
          </group>
        );
      })}
      {/* tête-bouteille */}
      <group position={[0, headY, 0]} rotation={[headTilt, headTurn, 0]}>
        <B p={[0, 0.62, 0]} s={[0.98, 1.24, 0.82]} c={L.bottle} r={0.16} clear />
        <B p={[0, 1.3, 0]} s={[0.66, 0.18, 0.6]} c={L.bottle} r={0.08} clear />
        <B p={[0, 1.46, 0]} s={[0.44, 0.16, 0.42]} c={L.bottle} r={0.05} clear />
        <B p={[0, 1.57, 0]} s={[0.56, 0.06, 0.54]} c={L.cap} r={0.02} />
        <B p={[0, 1.71, 0]} s={[0.52, 0.24, 0.5]} c={L.cap} r={0.05} rough={0.45} />
        {/* yeux */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.215, 0.8, 0.415]}>
            <B p={[0, 0, 0]} s={[0.33, 0.38 * eyeOpen, 0.04]} c="#ffffff" r={0.04} rough={0.3} />
            <B p={[look[0] * 0.06, look[1] * 0.06 * eyeOpen - 0.01, 0.025]} s={[0.15, 0.19 * eyeOpen, 0.03]} c="#24150b" r={0.03} rough={0.2} />
            <B p={[look[0] * 0.06 + 0.035, look[1] * 0.06 * eyeOpen + 0.04, 0.045]} s={[0.05, 0.05 * eyeOpen, 0.01]} c="#ffffff" r={0.005} rough={0.1} />
            {/* sourcil */}
            <group position={[0, 0.27 + browUp, 0.02]} rotation={[0, 0, side * (browRot - 0.12)]}>
              <B p={[0, 0, 0]} s={[0.36, 0.1, 0.06]} c={L.brows ?? '#141414'} r={0.04} />
            </group>
          </group>
        ))}
        {/* bouche */}
        {/* bouche souriante : bloc central + coins relevés */}
        <B p={[0, 0.36, 0.42]} s={[0.46, mouthH, 0.03]} c="#3a0d0d" r={0.03} rough={0.6} />
        {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.26, 0.36 + mouthH / 2 - 0.02, 0.42]} s={[0.1, 0.07, 0.03]} c="#3a0d0d" r={0.02} rough={0.6} />)}
        <B p={[0, 0.36 + mouthH / 2 - 0.03, 0.433]} s={[0.4, 0.055, 0.015]} c="#ffffff" r={0.01} rough={0.4} />
        <B p={[0, 0.36 - mouthH / 2 + 0.035, 0.433]} s={[0.24, Math.min(0.07, mouthH * 0.35), 0.012]} c="#ff7a8a" r={0.01} />
      </group>
    </group>
  );
};
