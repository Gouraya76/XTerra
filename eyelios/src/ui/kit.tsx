/** Composants Liquid Glass EYELIOS. */
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Pressable,StyleProp,StyleSheet,Text,TextInput,TextInputProps,View,ViewStyle,ActivityIndicator,Modal,ScrollView,Platform,Image,useWindowDimensions,AccessibilityInfo} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {Feather} from '@expo/vector-icons';
import Svg,{Circle,Defs,LinearGradient as SG,Stop,Path} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {T,font} from './theme';
import {haptic} from '../state/vault';
import {tilt,startTilt} from './tilt';
startTilt();

export type IconName=React.ComponentProps<typeof Feather>['name'];
export const Icon=({name,size=20,color=T.ice,style}:{name:IconName|string,size?:number,color?:string,style?:any})=><Feather name={name as IconName} size={size} color={color} style={style}/>;

/** Vague lumineuse : plusieurs tracés superposés (du plus large/transparent au plus fin/brillant) pour simuler la lueur. */
function Wave({d,w,h,id}:{d:string,w:number,h:number,id:string}){
  return <><Defs><SG id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={T.electric} stopOpacity="0"/><Stop offset="0.45" stopColor={T.electric} stopOpacity="1"/><Stop offset="0.7" stopColor={T.light} stopOpacity="1"/><Stop offset="1" stopColor={T.electric} stopOpacity="0"/></SG></Defs>
    {[[30,0.04],[16,0.07],[8,0.13],[3.5,0.3],[1.3,0.7]].map(([sw,o])=><Path key={sw} d={d} stroke={`url(#${id})`} strokeWidth={sw} strokeOpacity={o} fill="none" strokeLinecap="round"/>)}</>;
}
/** Fond : dégradé charbon → noir + vagues lumineuses bleu électrique (comme le visuel de démarrage). */
/** Bande de lumière argentée (reflet large et doux) + liseré brillant sur son bord, comme sur la maquette. */
function Sheen({d,edge,id,o=1}:{d:string,edge:string,id:string,o?:number}){
  return <><Defs>
    <SG id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#DCE8F7" stopOpacity="0"/><Stop offset="0.5" stopColor="#DCE8F7" stopOpacity={0.16*o}/><Stop offset="1" stopColor="#DCE8F7" stopOpacity="0"/></SG>
    <SG id={id+'e'} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#FFFFFF" stopOpacity="0"/><Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.75*o}/><Stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/></SG></Defs>
    <Path d={d} fill={`url(#${id})`}/>
    {[[9,0.06],[4,0.14],[1.4,0.8]].map(([sw,op])=><Path key={sw} d={edge} stroke={`url(#${id}e)`} strokeWidth={sw} strokeOpacity={op} fill="none"/>)}</>;
}
/** Fond : bleu acier (charbon → ardoise) avec grands reflets argentés diagonaux. */
/** Oscillation lente et continue (sinusoïde) exécutée par le moteur natif. */
function useDrift(duration:number,delay=0,enabled=true){
  const v=useRef(new Animated.Value(0)).current;
  useEffect(()=>{if(!enabled)return;const a=Animated.loop(Animated.sequence([
    Animated.timing(v,{toValue:1,duration,delay,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
    Animated.timing(v,{toValue:0,duration,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));a.start();return ()=>a.stop();},[enabled]);
  return v;
}
let reduceMotion=false;AccessibilityInfo.isReduceMotionEnabled().then(r=>{reduceMotion=r;}).catch(()=>{});
/** Fond animé : reflets argentés qui ondulent lentement (effet « vague de chaleur »). */
export function Background({children}:{children?:React.ReactNode}){
  const {width:w,height:h}=useWindowDimensions();const on=!reduceMotion;
  const a=useDrift(9000,0,on),b=useDrift(12000,1500,on),c=useDrift(10500,800,on),glow=useDrift(7000,0,on);
  const layer=(v:Animated.Value,dx:number,dy:number,rot:number,sc:number)=>({position:'absolute' as const,left:-w*0.1,top:-h*0.05,width:w*1.2,height:h*1.1,transform:[
    {translateX:v.interpolate({inputRange:[0,1],outputRange:[-dx,dx]})},{translateY:v.interpolate({inputRange:[0,1],outputRange:[-dy,dy]})},
    {rotate:v.interpolate({inputRange:[0,1],outputRange:[`${-rot}deg`,`${rot}deg`]})},{scaleY:v.interpolate({inputRange:[0,0.5,1],outputRange:[1,sc,1]})}]});
  const W=w*1.2,H=h*1.1;
  return <View style={{flex:1,backgroundColor:'#132033'}}>
    <LinearGradient colors={['#2B4364','#1C2D45','#141F31','#1A2A42']} locations={[0,0.35,0.7,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:glow.interpolate({inputRange:[0,1],outputRange:[0.55,1]})}]}>
      <LinearGradient colors={['transparent',T.a(T.electric,0.12),'transparent']} start={{x:0,y:0.2}} end={{x:1,y:0.8}} style={StyleSheet.absoluteFill}/>
    </Animated.View>
    <Animated.View pointerEvents="none" style={layer(a,w*0.05,h*0.02,2.2,1.12)}><Svg width={W} height={H}>
      <Sheen id="s1" d={`M ${-W*0.05} ${H*0.33} C ${W*0.3} ${H*0.18}, ${W*0.6} ${H*0.06}, ${W*1.05} ${H*0.02} L ${W*1.05} ${H*0.13} C ${W*0.6} ${H*0.15}, ${W*0.3} ${H*0.25}, ${-W*0.05} ${H*0.42} Z`} edge={`M ${-W*0.05} ${H*0.33} C ${W*0.3} ${H*0.18}, ${W*0.6} ${H*0.06}, ${W*1.05} ${H*0.02}`}/></Svg></Animated.View>
    <Animated.View pointerEvents="none" style={layer(b,w*0.07,h*0.025,-2.8,1.18)}><Svg width={W} height={H}>
      <Sheen id="s2" o={0.8} d={`M ${-W*0.05} ${H*0.62} C ${W*0.35} ${H*0.5}, ${W*0.7} ${H*0.48}, ${W*1.05} ${H*0.36} L ${W*1.05} ${H*0.46} C ${W*0.7} ${H*0.58}, ${W*0.35} ${H*0.6}, ${-W*0.05} ${H*0.72} Z`} edge={`M ${-W*0.05} ${H*0.62} C ${W*0.35} ${H*0.5}, ${W*0.7} ${H*0.48}, ${W*1.05} ${H*0.36}`}/></Svg></Animated.View>
    <Animated.View pointerEvents="none" style={layer(c,w*0.06,h*0.02,2,1.14)}><Svg width={W} height={H}>
      <Sheen id="s3" o={0.9} d={`M ${-W*0.05} ${H*0.98} C ${W*0.3} ${H*0.86}, ${W*0.7} ${H*0.82}, ${W*1.05} ${H*0.7} L ${W*1.05} ${H*0.82} C ${W*0.7} ${H*0.91}, ${W*0.3} ${H*0.96}, ${-W*0.05} ${H*1.06} Z`} edge={`M ${-W*0.05} ${H*0.98} C ${W*0.3} ${H*0.86}, ${W*0.7} ${H*0.82}, ${W*1.05} ${H*0.7}`}/></Svg></Animated.View>
    {children}
  </View>;
}
/** Marque EYELIOS de la maquette : « E » italique dans une orbite lumineuse. */
export function BrandMark({size=64}:{size?:number}){
  return <Svg width={size*1.25} height={size} viewBox="0 0 125 100">
    <Defs><SG id="bm" x1="0" y1="0" x2="0.35" y2="1"><Stop offset="0" stopColor="#FFFFFF"/><Stop offset="0.46" stopColor="#EEF4FC"/><Stop offset="0.47" stopColor="#9FB4CF"/><Stop offset="0.75" stopColor="#C9D8EA"/><Stop offset="1" stopColor="#7F95B3"/></SG>
      <SG id="bo" x1="0" y1="1" x2="1" y2="0"><Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95"/><Stop offset="0.6" stopColor={T.light} stopOpacity="0.9"/><Stop offset="1" stopColor={T.electric} stopOpacity="0.2"/></SG></Defs>
    <Path d="M8 78 C 2 60, 30 22, 82 10 C 108 4, 122 12, 112 26 C 118 12, 96 10, 74 18 C 40 30, 14 58, 18 76 Z" fill="url(#bo)"/>
    <Path d="M46 26 L96 26 L90 40 L62 40 L58 50 L84 50 L79 62 L53 62 L49 73 L80 73 L74 88 L26 88 Z" fill="url(#bm)"/>
  </Svg>;
}
export function Fab({onPress,label='Ajouter'}:{onPress:()=>void,label?:string}){
  const ins=useSafeAreaInsets();
  return <View style={{position:'absolute',right:20,bottom:ins.bottom+104}}><IconBtn name="plus" size={60} active label={label} onPress={onPress}/></View>;
}
export const CheckDot=({ok=true,size=18}:{ok?:boolean,size?:number})=><View style={{width:size,height:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',backgroundColor:ok?T.electric:'transparent',borderWidth:ok?0:1.5,borderColor:T.textMute,boxShadow:ok?T.glowShadow:'none'} as any}>{ok&&<Icon name="check" size={size*0.65} color={T.ice}/>}</View>;

/** Carte de verre : remplissage translucide, contour lumineux, reflet supérieur. */
/**
 * Verre glacé : très transparent, double liseré givré (bord extérieur blanc lumineux + bord intérieur),
 * halo coloré qui transparaît, ombre portée longue et décalée (le verre « flotte » au-dessus du fond).
 */
export function Glass({children,style,onPress,onLongPress,strong,radius=T.r.lg,padding=16,disabled,blur=true}:{children?:React.ReactNode,style?:StyleProp<ViewStyle>,onPress?:()=>void,onLongPress?:()=>void,strong?:boolean,radius?:number,padding?:number,disabled?:boolean,blur?:boolean}){
  const scale=useRef(new Animated.Value(1)).current;
  const to=(v:number)=>Animated.spring(scale,{toValue:v,useNativeDriver:true,speed:40,bounciness:6}).start();
  const body=<Animated.View style={[{borderRadius:radius,transform:[{scale}],
      boxShadow:(strong?'8px 16px 30px rgba(3,8,20,0.55), 0px 0px 26px rgba(59,155,255,0.22)':'6px 14px 26px rgba(3,8,20,0.48)')+', inset 0px 0px 0px 3px rgba(255,255,255,0.07), inset 0px 2px 6px rgba(255,255,255,0.22)'} as any,style]}>
    <View style={[StyleSheet.absoluteFill,{borderRadius:radius,overflow:'hidden'}]}>
      {blur&&<BlurView intensity={strong?26:18} tint="default" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill}/>}
      <LinearGradient colors={strong?['rgba(225,236,250,0.20)','rgba(160,185,220,0.09)','rgba(140,170,215,0.12)']:['rgba(225,236,250,0.15)','rgba(160,185,220,0.06)','rgba(140,170,215,0.09)']} start={{x:0,y:0}} end={{x:0.8,y:1}} style={StyleSheet.absoluteFill}/>
      <LinearGradient colors={['transparent','rgba(59,155,255,0.16)','rgba(140,203,255,0.10)']} locations={[0.45,0.85,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
      <LinearGradient colors={['rgba(255,255,255,0.16)','rgba(255,255,255,0.04)','transparent']} locations={[0,0.18,0.42]} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFill}/>
    </View>
    <WindowReflection radius={radius} opacity={strong?0.3:0.24}/>
    <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)','rgba(255,255,255,0.95)','rgba(255,255,255,0)']} start={{x:0,y:0}} end={{x:1,y:0}} style={{position:'absolute',top:0,left:radius*0.5,right:radius*0.5,height:1.5,borderRadius:1}}/>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:radius,borderWidth:1.6,borderColor:strong?'rgba(255,255,255,0.62)':'rgba(255,255,255,0.45)'}]}/>
    <View pointerEvents="none" style={{position:'absolute',top:3,left:3,right:3,bottom:3,borderRadius:Math.max(radius-3,4),borderWidth:1,borderColor:'rgba(255,255,255,0.10)'}}/>
    <View style={{padding}}>{children}</View>
  </Animated.View>;
  if(!onPress&&!onLongPress)return body;
  return <Pressable disabled={disabled} onPress={()=>{haptic();onPress?.();}} onLongPress={onLongPress} onPressIn={()=>to(0.97)} onPressOut={()=>to(1)} accessibilityRole="button">{body}</Pressable>;
}

/**
 * Surface « liquid glass » 3D (boutons, icônes, filtres) : remplissage translucide bombé, bord intérieur lumineux en haut,
 * ombre intérieure en bas, ombre portée douce. Teinte bleue pour l'état actif / principal.
 */
/** Voile miroir : reflet de vitre polie sur la moitié haute, bord inférieur net et arrondi. */
const REFLECTION=require('../../assets/glass-reflection.png');
/**
 * Reflet de vitre : l'environnement (lumière de baie vitrée, montants, silhouette fantôme) se reflète faiblement
 * dans le verre et glisse selon l'inclinaison du téléphone.
 */
export function WindowReflection({radius,opacity=0.16,travel=14}:{radius:number,opacity?:number,travel?:number}){
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:radius,overflow:'hidden'}]}>
    <Animated.Image source={REFLECTION} resizeMode="cover" style={{position:'absolute',top:'-25%',left:'-25%',width:'150%',height:'150%',opacity,
      transform:[{translateX:tilt.x.interpolate({inputRange:[-1,1],outputRange:[travel,-travel]})},{translateY:tilt.y.interpolate({inputRange:[-1,1],outputRange:[-travel,travel]})}]}}/>
    <LinearGradient colors={['rgba(255,255,255,0.13)','rgba(255,255,255,0.03)','transparent']} locations={[0,0.45,0.75]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
  </View>;
}
export function Mirror({radius,strong}:{radius:number,strong?:boolean}){
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:radius,overflow:'hidden'}]}>
    <View style={{position:'absolute',top:1.5,left:'4%',right:'4%',height:'52%',overflow:'hidden',borderTopLeftRadius:radius,borderTopRightRadius:radius,borderBottomLeftRadius:999,borderBottomRightRadius:999}}>
      <LinearGradient colors={[`rgba(255,255,255,${strong?0.65:0.55})`,`rgba(255,255,255,${strong?0.24:0.18})`,`rgba(255,255,255,${strong?0.1:0.07})`]} locations={[0,0.6,1]} style={StyleSheet.absoluteFill}/>
    </View>
  </View>;
}
export function Bubble({radius,tone='clear',children,style}:{radius:number,tone?:'clear'|'blue',children?:React.ReactNode,style?:StyleProp<ViewStyle>}){
  const blue=tone==='blue';
  return <View style={[{borderRadius:radius,boxShadow:blue
      ?'5px 12px 22px rgba(37,99,235,0.55), 0px 0px 22px rgba(59,155,255,0.45), inset 0px 2px 3px rgba(255,255,255,0.85), inset 0px -5px 10px rgba(10,40,110,0.5)'
      :'5px 11px 20px rgba(3,8,20,0.5), inset 0px 2px 3px rgba(255,255,255,0.7), inset 0px -4px 9px rgba(5,15,35,0.35)'} as any,style]}>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:radius,overflow:'hidden'}]}>
      <LinearGradient colors={blue?['rgba(125,190,255,0.95)','rgba(59,130,246,0.9)','rgba(29,78,216,0.95)']:['rgba(220,232,248,0.30)','rgba(150,175,210,0.16)','rgba(110,135,175,0.20)']} start={{x:0.2,y:0}} end={{x:0.8,y:1}} style={StyleSheet.absoluteFill}/>
    </View>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:radius,borderWidth:1.6,borderColor:blue?'rgba(225,240,255,0.95)':'rgba(255,255,255,0.6)'}]}/>
    <WindowReflection radius={radius} opacity={blue?0.22:0.2} travel={6}/>
    {children}
    <Mirror radius={radius} strong={blue}/>
  </View>;
}
export function Btn({title,icon,onPress,kind='glass',small,disabled,style}:{title:string,icon?:string,onPress?:()=>void,kind?:'primary'|'glass'|'danger',small?:boolean,disabled?:boolean,style?:StyleProp<ViewStyle>}){
  const scale=useRef(new Animated.Value(1)).current;const primary=kind==='primary';const r=small?18:24;
  return <Pressable disabled={disabled} onPress={()=>{haptic();onPress?.();}} onPressIn={()=>Animated.spring(scale,{toValue:0.95,useNativeDriver:true,speed:50}).start()} onPressOut={()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,speed:20,bounciness:10}).start()} style={[{flexGrow:1},style]} accessibilityRole="button">
    <Animated.View style={{opacity:disabled?0.45:1,transform:[{scale}]}}>
      <Bubble radius={r} tone={primary?'blue':'clear'}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:small?10:15,paddingHorizontal:small?14:20}}>
          {icon&&<Icon name={icon} size={small?15:17}/>}
          <Text numberOfLines={1} style={{color:T.ice,fontWeight:'700',fontSize:small?13:15,textShadowColor:'rgba(0,0,0,0.25)',textShadowRadius:2,textShadowOffset:{width:0,height:1}}}>{title}</Text>
        </View>
      </Bubble>
    </Animated.View>
  </Pressable>;
}

