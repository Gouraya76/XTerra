// versionCode croissant à chaque build GitHub (numéro de build) pour que chaque APK mette à jour le précédent.
module.exports=({config})=>{
  const n=parseInt(process.env.BUILD_NUMBER||'',10);
  if(n>0){config.android={...config.android,versionCode:n+1};config.version=`3.0.${n}`;}
  config.plugins=[...(config.plugins||[]),'./plugins/withReleaseSigning'];
  return config;
};
