/** Android Keystore via expo-secure-store. */
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import {b64,unb64} from '../core/crypto';
const BIO_KEY='eyelios_bio_key_v1',BIO_FLAG='eyelios_bio_on_v1',AI_KEY='eyelios_ai_api_key_v1';
/** La biométrie protège la CLÉ DE CHIFFREMENT dérivée (jamais le mot de passe maître). Clé invalidée si une nouvelle empreinte est enrôlée. */
export async function bioAvailable(){try{return (await LocalAuthentication.hasHardwareAsync())&&(await LocalAuthentication.isEnrolledAsync());}catch{return false}}
export async function bioEnabled(){try{return (await SecureStore.getItemAsync(BIO_FLAG))==='1'}catch{return false}}
export async function enableBio(key:Uint8Array){await SecureStore.setItemAsync(BIO_KEY,b64(key),{requireAuthentication:true,authenticationPrompt:'Activer le déverrouillage biométrique d’EYELIOS'});await SecureStore.setItemAsync(BIO_FLAG,'1');}
export async function bioKey(){const v=await SecureStore.getItemAsync(BIO_KEY,{requireAuthentication:true,authenticationPrompt:'Déverrouiller EYELIOS'});return v?unb64(v):null;}
export async function disableBio(){for(const k of [BIO_KEY,BIO_FLAG])try{await SecureStore.deleteItemAsync(k)}catch{}}
/** Ré-authentification ponctuelle (ex. avant d'afficher un secret depuis l'assistant). */
export async function confirmUser(reason:string){try{const r=await LocalAuthentication.authenticateAsync({promptMessage:reason,cancelLabel:'Annuler'});return r.success;}catch{return false}}
export async function getAiKey(){try{return await SecureStore.getItemAsync(AI_KEY)}catch{return null}}
export async function setAiKey(v:string|null){if(v)await SecureStore.setItemAsync(AI_KEY,v);else try{await SecureStore.deleteItemAsync(AI_KEY)}catch{}}
