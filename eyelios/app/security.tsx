import React from 'react';
import {Text,View} from 'react-native';
import {router} from 'expo-router';
import {useVault,securityChecks} from '../src/state/vault';
import {Screen,Glass,Icon,Ring,FadeIn,Section} from '../src/ui/kit';
import {Row} from './(tabs)/settings';
import {T,font} from '../src/ui/theme';
export default function Security(){
  const v=useVault();const c=securityChecks(v.payload,v.bio.enabled);const score=c.filter(x=>x.ok).length/c.length;
  return <Screen title="Sécurité" subtitle="État réel, calculé sur ton appareil">
    <FadeIn style={{alignItems:'center',marginVertical:14}}><Ring value={score} size={180} label={score===1?'Protégé':'À renforcer'}/></FadeIn>
    {c.map(x=><Glass key={x.label} padding={14} style={{marginBottom:8}}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Icon name={x.ok?'check-circle':'alert-circle'} color={x.ok?T.ice:T.textMute}/><Text style={[font.body,{flex:1,color:T.ice}]}>{x.label}</Text><Text style={font.micro}>{x.ok?'OK':'À faire'}</Text></View></Glass>)}
    <Section title="Actions"/>
    <Row icon="list" title="Historique de sécurité" onPress={()=>router.push('/journal')}/>
    <Row icon="smartphone" title="Appareils" sub="1 appareil : ce téléphone (aucune synchronisation)"/>
    <Row icon="hard-drive" title="Sauvegarde & restauration" onPress={()=>router.push('/backup')}/>
    <Row icon="settings" title="Réglages de sécurité" onPress={()=>router.navigate('/settings')}/>
    <Text style={[font.micro,{marginTop:10,lineHeight:16}]}>Ce score reflète uniquement les réglages ci-dessus. Il ne constitue pas une certification : EYELIOS n’a pas fait l’objet d’un audit de sécurité indépendant.</Text>
  </Screen>;
}
