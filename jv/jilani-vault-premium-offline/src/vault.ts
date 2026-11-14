import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {gcm} from '@noble/ciphers/aes';
import {utf8ToBytes,bytesToUtf8} from '@noble/ciphers/utils';
import {pbkdf2Async} from '@noble/hashes/pbkdf2';
import {sha256} from '@noble/hashes/sha2';
import {toByteArray,fromByteArray} from 'base64-js';

// NB : TextDecoder n'est pas garanti sous Hermes → encodage UTF-8 via @noble.
export const KDF_ITERATIONS=600000;
let dbPromise:Promise<SQLite.SQLiteDatabase>|null=null;
const getDb=()=>(dbPromise??=SQLite.openDatabaseAsync('jilani-vault.db'));
// Biométrie : on stocke la CLÉ DÉRIVÉE (pas le mot de passe maître) dans l'Android Keystore,
// protégée par authentification biométrique. Le déverrouillage biométrique évite ainsi les 600 000 itérations PBKDF2.
const BIO_KEY='jilani_vault_biometric_key_v3';
const BIO_FLAG='jilani_vault_biometric_enabled_v3';
const LEGACY_BIO_KEY='jilani_vault_biometric_master_v2';
export type Field={id:string,label:string,value:string,secret:boolean};
export type Attachment={id:string,name:string,mimeType:string,size:number,base64:string};
export type VaultItem={id:string,title:string,category:string,keywords:string[],notes:string,fields:Field[],attachments:Attachment[],createdAt:number,updatedAt:number};
export type VaultPayload={items:VaultItem[]};
export type Blob={iv:string,ciphertext:string};

export async function initDb(){const db=await getDb();await db.execAsync('CREATE TABLE IF NOT EXISTS vault (id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, iv TEXT NOT NULL, ciphertext TEXT NOT NULL);');}
export async function exists(){const db=await getDb();return !!(await db.getFirstAsync('SELECT id FROM vault WHERE id=1'));}
export async function saltFromDb(){const db=await getDb();const r=await db.getFirstAsync<{salt:string}>('SELECT salt FROM vault WHERE id=1');return r?.salt;}
/** PBKDF2-SHA256, asynchrone (n'immobilise pas l'interface pendant le calcul). */
export async function derive(password:string,salt:string,iterations=KDF_ITERATIONS){return pbkdf2Async(sha256,utf8ToBytes(password),toByteArray(salt),{c:iterations,dkLen:32,asyncTick:20});}
export async function encrypt(payload:VaultPayload,key:Uint8Array):Promise<Blob>{const nonce=await Crypto.getRandomBytesAsync(12);const ct=gcm(key,nonce).encrypt(utf8ToBytes(JSON.stringify(payload)));return {iv:fromByteArray(nonce),ciphertext:fromByteArray(ct)};}
export function decrypt(blob:Blob,key:Uint8Array):VaultPayload{const result=JSON.parse(bytesToUtf8(gcm(key,toByteArray(blob.iv)).decrypt(toByteArray(blob.ciphertext))));if(!result||!Array.isArray(result.items))throw new Error('Sauvegarde invalide');
  result.items=result.items.map((x:any)=>({keywords:[],notes:'',fields:[],attachments:[],...x}));return result;}
export async function saveVault(payload:VaultPayload,key:Uint8Array,salt:string){const db=await getDb();const b=await encrypt(payload,key);await db.runAsync('INSERT OR REPLACE INTO vault(id,salt,iv,ciphertext) VALUES(1,?,?,?)',salt,b.iv,b.ciphertext);}
export async function loadVault(key:Uint8Array){const db=await getDb();const b=await db.getFirstAsync<Blob>('SELECT iv,ciphertext FROM vault WHERE id=1');if(!b)return {items:[]} as VaultPayload;return decrypt(b,key);}
export async function makeSalt(){return fromByteArray(await Crypto.getRandomBytesAsync(16));}

export async function setBiometricKey(key:Uint8Array){await SecureStore.setItemAsync(BIO_KEY,fromByteArray(key),{requireAuthentication:true,authenticationPrompt:'Autoriser le déverrouillage biométrique de JILANI VAULT'});await SecureStore.setItemAsync(BIO_FLAG,'1');}
export async function getBiometricKey(){const v=await SecureStore.getItemAsync(BIO_KEY,{requireAuthentication:true,authenticationPrompt:'Déverrouiller JILANI VAULT'});return v?toByteArray(v):null;}
export async function isBiometricEnabled(){try{return (await SecureStore.getItemAsync(BIO_FLAG))==='1'}catch{return false}}
export async function removeBiometric(){for(const k of [BIO_KEY,BIO_FLAG,LEGACY_BIO_KEY]){try{await SecureStore.deleteItemAsync(k)}catch{}}}
