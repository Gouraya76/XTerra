import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Globe, Hemicycle, USMap} from './maps';
import {
  BLUE,
  Chip,
  clamp,
  Clip,
  Counter,
  easeOut,
  GraphicBg,
  INK,
  Kicker,
  LightLeak,
  Portrait,
  RED,
  RED_D,
  sec,
  Stamp,
  Title,
  useP,
  useShake,
  useSpring,
  Vignette,
  W,
  WhiteCard,
} from './ui';

type S = {dur: number};

/* 1 — Accroche */
export const Hook: React.FC<S> = ({dur}) => (
  <AbsoluteFill>
    <Clip src="trumpA.mp4" rate={4.9 / 7.4} dur={dur} z0={1.16} z1={1.02} oy={30} tint={0.12} />
    <Vignette />
    <LightLeak opacity={0.25} />
    <Kicker y={690} at={0.15}>ÉLECTIONS DE MI-MANDAT</Kicker>
    <Title y={770} at={0.3} size={76} lines={["C'est officiel :", 'Donald Trump perd', 'le contrôle du Congrès']} outAt={dur - 0.35} />
    <Chip at={1.5} y={1180} size={42}>
      Un revers historique aux États-Unis
    </Chip>
  </AbsoluteFill>
);

/* 2 — Dépouillement : carte des 50 États */
export const Depouillement: React.FC<S> = ({dur}) => {
  const p = useP(0.3, 3.4, Easing.inOut(Easing.cubic));
  const mapIn = useSpring(0.05, {damping: 18});
  return (
    <AbsoluteFill>
      <Clip src="capW.mp4" rate={0.37} dur={dur} blur={10} dark={0.55} tint={0.35} />
      <LightLeak opacity={0.2} />
      <Kicker y={420}>DÉPOUILLEMENT EN COURS</Kicker>
      <div style={{position: 'absolute', left: 60, top: 520, opacity: mapIn, transform: `scale(${0.85 + 0.15 * mapIn})`}}>
        <USMap w={960} h={620} countP={p} />
      </div>
      <div style={{position: 'absolute', left: 70, top: 1190, color: 'white', fontFamily: 'ID', fontWeight: 900, fontSize: 210, lineHeight: 1, letterSpacing: -6}}>
        <Counter to={50} at={0.3} dur={3.4} />
        <span style={{fontSize: 90, marginLeft: 20, letterSpacing: 0}}>ÉTATS</span>
      </div>
      <div style={{position: 'absolute', left: 74, top: 1440, width: W - 148, height: 26, background: 'rgba(255,255,255,0.15)'}}>
        <div style={{width: `${p * 97}%`, height: '100%', background: RED, boxShadow: `0 0 24px ${RED}`}} />
      </div>
      <div style={{position: 'absolute', left: 74, top: 1490}}>
        <span style={{background: 'white', color: RED_D, fontFamily: 'ID', fontWeight: 900, fontSize: 40, padding: '8px 16px'}}>{Math.round(p * 97)} % DES BULLETINS</span>
      </div>
    </AbsoluteFill>
  );
};

