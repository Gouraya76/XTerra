import React,{useState} from 'react';
import {Alert} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useVault} from '../../src/state/vault';
import {Screen,IconBtn,Empty} from '../../src/ui/kit';
import {ItemList} from '../../src/screens/ItemList';
import {VaultForm} from '../(tabs)/vaults';
import {View} from 'react-native';

export default function VaultScreen(){
  const {id}=useLocalSearchParams<{id:string}>();const v=useVault();const vault=v.payload.vaults.find(x=>x.id===id);const [edit,setEdit]=useState(false);
  if(!vault)return <Screen title="Coffre"><Empty icon="alert-circle" title="Coffre introuvable" text=""/></Screen>;
  const items=v.payload.items.filter(i=>i.vaultId===id);
  const menu=()=>Alert.alert(vault.name,'Gérer ce coffre',[{text:'Renommer',onPress:()=>setEdit(true)},{text:vault.favorite?'Retirer des favoris':'Ajouter aux favoris',onPress:()=>v.toggleVaultFavorite(vault.id)},
    {text:'Supprimer',style:'destructive',onPress:()=>Alert.alert('Supprimer « '+vault.name+' » ?',items.length?`Ses ${items.length} élément(s) seront déplacés dans « ${v.payload.vaults.find(x=>x.id!==id)?.name} ».`:'Ce coffre est vide.',
      [{text:'Annuler',style:'cancel'},{text:'Supprimer',style:'destructive',onPress:async()=>{try{await v.deleteVault(vault.id);router.back();}catch(e:any){Alert.alert('Impossible',e.message);}}}])},{text:'Fermer',style:'cancel'}]);
  return <Screen title={vault.name} subtitle={`${items.length} élément${items.length>1?'s':''}`} right={<View style={{flexDirection:'row',gap:8}}><IconBtn name="plus" label="Ajouter" onPress={()=>router.push(`/edit?vault=${id}`)}/><IconBtn name="more-horizontal" label="Options" onPress={menu}/></View>}>
    <ItemList items={items} byType/><VaultForm visible={edit} onClose={()=>setEdit(false)} initial={vault}/>
  </Screen>;
}
