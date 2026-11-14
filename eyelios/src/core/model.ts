/** Modèle de données EYELIOS (contenu intégralement chiffré). */
export type ItemType='password'|'api'|'card'|'photo'|'document'|'note';
export type Attachment={id:string,name:string,mimeType:string,size:number,fileId:string};
export type CustomField={id:string,label:string,value:string,secret:boolean};
export type Item={id:string,type:ItemType,vaultId:string,title:string,data:Record<string,string>,custom:CustomField[],
  description:string,tags:string[],favorite:boolean,attachments:Attachment[],createdAt:number,updatedAt:number,viewedAt?:number};
export type Vault={id:string,name:string,icon:string,createdAt:number,favorite?:boolean};
export type LogEntry={at:number,action:string,label:string};
export type Payload={schema:3,account:{email:string},vaults:Vault[],items:Item[],log:LogEntry[],settings:Settings,lastBackupAt?:number};
export type Settings={autoLockSeconds:number,clipboardClearSeconds:number,blockScreenshots:boolean,aiEnabled:boolean,aiModel:string};

export const DEFAULT_SETTINGS:Settings={autoLockSeconds:60,clipboardClearSeconds:30,blockScreenshots:true,aiEnabled:false,aiModel:'claude-opus-5-5'};
export type FieldDef={key:string,label:string,secret?:boolean,kind?:'url'|'email'|'multiline'|'number'|'password'|'expiry'|'select',options?:string[],placeholder?:string};
export type TypeDef={id:ItemType,label:string,singular:string,icon:string,fields:FieldDef[]};

export const TYPES:TypeDef[]=[
 {id:'password',label:'Mots de passe',singular:'Mot de passe',icon:'key',fields:[
   {key:'url',label:'Adresse du site',kind:'url',placeholder:'https://…'},{key:'username',label:'Identifiant'},
   {key:'email',label:'Adresse e-mail',kind:'email'},{key:'password',label:'Mot de passe',secret:true,kind:'password'}]},
 {id:'api',label:'Clés API',singular:'Clé API',icon:'code',fields:[
   {key:'provider',label:'Fournisseur'},{key:'apiKey',label:'Clé API',secret:true},{key:'apiUrl',label:'URL de l’API',kind:'url'},
   {key:'notes',label:'Notes',kind:'multiline'}]},
 {id:'card',label:'Cartes & Paiements',singular:'Carte',icon:'credit-card',fields:[
   {key:'holder',label:'Titulaire'},{key:'cardType',label:'Type de carte',kind:'select',options:['Visa','Mastercard','American Express','CB','Autre']},
   {key:'number',label:'Numéro (facultatif)',secret:true,kind:'number'},{key:'expiry',label:'Expiration (MM/AA)',kind:'expiry'},
   {key:'bank',label:'Banque'},{key:'notes',label:'Notes',kind:'multiline'}]},
 {id:'photo',label:'Photos',singular:'Photo',icon:'image',fields:[]},
 {id:'document',label:'Documents',singular:'Document',icon:'file-text',fields:[]},
 {id:'note',label:'Notes privées',singular:'Note',icon:'edit-3',fields:[{key:'body',label:'Note',kind:'multiline'}]},
];
export const typeDef=(t:ItemType)=>TYPES.find(x=>x.id===t)!;
export const DEFAULT_VAULTS:[string,string][]=[['Personnel','user'],['Travail','briefcase'],['Projets','layers'],['Finance','trending-up'],['Administratif','archive'],['Confidentiel','shield']];

