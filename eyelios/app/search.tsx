import React,{useMemo,useState,useRef,useEffect} from 'react';
import {Text,View,TextInput} from 'react-native';
import {router} from 'expo-router';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Icon,Input,FadeIn,Section,Empty} from '../src/ui/kit';
import {ItemRow} from '../src/ui/items';
import {search,groupByType,searchVaults} from '../src/core/search';
import {T,font} from '../src/ui/theme';

export default function Search(){
  const v=useVault();const [q,setQ]=useState('');const [dq,setDq]=useState('');
  useEffect(()=>{const t=setTimeout(()=>setDq(q),120);return ()=>clearTimeout(t);},[q]);
  const groups=useMemo(()=>groupByType(search(v.payload.items,v.payload.vaults,dq)),[dq,v.payload]);
  const vaults=useMemo(()=>searchVaults(v.payload.vaults,dq),[dq,v.payload.vaults]);
  const total=groups.reduce((n,g)=>n+g.hits.length,0)+vaults.length;
  return <Screen title="Recherche universelle" subtitle={dq?`${total} résultat${total>1?'s':''}`:'Noms, descriptions, catégories, tags, fichiers'}>
    <Input icon="search" autoFocus placeholder="Netflix, OpenAI, assurance voiture…" value={q} onChangeText={setQ} returnKeyType="search"/>
    {!dq&&<Text style={[font.small,{textAlign:'center',marginTop:16}]}>Les valeurs secrètes (mots de passe, clés, numéros) ne sont jamais indexées.</Text>}
    {!!dq&&!total&&<Empty icon="search" title="Aucun résultat" text={`Rien ne correspond à « ${dq} ».`}/>}
    {vaults.length>0&&<><Section title="Coffres" icon="layers"/>{vaults.map(c=><Glass key={c.id} style={{marginBottom:10}} padding={12} onPress={()=>router.push(`/vault/${c.id}`)}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Icon name={c.icon}/><Text style={[font.h3,{flex:1}]}>{c.name}</Text><Icon name="chevron-right" color={T.textMute}/></View></Glass>)}</>}
    {groups.map(g=><FadeIn key={g.type}><Section title={`${g.label} (${g.hits.length})`}/>{g.hits.slice(0,25).map(h=><ItemRow key={h.item.id} item={h.item}/>)}</FadeIn>)}
  </Screen>;
}
