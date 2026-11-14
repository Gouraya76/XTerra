import React,{useEffect,useState} from 'react';
import {Alert,Switch,Text,View,Linking} from 'react-native';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Btn,Input,Section,Icon,Chip} from '../src/ui/kit';
import {getAiKey,setAiKey} from '../src/storage/secure';
import {askAI} from '../src/storage/ai';
import {T,font} from '../src/ui/theme';
const MODELS:[string,string][]=[['claude-opus-5-5','Claude Opus 5.5 (recommandé)'],['claude-sonnet-5-5','Claude Sonnet 5.5 (plus rapide)'],['claude-haiku-5-5','Claude Haiku 5.5 (économique)']];
export default function AI(){
  const v=useVault();const s=v.payload.settings;const [has,setHas]=useState(false),[key,setKey]=useState(''),[testing,setTesting]=useState(false);
  useEffect(()=>{getAiKey().then(k=>setHas(!!k));},[]);
  async function save(){if(!/^sk-ant-/.test(key.trim()))return Alert.alert('Clé invalide','Une clé API Anthropic commence par « sk-ant- ».');await setAiKey(key.trim());setKey('');setHas(true);await v.updateSettings({aiEnabled:true});await v.log('Clé IA enregistrée','');v.notify('Clé enregistrée dans le Keystore','lock');}
  async function test(){setTesting(true);try{const r=await askAI([{role:'user',content:'Réponds uniquement : « Connexion OK ».'}],s.aiModel);Alert.alert('Test réussi',r);}catch(e:any){Alert.alert('Test échoué',e.message);}finally{setTesting(false);}}
  return <Screen title="Assistant IA" subtitle="Fournisseur : Claude (Anthropic)">
    <Glass><View style={{gap:8}}>
      {[['wifi-off','Recherche, création, classement et suppression dans le coffre : en local, sans internet.'],['globe','Questions générales, rédaction, reformulation, résumés : nécessitent internet et une clé API.'],['shield','Aucun mot de passe, clé, carte, fichier ni contenu du coffre n’est envoyé : seul ce que tu écris dans la conversation l’est.']].map(([i,t])=>
        <View key={i} style={{flexDirection:'row',gap:10}}><Icon name={i} size={18}/><Text style={[font.small,{flex:1}]}>{t}</Text></View>)}
    </View></Glass>
    <Section title="Activation" icon="power"/>
    <Glass padding={14}><View style={{flexDirection:'row',alignItems:'center'}}><Text style={[font.h3,{flex:1}]}>Questions générales via l’IA</Text>
      <Switch value={s.aiEnabled} onValueChange={on=>{if(on&&!has)return Alert.alert('Clé requise','Enregistre d’abord ta clé API ci-dessous.');v.updateSettings({aiEnabled:on});}} trackColor={{true:T.steel,false:T.slate}} thumbColor={T.ice}/></View></Glass>
    <Section title="Clé API Anthropic" icon="key"/>
    <Text style={[font.small,{marginBottom:10}]}>{has?'Une clé est enregistrée dans l’Android Keystore (jamais dans le code, jamais dans les sauvegardes).':'Crée une clé sur console.anthropic.com (compte et facturation à ton nom), puis colle-la ici.'}</Text>
    <Input secret icon="key" placeholder="sk-ant-…" value={key} onChangeText={setKey}/>
    <View style={{flexDirection:'row',gap:10}}><Btn kind="primary" icon="save" title="Enregistrer" onPress={save}/>{has&&<Btn icon="trash-2" kind="danger" title="Supprimer" onPress={async()=>{await setAiKey(null);setHas(false);await v.updateSettings({aiEnabled:false});}}/>}</View>
    <Btn icon="external-link" title="Ouvrir console.anthropic.com" style={{marginTop:10}} onPress={()=>Linking.openURL('https://console.anthropic.com/settings/keys')}/>
    <Section title="Modèle" icon="cpu"/>
    <View style={{gap:8}}>{MODELS.map(([id,l])=><Chip key={id} label={l} active={s.aiModel===id} onPress={()=>v.updateSettings({aiModel:id})}/>)}</View>
    {has&&<Btn icon="zap" title={testing?'Test en cours…':'Tester la connexion'} disabled={testing} style={{marginTop:16}} onPress={test}/>}
  </Screen>;
}
