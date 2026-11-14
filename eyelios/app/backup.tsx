import React,{useState} from 'react';
import {Alert,Text,View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Btn,Input,Section,Icon,Sheet,Chip} from '../src/ui/kit';
import {FS} from '../src/storage/db';
import {T,font} from '../src/ui/theme';

export default function Backup(){
  const v=useVault();const [pw,setPw]=useState(''),[pw2,setPw2]=useState('');
  const [pending,setPending]=useState<{json:string,info:string}|null>(null),[rpw,setRpw]=useState(''),[mode,setMode]=useState<'replace'|'merge'>('merge');
  async function build(){if(pw.length<10)throw new Error('Au moins 10 caractères.');if(pw!==pw2)throw new Error('Les mots de passe ne correspondent pas.');return v.exportBackup(pw);}
  async function toFolder(){try{const b=await build();
      const perm=await v.external(()=>FS.StorageAccessFramework.requestDirectoryPermissionsAsync());if(!perm.granted)return;
      const uri=await FS.StorageAccessFramework.createFileAsync(perm.directoryUri,b.name.replace(/\.eyelios$/,''),'application/octet-stream');
      await FS.writeAsStringAsync(uri,b.json,{encoding:FS.EncodingType.UTF8});setPw('');setPw2('');
      Alert.alert('Sauvegarde enregistrée',`« ${b.name} » a été écrite dans le dossier choisi. Chaque export crée un nouveau fichier daté : tes versions précédentes sont conservées.`);
    }catch(e:any){Alert.alert('Export impossible',e.message);}}
  async function share(){try{const b=await build();const uri=FS.cacheDirectory+b.name;await FS.writeAsStringAsync(uri,b.json,{encoding:FS.EncodingType.UTF8});
      await v.external(()=>Sharing.shareAsync(uri,{mimeType:'application/octet-stream',dialogTitle:'Enregistrer la sauvegarde EYELIOS'}));await FS.deleteAsync(uri,{idempotent:true});setPw('');setPw2('');
    }catch(e:any){Alert.alert('Export impossible',e.message);}}
  async function pick(){try{const r=await v.external(()=>DocumentPicker.getDocumentAsync({type:'*/*',copyToCacheDirectory:true}));if(r.canceled)return;
      const json=await FS.readAsStringAsync(r.assets[0].uri,{encoding:FS.EncodingType.UTF8});await FS.deleteAsync(r.assets[0].uri,{idempotent:true});
      const chk=v.inspectBackup(json);if(!chk.ok)return Alert.alert('Fichier refusé',chk.reason);
      setPending({json,info:chk.kind==='jilani-v2'?'Ancienne sauvegarde JILANI VAULT v2 — elle sera convertie.':`Intégrité vérifiée ✓ · ${chk.stats?.items} éléments · ${chk.stats?.files} fichiers · créée le ${new Date(chk.createdAt!).toLocaleString('fr-FR')}`});setRpw('');
    }catch(e:any){Alert.alert('Lecture impossible',e.message);}}
  async function restore(){if(!pending)return;const go=async()=>{try{const n=await v.restoreBackup(pending.json,rpw,mode);setPending(null);Alert.alert('Restauration terminée',`${n} éléments restaurés.`);}catch(e:any){Alert.alert('Restauration impossible',e.message);}};
    if(mode==='replace')Alert.alert('Remplacer tout le coffre ?','Les éléments actuels absents de la sauvegarde seront supprimés.',[{text:'Annuler',style:'cancel'},{text:'Remplacer',style:'destructive',onPress:go}]);else go();}
  return <Screen title="Sauvegarde" subtitle="Chiffrée, hors ligne, sans compte cloud">
    <Glass><View style={{flexDirection:'row',gap:12}}><Icon name="info"/><Text style={[font.small,{flex:1}]}>Le fichier .eyelios contient tout ton coffre et tes pièces jointes, chiffrés (AES-256-GCM) avec le mot de passe de sauvegarde ci-dessous, plus une empreinte SHA-256 qui permet d’en vérifier l’intégrité. Conserve-le hors du téléphone (ordinateur, clé USB, Drive…). Sans ce mot de passe, il est irrécupérable.</Text></View></Glass>
    <Section title="Exporter" icon="upload"/>
    <Input secret icon="lock" label="Mot de passe de la sauvegarde (10 caractères min.)" value={pw} onChangeText={setPw}/>
    <Input secret icon="check-circle" label="Confirmer" value={pw2} onChangeText={setPw2}/>
    <View style={{gap:10}}><Btn kind="primary" icon="folder" title="Enregistrer dans un dossier…" onPress={toFolder}/><Btn icon="share-2" title="Partager / envoyer…" onPress={share}/></View>
    <Section title="Restaurer" icon="download"/>
    <Btn icon="file" title="Choisir un fichier de sauvegarde" onPress={pick}/>
    <Text style={[font.micro,{marginTop:10}]}>Les sauvegardes JILANI VAULT v2 sont aussi acceptées.</Text>
    <Sheet visible={!!pending} onClose={()=>setPending(null)} title="Restaurer la sauvegarde">
      <Text style={[font.body,{marginBottom:12}]}>{pending?.info}</Text>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}><Chip label="Fusionner" icon="git-merge" active={mode==='merge'} onPress={()=>setMode('merge')}/><Chip label="Remplacer" icon="refresh-ccw" active={mode==='replace'} onPress={()=>setMode('replace')}/></View>
      <Text style={[font.micro,{marginBottom:12}]}>{mode==='merge'?'Ajoute les éléments absents et garde la version la plus récente des éléments communs.':'Le coffre devient identique à la sauvegarde.'} Ton compte et ton mot de passe maître actuels sont conservés.</Text>
      <Input secret icon="lock" label="Mot de passe de la sauvegarde" value={rpw} onChangeText={setRpw}/>
      <Btn kind="primary" icon="download" title="Déchiffrer et restaurer" onPress={restore}/>
    </Sheet>
  </Screen>;
}
