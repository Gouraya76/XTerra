import React from 'react';
import {Composition} from 'remotion';
import {CastTest} from './voxel/CastTest';
import {DecorsTest} from './voxel/DecorsTest';
import {Emission} from './voxel/Emission';
import {LoupGarou} from './voxel/LoupGarou';
import tl from './ep01.json';
import tl2 from './ep02.json';
import {bornesShort, ShortLoupGarou} from './voxel/ShortLoupGarou';

export const Root: React.FC = () => (
  <>
    <Composition id="EP01" component={Emission} durationInFrames={Math.round(tl.duration * tl.fps)} fps={tl.fps} width={1920} height={1080} />
    <Composition id="EP02" component={LoupGarou} durationInFrames={Math.round(tl2.duration * tl2.fps)} fps={tl2.fps} width={1920} height={1080} />
    {tl2.shorts.map(({n}) => (
      <Composition key={n} id={`EP02-SHORT${String(n).padStart(2, '0')}`} component={ShortLoupGarou} defaultProps={{n}}
        durationInFrames={Math.round(bornesShort(n).duree * tl2.fps)} fps={tl2.fps} width={1080} height={1920} />
    ))}
    <Composition id="CastTest" component={CastTest} durationInFrames={30} fps={30} width={1920} height={1080} />
    <Composition id="DecorsTest" component={DecorsTest} durationInFrames={7} fps={30} width={1920} height={1080} />
  </>
);
