import React from 'react';
import {Tabs,router} from 'expo-router';
import {Pressable,Text,View,StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from '../../src/ui/kit';
import {T} from '../../src/ui/theme';
import {haptic} from '../../src/state/vault';

const TABS:{name:string,label:string,icon:string}[]=[{name:'index',label:'Accueil',icon:'home'},{name:'vaults',label:'Coffres',icon:'layers'},{name:'add',label:'Ajouter',icon:'plus'},{name:'assistant',label:'Assistant IA',icon:'zap'},{name:'settings',label:'Paramètres',icon:'settings'}];
function TabBar({state}:any){
  const ins=useSafeAreaInsets();
  return <View style={{position:'absolute',left:12,right:12,bottom:ins.bottom+10,borderRadius:28,overflow:'hidden',borderWidth:1,borderColor:T.glassBorder}}>
    <LinearGradient colors={[T.a(T.slate,0.97),T.a(T.charcoal,0.98)]} style={StyleSheet.absoluteFill}/>
    <View style={{position:'absolute',top:0,left:30,right:30,height:1,backgroundColor:T.sheen,opacity:0.5}}/>
    <View style={{flexDirection:'row',alignItems:'center',paddingVertical:8,paddingHorizontal:4}}>
      {TABS.map((t,i)=>{const on=state.index===i;const center=t.name==='add';
        return <Pressable key={t.name} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{selected:on}} onPress={()=>{haptic();router.navigate(t.name==='index'?'/':('/'+t.name) as any);}} style={{flex:1,alignItems:'center'}}>
          {center?<View style={{width:54,height:54,borderRadius:27,overflow:'hidden',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:T.ice,shadowColor:T.ice,shadowOpacity:0.5,shadowRadius:12}}>
              <LinearGradient colors={[T.ice,'#CBD5E1']} style={StyleSheet.absoluteFill}/><Icon name="plus" size={26} color={T.black}/></View>
            :<View style={{alignItems:'center',paddingVertical:6,paddingHorizontal:10,borderRadius:18,backgroundColor:on?T.a(T.ice,0.16):'transparent',borderWidth:1,borderColor:on?T.glassBorderStrong:'transparent'}}>
              <Icon name={t.icon} size={21} color={on?T.ice:T.textMute}/>
              <Text numberOfLines={1} style={{fontSize:10,marginTop:3,color:on?T.ice:T.textMute,fontWeight:on?'700':'500'}}>{t.label}</Text></View>}
        </Pressable>;})}
    </View>
  </View>;
}
export default function TabsLayout(){return <Tabs tabBar={p=><TabBar {...p}/>} screenOptions={{headerShown:false,sceneStyle:{backgroundColor:T.black},animation:'fade'}}>
  {TABS.map(t=><Tabs.Screen key={t.name} name={t.name}/>)}</Tabs>;}
