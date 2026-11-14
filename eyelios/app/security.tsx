import React,{useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {router} from 'expo-router';
import {useVault,securityChecks} from '../src/state/vault';
import {Screen,Glass,Icon,Ring,FadeIn,CheckDot} from '../src/ui/kit';
import {T,font} from '../src/ui/theme';

function Row({icon,title,onPress,badge}:{icon:string,title:string,onPress?:()=>void,badge?:string}){
  return <Glass padding={13} radius={16} style={{marginBottom:9}} onPress={onPress}><View style={{flexDirection:'row',alignItems:'center',gap:12}}>
    <Icon name={icon} size={20}/><Text style={[font.body,{flex:1,color:T.ice}]}>{title}</Text>
    {badge?<View style={{paddingHorizontal:10,paddingVertical:3,borderRadius:10,backgroundColor:T.a(T.electric,0.55)}}><Text style={{color:T.ice,fontSize:12,fontWeight:'600'}}>{badge}</Text></View>:<Icon name="chevron-right" size={18}/>}
  </View></Glass>;
}
export default function Security(){
  const v=useVault();const c=securityChecks(v.payload,v.bio.enabled);const score=c.filter(x=>x.ok).length/c.length;const [testing,setTesting]=useState(false);
  /** Test de sécurité RÉEL : déchiffre chaque pièce jointe (authentification GCM) et vérifie la cohérence du coffre. */
  async function runTest(){setTesting(true);let ok=0,bad:string[]=[];const atts=v.payload.items.flatMap(i=>i.attachments);
    for(const a of atts){try{await v.readAttachment(a);ok++;}catch{bad.push(a.name);}}
    const orphans=v.payload.items.filter(i=>!v.payload.vaults.some(x=>x.id===i.vaultId)).length;setTesting(false);
    await v.log('Test de sécurité',`${ok}/${atts.length} fichiers intègres`);
    Alert.alert(bad.length||orphans?'Problèmes détectés':'Test réussi',`Coffre déchiffré et authentifié ✓\nFichiers chiffrés intègres : ${ok}/${atts.length}${bad.length?'\nEn erreur : '+bad.join(', '):''}\nÉléments sans coffre : ${orphans}\n\n${c.filter(x=>!x.ok).map(x=>'À faire : '+x.label).join('\n')||'Tous les réglages recommandés sont actifs.'}`);}
  return <Screen title="Sécurité">
    <FadeIn style={{alignItems:'center',marginVertical:12}}><Ring value={score} size={190} label={score===1?'Protégé':'À renforcer'}><Icon name="shield" size={40} style={{marginBottom:4}}/></Ring></FadeIn>
    <View style={{marginVertical:8}}>{c.map(x=><View key={x.label} style={{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:9,borderBottomWidth:1,borderColor:T.a(T.ice,0.1)}}>
      <CheckDot ok size={22}/><Text style={[font.body,{flex:1,color:T.ice}]}>{x.label}</Text>
      <View style={{width:22,height:22,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:x.ok?T.electric:T.a(T.ice,0.15)}}><Icon name={x.ok?'check':'x'} size={13}/></View></View>)}</View>
    <View style={{marginTop:10}}>
      <Row icon="clock" title="Historique de sécurité" onPress={()=>router.push('/journal')}/>
      <Row icon="monitor" title="Appareils connectés" badge="1 appareil" onPress={()=>Alert.alert('Appareils','EYELIOS fonctionne uniquement sur ce téléphone. Aucune synchronisation, aucun autre appareil connecté.')}/>
      <Row icon="hard-drive" title="Sauvegarde & restauration" onPress={()=>router.push('/backup')}/>
      <Row icon="shield" title={testing?'Test en cours…':'Test de sécurité'} onPress={testing?undefined:runTest}/>
    </View>
    <Text style={[font.micro,{marginTop:8,lineHeight:16}]}>Le score reflète l’état réel des réglages ci-dessus ; ce n’est pas une certification (application non auditée).</Text>
  </Screen>;
}
