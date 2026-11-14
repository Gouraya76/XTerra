/** Composants Liquid Glass EYELIOS. */
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Pressable,StyleProp,StyleSheet,Text,TextInput,TextInputProps,View,ViewStyle,ActivityIndicator,Modal,ScrollView,Platform,Image} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Feather} from '@expo/vector-icons';
import Svg,{Circle,Defs,LinearGradient as SG,Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {T,font} from './theme';
import {haptic} from '../state/vault';

export type IconName=React.ComponentProps<typeof Feather>['name'];
export const Icon=({name,size=20,color=T.ice,style}:{name:IconName|string,size?:number,color?:string,style?:any})=><Feather name={name as IconName} size={size} color={color} style={style}/>;

/** Fond : dégradé charbon → noir avec deux reflets lumineux diagonaux discrets. */
export function Background({children}:{children?:React.ReactNode}){
  return <View style={{flex:1,backgroundColor:T.black}}>
    <LinearGradient colors={[T.slate,T.charcoal,T.black]} locations={[0,0.42,1]} start={{x:0.1,y:0}} end={{x:0.9,y:1}} style={StyleSheet.absoluteFill}/>
    <LinearGradient pointerEvents="none" colors={['transparent',T.a(T.ice,0.07),'transparent']} start={{x:0,y:0.15}} end={{x:1,y:0.42}} style={StyleSheet.absoluteFill}/>
    <LinearGradient pointerEvents="none" colors={['transparent',T.a(T.steel,0.16),'transparent']} start={{x:1,y:0.55}} end={{x:0,y:0.9}} style={StyleSheet.absoluteFill}/>
    {children}
  </View>;
}

/** Carte de verre : remplissage translucide, contour lumineux, reflet supérieur. */
export function Glass({children,style,onPress,onLongPress,strong,radius=T.r.lg,padding=16,disabled}:{children?:React.ReactNode,style?:StyleProp<ViewStyle>,onPress?:()=>void,onLongPress?:()=>void,strong?:boolean,radius?:number,padding?:number,disabled?:boolean}){
  const scale=useRef(new Animated.Value(1)).current;
  const to=(v:number)=>Animated.spring(scale,{toValue:v,useNativeDriver:true,speed:40,bounciness:6}).start();
  const body=<Animated.View style={[{borderRadius:radius,overflow:'hidden',transform:[{scale}]},styles.shadow,style]}>
    <LinearGradient colors={strong?[T.a(T.ice,0.2),T.a(T.ice,0.06)]:[T.glassTop,T.glassBottom]} start={{x:0,y:0}} end={{x:0.7,y:1}} style={StyleSheet.absoluteFill}/>
    <LinearGradient pointerEvents="none" colors={[T.a(T.ice,0.16),'transparent']} start={{x:0,y:0}} end={{x:0,y:0.35}} style={StyleSheet.absoluteFill}/>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:radius,borderWidth:1,borderColor:strong?T.glassBorderStrong:T.glassBorder}]}/>
    <View pointerEvents="none" style={{position:'absolute',top:0,left:radius*0.6,right:radius*0.6,height:1,backgroundColor:T.sheen,opacity:0.55}}/>
    <View style={{padding}}>{children}</View>
  </Animated.View>;
  if(!onPress&&!onLongPress)return body;
  return <Pressable disabled={disabled} onPress={()=>{haptic();onPress?.();}} onLongPress={onLongPress} onPressIn={()=>to(0.97)} onPressOut={()=>to(1)} accessibilityRole="button">{body}</Pressable>;
}

export function Btn({title,icon,onPress,kind='glass',small,disabled,style}:{title:string,icon?:string,onPress?:()=>void,kind?:'primary'|'glass'|'danger',small?:boolean,disabled?:boolean,style?:StyleProp<ViewStyle>}){
  const scale=useRef(new Animated.Value(1)).current;const primary=kind==='primary';
  return <Pressable disabled={disabled} onPress={()=>{haptic();onPress?.();}} onPressIn={()=>Animated.spring(scale,{toValue:0.96,useNativeDriver:true,speed:50}).start()} onPressOut={()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,speed:30}).start()} style={[{flexGrow:1},style]} accessibilityRole="button">
    <Animated.View style={[{borderRadius:16,overflow:'hidden',opacity:disabled?0.45:1,transform:[{scale}]},primary&&styles.glowShadow]}>
      <LinearGradient colors={primary?[T.ice,'#CBD5E1']:kind==='danger'?[T.a(T.ice,0.1),T.a(T.ice,0.03)]:[T.a(T.ice,0.15),T.a(T.ice,0.05)]} start={{x:0,y:0}} end={{x:0,y:1}}
        style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:small?10:15,paddingHorizontal:small?12:18,borderRadius:16,borderWidth:1,borderColor:primary?T.ice:T.glassBorder}}>
        {icon&&<Icon name={icon} size={small?15:17} color={primary?T.black:kind==='danger'?T.a(T.ice,0.85):T.ice}/>}
        <Text numberOfLines={1} style={{color:primary?T.black:T.ice,fontWeight:'700',fontSize:small?13:15,textDecorationLine:kind==='danger'?'none':'none'}}>{title}</Text>
      </LinearGradient>
    </Animated.View>
  </Pressable>;
}

