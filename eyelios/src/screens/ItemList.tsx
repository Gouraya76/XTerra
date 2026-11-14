/** Liste filtrable/triable d'éléments (catégorie ou coffre). */
import React,{useMemo,useState} from 'react';
import {ScrollView,Text,View} from 'react-native';
import {useVault} from '../state/vault';
import {Chip,Input,Empty,FadeIn} from '../ui/kit';
import {ItemRow} from '../ui/items';
import {Item,SORTS,SortKey,sortItems,TYPES} from '../core/model';
import {search} from '../core/search';
import {font} from '../ui/theme';

export function ItemList({items,byVault,byType}:{items:Item[],byVault?:boolean,byType?:boolean}){
  const v=useVault();const [q,setQ]=useState(''),[filter,setFilter]=useState('all'),[sort,setSort]=useState<SortKey>('recent'),[tag,setTag]=useState('');
  const tags=useMemo(()=>[...new Set(items.flatMap(i=>i.tags))].slice(0,12),[items]);
  const list=useMemo(()=>{let a=q.trim()?search(items,v.payload.vaults,q).map(h=>h.item):items;
    if(filter==='fav')a=a.filter(i=>i.favorite);else if(filter.startsWith('v:'))a=a.filter(i=>i.vaultId===filter.slice(2));else if(filter.startsWith('t:'))a=a.filter(i=>i.type===filter.slice(2));
    if(tag)a=a.filter(i=>i.tags.includes(tag));return q.trim()?a:sortItems(a,sort);},[items,q,filter,sort,tag,v.payload.vaults]);
  return <>
    <Input icon="search" placeholder="Rechercher…" value={q} onChangeText={setQ} style={{marginBottom:10}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingRight:16}} style={{marginBottom:8}}>
      <Chip label="Tous" active={filter==='all'} onPress={()=>setFilter('all')}/><Chip label="Favoris" icon="star" active={filter==='fav'} onPress={()=>setFilter('fav')}/>
      {byVault&&v.payload.vaults.map(c=><Chip key={c.id} label={c.name} active={filter==='v:'+c.id} onPress={()=>setFilter('v:'+c.id)}/>)}
      {byType&&TYPES.map(t=><Chip key={t.id} label={t.label} active={filter==='t:'+t.id} onPress={()=>setFilter('t:'+t.id)}/>)}
    </ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingRight:16}} style={{marginBottom:14}}>
      {(Object.keys(SORTS) as SortKey[]).map(k=><Chip key={k} icon="bar-chart-2" label={SORTS[k]} active={sort===k} onPress={()=>setSort(k)}/>)}
      {tags.map(t=><Chip key={t} icon="tag" label={t} active={tag===t} onPress={()=>setTag(tag===t?'':t)}/>)}
    </ScrollView>
    <Text style={[font.micro,{marginBottom:8}]}>{list.length} résultat{list.length>1?'s':''}</Text>
    {list.length?list.map((i,n)=><FadeIn key={i.id} delay={Math.min(n,8)*30}><ItemRow item={i}/></FadeIn>):<Empty icon="search" title="Aucun élément" text={items.length?'Essaie un autre mot-clé ou filtre.':'Touche + pour ajouter ton premier élément.'}/>}
  </>;
}
