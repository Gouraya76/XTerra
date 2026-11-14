import React,{useState} from 'react';
import {Text,View,Switch} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Btn,Icon} from '../src/ui/kit';
import {generatePassword,strength,DEFAULT_GEN,GenOpts} from '../src/core/password';
import {T,font} from '../src/ui/theme';
export let pendingGenerated:string|null=null;export const takeGenerated=()=>{const g=pendingGenerated;pendingGenerated=null;return g;};

export function GenControls({opts,set}:{opts:GenOpts,set:(o:GenOpts)=>void}){
  const row=(k:keyof GenOpts,l:string)=><View key={k} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:8}}><Text style={font.body}>{l}</Text>
    <Switch value={opts[k] as boolean} onValueChange={x=>set({...opts,[k]:x})} trackColor={{true:T.steel,false:T.slate}} thumbColor={T.ice}/></View>;
  return <>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}><Text style={font.body}>Longueur : {opts.length}</Text>
      <View style={{flexDirection:'row',gap:8}}>{[-4,-1,1,4].map(d=><Btn key={d} small title={(d>0?'+':'')+d} onPress={()=>set({...opts,length:Math.max(8,Math.min(64,opts.length+d))})} style={{flexGrow:0}}/>)}</View></View>
    {row('upper','Majuscules (A-Z)')}{row('lower','Minuscules (a-z)')}{row('digits','Chiffres (2-9)')}{row('symbols','Symboles (!#$…)')}
  </>;
}
export default function Generator(){
  const v=useVault();const {pick}=useLocalSearchParams<{pick?:string}>();const [o,setO]=useState<GenOpts>(DEFAULT_GEN);const [pw,setPw]=useState(()=>generatePassword(DEFAULT_GEN));
  const set=(n:GenOpts)=>{setO(n);setPw(generatePassword(n));};const s=strength(pw);
  return <Screen title="Générateur" subtitle="Mot de passe aléatoire sécurisé">
    <Glass strong padding={20}><Text selectable style={{color:T.ice,fontSize:21,fontFamily:'monospace',textAlign:'center',lineHeight:30}}>{pw}</Text>
      <View style={{height:4,borderRadius:2,backgroundColor:T.a(T.ice,0.12),marginTop:16}}><View style={{height:4,borderRadius:2,width:`${s.score*100}%`,backgroundColor:T.ice}}/></View>
      <Text style={[font.micro,{textAlign:'center',marginTop:6}]}>{s.label} · ~{s.bits} bits d’entropie</Text>
      <View style={{flexDirection:'row',gap:10,marginTop:16}}><Btn icon="refresh-cw" title="Régénérer" onPress={()=>setPw(generatePassword(o))}/><Btn icon="copy" title="Copier" onPress={()=>v.copy(pw,'Mot de passe')}/></View>
    </Glass>
    <Glass style={{marginTop:12}}><GenControls opts={o} set={set}/></Glass>
    {pick&&<Btn kind="primary" icon="check" title="Utiliser ce mot de passe" style={{marginTop:14}} onPress={()=>{pendingGenerated=pw;router.back();}}/>}
  </Screen>;
}
