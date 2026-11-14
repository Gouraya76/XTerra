/** Écran de démarrage animé (design fourni par le propriétaire). L'anneau suit l'initialisation réelle et une animation minimale. */
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Image,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {Ring} from '../ui/kit';
import {T,font} from '../ui/theme';
export default function Splash({ready,onDone}:{ready:boolean,onDone:()=>void}){
  const {width}=useWindowDimensions();const fade=useRef(new Animated.Value(0)).current;const [p,setP]=useState(0.15);
  useEffect(()=>{Animated.timing(fade,{toValue:1,duration:600,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();const t=setTimeout(()=>setP(0.6),350);return ()=>clearTimeout(t);},[]);
  useEffect(()=>{if(!ready)return;const a=setTimeout(()=>setP(1),500);const b=setTimeout(onDone,1500);return ()=>{clearTimeout(a);clearTimeout(b);};},[ready]);
  const w=Math.min(width*0.92,520);
  return <View style={{flex:1,backgroundColor:'#000',alignItems:'center',justifyContent:'center'}}>
    <Animated.View style={{alignItems:'center',opacity:fade,transform:[{scale:fade.interpolate({inputRange:[0,1],outputRange:[0.94,1]})}]}}>
      <Image source={require('../../assets/splash-hero.png')} style={{width:w,height:w*470/546}} resizeMode="contain" accessibilityLabel="EYELIOS"/>
      <View style={{height:44}}/><Ring value={p} size={86}/>
      <Text style={[font.h3,{marginTop:16}]}>Démarrage d’EYELIOS…</Text>
    </Animated.View>
  </View>;
}
