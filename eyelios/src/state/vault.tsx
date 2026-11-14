/**
 * Session EYELIOS : déverrouillage, persistance chiffrée, verrouillage automatique, presse-papiers,
 * pièces jointes chiffrées, sauvegardes. Seule couche qui manipule la clé de données en mémoire.
 */
import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import * as ExpoCrypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import * as ScreenCapture from 'expo-screen-capture';
import * as Haptics from 'expo-haptics';
import * as C from '../core/crypto';
import * as M from '../core/model';
import {buildBackup,openBackup,verifyBackup,mergePayload,backupFileName,Verify} from '../core/backup';
import * as DB from '../storage/db';
import * as S from '../storage/secure';

C.setRandomSource(n=>ExpoCrypto.getRandomBytes(n));
import NativeCrypto from '../../modules/eyelios-crypto';
const NC=NativeCrypto;if(NC){C.setNativeKdf((p,s,i,l)=>NC.pbkdf2Sha256(p,s,i,l));C.setNativeAes({seal:(k,d)=>NC.aesGcmSeal(k,d),open:(k,d)=>NC.aesGcmOpen(k,d)});}

type Status='loading'|'new'|'locked'|'unlocked';
export type Toast={id:number,text:string,icon?:string};
type Ctx={
  status:Status,email:string,payload:M.Payload,bio:{available:boolean,enabled:boolean},
  create(email:string,password:string):Promise<void>,unlock(email:string,password:string):Promise<void>,unlockBio():Promise<void>,lock():void,
  saveItem(item:M.Item,log?:string):Promise<void>,deleteItem(id:string):Promise<void>,toggleFavorite(id:string):Promise<void>,markViewed(id:string):void,
  moveItem(id:string,vaultId:string):Promise<void>,
  addVault(name:string,icon?:string):Promise<M.Vault>,renameVault(id:string,name:string):Promise<void>,deleteVault(id:string,moveTo?:string):Promise<void>,moveVault(id:string,dir:-1|1):Promise<void>,toggleVaultFavorite(id:string):Promise<void>,
  importFile(uri:string,name:string,mimeType:string,size:number):Promise<M.Attachment>,readAttachment(a:M.Attachment):Promise<string>,openAttachment(a:M.Attachment):Promise<void>,
  copy(value:string,label:string):Promise<void>,notify(text:string,icon?:string):void,
  updateSettings(s:Partial<M.Settings>):Promise<void>,setBio(on:boolean,password?:string):Promise<void>,changePassword(oldPw:string,newPw:string):Promise<void>,
  exportBackup(password:string):Promise<{json:string,name:string}>,inspectBackup(json:string):Verify,restoreBackup(json:string,password:string,mode:'replace'|'merge'):Promise<number>,
  external<T>(fn:()=>Promise<T>):Promise<T>,log(action:string,label:string):Promise<void>,wipe():Promise<void>,
};
const VaultCtx=createContext<Ctx>(null as any);
export const useVault=()=>useContext(VaultCtx);
/** Contexte séparé pour l'indicateur d'attente et les messages : leur changement ne redessine pas toute l'app. */
const UiCtx=createContext<{busy:string,toast:Toast|null}>({busy:'',toast:null});
export const useUi=()=>useContext(UiCtx);
export const haptic=(k:'light'|'success'|'warning'='light')=>{if(Platform.OS==='web')return;(k==='light'?Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light):Haptics.notificationAsync(k==='success'?Haptics.NotificationFeedbackType.Success:Haptics.NotificationFeedbackType.Warning)).catch(()=>{});};
const MIN_PW=12;

