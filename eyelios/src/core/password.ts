import {randomBytes} from './crypto';
export type GenOpts={length:number,upper:boolean,lower:boolean,digits:boolean,symbols:boolean};
export const DEFAULT_GEN:GenOpts={length:20,upper:true,lower:true,digits:true,symbols:true};
const SETS={upper:'ABCDEFGHJKLMNPQRSTUVWXYZ',lower:'abcdefghijkmnopqrstuvwxyz',digits:'23456789',symbols:'!#$%&*+-=?@^_~'};
/** Tirage uniforme (rejet) pour éviter le biais modulo. */
function pick(n:number){const lim=256-(256%n);for(;;){const b=randomBytes(1)[0];if(b<lim)return b%n;}}
export function generatePassword(o:GenOpts=DEFAULT_GEN){
  const sets=(Object.keys(SETS) as (keyof typeof SETS)[]).filter(k=>o[k]).map(k=>SETS[k]);if(!sets.length)sets.push(SETS.lower);
  const len=Math.max(8,Math.min(128,o.length,));const all=sets.join('');
  const out=sets.map(s=>s[pick(s.length)]);while(out.length<len)out.push(all[pick(all.length)]);
  for(let i=out.length-1;i>0;i--){const j=pick(i+1);[out[i],out[j]]=[out[j],out[i]];}
  return out.join('');
}
/** Estimation d'entropie (bits) — indicative. */
export function strength(pw:string){let pool=0;if(/[a-z]/.test(pw))pool+=26;if(/[A-Z]/.test(pw))pool+=26;if(/\d/.test(pw))pool+=10;if(/[^a-zA-Z0-9]/.test(pw))pool+=32;
  const bits=Math.round(pw.length*Math.log2(Math.max(pool,1)));const label=bits<40?'Faible':bits<70?'Moyen':bits<100?'Fort':'Très fort';return {bits,label,score:Math.min(1,bits/110)};}
