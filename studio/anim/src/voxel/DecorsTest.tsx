import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {
  CielNuit, CuisineZara, Eclairage, fondCss, LaBoite, ModeLumiere, PanneauRegle3D, PlaceMairie, QGGarage, RueNuit, Skatepark,
  SPOTS_CUISINE_ZARA, SPOTS_LA_BOITE, SPOTS_PLACE_MAIRIE, SPOTS_QG_GARAGE, SPOTS_RUE_NUIT, SPOTS_SKATEPARK, Cam,
} from './Decors3D';
import {CouloirCoulisses, CuisineEpreuve, EclairagePlateau, fondPlateau, ModePlateau, PlateauTV, SalleDegustation, SPOTS_COULISSES, SPOTS_CUISINE, SPOTS_DEGUSTATION, SPOTS_PLATEAU} from './Plateau3D';

const CamCtl: React.FC<{cam: Cam}> = ({cam}) => {
  const {camera} = useThree();
  camera.position.set(...cam.pos);
  camera.lookAt(...cam.target);
  return null;
};

const useFonts = () => {
  const [ok, setOk] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([['ID', 'fonts/InterDisplay-Black.otf'], ['IT', 'fonts/Inter-ExtraBold.otf']].map(([n, f]) => new FontFace(n, `url(${staticFile(f)})`).load().then((ff) => document.fonts.add(ff))))
      .then(() => { setOk(true); continueRender(h); });
  }, [h]);
  return ok;
};

type Sc = {mode: ModeLumiere; cam: Cam; el: (t: number) => React.ReactNode; plateau?: ModePlateau};
const P = (m: ModePlateau, cam: Cam, el: (t: number) => React.ReactNode): Sc => ({mode: 'jour', cam, el, plateau: m});
const PLATEAU: Sc[] = [
  P('normal', SPOTS_PLATEAU.cam_large, (t) => <PlateauTV t={t} elimines={[1]} />),
  P('normal', SPOTS_PLATEAU.cam_candidats, (t) => <PlateauTV t={t} elimines={[1]} />),
  P('normal', SPOTS_PLATEAU.cam_enqueteurs, (t) => <PlateauTV t={t} />),
  P('suspense', SPOTS_PLATEAU.cam_face_a_face, (t) => <PlateauTV t={t} lumiere="suspense" ecran="QUI EST L'IMPOSTEUR ?" elimines={[0, 3]} />),
  P('revelation', SPOTS_PLATEAU.cam_large, (t) => <PlateauTV t={t} lumiere="revelation" ecran="LE VRAI CHEF EST…" elimines={[0, 1, 3, 4]} />),
  P('normal', SPOTS_CUISINE.cam_large, (t) => <CuisineEpreuve t={t} chrono={8} />),
  P('normal', SPOTS_DEGUSTATION.cam_large, (t) => <SalleDegustation t={t} ouvertes={[2]} />),
  P('normal', SPOTS_COULISSES.cam_large, (t) => <CouloirCoulisses t={t} />),
  P('normal', SPOTS_PLATEAU.cam_presentateur, (t) => <PlateauTV t={t} />),
  P('normal', SPOTS_PLATEAU.cam_candidat_3, (t) => <PlateauTV t={t} />),
];
const SCENES: Sc[] = [...PLATEAU,
  {mode: 'jour', cam: SPOTS_PLACE_MAIRIE.camera_large, el: (t) => <PlaceMairie t={t} regle={{jour: 1, texte: 'de marcher'}} />},
  {mode: 'soir', cam: SPOTS_LA_BOITE.camera_large, el: (t) => (<>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#d9ccb2" roughness={0.95} /></mesh>
    <LaBoite t={t} erreurs={2} /></>)},
  {mode: 'interieur', cam: SPOTS_QG_GARAGE.camera_large, el: (t) => <QGGarage t={t} />},
  {mode: 'interieur', cam: SPOTS_CUISINE_ZARA.camera_large, el: (t) => <CuisineZara t={t} />},
  {mode: 'jour', cam: SPOTS_SKATEPARK.camera_large, el: (t) => <Skatepark t={t} />},
  {mode: 'nuit', cam: SPOTS_RUE_NUIT.camera_large, el: (t) => (<><CielNuit /><RueNuit night t={t} /></>)},
  {mode: 'jour', cam: {pos: [2, 3.6, 7], target: [0, 3, 0]}, el: () => (<>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#e9dcc2" roughness={0.95} /></mesh>
    <PanneauRegle3D jour={15} texte="de parler fort" /></>)},
];

export const DecorsTest: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const ok = useFonts();
  const k = (getInputProps() as {k?: number}).k ?? f; // --props='{"k":N}' pour choisir n'importe quel décor
  const s = SCENES[Math.min(k, SCENES.length - 1)];
  return (
    <AbsoluteFill style={{background: s.plateau ? fondPlateau(s.plateau) : fondCss(s.mode)}}>
      {ok && (
        <ThreeCanvas key={f} width={width} height={height} shadows camera={{fov: 42, near: 0.1, far: 400}}
          onCreated={({gl}) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
          <CamCtl cam={s.cam} />
          {s.plateau ? <EclairagePlateau mode={s.plateau} centre={[s.cam.target[0], 0, s.cam.target[2]]} /> : <Eclairage mode={s.mode} centre={s.cam.target} />}
          {s.el(f / 30 + 1)}
        </ThreeCanvas>
      )}
    </AbsoluteFill>
  );
};
