import React,{useState} from 'react';
import {Pressable,Text,View,Image} from 'react-native';
import {router} from 'expo-router';
import {Item,typeDef} from '../core/model';
import {useVault} from '../state/vault';
import {Glass,Tile,Icon,IconBtn,mask} from './kit';
import {T,font} from './theme';

/** Champ secret principal d'un élément (affiché masqué, copiable). */
export function primarySecret(it:Item){const f=typeDef(it.type).fields.find(f=>f.secret&&it.data[f.key]);if(f)return {label:f.label,value:it.data[f.key]};
  const c=it.custom.find(c=>c.secret&&c.value);return c?{label:c.label,value:c.value}:null;}
export function ago(t:number){const s=(Date.now()-t)/1000;if(s<60)return 'à l’instant';if(s<3600)return `il y a ${Math.floor(s/60)} min`;if(s<86400)return `il y a ${Math.floor(s/3600)} h`;
  const d=Math.floor(s/86400);return d<30?`il y a ${d} j`:new Date(t).toLocaleDateString('fr-FR');}
export function subtitle(it:Item){const d=typeDef(it.type);
  if(it.type==='password')return it.data.username||it.data.email||d.singular;if(it.type==='api')return it.data.provider||d.singular;
  if(it.type==='card')return [it.data.cardType,it.data.number?'•••• '+it.data.number.replace(/\s/g,'').slice(-4):'',it.data.expiry].filter(Boolean).join(' · ')||d.singular;
  if(it.attachments.length)return `${it.attachments.length} fichier(s)`;return it.description||d.singular;}

export function ItemRow({item,compact}:{item:Item,compact?:boolean}){
  const v=useVault();const [show,setShow]=useState(false);const sec=primarySecret(item);
  return <Glass blur={false} padding={12} radius={20} style={{marginBottom:10}} onPress={()=>router.push(`/item/${item.id}`)}>
    <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
      <Tile letter={item.type==='password'||item.type==='api'||item.type==='card'?item.title[0]:undefined} icon={typeDef(item.type).icon}/>
      <View style={{flex:1,minWidth:0}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Text style={font.h3} numberOfLines={1}>{item.title}</Text>{item.favorite&&<Icon name="star" size={12} color={T.textDim}/>}</View>
        <Text style={[font.small,{marginTop:2}]} numberOfLines={1}>{sec&&!compact?(show?sec.value:mask):subtitle(item)}{compact?' · '+ago(Math.max(item.updatedAt,item.viewedAt||0)):''}</Text>
      </View>
      {sec&&!compact&&<><IconBtn size={34} name={show?'eye-off':'eye'} label="Afficher" onPress={()=>setShow(!show)}/><IconBtn size={34} name="copy" label="Copier" onPress={()=>v.copy(sec.value,sec.label)}/></>}
      {(compact||!sec)&&<Icon name="chevron-right" size={18} color={T.textMute}/>}
    </View>
  </Glass>;
}
/** Vignette d'image déchiffrée en mémoire (jamais écrite en clair sur le disque). */
export function Thumb({att,size,radius=14}:{att:Item['attachments'][0],size:number|string,radius?:number}){
  const v=useVault();const [uri,setUri]=useState<string|null>(null);
  React.useEffect(()=>{let alive=true;if(att.mimeType.startsWith('image/'))v.readAttachment(att).then(b=>alive&&setUri(`data:${att.mimeType};base64,${b}`)).catch(()=>{});return ()=>{alive=false};},[att.fileId]);
  const isPdf=att.mimeType==='application/pdf';
  return <View style={{width:size as any,aspectRatio:1,borderRadius:radius,overflow:'hidden',backgroundColor:T.a(T.ice,0.08),borderWidth:1,borderColor:T.glassBorder,alignItems:'center',justifyContent:'center'}}>
    {uri?<Image source={{uri}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>:
      <View style={{alignItems:'center',padding:6}}><Icon name={isPdf?'file-text':att.mimeType.startsWith('image/')?'image':'file'} size={26}/><Text style={[font.micro,{marginTop:4,textAlign:'center'}]} numberOfLines={2}>{att.name}</Text>
      <Text style={[font.micro,{opacity:0.7}]}>{(att.size/1048576).toFixed(1)} Mo</Text></View>}
  </View>;
}
