import React from 'react';
import {Tabs,router} from 'expo-router';
import {Pressable,Text,View,StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from '../../src/ui/kit';
import {T} from '../../src/ui/theme';
import {haptic} from '../../src/state/vault';

const TABS:{name:string,label:string,icon:string}[]=[{name:'index',label:'Accueil',icon:'home'},{name:'vaults',label:'Coffres',icon:'layers'},{name:'add',label:'Ajouter',icon:'plus'},{name:'assistant',label:'Assistant IA',icon:'zap'},{name:'settings',label:'Paramètres',icon:'settings'}];
function TabBar({state}:any){
  const ins=useSafeAreaInsets();
  return <View style={{position:'absolute',left:12,right:12,bottom:ins.bottom+10,borderRadius:28,borderWidth:1,borderColor:T.edge,boxShadow:T.glowShadow} as any}>
    <View style={[StyleSheet.absoluteFill,{borderRadius:28,overflow:'hidden'}]}><BlurView intensity={40} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill}/>
    <LinearGradient colors={[T.a(T.slate,0.75),T.a(T.charcoal,0.85)]} style={StyleSheet.absoluteFill}/></View>
    <View style={{position:'absolute',top:0,left:30,right:30,height:1,backgroundColor:T.sheen,opacity:0.5}}/>
    <View style={{flexDirection:'row',alignItems:'center',paddingVertical:8,paddingHorizontal:4}}>
      {TABS.map((t,i)=>{const on=state.index===i;const center=t.name==='add';
        return <Pressable key={t.name} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{selected:on}} onPress={()=>{haptic();router.navigate(t.name==='index'?'/':('/'+t.name) as any);}} style={{flex:1,alignItems:'center'}}>
          {center?<View style={{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:T.light,boxShadow:T.glowStrong} as any}>
              <LinearGradient colors={[T.electric,T.deep]} style={[StyleSheet.absoluteFill,{borderRadius:28}]}/><Icon name="plus" size={28} color={T.ice}/></View>
            :<View style={{alignItems:'center',paddingVertical:6,paddingHorizontal:10,borderRadius:18,backgroundColor:on?T.a(T.electric,0.35):'transparent',borderWidth:1,borderColor:on?T.light:'transparent',boxShadow:on?T.glowStrong:'none'} as any}>
              <Icon name={t.icon} size={21} color={on?T.ice:T.textMute}/>
              <Text numberOfLines={1} style={{fontSize:10,marginTop:3,color:on?T.ice:T.textMute,fontWeight:on?'700':'500'}}>{t.label}</Text></View>}
        </Pressable>;})}
    </View>
  </View>;
}
export default function TabsLayout(){return <Tabs tabBar={p=><TabBar {...p}/>} screenOptions={{headerShown:false,sceneStyle:{backgroundColor:T.black},animation:'fade'}}>
  {TABS.map(t=><Tabs.Screen key={t.name} name={t.name}/>)}</Tabs>;}