/* 3 — Verdict : les deux chambres basculent */
const FlipCard: React.FC<{title: string; sub: string; at: number; y: number}> = ({title, sub, at, y}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inS = useSpring(at, {damping: 16});
  const flip = interpolate(f, [(at + 0.7) * fps, (at + 1.1) * fps], [0, 180], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const face = (back: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    transform: back ? 'rotateX(180deg)' : undefined,
    background: back ? BLUE : RED,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 44px',
    color: 'white',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  });
  return (
    <div style={{position: 'absolute', left: 70, top: y, width: W - 140, height: 250, perspective: 1600, transform: `translateX(${(1 - inS) * -1000}px)`}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${flip}deg)`}}>
        <div style={face(false)}>
          <div style={{fontFamily: 'ID', fontWeight: 900, fontSize: 64, lineHeight: 1}}>{title}</div>
          <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 38, opacity: 0.9, marginTop: 12}}>{sub} · RÉPUBLICAINS</div>
        </div>
        <div style={face(true)}>
          <div style={{fontFamily: 'ID', fontWeight: 900, fontSize: 64, lineHeight: 1}}>{title}</div>
          <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 38, marginTop: 12}}>{sub} · DÉMOCRATES ✓</div>
        </div>
      </div>
    </div>
  );
};

export const Verdict: React.FC<S> = ({dur}) => {
  const shake = useShake([1.2, 2.2]);
  return (
    <AbsoluteFill style={{transform: shake}}>
      <Clip src="capS.mp4" rate={0.6} dur={dur} blur={12} dark={0.6} tint={0.3} />
      <GraphicBgOverlay />
      <Kicker y={500}>LE VERDICT DES URNES</Kicker>
      <FlipCard title="LA CHAMBRE" sub="DES REPRÉSENTANTS" at={0.1} y={610} />
      <FlipCard title="LE SÉNAT" sub="CONTRÔLE" at={1.1} y={920} />
      <Stamp text="BASCULE" at={1.15} x={W - 210} y={600} size={54} rot={8} />
      <Stamp text="BASCULE" at={2.15} x={W - 210} y={910} size={54} rot={-6} />
      <WhiteCard at={2.7} y={1340} size={48}>
        Revers cinglant pour les républicains
      </WhiteCard>
    </AbsoluteFill>
  );
};

const GraphicBgOverlay: React.FC = () => (
  <AbsoluteFill style={{opacity: 0.55}}>
    <GraphicBg />
  </AbsoluteFill>
);

/* 4 — Mobilisation */
export const Mobilisation: React.FC<S> = ({dur}) => {
  const s = useSpring(0.15, {damping: 11});
  return (
    <AbsoluteFill>
      <Clip src="voter.mp4" rate={0.48} dur={dur} z0={1.2} z1={1.32} ox={65} tint={0.1} />
      <Vignette />
      <Kicker y={1050}>PARTICIPATION</Kicker>
      <div
        style={{
          position: 'absolute',
          left: 66,
          top: 1130,
          fontFamily: 'ID',
          fontWeight: 900,
          fontSize: 128,
          lineHeight: 0.95,
          color: 'white',
          letterSpacing: -4,
          transform: `scale(${0.7 + 0.3 * s})`,
          transformOrigin: 'left center',
          opacity: Math.min(1, s * 2),
          textShadow: '0 10px 40px rgba(0,0,0,0.6)',
        }}
      >
        MOBILISATION
        <br />
        <span style={{color: 'white', background: RED, padding: '0 16px'}}>RECORD</span>
      </div>
      <Chip at={1.0} y={1470}>
        Colère sur le pouvoir d'achat
      </Chip>
      <Chip at={1.5} y={1560}>
        Tensions institutionnelles
      </Chip>
    </AbsoluteFill>
  );
};

/* 5 — Approbation 38 % */
export const Approbation: React.FC<S> = () => {
  const p = useP(0.3, 1.8, Easing.out(Easing.cubic));
  const r = 360;
  const cx = W / 2,
    cy = 1080;
  const ang = Math.PI * (1 - 0.38 * p);
  return (
    <AbsoluteFill>
      <GraphicBg />
      <Kicker y={460}>SONDAGES SORTIE DES URNES</Kicker>
      <svg width={W} height={1920} style={{position: 'absolute'}}>
        <defs>
          <filter id="ag" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={56} />
        {Array.from({length: 11}, (_, i) => {
          const a = Math.PI * (1 - i / 10);
          return <line key={i} x1={cx + (r + 44) * Math.cos(a)} y1={cy - (r + 44) * Math.sin(a)} x2={cx + (r + 64) * Math.cos(a)} y2={cy - (r + 64) * Math.sin(a)} stroke="rgba(255,255,255,0.5)" strokeWidth={4} />;
        })}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(ang)} ${cy - r * Math.sin(ang)}`}
          fill="none"
          stroke={RED}
          strokeWidth={56}
          filter="url(#ag)"
        />
        <line x1={cx} y1={cy} x2={cx + (r - 70) * Math.cos(ang)} y2={cy - (r - 70) * Math.sin(ang)} stroke="white" strokeWidth={10} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={22} fill="white" />
        {/* repère des 50 % */}
        <line x1={cx} y1={cy - r - 70} x2={cx} y2={cy - r + 30} stroke="white" strokeWidth={4} strokeDasharray="8 8" />
        <text x={cx + 12} y={cy - r - 80} fill="white" fontFamily="ID" fontWeight={900} fontSize={30}>
          50 %
        </text>
      </svg>
      <div style={{position: 'absolute', width: W, top: 1110, textAlign: 'center', color: 'white', fontFamily: 'ID', fontWeight: 900, fontSize: 200, lineHeight: 1, letterSpacing: -6}}>
        <Counter to={38} at={0.3} dur={1.8} suffix="%" />
      </div>
      <WhiteCard at={1.0} y={1390} size={50}>
        approuvent l'action de Trump
      </WhiteCard>
      <Chip at={1.9} x={70} y={1490} size={36}>
        Plus bas historique pour un président à mi-mandat
      </Chip>
    </AbsoluteFill>
  );
};