export function IconBtn({name,onPress,size=40,label,active}:{name:string,onPress?:()=>void,size?:number,label?:string,active?:boolean}){
  const scale=useRef(new Animated.Value(1)).current;
  return <Pressable onPress={()=>{haptic();onPress?.();}} onPressIn={()=>Animated.spring(scale,{toValue:0.9,useNativeDriver:true,speed:50}).start()} onPressOut={()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,speed:20,bounciness:12}).start()} hitSlop={8} accessibilityLabel={label}>
    <Animated.View style={{transform:[{scale}]}}><Bubble radius={size/2} tone={active?'blue':'clear'} style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><Icon name={name} size={size*0.46}/></Bubble></Animated.View>
  </Pressable>;
}

export function Input({label,icon,secret,right,style,...p}:TextInputProps&{label?:string,icon?:string,secret?:boolean,right?:React.ReactNode}){
  const [show,setShow]=useState(false);const [focus,setFocus]=useState(false);
  return <View style={[{marginBottom:12},style]}>
    {label&&<Text style={[font.small,{marginBottom:6,marginLeft:4}]}>{label}</Text>}
    <View style={{flexDirection:'row',alignItems:p.multiline?'flex-start':'center',borderWidth:1.6,borderColor:focus?'rgba(200,228,255,0.95)':'rgba(255,255,255,0.5)',backgroundColor:'rgba(225,236,250,0.13)',boxShadow:(focus?'0px 0px 20px rgba(59,155,255,0.4), ':'')+'4px 10px 20px rgba(3,8,20,0.4), inset 0px 2px 4px rgba(255,255,255,0.25)',paddingHorizontal:14,borderRadius:22} as any}>
      {icon&&<Icon name={icon} size={18} color={T.textMute} style={{marginRight:10,marginTop:p.multiline?14:0}}/>}
      <TextInput placeholderTextColor={T.a(T.ice,0.38)} selectionColor={T.ice} autoCapitalize="none" autoCorrect={false} {...p}
        secureTextEntry={secret&&!show} onFocus={e=>{setFocus(true);p.onFocus?.(e);}} onBlur={e=>{setFocus(false);p.onBlur?.(e);}}
        style={[{flex:1,color:T.ice,fontSize:15,paddingVertical:14,minHeight:p.multiline?120:50,textAlignVertical:p.multiline?'top':'center'}]}/>
      {secret&&<Pressable hitSlop={10} onPress={()=>setShow(!show)} accessibilityLabel={show?'Masquer':'Afficher'}><Icon name={show?'eye-off':'eye'} size={18} color={T.textDim}/></Pressable>}
      {right}
    </View>
  </View>;
}

