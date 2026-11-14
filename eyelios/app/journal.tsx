import React from 'react';
import {Text,View} from 'react-native';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Empty} from '../src/ui/kit';
import {font} from '../src/ui/theme';
export default function Journal(){const v=useVault();const l=v.payload.log;
  return <Screen title="Journal d’activité" subtitle={`${l.length} entrées · aucune valeur secrète enregistrée`}>
    {l.length?l.map((e,i)=><Glass key={i} padding={12} style={{marginBottom:8}}><View style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><Text style={[font.h3,{fontSize:14,flex:1}]}>{e.action}</Text><Text style={font.micro}>{new Date(e.at).toLocaleString('fr-FR')}</Text></View>{!!e.label&&<Text style={font.small} numberOfLines={1}>{e.label}</Text>}</Glass>)
      :<Empty icon="list" title="Journal vide" text=""/>}
  </Screen>;}
