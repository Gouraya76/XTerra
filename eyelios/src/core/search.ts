import {Item,Vault,TYPES,ItemType,typeDef} from './model';
/** Normalise : minuscules, sans accents. */
export const fold=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
export type Hit={item:Item,score:number};
/**
 * Recherche universelle. Indexe titre, description, tags, catégorie, coffre, noms de fichiers
 * et champs NON secrets (les secrets ne sont jamais indexés ni affichés dans les résultats).
 */
export function search(items:Item[],vaults:Vault[],query:string):Hit[]{
  const terms=fold(query).split(/\s+/).filter(Boolean);if(!terms.length)return [];
  const vname=Object.fromEntries(vaults.map(v=>[v.id,v.name]));const hits:Hit[]=[];
  for(const it of items){
    const def=typeDef(it.type);
    const pub=def.fields.filter(f=>!f.secret).map(f=>it.data[f.key]||'');
    const custom=it.custom.flatMap(f=>f.secret?[f.label]:[f.label,f.value]);
    const title=fold(it.title),tags=it.tags.map(fold);
    const hay=fold([it.title,it.description,def.label,def.singular,vname[it.vaultId]||'',...it.tags,...pub,...custom,...it.attachments.map(a=>a.name)].join(' \u0001 '));
    let score=0,ok=true;
    for(const t of terms){
      if(!hay.includes(t)){ok=false;break;}
      score+=title===t?50:title.startsWith(t)?30:title.includes(t)?20:tags.some(g=>g.includes(t))?12:5;
    }
    if(ok)hits.push({item:it,score:score+(it.favorite?3:0)});
  }
  return hits.sort((a,b)=>b.score-a.score||b.item.updatedAt-a.item.updatedAt);
}
export function groupByType(hits:Hit[]){const g:{type:ItemType,label:string,hits:Hit[]}[]=[];
  for(const t of TYPES){const h=hits.filter(x=>x.item.type===t.id);if(h.length)g.push({type:t.id,label:t.label,hits:h});}return g;}
export function searchVaults(vaults:Vault[],q:string){const f=fold(q.trim());return f?vaults.filter(v=>fold(v.name).includes(f)):[];}
