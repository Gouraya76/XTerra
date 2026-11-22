import React from 'react';
import {Img, staticFile} from 'remotion';
import tl from './ep01.json';

export const FPS = tl.fps;
export const IMG: Record<string, string> = {
  ORI: 'blanc', ZIGO: 'vert', PIMENT: 'rouge', PRUNE: 'violet',
  KENZO: 'bleu', LOLA: 'rose', TANK: 'orange', SKATTY: 'jaune', PAPI: 'papi',
  NINO: 'turquoise', ZARA: 'mamie', ROCCO: 'ouvrier', NOVA: 'grise',
};
export const COLOR: Record<string, string> = {
  ORI: '#f2f2f2', ZIGO: '#7ed321', PIMENT: '#ff3b30', PRUNE: '#b56cff', NARRATEUR: '#ffd23f',
};

export type Line = (typeof tl.lines)[number];
export const LINES = tl.lines as Line[];

export const lineAt = (t: number): Line | undefined => LINES.find((l) => t >= l.start && t < l.start + l.dur);

/** Intensité de parole 0..1 d'un personnage à l'instant t (+ petit saut au début de chaque réplique). */
export const talkOf = (who: string, t: number) => {
  for (const l of LINES) {
    if (!l.who.split('+').includes(who)) continue;
    if (t >= l.start && t < l.start + l.dur + 0.1) {
      const i = Math.floor((t - l.start) * FPS);
      const e = l.env;
      const v = ((e[i - 1] ?? 0) + 2 * (e[i] ?? 0) + (e[i + 1] ?? 0)) / 4;
      const dt = t - l.start;
      const hop = dt < 0.32 ? Math.sin((Math.PI * dt) / 0.32) : 0;
      return {v, hop};
    }
  }
  return {v: 0, hop: 0};
};

type Props = {
  who: string; x: number; y: number; h: number; t: number;
  flip?: boolean; dx?: number; dy?: number; rot?: number; sx?: number; sy?: number; opacity?: number; shadow?: boolean;
  img?: string;
};

export const Perso: React.FC<Props> = ({who, x, y, h, t, flip, dx = 0, dy = 0, rot = 0, sx = 1, sy = 1, opacity = 1, shadow = true, img}) => {
  const {v, hop} = talkOf(who, t);
  const seed = who.length * 1.7;
  const breathe = Math.sin(t * 2.4 + seed) * 0.01;
  const sway = Math.sin(t * 1.3 + seed) * 1.2;
  const bounceY = -v * h * 0.03 - hop * h * 0.05;
  const scY = sy * (1 + breathe + v * 0.05 + hop * 0.04);
  const scX = sx * (1 - v * 0.025) * (flip ? -1 : 1);
  const r = rot + sway * 0.6 + Math.sin(t * 9 + seed) * v * 2.5;
  const lift = -bounceY - dy;
  return (
    <div style={{position: 'absolute', left: x + dx, top: y, width: 0, height: 0, opacity}}>
      {shadow && (
        <div style={{position: 'absolute', left: -h * 0.17, top: -h * 0.025, width: h * 0.34, height: h * 0.05, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)', filter: 'blur(8px)', transform: `scale(${Math.max(0.5, 1 - lift / (h * 0.6))})`}} />
      )}
      <Img src={staticFile(`persos/${img ?? IMG[who]}.png`)}
        style={{position: 'absolute', height: h, left: 0, bottom: 0, transformOrigin: '50% 100%',
          transform: `translate(-50%, ${bounceY + dy}px) rotate(${r}deg) scale(${scX}, ${scY})`,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}} />
    </div>
  );
};
