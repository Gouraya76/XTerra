import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, getInputProps} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Perso3D} from './Perso3D';

const ROW1 = ['SACHA', 'LEO', 'INES', 'MARCEL', 'YASMINE', 'BRUNO', 'JULES', 'COLETTE'];
const ROW2 = ['PUBLIC1', 'PUBLIC2', 'TECH', 'PUBLIC3', 'PUBLIC4'];

const Cam: React.FC<{pos: [number, number, number]; target: [number, number, number]}> = ({pos, target}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  camera.lookAt(...target);
  return null;
};

/** Planche des personnages (rangée avant = les 8 principaux, figurants derrière). inputProps {focus: 'MARCEL'} = gros plan. */
export const CastTest: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const {focus} = getInputProps() as {focus?: string};
  const sp = 2.35;
  const all = [
    ...ROW2.map((w, i) => ({w, x: (i - (ROW2.length - 1) / 2) * 2.8, y: 1.2, z: -3.4})),
    ...ROW1.map((w, i) => ({w, x: (i - (ROW1.length - 1) / 2) * sp, y: 0, z: 1.2})),
  ];
  const fo = focus ? all.find((a) => a.w === focus) : undefined;
  const pos: [number, number, number] = fo ? [fo.x + 0.6, fo.y + 3.0, fo.z + 4.4] : [0, 4.6, 18.5];
  const target: [number, number, number] = fo ? [fo.x, fo.y + 2.5, fo.z] : [0, 2.2, -0.5];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#bfe6ff, #eaf7ff)'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: fo ? 35 : 38, position: pos, near: 0.1, far: 200}}
        onCreated={({gl}) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
        <Cam pos={pos} target={target} />
        <hemisphereLight args={['#e6f5ff', '#e9d3b0', 1.15]} />
        <directionalLight position={[8, 18, 14]} intensity={2.3} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
          shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-camera-far={60} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[120, 120]} /><meshStandardMaterial color="#efe6d3" roughness={0.95} /></mesh>
        <mesh position={[0, 0.6, -3.6]} castShadow receiveShadow><boxGeometry args={[18, 1.2, 3.2]} /><meshStandardMaterial color="#d9cdb4" roughness={0.9} /></mesh>
        {all.map(({w, x, y, z}) => <Perso3D key={w} who={w} position={[x, y, z]} pose={{talk: 0.3 + 0.2 * Math.sin(f / 3), look: [0, -0.1]}} />)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
