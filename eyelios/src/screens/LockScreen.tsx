import React,{useEffect,useState} from 'react';
import {KeyboardAvoidingView,Platform,ScrollView,Text,View,Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useVault} from '../state/vault';
import {Background,Glass,Btn,Input,Wordmark,FadeIn,Icon} from '../ui/kit';
import {T,font} from '../ui/theme';
import {strength} from '../core/password';
import Splash from './Splash';
import {KbScroll} from '../ui/keyboard';

const validEmail=(e:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export default function LockScreen(){
  const v=useVault();const ins=useSafeAreaInsets();const isNew=v.status==='new';
  const [boot,setBoot]=useState(true);const [email,setEmail]=useState(v.email),[pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[err,setErr]=useState('');
  useEffect(()=>{setEmail(v.email);},[v.email]);
  useEffect(()=>{if(!boot&&v.status==='locked'&&v.bio.enabled)v.unlockBio().catch(()=>{});},[v.status,boot]);
  const st=strength(pw);
  async function go(){setErr('');const mail=email.trim().toLowerCase();
    if(!validEmail(mail))return setErr('Saisis une adresse e-mail valide.');
    try{if(isNew){if(pw!==pw2)return setErr('Les deux mots de passe ne correspondent pas.');await v.create(mail,pw);}else await v.unlock(mail,pw);setPw('');setPw2('');}
    catch(e:any){setErr(e.message);}}
  if(boot)return <Splash ready={v.status!=='loading'} onDone={()=>setBoot(false)}/>;
  return <Background>
    <KbScroll restPadding={ins.bottom+30} contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:T.gutter+4,paddingTop:ins.top+30}}>
      <FadeIn style={{alignItems:'center',marginBottom:26}}>
        <Wordmark size={44}/>
        <Text style={[font.body,{marginTop:4,fontStyle:'italic'}]}>Coffre-fort numérique personnel</Text>
      </FadeIn>
      <FadeIn delay={120}><Glass strong padding={20}>
        <Text style={[font.h2,{marginBottom:4}]}>{isNew?'Créer ton compte local':'Bon retour'}</Text>
        <Text style={[font.small,{marginBottom:16}]}>{isNew?'Ton compte et tes données restent uniquement sur ce téléphone, chiffrés.':'Ton coffre est verrouillé.'}</Text>
        {!isNew&&v.bio.enabled&&<><Btn kind="primary" icon="aperture" title="Déverrouiller avec l’empreinte" onPress={()=>v.unlockBio().catch(e=>setErr(e.message))}/><Text style={[font.micro,{textAlign:'center',marginVertical:14}]}>OU AVEC TON MOT DE PASSE</Text></>}
        <Input icon="mail" label="E-mail du compte" placeholder="prenom@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="username"/>
        <Input icon="lock" label={isNew?'Mot de passe maître (12 caractères min.)':'Mot de passe maître'} secret value={pw} onChangeText={setPw} placeholder="••••••••••••" onSubmitEditing={isNew?undefined:go} returnKeyType="go"/>
        {isNew&&!!pw&&<View style={{marginTop:-4,marginBottom:12,marginHorizontal:4}}>
          <View style={{height:4,borderRadius:2,backgroundColor:T.a(T.ice,0.12)}}><View style={{height:4,borderRadius:2,width:`${st.score*100}%`,backgroundColor:T.ice}}/></View>
          <Text style={[font.micro,{marginTop:5}]}>Robustesse : {st.label} (~{st.bits} bits)</Text></View>}
        {isNew&&<Input icon="check-circle" label="Confirmer le mot de passe" secret value={pw2} onChangeText={setPw2} placeholder="••••••••••••" onSubmitEditing={go}/>}
        {!!err&&<View style={{flexDirection:'row',gap:8,alignItems:'center',marginBottom:12}}><Icon name="alert-circle" size={16}/><Text style={[font.small,{color:T.ice,flex:1}]}>{err}</Text></View>}
        <Btn kind={isNew||!v.bio.enabled?'primary':'glass'} icon={isNew?'shield':'unlock'} title={isNew?'Créer mon coffre':'Déverrouiller'} onPress={go}/>
        {isNew&&<Text style={[font.micro,{marginTop:14,lineHeight:16}]}>Le mot de passe maître ne peut pas être récupéré : aucun serveur ne le connaît. Exporte régulièrement une sauvegarde chiffrée (Paramètres → Sauvegarde).</Text>}
        {!isNew&&<Text onPress={()=>Alert.alert('Mot de passe oublié','EYELIOS ne conserve aucune copie de ton mot de passe : il est impossible de le récupérer.\n\nTu peux réinstaller l’application, créer un nouveau coffre, puis restaurer une sauvegarde .eyelios (avec le mot de passe de cette sauvegarde).')} style={[font.small,{textAlign:'center',marginTop:14,textDecorationLine:'underline'}]}>Mot de passe oublié ?</Text>}
      </Glass></FadeIn>
      <Text style={[font.micro,{textAlign:'center',marginTop:22,letterSpacing:1.4}]}>AES-256-GCM · STOCKAGE LOCAL · SANS CLOUD</Text>
    </KbScroll>
  </Background>;
}
