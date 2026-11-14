/**
 * Persistance locale (Android) : SQLite pour le coffre chiffré + fichiers chiffrés dans le stockage privé de l'app.
 * Rien n'est jamais écrit en clair : la table `vault` ne contient que sel + nonce + texte chiffré.
 */
import * as SQLite from 'expo-sqlite';
import * as FS from 'expo-file-system/legacy';
import {Sealed} from '../core/crypto';

let dbP:Promise<SQLite.SQLiteDatabase>|null=null;
const db=()=>(dbP??=SQLite.openDatabaseAsync('eyelios.db').then(async d=>{
  await d.execAsync('PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS vault (id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, iterations INTEGER NOT NULL, wrapped TEXT NOT NULL, iv TEXT NOT NULL, ciphertext TEXT NOT NULL);CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);');return d;}));
export const FILES_DIR=FS.documentDirectory+'vault-files/';
export const TMP_DIR=FS.cacheDirectory+'eyelios-tmp/';

/** wrapped = clé de données (DEK, aléatoire 256 bits) chiffrée par la clé dérivée du mot de passe (KEK). */
export type Header={salt:string,iterations:number,wrapped:string};
export async function readHeader():Promise<Header|null>{return (await (await db()).getFirstAsync<Header>('SELECT salt,iterations,wrapped FROM vault WHERE id=1'))??null;}
export async function readSealed():Promise<Sealed|null>{return (await (await db()).getFirstAsync<Sealed>('SELECT iv,ciphertext FROM vault WHERE id=1'))??null;}
/** Écriture atomique (transaction SQLite) : une fermeture brutale ne laisse jamais un coffre à moitié écrit. */
export async function writeVault(h:Header,s:Sealed){const d=await db();await d.withTransactionAsync(()=>d.runAsync('INSERT OR REPLACE INTO vault(id,salt,iterations,wrapped,iv,ciphertext) VALUES(1,?,?,?,?,?)',h.salt,h.iterations,h.wrapped,s.iv,s.ciphertext).then(()=>{}));}
export async function getMeta(k:string){return (await (await db()).getFirstAsync<{v:string}>('SELECT v FROM meta WHERE k=?',k))?.v;}
export async function setMeta(k:string,v:string){await (await db()).runAsync('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)',k,v);}

async function ensure(dir:string){const i=await FS.getInfoAsync(dir);if(!i.exists)await FS.makeDirectoryAsync(dir,{intermediates:true});}
export async function writeFileSealed(fileId:string,sealedB64:string){await ensure(FILES_DIR);const tmp=FILES_DIR+fileId+'.part';
  await FS.writeAsStringAsync(tmp,sealedB64,{encoding:FS.EncodingType.UTF8});await FS.moveAsync({from:tmp,to:FILES_DIR+fileId});}
export async function readFileSealed(fileId:string){return FS.readAsStringAsync(FILES_DIR+fileId,{encoding:FS.EncodingType.UTF8});}
export async function deleteFile(fileId:string){await FS.deleteAsync(FILES_DIR+fileId,{idempotent:true});}
export async function listFiles(){await ensure(FILES_DIR);return (await FS.readDirectoryAsync(FILES_DIR)).filter(f=>!f.endsWith('.part'));}
/** Supprime les copies temporaires en clair (ouverture/partage) et les fichiers .part incomplets. */
export async function purgeTemp(){try{await FS.deleteAsync(TMP_DIR,{idempotent:true});}catch{}
  try{for(const f of await FS.readDirectoryAsync(FILES_DIR))if(f.endsWith('.part'))await FS.deleteAsync(FILES_DIR+f,{idempotent:true});}catch{}}
export async function writeTemp(name:string,b64:string){await ensure(TMP_DIR);const uri=TMP_DIR+Date.now()+'-'+name.replace(/[^\w.\-]/g,'_');
  await FS.writeAsStringAsync(uri,b64,{encoding:FS.EncodingType.Base64});return uri;}
export async function readUriBase64(uri:string){return FS.readAsStringAsync(uri,{encoding:FS.EncodingType.Base64});}
export async function deleteUri(uri:string){try{await FS.deleteAsync(uri,{idempotent:true});}catch{}}
export async function wipeAll(){const d=await db();await d.execAsync('DELETE FROM vault;DELETE FROM meta;');await FS.deleteAsync(FILES_DIR,{idempotent:true});await purgeTemp();}
export {FS};
