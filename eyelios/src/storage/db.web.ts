/** APERÇU NAVIGATEUR UNIQUEMENT (captures de contrôle du design) — stockage en mémoire, non utilisé sur Android. */
import {Sealed} from '../core/crypto';
export type Header={salt:string,iterations:number,wrapped:string};
const mem:{h:Header|null,s:Sealed|null,meta:Record<string,string>,files:Record<string,string>}={h:null,s:null,meta:{},files:{}};
export const FILES_DIR='',TMP_DIR='';
export const readHeader=async()=>mem.h;export const readSealed=async()=>mem.s;
export async function writeVault(h:Header,s:Sealed){mem.h=h;mem.s=s;}
export const getMeta=async(k:string)=>mem.meta[k];export async function setMeta(k:string,v:string){mem.meta[k]=v;}
export async function writeFileSealed(id:string,b:string){mem.files[id]=b;}export const readFileSealed=async(id:string)=>mem.files[id];
export async function deleteFile(id:string){delete mem.files[id];}export const listFiles=async()=>Object.keys(mem.files);
export async function purgeTemp(){}export async function writeTemp(){return '';}
export async function readUriBase64(uri:string){const r=await fetch(uri);const b=new Uint8Array(await r.arrayBuffer());let s='';for(const x of b)s+=String.fromCharCode(x);return btoa(s);}
export async function deleteUri(){}export async function wipeAll(){mem.h=null;mem.s=null;mem.meta={};mem.files={};}
export const FS:any={};
