import React from 'react';
import {Composition} from 'remotion';
import {EP01} from './EP01';
import tl from './ep01.json';
import {StyleTest} from './voxel/StyleTest';

export const Root: React.FC = () => (
  <>
  <Composition id="StyleTest" component={StyleTest} durationInFrames={150} fps={30} width={1920} height={1080} />
  <Composition id="EP01" component={EP01} durationInFrames={Math.round(tl.duration * tl.fps)} fps={tl.fps} width={1920} height={1080} />
  </>
);
