/**
 * Gestion du clavier (Android edge-to-edge : la fenêtre n'est plus redimensionnée par le système).
 * - useKeyboardHeight : hauteur réelle du clavier
 * - KbScroll : ScrollView qui ajoute l'espace du clavier et fait défiler le champ actif juste au-dessus
 */
import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Keyboard,Platform,ScrollView,ScrollViewProps,TextInput,useWindowDimensions} from 'react-native';

export function useKeyboardHeight(){
  const [h,setH]=useState(0);
  useEffect(()=>{const show=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillShow':'keyboardDidShow',e=>setH(e.endCoordinates.height));
    const hide=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillHide':'keyboardDidHide',()=>setH(0));return ()=>{show.remove();hide.remove();};},[]);
  return h;
}
type Ctx={reveal:(input:any)=>void};
const KbCtx=createContext<Ctx|null>(null);
export const useKbReveal=()=>useContext(KbCtx);

export function KbScroll({children,contentContainerStyle,restPadding=0,...p}:ScrollViewProps&{restPadding?:number}){
  const ref=useRef<ScrollView>(null);const y=useRef(0);const kb=useKeyboardHeight();const {height:winH}=useWindowDimensions();const pending=useRef<any>(null);
  const doReveal=(input:any,kbH:number)=>{if(!input||!kbH)return;
    input.measureInWindow?.((_x:number,iy:number,_w:number,ih:number)=>{const visibleBottom=winH-kbH-16;const bottom=iy+ih+24;
      if(bottom>visibleBottom)ref.current?.scrollTo({y:y.current+(bottom-visibleBottom),animated:true});
      else if(iy<80)ref.current?.scrollTo({y:Math.max(0,y.current-(100-iy)),animated:true});});};
  useEffect(()=>{if(kb&&pending.current)setTimeout(()=>doReveal(pending.current,kb),60);},[kb]);
  const reveal=(input:any)=>{pending.current=input;if(kb)setTimeout(()=>doReveal(input,kb),60);};
  return <KbCtx.Provider value={{reveal}}>
    <ScrollView ref={ref} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" scrollEventThrottle={32} onScroll={e=>{y.current=e.nativeEvent.contentOffset.y;}}
      contentContainerStyle={[contentContainerStyle,{paddingBottom:kb?kb+40:restPadding}]} {...p}>{children}</ScrollView>
  </KbCtx.Provider>;
}
