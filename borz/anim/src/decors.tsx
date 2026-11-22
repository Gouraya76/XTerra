import React from 'react';
import {random} from 'remotion';

const W = 1920, H = 1080;

const Windows: React.FC<{x: number; y: number; w: number; h: number; seed: string; on: string; off: string; cols: number; rows: number; p?: number}> = ({x, y, w, h, seed, on, off, cols, rows, p = 0.45}) => {
  const cw = w / cols, rh = h / rows, out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const lit = random(`${seed}-${r}-${c}`) < p;
      out.push(<rect key={`${r}-${c}`} x={x + c * cw + cw * 0.2} y={y + r * rh + rh * 0.2} width={cw * 0.6} height={rh * 0.55} fill={lit ? on : off} opacity={lit ? 0.9 : 0.6} />);
    }
  return <>{out}</>;
};

const Neon: React.FC<{x: number; y: number; size: number; color: string; text: string; flicker?: number}> = ({x, y, size, color, text, flicker = 1}) => (
  <g opacity={flicker}>
    <text x={x} y={y} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={size} fill="none" stroke={color} strokeWidth={size * 0.1} filter="url(#glow)" opacity={0.9}>{text}</text>
    <text x={x} y={y} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={size} fill="none" stroke="#fff" strokeWidth={size * 0.025}>{text}</text>
  </g>
);

const Defs: React.FC = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    <filter id="blur6"><feGaussianBlur stdDeviation="6" /></filter>
    <filter id="blur30"><feGaussianBlur stdDeviation="30" /></filter>
    <pattern id="brick" width="120" height="60" patternUnits="userSpaceOnUse">
      <rect width="120" height="60" fill="#5a2f2a" />
      <rect x="2" y="2" width="116" height="26" fill="#6b3830" />
      <rect x="-58" y="32" width="116" height="26" fill="#633329" />
      <rect x="62" y="32" width="116" height="26" fill="#6e3a2f" />
    </pattern>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#07051a" /><stop offset="0.55" stopColor="#24114a" /><stop offset="1" stopColor="#5b2168" /></linearGradient>
    <radialGradient id="vign" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.75" /></radialGradient>
    <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe7a8" stopOpacity="0.55" /><stop offset="1" stopColor="#ffe7a8" stopOpacity="0" /></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4b4b52" /><stop offset="1" stopColor="#1d1d22" /></linearGradient>
  </defs>
);

const Stars: React.FC<{t: number}> = ({t}) => (
  <>{Array.from({length: 120}, (_, i) => (
    <circle key={i} cx={random(`sx${i}`) * W} cy={random(`sy${i}`) * 520} r={0.6 + random(`sr${i}`) * 1.8} fill="#fff"
      opacity={0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + random(`st${i}`) * 2) + i))} />
  ))}</>
);

const Skyline: React.FC<{y: number; seed: string; color: string; win: string; scale?: number; n?: number}> = ({y, seed, color, win, scale = 1, n = 14}) => {
  const out: React.ReactNode[] = []; let x = -40;
  for (let i = 0; i < n && x < W + 40; i++) {
    const w = (110 + random(`${seed}w${i}`) * 140) * scale, h = (180 + random(`${seed}h${i}`) * 320) * scale;
    out.push(<g key={i}><rect x={x} y={y - h} width={w} height={h} fill={color} />
      <Windows x={x} y={y - h + 20} w={w} h={h - 30} seed={`${seed}${i}`} on={win} off="#0d0a1c" cols={Math.max(2, Math.round(w / 34))} rows={Math.round(h / 40)} p={0.35} /></g>);
    x += w + 8 + random(`${seed}g${i}`) * 30;
  }
  return <>{out}</>;
};