export function Screen({title,subtitle,back=true,right,children,scroll=true,pad=true}:{title?:string,subtitle?:string,back?:boolean,right?:React.ReactNode,children:React.ReactNode,scroll?:boolean,pad?:boolean}){
  const ins=useSafeAreaInsets();
  const head=title!==undefined&&<View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:T.gutter,paddingTop:ins.top+10,paddingBottom:12}}>
    <View style={{width:44}}>{back&&<Pressable hitSlop={12} accessibilityLabel="Retour" onPress={()=>{haptic();router.canGoBack()?router.back():router.replace('/');}}><Icon name="chevron-left" size={28}/></Pressable>}</View>
    <View style={{flex:1,alignItems:'center'}}><Text style={[font.h2,{fontSize:21}]} numberOfLines={1}>{title}</Text>{!!subtitle&&<Text style={[font.small,{color:T.textDim}]} numberOfLines={1}>{subtitle}</Text>}</View>
    <View style={{minWidth:44,alignItems:'flex-end'}}>{right}</View>
  </View>;
  return <Background>{head}
    {scroll?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:pad?T.gutter:0,paddingBottom:ins.bottom+120,paddingTop:title===undefined?ins.top+8:4}} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      :<View style={{flex:1,paddingHorizontal:pad?T.gutter:0}}>{children}</View>}
  </Background>;
}

