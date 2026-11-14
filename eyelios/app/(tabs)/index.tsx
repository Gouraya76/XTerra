import React,{useMemo} from 'react';
import {Pressable,Text,View,useWindowDimensions,Alert} from 'react-native';
import {router} from 'expo-router';
import {useVault,securityChecks} from '../../src/state/vault';
import {Screen,Glass,Icon,IconBtn,Logo,Wordmark,FadeIn,Section,Ring,Empty} from '../../src/ui/kit';
import {ItemRow} from '../../src/ui/items';
import {TYPES,countByType} from '../../src/core/model';
import {T,font} from '../../src/ui/theme';
import {scanDocument,importFromPhone} from '../../src/screens/actions';

export default function Home(){
  const v=useVault();const {width}=useWindowDimensions();const p=v.payload;
  const counts=useMemo(()=>countByType(p.items),[p.items]);
  const recent=useMemo(()=>[...p.items].sort((a,b)=>Math.max(b.updatedAt,b.viewedAt||0)-Math.max(a.updatedAt,a.viewedAt||0)).slice(0,3),[p.items]);
  const checks=securityChecks(p,v.bio.enabled);const score=checks.filter(c=>c.ok).length/checks.length;
  const name=(v.email.split('@')[0]||'').split(/[._-]/)[0];const hello=name?name[0].toUpperCase()+name.slice(1):'';
  const tileW=(width-T.gutter*2-20)/3;
  const favVaults=[...p.vaults].sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)).slice(0,3);
  return <Screen>
    <FadeIn style={{flexDirection:'row',alignItems:'center',gap:12,marginTop:6}}>
      <Logo size={54}/>
      <View style={{flex:1}}><Wordmark size={27}/><Text style={[font.small,{fontStyle:'italic'}]}>Coffre-fort numérique personnel</Text></View>
      <IconBtn name="lock" label="Verrouiller" onPress={v.lock}/>
    </FadeIn>
    <FadeIn delay={60}><Text style={[font.h1,{marginTop:20}]}>Bonjour{hello?' '+hello:''} 👋</Text><Text style={[font.body,{marginTop:2}]}>Ton espace sécurisé et organisé</Text></FadeIn>
    <FadeIn delay={100}><Glass radius={26} padding={0} style={{marginTop:16}} onPress={()=>router.push('/search')}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:18,paddingVertical:15}}><Icon name="search" size={20}/><Text style={[font.body,{flex:1,color:T.textMute}]} numberOfLines={1}>Rechercher (mot-clé, nom, tag…)</Text><Icon name="maximize" size={18} color={T.textMute}/></View>
    </Glass></FadeIn>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:16}}>
      {TYPES.map((t,i)=><FadeIn key={t.id} delay={140+i*40}><Glass padding={12} radius={22} style={{width:tileW,minHeight:tileW*0.98}} onPress={()=>router.push(t.id==='photo'||t.id==='document'?`/category/gallery?f=${t.id}`:`/category/${t.id}`)}>
        <View style={{alignItems:'center',justifyContent:'center',gap:6,minHeight:tileW*0.98-24}}>
          <Icon name={t.icon} size={28}/><Text style={{color:T.ice,fontWeight:'700',fontSize:13.5,textAlign:'center'}} numberOfLines={2} adjustsFontSizeToFit>{t.label}</Text>
          <Text style={font.micro}>{counts[t.id]} élément{counts[t.id]>1?'s':''}</Text></View>
      </Glass></FadeIn>)}
    </View>
    <View style={{flexDirection:'row',gap:10,marginTop:12}}>
      <Glass style={{flex:1.25}} padding={14}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}><Icon name="zap" size={17}/><Text style={font.h3}>Accès rapide</Text></View>
        <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:12}}>
          {[['plus','Nouveau',()=>router.push('/add')],['maximize','Scanner',()=>scanDocument(v)],['upload-cloud','Importer',()=>importFromPhone(v)],['lock','Verrouiller',v.lock]].map(([ic,l,fn]:any)=>
            <Pressable key={l} onPress={fn} style={{width:'48%',alignItems:'center',gap:6}} accessibilityLabel={l}><IconBtn name={ic} size={46} onPress={fn}/><Text style={font.micro}>{l}</Text></Pressable>)}
        </View>
      </Glass>
      <Glass style={{flex:1}} padding={14} onPress={()=>router.push('/security')}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Icon name="shield" size={17}/><Text style={font.h3}>Sécurité</Text></View>
        <View style={{alignItems:'center',marginVertical:10}}><Ring value={score} size={92}/></View>
        {checks.slice(0,3).map(c=><View key={c.label} style={{flexDirection:'row',alignItems:'center',gap:5,marginTop:3}}><Icon name={c.ok?'check-circle':'circle'} size={12} color={c.ok?T.ice:T.textMute}/><Text style={[font.micro,{flex:1}]} numberOfLines={1}>{c.label}</Text></View>)}
      </Glass>
    </View>
    <Section title="Éléments récents" icon="clock" action={p.items.length?'Tout voir':undefined} onAction={()=>router.push('/search')}/>
    {recent.length?recent.map(i=><ItemRow key={i.id} item={i} compact/>):<Empty icon="inbox" title="Ton coffre est vide" text="Touche le bouton + pour ajouter un mot de passe, une clé API, une carte, une photo, un document ou une note."/>}
    <Section title="Collections" icon="layers" action="Tous les coffres" onAction={()=>router.navigate('/vaults')}/>
    <View style={{flexDirection:'row',gap:10}}>
      {favVaults.map(c=><Glass key={c.id} style={{flex:1}} padding={12} onPress={()=>router.push(`/vault/${c.id}`)}>
        <Icon name={c.icon} size={20}/><Text style={[font.h3,{marginTop:8,fontSize:14}]} numberOfLines={1}>{c.name}</Text>
        <Text style={font.micro}>{p.items.filter(i=>i.vaultId===c.id).length} éléments</Text></Glass>)}
    </View>
  </Screen>;
}
