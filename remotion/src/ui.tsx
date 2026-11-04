import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const RED = '#D61020';
export const RED_D = '#96060F';
export const RED_DD = '#3C040A';
export const INK = '#120C0E';
export const BLUE = '#2E7BF0';
export const W = 1080;
export const H = 1920;

export const fontFaces = `
@font-face{font-family:'ID';font-weight:900;src:url(${staticFile('fonts/InterDisplay-Black.otf')});}
@font-face{font-family:'ID';font-weight:800;src:url(${staticFile('fonts/InterDisplay-ExtraBold.otf')});}
@font-face{font-family:'ID';font-weight:900;font-style:italic;src:url(${staticFile('fonts/InterDisplay-BlackItalic.otf')});}
@font-face{font-family:'IT';font-weight:800;src:url(${staticFile('fonts/Inter-ExtraBold.otf')});}
@font-face{font-family:'IT';font-weight:700;src:url(${staticFile('fonts/Inter-Bold.otf')});}
@font-face{font-family:'IT';font-weight:600;src:url(${staticFile('fonts/Inter-SemiBold.otf')});}
@font-face{font-family:'IT';font-weight:700;font-style:italic;src:url(${staticFile('fonts/Inter-BoldItalic.otf')});}
`;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** progression 0→1 entre deux secondes locales (easing expo-out) */
export const useP = (startSec: number, durSec: number, ease = easeOut) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return interpolate(f, [startSec * fps, (startSec + durSec) * fps], [0, 1], {...clamp, easing: ease});
};

export const useSpring = (startSec: number, cfg: {damping?: number; mass?: number; stiffness?: number} = {}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - startSec * fps, fps, config: {damping: 14, mass: 0.8, stiffness: 140, ...cfg}});
};

export const sec = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

