/** Actions d'import partagées (Accueil, Ajouter, Assistant). */
import {Alert} from 'react-native';
import {router} from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {newItem,Attachment,ItemType} from '../core/model';
type V=ReturnType<typeof import('../state/vault').useVault>;
const firstVault=(v:V)=>v.payload.vaults[0]?.id||'v0';
async function createFrom(v:V,type:ItemType,atts:Attachment[],title:string){const it=newItem(type,firstVault(v));it.title=title;it.attachments=atts;await v.saveItem(it,'Import');router.push(`/item/${it.id}`);}
const stamp=()=>new Date().toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
export async function pickImages(v:V,camera:boolean):Promise<Attachment[]>{
  if(camera){const p=await ImagePicker.requestCameraPermissionsAsync();if(!p.granted){Alert.alert('Appareil photo','Autorise l’appareil photo dans les réglages Android pour numériser.');return [];}}
  const r=await v.external(()=>camera?ImagePicker.launchCameraAsync({quality:0.85,exif:false}):ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsMultipleSelection:true,quality:0.85,exif:false}));
  if(r.canceled)return [];const out:Attachment[]=[];
  for(const a of r.assets)out.push(await v.importFile(a.uri,a.fileName||`photo-${Date.now()}.jpg`,a.mimeType||'image/jpeg',a.fileSize||0));return out;}
export async function pickFiles(v:V):Promise<Attachment[]>{
  const r=await v.external(()=>DocumentPicker.getDocumentAsync({type:['application/pdf','image/*','text/*','application/*'],multiple:true,copyToCacheDirectory:true}));
  if(r.canceled)return [];const out:Attachment[]=[];for(const a of r.assets)out.push(await v.importFile(a.uri,a.name,a.mimeType||'application/octet-stream',a.size||0));return out;}
export async function scanDocument(v:V){try{const a=await pickImages(v,true);if(a.length)await createFrom(v,'document',a,'Scan du '+stamp());}catch(e:any){Alert.alert('Numérisation impossible',e.message);}}
export async function addPhotos(v:V,camera=false){try{const a=await pickImages(v,camera);if(a.length)await createFrom(v,'photo',a,a.length>1?`${a.length} photos`:a[0].name.replace(/\.\w+$/,''));}catch(e:any){Alert.alert('Import impossible',e.message);}}
export async function importFromPhone(v:V){try{const a=await pickFiles(v);if(a.length){const img=a.every(x=>x.mimeType.startsWith('image/'));await createFrom(v,img?'photo':'document',a,a[0].name.replace(/\.\w+$/,''));}}catch(e:any){Alert.alert('Import impossible',e.message);}}
