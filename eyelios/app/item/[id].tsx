import React,{useEffect,useState} from 'react';
import {Alert,Linking,Text,View,Image,Pressable,useWindowDimensions} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useVault} from '../../src/state/vault';
import {Screen,Glass,Btn,Icon,IconBtn,Tile,Section,Sheet,Input,Chip,mask,Empty} from '../../src/ui/kit';
import {Thumb} from '../../src/ui/items';
import {typeDef,Attachment} from '../../src/core/model';
import {T,font} from '../../src/ui/theme';

function FieldRow({label,value,secret,url}:{label:string,value:string,secret?:boolean,url?:boolean}){
  const v=useVault();const [show,setShow]=useState(!secret);
  return <Glass padding={14} style={{marginBottom:10}}>
    <Text style={font.micro}>{label.toUpperCase()}</Text>
    <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:6}}>
      <Text selectable={show} style={[font.body,{flex:1,color:T.ice,fontFamily:secret&&show?'monospace':undefined}]}>{show?value:mask}</Text>
      {secret&&<IconBtn size={34} name={show?'eye-off':'eye'} label={show?'Masquer':'Afficher'} onPress={()=>setShow(!show)}/>}
      {url&&<IconBtn size={34} name="external-link" label="Ouvrir le site" onPress={()=>Linking.openURL(value).catch(()=>Alert.alert('Lien invalide'))}/>}
      <IconBtn size={34} name="copy" label={'Copier '+label} onPress={()=>v.copy(value,label)}/>
    </View>
  </Glass>;
}
export default function ItemScreen(){
  const {id}=useLocalSearchParams<{id:string}>();const v=useVault();const it=v.payload.items.find(i=>i.id===id);const {width}=useWindowDimensions();
  const [preview,setPreview]=useState<{a:Attachment,uri:string}|null>(null),[rename,setRename]=useState<Attachment|null>(null),[name,setName]=useState(''),[move,setMove]=useState(false);
  useEffect(()=>{if(it)v.markViewed(it.id);},[id]);
  if(!it)return <Screen title="Élément"><Empty icon="alert-circle" title="Élément introuvable" text="Il a peut-être été supprimé."/></Screen>;
  const d=typeDef(it.type);const vault=v.payload.vaults.find(x=>x.id===it.vaultId);
  const del=()=>Alert.alert('Supprimer « '+it.title+' » ?','Cette action est définitive (les pièces jointes chiffrées sont aussi effacées).',[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async()=>{await v.deleteItem(it.id);router.back();}}]);
  async function open(a:Attachment){try{if(a.mimeType.startsWith('image/'))setPreview({a,uri:`data:${a.mimeType};base64,${await v.readAttachment(a)}`});else await v.openAttachment(a);}catch(e:any){Alert.alert('Ouverture impossible',e.message+'\nAucune application compatible ?');}}
  return <Screen title={it.title} subtitle={`${d.singular} · ${vault?.name||''}`} right={<View style={{flexDirection:'row',gap:8}}><IconBtn name="star" active={it.favorite} label="Favori" onPress={()=>v.toggleFavorite(it.id)}/><IconBtn name="edit-2" label="Modifier" onPress={()=>router.push(`/edit?id=${it.id}`)}/></View>}>
    <View style={{flexDirection:'row',alignItems:'center',gap:14,marginBottom:16}}>
      <Tile size={60} letter={['password','api','card'].includes(it.type)?it.title[0]:undefined} icon={d.icon}/>
      <View style={{flex:1}}><Text style={font.h2} numberOfLines={2}>{it.title}</Text><Text style={font.small}>Créé le {new Date(it.createdAt).toLocaleDateString('fr-FR')} · modifié le {new Date(it.updatedAt).toLocaleDateString('fr-FR')}</Text></View>
    </View>
    {d.fields.filter(f=>it.data[f.key]).map(f=>f.kind==='multiline'?
      <Glass key={f.key} style={{marginBottom:10}}><Text style={font.micro}>{f.label.toUpperCase()}</Text><Text selectable style={[font.body,{marginTop:8,color:T.ice}]}>{it.data[f.key]}</Text></Glass>
      :<FieldRow key={f.key} label={f.label} value={it.data[f.key]} secret={f.secret} url={f.kind==='url'}/>)}
    {it.custom.map(c=><FieldRow key={c.id} label={c.label||'Champ'} value={c.value} secret={c.secret}/>)}
    {!!it.description&&<Glass style={{marginBottom:10}}><Text style={font.micro}>DESCRIPTION</Text><Text selectable style={[font.body,{marginTop:8}]}>{it.description}</Text></Glass>}
    {it.tags.length>0&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:6}}>{it.tags.map(t=><Chip key={t} icon="tag" label={t}/>)}</View>}
    {it.attachments.length>0&&<><Section title={`Fichiers (${it.attachments.length})`} icon="paperclip"/>
      {it.attachments.map(a=><Glass key={a.id} padding={10} style={{marginBottom:10}} onPress={()=>open(a)}><View style={{flexDirection:'row',alignItems:'center',gap:12}}>
        <Thumb att={a} size={64} radius={12}/><View style={{flex:1}}><Text style={font.h3} numberOfLines={1}>{a.name}</Text><Text style={font.micro}>{a.mimeType} · {(a.size/1024).toFixed(0)} Ko</Text></View>
        <IconBtn size={34} name="edit-3" label="Renommer" onPress={()=>{setRename(a);setName(a.name);}}/>
        <IconBtn size={34} name="trash-2" label="Supprimer le fichier" onPress={()=>Alert.alert('Supprimer ce fichier ?',a.name,[{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:()=>v.saveItem({...it,attachments:it.attachments.filter(x=>x.id!==a.id)},'Fichier supprimé')}])}/>
      </View></Glass>)}</>}
    <View style={{flexDirection:'row',gap:10,marginTop:16}}><Btn icon="folder" title="Classer" onPress={()=>setMove(true)}/><Btn icon="trash-2" kind="danger" title="Supprimer" onPress={del}/></View>
    <Sheet visible={!!preview} onClose={()=>setPreview(null)} title={preview?.a.name||''}>
      {preview&&<><Image source={{uri:preview.uri}} style={{width:width-T.gutter*2,height:(width-T.gutter*2)*1.2,borderRadius:16}} resizeMode="contain"/>
        <Text style={[font.micro,{marginVertical:10,textAlign:'center'}]}>Déchiffrée en mémoire uniquement.</Text><Btn icon="external-link" title="Ouvrir dans une autre application" onPress={()=>{const a=preview.a;setPreview(null);v.openAttachment(a).catch(e=>Alert.alert('Ouverture impossible',e.message));}}/></>}
    </Sheet>
    <Sheet visible={!!rename} onClose={()=>setRename(null)} title="Renommer le fichier">
      <Input value={name} onChangeText={setName} icon="file"/><Btn kind="primary" title="Renommer" icon="check" onPress={async()=>{if(rename&&name.trim()){await v.saveItem({...it,attachments:it.attachments.map(x=>x.id===rename.id?{...x,name:name.trim()}:x)},'Fichier renommé');}setRename(null);}}/>
    </Sheet>
    <Sheet visible={move} onClose={()=>setMove(false)} title="Classer dans un coffre">
      {v.payload.vaults.map(c=><Glass key={c.id} padding={14} style={{marginBottom:8}} strong={c.id===it.vaultId} onPress={async()=>{await v.moveItem(it.id,c.id);setMove(false);v.notify('Classé dans '+c.name,'folder');}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Icon name={c.icon}/><Text style={[font.h3,{flex:1}]}>{c.name}</Text>{c.id===it.vaultId&&<Icon name="check"/>}</View></Glass>)}
    </Sheet>
  </Screen>;
}
