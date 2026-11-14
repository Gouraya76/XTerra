/** Écran de démarrage plein écran (visuel fourni par le propriétaire). Anneau et texte animés superposés à l'emplacement d'origine. */
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Image,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {Ring} from '../ui/kit';
import {font} from '../ui/theme';
const RATIO=1175/538; // proportions du visuel
export default function Splash({ready,onDone}:{ready:boolean,onDone:()=>void}){
  const {width,height}=useWindowDimensions();const fade=useRef(new Animated.Value(0)).current;const [p,setP]=useState(0.12);
  useEffect(()=>{Animated.timing(fade,{toValue:1,duration:500,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();const t=setTimeout(()=>setP(0.6),300);return ()=>clearTimeout(t);},[]);
  useEffect(()=>{if(!ready)return;const a=setTimeout(()=>setP(1),150);const b=setTimeout(onDone,650);return ()=>{clearTimeout(a);clearTimeout(b);};},[ready]);
  // « cover » : on calcule la position réelle de la zone de l'anneau dans l'image affichée
  const imgH=Math.max(height,width*RATIO);const top=(height-imgH)/2+imgH*0.645;
  return <View style={{flex:1,backgroundColor:'#02040A'}}>
    <Image source={require('../../assets/splash-full.png')} style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]} resizeMode="cover" accessibilityLabel="EYELIOS — IA, analyse, sécurité, productivité"/>
    <Animated.View style={{position:'absolute',top,left:0,right:0,alignItems:'center',opacity:fade}}>
      <Ring value={p} size={Math.round(imgH*0.085)}/>
      <Text style={[font.h3,{marginTop:14,fontSize:15}]}>Démarrage d’EYELIOS…</Text>
    </Animated.View>
  </View>;
}
