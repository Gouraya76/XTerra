import React,{useRef,useState} from 'react';
import {FlatList,KeyboardAvoidingView,Linking,Platform,Text,TextInput,View,Pressable,Alert} from 'react-native';
import {router} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {useVault} from '../../src/state/vault';
import {Background,Glass,Icon,IconBtn,Tile,Btn,Chip,mask} from '../../src/ui/kit';
import {primarySecret,subtitle} from '../../src/ui/items';
import {parseIntent,findItems,resolveVault,HELP_TEXT} from '../../src/core/assistant';
import {Item,typeDef} from '../../src/core/model';
import {generatePassword} from '../../src/core/password';
import {askAI,ChatTurn} from '../../src/storage/ai';
import {confirmUser,bioAvailable} from '../../src/storage/secure';
import {T,font} from '../../src/ui/theme';

type Action={label:string,icon:string,danger?:boolean,run:()=>Promise<string|void>};
type Msg={id:string,role:'user'|'assistant',text:string,items?:string[],action?:Action,done?:boolean,generated?:string,ai?:boolean,chips?:{label:string,to:string}[]};
const SUGGESTIONS=['Retrouve mon mot de passe Netflix','Montre-moi mes clés API','Où est mon document d’assurance ?','Génère un mot de passe','Que peux-tu faire ?'];

/** Révéler ou copier un secret depuis l'assistant exige une nouvelle authentification (biométrie ou code de l'appareil). */
async function guard(v:ReturnType<typeof useVault>){if(!(await bioAvailable()))return true;return v.external(()=>confirmUser('Confirme ton identité pour accéder à ce secret'));}

const Act=({icon,label,onPress}:{icon:string,label:string,onPress:()=>void})=><Glass blur={false} padding={10} radius={14} onPress={onPress}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Icon name={icon} size={17}/><Text style={{color:T.ice,fontSize:13.5}} numberOfLines={1}>{label}</Text></View></Glass>;
function ItemCard({item}:{item:Item}){
  const v=useVault();const [show,setShow]=useState(false);const sec=primarySecret(item);
  const copySec=async()=>{if(sec&&await guard(v)){await v.copy(sec.value,sec.label);v.log('Assistant : secret copié',item.title);}};
  return <View style={{marginTop:8,gap:7}}>
    <Glass blur={false} padding={10} radius={16}><View style={{flexDirection:'row',alignItems:'center',gap:10}}>
      <Tile size={40} letter={['password','api','card'].includes(item.type)?item.title[0]:undefined} icon={typeDef(item.type).icon}/>
      <View style={{flex:1}}><Text style={font.h3} numberOfLines={1}>{item.title}</Text><Text style={[font.small,{color:T.ice,fontFamily:show?'monospace':undefined}]} numberOfLines={1}>{sec&&<Text style={{color:T.electric}}>● </Text>}{sec?(show?sec.value:'********'):subtitle(item)}</Text></View>
      {sec&&<Pressable hitSlop={10} accessibilityLabel="Afficher" onPress={async()=>{if(show)return setShow(false);if(await guard(v)){setShow(true);v.log('Assistant : secret affiché',item.title);}}}><Icon name={show?'eye-off':'eye'} size={20}/></Pressable>}
      {sec&&<Pressable hitSlop={10} accessibilityLabel="Copier" onPress={copySec}><Icon name="copy" size={19}/></Pressable>}
    </View></Glass>
    {sec&&<Act icon="copy" label={`Copier le ${sec.label.toLowerCase()}`} onPress={copySec}/>}
    {!!item.data.url&&<Act icon="external-link" label={`Ouvrir le site ${item.title}`} onPress={()=>Linking.openURL(item.data.url)}/>}
    <Act icon="maximize-2" label="Voir les détails" onPress={()=>router.push(`/item/${item.id}`)}/>
  </View>;
}