/* 6 — Chambre des représentants */
export const Chambre: React.FC<S> = () => {
  const lab = useP(1.6, 0.4);
  return (
    <AbsoluteFill>
      <GraphicBg />
      <Kicker y={420}>CHAMBRE DES REPRÉSENTANTS</Kicker>
      <div style={{position: 'absolute', left: W / 2 - 499, top: 560}}>
        <Hemicycle total={435} blue={252} rows={12} rIn={200} rOut={480} dot={9.5} at={0.2} dur={1.9} majority={218} />
      </div>
      <div style={{position: 'absolute', left: W / 2 + 40, top: 520, opacity: lab}}>
        <span style={{background: 'white', color: INK, fontFamily: 'ID', fontWeight: 900, fontSize: 34, padding: '6px 14px'}}>MAJORITÉ : 218</span>
      </div>
      <div style={{position: 'absolute', width: W, top: 880, textAlign: 'center', fontFamily: 'ID', fontWeight: 900, fontSize: 170, color: BLUE, letterSpacing: -5, textShadow: '0 0 40px rgba(46,123,240,0.6)'}}>
        <Counter to={252} at={0.2} dur={1.9} />
      </div>
      <WhiteCard at={1.0} y={1150} size={46}>
        sièges démocrates au minimum
      </WhiteCard>
      <Legend at={1.5} y={1240} />
      <Chip at={2.0} x={70} y={1340} size={34}>
        Selon les projections · 435 sièges au total
      </Chip>
    </AbsoluteFill>
  );
};

const Legend: React.FC<{at: number; y: number}> = ({at, y}) => {
  const p = useP(at, 0.4);
  const dot = (c: string) => <span style={{display: 'inline-block', width: 26, height: 26, borderRadius: 13, background: c, marginRight: 12, verticalAlign: -3}} />;
  return (
    <div style={{position: 'absolute', width: W, top: y, textAlign: 'center', opacity: p, color: 'white', fontFamily: 'ID', fontWeight: 800, fontSize: 34}}>
      {dot(BLUE)}DÉMOCRATES <span style={{display: 'inline-block', width: 40}} /> {dot(RED)}RÉPUBLICAINS
    </div>
  );
};

/* 7 — Sénat */
export const Senat: React.FC<S> = () => (
  <AbsoluteFill>
    <GraphicBg />
    <Kicker y={420}>SÉNAT</Kicker>
    <div style={{position: 'absolute', left: W / 2 - 474, top: 580}}>
      <Hemicycle total={100} blue={51} rows={5} rIn={230} rOut={440} dot={17} at={0.1} dur={1.4} majority={51} />
    </div>
    <div style={{position: 'absolute', width: W, top: 880, textAlign: 'center', fontFamily: 'ID', fontWeight: 900, fontSize: 170, color: BLUE, letterSpacing: -5, textShadow: '0 0 40px rgba(46,123,240,0.6)'}}>
      <Counter to={51} at={0.1} dur={1.4} />
    </div>
    <WhiteCard at={0.7} y={1150} size={46}>
      sièges : majorité démocrate
    </WhiteCard>
    <Stamp text="+6 ÉTATS" at={1.3} x={W / 2} y={1330} size={70} rot={-4} />
    <Chip at={1.7} x={140} y={1450} size={34}>
      arrachés aux républicains
    </Chip>
  </AbsoluteFill>
);