export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);
export function emptyPayload(email:string,now=Date.now()):Payload{
  return {schema:3,account:{email},vaults:DEFAULT_VAULTS.map(([name,icon],i)=>({id:'v'+i,name,icon,createdAt:now})),items:[],log:[],settings:{...DEFAULT_SETTINGS}};
}
export function newItem(type:ItemType,vaultId:string,now=Date.now()):Item{
  return {id:uid(),type,vaultId,title:'',data:{},custom:[],description:'',tags:[],favorite:false,attachments:[],createdAt:now,updatedAt:now};
}
/** Interdit PIN / CVV : on refuse les champs personnalisés dont le libellé y ressemble. */
export const FORBIDDEN_LABEL=/\b(pin|cvv|cvc|cryptogramme|code\s*secret)\b/i;
export function validateItem(it:Item):string|null{
  if(!it.title.trim())return 'Donne un nom à cet élément.';
  if(it.type==='card'){
    if(it.custom.some(f=>FORBIDDEN_LABEL.test(f.label)))return 'Par sécurité, EYELIOS ne stocke jamais de code PIN ni de CVV.';
    if(it.data.expiry&&!/^(0[1-9]|1[0-2])\/\d{2}$/.test(it.data.expiry))return 'Date d’expiration attendue au format MM/AA.';
    if(it.data.number&&!/^[\d ]{12,23}$/.test(it.data.number))return 'Numéro de carte invalide.';
  }
  if(it.data.url&&!/^https?:\/\//i.test(it.data.url))it.data.url='https://'+it.data.url;
  return null;
}
/** Migration depuis JILANI VAULT v2 ({items:[{category,fields,keywords,notes,attachments(base64)}]}). */
export function migrateV2(old:any,email:string):{payload:Payload,files:{fileId:string,base64:string}[]}{
  const p=emptyPayload(email);const files:{fileId:string,base64:string}[]=[];
  const map:Record<string,ItemType>={password:'password',api:'api',bank:'card',document:'document',photo:'photo',note:'note',other:'note'};
  for(const o of old.items||[]){
    const it=newItem(map[o.category]||'note','v0',o.createdAt||Date.now());
    it.id=o.id||it.id;it.title=o.title||'Sans titre';it.tags=o.keywords||[];it.description=o.notes||'';it.updatedAt=o.updatedAt||it.createdAt;
    it.custom=(o.fields||[]).filter((f:any)=>!FORBIDDEN_LABEL.test(f.label||'')).map((f:any)=>({id:f.id||uid(),label:f.label||'',value:f.value||'',secret:!!f.secret}));
    for(const a of o.attachments||[]){const fileId=uid();files.push({fileId,base64:a.base64});it.attachments.push({id:a.id||uid(),name:a.name,mimeType:a.mimeType,size:a.size,fileId});}
    p.items.push(it);
  }
  return {payload:p,files};
}
export function normalize(p:any):Payload{
  return {schema:3,account:p.account||{email:''},vaults:p.vaults?.length?p.vaults:emptyPayload('').vaults,
    items:(p.items||[]).map((x:any)=>({custom:[],data:{},tags:[],attachments:[],description:'',favorite:false,...x})),log:p.log||[],settings:{...DEFAULT_SETTINGS,...(p.settings||{})},lastBackupAt:p.lastBackupAt};
}
export function addLog(p:Payload,action:string,label:string,now=Date.now()):Payload{return {...p,log:[{at:now,action,label},...p.log].slice(0,300)};}
export function countByType(items:Item[]){const c:Record<string,number>={};for(const t of TYPES)c[t.id]=0;for(const i of items)c[i.type]=(c[i.type]||0)+1;return c as Record<ItemType,number>;}
export const SORTS={recent:'Récents',name:'Nom (A→Z)',created:'Date de création'} as const;
export type SortKey=keyof typeof SORTS;
export function sortItems(items:Item[],k:SortKey){const a=[...items];
  if(k==='name')a.sort((x,y)=>x.title.localeCompare(y.title,'fr'));else if(k==='created')a.sort((x,y)=>y.createdAt-x.createdAt);else a.sort((x,y)=>Math.max(y.updatedAt,y.viewedAt||0)-Math.max(x.updatedAt,x.viewedAt||0));
  return a.sort((x,y)=>Number(y.favorite)-Number(x.favorite));}
