import React, {useMemo} from 'react';
import {geoAlbersUsa, geoGraticule10, geoInterpolate, geoOrthographic, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
// @ts-ignore
import usTopo from 'us-atlas/states-10m.json';
// @ts-ignore
import worldTopo from 'world-atlas/countries-110m.json';
import {BLUE, clamp, easeInOut, easeOut, RED} from './ui';

const NON_STATES = new Set(['11', '60', '66', '69', '72', '78']);
const usStates: any[] = (feature(usTopo as any, (usTopo as any).objects.states) as any).features.filter((f: any) => !NON_STATES.has(f.id));
const world: any[] = (feature(worldTopo as any, (worldTopo as any).objects.countries) as any).features;

// ordre de "dépouillement" pseudo-aléatoire mais déterministe
const order = usStates.map((s, i) => ({id: s.id, r: random('dep' + i)})).sort((a, b) => a.r - b.r).map((o, k) => [o.id, k] as const);
const orderMap = new Map(order);

/** Carte des 50 États. mode 'count' : les États s'allument un à un ; mode 'texas' : zoom sur le Texas */
export const USMap: React.FC<{
  w: number;
  h: number;
  countP?: number;
  texasP?: number;
  zoomP?: number;
}> = ({w, h, countP = 0, texasP = 0, zoomP = 0}) => {
  const f = useCurrentFrame();
  const proj = useMemo(() => geoAlbersUsa().fitSize([w, h], {type: 'FeatureCollection', features: usStates} as any), [w, h]);
  const path = geoPath(proj);
  const tx = usStates.find((s) => s.id === '48');
  const [[x0, y0], [x1, y1]] = path.bounds(tx);
  const cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2;
  const z = 1 + zoomP * 1.6;
  const lit = countP * usStates.length;
  return (
    <svg width={w} height={h} style={{overflow: 'visible'}}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(${w / 2} ${h / 2}) scale(${z}) translate(${-(w / 2 + (cx - w / 2) * zoomP)} ${-(h / 2 + (cy - h / 2) * zoomP)})`}>
        {usStates.map((s) => {
          const k = orderMap.get(s.id) ?? 0;
          const on = clamp01(lit - k);
          const isTx = s.id === '48';
          let fill = `rgba(255,255,255,${0.06 + on * 0.82})`;
          if (texasP > 0) fill = isTx ? mix('#ffffff', BLUE, texasP) : `rgba(255,255,255,${0.12 * (1 - zoomP * 0.4)})`;
          return (
            <path
              key={s.id}
              d={path(s) || ''}
              fill={fill}
              stroke={isTx && texasP > 0 ? 'white' : 'rgba(255,90,100,0.9)'}
              strokeWidth={(isTx && texasP > 0 ? 4 : 1.4) / z}
              filter={isTx && texasP > 0.5 ? 'url(#glow)' : undefined}
            />
          );
        })}
        {texasP > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={(30 + ((f % 30) / 30) * 120) / z}
            fill="none"
            stroke="white"
            strokeWidth={3 / z}
            opacity={(1 - (f % 30) / 30) * texasP}
          />
        )}
      </g>
    </svg>
  );
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

/** Hémicycle animé (sièges qui apparaissent de gauche à droite avec un léger 'pop') */
export const Hemicycle: React.FC<{total: number; blue: number; rows: number; rIn: number; rOut: number; dot: number; at: number; dur: number; majority?: number}> = ({
  total,
  blue,
  rows,
  rIn,
  rOut,
  dot,
  at,
  dur,
  majority,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seats = useMemo(() => {
    const radii = Array.from({length: rows}, (_, i) => rIn + ((rOut - rIn) * i) / (rows - 1));
    const tot = radii.reduce((a, b) => a + b, 0);
    const counts = radii.map((r) => Math.round((total * r) / tot));
    counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
    const s: {a: number; r: number}[] = [];
    radii.forEach((r, i) => {
      for (let j = 0; j < counts[i]; j++) s.push({a: Math.PI * (1 - j / (counts[i] - 1)), r});
    });
    s.sort((p, q) => q.a - p.a);
    return s;
  }, [total, rows, rIn, rOut]);
  const W2 = rOut + dot * 2;
  const lf = f - at * fps;
  const ma = majority ? Math.PI * (1 - majority / total) : 0;
  const mp = interpolate(lf, [dur * fps * 0.6, dur * fps * 0.6 + 12], [0, 1], clamp);
  return (
    <svg width={W2 * 2} height={W2 + 10} style={{overflow: 'visible'}}>
      <defs>
        <filter id="dglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#dglow)">
        {seats.map((s, k) => {
          const tk = (k / total) * dur * fps;
          const p = interpolate(lf - tk, [0, 8], [0, 1], {...clamp, easing: easeOut});
          const x = W2 + s.r * Math.cos(s.a);
          const y = W2 - s.r * Math.sin(s.a);
          return <circle key={k} cx={x} cy={y} r={dot * (p < 1 ? 0.3 + p * 0.9 : 1)} fill={p <= 0 ? 'rgba(255,255,255,0.08)' : k < blue ? BLUE : RED} />;
        })}
      </g>
      {majority && mp > 0 && (
        <line
          x1={W2 + (rIn - 30) * Math.cos(ma)}
          y1={W2 - (rIn - 30) * Math.sin(ma)}
          x2={W2 + (rIn - 30 + (rOut - rIn + 80) * mp) * Math.cos(ma)}
          y2={W2 - (rIn - 30 + (rOut - rIn + 80) * mp) * Math.sin(ma)}
          stroke="white"
          strokeWidth={6}
          strokeDasharray="14 10"
        />
      )}
    </svg>
  );
};

/** Globe qui pivote des États-Unis vers l'Europe avec un arc d'onde de choc */
export const Globe: React.FC<{size: number; rotP: number; arcP: number}> = ({size, rotP, arcP}) => {
  const f = useCurrentFrame();
  const lam = interpolate(rotP, [0, 1], [96, -10], {easing: easeInOut});
  const phi = interpolate(rotP, [0, 1], [-30, -42], {easing: easeInOut});
  const proj = geoOrthographic().scale(size / 2 - 4).translate([size / 2, size / 2]).rotate([lam, phi]).clipAngle(90);
  const path = geoPath(proj);
  const EU = new Set(['250', '276', '380', '724', '056', '528', '616', '620', '040', '203', '752', '246', '208', '372', '300', '642', '348', '100', '703', '705', '191', '440', '428', '233', '442', '826']);
  const interp = geoInterpolate([-77.03, 38.9], [4.35, 50.85]);
  const n = 60;
  const m = Math.max(2, Math.round(n * arcP));
  const line = {type: 'LineString', coordinates: Array.from({length: m}, (_, i) => interp(i / n))};
  const head = interp((m - 1) / n);
  const hp = proj(head as any);
  return (
    <svg width={size} height={size} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="ocean" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#3a0a12" />
          <stop offset="100%" stopColor="#0c0507" />
        </radialGradient>
        <filter id="gglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="url(#ocean)" stroke="rgba(255,80,90,0.6)" strokeWidth={3} />
      <path d={path(geoGraticule10()) || ''} fill="none" stroke="rgba(255,80,90,0.12)" strokeWidth={1} />
      {world.map((c, i) => {
        const isUS = c.id === '840';
        const isEU = EU.has(c.id);
        return (
          <path
            key={i}
            d={path(c) || ''}
            fill={isUS ? RED : isEU ? `rgba(255,255,255,${0.25 + 0.6 * arcP})` : 'rgba(255,255,255,0.13)'}
            stroke="rgba(10,4,6,0.8)"
            strokeWidth={0.8}
          />
        );
      })}
      {arcP > 0 && <path d={path(line as any) || ''} fill="none" stroke="white" strokeWidth={5} filter="url(#gglow)" strokeLinecap="round" />}
      {arcP > 0 && hp && (
        <>
          <circle cx={hp[0]} cy={hp[1]} r={10} fill="white" filter="url(#gglow)" />
          {arcP >= 1 && <circle cx={hp[0]} cy={hp[1]} r={10 + ((f % 24) / 24) * 70} fill="none" stroke="white" strokeWidth={3} opacity={1 - (f % 24) / 24} />}
        </>
      )}
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={30} />
    </svg>
  );
};
