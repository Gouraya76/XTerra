// Signe l'APK release avec la clé définitive JILANI VAULT si les variables d'environnement sont présentes
// (ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD). Même clé à chaque build ⇒ mises à jour par simple installation.
const {withDangerousMod,withAppBuildGradle}=require('expo/config-plugins');
const fs=require('fs'),path=require('path');
module.exports=function withReleaseSigning(config){
  if(!process.env.ANDROID_KEYSTORE_BASE64)return config;
  config=withDangerousMod(config,['android',async c=>{
    fs.writeFileSync(path.join(c.modRequest.platformProjectRoot,'app','jilani-release.keystore'),Buffer.from(process.env.ANDROID_KEYSTORE_BASE64,'base64'));return c;}]);
  return withAppBuildGradle(config,c=>{
    let g=c.modResults.contents;
    if(!g.includes('jilaniRelease')){
      g=g.replace(/signingConfigs\s*\{/,`signingConfigs {
        jilaniRelease {
            storeFile file('jilani-release.keystore')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias 'jilanivault'
            keyPassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
        }`);
      g=g.replace(/(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,'$1signingConfig signingConfigs.jilaniRelease');
    }
    c.modResults.contents=g;return c;});
};