export function IconBtn({name,onPress,size=40,label,active}:{name:string,onPress?:()=>void,size?:number,label?:string,active?:boolean}){
  return <Pressable onPress={()=>{haptic();onPress?.();}} hitSlop={8} accessibilityLabel={label} style={({pressed})=>[{width:size,height:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',borderWidth:1,
    borderColor:active?T.glassBorderStrong:T.glassBorder,backgroundColor:active?T.a(T.ice,0.18):T.a(T.ice,pressed?0.16:0.07)}]}>
    <Icon name={name} size={size*0.46}/>
  </Pressable>;
}

export function Input({label,icon,secret,right,style,...p}:TextInputProps&{label?:string,icon?:string,secret?:boolean,right?:React.ReactNode}){
  const [show,setShow]=useState(false);const [focus,setFocus]=useState(false);
  return <View style={[{marginBottom:12},style]}>
    {label&&<Text style={[font.small,{marginBottom:6,marginLeft:4}]}>{label}</Text>}
    <View style={{flexDirection:'row',alignItems:p.multiline?'flex-start':'center',borderRadius:16,borderWidth:1,borderColor:focus?T.glassBorderStrong:T.glassBorder,backgroundColor:T.a(T.black,0.35),paddingHorizontal:14}}>
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
  const head=title!==undefined&&<View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:T.gutter,paddingTop:ins.top+8,paddingBottom:10,gap:12}}>
    {back&&<IconBtn name="chevron-left" label="Retour" onPress={()=>router.canGoBack()?router.back():router.replace('/')}/>}
    <View style={{flex:1}}><Text style={font.h2} numberOfLines={1}>{title}</Text>{!!subtitle&&<Text style={font.small} numberOfLines={1}>{subtitle}</Text>}</View>
    {right}
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
  return <Pressable onPress={()=>{haptic();onPress?.();}} style={{borderRadius:20,overflow:'hidden'}}>
    <LinearGradient colors={active?[T.ice,'#CBD5E1']:[T.a(T.ice,0.12),T.a(T.ice,0.04)]} style={{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:8,paddingHorizontal:15,borderRadius:20,borderWidth:1,borderColor:active?T.ice:T.glassBorder}}>
      {icon&&<Icon name={icon} size={13} color={active?T.black:T.ice}/>}<Text style={{color:active?T.black:T.ice,fontSize:13,fontWeight:'600'}}>{label}</Text>
    </LinearGradient>
  </Pressable>;
}

/** Tuile d'icône : initiale du service (pas de logos de marques), ou icône de catégorie. */
export function Tile({icon,letter,size=46}:{icon?:string,letter?:string,size?:number}){
  return <View style={{width:size,height:size,borderRadius:size*0.3,overflow:'hidden',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:T.glassBorder}}>
    <LinearGradient colors={[T.a(T.ice,0.2),T.a(T.slate,0.6)]} style={StyleSheet.absoluteFill}/>
    {letter?<Text style={{color:T.ice,fontSize:size*0.42,fontWeight:'800'}}>{letter.toUpperCase()}</Text>:<Icon name={icon||'box'} size={size*0.45}/>}
  </View>;
}

/** Anneau de sécurité (valeur réelle calculée). */
export function Ring({value,size=120,label}:{value:number,size?:number,label?:string}){
  const sw=8,r=(size-sw*2)/2,c=2*Math.PI*r;const anim=useRef(new Animated.Value(0)).current;const [v,setV]=useState(0);
  useEffect(()=>{const id=anim.addListener(x=>setV(x.value));Animated.timing(anim,{toValue:value,duration:900,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();return ()=>anim.removeListener(id);},[value]);
  return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs><SG id="rg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={T.ice}/><Stop offset="1" stopColor={T.steel}/></SG></Defs>
      <Circle cx={size/2} cy={size/2} r={r} stroke={T.a(T.ice,0.12)} strokeWidth={sw} fill={T.a(T.black,0.25)}/>
      <Circle cx={size/2} cy={size/2} r={r} stroke="url(#rg)" strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={`${c*v} ${c}`} transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <Circle cx={size/2} cy={size/2} r={r+sw*0.9} stroke={T.a(T.ice,0.12)} strokeWidth={1} fill="none"/>
    </Svg>
    <Text style={{color:T.ice,fontSize:size*0.2,fontWeight:'700'}}>{Math.round(v*100)}%</Text>
    {label&&<Text style={[font.micro,{marginTop:2}]}>{label}</Text>}
  </View>;
}

/** Logo officiel EYELIOS (fourni par le propriétaire). */
export const Logo=({size=56}:{size?:number})=><Image source={require('../../assets/logo.png')} style={{width:size,height:size,borderRadius:size*0.22}} accessibilityLabel="Logo EYELIOS"/>;
export const Wordmark=({size=30}:{size?:number})=><Text style={{color:T.ice,fontSize:size,fontWeight:'800',fontStyle:'italic',letterSpacing:size*0.06}}>EYELIOS</Text>;

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
  glowShadow:{shadowColor:T.ice,shadowOpacity:0.35,shadowRadius:14,shadowOffset:{width:0,height:0}},
});