/* 8 — Texas */
export const Texas: React.FC<S> = ({dur}) => {
  const zoom = useP(0.0, 1.0, Easing.inOut(Easing.cubic));
  const tx = useP(0.5, 0.6);
  const a = useSpring(1.0, {damping: 15});
  const b = useSpring(1.25, {damping: 15});
  const strike = useP(1.9, 0.35);
  return (
    <AbsoluteFill>
      <GraphicBg />
      <div style={{position: 'absolute', left: 60, top: 640, opacity: 0.9}}>
        <USMap w={960} h={480} countP={1} texasP={tx} zoomP={zoom} />
      </div>
      <Kicker y={380}>TEXAS · SÉNAT</Kicker>
      <Title y={430} at={0.4} size={60} bracket={false} lines={['Le bastion républicain', 'tombe']} />
      {/* duel */}
      <div style={{position: 'absolute', left: 70, top: 1140, transform: `translateY(${(1 - a) * 200}px)`, opacity: Math.min(1, a * 2)}}>
        <Portrait src="talarico.jpg" w={450} h={430} style={{border: `8px solid ${BLUE}`}} />
        <div style={{background: 'white', color: RED_D, fontFamily: 'ID', fontWeight: 900, fontSize: 40, padding: '10px 16px', marginTop: -8}}>JAMES TALARICO</div>
        <div style={{background: BLUE, color: 'white', fontFamily: 'ID', fontWeight: 900, fontSize: 32, padding: '8px 16px', display: 'inline-block'}}>ÉLU ✓</div>
      </div>
      <div style={{position: 'absolute', left: 560, top: 1170, transform: `translateY(${(1 - b) * 200}px)`, opacity: Math.min(1, b * 2)}}>
        <Portrait src="paxton.jpg" w={450} h={400} gray style={{border: '8px solid #555'}} />
        <div style={{position: 'relative', background: '#ddd', color: '#333', fontFamily: 'ID', fontWeight: 900, fontSize: 40, padding: '10px 16px', marginTop: -8}}>
          KEN PAXTON
          <div style={{position: 'absolute', left: 10, right: 10, top: '50%', height: 6, background: RED, transform: `scaleX(${strike})`, transformOrigin: 'left'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: W / 2 - 45, top: 1330, width: 90, height: 90, borderRadius: 45, background: RED, color: 'white', fontFamily: 'ID', fontWeight: 900, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: b, border: '5px solid white'}}>
        VS
      </div>
      <WhiteCard at={2.2} y={1780} size={38}>
        1er démocrate élu sénateur du Texas depuis 1988
      </WhiteCard>
    </AbsoluteFill>
  );
};

/* 9 — Maison-Blanche : 2 ans de mandat */
export const MaisonBlanche: React.FC<S> = ({dur}) => (
  <AbsoluteFill>
    <Clip src="wh.mp4" rate={1} dur={dur} z0={1.18} z1={1.3} ox={62} oy={40} tint={0.08} />
    <Vignette />
    <Kicker y={1060}>MAISON-BLANCHE</Kicker>
    <div style={{position: 'absolute', left: 66, top: 1130, fontFamily: 'ID', fontWeight: 900, color: 'white', lineHeight: 0.9, textShadow: '0 10px 40px rgba(0,0,0,0.7)'}}>
      <div style={{fontSize: 260, letterSpacing: -10}}>
        <Counter to={2} at={0.2} dur={0.6} from={4} />
        <span style={{fontSize: 120, letterSpacing: -2}}> ANS</span>
      </div>
    </div>
    <Title y={1390} at={0.5} size={58} bracket={false} lines={['de mandat', 'sous haute tension']} />
  </AbsoluteFill>
);

