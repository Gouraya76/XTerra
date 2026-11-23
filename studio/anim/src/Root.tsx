import React from 'react';
import {Composition} from 'remotion';
import {CastTest} from './voxel/CastTest';
import {DecorsTest} from './voxel/DecorsTest';
import {Emission} from './voxel/Emission';
import tl from './ep01.json';

export const Root: React.FC = () => (
  <>
    <Composition id="EP01" component={Emission} durationInFrames={Math.round(tl.duration * tl.fps)} fps={tl.fps} width={1920} height={1080} />
    <Composition id="CastTest" component={CastTest} durationInFrames={30} fps={30} width={1920} height={1080} />
    <Composition id="DecorsTest" component={DecorsTest} durationInFrames={7} fps={30} width={1920} height={1080} />
  </>
);
