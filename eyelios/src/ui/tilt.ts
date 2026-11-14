/** Inclinaison du téléphone (accéléromètre) partagée par toutes les surfaces de verre : le reflet glisse comme dans une vraie vitre. */
import {Animated,Platform,AccessibilityInfo,AppState} from 'react-native';
export const tilt=new Animated.ValueXY({x:0,y:0});
let started=false;
export function startTilt(){
  if(started||Platform.OS==='web')return;started=true;
  AccessibilityInfo.isReduceMotionEnabled().then(async reduce=>{
    if(reduce)return;const {Accelerometer}=await import('expo-sensors');
    if(!(await Accelerometer.isAvailableAsync()))return;
    Accelerometer.setUpdateInterval(60);let sx=0,sy=0;let sub=Accelerometer.addListener(({x,y})=>{
      sx=sx*0.85+x*0.15;sy=sy*0.85+y*0.15; // lissage
      tilt.setValue({x:Math.max(-1,Math.min(1,sx)),y:Math.max(-1,Math.min(1,sy+0.5))});});
    // pas de capteur en arrière-plan (batterie)
    AppState.addEventListener('change',st=>{if(st!=='active'){sub?.remove();sub=null as any;}else if(!sub)sub=Accelerometer.addListener(({x,y})=>{sx=sx*0.85+x*0.15;sy=sy*0.85+y*0.15;tilt.setValue({x:Math.max(-1,Math.min(1,sx)),y:Math.max(-1,Math.min(1,sy+0.5))});});});
  }).catch(()=>{});
}
