import React from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {View} from 'react-native';
import {VaultProvider,useVault,useUi} from '../src/state/vault';
import {Busy,ToastView} from '../src/ui/kit';
import {T} from '../src/ui/theme';
import LockScreen from '../src/screens/LockScreen';

function UiLayer(){const u=useUi();return <><Busy text={u.busy}/><ToastView toast={u.toast}/></>;}
function Gate(){
  const v=useVault();
  return <View style={{flex:1,backgroundColor:T.black}}>
    {v.status==='unlocked'
      ?<Stack screenOptions={{headerShown:false,animation:'slide_from_right',contentStyle:{backgroundColor:T.black}}}>
        <Stack.Screen name="(tabs)" options={{animation:'fade'}}/>
        <Stack.Screen name="edit" options={{animation:'slide_from_bottom'}}/>
        <Stack.Screen name="search" options={{animation:'fade'}}/>
      </Stack>
      :<LockScreen/>}
    <UiLayer/>
  </View>;
}
export default function Root(){return <SafeAreaProvider><StatusBar style="light"/><VaultProvider><Gate/></VaultProvider></SafeAreaProvider>;}