export default function Assistant(){
  const v=useVault();const ins=useSafeAreaInsets();const [input,setInput]=useState('');const [msgs,setMsgs]=useState<Msg[]>([]);const [thinking,setThinking]=useState(false);
  const lastItem=useRef<string|null>(null);const list=useRef<FlatList>(null);
  const push=(m:Omit<Msg,'id'>)=>setMsgs(x=>[...x,{...m,id:Math.random().toString(36).slice(2)}]);
  const say=(text:string,extra:Partial<Msg>={})=>push({role:'assistant',text,...extra});

  async function send(raw?:string){const text=(raw??input).trim();if(!text||thinking)return;setInput('');push({role:'user',text});
    const p=v.payload;const intent=parseIntent(text);
    const pickOne=(q:string)=>{const id=q?findItems(p.items,p.vaults,q)[0]?.id:lastItem.current;return p.items.find(i=>i.id===id);};
    switch(intent.kind){
      case 'help':return say(HELP_TEXT);
      case 'lock':say('Coffre verrouillé. À bientôt.');setTimeout(v.lock,600);return;
      case 'generate':{const g=generatePassword({length:intent.length,upper:true,lower:true,digits:true,symbols:true});return say(`Voici un mot de passe aléatoire de ${intent.length} caractères :`,{generated:g});}
      case 'vaults':return say(`Tu as ${p.vaults.length} coffres :`,{chips:p.vaults.map(c=>({label:`${c.name} (${p.items.filter(i=>i.vaultId===c.id).length})`,to:`/vault/${c.id}`}))});
      case 'list':{const items=p.items.filter(i=>i.type===intent.type);const d=typeDef(intent.type);await v.log('Assistant : liste',d.label);
        if(!items.length)return say(`Tu n’as encore aucun élément dans « ${d.label} ».`);if(items.length===1)lastItem.current=items[0].id;
        return say(`${items.length} élément${items.length>1?'s':''} dans « ${d.label} »${items.length>6?' (6 plus récents affichés)':''} :`,{items:items.slice(0,6).map(i=>i.id),chips:items.length>6?[{label:'Tout voir',to:`/category/${intent.type}`}]:undefined});}
      case 'find':{const r=findItems(p.items,p.vaults,intent.query,intent.type);await v.log('Assistant : recherche',intent.query);
        if(!r.length)return say(`Je n’ai rien trouvé pour « ${intent.query} » dans ton coffre.`,{chips:[{label:'Créer une fiche',to:`/edit?type=${intent.type||'password'}&title=${encodeURIComponent(intent.query)}`}]});
        lastItem.current=r[0].id;const nm=(v.email.split('@')[0]||'').split(/[._-]/)[0];const hi=nm?nm[0].toUpperCase()+nm.slice(1):'';return say(r.length===1?`Bien sûr${hi?' '+hi:''}, voici ${r[0].type==='password'?'tes identifiants':'ton élément'} ${r[0].title} :`:`${r.length} résultats, les plus pertinents d’abord :`,{items:r.slice(0,5).map(i=>i.id)});}
      case 'create':{const d=typeDef(intent.type);
        return say(`Je prépare une nouvelle fiche « ${d.singular} »${intent.title?` nommée « ${intent.title} »`:''}. Tu compléteras les informations sensibles toi-même.`,
          {action:{label:'Créer la fiche',icon:'plus',run:async()=>{router.push(`/edit?type=${intent.type}&title=${encodeURIComponent(intent.title)}`);}}});}
      case 'move':{const it=pickOne(intent.query);const vault=resolveVault(p.vaults,intent.vaultName);
        if(!it)return say('Je n’ai pas trouvé l’élément à classer. Précise son nom, par exemple « classe Assurance dans Administratif ».');
        if(!vault)return say(`Le coffre « ${intent.vaultName} » n’existe pas.`,{chips:[{label:'Voir mes coffres',to:'/vaults'}]});
        lastItem.current=it.id;return say(`Classer « ${it.title} » dans le coffre « ${vault.name} » ?`,{action:{label:'Confirmer le classement',icon:'folder',run:async()=>{await v.moveItem(it.id,vault.id);return `« ${it.title} » est maintenant dans « ${vault.name} ».`;}}});}
      case 'delete':{const it=pickOne(intent.query);if(!it)return say('Je n’ai pas trouvé cet élément.');lastItem.current=it.id;
        return say(`Supprimer définitivement « ${it.title} » (${typeDef(it.type).singular}) ? Cette action est irréversible.`,{items:[it.id],action:{label:'Supprimer',icon:'trash-2',danger:true,run:async()=>{await v.deleteItem(it.id);return `« ${it.title} » a été supprimé.`;}}});}
      case 'general':{
        if(!p.settings.aiEnabled)return say('Pour les questions générales, la rédaction et les résumés, active un fournisseur d’IA dans Paramètres → Assistant IA (connexion internet requise). Les recherches et actions sur ton coffre fonctionnent déjà, hors ligne. Tape « aide » pour les exemples.',{chips:[{label:'Configurer l’IA',to:'/ai'}]});
        setThinking(true);
        try{const hist:ChatTurn[]=[...msgs.filter(m=>m.ai||(m.role==='user'&&parseIntent(m.text).kind==='general')).map(m=>({role:m.role,content:m.text})),{role:'user',content:text}];
          say(await askAI(hist,p.settings.aiModel),{ai:true});await v.log('Assistant : question IA','');}
        catch(e:any){say(e.message);}finally{setThinking(false);}
      }
    }
  }
  async function runAction(m:Msg){if(!m.action||m.done)return;setMsgs(x=>x.map(y=>y.id===m.id?{...y,done:true}:y));
    try{const r=await m.action.run();if(r)say(r);}catch(e:any){say('Action impossible : '+e.message);}}

  const render=({item:m}:{item:Msg})=>m.role==='user'
    ?<View style={{alignSelf:'flex-end',maxWidth:'84%',marginVertical:6,borderRadius:20,borderBottomRightRadius:6,overflow:'hidden'}}>
      <LinearGradient colors={[T.a(T.electric,0.55),T.a(T.deep,0.6)]} style={{paddingVertical:11,paddingHorizontal:15,borderWidth:1,borderColor:T.light,borderRadius:20,borderBottomRightRadius:6}}><Text style={[font.body,{color:T.ice}]}>{m.text}</Text></LinearGradient></View>
    :<View style={{flexDirection:'row',gap:8,marginVertical:6,maxWidth:'94%'}}>
      <View style={{width:30,height:30,borderRadius:15,borderWidth:1,borderColor:T.light,alignItems:'center',justifyContent:'center',marginTop:2,boxShadow:T.glowShadow} as any}><Icon name="zap" size={14} color={T.light}/></View>
      <Glass padding={13} radius={20} style={{flex:1}}>
        <Text selectable style={[font.body,{color:T.ice}]}>{m.text}</Text>
        {m.generated&&<><Text selectable style={{color:T.ice,fontFamily:'monospace',fontSize:16,marginTop:10}}>{m.generated}</Text><Btn small icon="copy" title="Copier" style={{marginTop:10}} onPress={()=>v.copy(m.generated!,'Mot de passe')}/></>}
        {m.items?.map(id=>{const it=v.payload.items.find(i=>i.id===id);return it?<ItemCard key={id} item={it}/>:null;})}
        {m.action&&<Btn small kind={m.done?'glass':m.action.danger?'danger':'primary'} disabled={m.done} icon={m.done?'check':m.action.icon} title={m.done?'Fait':m.action.label} style={{marginTop:10}} onPress={()=>runAction(m)}/>}
        {m.chips&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10}}>{m.chips.map(c=><Chip key={c.label} label={c.label} onPress={()=>router.push(c.to as any)}/>)}</View>}
        {m.ai&&<Text style={[font.micro,{marginTop:8}]}>Réponse générée par IA · peut contenir des erreurs</Text>}
      </Glass></View>;

  return <Background><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <View style={{alignItems:'center',paddingTop:ins.top+10,paddingBottom:8}}>
      <View style={{width:62,height:62,borderRadius:31,borderWidth:2,borderColor:T.light,alignItems:'center',justifyContent:'center',backgroundColor:T.a(T.electric,0.35),boxShadow:T.glowStrong} as any}><Icon name="star" size={28}/></View>
      <Text style={[font.h2,{marginTop:8,fontSize:22}]}>Assistant EYELIOS</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{width:22,height:1,backgroundColor:T.textDim}}/><Text style={[font.small,{color:T.ice}]}>Votre IA personnelle et sécurisée</Text><View style={{width:22,height:1,backgroundColor:T.textDim}}/></View>
      <Text style={[font.micro,{marginTop:2}]}>{v.payload.settings.aiEnabled?'Coffre en local · IA connectée':'Mode local · hors ligne'}</Text>
    </View>
    <FlatList ref={list} data={msgs} keyExtractor={m=>m.id} renderItem={render} contentContainerStyle={{paddingHorizontal:T.gutter,paddingBottom:16}} onContentSizeChange={()=>list.current?.scrollToEnd({animated:true})}
      keyboardShouldPersistTaps="handled" ListEmptyComponent={<View style={{marginTop:20,gap:10}}>
        <Glass><Text style={font.body}>Bonjour ! Je peux retrouver, créer, classer ou supprimer des éléments de ton coffre, directement sur ton téléphone. Les secrets restent masqués et ne sont jamais envoyés à un service externe.</Text></Glass>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{SUGGESTIONS.map(s=><Chip key={s} label={s} onPress={()=>send(s)}/>)}</View></View>}
      ListFooterComponent={thinking?<Text style={[font.small,{marginLeft:40,marginTop:4}]}>L’assistant réfléchit…</Text>:null}/>
    <View style={{paddingHorizontal:T.gutter,paddingBottom:ins.bottom+96}}>
      <Glass padding={0} radius={26}><View style={{flexDirection:'row',alignItems:'center',paddingLeft:16,paddingRight:6,gap:8}}>
        <Icon name="search" size={18} color={T.textMute}/>
        <TextInput value={input} onChangeText={setInput} placeholder="Posez votre question…" placeholderTextColor={T.a(T.ice,0.4)} style={{flex:1,color:T.ice,fontSize:15,paddingVertical:14}} onSubmitEditing={()=>send()} returnKeyType="send" multiline={false}/>
        <Pressable hitSlop={8} accessibilityLabel="Dictée" onPress={()=>v.notify('Dictée : touche le micro du clavier','mic')}><Icon name="mic" size={20}/></Pressable>
        <Pressable onPress={()=>send()} accessibilityLabel="Envoyer" style={{width:42,height:42,borderRadius:21,overflow:'hidden',alignItems:'center',justifyContent:'center'}}>
          <LinearGradient colors={[T.electric,T.deep]} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/><Icon name="arrow-up" size={20} color={T.ice}/></Pressable>
      </View></Glass>
    </View>
  </KeyboardAvoidingView></Background>;
}
