import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import timeline from './timeline.json';

export const Root: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={Math.round(timeline.duration * timeline.fps)} fps={timeline.fps} width={1080} height={1920} />
);
