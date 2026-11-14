/**
 * Assistant EYELIOS — interprétation LOCALE des demandes liées au coffre (aucun réseau).
 * Les questions générales sont routées vers le fournisseur d'IA configuré (sans données du coffre).
 */
import {Item,ItemType,Vault,TYPES} from './model';
import {fold,search} from './search';

export type Intent=
 |{kind:'find',query:string,type?:ItemType}
 |{kind:'list',type:ItemType}
 |{kind:'create',type:ItemType,title:string}
 |{kind:'move',query:string,vaultName:string}
 |{kind:'delete',query:string}
 |{kind:'generate',length:number}
 |{kind:'lock'}|{kind:'help'}|{kind:'vaults'}
 |{kind:'general',text:string};

const TYPE_WORDS:[RegExp,ItemType][]=[
 [/\bcl(e|é)s?\s*(d['’])?api\b|\bapi\b|\btoken\b/,'api'],[/\bmots?\s*de\s*passe\b|\bidentifiants?\b|\bcomptes?\b|\bmdp\b/,'password'],
 [/\bcartes?\b|\bcb\b|\bpaiements?\b|\bbancaires?\b/,'card'],[/\bphotos?\b|\bimages?\b/,'photo'],
 [/\bdocuments?\b|\bpdf\b|\bfichiers?\b|\bfactures?\b|\bcontrats?\b/,'document'],[/\bnotes?\b/,'note']];
export function detectType(s:string):ItemType|undefined{const f=fold(s);for(const [r,t] of TYPE_WORDS)if(r.test(f))return t;return undefined;}
const STOP=/\b(eyelios|stp|s'il te pla[iî]t|svp|mon|ma|mes|le|la|les|l|du|des|de|d|un|une|pour|moi|me|m|mon compte|compte|retrouve|retrouver|trouve|trouver|cherche|chercher|recherche|donne|montre|affiche|ou|où|est|sont|quel|quelle|quels|quelles|est-ce|que|qui|mot|mots|passe|cle|cles|clé|clés|api|carte|cartes|document|documents|photo|photos|note|notes|fiche|fichier|identifiant|identifiants|enregistre|enregistree|enregistrée|a|à|moi|ce|cette|ces|dans|coffre)\b/gi;
export const cleanQuery=(s:string)=>fold(s).replace(/['’,.?!:;«»"-]/g,' ').replace(STOP,' ').replace(/\s+/g,' ').trim();

export function parseIntent(input:string):Intent{
  const raw=input.trim();const f=fold(raw).replace(/^(eyelios|assistant)[ ,:]+/,'');
  if(/^(aide|help|que (peux|sais)[- ]tu faire|tu (peux|sais) faire quoi)/.test(f))return {kind:'help'};
  if(/\bverrouill/.test(f)&&f.length<40)return {kind:'lock'};
  if(/\b(genere|generer|cree|creer|invente|propose)\b.*\bmot de passe\b/.test(f)&&!/\b(fiche|pour (mon|ma|le|la))\b/.test(f)){
    const n=f.match(/(\d{1,3})\s*(caracteres|car|lettres)?/);return {kind:'generate',length:n?Math.min(128,Math.max(8,+n[1])):20};}
  if(/^(montre|affiche|liste)\b.*\bcoffres\b|^(quels sont )?mes coffres/.test(f))return {kind:'vaults'};
  let m=f.match(/^(?:classe|deplace|range|mets?|met)\s+(.+?)\s+dans\s+(?:le\s+|mon\s+)?(?:coffre\s+)?(.+)$/);
  if(m)return {kind:'move',query:cleanQuery(m[1]),vaultName:m[2].replace(/[.?!]/g,'').trim()};
  m=f.match(/^(?:supprime|efface|retire)\s+(.+)$/);if(m)return {kind:'delete',query:cleanQuery(m[1])};
  m=f.match(/^(?:cree|creer|ajoute|ajouter|nouvelle?|enregistre)\b(.*)$/);
  if(m){const rest=m[1];const t=detectType(rest)||'password';
    const tm=rest.match(/(?:pour|:|nommee?|appelee?|intitulee?)\s+(?:mon |ma |mes |le |la )?(?:compte |carte |cle api |note )?(.+)$/);
    const title=(tm?tm[1]:cleanQuery(rest)).replace(/[.?!]+$/,'').trim();
    return {kind:'create',type:t,title:title?title.replace(/^./,c=>c.toUpperCase()):''};}
  const listM=/^(montre|affiche|liste|donne)(-moi)?\b|^(quelles?|quels?) sont mes\b|^mes\b/.test(f);
  const type=detectType(f);const q=cleanQuery(f);
  if(listM&&type&&!q)return {kind:'list',type};
  if(/^(retrouve|trouve|cherche|recherche|ou est|ou sont|ou se trouve|donne|montre|affiche|quel est|c'est quoi)\b/.test(f)||(type&&q&&q.split(' ').length<=3))
    return q?{kind:'find',query:q,type}:(type?{kind:'list',type}:{kind:'general',text:raw});
  return {kind:'general',text:raw};
}
export function resolveVault(vaults:Vault[],name:string){const n=fold(name);return vaults.find(v=>fold(v.name)===n)||vaults.find(v=>fold(v.name).startsWith(n)||n.startsWith(fold(v.name)));}
export function findItems(items:Item[],vaults:Vault[],query:string,type?:ItemType){let h=search(items,vaults,query).map(x=>x.item);if(type){const t=h.filter(i=>i.type===type);if(t.length)h=t;}return h;}
export const HELP_TEXT=`Je peux, sur ton téléphone et sans internet :
• retrouver un élément — « retrouve mon mot de passe Netflix »
• lister une catégorie — « montre-moi mes clés API »
• créer une fiche — « crée une fiche pour mon compte Google »
• classer — « classe Assurance dans Administratif »
• supprimer (après confirmation) — « supprime Ancien compte »
• générer un mot de passe — « génère un mot de passe de 24 caractères »
• verrouiller le coffre — « verrouille »
Avec un fournisseur d'IA configuré (Paramètres) et internet, je réponds aussi aux questions générales, rédige, reformule et résume les textes que tu me donnes. Les données de ton coffre ne lui sont jamais envoyées.`;
export const typesList=TYPES;
