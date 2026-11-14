import React,{useCallback,useState} from 'react';
import {Alert,KeyboardAvoidingView,Platform,ScrollView,Switch,Text,View,Pressable} from 'react-native';
import {router,useLocalSearchParams,useFocusEffect} from 'expo-router';
import {useVault} from '../src/state/vault';
import {Screen,Glass,Btn,Input,Chip,Icon,IconBtn,Section} from '../src/ui/kit';
import {Thumb} from '../src/ui/items';
import {Item,ItemType,TYPES,newItem,typeDef,validateItem,uid,FORBIDDEN_LABEL} from '../src/core/model';
import {generatePassword,strength} from '../src/core/password';
import {takeGenerated} from './generator';
import {pickImages,pickFiles} from '../src/screens/actions';
import {T,font} from '../src/ui/theme';

export default function Edit(){
  const prm=useLocalSearchParams<{type?:string,id?:string,vault?:string,title?:string}>();const v=useVault();
  const existing=prm.id?v.payload.items.find(i=>i.id===prm.id):undefined;
  const [it,setIt]=useState<Item>(()=>existing?JSON.parse(JSON.stringify(existing)):{...newItem((prm.type as ItemType)||'password',prm.vault||v.payload.vaults[0]?.id||'v0'),title:prm.title||''});
  const [tags,setTags]=useState(it.tags.join(', '));const [dirty,setDirty]=useState(false);
  const up=(p:Partial<Item>)=>{setIt(x=>({...x,...p}));setDirty(true);};const setData=(k:string,val:string)=>{setIt(x=>({...x,data:{...x.data,[k]:val}}));setDirty(true);};
  useFocusEffect(useCallback(()=>{const g=takeGenerated();if(g)setData('password',g);},[]));
  const d=typeDef(it.type);
  async function save(){const item={...it,tags:tags.split(',').map(t=>t.trim()).filter(Boolean),custom:it.custom.filter(c=>c.label.trim()||c.value.trim())};
    const err=validateItem(item);if(err)return Alert.alert('À vérifier',err);
    try{await v.saveItem(item);router.back();}catch(e:any){Alert.alert('Enregistrement impossible',e.message);}}
  function close(){if(!dirty)return router.back();Alert.alert('Abandonner les modifications ?','',[{text:'Continuer',style:'cancel'},{text:'Abandonner',style:'destructive',onPress:()=>router.back()}]);}
  async function addAtt(kind:'photo'|'camera'|'file'){try{const a=kind==='file'?await pickFiles(v):await pickImages(v,kind==='camera');if(a.length){up({attachments:[...it.attachments,...a]});}}catch(e:any){Alert.alert('Ajout impossible',e.message);}}
  return <Screen title={existing?'Modifier':'Nouvel élément'} subtitle={d.singular} right={<IconBtn name="x" label="Fermer" onPress={close}/>} back={false}>
    <View>
      {!existing&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}} style={{marginBottom:14}}>
        {TYPES.map(t=><Chip key={t.id} icon={t.icon} label={t.singular} active={it.type===t.id} onPress={()=>up({type:t.id})}/>)}</ScrollView>}
      <Input label={it.type==='password'||it.type==='api'?'Nom du service':it.type==='card'?'Nom de la carte':'Titre'} icon="type" value={it.title} onChangeText={t=>up({title:t})} autoCapitalize="sentences" placeholder="Ex. Netflix, Fish Audio, Carte principale…"/>
      {d.fields.map(f=>f.kind==='select'
        ?<View key={f.key} style={{marginBottom:12}}><Text style={[font.small,{marginBottom:6,marginLeft:4}]}>{f.label}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{f.options!.map(o=><Chip key={o} label={o} active={it.data[f.key]===o} onPress={()=>setData(f.key,o)}/>)}</View></View>
        :<View key={f.key}>
          <Input label={f.label} secret={f.secret} multiline={f.kind==='multiline'} value={it.data[f.key]||''} placeholder={f.placeholder}
            onChangeText={t=>setData(f.key,f.kind==='expiry'?t.replace(/[^\d]/g,'').slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2'):f.kind==='number'?t.replace(/[^\d ]/g,''):t)}
            keyboardType={f.kind==='email'?'email-address':f.kind==='url'?'url':f.kind==='number'||f.kind==='expiry'?'number-pad':'default'}
            autoCapitalize={f.kind==='multiline'?'sentences':'none'} icon={f.kind==='url'?'globe':f.kind==='email'?'at-sign':f.secret?'lock':undefined}
            right={f.kind==='password'?<View style={{flexDirection:'row',gap:6,marginLeft:8}}><IconBtn size={32} name="refresh-cw" label="Générer" onPress={()=>setData('password',generatePassword())}/><IconBtn size={32} name="sliders" label="Options" onPress={()=>router.push('/generator?pick=1')}/></View>:undefined}/>
          {f.kind==='password'&&!!it.data.password&&<Text style={[font.micro,{marginTop:-6,marginBottom:12,marginLeft:6}]}>Robustesse : {strength(it.data.password).label}</Text>}
        </View>)}
      {it.type==='card'&&<Glass padding={12} style={{marginBottom:12}}><View style={{flexDirection:'row',gap:10}}><Icon name="shield" size={16}/><Text style={[font.small,{flex:1}]}>EYELIOS ne demande et n’enregistre jamais de code PIN ni de CVV. Évite de stocker la photo recto-verso complète d’une carte.</Text></View></Glass>}
      {it.type==='note'&&<Text style={[font.micro,{marginTop:-6,marginBottom:12,marginLeft:6}]}>{(it.data.body||'').length} caractères</Text>}
      {it.type!=='note'&&<Input label="Description" multiline value={it.description} onChangeText={t=>up({description:t})} autoCapitalize="sentences" placeholder="Détails, contexte…"/>}
      <Input label="Tags (séparés par des virgules)" icon="tag" value={tags} onChangeText={t=>{setTags(t);setDirty(true);}} placeholder="travail, important…"/>
      <Text style={[font.small,{marginBottom:8,marginLeft:4}]}>Coffre</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}} style={{marginBottom:14}}>{v.payload.vaults.map(c=><Chip key={c.id} icon={c.icon} label={c.name} active={it.vaultId===c.id} onPress={()=>up({vaultId:c.id})}/>)}</ScrollView>
      <Glass padding={14}><View style={{flexDirection:'row',alignItems:'center'}}><Icon name="star" size={18}/><Text style={[font.body,{flex:1,marginLeft:10}]}>Favori</Text><Switch value={it.favorite} onValueChange={x=>up({favorite:x})} trackColor={{true:T.steel,false:T.slate}} thumbColor={T.ice}/></View></Glass>

      <Section title="Champs personnalisés" icon="list"/>
      {it.custom.map(c=><Glass key={c.id} padding={12} style={{marginBottom:10}}>
        <Input label="Nom du champ" value={c.label} onChangeText={t=>up({custom:it.custom.map(x=>x.id===c.id?{...x,label:t}:x)})} autoCapitalize="sentences"/>
        {FORBIDDEN_LABEL.test(c.label)&&<Text style={[font.small,{marginTop:-6,marginBottom:8}]}>⚠ PIN et CVV ne doivent pas être enregistrés.</Text>}
        <Input label="Valeur" secret={c.secret} value={c.value} onChangeText={t=>up({custom:it.custom.map(x=>x.id===c.id?{...x,value:t}:x)})}/>
        <View style={{flexDirection:'row',gap:8}}><Btn small icon={c.secret?'lock':'unlock'} title={c.secret?'Secret':'Visible'} onPress={()=>up({custom:it.custom.map(x=>x.id===c.id?{...x,secret:!x.secret}:x)})}/><Btn small icon="trash-2" title="Retirer" kind="danger" onPress={()=>up({custom:it.custom.filter(x=>x.id!==c.id)})}/></View>
      </Glass>)}
      <Btn icon="plus" title="Ajouter un champ" onPress={()=>up({custom:[...it.custom,{id:uid(),label:'',value:'',secret:false}]})}/>

      <Section title="Pièces jointes chiffrées" icon="paperclip"/>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:10}}>
        {it.attachments.map(a=><View key={a.id}><Thumb att={a} size={92}/><Pressable onPress={()=>up({attachments:it.attachments.filter(x=>x.id!==a.id)})} accessibilityLabel={'Retirer '+a.name}
          style={{position:'absolute',top:-6,right:-6,width:26,height:26,borderRadius:13,backgroundColor:T.charcoal,borderWidth:1,borderColor:T.glassBorderStrong,alignItems:'center',justifyContent:'center'}}><Icon name="x" size={14}/></Pressable></View>)}
      </View>
      <View style={{flexDirection:'row',gap:8}}><Btn small icon="image" title="Galerie" onPress={()=>addAtt('photo')}/><Btn small icon="camera" title="Photo" onPress={()=>addAtt('camera')}/><Btn small icon="file" title="Fichier" onPress={()=>addAtt('file')}/></View>
      <Btn kind="primary" icon="check" title="Enregistrer dans EYELIOS" onPress={save} style={{marginTop:26}}/>
    </View>
  </Screen>;
}
