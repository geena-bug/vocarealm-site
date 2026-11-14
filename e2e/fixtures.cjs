const base=require('@playwright/test');

// Every test fails on uncaught page errors, and never reaches the real Supabase project:
// Auth and the pronunciation function get canned responses so tests are repeatable and send no email.
const test=base.test.extend({
  supabase:[async({page},use)=>{
    const calls=[];
    await page.route(/\.supabase\.co\//,route=>{
      const req=route.request(),url=req.url();calls.push({method:req.method(),url});
      const json=(status,body)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
      if(url.includes('/functions/v1/pronunciation-assessment'))return json(200,{configured:false});
      if(url.includes('/auth/v1/token'))return json(400,{code:400,error_code:'invalid_credentials',msg:'Invalid login credentials'});
      if(url.includes('/auth/v1/'))return json(200,{});
      return json(200,[]);
    });
    await use(calls);
  },{auto:true}],
  pageErrors:[async({page},use)=>{
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await use(errors);
    base.expect(errors,'uncaught errors in the page').toEqual([]);
  },{auto:true}]
});

module.exports={test,expect:base.expect};
