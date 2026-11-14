import {requireOptionalNativeModule} from 'expo-modules-core';
/** Cryptographie native Android (javax.crypto) — nul sur web / si absent. */
export default requireOptionalNativeModule<{
  pbkdf2Sha256(password:string,saltB64:string,iterations:number,keyLen:number):Promise<string>,
  aesGcmSeal(keyB64:string,dataB64:string):Promise<string>,
  aesGcmOpen(keyB64:string,sealedB64:string):Promise<string>,
}>('EyeliosCrypto');
