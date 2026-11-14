(async()=>{
 const auth=window.vocaAuth;if(!auth)return;
 const state=await auth.ready;
 let nav=document.querySelector('nav.links')||document.querySelector('nav .links');
 if(state.user&&nav){for(const a of nav.querySelectorAll('a[href="signup.html"],a[href="login.html"]'))a.remove();const a=document.createElement('a');a.className='btn blue';a.href='levels.html';a.textContent='Continue learning →';const b=document.createElement('button');b.className='btn';b.textContent='Log out';b.onclick=logout;nav.append(a,b);}
 async function logout(){const {error}=await auth.client.auth.signOut({scope:'local'});if(error){const n=document.getElementById('accountNavStatus');if(n)n.textContent='Could not log out. Please try again.';return;}location.replace('index.html');}
})();