/** BORZ City la nuit + le garage du quartier. */
export const Ville: React.FC<{t: number}> = ({t}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <Defs />
    <rect width={W} height={H} fill="url(#sky)" />
    <Stars t={t} />
    <circle cx={1560} cy={170} r={150} fill="#fff4d6" opacity={0.12} filter="url(#blur30)" />
    <circle cx={1560} cy={170} r={70} fill="#fff4d6" />
    <circle cx={1585} cy={150} r={14} fill="#e9dcb8" /><circle cx={1535} cy={195} r={9} fill="#e9dcb8" />
    {/* tours Prune Corp */}
    {[[260, 150, 640], [430, 120, 520], [1180, 170, 700], [1360, 130, 560]].map(([x, w, h], i) => (
      <g key={i}>
        <rect x={x} y={760 - h} width={w} height={h} fill="#2e1650" />
        <Windows x={x} y={780 - h} w={w} h={h - 40} seed={`prune${i}`} on="#c77dff" off="#1d0d36" cols={4} rows={Math.round(h / 36)} p={0.55} />
        <circle cx={x + w / 2} cy={760 - h - 30} r={26} fill="#9b4dff" filter="url(#glow)" opacity={0.7 + 0.3 * Math.sin(t * 3 + i)} />
        <text x={x + w / 2} y={760 - h - 19} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={32} fill="#fff">P</text>
      </g>
    ))}
    <Skyline y={800} seed="mid" color="#1a1736" win="#ffd27a" scale={0.9} />
    <Skyline y={860} seed="near" color="#100e22" win="#ffb84d" scale={0.75} n={20} />
    {/* rue */}
    <rect x={0} y={860} width={W} height={220} fill="#1b1a24" />
    <rect x={0} y={860} width={W} height={18} fill="#34323f" />
    {Array.from({length: 9}, (_, i) => <rect key={i} x={i * 240 - ((t * 0) % 240)} y={1040} width={120} height={10} fill="#d8c25a" opacity={0.6} />)}
    {/* garage BORZ */}
    <rect x={650} y={430} width={620} height={440} fill="url(#brick)" />
    <rect x={650} y={430} width={620} height={440} fill="#000" opacity={0.25} />
    <rect x={630} y={410} width={660} height={34} fill="#2b2230" />
    <rect x={730} y={560} width={460} height={310} fill="#3a3d46" />
    {Array.from({length: 11}, (_, i) => <rect key={i} x={730} y={560 + i * 28} width={460} height={3} fill="#24262d" />)}
    <text x={960} y={690} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={120} fill="#7ed321" stroke="#0c2a00" strokeWidth={6} transform="rotate(-6 960 660)">BORZ</text>
    <Neon x={960} y={525} size={84} color="#ff3b30" text="BORZ" flicker={0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 3.1)} />
    {/* lampadaire */}
    <rect x={1400} y={520} width={12} height={350} fill="#2a2a33" />
    <rect x={1340} y={512} width={80} height={12} rx={6} fill="#2a2a33" />
    <polygon points="1345,524 1270,880 1470,880 1395,524" fill="url(#cone)" />
    <circle cx={1370} cy={526} r={12} fill="#fff3c4" filter="url(#glow)" />
    <rect width={W} height={H} fill="url(#vign)" />
  </svg>
);

