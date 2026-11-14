/* Supabase public client. This publishable key grants no privileged database access. */
(() => {
 const config={url:'https://gizmaijlhtwjfmvrlzyv.supabase.co',key:'sb_publishable_LEk1P_O4Oy7uKtC4NZ-Vig_0AAhhrYW'};
 const recoveryLink=new URLSearchParams(location.hash.slice(1)).get('type')==='recovery';
 const client=window.supabase?.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'vocarealm-auth-session'}});
 window.vocaAuth={client,recoveryLink,ready:null};
 window.vocaAuth.ready=(async()=>{if(!client)return {user:null,profile:null,error:'Account connection could not load.'};
  const {data,error}=await client.auth.getUser();
  if(error||!data.user)return {user:null,profile:null,error:null};
  const {data:profile}=await client.from('profiles').select('username').eq('id',data.user.id).maybeSingle();
  return {user:data.user,profile,error:null};
 })();
})();
