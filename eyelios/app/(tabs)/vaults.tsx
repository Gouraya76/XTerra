import React,{useState} from 'react';
import {Text,View,Alert} from 'react-native';
import {router} from 'expo-router';
import {useVault} from '../../src/state/vault';
import {Screen,Glass,Icon,IconBtn,FadeIn,Sheet,Input,Btn} from '../../src/ui/kit';
import {T,font} from '../../src/ui/theme';
export const VAULT_ICONS=['user','briefcase','layers','trending-up','archive','shield','home','heart','star','folder','globe','book'];

export function VaultForm({visible,onClose,initial}:{visible:boolean,onClose:()=>void,initial?:{id:string,name:string,icon:string}}){
  const v=useVault();const [name,setName]=useState(initial?.name||''),[icon,setIcon]=useState(initial?.icon||'folder');
  React.useEffect(()=>{setName(initial?.name||'');setIcon(initial?.icon||'folder');},[visible]);
  async function save(){if(!name.trim())return;if(initial){await v.renameVault(initial.id,name);}else await v.addVault(name,icon);onClose();}
  return <Sheet visible={visible} onClose={onClose} title={initial?'Renommer le coffre':'Nouveau coffre'}>
    <Input label="Nom" icon="edit-2" value={name} onChangeText={setName} placeholder="Ex. Famille, Voyages…" autoCapitalize="sentences"/>
    {!initial&&<><Text style={[font.small,{marginBottom:8}]}>Icône</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:16}}>{VAULT_ICONS.map(i=><IconBtn key={i} name={i} active={i===icon} onPress={()=>setIcon(i)} size={44}/>)}</View></>}
    <Btn kind="primary" title="Enregistrer" icon="check" onPress={save}/>
  </Sheet>;
}
export default function Vaults(){
  const v=useVault();const p=v.payload;const [form,setForm]=useState(false);
  return <Screen title="Collections" subtitle={`${p.vaults.length} coffres personnalisés`} back={false} right={<IconBtn name="plus" label="Nouveau coffre" onPress={()=>setForm(true)}/>}>
    {p.vaults.map((c,i)=>{const n=p.items.filter(x=>x.vaultId===c.id).length;return <FadeIn key={c.id} delay={i*40}><Glass style={{marginBottom:10}} onPress={()=>router.push(`/vault/${c.id}`)}
      onLongPress={()=>Alert.alert(c.name,undefined,[{text:'Monter',onPress:()=>v.moveVault(c.id,-1)},{text:'Descendre',onPress:()=>v.moveVault(c.id,1)},{text:'Annuler',style:'cancel'}])}>
      <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
        <View style={{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:T.a(T.ice,0.1),borderWidth:1,borderColor:T.glassBorder}}><Icon name={c.icon} size={22}/></View>
        <View style={{flex:1}}><Text style={font.h3}>{c.name}</Text><Text style={font.small}>{n} élément{n>1?'s':''}</Text></View>
        {c.favorite&&<Icon name="star" size={15} color={T.textDim}/>}<Icon name="chevron-right" color={T.textMute}/>
      </View></Glass></FadeIn>;})}
    <Text style={[font.micro,{textAlign:'center',marginTop:6}]}>Appui long sur un coffre pour le réordonner.</Text>
    <VaultForm visible={form} onClose={()=>setForm(false)}/>
  </Screen>;
}
