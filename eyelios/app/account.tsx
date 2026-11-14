import React,{useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Icon,Sheet,Input,Btn,Section} from '../src/ui/kit';
import {Row} from './(tabs)/settings';
import {T,font} from '../src/ui/theme';
/** Compte local : identité, mot de passe maître, effacement. */
export default function Account(){
  const v=useVault();const [chg,setChg]=useState<{o:string,n:string,c:string}|null>(null);
  const created=v.payload.log.length?Math.min(...v.payload.log.map(l=>l.at)):0;
  async function change(){if(!chg)return;if(chg.n!==chg.c)return Alert.alert('Confirmation','Les nouveaux mots de passe ne correspondent pas.');
    try{await v.changePassword(chg.o,chg.n);setChg(null);v.notify('Mot de passe maître changé','key');}catch(e:any){Alert.alert('Échec',e.message);}}
  return <Screen title="Mon compte" subtitle="Compte local · stocké sur ce téléphone">
    <Glass strong><View style={{alignItems:'center',gap:6,paddingVertical:6}}>
      <View style={{width:64,height:64,borderRadius:32,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:T.light,backgroundColor:T.a(T.electric,0.3)}}><Icon name="user" size={30}/></View>
      <Text style={font.h2}>{v.email}</Text>
      <Text style={font.small}>{v.payload.items.length} éléments · {v.payload.vaults.length} coffres{created?` · depuis le ${new Date(created).toLocaleDateString('fr-FR')}`:''}</Text>
    </View></Glass>
    <Section title="Identifiants" icon="key"/>
    <Row icon="key" title="Changer le mot de passe maître" sub="Les données ne sont pas re-chiffrées, seule la clé d’accès change" onPress={()=>setChg({o:'',n:'',c:''})}/>
    <Section title="Zone sensible" icon="alert-triangle"/>
    <Row icon="trash-2" title="Effacer le coffre de cet appareil" sub="Irréversible sans sauvegarde" onPress={()=>Alert.alert('Effacer tout le coffre ?','Toutes les données d’EYELIOS sur ce téléphone seront supprimées définitivement. As-tu exporté une sauvegarde ?',[{text:'Annuler',style:'cancel'},{text:'Tout effacer',style:'destructive',onPress:()=>Alert.alert('Dernière confirmation','Cette action est irréversible.',[{text:'Annuler',style:'cancel'},{text:'Effacer',style:'destructive',onPress:v.wipe}])}])}/>
    <Sheet visible={!!chg} onClose={()=>setChg(null)} title="Nouveau mot de passe maître">
      <Input secret label="Mot de passe actuel" value={chg?.o||''} onChangeText={o=>setChg(c=>({...c!,o}))}/>
      <Input secret label="Nouveau (12 caractères min.)" value={chg?.n||''} onChangeText={n=>setChg(c=>({...c!,n}))}/>
      <Input secret label="Confirmer" value={chg?.c||''} onChangeText={x=>setChg(c=>({...c!,c:x}))}/>
      <Text style={[font.micro,{marginBottom:12}]}>Les sauvegardes déjà exportées gardent leur propre mot de passe.</Text>
      <Btn kind="primary" icon="check" title="Changer" onPress={change}/>
    </Sheet>
  </Screen>;
}