export function FadeIn({children,delay=0,style}:{children:React.ReactNode,delay?:number,style?:StyleProp<ViewStyle>}){
  const v=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(v,{toValue:1,duration:380,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();},[]);
  return <Animated.View style={[style,{opacity:v,transform:[{translateY:v.interpolate({inputRange:[0,1],outputRange:[14,0]})}]}]}>{children}</Animated.View>;
}

export const Section=({title,action,onAction,icon}:{title:string,action?:string,onAction?:()=>void,icon?:string})=>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:22,marginBottom:10,paddingHorizontal:2}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>{icon&&<Icon name={icon} size={17}/>}<Text style={font.h3}>{title}</Text></View>
    {action&&<Pressable hitSlop={8} onPress={onAction}><Text style={[font.small,{color:T.textDim}]}>{action} ›</Text></Pressable>}
  </View>;

export function Chip({label,active,onPress,icon}:{label:string,active?:boolean,onPress?:()=>void,icon?:string}){
  return <Pressable onPress={()=>{haptic();onPress?.();}} style={{paddingVertical:3}}>
    <Bubble radius={20} tone={active?'blue':'clear'}><View style={{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:8,paddingHorizontal:16}}>
      {icon&&<Icon name={icon} size={13}/>}<Text style={{color:T.ice,fontSize:13,fontWeight:active?'700':'600'}}>{label}</Text></View></Bubble>
  </Pressable>;
}

