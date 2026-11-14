import React,{useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {router} from 'expo-router';
import {useVault,securityChecks} from '../src/state/vault';
import {Screen,Glass,Icon,Ring,FadeIn,CheckDot,Btn} from '../src/ui/kit';
import {T,font} from '../src/ui/theme';

function Row({icon,title,onPress,badge}:{icon:string,title:string,onPress?:()=>void,badge?:string}){
  return <Glass padding={13} radius={16} style={{marginBottom:9}} onPress={onPress}><View style={{flexDirection:'row',alignItems:'center',gap:12}}>
    <Icon name={icon} size={20}/><Text style={[font.body,{flex:1,color:T.ice}]}>{title}</Text>
    {badge?<View style={{paddingHorizontal:10,paddingVertical:3,borderRadius:10,backgroundColor:T.a(T.electric,0.55)}}><Text style={{color:T.ice,fontSize:12,fontWeight:'600'}}>{badge}</Text></View>:<Icon name="chevron-right" size={18}/>}
  </View></Glass>;
}
const HINTS:Record<string,string>={
  'Verrouillage biométrique':'Ouvre ton coffre avec ton empreinte. Il faut confirmer ton mot de passe maître une fois.',
  'Sauvegarde de moins de 30 jours':'Exporte une sauvegarde chiffrée et garde-la hors du téléphone (ordinateur, clé USB, Drive).',
  'Verrouillage auto ≤ 5 min':'Le coffre doit se verrouiller seul au bout de 5 minutes maximum en arrière-plan.',
  'Captures d’écran bloquées':'Empêche les captures d’écran et masque l’aperçu dans les applis récentes.',
};
export default function Security(){
  const v=useVault();const c=securityChecks(v.payload,v.bio.enabled);const score=c.filter(x=>x.ok).length/c.length;const [testing,setTesting]=useState(false);
  async function fix(label:string){
    if(label==='Verrouillage biométrique'){if(!v.bio.available)return Alert.alert('Aucune empreinte','Ajoute d’abord une empreinte dans les Paramètres Android → Sécurité et confidentialité → Biométrie, puis reviens ici.');return router.push('/settings?bio=1');}
    if(label.startsWith('Sauvegarde'))return router.push('/backup');
    if(label.startsWith('Verrouillage auto')){await v.updateSettings({autoLockSeconds:60});return v.notify('Verrouillage auto : 1 min');}
    if(label.startsWith('Captures')){await v.updateSettings({blockScreenshots:true});return v.notify('Captures d’écran bloquées');}
  }
  /** Test de sécurité RÉEL : déchiffre chaque pièce jointe (authentification GCM) et vérifie la cohérence du coffre. */
  async function runTest(){setTesting(true);let ok=0,bad:string[]=[];const atts=v.payload.items.flatMap(i=>i.attachments);
    for(const a of atts){try{await v.readAttachment(a);ok++;}catch{bad.push(a.name);}}
    const orphans=v.payload.items.filter(i=>!v.payload.vaults.some(x=>x.id===i.vaultId)).length;setTesting(false);
    await v.log('Test de sécurité',`${ok}/${atts.length} fichiers intègres`);
    Alert.alert(bad.length||orphans?'Problèmes détectés':'Test réussi',`Coffre déchiffré et authentifié ✓\nFichiers chiffrés intègres : ${ok}/${atts.length}${bad.length?'\nEn erreur : '+bad.join(', '):''}\nÉléments sans coffre : ${orphans}\n\n${c.filter(x=>!x.ok).map(x=>'À faire : '+x.label).join('\n')||'Tous les réglages recommandés sont actifs.'}`);}
  return <Screen title="Sécurité">
    <FadeIn style={{alignItems:'center',marginVertical:12}}><Ring value={score} size={190} label={score===1?'Protégé':'À renforcer'}><Icon name="shield" size={40} style={{marginBottom:4}}/></Ring></FadeIn>
    {score<1&&<Text style={[font.body,{color:T.ice,textAlign:'center',marginBottom:6}]}>Touche « Corriger » sur chaque point restant pour atteindre 100 %.</Text>}
    <View style={{marginVertical:8}}>{c.map(x=><View key={x.label} style={{paddingVertical:10,borderBottomWidth:1,borderColor:T.a(T.ice,0.1)}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
        <CheckDot ok={x.ok} size={22}/><Text style={[font.body,{flex:1,color:T.ice}]}>{x.label}</Text>
        {x.ok?<Text style={[font.small,{color:T.light}]}>Actif</Text>:<Btn small kind="primary" title="Corriger" onPress={()=>fix(x.label)} style={{flexGrow:0}}/>}
      </View>
      {!x.ok&&<Text style={[font.small,{marginTop:6,marginLeft:34}]}>{HINTS[x.label]}</Text>}
    </View>)}</View>
    <View style={{marginTop:10}}>
      <Row icon="clock" title="Historique de sécurité" onPress={()=>router.push('/journal')}/>
      <Row icon="monitor" title="Appareils connectés" badge="1 appareil" onPress={()=>Alert.alert('Appareils','EYELIOS fonctionne uniquement sur ce téléphone. Aucune synchronisation, aucun autre appareil connecté.')}/>
      <Row icon="hard-drive" title="Sauvegarde & restauration" onPress={()=>router.push('/backup')}/>
      <Row icon="shield" title={testing?'Test en cours…':'Test de sécurité'} onPress={testing?undefined:runTest}/>
    </View>
    <Text style={[font.micro,{marginTop:8,lineHeight:16}]}>Le score reflète l’état réel des réglages ci-dessus ; ce n’est pas une certification (application non auditée).</Text>
  </Screen>;
}