/* 10 — Majorité perdue */
export const Majorite: React.FC<S> = ({dur}) => {
  const shake = useShake([1.3], 22);
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flash = interpolate(f, [1.3 * fps, 1.3 * fps + 6], [0.6, 0], clamp);
  return (
    <AbsoluteFill style={{transform: shake}}>
      <Clip src="trumpB.mp4" rate={0.62} dur={dur} z0={1.06} z1={1.22} oy={35} filter="saturate(0.85)" />
      <Vignette />
      <Kicker y={1040}>ADMINISTRATION TRUMP</Kicker>
      <Title y={1100} at={0.25} size={80} bracket={false} lines={['Majorité', 'automatique']} />
      <Stamp text="PERDUE" at={1.3} x={W / 2 + 140} y={1440} size={96} rot={-7} />
      {flash > 0 && <AbsoluteFill style={{background: RED, opacity: flash, mixBlendMode: 'screen'}} />}
    </AbsoluteFill>
  );
};

/* 11 — Ce qui est bloqué */
const BlockItem: React.FC<{text: string; at: number; y: number}> = ({text, at, y}) => {
  const s = useSpring(at, {damping: 16});
  const strike = useP(at + 0.4, 0.3);
  const x = useSpring(at + 0.55, {damping: 9});
  return (
    <div style={{position: 'absolute', left: 70, top: y, width: W - 140, height: 160, transform: `translateX(${(1 - s) * -1000}px)`}}>
      <div style={{position: 'absolute', inset: 0, background: 'white', borderLeft: `18px solid ${RED}`, display: 'flex', alignItems: 'center', paddingLeft: 40, boxShadow: '0 20px 50px rgba(0,0,0,0.45)'}}>
        <span style={{position: 'relative', fontFamily: 'IT', fontWeight: 800, fontSize: 60, color: INK}}>
          {text}
          <span style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 8, background: RED, transform: `scaleX(${strike})`, transformOrigin: 'left'}} />
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 30,
          top: 20,
          width: 120,
          height: 120,
          borderRadius: 60,
          background: RED,
          transform: `scale(${x})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'ID',
          fontWeight: 900,
          fontSize: 76,
        }}
      >
        ✕
      </div>
    </div>
  );
};

export const Bloque: React.FC<S> = ({dur}) => (
  <AbsoluteFill>
    <Clip src="capS.mp4" rate={0.63} dur={dur} z0={1.05} z1={1.15} ox={30} dark={0.55} tint={0.3} />
    <LightLeak opacity={0.2} />
    <Kicker y={500}>DÉSORMAIS MENACÉ</Kicker>
    <BlockItem text="Réformes fiscales" at={0.35} y={620} />
    <BlockItem text="Budgets" at={3.55} y={820} />
    <BlockItem text="Nominations judiciaires" at={4.6} y={1020} />
  </AbsoluteFill>
);

/* 12 — Enquêtes */
export const Enquetes: React.FC<S> = ({dur}) => {
  const scan = (sec() * 0.7) % 1;
  return (
    <AbsoluteFill>
      <Clip src="capW.mp4" rate={0.4} dur={dur} blur={8} dark={0.6} tint={0.4} z0={1.3} z1={1.4} />
      <AbsoluteFill style={{opacity: 0.5}}>
        <GraphicBg />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 300 + scan * 1400, height: 4, background: RED, boxShadow: `0 0 30px 8px ${RED}`, opacity: 0.7}} />
      <Kicker y={480}>L'OPPOSITION À L'OFFENSIVE</Kicker>
      <Title y={560} at={0.2} size={100} bracket lines={['Commissions', "d'enquête"]} />
      <Chip at={0.9} y={960}>
        Enquêtes parlementaires sur 2 ans
      </Chip>
      <Chip at={2.0} y={1050}>
        Nominations du président bloquées
      </Chip>
      <Chip at={2.6} y={1140}>
        Décrets controversés dans le viseur
      </Chip>
      <Stamp text="COHABITATION EXPLOSIVE" at={3.3} x={W / 2} y={1400} size={58} rot={-4} />
    </AbsoluteFill>
  );
};

/* 13 — Hakeem Jeffries */
export const Jeffries: React.FC<S> = ({dur}) => {
  const s = useSpring(0.1, {damping: 15});
  const ring = useP(0.2, 0.9);
  const z = 1 + 0.06 * (sec() / dur);
  return (
    <AbsoluteFill>
      <GraphicBg />
      <Kicker y={420}>EN JANVIER 2027</Kicker>
      <div style={{position: 'absolute', left: W / 2 - 300, top: 520, width: 600, height: 600, transform: `scale(${0.8 + 0.2 * s})`, opacity: Math.min(1, s * 2)}}>
        <svg width={600} height={600} style={{position: 'absolute'}}>
          <circle cx={300} cy={300} r={290} fill="none" stroke={RED} strokeWidth={12} strokeDasharray={2 * Math.PI * 290} strokeDashoffset={(1 - ring) * 2 * Math.PI * 290} transform="rotate(-90 300 300)" />
        </svg>
        <div style={{position: 'absolute', left: 25, top: 25, width: 550, height: 550, borderRadius: '50%', overflow: 'hidden', transform: `scale(${z})`}}>
          <Portrait src="jeffries.jpg" w={550} h={550} />
        </div>
      </div>
      <Title y={1110} at={0.5} size={66} bracket={false} lines={['Hakeem Jeffries']} />
      <Chip at={0.9} y={1260} size={42}>
        futur président de la Chambre
      </Chip>
      <WhiteCard at={1.5} y={1480} size={40}>
        1er président noir de l'histoire de la Chambre
      </WhiteCard>
    </AbsoluteFill>
  );
};

/* 14 — Réaction Truth Social */
const Post: React.FC<{head: string; lines: string[]; at: number; y: number; rot: number}> = ({head, lines, at, y, rot}) => {
  const s = useSpring(at, {damping: 13});
  const typed = useP(at + 0.2, 1.1, Easing.linear);
  const full = lines.join('\n');
  const shown = full.slice(0, Math.round(full.length * typed));
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        top: y,
        width: W - 140,
        background: '#FAF7F2',
        transform: `translateY(${(1 - s) * 200}px) rotate(${rot}deg) scale(${0.85 + 0.15 * s})`,
        opacity: Math.min(1, s * 2),
        boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        borderTop: `14px solid ${RED}`,
        padding: '30px 40px 36px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{width: 70, height: 70, borderRadius: 35, background: RED_D, color: 'white', fontFamily: 'ID', fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>DT</div>
        <div>
          <div style={{fontFamily: 'ID', fontWeight: 900, fontSize: 34, color: INK}}>DONALD TRUMP · TRUTH SOCIAL</div>
          <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 26, color: RED}}>{head}</div>
        </div>
      </div>
      <div style={{height: 2, background: '#d8cccc', margin: '22px 0'}} />
      <div style={{fontFamily: 'IT', fontWeight: 700, fontStyle: 'italic', fontSize: 46, color: INK, whiteSpace: 'pre-wrap', minHeight: lines.length * 60, lineHeight: 1.3}}>
        {shown}
        <span style={{opacity: typed < 1 ? 1 : 0, color: RED}}>|</span>
      </div>
    </div>
  );
};

export const Truth: React.FC<S> = ({dur}) => (
  <AbsoluteFill>
    <Clip src="trumpA.mp4" rate={0.6} dur={dur} z0={1.3} z1={1.4} oy={30} blur={10} dark={0.55} tint={0.25} />
    <Kicker y={420}>LA RÉACTION DE TRUMP</Kicker>
    <Post head="Mardi 3 novembre" lines={["« Je n'étais pas sur le bulletin,", "et si je l'avais été, nous", 'aurions gagné haut la main ! »']} at={0.1} y={520} rot={-1.5} />
    <Post head="Quelques heures plus tard" lines={['Il félicite les démocrates :', '« hâte de travailler avec eux', 'pour le bien du pays »']} at={1.9} y={1060} rot={1.2} />
  </AbsoluteFill>
);

/* 15 — Wall Street */
export const WallStreet: React.FC<S> = ({dur}) => {
  const p = useP(0.4, 2.6, Easing.inOut(Easing.cubic));
  const n = 70;
  const pts: [number, number][] = [];
  let v = 0.28;
  for (let i = 0; i < n; i++) {
    const r = Math.sin(i * 12.9898) * 43758.5453;
    const rnd = r - Math.floor(r);
    v += i < 25 ? (rnd - 0.48) * 0.05 : i < 58 ? rnd * 0.045 : (rnd - 0.6) * 0.03;
    pts.push([90 + ((W - 180) * i) / (n - 1), 760 + 520 * Math.min(0.95, Math.max(0.05, v))]);
  }
  const m = Math.max(2, Math.round(n * p));
  const vis = pts.slice(0, m);
  const d = 'M ' + vis.map((q) => q.join(' ')).join(' L ');
  const area = d + ` L ${vis[m - 1][0]} 1300 L 90 1300 Z`;
  const val = -2 * Math.min(1, Math.max(0, (m - 25) / (n - 25)));
  const tape = (sec() * 160) % 1200;
  return (
    <AbsoluteFill>
      <GraphicBg />
      <Kicker y={420}>WALL STREET</Kicker>
      <Title y={470} at={0.15} size={70} bracket={false} lines={['Les marchés', 'décrochent']} />
      <svg width={W} height={1920} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={RED} stopOpacity={0.55} />
            <stop offset="100%" stopColor={RED} stopOpacity={0} />
          </linearGradient>
          <filter id="lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} x1={90} x2={W - 90} y1={760 + k * 135} y2={760 + k * 135} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        ))}
        <path d={area} fill="url(#ar)" />
        <path d={d} fill="none" stroke={RED} strokeWidth={9} strokeLinejoin="round" filter="url(#lg)" />
        <circle cx={vis[m - 1][0]} cy={vis[m - 1][1]} r={16} fill="white" />
        <circle cx={vis[m - 1][0]} cy={vis[m - 1][1]} r={9} fill={RED} />
      </svg>
      <div style={{position: 'absolute', width: W, top: 1330, textAlign: 'center', fontFamily: 'ID', fontWeight: 900, fontSize: 180, color: val < 0 ? RED : 'white', letterSpacing: -5, textShadow: `0 0 50px rgba(214,16,32,0.6)`}}>
        {val < -0.005 ? '▼ ' : ''}
        {val.toFixed(1).replace('.', ',')} %
      </div>
      <WhiteCard at={2.8} y={1610} size={44}>
        Contrats à terme : jusqu'à -2 %
      </WhiteCard>
      {/* bandeau défilant */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1730, height: 70, background: RED_D, overflow: 'hidden', display: 'flex', alignItems: 'center'}}>
        <div style={{whiteSpace: 'nowrap', transform: `translateX(${-tape}px)`, color: 'white', fontFamily: 'ID', fontWeight: 900, fontSize: 34}}>
          {'CONTRATS À TERME ▼   MIDTERMS 2026   WALL STREET ▼   JUSQU’À -2 %   '.repeat(6)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* 16 — Onde de choc mondiale */
export const Monde: React.FC<S> = ({dur}) => {
  const rot = useP(0.2, 2.6, Easing.inOut(Easing.cubic));
  const arc = useP(2.4, 1.4, Easing.inOut(Easing.quad));
  const s = useSpring(0.05, {damping: 18});
  return (
    <AbsoluteFill>
      <GraphicBg />
      <Kicker y={400}>ONDE DE CHOC MONDIALE</Kicker>
      <Title y={460} at={0.3} size={80} bracket={false} lines={['Un séisme', 'politique']} />
      <div style={{position: 'absolute', left: W / 2 - 400, top: 760, transform: `scale(${0.7 + 0.3 * s})`, opacity: s}}>
        <Globe size={800} rotP={rot} arcP={arc} />
      </div>
      <Chip at={2.9} y={1480} size={38}>
        Relations commerciales internationales
      </Chip>
      <Chip at={3.7} y={1570} size={38}>
        Équilibres géopolitiques en Europe
      </Chip>
    </AbsoluteFill>
  );
};

/* 17 — Question */
export const Question: React.FC<S> = ({dur}) => {
  const b = useSpring(1.6, {damping: 10});
  return (
    <AbsoluteFill>
      <Clip src="trumpA.mp4" rate={0.85} dur={dur} z0={1.05} z1={1.25} oy={30} tint={0.12} />
      <Vignette />
      <LightLeak opacity={0.25} />
      <Title y={800} at={0.2} size={78} lines={['Donald Trump peut-il', 'encore gouverner ?']} />
      <div style={{position: 'absolute', left: 74, top: 1150, transform: `scale(${b})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 18}}>
        <svg width={86} height={80} viewBox="0 0 86 80">
          <path d="M8 6 H78 a6 6 0 0 1 6 6 V52 a6 6 0 0 1 -6 6 H34 L16 76 V58 H8 a6 6 0 0 1 -6 -6 V12 a6 6 0 0 1 6 -6 Z" fill={RED} stroke="white" strokeWidth={4} />
          <circle cx={26} cy={32} r={5} fill="white" />
          <circle cx={43} cy={32} r={5} fill="white" />
          <circle cx={60} cy={32} r={5} fill="white" />
        </svg>
        <span style={{background: 'rgba(10,6,8,0.75)', color: 'white', fontFamily: 'IT', fontWeight: 700, fontSize: 42, padding: '12px 22px'}}>Donne ton avis en commentaire</span>
      </div>
    </AbsoluteFill>
  );
};

