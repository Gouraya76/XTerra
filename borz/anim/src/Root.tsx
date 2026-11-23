import React from 'react';
import {Composition} from 'remotion';
import {EP01} from './EP01';
import tl from './ep01.json';
import {StyleTest} from './voxel/StyleTest';
import {CastTest} from './voxel/CastTest';
import {DecorsTest} from './voxel/DecorsTest';
import {EP02} from './voxel/EP02';
import tl2 from './ep02.json';

export const Root: React.FC = () => (
  <>
  <Composition id="EP02" component={EP02} durationInFrames={Math.round(tl2.duration * tl2.fps)} fps={tl2.fps} width={1920} height={1080} />
  <Composition id="DecorsTest" component={DecorsTest} durationInFrames={7} fps={30} width={1920} height={1080} />
  <Composition id="CastTest" component={CastTest} durationInFrames={30} fps={30} width={1920} height={1080} />
  <Composition id="StyleTest" component={StyleTest} durationInFrames={150} fps={30} width={1920} height={1080} />
  <Composition id="EP01" component={EP01} durationInFrames={Math.round(tl.duration * tl.fps)} fps={tl.fps} width={1920} height={1080} />
  </>
);
