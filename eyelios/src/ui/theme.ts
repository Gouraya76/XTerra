/** Palette officielle EYELIOS — aucune autre couleur décorative. */
export const P={black:'#121212',charcoal:'#1F2937',slate:'#334155',steel:'#64748B',ice:'#F1F5F9'};
/** Lueurs bleu électrique (reflets, contours actifs, vagues lumineuses) — reprises de la maquette et du visuel de démarrage. */
export const B={electric:'#3B9BFF',deep:'#1D4ED8',light:'#8CCBFF'};
const a=(hex:string,o:number)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${o})`;};
export const T={
  ...P,...B,a,
  edge:a(B.light,0.38),edgeSoft:a(B.light,0.2),glowShadow:`0px 0px 22px ${a(B.electric,0.28)}`,glowStrong:`0px 0px 26px ${a(B.electric,0.55)}`,
  text:P.ice,textDim:a(P.ice,0.72),textMute:a(P.ice,0.5),
  glassTop:a(P.ice,0.13),glassBottom:a(P.ice,0.035),glassBorder:a(P.ice,0.2),glassBorderStrong:a(P.ice,0.42),
  sheen:a(P.ice,0.55),glow:a(P.ice,0.28),
  bg:[P.slate,P.charcoal,P.black] as const,
  r:{sm:12,md:18,lg:24,xl:30},
  gutter:16,
};
export const font={
  h1:{fontSize:26,fontWeight:'700' as const,color:P.ice,letterSpacing:0.2},
  h2:{fontSize:19,fontWeight:'700' as const,color:P.ice},
  h3:{fontSize:16,fontWeight:'600' as const,color:P.ice},
  body:{fontSize:14.5,color:a(P.ice,0.86),lineHeight:21},
  small:{fontSize:12.5,color:a(P.ice,0.62)},
  micro:{fontSize:10.5,color:a(P.ice,0.6),letterSpacing:0.3},
};