/** Tuile d'icône : initiale du service (pas de logos de marques), ou icône de catégorie. */
export function Tile({icon,letter,size=46}:{icon?:string,letter?:string,size?:number}){
  return <View style={{width:size,height:size,borderRadius:size*0.26,overflow:'hidden',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:T.a(T.ice,0.18)}}>
    <LinearGradient colors={['#1A2436','#0B111C']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
    {letter?<Text style={{color:T.ice,fontSize:size*0.42,fontWeight:'800'}}>{letter.toUpperCase()}</Text>:<Icon name={icon||'box'} size={size*0.45}/>}<Mirror radius={size*0.26}/>
  </View>;
}

/** Anneau de sécurité (valeur réelle calculée). */
export function Ring({value,size=120,label,children}:{value:number,size?:number,label?:string,children?:React.ReactNode}){
  const sw=Math.max(6,size*0.07),r=(size-sw*2)/2,c=2*Math.PI*r;const anim=useRef(new Animated.Value(0)).current;const [v,setV]=useState(0);
  useEffect(()=>{const id=anim.addListener(x=>setV(x.value));Animated.timing(anim,{toValue:value,duration:900,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();return ()=>anim.removeListener(id);},[value]);
  return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center',borderRadius:size/2,boxShadow:T.glowStrong} as any}>
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs><SG id="rg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={T.light}/><Stop offset="1" stopColor={T.electric}/></SG></Defs>
      <Circle cx={size/2} cy={size/2} r={r} stroke={T.a(T.electric,0.18)} strokeWidth={sw} fill="rgba(10,20,38,0.45)"/>
      <Circle cx={size/2} cy={size/2} r={r} stroke="url(#rg)" strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={`${c*v} ${c}`} transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <Circle cx={size/2} cy={size/2} r={r+sw*0.9} stroke={T.a(T.light,0.3)} strokeWidth={1} fill="none"/>
    </Svg>
    {children}<Text style={{color:T.ice,fontSize:size*(children?0.17:0.2),fontWeight:'700'}}>{Math.round(v*100)}%</Text>
    {label&&<Text style={[font.small,{marginTop:2,color:T.ice}]}>{label}</Text>}
  </View>;
}

/** Logo officiel EYELIOS (fourni par le propriétaire). */
export const Logo=({size=56}:{size?:number})=><Image source={require('../../assets/logo.png')} style={{width:size,height:size,borderRadius:size*0.22}} accessibilityLabel="Logo EYELIOS"/>;
export const Wordmark=({size=30}:{size?:number})=><Text style={{color:T.ice,fontSize:size,fontWeight:'800',fontStyle:'italic',letterSpacing:size*0.06,textShadowColor:T.electric,textShadowRadius:size*0.5,textShadowOffset:{width:0,height:0}}}>EYELIOS</Text>;

export function Busy({text}:{text:string}){
  return <Modal visible={!!text} transparent animationType="fade" statusBarTranslucent>
    <View style={{flex:1,backgroundColor:T.a(T.black,0.72),alignItems:'center',justifyContent:'center',padding:32}}>
      <Glass strong style={{width:'100%',maxWidth:340}} padding={26}>
        <View style={{alignItems:'center',gap:14}}><ActivityIndicator size="large" color={T.ice}/><Text style={[font.h3,{textAlign:'center'}]}>{text}</Text>
          <Text style={[font.small,{textAlign:'center'}]}>Calcul sécurisé de la clé de chiffrement. Quelques secondes…</Text></View>
      </Glass>
    </View>
  </Modal>;
}
export function ToastView({toast}:{toast:{id:number,text:string,icon?:string}|null}){
  const v=useRef(new Animated.Value(0)).current;const ins=useSafeAreaInsets();
  useEffect(()=>{if(toast)Animated.sequence([Animated.spring(v,{toValue:1,useNativeDriver:true,speed:18}),Animated.delay(1600),Animated.timing(v,{toValue:0,duration:250,useNativeDriver:true})]).start();},[toast?.id]);
  if(!toast)return null;
  return <Animated.View pointerEvents="none" style={{position:'absolute',left:24,right:24,bottom:ins.bottom+100,alignItems:'center',opacity:v,transform:[{translateY:v.interpolate({inputRange:[0,1],outputRange:[20,0]})}]}}>
    <Glass strong padding={0} radius={22}><View style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:18}}><Icon name={toast.icon||'check'} size={16}/><Text style={{color:T.ice,fontWeight:'600'}}>{toast.text}</Text></View></Glass>
  </Animated.View>;
}

/** Feuille modale en verre (choix, formulaires courts). */
export function Sheet({visible,onClose,title,children}:{visible:boolean,onClose:()=>void,title:string,children:React.ReactNode}){
  const ins=useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <Pressable style={{flex:1,backgroundColor:T.a(T.black,0.6)}} onPress={onClose}/>
    <View style={{backgroundColor:T.charcoal,borderTopLeftRadius:30,borderTopRightRadius:30,borderTopWidth:1,borderColor:T.glassBorderStrong,paddingHorizontal:T.gutter,paddingTop:10,paddingBottom:ins.bottom+18,maxHeight:'88%'}}>
      <LinearGradient colors={[T.a(T.ice,0.1),'transparent']} style={[StyleSheet.absoluteFill,{borderTopLeftRadius:30,borderTopRightRadius:30}]}/>
      <View style={{alignSelf:'center',width:44,height:4,borderRadius:2,backgroundColor:T.a(T.ice,0.35),marginBottom:14}}/>
      <Text style={[font.h2,{marginBottom:14}]}>{title}</Text>
      <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </View>
  </Modal>;
}
export const Empty=({icon,title,text}:{icon:string,title:string,text:string})=><Glass style={{marginTop:8}}><View style={{alignItems:'center',gap:8,paddingVertical:18}}><Icon name={icon} size={30} color={T.textDim}/><Text style={font.h3}>{title}</Text><Text style={[font.small,{textAlign:'center'}]}>{text}</Text></View></Glass>;
export const mask='••••••••';
const styles=StyleSheet.create({
  shadow:Platform.select({android:{elevation:0},default:{shadowColor:'#000',shadowOpacity:0.35,shadowRadius:18,shadowOffset:{width:0,height:10}}})!,

});
