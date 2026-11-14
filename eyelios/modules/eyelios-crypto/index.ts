import {requireOptionalNativeModule} from 'expo-modules-core';
/** PBKDF2-HMAC-SHA256 natif Android (javax.crypto) — nul sur web / si absent. */
export default requireOptionalNativeModule<{pbkdf2Sha256(password:string,saltB64:string,iterations:number,keyLen:number):Promise<string>}>('EyeliosCrypto');
