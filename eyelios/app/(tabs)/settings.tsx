import React,{useState} from 'react';
import {Alert,Switch,Text,View} from 'react-native';
import {router} from 'expo-router';
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
  const v=useVault();const s=v.payload.settings;const [bioPw,setBioPw]=useState<string|null>(null),[chg,setChg]=useState<{o:string,n:string,c:string}|null>(null);
  async function enableBio(){try{await v.setBio(true,bioPw||'');setBioPw(null);v.notify('Empreinte activée','aperture');}catch(e:any){Alert.alert('Activation impossible',e.message);}}
  async function change(){if(!chg)return;if(chg.n!==chg.c)return Alert.alert('Confirmation','Les nouveaux mots de passe ne correspondent pas.');
    try{await v.changePassword(chg.o,chg.n);setChg(null);if(v.bio.enabled)v.notify('Mot de passe changé','check');else v.notify('Mot de passe changé');}catch(e:any){Alert.alert('Échec',e.message);}}
  return <Screen title="Paramètres" subtitle={v.email} back={false}>
    <Section title="Sécurité" icon="shield"/>
    <Row icon="activity" title="Tableau de sécurité" sub="État réel de la protection de ton coffre" onPress={()=>router.push('/security')}/>
    <Row icon="aperture" title="Déverrouillage biométrique" sub={v.bio.available?'Clé protégée par l’Android Keystore':'Aucune empreinte enregistrée dans Android'}
      right={sw(v.bio.enabled,on=>on?(v.bio.available?setBioPw(''):Alert.alert('Indisponible','Enregistre une empreinte dans les réglages Android.')):v.setBio(false))}/>
    <Glass padding={14} style={{marginBottom:10}}><Text style={font.h3}>Verrouillage automatique</Text><Text style={[font.small,{marginBottom:10}]}>Après passage en arrière-plan</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{LOCKS.map(([n,l])=><Chip key={n} label={l} active={s.autoLockSeconds===n} onPress={()=>v.updateSettings({autoLockSeconds:n})}/>)}</View></Glass>
    <Glass padding={14} style={{marginBottom:10}}><Text style={font.h3}>Effacement du presse-papiers</Text><Text style={[font.small,{marginBottom:10}]}>Après une copie</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{CLIPS.map(([n,l])=><Chip key={n} label={l} active={s.clipboardClearSeconds===n} onPress={()=>v.updateSettings({clipboardClearSeconds:n})}/>)}</View></Glass>
    <Row icon="eye-off" title="Bloquer les captures d’écran" sub="Masque aussi l’aperçu dans les applis récentes" right={sw(s.blockScreenshots,on=>v.updateSettings({blockScreenshots:on}))}/>
    <Row icon="key" title="Changer le mot de passe maître" onPress={()=>setChg({o:'',n:'',c:''})}/>
    <Row icon="list" title="Journal d’activité" sub="Actions importantes, sans aucun secret" onPress={()=>router.push('/journal')}/>
    <Section title="Données" icon="database"/>
    <Row icon="hard-drive" title="Sauvegarde & restauration" sub={v.payload.lastBackupAt?'Dernière : '+new Date(v.payload.lastBackupAt).toLocaleString('fr-FR'):'Aucune sauvegarde exportée'} onPress={()=>router.push('/backup')}/>
    <Section title="Assistant IA" icon="zap"/>
    <Row icon="cpu" title="Fournisseur d’IA" sub={s.aiEnabled?'Claude (Anthropic) · activé':'Désactivé — assistant en mode local'} onPress={()=>router.push('/ai')}/>
    <Section title="À propos" icon="info"/>
    <Row icon="lock" title="Verrouiller maintenant" onPress={v.lock}/>
    <Row icon="trash-2" title="Effacer le coffre de cet appareil" sub="Irréversible sans sauvegarde" onPress={()=>Alert.alert('Effacer tout le coffre ?','Toutes les données d’EYELIOS sur ce téléphone seront supprimées définitivement. As-tu exporté une sauvegarde ?',[{text:'Annuler',style:'cancel'},{text:'Tout effacer',style:'destructive',onPress:()=>Alert.alert('Dernière confirmation','Cette action est irréversible.',[{text:'Annuler',style:'cancel'},{text:'Effacer',style:'destructive',onPress:v.wipe}])}])}/>
    <Text style={[font.micro,{textAlign:'center',marginTop:12}]}>EYELIOS {Constants.expoConfig?.version} · AES-256-GCM · PBKDF2-SHA256 600 000 itérations{'\n'}Application non auditée par un organisme tiers.</Text>
    <Sheet visible={bioPw!==null} onClose={()=>setBioPw(null)} title="Activer l’empreinte">
      <Text style={[font.body,{marginBottom:12}]}>Confirme ton mot de passe maître. La biométrie protégera la clé de chiffrement ; elle ne remplace pas le mot de passe et ne permet pas de le récupérer.</Text>
      <Input secret icon="lock" value={bioPw||''} onChangeText={setBioPw} placeholder="Mot de passe maître"/><Btn kind="primary" icon="aperture" title="Activer" onPress={enableBio}/>
    </Sheet>
    <Sheet visible={!!chg} onClose={()=>setChg(null)} title="Nouveau mot de passe maître">
      <Input secret label="Mot de passe actuel" value={chg?.o||''} onChangeText={o=>setChg(c=>({...c!,o}))}/>
      <Input secret label="Nouveau (12 caractères min.)" value={chg?.n||''} onChangeText={n=>setChg(c=>({...c!,n}))}/>
      <Input secret label="Confirmer" value={chg?.c||''} onChangeText={x=>setChg(c=>({...c!,c:x}))}/>
      <Text style={[font.micro,{marginBottom:12}]}>Les sauvegardes déjà exportées gardent leur propre mot de passe.</Text>
      <Btn kind="primary" icon="check" title="Changer" onPress={change}/>
    </Sheet>
  </Screen>;
}