/** Intérieur du garage : le QG. */
export const Garage: React.FC<{t: number; icicles?: number}> = ({t, icicles = 1}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <Defs />
    <rect width={W} height={H} fill="url(#brick)" />
    <rect width={W} height={H} fill="#140a10" opacity={0.35} />
    {/* plafond + poutres */}
    <rect x={0} y={0} width={W} height={90} fill="#1e1820" />
    {[200, 700, 1200, 1700].map((x) => <rect key={x} x={x} y={0} width={36} height={110} fill="#2d2530" />)}
    {/* stalactites de glace (souvenir du frigo) */}
    {Array.from({length: 9}, (_, i) => {
      const x = 170 + i * 34, h = (40 + random(`ice${i}`) * 70) * icicles;
      return <polygon key={i} points={`${x},88 ${x + 22},88 ${x + 11},${88 + h}`} fill="#bfefff" opacity={0.85} />;
    })}
    {/* néon BORZ + logo */}
    <Neon x={960} y={300} size={170} color="#7ed321" text="BORZ" flicker={0.9 + 0.1 * Math.sin(t * 17) * Math.sin(t * 2.3)} />
    <text x={960} y={370} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={38} fill="#ffffff" opacity={0.75} letterSpacing={18}>QG DU QUARTIER</text>
    {/* frigo cabossé */}
    <rect x={150} y={420} width={250} height={440} rx={16} fill="#d9dde3" />
    <rect x={150} y={600} width={250} height={8} fill="#9aa1ab" />
    <rect x={360} y={470} width={14} height={90} rx={6} fill="#9aa1ab" />
    <rect x={360} y={640} width={14} height={110} rx={6} fill="#9aa1ab" />
    <path d="M190 470 l40 30 l-25 25 l35 20" stroke="#6b7480" strokeWidth={5} fill="none" />
    <rect x={170} y={700} width={90} height={60} fill="#ffd23f" transform="rotate(-8 215 730)" />
    <text x={215} y={738} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={20} fill="#222" transform="rotate(-8 215 730)">NE PAS OUVRIR</text>
    {/* canapé */}
    <rect x={1430} y={650} width={380} height={170} rx={30} fill="#a3232a" />
    <rect x={1400} y={610} width={70} height={210} rx={30} fill="#8a1c22" />
    <rect x={1780} y={610} width={70} height={210} rx={30} fill="#8a1c22" />
    <rect x={1450} y={560} width={340} height={120} rx={30} fill="#b72a31" />
    <rect x={1470} y={820} width={20} height={40} fill="#3b2a22" /><rect x={1760} y={820} width={20} height={40} fill="#3b2a22" />
    {/* étagère avec bouteilles */}
    <rect x={500} y={470} width={280} height={14} fill="#3b2a22" />
    {['#7ed321', '#ffffff', '#ff3b30', '#2f7bff', '#ffd23f', '#ff5fa2'].map((c, i) => (
      <g key={c}><rect x={515 + i * 44} y={410} width={30} height={60} rx={8} fill={c} opacity={0.9} /><rect x={522 + i * 44} y={398} width={16} height={14} fill={c} /></g>
    ))}
    {/* sol */}
    <rect x={0} y={860} width={W} height={220} fill="url(#floor)" />
    <ellipse cx={700} cy={980} rx={140} ry={22} fill="#111" opacity={0.4} />
    <ellipse cx={960} cy={960} rx={520} ry={70} fill="#7a1e2b" opacity={0.75} />
    <ellipse cx={960} cy={960} rx={480} ry={58} fill="none" stroke="#e8c35a" strokeWidth={4} opacity={0.5} />
    {/* lampes suspendues */}
    {[560, 1360].map((x, i) => (
      <g key={x}>
        <rect x={x - 2} y={0} width={4} height={150 + Math.sin(t * 1.5 + i) * 3} fill="#111" />
        <path d={`M${x - 50} 190 L${x + 50} 190 L${x + 22} 150 L${x - 22} 150 Z`} fill="#2b2b2b" />
        <polygon points={`${x - 46},192 ${x - 330},1080 ${x + 330},1080 ${x + 46},192`} fill="url(#cone)" opacity={0.55} />
        <circle cx={x} cy={192} r={14} fill="#fff3c4" filter="url(#glow)" />
      </g>
    ))}
    <rect width={W} height={H} fill="url(#vign)" />
  </svg>
);

