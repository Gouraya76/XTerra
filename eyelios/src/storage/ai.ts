/**
 * Fournisseur d'IA : API Claude (Anthropic). La clé est saisie par l'utilisateur dans Paramètres et stockée
 * dans l'Android Keystore — elle n'est jamais dans le code source. AUCUNE donnée du coffre n'est transmise :
 * seuls le texte saisi dans la conversation et l'historique de la conversation sont envoyés.
 */
import Anthropic from '@anthropic-ai/sdk';
import {getAiKey} from './secure';
export type ChatTurn={role:'user'|'assistant',content:string};
const SYSTEM=`Tu es « Assistant EYELIOS », l'assistante intégrée à EYELIOS, un coffre-fort numérique personnel Android hors ligne (mots de passe, clés API, cartes, photos, documents, notes privées ; chiffrement AES-256-GCM ; clé dérivée par PBKDF2-SHA256 600 000 itérations ; déverrouillage biométrique ; sauvegardes chiffrées .eyelios).
Tu réponds en français, de façon concise, claire et élégante. Tu n'as PAS accès au contenu du coffre : les recherches et actions sur le coffre sont exécutées localement par l'application. Si l'utilisateur te demande un secret, explique-lui d'utiliser une commande comme « retrouve mon mot de passe Netflix ». Ne demande jamais de mot de passe, de code PIN ni de CVV.`;
export async function askAI(history:ChatTurn[],model:string){
  const apiKey=await getAiKey();if(!apiKey)throw new Error('Aucun fournisseur d’IA configuré. Ajoute ta clé API Anthropic dans Paramètres → Assistant IA.');
  const client=new Anthropic({apiKey,maxRetries:1,timeout:120000});
  try{
    const r=await client.beta.messages.create({model,max_tokens:16000,system:SYSTEM,messages:history.slice(-20),
      output_config:{effort:'low'},betas:['server-side-fallback-2026-07-01'],fallbacks:'default'} as any);
    if(r.stop_reason==='refusal')return 'Je ne peux pas répondre à cette demande.';
    return r.content.map((b:any)=>b.type==='text'?b.text:'').join('').trim()||'(réponse vide)';
  }catch(e:any){
    if(e instanceof Anthropic.AuthenticationError)throw new Error('Clé API refusée par Anthropic. Vérifie-la dans Paramètres.');
    if(e instanceof Anthropic.RateLimitError)throw new Error('Limite d’utilisation atteinte. Réessaie dans un instant.');
    if(e instanceof Anthropic.APIConnectionError)throw new Error('Pas de connexion internet : seules les fonctions locales du coffre sont disponibles.');
    if(e instanceof Anthropic.APIError)throw new Error('Le fournisseur d’IA a renvoyé une erreur ('+e.status+').');
    throw e;}
}
