import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Perso3D} from './Perso3D';
import {PanneauRegle, Rue} from './Ville3D';

const Camera: React.FC<{pos: [number, number, number]; target: [number, number, number]}> = ({pos, target}) => {
  // la caméra par défaut de r3f est pilotée à chaque image
  return <perspectiveCamera />;
};

export const StyleTest: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = f / fps;
  const walking = t < 3;
  const z = walking ? interpolate(t, [0, 3], [-14, 0]) : 0;
  const phase = t * 9;
  const talk = !walking ? Math.max(0, Math.sin(t * 18)) * (t > 3.3 ? 1 : 0) : 0;
  const camZ = interpolate(t, [0, 5], [11, 7.5]);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#8fd0ff, #d8f1ff)'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, position: [3.2, 3.6, camZ], near: 0.1, far: 300}}
        onCreated={({camera, gl}) => { camera.lookAt(0, 2.2, -1); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
        <CamLook z={camZ} />
        <fog attach="fog" args={['#cfeaff', 30, 110]} />
        <hemisphereLight args={['#dff3ff', '#e9cfa8', 1.1]} />
        <directionalLight position={[12, 22, 10]} intensity={2.4} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
          shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-camera-far={80} />
        <Rue />
        <PanneauRegle x={4} z={-6} rot={-0.5} />
        <Perso3D who="ZIGO" position={[-1.7, 0, z - 0.6]} pose={{walk: walking ? phase + 1 : undefined, armL: walking ? 0 : 0.9, brows: 0.6, look: [0.6, 0]}} rotation={walking ? 0 : 0.35} />
        <Perso3D who="ORI" position={[0, 0, z]} pose={{walk: walking ? phase : undefined, talk, look: [0, -0.2], brows: 0, blink: Math.abs(t - 4.2) < 0.06 ? 1 : 0}} />
        <Perso3D who="PIMENT" position={[1.7, 0, z - 0.4]} pose={{walk: walking ? phase + 2 : undefined, armSideL: walking ? 0 : 0.9, armSideR: walking ? 0 : 0.9, brows: 1, look: [-0.6, 0.3], bob: !walking ? Math.abs(Math.sin(t * 10)) * 0.15 : 0}} rotation={walking ? 0 : -0.35} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const CamLook: React.FC<{z: number}> = ({z}) => {
  // positionne/oriente la caméra à chaque image (rendu déterministe)
  return <CamCtl z={z} />;
};
import {useThree} from '@react-three/fiber';
const CamCtl: React.FC<{z: number}> = ({z}) => {
  const {camera} = useThree();
  camera.position.set(3.2, 3.6, z);
  camera.lookAt(0, 2.2, -1);
  return null;
};
void Camera;
