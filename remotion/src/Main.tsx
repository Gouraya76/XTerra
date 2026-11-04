import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as Sc from './scenes';
import timeline from './timeline.json';
import {clamp, DateTag, fontFaces, Grain, Logo, RED, RED_D, W} from './ui';

const SCENES: Record<string, React.FC<{dur: number}>> = Sc as any;
const CUTS = timeline.scenes.slice(1).map((s) => s[1] as number);

/** transition "swipe" rouge diagonale centrée sur chaque coupe */
const Swipes: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const c = CUTS.find((x) => Math.abs(t - x) < 0.25);
  if (c === undefined) return null;
  const k = (t - c + 0.25) / 0.5; // 0→1
  const x1 = interpolate(k, [0, 1], [-1.6, 1.6]) * W;
  const x2 = interpolate(k, [0.08, 1.08], [-1.6, 1.6], clamp) * W;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: -400, bottom: -400, left: x2, width: W * 0.9, background: RED_D, transform: 'skewX(-18deg)'}} />
      <div style={{position: 'absolute', top: -400, bottom: -400, left: x1, width: W * 0.75, background: RED, transform: 'skewX(-18deg)', boxShadow: '0 0 80px rgba(255,40,40,0.7)'}} />
    </AbsoluteFill>
  );
};

/** zoom + flou directionnel au début de chaque plan */
const Punch: React.FC<{children: React.ReactNode; first: boolean}> = ({children, first}) => {
  const f = useCurrentFrame();
  const z = first ? 1 : interpolate(f, [0, 10], [1.12, 1], {...clamp, easing: (x) => 1 - (1 - x) ** 3});
  const b = first ? 0 : interpolate(f, [0, 8], [14, 0], clamp);
  return <AbsoluteFill style={{transform: `scale(${z})`, filter: b > 0.2 ? `blur(${b}px)` : undefined}}>{children}</AbsoluteFill>;
};

export const Main: React.FC = () => {
  const {fps} = useVideoConfig();
  const f = useCurrentFrame();
  const t = f / fps;
  const showBrand = t < 77.0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <style>{fontFaces}</style>
      {timeline.scenes.map(([name, a, b], i) => {
        const C = SCENES[name as string];
        const from = Math.round((a as number) * fps);
        const to = Math.round((b as number) * fps);
        return (
          <Sequence key={name as string} from={from} durationInFrames={to - from} name={name as string}>
            <Punch first={i === 0}>
              <C dur={(to - from) / fps} />
            </Punch>
          </Sequence>
        );
      })}
      <Grain />
      {showBrand && (
        <>
          <DateTag />
          <div style={{position: 'absolute', right: 26, top: 150}}>
            <Logo h={62} shineAt={[0.4, 15, 30, 45, 60, 72]} />
          </div>
        </>
      )}
      <Swipes />
      <Audio src={staticFile('voice.mp3')} />
      <Audio src={staticFile('sfx.wav')} volume={0.55} />
    </AbsoluteFill>
  );
};
