// Test hors appareil : même algorithme que src/vault.ts (AES-256-GCM + PBKDF2-SHA256 async).
import {gcm} from '@noble/ciphers/aes';import {utf8ToBytes,bytesToUtf8} from '@noble/ciphers/utils';
import {pbkdf2Async} from '@noble/hashes/pbkdf2';import {sha256} from '@noble/hashes/sha2';
import {toByteArray,fromByteArray} from 'base64-js';import {randomBytes} from 'node:crypto';import assert from 'node:assert';
const derive=(p,s)=>pbkdf2Async(sha256,utf8ToBytes(p),toByteArray(s),{c:600000,dkLen:32,asyncTick:20});
const salt=fromByteArray(randomBytes(16));const k=await derive('Mot-de-passe-très-sûr-é🔐',salt);
const payload={items:[{id:'1',title:'Carte é€',category:'bank',keywords:['x'],notes:'n',fields:[{id:'f',label:'PIN',value:'1234',secret:true}],attachments:[{id:'a',name:'p.png',mimeType:'image/png',size:3,base64:'AAEC'}],createdAt:1,updatedAt:1}]};
const iv=randomBytes(12);const ct=gcm(k,iv).encrypt(utf8ToBytes(JSON.stringify(payload)));
// format de sauvegarde exporté
const backup=JSON.parse(JSON.stringify({format:'JILANI_VAULT_BACKUP',version:2,salt,iv:fromByteArray(iv),ciphertext:fromByteArray(ct)}));
const k2=await derive('Mot-de-passe-très-sûr-é🔐',backup.salt);
assert.deepStrictEqual(JSON.parse(bytesToUtf8(gcm(k2,toByteArray(backup.iv)).decrypt(toByteArray(backup.ciphertext)))),payload);
const bad=await derive('mauvais-mot-de-passe!!',backup.salt);
assert.throws(()=>gcm(bad,toByteArray(backup.iv)).decrypt(toByteArray(backup.ciphertext)));
const t=toByteArray(backup.ciphertext);t[0]^=1;assert.throws(()=>gcm(k2,toByteArray(backup.iv)).decrypt(t));
// vecteur RFC 7914 / référence PBKDF2-SHA256
const {pbkdf2Sync}=await import('node:crypto');assert.strictEqual(Buffer.from(k).toString('hex'),pbkdf2Sync(Buffer.from('Mot-de-passe-très-sûr-é🔐'),Buffer.from(toByteArray(salt)),600000,32,'sha256').toString('hex'));
console.log('OK : aller-retour, sauvegarde, mauvais mot de passe rejeté, altération détectée, PBKDF2 conforme à OpenSSL');
