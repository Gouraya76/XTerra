import React,{useState} from 'react';
import {Alert,Switch,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import Constants from 'expo-constants';
import {useVault} from '../../src/state/vault';
import {Screen,Glass,Icon,Section,Sheet,Input,Btn,Chip} from '../../src/ui/kit';
import {T,font} from '../../src/ui/theme';

export function Row({icon,title,sub,onPress,right}:{icon:string,title:string,sub?:string,onPress?:()=>void,right?:React.ReactNode}){
  return <Glass padding={14} style={{marginBottom:10}} onPress={onPress}><View style={{flexDirection:'row',alignItems:'center',gap:14}}>
    <Icon name={icon} size={20}/><View style={{flex:1}}><Text style={font.h3}>{title}</Text>{!!sub&&<Text style={font.small}>{sub}</Text>}</View>
    {right??(onPress&&<Icon name="chevron-right" color={T.textMute}/>)}</View></Glass>;
}
const sw=(value:boolean,on:(v:boolean)=>void)=><Switch value={value} onValueChange={on} trackColor={{true:T.steel,false:T.slate}} thumbColor={T.ice}/>;
const LOCKS:[number,string][]=[[0,'Immédiat'],[30,'30 s'],[60,'1 min'],[300,'5 min'],[900,'15 min']];
const CLIPS:[number,string][]=[[15,'15 s'],[30,'30 s'],[60,'1 min'],[0,'Jamais']];

export default function Settings(){
  const v=useVault();const s=v.payload.settings;const prm=useLocalSearchParams<{bio?:string}>();const [bioPw,setBioPw]=useState<string|null>(null),[chg,setChg]=useState<{o:string,n:string,c:string}|null>(null);
  React.useEffect(()=>{if(prm.bio&&!v.bio.enabled&&v.bio.available){setBioPw('');router.setParams({bio:undefined} as any);}},[prm.bio]);
  async function enableBio(){try{await v.setBio(true,bioPw||'');setBioPw(null);v.notify('Empreinte activée','aperture');}catch(e:any){Alert.alert('Activation impossible',e.message);}}
  async function change(){if(!chg)return;if(chg.n!==chg.c)return Alert.alert('Confirmation','Les nouveaux mots de passe ne correspondent pas.');
    try{await v.changePassword(chg.o,chg.n);setChg(null);if(v.bio.enabled)v.notify('Mot de passe changé','check');else v.notify('Mot de passe changé');}catch(e:any){Alert.alert('Échec',e.message);}}
  return <Screen title="Paramètres" subtitle={v.email} back={false}>
    <Section title="Sécurité" icon="shield"/>
    <Row icon="aperture" title="Déverrouillage biométrique" sub={v.bio.available?'Clé protégée par l’Android Keystore':'Aucune empreinte enregistrée dans Android'}
      right={sw(v.bio.enabled,on=>on?(v.bio.available?setBioPw(''):Alert.alert('Indisponible','Enregistre une empreinte dans les réglages Android.')):v.setBio(false))}/>
    <Glass padding={14} style={{marginBottom:10}}><Text style={font.h3}>Verrouillage automatique</Text><Text style={[font.small,{marginBottom:10}]}>Après passage en arrière-plan</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{LOCKS.map(([n,l])=><Chip key={n} label={l} active={s.autoLockSeconds===n} onPress={()=>v.updateSettings({autoLockSeconds:n})}/>)}</View></Glass>
    <Glass padding={14} style={{marginBottom:10}}><Text style={font.h3}>Effacement du presse-papiers</Text><Text style={[font.small,{marginBottom:10}]}>Après une copie</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{CLIPS.map(([n,l])=><Chip key={n} label={l} active={s.clipboardClearSeconds===n} onPress={()=>v.updateSettings({clipboardClearSeconds:n})}/>)}</View></Glass>
    <Row icon="eye-off" title="Bloquer les captures d’écran" sub="Désactivé par défaut. Activé : empêche aussi le partage d’écran" right={sw(s.blockScreenshots,on=>v.updateSettings({blockScreenshots:on}))}/>
    <Section title="Données" icon="database"/>
    <Row icon="hard-drive" title="Sauvegarde & restauration" sub={v.payload.lastBackupAt?'Dernière : '+new Date(v.payload.lastBackupAt).toLocaleString('fr-FR'):'Aucune sauvegarde exportée'} onPress={()=>router.push('/backup')}/>
    <Section title="Assistant IA" icon="zap"/>
    <Row icon="cpu" title="Fournisseur d’IA" sub={s.aiEnabled?'Claude (Anthropic) · activé':'Désactivé — assistant en mode local'} onPress={()=>router.push('/ai')}/>
    <Text style={[font.micro,{textAlign:'center',marginTop:12}]}>EYELIOS {Constants.expoConfig?.version} · AES-256-GCM · PBKDF2-SHA256 600 000 itérations{'\n'}Application non auditée par un organisme tiers.</Text>
    <Sheet visible={bioPw!==null} onClose={()=>setBioPw(null)} title="Activer l’empreinte">
      <Text style={[font.body,{marginBottom:12}]}>Confirme ton mot de passe maître. La biométrie protégera la clé de chiffrement ; elle ne remplace pas le mot de passe et ne permet pas de le récupérer.</Text>
      <Input secret icon="lock" value={bioPw||''} onChangeText={setBioPw} placeholder="Mot de passe maître"/><Btn kind="primary" icon="aperture" title="Activer" onPress={enableBio}/>
    </Sheet>
  </Screen>;
}
