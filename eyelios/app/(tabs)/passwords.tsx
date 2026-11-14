import React,{useMemo,useState} from 'react';
import {ScrollView,View} from 'react-native';
import {router} from 'expo-router';
import {useVault} from '../../src/state/vault';
import {Screen,Chip,Input,Empty,FadeIn,Fab} from '../../src/ui/kit';
import {ItemRow} from '../../src/ui/items';
import {sortItems} from '../../src/core/model';
import {search} from '../../src/core/search';

export default function Passwords(){
  const v=useVault();const all=v.payload.items.filter(i=>i.type==='password');const [q,setQ]=useState(''),[f,setF]=useState('all');
  const list=useMemo(()=>{let a=q.trim()?search(all,v.payload.vaults,q).map(h=>h.item):sortItems(all,'recent');
    if(f==='app')a=a.filter(i=>!i.data.url);if(f==='site')a=a.filter(i=>!!i.data.url);if(f==='fav')a=a.filter(i=>i.favorite);return a;},[all,q,f]);
  return <View style={{flex:1}}><Screen title="Mots de passe" subtitle={`${all.length} élément${all.length>1?'s':''}`} back={false}>
    <Input icon="search" placeholder="Rechercher un mot de passe…" value={q} onChangeText={setQ} style={{marginBottom:12}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}} style={{marginBottom:14}}>
      {[['all','Tous'],['app','App'],['site','Sites'],['fav','Favoris']].map(([k,l])=><Chip key={k} label={l} active={f===k} onPress={()=>setF(k)}/>)}</ScrollView>
    {list.length?list.map((i,n)=><FadeIn key={i.id} delay={Math.min(n,8)*30}><ItemRow item={i}/></FadeIn>):<Empty icon="key" title="Aucun mot de passe" text="Touche + pour enregistrer ton premier identifiant."/>}
  </Screen><Fab onPress={()=>router.push('/edit?type=password')}/></View>;
}