/** Le bureau de Monsieur Prune. towerP : 0..1 croissance de la Prune Tower dans la fenêtre. */
export const Bureau: React.FC<{t: number; flash: number; towerP: number}> = ({t, flash, towerP}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <Defs />
    <rect width={W} height={H} fill="#1a0b2b" />
    {/* grande baie vitrée */}
    <rect x={260} y={90} width={1400} height={700} fill="url(#sky)" />
    <Stars t={t} />
    <rect x={260 + 1400} y={0} width={W} height={H} fill="#1a0b2b" />
    <Skyline y={790} seed="bur" color="#160c2c" win="#9d6bff" scale={0.8} n={18} />
    {/* Prune Tower qui pousse */}
    <g>
      <rect x={1390} y={790 - 600 * towerP} width={160} height={600 * towerP} fill="#5a22a0" />
      <Windows x={1390} y={800 - 600 * towerP} w={160} h={Math.max(0, 600 * towerP - 20)} seed="tower" on="#e0b3ff" off="#3a1470" cols={4} rows={Math.max(1, Math.round(17 * towerP))} p={0.7} />
      {towerP > 0.95 && <text x={1470} y={790 - 600 * towerP - 24} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={44} fill="#e0b3ff" filter="url(#glow)">PRUNE TOWER</text>}
    </g>
    {/* montants de la fenêtre */}
    {[260, 726, 1193, 1660].map((x) => <rect key={x} x={x - 14} y={80} width={28} height={720} fill="#2a1240" />)}
    <rect x={240} y={784} width={1440} height={24} fill="#2a1240" />
    <rect x={240} y={70} width={1440} height={24} fill="#2a1240" />
    {/* éclair */}
    <rect x={260} y={90} width={1400} height={700} fill="#e9d8ff" opacity={flash * 0.8} />
    {flash > 0.3 && <polyline points="1300,90 1240,300 1290,300 1200,560" stroke="#fff" strokeWidth={8} fill="none" filter="url(#glow)" />}
    {/* sol + tapis violet */}
    <rect x={0} y={800} width={W} height={280} fill="#120720" />
    <ellipse cx={960} cy={1000} rx={760} ry={90} fill="#3b1466" opacity={0.8} />
    {/* tableaux de Prune */}
    <rect x={60} y={260} width={150} height={200} fill="#3a1a5c" stroke="#d4af37" strokeWidth={10} />
    <text x={135} y={385} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={110} fill="#d4af37">P</text>
    <rect x={1710} y={260} width={150} height={200} fill="#3a1a5c" stroke="#d4af37" strokeWidth={10} />
    <text x={1785} y={385} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={110} fill="#d4af37">$</text>
    <rect width={W} height={H} fill="#7a2cff" opacity={0.08 + flash * 0.25} />
    <rect width={W} height={H} fill="url(#vign)" />
  </svg>
);

/** Bureau (premier plan, cache le bas du corps de Prune). */
export const Desk: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <rect x={560} y={780} width={800} height={300} fill="#2b1508" />
    <rect x={540} y={760} width={840} height={40} rx={8} fill="#4a2610" />
    <rect x={560} y={800} width={800} height={8} fill="#1a0c04" />
    <rect x={820} y={700} width={280} height={64} rx={6} fill="#d4af37" />
    <text x={960} y={745} textAnchor="middle" fontFamily="ID" fontWeight={900} fontSize={34} fill="#2a1240">M. PRUNE · PDG</text>
    <rect x={620} y={720} width={130} height={44} fill="#f3eee0" transform="rotate(-6 685 742)" />
    <text x={685} y={748} textAnchor="middle" fontFamily="IT" fontWeight={700} fontSize={14} fill="#333" transform="rotate(-6 685 742)">DÉMOLITION</text>
    <rect x={1180} y={690} width={60} height={70} rx={8} fill="#7a2cff" />
    <rect x={1188} y={676} width={44} height={18} rx={4} fill="#5a22a0" />
  </svg>
);

/** Fond du carton titre / fin : rayons tournants. */
export const Rayons: React.FC<{t: number; c1: string; c2: string}> = ({t, c1, c2}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <Defs />
    <rect width={W} height={H} fill={c1} />
    <g transform={`translate(960 540) rotate(${t * 12})`}>
      {Array.from({length: 18}, (_, i) => (
        <polygon key={i} points="0,0 -170,-1400 170,-1400" fill={c2} transform={`rotate(${i * 20})`} opacity={0.55} />
      ))}
    </g>
    <rect width={W} height={H} fill="url(#vign)" />
  </svg>
);