/* ------------------------------------------------------------------ fonds */
export const Clip: React.FC<{
  src: string;
  rate?: number;
  z0?: number;
  z1?: number;
  ox?: number;
  oy?: number;
  dur: number;
  filter?: string;
  tint?: number;
  dark?: number;
  blur?: number;
}> = ({src, rate = 1, z0 = 1.04, z1 = 1.14, ox = 50, oy = 50, dur, filter = '', tint = 0, dark = 0, blur = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const z = interpolate(f, [0, dur * fps], [z0, z1], clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${ox}% ${oy}%`}}>
        <OffthreadVideo
          src={staticFile('clips/' + src)}
          playbackRate={rate}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `contrast(1.08) saturate(1.06) ${blur ? `blur(${blur}px)` : ''} ${filter}`,
          }}
        />
      </AbsoluteFill>
      {tint > 0 && <AbsoluteFill style={{background: RED_D, mixBlendMode: 'multiply', opacity: tint}} />}
      {dark > 0 && <AbsoluteFill style={{background: '#080406', opacity: dark}} />}
    </AbsoluteFill>
  );
};

export const GraphicBg: React.FC<{hue?: number}> = () => {
  const t = sec();
  return (
    <AbsoluteFill style={{background: '#0A0608', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 45% at ${50 + 12 * Math.sin(t * 0.6)}% ${48 + 6 * Math.cos(t * 0.5)}%, rgba(170,8,24,0.85), rgba(60,4,10,0.6) 45%, rgba(10,6,8,0) 80%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,60,70,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,60,70,0.07) 2px, transparent 2px)',
          backgroundSize: '60px 60px',
          backgroundPosition: `0 ${(t * 20) % 60}px`,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)',
        }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 30} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** lueurs rouges qui dérivent (light leaks) */
export const LightLeak: React.FC<{opacity?: number}> = ({opacity = 0.35}) => {
  const t = sec();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity}}>
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          left: -350 + 120 * Math.sin(t * 0.7),
          top: 200 + 200 * Math.cos(t * 0.4),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,40,40,0.8), rgba(255,0,0,0) 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          right: -300 + 100 * Math.cos(t * 0.5),
          bottom: 100 + 150 * Math.sin(t * 0.6),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,120,60,0.6), rgba(255,0,0,0) 65%)',
          filter: 'blur(50px)',
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ habillage TERA24 */
export const Logo: React.FC<{h?: number; shineAt?: number[]}> = ({h = 64, shineAt = []}) => {
  const t = sec();
  let shine = -1;
  for (const s of shineAt) if (t >= s && t < s + 0.8) shine = (t - s) / 0.8;
  const fs = h * 0.78;
  return (
    <div style={{display: 'inline-flex', position: 'relative', height: h, alignItems: 'center'}}>
      <div
        style={{
          position: 'relative',
          height: h,
          padding: `0 ${h * 0.45}px 0 ${h * 0.5}px`,
          display: 'flex',
          alignItems: 'center',
          gap: h * 0.14,
          background: 'linear-gradient(180deg,#F43040 0%, #C00818 55%, #82000C 100%)',
          clipPath: `polygon(${h * 0.28}px 0, 100% 0, calc(100% - ${h * 0.28}px) 100%, 0 100%)`,
          boxShadow: 'inset 0 2px 0 rgba(255,170,170,0.8)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: 'ID',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: fs,
            color: 'white',
            letterSpacing: -1,
            textShadow: '0 2px 0 rgba(0,0,0,0.35)',
            lineHeight: 1,
          }}
        >
          TERA
        </span>
        <span
          style={{
            fontFamily: 'ID',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: fs,
            color: RED_D,
            background: 'linear-gradient(180deg,#fff,#e6e6e6)',
            padding: `0 ${h * 0.12}px`,
            lineHeight: 1.05,
            transform: 'skewX(-12deg)',
          }}
        >
          24
        </span>
        {shine >= 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: h * 0.9,
              left: `${-30 + shine * 160}%`,
              background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.75), transparent)',
            }}
          />
        )}
      </div>
    </div>
  );
};

export const DateTag: React.FC = () => {
  const a = useP(0.05, 0.5);
  const b = useP(0.2, 0.5);
  return (
    <div style={{position: 'absolute', left: 52, top: 158}}>
      <div style={{overflow: 'hidden', clipPath: `inset(0 ${100 - a * 100}% 0 0)`}}>
        <div style={{background: RED_D, color: 'white', fontFamily: 'ID', fontWeight: 900, fontSize: 31, padding: '6px 16px', display: 'inline-block'}}>
          ÉTATS-UNIS
        </div>
      </div>
      <div style={{marginLeft: 16, clipPath: `inset(0 ${100 - b * 100}% 0 0)`}}>
        <div style={{background: 'white', color: RED_D, fontFamily: 'ID', fontWeight: 900, fontSize: 33, padding: '7px 20px', display: 'inline-block'}}>
          4 NOVEMBRE 2026
        </div>
      </div>
    </div>
  );
};

/** pavé rouge (kicker) révélé en balayage */
export const Kicker: React.FC<{children: React.ReactNode; at?: number; x?: number; y: number; size?: number; color?: string; bg?: string}> = ({
  children,
  at = 0.05,
  x = 70,
  y,
  size = 36,
  color = 'white',
  bg = RED,
}) => {
  const p = useP(at, 0.45);
  return (
    <div style={{position: 'absolute', left: x, top: y, clipPath: `inset(0 ${100 - p * 100}% 0 0)`}}>
      <div style={{background: bg, color, fontFamily: 'ID', fontWeight: 900, fontSize: size, padding: '9px 18px', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{width: 12, height: 12, borderRadius: 6, background: 'white', opacity: 0.5 + 0.5 * Math.sin(sec() * 8)}} />
        {children}
      </div>
    </div>
  );
};

/** Titre signature TERA24 : lignes sur pavés blancs, texte rouge, cadre rouge derrière */
export const Title: React.FC<{lines: string[]; at?: number; x?: number; y: number; size?: number; bracket?: boolean; outAt?: number}> = ({
  lines,
  at = 0.2,
  x = 40,
  y,
  size = 74,
  bracket = true,
  outAt,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lineH = size * 1.32 + 12;
  const totalH = lines.length * lineH + 56;
  const br = interpolate(f, [at * fps, (at + 0.5) * fps], [0, 1], {...clamp, easing: easeOut});
  const out = outAt ? interpolate(f, [outAt * fps, (outAt + 0.3) * fps], [0, 1], clamp) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: 1 - out, transform: `translateX(${-out * 80}px)`}}>
      {bracket && (
        <svg width={140} height={totalH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <rect
            x={4.5}
            y={4.5}
            width={122}
            height={totalH - 9}
            fill="none"
            stroke={RED}
            strokeWidth={9}
            strokeDasharray={2 * (122 + totalH)}
            strokeDashoffset={(1 - br) * 2 * (122 + totalH)}
          />
        </svg>
      )}
      <div style={{position: 'relative', paddingTop: 28, paddingLeft: 34}}>
        {lines.map((l, i) => {
          const p = interpolate(f, [(at + 0.12 * i) * fps, (at + 0.12 * i + 0.5) * fps], [0, 1], {...clamp, easing: easeOut});
          const tp = interpolate(f, [(at + 0.12 * i + 0.12) * fps, (at + 0.12 * i + 0.6) * fps], [0, 1], {...clamp, easing: easeOut});
          return (
            <div key={i} style={{marginBottom: 12, marginLeft: i === 0 ? 0 : 8, clipPath: `inset(0 ${100 - p * 100}% 0 0)`}}>
              <div
                style={{
                  display: 'inline-block',
                  background: 'white',
                  color: RED_D,
                  fontFamily: 'IT',
                  fontWeight: 800,
                  fontSize: size,
                  lineHeight: 1.18,
                  padding: `${size * 0.07}px ${size * 0.36}px`,
                  letterSpacing: -0.5,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                }}
              >
                <span style={{display: 'inline-block', transform: `translateY(${(1 - tp) * 40}px)`, opacity: tp}}>{l}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** puce/ligne d'info qui glisse vers le haut */
export const Chip: React.FC<{children: React.ReactNode; at: number; x?: number; y: number; size?: number; dark?: boolean}> = ({
  children,
  at,
  x = 70,
  y,
  size = 40,
  dark = true,
}) => {
  const s = useSpring(at, {damping: 16});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: Math.min(1, s * 1.5),
        transform: `translateY(${(1 - s) * 50}px)`,
        background: dark ? 'rgba(10,6,8,0.72)' : 'white',
        color: dark ? 'white' : RED_D,
        fontFamily: 'IT',
        fontWeight: 700,
        fontSize: size,
        padding: '14px 24px 14px 20px',
        borderLeft: `8px solid ${RED}`,
        backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </div>
  );
};

export const WhiteCard: React.FC<{children: React.ReactNode; at: number; cx?: number; y: number; size?: number}> = ({children, at, cx = W / 2, y, size = 46}) => {
  const s = useSpring(at, {damping: 12});
  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: y,
        transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * s})`,
        opacity: Math.min(1, s * 2),
        background: 'white',
        color: RED_D,
        fontFamily: 'IT',
        fontWeight: 800,
        fontSize: size,
        padding: '16px 28px',
        whiteSpace: 'nowrap',
        boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
      }}
    >
      {children}
    </div>
  );
};

