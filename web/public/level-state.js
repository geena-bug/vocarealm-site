window.vocaLevelReady=(async()=>{
 const auth=window.vocaAuth?await window.vocaAuth.ready:{user:null};
 const key='vocarealm-path-v1-'+(auth.user?.id||'guest');let saved={};
 try{saved=JSON.parse(localStorage.getItem(key))||{};}catch{}
 if(typeof saved!=='object'||Array.isArray(saved))saved={};
 if(!['A1','A2','B1','B2','C1','C2'].includes(saved.selectedLevel))saved.selectedLevel='A1';
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(saved));return true;}catch{return false;}};
 return {data:saved,save,key};
})();
