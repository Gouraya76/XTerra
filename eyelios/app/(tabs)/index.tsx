import React,{useMemo} from 'react';
import {Pressable,Text,View,useWindowDimensions} from 'react-native';
import {router} from 'expo-router';
import {useVault,securityChecks} from '../../src/state/vault';
import {Screen,Glass,Icon,IconBtn,BrandMark,FadeIn,Ring,CheckDot,Tile} from '../../src/ui/kit';
import {TYPES,countByType,typeDef} from '../../src/core/model';
import {ago} from '../../src/ui/items';
import {T,font} from '../../src/ui/theme';
import {scanDocument,importFromPhone} from '../../src/screens/actions';

export default function Home(){
  const v=useVault();const {width}=useWindowDimensions();const p=v.payload;
  const counts=useMemo(()=>countByType(p.items),[p.items]);
  const recent=useMemo(()=>[...p.items].sort((a,b)=>Math.max(b.updatedAt,b.viewedAt||0)-Math.max(a.updatedAt,a.viewedAt||0)).slice(0,3),[p.items]);
  const checks=securityChecks(p,v.bio.enabled);const score=checks.filter(c=>c.ok).length/checks.length;const alert=score<1;
  const name=(v.email.split('@')[0]||'').split(/[._-]/)[0];const hello=name?name[0].toUpperCase()+name.slice(1):'';
  const tileW=(width-T.gutter*2-20)/3;
  const cols=[...p.vaults].sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)).slice(0,3);
  return <Screen>
    <FadeIn style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
      <BrandMark size={58}/>
      <View style={{flex:1,marginLeft:4}}><Text style={{color:T.ice,fontSize:30,fontWeight:'800',fontStyle:'italic',letterSpacing:1.5,textShadowColor:T.electric,textShadowRadius:14}}>EYELIOS</Text>
        <Text style={[font.small,{color:T.ice,fontStyle:'italic'}]}>Coffre-fort numérique personnel</Text></View>
      <View style={{flexDirection:'row',gap:10}}>
        <View><IconBtn name="bell" size={46} label="Alertes de sécurité" onPress={()=>router.push('/security')}/>{alert&&<View style={{position:'absolute',top:9,right:11,width:9,height:9,borderRadius:5,backgroundColor:T.electric,boxShadow:T.glowStrong} as any}/>}</View>
        <IconBtn name="user" size={46} label="Compte" onPress={()=>router.navigate('/settings')}/>
      </View>
    </FadeIn>
    <FadeIn delay={60}><Text style={[font.h1,{marginTop:18,fontSize:27}]}>Bonjour{hello?' '+hello:''} 👋</Text><Text style={[font.body,{color:T.ice,marginTop:2}]}>Votre espace sécurisé et organisé</Text></FadeIn>
    <FadeIn delay={100}><Glass radius={30} padding={0} style={{marginTop:16}} onPress={()=>router.push('/search')}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:18,paddingVertical:15}}><Icon name="search" size={24}/><Text style={[font.body,{flex:1,color:T.ice,fontSize:15.5}]} numberOfLines={1}>Rechercher (mot-clé, nom, tag…)</Text><Icon name="maximize" size={22}/></View>
    </Glass></FadeIn>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:16}}>
      {TYPES.map((t,i)=><FadeIn key={t.id} delay={140+i*40}><Glass padding={8} radius={22} style={{width:tileW,height:tileW*0.86}} onPress={()=>router.push(t.id==='password'?'/passwords':t.id==='photo'||t.id==='document'?`/category/gallery?f=${t.id}`:`/category/${t.id}`)}>
        <View style={{alignItems:'center',justifyContent:'center',height:tileW*0.86-16}}>
          <Icon name={t.icon} size={32}/><Text style={{color:T.ice,fontWeight:'600',fontSize:14,textAlign:'center',marginTop:7}} numberOfLines={2} adjustsFontSizeToFit>{t.label}</Text>
          <Text style={{color:T.textDim,fontSize:12.5}}>{counts[t.id]} élément{counts[t.id]>1?'s':''}</Text></View>
      </Glass></FadeIn>)}
    </View>
    <View style={{flexDirection:'row',gap:10,marginTop:12}}>
      <Glass style={{flex:1.55}} padding={14}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14}}><Icon name="zap" size={20}/><Text style={[font.h3,{fontSize:16}]}>Accès rapide</Text></View>
        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
          {[['plus','Nouveau',()=>router.push('/add')],['maximize','Scanner',()=>scanDocument(v)],['upload-cloud','Importer',()=>importFromPhone(v)],['lock','Verrouiller',v.lock]].map(([ic,l,fn]:any)=>
            <View key={l} style={{alignItems:'center',gap:6}}><IconBtn name={ic} size={40} onPress={fn} label={l}/><Text style={{color:T.ice,fontSize:9.5}} numberOfLines={1}>{l}</Text></View>)}
        </View>
      </Glass>
      <Glass style={{flex:1}} padding={12} onPress={()=>router.push('/security')}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Icon name="shield" size={18}/><Text style={[font.h3,{fontSize:16}]}>Sécurité</Text></View>
        <View style={{alignItems:'center',marginVertical:8}}><Ring value={score} size={84}/></View>
        {checks.slice(0,3).map(c=><View key={c.label} style={{flexDirection:'row',alignItems:'center',gap:5,marginTop:4}}><CheckDot ok={c.ok} size={13}/><Text style={{color:T.ice,fontSize:9.5,flex:1}} numberOfLines={1}>{c.label.replace(' de moins de 30 jours','')}</Text></View>)}
      </Glass>
    </View>
    <View style={{flexDirection:'row',gap:10,marginTop:12,alignItems:'flex-start'}}>
      <Glass style={{flex:1}} padding={10}>
        <Pressable onPress={()=>router.push('/search')} style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8}}><Icon name="clock" size={17}/><Text style={[font.h3,{flex:1,fontSize:13.5}]} numberOfLines={1} adjustsFontSizeToFit>Récents</Text><Text style={{color:T.ice,fontSize:10}}>Tout voir ›</Text></Pressable>
        {recent.length?recent.map(i=><Glass key={i.id} blur={false} padding={7} radius={14} style={{marginBottom:6}} onPress={()=>router.push(`/item/${i.id}`)}><View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Tile size={32} letter={['password','api','card'].includes(i.type)?i.title[0]:undefined} icon={typeDef(i.type).icon}/>
          <View style={{flex:1,minWidth:0}}><Text style={{color:T.ice,fontWeight:'600',fontSize:13}} numberOfLines={1}>{i.title}</Text><Text style={{color:T.textDim,fontSize:9.5}} numberOfLines={1}>{typeDef(i.type).singular} · {ago(Math.max(i.updatedAt,i.viewedAt||0))}</Text></View>
          <Icon name="more-horizontal" size={15} color={T.textDim}/></View></Glass>)
          :<Text style={[font.small,{paddingVertical:10}]}>Aucun élément pour l’instant.</Text>}
      </Glass>
      <Glass style={{flex:0.82}} padding={10}>
        <Pressable onPress={()=>router.navigate('/vaults')} style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8}}><Icon name="layers" size={17}/><Text style={[font.h3,{flex:1,fontSize:14.5}]}>Collections</Text><Icon name="chevron-right" size={16}/></Pressable>
        {cols.map(c=><Glass key={c.id} blur={false} padding={7} radius={14} style={{marginBottom:6}} onPress={()=>router.push(`/vault/${c.id}`)}><View style={{flexDirection:'row',alignItems:'center',gap:7}}>
          <Icon name="folder" size={22} color={T.light}/><View style={{flex:1,minWidth:0}}><Text style={{color:T.ice,fontWeight:'600',fontSize:13}} numberOfLines={1}>{c.name}</Text><Text style={{color:T.textDim,fontSize:9.5}}>{p.items.filter(i=>i.vaultId===c.id).length} éléments</Text></View></View></Glass>)}
        <Glass blur={false} padding={6} radius={14} onPress={()=>router.navigate('/vaults')}><View style={{alignItems:'center'}}><Icon name="plus" size={20}/></View></Glass>
      </Glass>
    </View>
  </Screen>;
}
