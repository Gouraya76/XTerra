import React,{useMemo,useState} from 'react';
import {Text,View,useWindowDimensions,Pressable} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useVault} from '../../src/state/vault';
import {Screen,IconBtn,Chip,Empty,Input,Fab} from '../../src/ui/kit';
import {Thumb} from '../../src/ui/items';
import {ItemList} from '../../src/screens/ItemList';
import {ItemType,typeDef} from '../../src/core/model';
import {search} from '../../src/core/search';
import {font,T} from '../../src/ui/theme';
import {addPhotos,importFromPhone} from '../../src/screens/actions';

function Gallery({initial}:{initial:string}){
  const v=useVault();const {width}=useWindowDimensions();const [f,setF]=useState(initial||'all'),[q,setQ]=useState(''),[fav,setFav]=useState(false);
  const items=v.payload.items.filter(i=>i.type==='photo'||i.type==='document');
  const shown=useMemo(()=>{let a=q.trim()?search(items,v.payload.vaults,q).map(h=>h.item):[...items].sort((x,y)=>y.updatedAt-x.updatedAt);
    if(fav)a=a.filter(i=>i.favorite);return a.filter(i=>f==='all'||i.type===f).flatMap(i=>i.attachments.length?i.attachments.map(a=>({i,a})):[]);},[items,f,q,fav]);
  const cell=(width-T.gutter*2-16)/3;const nP=items.filter(i=>i.type==='photo').reduce((n,i)=>n+i.attachments.length,0),nD=items.filter(i=>i.type==='document').reduce((n,i)=>n+i.attachments.length,0);
  return <View style={{flex:1}}><Screen title="Photos & Documents" subtitle={`${nP} photo${nP>1?'s':''} · ${nD} document${nD>1?'s':''}`} right={null}>
    <Input icon="search" placeholder="Rechercher un fichier, une collection…" value={q} onChangeText={setQ} style={{marginBottom:10}}/>
    <View style={{flexDirection:'row',gap:8,marginBottom:14,flexWrap:'wrap'}}>{[['all','Tous'],['photo','Photos'],['document','Documents']].map(([k,l])=><Chip key={k} label={l} active={f===k} onPress={()=>setF(k)}/>)}<Chip label="Favoris" icon="star" active={fav} onPress={()=>setFav(!fav)}/></View>
    {shown.length?<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{shown.map(({i,a})=><Pressable key={a.id} onPress={()=>router.push(`/item/${i.id}`)} accessibilityLabel={a.name}><Thumb att={a} size={cell}/></Pressable>)}</View>
      :<Empty icon="image" title="Galerie privée vide" text="Importe des photos, scanne un document ou ajoute un PDF : tout est chiffré sur ton téléphone."/>}
  </Screen><Fab onPress={()=>f==='document'?importFromPhone(v):addPhotos(v)}/></View>;
}
export default function Category(){
  const {type,f}=useLocalSearchParams<{type:string,f?:string}>();const v=useVault();
  if(type==='gallery')return <Gallery initial={f||'all'}/>;
  const d=typeDef(type as ItemType);if(!d)return <Screen title="Introuvable"><Empty icon="alert-circle" title="Catégorie inconnue" text=""/></Screen>;
  const items=v.payload.items.filter(i=>i.type===type);
  return <View style={{flex:1}}><Screen title={d.label} subtitle={`${items.length} élément${items.length>1?'s':''}`}>
    <ItemList items={items} byVault/>
  </Screen><Fab onPress={()=>router.push(`/edit?type=${type}`)}/></View>;
}