/** tampon (impact) avec léger rebond */
export const Stamp: React.FC<{text: string; at: number; x: number; y: number; size?: number; rot?: number}> = ({text, at, x, y, size = 80, rot = -8}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lf = f - at * fps;
  if (lf < 0) return null;
  const s = interpolate(lf, [0, 5, 9], [2.6, 0.92, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const o = interpolate(lf, [0, 3], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,
        opacity: o,
        border: `${size * 0.09}px solid white`,
        background: RED,
        color: 'white',
        fontFamily: 'ID',
        fontWeight: 900,
        fontSize: size,
        padding: `${size * 0.12}px ${size * 0.4}px`,
        letterSpacing: 2,
        boxShadow: '0 0 0 6px rgba(214,16,32,0.35), 0 20px 50px rgba(0,0,0,0.5)',
      }}
    >
      {text}
    </div>
  );
};

/** secousse caméra après un impact */
export const useShake = (times: number[], amp = 14) => {
  const t = sec();
  let dx = 0,
    dy = 0;
  for (const s of times) {
    const d = t - s;
    if (d >= 0 && d < 0.35) {
      const k = (1 - d / 0.35) ** 2;
      dx += (random('x' + Math.round(t * 30)) - 0.5) * 2 * amp * k;
      dy += (random('y' + Math.round(t * 30)) - 0.5) * 2 * amp * k;
    }
  }
  return `translate(${dx}px, ${dy}px)`;
};

export const Counter: React.FC<{to: number; at: number; dur: number; suffix?: string; decimals?: number; style?: React.CSSProperties; from?: number}> = ({
  to,
  at,
  dur,
  suffix = '',
  decimals = 0,
  style,
  from = 0,
}) => {
  const p = useP(at, dur, Easing.out(Easing.cubic));
  const v = from + (to - from) * p;
  return <span style={style}>{v.toFixed(decimals).replace('.', ',') + suffix}</span>;
};

/** portrait traité en duotone rouge + trame */
export const Portrait: React.FC<{src: string; w: number; h: number; gray?: boolean; style?: React.CSSProperties}> = ({src, w, h, gray, style}) => (
  <div style={{position: 'relative', width: w, height: h, overflow: 'hidden', ...style}}>
    <img
      src={staticFile('img/' + src)}
      style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%', filter: `grayscale(1) contrast(1.25) brightness(${gray ? 0.6 : 1.05})`}}
    />
    <AbsoluteFill style={{background: gray ? '#2a2a30' : RED, mixBlendMode: 'multiply', opacity: gray ? 0.5 : 0.85}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.0) 50%, rgba(10,0,4,0.55))'}} />
    <AbsoluteFill
      style={{
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.35) 1.2px, transparent 1.6px)',
        backgroundSize: '6px 6px',
        mixBlendMode: 'multiply',
      }}
    />
  </div>
);