export function VaultProvider({children}:{children:React.ReactNode}){
  const [status,setStatus]=useState<Status>('loading'),[busy,setBusy]=useState(''),[email,setEmail]=useState('');
  const [payload,setPayload]=useState<M.Payload>(M.emptyPayload('')),[bio,setBioState]=useState({available:false,enabled:false});
  const [toast,setToast]=useState<Toast|null>(null);
  const dek=useRef<Uint8Array|null>(null),header=useRef<DB.Header|null>(null),pRef=useRef(payload);
  const queue=useRef<Promise<any>>(Promise.resolve()),externalDepth=useRef(0),bgAt=useRef<number|null>(null),imgCache=useRef(new Map<string,string>());
  pRef.current=payload;

  const notify=useCallback((text:string,icon='check')=>{setToast({id:Date.now(),text,icon});},[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),2200);return ()=>clearTimeout(t);},[toast]);

  // ---- démarrage
  useEffect(()=>{(async()=>{
    await DB.purgeTemp();
    // Captures autorisées par défaut (v3.0.10+) : on ne bloque que si l'utilisateur l'a explicitement choisi après cette version.
    if(await DB.getMeta('shotsV2')!=='1'){await DB.setMeta('blockScreenshots','0');}
    const shots=await DB.getMeta('blockScreenshots');if(shots==='1'&&Platform.OS!=='web')await ScreenCapture.preventScreenCaptureAsync().catch(()=>{});else if(Platform.OS!=='web')await ScreenCapture.allowScreenCaptureAsync().catch(()=>{});
    header.current=await DB.readHeader();setEmail((await DB.getMeta('email'))||'');
    setBioState({available:await S.bioAvailable(),enabled:await S.bioEnabled()});
    setStatus(header.current?'locked':'new');
  })().catch(()=>setStatus('new'));},[]);

  /** Écritures sérialisées : jamais deux écritures concurrentes du coffre. */
  const persist=useCallback((next:M.Payload)=>{setPayload(next);pRef.current=next;
    const run=queue.current.then(async()=>{if(!dek.current||!header.current)throw new Error('Coffre verrouillé');await DB.writeVault(header.current,await C.sealJsonAsync(next,dek.current));});
    queue.current=run.catch(()=>{});return run;},[]);
  const mutate=useCallback((fn:(p:M.Payload)=>M.Payload)=>persist(fn(pRef.current)),[persist]);
  const log=useCallback((action:string,label:string)=>mutate(p=>M.addLog(p,action,label)),[mutate]);

  const openSession=useCallback(async(key:Uint8Array,mail:string)=>{
    const sealed=await DB.readSealed();if(!sealed)throw new Error('Coffre introuvable');
    let p=M.normalize(await C.openJsonAsync(sealed,key));
    if(await DB.getMeta('shotsV2')!=='1'){p={...p,settings:{...p.settings,blockScreenshots:false}};await DB.setMeta('shotsV2','1');}dek.current=key;setPayload(p);pRef.current=p;setEmail(p.account.email||mail);setStatus('unlocked');
    await persist(M.addLog(p,'Déverrouillage',''));
  },[persist]);

  const create=useCallback(async(mail:string,pw:string)=>{
    if(pw.length<MIN_PW)throw new Error(`Le mot de passe maître doit contenir au moins ${MIN_PW} caractères.`);
    setBusy('Création de ton coffre chiffré…');
    try{const salt=C.newSalt(),kek=await C.deriveKey(pw,salt),key=C.newDataKey();
      header.current={salt,iterations:C.KDF_ITERATIONS,wrapped:C.wrapKey(key,kek)};
      const p=M.addLog(M.emptyPayload(mail),'Création du coffre','');
      await DB.writeVault(header.current,await C.sealJsonAsync(p,key));await DB.setMeta('email',mail);await DB.setMeta('blockScreenshots','0');await DB.setMeta('shotsV2','1');
      setEmail(mail);await openSession(key,mail);
    }finally{setBusy('');}
  },[openSession]);

  const unlock=useCallback(async(mail:string,pw:string)=>{
    const h=header.current||await DB.readHeader();if(!h)throw new Error('Aucun coffre sur cet appareil.');
    if(email&&mail.trim().toLowerCase()!==email)throw new Error('E-mail ou mot de passe incorrect.');
    setBusy('Déchiffrement du coffre…');
    try{const kek=await C.deriveKey(pw,h.salt,h.iterations);let key:Uint8Array;
      try{key=C.unwrapKey(h.wrapped,kek);}catch{haptic('warning');throw new Error('E-mail ou mot de passe incorrect.');}
      header.current=h;await openSession(key,mail);haptic('success');
    }finally{setBusy('');}
  },[email,openSession]);

  const unlockBio=useCallback(async()=>{
    externalDepth.current++;
    try{const key=await S.bioKey();if(!key)throw new Error('Empreinte non configurée.');header.current=header.current||await DB.readHeader();await openSession(key,email);haptic('success');}
    catch(e:any){throw new Error(/configur/.test(e?.message)?e.message:'Déverrouillage biométrique impossible. Utilise ton mot de passe. (Si tu as ajouté une empreinte dans Android, réactive la biométrie dans Paramètres.)');}
    finally{externalDepth.current--;}
  },[email,openSession]);

  const lock=useCallback(()=>{dek.current=null;imgCache.current.clear();setPayload(M.emptyPayload(''));setStatus(s=>s==='unlocked'?'locked':s);DB.purgeTemp();},[]);

  // ---- verrouillage automatique (ignoré pendant les sélecteurs de fichiers / partage / biométrie)
  useEffect(()=>{const sub=AppState.addEventListener('change',st=>{
    if(st==='active'){const since=bgAt.current;bgAt.current=null;if(since!==null&&dek.current&&Date.now()-since>=pRef.current.settings.autoLockSeconds*1000)lock();}
    else if(st==='background'&&bgAt.current===null&&externalDepth.current===0)bgAt.current=Date.now();});return ()=>sub.remove();},[lock]);
  const external=useCallback(async<T,>(fn:()=>Promise<T>)=>{externalDepth.current++;try{return await fn();}finally{setTimeout(()=>{externalDepth.current--;},800);}},[]);

  // ---- éléments
  const saveItem=useCallback(async(item:M.Item,action?:string)=>{const exists=pRef.current.items.some(i=>i.id===item.id);
    const it={...item,updatedAt:Date.now()};
    const removed=exists?pRef.current.items.find(i=>i.id===item.id)!.attachments.filter(a=>!it.attachments.some(b=>b.fileId===a.fileId)):[];
    await mutate(p=>M.addLog({...p,items:exists?p.items.map(i=>i.id===it.id?it:i):[it,...p.items]},action||(exists?'Modification':'Création'),it.title));
    for(const a of removed)await DB.deleteFile(a.fileId);haptic('success');},[mutate]);
  const deleteItem=useCallback(async(id:string)=>{const it=pRef.current.items.find(i=>i.id===id);if(!it)return;
    await mutate(p=>M.addLog({...p,items:p.items.filter(i=>i.id!==id)},'Suppression',it.title));for(const a of it.attachments)await DB.deleteFile(a.fileId);haptic('warning');},[mutate]);
  const toggleFavorite=useCallback(async(id:string)=>{haptic();await mutate(p=>({...p,items:p.items.map(i=>i.id===id?{...i,favorite:!i.favorite}:i)}));},[mutate]);
  /** « Vu récemment » : mis à jour en mémoire seulement (enregistré avec la prochaine écriture, pas de rechiffrement à chaque ouverture). */
  const markViewed=useCallback((id:string)=>{const next={...pRef.current,items:pRef.current.items.map(i=>i.id===id?{...i,viewedAt:Date.now()}:i)};pRef.current=next;setPayload(next);},[]);
  const moveItem=useCallback(async(id:string,vaultId:string)=>{const v=pRef.current.vaults.find(x=>x.id===vaultId);
    await mutate(p=>M.addLog({...p,items:p.items.map(i=>i.id===id?{...i,vaultId,updatedAt:Date.now()}:i)},'Classement',(p.items.find(i=>i.id===id)?.title||'')+' → '+(v?.name||'')));},[mutate]);

  // ---- coffres
  const addVault=useCallback(async(name:string,icon='folder')=>{const v={id:M.uid(),name:name.trim(),icon,createdAt:Date.now()};await mutate(p=>M.addLog({...p,vaults:[...p.vaults,v]},'Nouveau coffre',v.name));return v;},[mutate]);
  const renameVault=useCallback(async(id:string,name:string)=>{await mutate(p=>M.addLog({...p,vaults:p.vaults.map(v=>v.id===id?{...v,name:name.trim()}:v)},'Coffre renommé',name));},[mutate]);
  const deleteVault=useCallback(async(id:string,moveTo?:string)=>{const p0=pRef.current;if(p0.vaults.length<=1)throw new Error('Il doit rester au moins un coffre.');
    const target=moveTo||p0.vaults.find(v=>v.id!==id)!.id;const name=p0.vaults.find(v=>v.id===id)?.name||'';
    await mutate(p=>M.addLog({...p,vaults:p.vaults.filter(v=>v.id!==id),items:p.items.map(i=>i.vaultId===id?{...i,vaultId:target}:i)},'Coffre supprimé',name));},[mutate]);
  const moveVault=useCallback(async(id:string,dir:-1|1)=>{await mutate(p=>{const a=[...p.vaults];const i=a.findIndex(v=>v.id===id),j=i+dir;if(i<0||j<0||j>=a.length)return p;[a[i],a[j]]=[a[j],a[i]];return {...p,vaults:a};});},[mutate]);
  const toggleVaultFavorite=useCallback(async(id:string)=>{await mutate(p=>({...p,vaults:p.vaults.map(v=>v.id===id?{...v,favorite:!v.favorite}:v)}));},[mutate]);

  // ---- fichiers : chiffrés AVANT écriture persistante ; la copie du sélecteur (cache) est supprimée aussitôt
  const importFile=useCallback(async(uri:string,name:string,mimeType:string,size:number)=>{
    if(!dek.current)throw new Error('Coffre verrouillé');if(size>25*1024*1024)throw new Error('Fichier trop volumineux (25 Mo maximum par fichier).');
    setBusy('Chiffrement du fichier…');
    try{const raw=await DB.readUriBase64(uri);const fileId=M.uid();await DB.writeFileSealed(fileId,await C.sealFileAsync(raw,dek.current));
      if(uri.startsWith('file://')&&uri.includes('/cache/'))await DB.deleteUri(uri);
      return {id:M.uid(),name,mimeType,size:size||Math.round(raw.length*0.75),fileId};}finally{setBusy('');}
  },[]);
  const readAttachment=useCallback(async(a:M.Attachment)=>{const c=imgCache.current.get(a.fileId);if(c)return c;if(!dek.current)throw new Error('Coffre verrouillé');
    const b=await C.openFileAsync(await DB.readFileSealed(a.fileId),dek.current);if(a.mimeType.startsWith('image/')&&imgCache.current.size<40)imgCache.current.set(a.fileId,b);return b;},[]);
  const openAttachment=useCallback(async(a:M.Attachment)=>{
    const b=await readAttachment(a);const uri=await DB.writeTemp(a.name,b);
    await external(async()=>{
      if(Platform.OS==='android'){const IL=await import('expo-intent-launcher');const cu=await DB.FS.getContentUriAsync(uri);
        await IL.startActivityAsync('android.intent.action.VIEW',{data:cu,flags:1,type:a.mimeType});}
      else{const Sh=await import('expo-sharing');await Sh.shareAsync(uri,{mimeType:a.mimeType});}
    });
    setTimeout(()=>DB.deleteUri(uri),120000);await log('Ouverture de fichier',a.name);
  },[readAttachment,external,log]);

  const copy=useCallback(async(value:string,label:string)=>{await Clipboard.setStringAsync(value);haptic('success');notify(`${label} copié`,'copy');
    const sec=pRef.current.settings.clipboardClearSeconds;if(sec>0)setTimeout(async()=>{try{if((await Clipboard.getStringAsync())===value)await Clipboard.setStringAsync('');}catch{}},sec*1000);},[notify]);

  // ---- réglages & sécurité
  const updateSettings=useCallback(async(s:Partial<M.Settings>)=>{await mutate(p=>({...p,settings:{...p.settings,...s}}));
    if(s.blockScreenshots!==undefined&&Platform.OS!=='web'){await DB.setMeta('blockScreenshots',s.blockScreenshots?'1':'0');
      s.blockScreenshots?await ScreenCapture.preventScreenCaptureAsync():await ScreenCapture.allowScreenCaptureAsync();}},[mutate]);
  const verifyPassword=useCallback(async(pw:string)=>{const h=header.current!;try{return C.unwrapKey(h.wrapped,await C.deriveKey(pw,h.salt,h.iterations));}catch{throw new Error('Mot de passe maître incorrect.');}},[]);
  const setBio=useCallback(async(on:boolean,pw?:string)=>{
    if(!on){await S.disableBio();setBioState(b=>({...b,enabled:false}));await log('Biométrie désactivée','');return;}
    setBusy('Vérification du mot de passe…');let key:Uint8Array;try{key=await verifyPassword(pw||'');}finally{setBusy('');}
    await external(()=>S.enableBio(key));setBioState(b=>({...b,enabled:true}));await log('Biométrie activée','');haptic('success');
  },[verifyPassword,external,log]);
  const changePassword=useCallback(async(oldPw:string,newPw:string)=>{if(newPw.length<MIN_PW)throw new Error(`Au moins ${MIN_PW} caractères.`);
    setBusy('Changement du mot de passe maître…');
    try{const key=await verifyPassword(oldPw);const salt=C.newSalt();const kek=await C.deriveKey(newPw,salt);
      header.current={salt,iterations:C.KDF_ITERATIONS,wrapped:C.wrapKey(key,kek)};await persist(M.addLog(pRef.current,'Mot de passe maître changé',''));
    }finally{setBusy('');}},[verifyPassword,persist]);

  // ---- sauvegardes
  const exportBackup=useCallback(async(pw:string)=>{if(!dek.current)throw new Error('Coffre verrouillé');setBusy('Préparation de la sauvegarde chiffrée…');
    try{const files:Record<string,string>={};for(const it of pRef.current.items)for(const a of it.attachments)files[a.fileId]=await DB.readFileSealed(a.fileId);
      const p={...pRef.current,settings:{...pRef.current.settings}};const b=await buildBackup(p,files,dek.current,pw);
      await persist(M.addLog({...pRef.current,lastBackupAt:Date.now()},'Sauvegarde exportée',`${b.stats.items} éléments`));
      return {json:JSON.stringify(b),name:backupFileName()};}finally{setBusy('');}},[persist]);
  const inspectBackup=useCallback((json:string)=>{try{return verifyBackup(JSON.parse(json));}catch{return {ok:false,reason:'Fichier illisible.'} as Verify;}},[]);
  const restoreBackup=useCallback(async(json:string,pw:string,mode:'replace'|'merge')=>{if(!dek.current)throw new Error('Coffre verrouillé');
    setBusy('Vérification et déchiffrement de la sauvegarde…');
    try{const r=await openBackup(JSON.parse(json),pw,email);
      for(const [fileId,b] of Object.entries(r.files))await DB.writeFileSealed(fileId,await C.sealFileAsync(b,dek.current));
      const inc={...r.payload,account:pRef.current.account};
      let next=mode==='merge'?mergePayload(pRef.current,inc):{...inc,settings:pRef.current.settings,log:pRef.current.log};
      if(mode==='replace'){const keep=new Set(next.items.flatMap(i=>i.attachments.map(a=>a.fileId)));for(const f of await DB.listFiles())if(!keep.has(f))await DB.deleteFile(f);}
      await persist(M.addLog(next,'Sauvegarde restaurée',`${r.payload.items.length} éléments (${mode==='merge'?'fusion':'remplacement'})`));haptic('success');return r.payload.items.length;
    }finally{setBusy('');}},[email,persist]);
  const wipe=useCallback(async()=>{await S.disableBio();await DB.wipeAll();dek.current=null;header.current=null;setEmail('');setPayload(M.emptyPayload(''));setStatus('new');},[]);

  const value=useMemo<Ctx>(()=>({status,email,payload,bio,create,unlock,unlockBio,lock,saveItem,deleteItem,toggleFavorite,markViewed,moveItem,
    addVault,renameVault,deleteVault,moveVault,toggleVaultFavorite,importFile,readAttachment,openAttachment,copy,notify,updateSettings,setBio,changePassword,
    exportBackup,inspectBackup,restoreBackup,external,log,wipe}),
    [status,email,payload,bio,create,unlock,unlockBio,lock,saveItem,deleteItem,toggleFavorite,markViewed,moveItem,addVault,renameVault,deleteVault,moveVault,
     toggleVaultFavorite,importFile,readAttachment,openAttachment,copy,notify,updateSettings,setBio,changePassword,exportBackup,inspectBackup,restoreBackup,external,log,wipe]);
  const ui=useMemo(()=>({busy,toast}),[busy,toast]);
  return <VaultCtx.Provider value={value}><UiCtx.Provider value={ui}>{children}</UiCtx.Provider></VaultCtx.Provider>;
}

/** Score de sécurité RÉEL, calculé à partir de l'état du coffre (aucune valeur fictive). */
export function securityChecks(p:M.Payload,bioOn:boolean){
  const last=p.lastBackupAt;
  return [
    {label:'Chiffrement AES-256-GCM',ok:true},
    {label:'Verrouillage biométrique',ok:bioOn},
    {label:'Sauvegarde de moins de 30 jours',ok:!!last&&Date.now()-last<30*864e5},
    {label:'Verrouillage auto ≤ 5 min',ok:p.settings.autoLockSeconds<=300},
  ];
}
