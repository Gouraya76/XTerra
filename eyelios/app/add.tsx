import React from 'react';
import {Text,View} from 'react-native';
import {router} from 'expo-router';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Icon,FadeIn,Section} from '../src/ui/kit';
import {TYPES} from '../src/core/model';
import {T,font} from '../src/ui/theme';
import {scanDocument,addPhotos,importFromPhone} from '../src/screens/actions';

export default function Add(){
  const v=useVault();
  const opts:{icon:string,title:string,sub:string,on:()=>void}[]=[
    ...TYPES.filter(t=>!['photo','document'].includes(t.id)).map(t=>({icon:t.icon,title:t.singular,sub:t.id==='password'?'Identifiants, site, générateur':t.id==='api'?'Fournisseur, clé, URL':t.id==='card'?'Sans PIN ni CVV':'Éditeur de notes privées',on:()=>router.push(`/edit?type=${t.id}`)})),
    {icon:'image',title:'Photos',sub:'Depuis la galerie',on:()=>addPhotos(v)},
    {icon:'camera',title:'Prendre une photo',sub:'Appareil photo',on:()=>addPhotos(v,true)},
    {icon:'maximize',title:'Scanner un document',sub:'Capture via l’appareil photo',on:()=>scanDocument(v)},
    {icon:'file-text',title:'Importer un fichier',sub:'PDF, images, documents',on:()=>importFromPhone(v)},
  ];
  return <Screen title="Ajouter" subtitle="Tout est chiffré avant d’être enregistré" >
    <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10}}>
      {opts.map((o,i)=><FadeIn key={o.title} delay={i*35} style={{width:'48.5%'}}><Glass padding={14} onPress={o.on} style={{minHeight:118}}>
        <Icon name={o.icon} size={26}/><Text style={[font.h3,{marginTop:12}]} numberOfLines={1}>{o.title}</Text><Text style={[font.micro,{marginTop:3}]} numberOfLines={2}>{o.sub}</Text>
      </Glass></FadeIn>)}
    </View>
    <Section title="Outils" icon="tool"/>
    <Glass onPress={()=>router.push('/generator')}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Icon name="refresh-cw" size={22}/><View style={{flex:1}}><Text style={font.h3}>Générateur de mots de passe</Text><Text style={font.small}>Aléatoire cryptographique, sans biais</Text></View><Icon name="chevron-right" color={T.textMute}/></View></Glass>
  </Screen>;
}