/* 18 — Fin / abonnement */
export const CTA: React.FC<S> = ({dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lg = useSpring(0.05, {damping: 11});
  const btn = useSpring(0.9, {damping: 12});
  const click = interpolate(f, [2.0 * fps, 2.1 * fps, 2.25 * fps], [1, 0.9, 1], clamp);
  const subscribed = f > 2.1 * fps;
  const cursor = useP(1.3, 0.7);
  const fade = interpolate(f, [(dur - 0.45) * fps, dur * fps], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <GraphicBg />
      <LightLeak opacity={0.3} />
      <div style={{position: 'absolute', width: W, top: 640, display: 'flex', justifyContent: 'center', transform: `scale(${lg})`}}>
        <BigLogo />
      </div>
      <WhiteCard at={0.5} y={900} size={48}>
        Donne ton avis en commentaire
      </WhiteCard>
      <div style={{position: 'absolute', width: W, top: 1000, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontFamily: 'IT', fontWeight: 700, fontSize: 38, opacity: useP(0.7, 0.4)}}>
        L'actu qui compte, chaque jour
      </div>
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: 1220,
          transform: `translate(-50%,-50%) scale(${btn * click})`,
          background: subscribed ? '#2a2a2e' : RED,
          color: 'white',
          fontFamily: 'ID',
          fontWeight: 900,
          fontSize: 66,
          padding: '26px 56px',
          borderRadius: 14,
          boxShadow: subscribed ? 'none' : `0 0 50px rgba(214,16,32,0.7)`,
          whiteSpace: 'nowrap',
        }}
      >
        {subscribed ? 'ABONNÉ ✓' : 'ABONNE-TOI'}
      </div>
      <svg width={70} height={90} viewBox="0 0 24 30" style={{position: 'absolute', left: interpolate(cursor, [0, 1], [900, W / 2 + 120]), top: interpolate(cursor, [0, 1], [1700, 1235]), opacity: cursor > 0 ? 1 : 0}}>
        <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 16 L20 16 Z" fill="white" stroke="black" strokeWidth={1.5} />
      </svg>
      <AbsoluteFill style={{background: 'black', opacity: fade}} />
    </AbsoluteFill>
  );
};

import {Logo} from './ui';
const BigLogo: React.FC = () => <Logo h={150} shineAt={[0.6]} />;
