import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import { checkRequest, schema, system, translationResult, userMessage } from './response.js';
// Browser origins allowed to call this function. Override with the ALLOWED_ORIGINS secret (comma-separated), e.g. to add http://localhost:4400.
const origins=(Deno.env.get('ALLOWED_ORIGINS')||'https://vocarealm.vercel.app,https://vocarealm-explore.steadytern512.chatgpt.site').split(',').map(o=>o.trim()).filter(Boolean);
const headers=(origin:string|null)=>({'Access-Control-Allow-Origin':origin&&origins.includes(origin)?origin:origins[0],'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Vary':'Origin'});
const history=new Map<string,number[]>();
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin'),cors=headers(origin);
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(origin&&!origins.includes(origin))return json({error:'origin_not_allowed',message:'This site is not allowed to use automatic translation. Add its address to the ALLOWED_ORIGINS secret.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 const key=Deno.env.get('ANTHROPIC_API_KEY'),configured=!!key;
 if(req.method==='GET')return json({configured});
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 if(!configured)return json({error:'not_configured',message:'Automatic translation is not set up yet: the vocabulary-translate function has no ANTHROPIC_API_KEY secret.'},503);
 // Validate identity server-side, including current user status. Never trust client user IDs.
 const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return json({error:'sign_in_required',message:'Log in to translate words that are not in the word bank yet.'},401);
 const auth=await fetch(Deno.env.get('SUPABASE_URL')+'/auth/v1/user',{headers:{Authorization:authorization,apikey:Deno.env.get('SUPABASE_ANON_KEY')!}}).catch(()=>null);
 if(!auth?.ok)return json({error:'sign_in_required',message:'Please log in again to translate new words.'},401);
 const user=await auth.json();if(!user.id)return json({error:'sign_in_required'},401);
 const now=Date.now(),recent=(history.get(user.id)||[]).filter(t=>now-t<600000);
 if(recent.length>=20)return json({error:'rate_limit',message:'You have translated 20 words in the last 10 minutes. Please wait a few minutes and try again.'},429);
 let input;try{input=checkRequest(await req.json());}catch{input={error:'invalid_request',message:'Enter one word or a short expression.'};}
 if('error' in input)return json(input,400);
 recent.push(now);history.set(user.id,recent);if(history.size>5000)for(const [id,times] of history)if(!times.some(t=>now-t<600000))history.delete(id);
 try{
  const client=new Anthropic({apiKey:key,timeout:30000,maxRetries:1});
  const response=await client.beta.messages.create({
   model:'claude-opus-5-5',
   max_tokens:4000,
   betas:['server-side-fallback-2026-07-01'],
   fallbacks:'default',
   output_config:{effort:'low',format:{type:'json_schema',schema}},
   system,
   messages:[{role:'user',content:userMessage(input)}]
  });
  if(response.stop_reason==='refusal')return json({error:'unclear_input',message:'That word could not be translated. Try a different word or expression.'},422);
  const text=response.content.find(b=>b.type==='text');
  if(response.stop_reason==='max_tokens'||!text||text.type!=='text')return json({error:'translation_unavailable',message:'The translation was incomplete. Please try again.'},502);
  const result=translationResult(text.text);return json(result,'error' in result?422:200);
 }catch(e){
  if(e instanceof Anthropic.AuthenticationError)return json({error:'not_configured',message:'Automatic translation is not set up correctly: the ANTHROPIC_API_KEY secret was rejected.'},503);
  if(e instanceof Anthropic.RateLimitError)return json({error:'rate_limit',message:'Translation is busy right now. Please try again in a minute.'},429);
  return json({error:'translation_unavailable',message:'Translation is unavailable right now. Please try again later.'},502);
 }
});
