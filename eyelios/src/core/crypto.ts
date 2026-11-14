/**
 * Cryptographie EYELIOS — pure TypeScript (aucune dépendance native), testable sous Node.
 * - Dérivation : PBKDF2-HMAC-SHA256, 600 000 itérations (recommandation OWASP 2023+ pour PBKDF2-SHA256).
 * - Chiffrement : AES-256-GCM, nonce aléatoire de 96 bits par opération (authentifie + chiffre).
 */
import {gcm} from '@noble/ciphers/aes';
import {utf8ToBytes,bytesToUtf8} from '@noble/ciphers/utils';
import {pbkdf2Async} from '@noble/hashes/pbkdf2';
import {sha256} from '@noble/hashes/sha2';
import {toByteArray,fromByteArray} from 'base64-js';

export const KDF_ITERATIONS=600000;
export type Sealed={iv:string,ciphertext:string};

let randomSource:(n:number)=>Uint8Array=(n)=>{const b=new Uint8Array(n);(globalThis as any).crypto.getRandomValues(b);return b;};
/** Sur Android on branche expo-crypto (générateur du système). */
export function setRandomSource(fn:(n:number)=>Uint8Array){randomSource=fn;}
export const randomBytes=(n:number)=>randomSource(n);
export const b64=fromByteArray,unb64=toByteArray;
export const newSalt=()=>b64(randomBytes(16));

export function deriveKey(password:string,salt:string,iterations=KDF_ITERATIONS){
  return pbkdf2Async(sha256,utf8ToBytes(password),unb64(salt),{c:iterations,dkLen:32,asyncTick:16});
}
export function sealBytes(data:Uint8Array,key:Uint8Array):Sealed{const iv=randomBytes(12);return {iv:b64(iv),ciphertext:b64(gcm(key,iv).encrypt(data))};}
export function openBytes(s:Sealed,key:Uint8Array):Uint8Array{return gcm(key,unb64(s.iv)).decrypt(unb64(s.ciphertext));}
export const sealJson=(v:unknown,key:Uint8Array)=>sealBytes(utf8ToBytes(JSON.stringify(v)),key);
export const openJson=<T,>(s:Sealed,key:Uint8Array):T=>JSON.parse(bytesToUtf8(openBytes(s,key)));
/** Format compact pour les fichiers : nonce(12) || ciphertext+tag, encodé base64. */
export function sealFile(b64data:string,key:Uint8Array){const iv=randomBytes(12);const ct=gcm(key,iv).encrypt(unb64(b64data));const out=new Uint8Array(12+ct.length);out.set(iv);out.set(ct,12);return b64(out);}
export function openFile(sealed:string,key:Uint8Array){const all=unb64(sealed);return b64(gcm(key,all.subarray(0,12)).decrypt(all.subarray(12)));}
export const sha256Hex=(s:string)=>Array.from(sha256(utf8ToBytes(s))).map(x=>x.toString(16).padStart(2,'0')).join('');
/** Enveloppe de clé : la clé de données (DEK) est chiffrée par la clé dérivée du mot de passe (KEK). */
export const newDataKey=()=>randomBytes(32);
export const wrapKey=(dek:Uint8Array,kek:Uint8Array)=>JSON.stringify(sealBytes(dek,kek));
export const unwrapKey=(wrapped:string,kek:Uint8Array)=>openBytes(JSON.parse(wrapped),kek);
