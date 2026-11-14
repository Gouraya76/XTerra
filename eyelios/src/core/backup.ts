/**
 * Sauvegardes EYELIOS (.eyelios) — fichier JSON autoportant :
 * coffre + pièces jointes ré-chiffrés avec une clé dérivée du MOT DE PASSE DE SAUVEGARDE (sel propre),
 * + somme SHA-256 permettant de vérifier l'intégrité AVANT de saisir le mot de passe.
 */
import {deriveKey,newSalt,sealJsonAsync,openJsonAsync,sealFileAsync,openFileAsync,sha256Hex,KDF_ITERATIONS,Sealed} from './crypto';
import {Payload,normalize,migrateV2} from './model';

export type BackupFile={format:'EYELIOS_BACKUP',version:3,createdAt:string,kdf:{alg:'PBKDF2-SHA256',iterations:number,salt:string},
  vault:Sealed,files:Record<string,string>,stats:{items:number,files:number},checksum:string};
const body=(b:Omit<BackupFile,'checksum'>)=>JSON.stringify([b.format,b.version,b.createdAt,b.kdf,b.vault,Object.keys(b.files).sort().map(k=>[k,b.files[k]]),b.stats]);

/** filesSealed : fichiers chiffrés avec la clé du coffre (format sealFile). */
export async function buildBackup(payload:Payload,filesSealed:Record<string,string>,vaultKey:Uint8Array,password:string,iterations=KDF_ITERATIONS):Promise<BackupFile>{
  if(password.length<10)throw new Error('Le mot de passe de sauvegarde doit contenir au moins 10 caractères.');
  const salt=newSalt();const k=await deriveKey(password,salt,iterations);const files:Record<string,string>={};
  for(const [id,s] of Object.entries(filesSealed))files[id]=await sealFileAsync(await openFileAsync(s,vaultKey),k);
  const b:Omit<BackupFile,'checksum'>={format:'EYELIOS_BACKUP',version:3,createdAt:new Date().toISOString(),kdf:{alg:'PBKDF2-SHA256',iterations,salt},
    vault:await sealJsonAsync(payload,k),files,stats:{items:payload.items.length,files:Object.keys(files).length}};
  return {...b,checksum:sha256Hex(body(b))};
}
export type Verify={ok:true,kind:'eyelios'|'jilani-v2',stats?:{items:number,files:number},createdAt?:string}|{ok:false,reason:string};
export function verifyBackup(o:any):Verify{
  if(o?.format==='JILANI_VAULT_BACKUP'&&o.version===2&&o.salt&&o.iv&&o.ciphertext)return {ok:true,kind:'jilani-v2',createdAt:o.createdAt};
  if(o?.format!=='EYELIOS_BACKUP')return {ok:false,reason:'Ce fichier n’est pas une sauvegarde EYELIOS.'};
  if(o.version!==3)return {ok:false,reason:'Version de sauvegarde non prise en charge.'};
  const {checksum,...rest}=o;if(sha256Hex(body(rest))!==checksum)return {ok:false,reason:'Intégrité compromise : le fichier a été modifié ou est incomplet.'};
  return {ok:true,kind:'eyelios',stats:o.stats,createdAt:o.createdAt};
}
/** Retourne le contenu en clair (en mémoire) ; l'appelant le ré-chiffre aussitôt avec la clé du coffre. */
export async function openBackup(o:any,password:string,emailIfLegacy='',iterations?:number):Promise<{payload:Payload,files:Record<string,string>}>{
  const v=verifyBackup(o);if(!v.ok)throw new Error(v.reason);
  try{
    if(v.kind==='jilani-v2'){const k=await deriveKey(password,o.salt,iterations??600000);const old=await openJsonAsync<any>({iv:o.iv,ciphertext:o.ciphertext},k);
      const m=migrateV2(old,emailIfLegacy);return {payload:m.payload,files:Object.fromEntries(m.files.map(f=>[f.fileId,f.base64]))};}
    const k=await deriveKey(password,o.kdf.salt,o.kdf.iterations);const payload=normalize(await openJsonAsync<any>(o.vault,k));
    const files:Record<string,string>={};for(const [id,s] of Object.entries<string>(o.files))files[id]=await openFileAsync(s,k);
    return {payload,files};
  }catch(e:any){if(/integrit|Intégrit/.test(e?.message||''))throw e;throw new Error('Mot de passe de sauvegarde incorrect.');}
}
/** Fusion : ajoute les éléments/coffres absents, garde la version la plus récente en cas de doublon. */
export function mergePayload(cur:Payload,inc:Payload):Payload{
  const vaults=[...cur.vaults];for(const v of inc.vaults)if(!vaults.some(x=>x.id===v.id))vaults.push(v);
  const byId=new Map(cur.items.map(i=>[i.id,i]));for(const i of inc.items){const c=byId.get(i.id);if(!c||i.updatedAt>c.updatedAt)byId.set(i.id,i);}
  return {...cur,vaults,items:[...byId.values()]};
}
export const backupFileName=(d=new Date())=>`EYELIOS-sauvegarde-${d.toISOString().slice(0,16).replace(/[:T]/g,'-')}.eyelios`;
