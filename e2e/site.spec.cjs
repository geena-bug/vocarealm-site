const {test,expect}=require('./fixtures.cjs');

const pages=['index.html','demo.html','realms.html','vocabulary.html','levels.html','placement.html','level-practice.html','learn.html','realm-learning.html?realm=cafe','login.html','signup.html','forgot-password.html','reset-password.html','auth-callback.html','pronunciation.html'];

test.describe('every page',()=>{
  for(const p of pages)test(`${p} loads its resources and fits the screen`,async({page})=>{
    const failed=[];
    page.on('response',r=>{if(r.url().startsWith(new URL(page.url()||'http://x').origin)&&r.status()>=400)failed.push(r.status()+' '+r.url());});
    page.on('requestfailed',r=>{if(!/\.supabase\.co\//.test(r.url())&&!r.url().endsWith('.mp4'))failed.push('failed '+r.url());});
    await page.goto(p,{waitUntil:'networkidle'});
    await expect(page).toHaveTitle(/VocaRealm/);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(failed).toEqual([]);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,'page scrolls sideways').toBeLessThanOrEqual(1);
    const broken=await page.$$eval('img',imgs=>imgs.filter(i=>i.complete&&i.getBoundingClientRect().width>0&&i.naturalWidth===0).map(i=>i.src));
    expect(broken).toEqual([]);
  });
});

test('following links from the home page reaches every page, and none are broken',async({page})=>{
  test.skip(test.info().project.name!=='desktop','link crawl runs once');
  test.setTimeout(120000);
  const origin=new URL(page.url()==='about:blank'?(test.info().project.use.baseURL):page.url()).origin;
  const queue=['/'],seen=new Set,reached=new Set,broken=[];
  while(queue.length&&seen.size<80){
    const url=queue.shift(),key=url.split('?')[0];if(seen.has(key))continue;seen.add(key);
    const response=await page.goto(url,{waitUntil:'networkidle'});
    if(!response||!response.ok()){broken.push(url+' '+response?.status());continue;}
    reached.add(new URL(page.url()).pathname.replace(/^\/$/,'/index.html'));
    for(const href of await page.$$eval('a[href]',as=>as.map(a=>a.href))){const u=new URL(href);if(u.origin===origin&&!/\.(png|mp4|jpg)$/.test(u.pathname))queue.push(u.pathname+u.search);}
  }
  expect(broken).toEqual([]);
  // reset-password and auth-callback are only opened from links in emails.
  for(const p of pages.map(p=>'/'+p.split('?')[0]).filter(p=>!['/reset-password.html','/auth-callback.html'].includes(p)))expect([...reached],p+' is not linked from anywhere').toContain(p);
});

test('landing page leads to realms, vocabulary, levels, demo and signup',async({page})=>{
  await page.goto('/');
  for(const [name,url] of [['Explore all 20 realms →',/realms\.html/],['Build my vocabulary →',/vocabulary\.html/],['Find my level →',/placement\.html/],['Let’s try it →',/demo\.html/],['Start your journey ↗',/signup\.html/]]){
    await page.getByRole('link',{name}).click();
    await expect(page).toHaveURL(url);
    await page.goto('/');
  }
});

test.describe('demo',()=>{
  test('wrong answers keep Continue locked; right answers move through all three steps',async({page})=>{
    await page.goto('demo.html');
    const next=page.locator('#demoNext');
    await expect(next).toBeDisabled();
    await page.getByRole('button',{name:'A passport'}).click();
    await expect(page.locator('#demoStatus')).toContainText('Try another answer');
    await expect(next).toBeDisabled();
    await page.getByRole('button',{name:'A reservation'}).click();
    await expect(page.locator('#demoStatus')).toContainText('That’s right');
    await next.click();
    await expect(page.locator('#demoTitle')).toHaveText('You’re the guest');
    await page.getByRole('button',{name:'Merci, au revoir.'}).click();
    await expect(next).toBeDisabled();
    await page.getByRole('button',{name:'Oui, j’ai une réservation.'}).click();
    await next.click();
    await expect(page.locator('#demoTitle')).toHaveText('Now it’s your turn to speak');
    await expect(next).toHaveText('Open Hotel practice →');
    await page.locator('#listenDemo').click();
    await page.locator('#restartDemo').click();
    await expect(page.locator('#demoTitle')).toHaveText('Une réservation');
  });
});

test.describe('realm catalogue',()=>{
  test('lists twenty realms and filters by search and category',async({page})=>{
    await page.goto('realms.html');
    await expect(page.locator('#catalogCount')).toHaveText('20 of 20 realms');
    await expect(page.locator('.catalogcard')).toHaveCount(20);
    await page.locator('#realmSearch').fill('café');
    await expect(page.locator('.catalogcard')).toHaveCount(1);
    await expect(page.locator('.catalogcard')).toContainText('Café');
    await page.locator('#realmSearch').fill('zzzz');
    await expect(page.getByText('No realms match. Try another word or category.')).toBeVisible();
    await page.locator('#realmSearch').fill('');
    await page.locator('#realmCategory').selectOption('Travel');
    const travel=await page.locator('.catalogcard').count();
    expect(travel).toBeGreaterThan(0);expect(travel).toBeLessThan(20);
    await expect(page.locator('.catalogcard').filter({hasText:'Hotel'})).toHaveCount(1);
  });
  test('Hotel opens the Hotel app and other realms open their lesson pack',async({page})=>{
    await page.goto('realms.html');
    await page.locator('.catalogcard').filter({hasText:'Hotel'}).getByRole('link').first().click();
    await expect(page).toHaveURL(/learn\.html\?realm=hotel/);
    await page.goto('realms.html');
    await page.locator('.catalogcard').filter({hasText:'Transport'}).getByRole('link').first().click();
    await expect(page).toHaveURL(/realm-learning\.html\?realm=transport/);
    await expect(page.locator('h1')).toHaveText('Transport');
  });
});

test.describe('realm lessons',()=>{
  test('café pack: vocabulary, reading questions and a typed conversation',async({page})=>{
    await page.goto('realm-learning.html?realm=cafe');
    await expect(page.locator('h1')).toHaveText('Café');
    await page.getByRole('button',{name:'Read & understand'}).click();
    await expect(page.locator('blockquote').first()).toBeVisible();
    await page.getByRole('button',{name:'Show English'}).click();
    await page.getByRole('button',{name:'Conversation',exact:true}).click();
    await page.getByRole('button',{name:'Start conversation'}).click();
    for(let i=0;i<20&&!(await page.getByText('Scene complete').isVisible());i++){
      const reply=page.locator('textarea');
      if(await reply.isVisible()){await reply.fill('Oui, merci.');await page.getByRole('button',{name:'Use my reply'}).click();}
      else await page.getByRole('button',{name:'Continue'}).first().click();
    }
    await expect(page.getByText('Scene complete')).toBeVisible();
    const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-v1')).realmPackProgress);
    expect(Object.keys(progress).some(k=>k.startsWith('cafe:'))).toBe(true);
  });
  test('an unknown realm id does not crash the page',async({page})=>{
    await page.goto('realm-learning.html?realm=not-a-realm');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('Hotel app',()=>{
  test('bottom navigation switches screens and the first lesson starts',async({page})=>{
    await page.goto('learn.html');
    for(const name of [/Progress/,/Profile/,/Home/])await page.locator('#nav').getByRole('button',{name}).click();
    await page.getByRole('button',{name:/Start your first lesson/}).click();
    await expect(page.locator('#session, #app').first()).toBeVisible();
    await page.goto('learn.html');
    await page.locator('#nav').getByRole('button',{name:/Realms/}).click();
    await expect(page).toHaveURL(/realms\.html/);
  });
  test('French audio module is loaded so Listen buttons can play',async({page})=>{
    await page.goto('learn.html');
    expect(await page.evaluate(()=>typeof window.VocaFrenchAudio?.play)).toBe('function');
  });
});

test.describe('vocabulary',()=>{
  const card={term:'un parapluie',meaning:'an umbrella',example:'J’ai oublié mon parapluie.',example_translation:'I forgot my umbrella.',level:'A2',note:''};
  // Stands in for a deployed, configured vocabulary-translate function and a signed-in session.
  async function translationService(page,reply=[200,card]){
    const posts=[];
    await page.route(/functions\/v1\/vocabulary-translate/,route=>{const req=route.request();if(req.method()==='POST')posts.push(req.postDataJSON());return route.fulfill({status:req.method()==='POST'?reply[0]:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(req.method()==='POST'?reply[1]:{configured:true})});});
    await page.goto('vocabulary.html');
    await page.evaluate(()=>{window.vocaAuth.client.auth.getSession=async()=>({data:{session:{access_token:'test-token'}}});});
    return posts;
  }
  test('English → French: a word-bank word fills every field without typing a translation',async({page})=>{
    await page.goto('vocabulary.html');
    await expect(page.locator('#wordForm')).toBeHidden();
    await page.locator('#englishWord').fill('reservation');
    await page.getByRole('button',{name:'Translate'}).click();
    const form=page.locator('#wordForm');
    await expect(form).toBeVisible();
    await expect(form.locator('[name=term]')).toHaveValue(/réservation/);
    await expect(form.locator('[name=meaning]')).toHaveValue(/reservation/);
    await expect(form.locator('[name=example]')).not.toHaveValue('');
    await expect(form.locator('[name=example_translation]')).not.toHaveValue('');
    await expect(page.locator('#englishLookupStatus')).toContainText('word bank');
  });
  test('English → French: a new word is translated by the server, edited, saved and kept after reload',async({page})=>{
    const posts=await translationService(page);
    await page.locator('#englishWord').fill('umbrella');
    await page.locator('#englishWord').press('Enter');
    const form=page.locator('#wordForm');
    await expect(form.locator('[name=term]')).toHaveValue('un parapluie');
    await expect(form.locator('[name=meaning]')).toHaveValue('an umbrella');
    await expect(form.locator('[name=example]')).toHaveValue('J’ai oublié mon parapluie.');
    await expect(form.locator('[name=example_translation]')).toHaveValue('I forgot my umbrella.');
    await expect(form.locator('[name=level]')).toHaveValue('A2');
    expect(posts).toEqual([{text:'umbrella',direction:'en-fr'}]);
    await form.locator('[name=meaning]').fill('an umbrella (for rain)');
    await page.locator('#formListenWord').click();
    await page.locator('#formListenSentence').click();
    await page.locator('#wordSubmit').click();
    await expect(page.locator('#wordStatus')).toContainText('Saved on this browser');
    await page.reload();
    await page.locator('#vocabSearch').fill('parapluie');
    await expect(page.locator('#wordList')).toContainText('un parapluie');
    await expect(page.locator('#wordList')).toContainText('an umbrella (for rain)');
    await expect(page.locator('#wordList')).toContainText('J’ai oublié mon parapluie.');
  });
  test('French → English sends the French word and fills the English fields',async({page})=>{
    const posts=await translationService(page);
    await page.getByRole('button',{name:'French → English'}).click();
    await expect(page.locator('#entryLabel')).toHaveText('French word or expression');
    await page.locator('#englishWord').fill('parapluie');
    await page.getByRole('button',{name:'Translate'}).click();
    await expect(page.locator('#wordForm [name=meaning]')).toHaveValue('an umbrella');
    expect(posts).toEqual([{text:'parapluie',direction:'fr-en'}]);
  });
  test('without translation configured, the page explains the setup and fills nothing',async({page})=>{
    await page.goto('vocabulary.html');
    await page.locator('#englishWord').fill('umbrella');
    await page.getByRole('button',{name:'Translate'}).click();
    await expect(page.locator('#englishLookupStatus')).toContainText('isn’t set up yet');
    await expect(page.locator('#englishLookupStatus')).toContainText('ANTHROPIC_API_KEY');
    await expect(page.locator('#wordForm')).toBeHidden();
    await page.getByRole('button',{name:'Enter the details myself'}).click();
    await expect(page.locator('#wordForm [name=meaning]')).toHaveValue('umbrella');
    await expect(page.locator('#wordForm [name=term]')).toHaveValue('');
  });
  test('server messages such as an unclear word are shown as-is',async({page})=>{
    await translationService(page,[422,{error:'unclear_input',message:'“zzkq” is not a recognisable English word.'}]);
    await page.locator('#englishWord').fill('zzkq');
    await page.getByRole('button',{name:'Translate'}).click();
    await expect(page.locator('#englishLookupStatus')).toHaveText('“zzkq” is not a recognisable English word.');
    await expect(page.locator('#wordForm')).toBeHidden();
  });
  test('required fields are enforced before saving',async({page})=>{
    await page.goto('vocabulary.html');
    await page.locator('#englishWord').fill('umbrella');
    await page.getByRole('button',{name:'Translate'}).click();
    await page.getByRole('button',{name:'Enter the details myself'}).click();
    await page.locator('#wordSubmit').click();
    await expect(page.locator('#wordStatus')).not.toContainText('Saved');
    expect(await page.locator('#wordForm [name=term]').evaluate(i=>i.validity.valueMissing)).toBe(true);
  });
  test('Cancel editing only appears while editing a saved word',async({page})=>{
    const posts=await translationService(page);
    await page.locator('#englishWord').fill('umbrella');
    await page.getByRole('button',{name:'Translate'}).click();
    await expect(page.locator('#wordForm [name=term]')).toHaveValue('un parapluie');
    await expect(page.locator('#wordCancel')).toBeHidden();
    await page.locator('#wordSubmit').click();
    await page.locator('#vocabSearch').fill('parapluie');
    await page.locator('#wordList').getByRole('button',{name:'Edit'}).click();
    await expect(page.locator('#wordCancel')).toBeVisible();
    await expect(page.locator('#wordSubmit')).toHaveText('Save changes');
    await page.locator('#wordCancel').click();
    await expect(page.locator('#wordCancel')).toBeHidden();
  });
  test('signed-out visitors are asked to log in when translation is configured',async({page})=>{
    await page.route(/functions\/v1\/vocabulary-translate/,route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({configured:true})}));
    await page.goto('vocabulary.html');
    await page.locator('#englishWord').fill('umbrella');
    await page.getByRole('button',{name:'Translate'}).click();
    await expect(page.locator('#englishLookupStatus')).toContainText('Log in to translate');
    await expect(page.locator('#wordForm')).toBeHidden();
  });
  test('form audio buttons read the edited French word and sentence',async({page})=>{
    await page.goto('vocabulary.html');
    await page.evaluate(()=>{window.played=[];window.VocaFrenchAudio.play=t=>window.played.push(t);});
    await page.locator('#englishWord').fill('reservation');
    await page.getByRole('button',{name:'Translate'}).click();
    await page.locator('#wordForm [name=term]').fill('une réservation confirmée');
    await page.locator('#formListenWord').click();
    await page.locator('#formListenSentence').click();
    const played=await page.evaluate(()=>window.played);
    expect(played[0]).toBe('une réservation confirmée');
    expect(played[1]).toBe(await page.locator('#wordForm [name=example]').inputValue());
    await page.locator('#wordForm [name=example]').fill('');
    await page.locator('#formListenSentence').click();
    await expect(page.locator('#englishLookupStatus')).toHaveText('Add a French example sentence first.');
  });
  test('an English word saved for later can be translated or removed from the list',async({page})=>{
    await page.goto('vocabulary.html');
    await page.locator('#englishWord').fill('lighthouse');
    await page.getByRole('button',{name:'Translate'}).click();
    await page.getByRole('button',{name:'Save English word for later'}).click();
    await page.reload();
    const later=page.locator('#pendingEnglishWords');
    await expect(later).toContainText('lighthouse');
    await later.getByRole('button',{name:'Translate'}).click();
    await expect(page.locator('#englishWord')).toHaveValue('lighthouse');
    await expect(page.locator('#englishLookupStatus')).toContainText('isn’t set up yet');
    await later.getByRole('button',{name:'Remove'}).click();
    await expect(later).not.toContainText('lighthouse');
  });
  test('a saved personal word can be removed',async({page})=>{
    await translationService(page);
    await page.locator('#englishWord').fill('umbrella');
    await page.getByRole('button',{name:'Translate'}).click();
    await page.locator('#wordSubmit').click();
    await page.locator('#vocabSource').selectOption('personal');
    await expect(page.locator('#wordList .wordcard')).toHaveCount(1);
    page.once('dialog',d=>d.accept());
    await page.locator('#wordList').getByRole('button',{name:'Remove'}).click();
    await expect(page.locator('#wordStatus')).toHaveText('Word removed.');
    await expect(page.locator('#wordList')).toContainText('No words match');
  });
  test('practice runs ten questions from the filtered list and records progress',async({page})=>{
    await page.goto('vocabulary.html');
    await page.locator('#vocabRealm').selectOption('hotel');
    await page.getByRole('button',{name:'Practise these words →'}).click();
    const dialog=page.locator('#vocabPractice');
    await expect(dialog).toBeVisible();
    for(let i=1;i<=10;i++){
      await expect(dialog).toContainText(`Word ${i} of 10`);
      await dialog.locator('.choice').first().click();
      await expect(dialog.getByRole('status')).toContainText(/Correct\.|Not quite\./);
      await expect(dialog.locator('.choice').first()).toBeDisabled();
      await dialog.getByRole('button',{name:'Next word →'}).click();
    }
    await expect(dialog).toContainText('Practice complete');
    await expect(dialog).toContainText(/\d+\/10 correct/);
    const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-v1')).vocabularyProgress);
    expect(Object.keys(progress)).toHaveLength(10);
    await dialog.getByRole('button',{name:'Close ×'}).click();
    await expect(dialog).toBeHidden();
  });
  test('search narrows the word list',async({page})=>{
    await page.goto('vocabulary.html');
    const all=await page.locator('#vocabCount').textContent();
    await page.locator('#vocabSearch').fill('réservation');
    await expect(page.locator('#vocabCount')).not.toHaveText(all);
  });
});

test.describe('levels and placement',()=>{
  test('choosing a level is remembered after reload',async({page})=>{
    await page.goto('levels.html');
    await page.getByRole('button',{name:'Choose B1'}).click();
    await page.reload();
    await expect(page.getByRole('button',{name:/Selected level/})).toHaveCount(1);
    await expect(page.getByRole('button',{name:'Choose A1'})).toBeVisible();
  });
  test('placement check starts, records an answer and can be resumed',async({page})=>{
    await page.goto('placement.html');
    await page.getByRole('button',{name:'Start the check →'}).click();
    await expect(page.getByText(/Question 1/)).toBeVisible();
    await page.locator('input[type=radio]').first().check();
    await page.getByRole('button',{name:/Next|Check|Continue/}).first().click();
    await page.reload();
    await expect(page.getByRole('button',{name:'Resume my check →'})).toBeVisible();
  });
  test('level practice gives feedback on an answer',async({page})=>{
    await page.goto('level-practice.html');
    await page.locator('input[name=practiceAnswer]').first().check();
    await page.getByRole('button',{name:'Check answer'}).click();
    await expect(page.locator('[role=status], .status').first()).not.toBeEmpty();
  });
});

test.describe('accounts (Supabase is mocked)',()=>{
  test('signup rejects mismatched passwords without contacting Supabase',async({page,supabase})=>{
    await page.goto('signup.html');
    await page.locator('#username').fill('test_user');
    await page.locator('#email').fill('test@example.invalid');
    await page.locator('#password').fill('A-long-test-password-1');
    await page.locator('#confirmPassword').fill('A-different-password-2');
    await page.getByRole('button',{name:'Create account'}).click();
    await expect(page.locator('#accountStatus')).toContainText('don’t match');
    expect(supabase.filter(c=>c.url.includes('/signup'))).toEqual([]);
  });
  test('signup enforces username rules and a 12-character password',async({page})=>{
    await page.goto('signup.html');
    await page.locator('#username').fill('no spaces!');
    expect(await page.locator('#username').evaluate(i=>i.validity.patternMismatch)).toBe(true);
    await page.locator('#password').fill('short');
    expect(await page.locator('#password').evaluate(i=>i.validity.tooShort||i.minLength===12)).toBe(true);
  });
  test('login shows a clear message for wrong credentials and re-enables the button',async({page})=>{
    await page.goto('login.html');
    await page.locator('#email').fill('test@example.invalid');
    await page.locator('#password').fill('A-wrong-password-123');
    await page.getByRole('button',{name:'Log in'}).click();
    await expect(page.locator('#accountStatus')).toContainText('email or password is incorrect');
    await expect(page.getByRole('button',{name:'Log in'})).toBeEnabled();
  });
  test('password field can be shown and hidden',async({page})=>{
    await page.goto('login.html');
    await page.locator('#password').fill('secret-value');
    await page.getByRole('button',{name:'Show'}).click();
    await expect(page.locator('#password')).toHaveAttribute('type','text');
  });
  test('reset page without an email link explains what to do',async({page})=>{
    await page.goto('reset-password.html');
    await expect(page.locator('#accountStatus')).toContainText(/reset link|request a new one/i);
  });
  test('login and signup link to each other and to password reset',async({page})=>{
    await page.goto('login.html');
    await page.getByRole('link',{name:/forgot/i}).click();
    await expect(page).toHaveURL(/forgot-password\.html/);
    await page.goto('login.html');
    await page.getByRole('main').getByRole('link',{name:/create|sign up/i}).first().click();
    await expect(page).toHaveURL(/signup\.html/);
  });
});

test('pronunciation page says when assessment is not configured',async({page})=>{
  await page.goto('pronunciation.html');
  await expect(page.locator('#pronAvailability')).not.toBeEmpty();
  await expect(page.locator('#pronCheck')).toBeDisabled();
});

test.describe('levels and placement in depth',()=>{
  test('a full placement run: stage pass, finish early, review answers and use the result',async({page})=>{
    await page.goto('placement.html');
    await page.getByRole('button',{name:'Start the check →'}).click();
    // Answer the A1 stage correctly by reading the bank, then finish at the stage summary.
    const bank=await page.evaluate(()=>window.VocaLevelContent.bank.A1.map(q=>q.options[q.answer]));
    for(let i=0;i<6;i++){
      await expect(page.getByText(`A1 stage · Question ${i+1} of 6`)).toBeVisible();
      await page.locator('.placementchoice').filter({hasText:bank[i]}).first().locator('input').check();
      await page.getByRole('button',{name:'Continue →'}).click();
    }
    await expect(page.getByRole('heading',{name:'A1 foundations checked.'})).toBeVisible();
    await expect(page.getByText('You scored 6/6 in this stage.')).toBeVisible();
    await page.getByRole('button',{name:'Finish here and use A2'}).click();
    await expect(page.getByRole('heading',{name:'A useful place to begin: A2'})).toBeVisible();
    await expect(page.locator('.scoretable')).toContainText('Threshold met');
    await expect(page.locator('.scoretable')).toContainText('Not assessed');
    await page.getByText('Review answers and explanations').click();
    await expect(page.locator('.answerreview')).toHaveCount(6);
    await page.reload();
    await expect(page.getByRole('heading',{name:'A useful place to begin: A2'})).toBeVisible();
    await page.getByRole('button',{name:'Use A2 as my starting level →'}).click();
    await expect(page).toHaveURL(/levels\.html\?level=A2/);
    await expect(page.getByRole('button',{name:'Selected level ✓'})).toBeVisible();
    await expect(page.getByText('Your last written placement suggestion: A2')).toBeVisible();
  });
  test('skipping a whole stage stops the check and recommends that stage',async({page})=>{
    await page.goto('placement.html');
    await page.getByRole('button',{name:'Start the check →'}).click();
    for(let i=0;i<6;i++)await page.getByRole('button',{name:'I don’t know / skip'}).click();
    await expect(page.getByRole('heading',{name:'A useful place to begin: A1'})).toBeVisible();
    await expect(page.locator('.scoretable')).toContainText('0/6');
  });
  test('level practice runs three questions, saves the score and can restart',async({page})=>{
    await page.goto('level-practice.html?level=B1');
    await expect(page.getByText('B1 starter practice · 1/3')).toBeVisible();
    for(let i=0;i<3;i++){
      await expect(page.getByRole('button',{name:'Check answer'})).toBeDisabled();
      await page.locator('input[name=practiceAnswer]').first().check();
      await page.getByRole('button',{name:'Check answer'}).click();
      await expect(page.getByRole('status')).toContainText(/Correct\.|Not quite\./);
      await page.getByRole('button',{name:i<2?'Next question →':'See practice result →'}).click();
    }
    await expect(page.getByRole('heading',{name:'Keep your French moving.'})).toBeVisible();
    await expect(page.getByText(/\d\/3 correct/)).toBeVisible();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-path-v1-guest')).practice.B1);
    expect(saved.total).toBe(3);
    await page.getByRole('button',{name:'Practise again'}).click();
    await expect(page.getByText('B1 starter practice · 1/3')).toBeVisible();
  });
});

test.describe('account pages in depth (Supabase is mocked)',()=>{
  test('forgot password sends a reset link request and shows a neutral confirmation',async({page,supabase})=>{
    await page.goto('forgot-password.html');
    await page.locator('#email').fill('someone@example.invalid');
    await page.getByRole('button',{name:'Send reset link'}).click();
    await expect(page.locator('#accountStatus')).toContainText('If an account is registered');
    expect(supabase.some(c=>c.url.includes('/auth/v1/recover'))).toBe(true);
  });
  test('reset page opened without the email link offers a new link and keeps the form locked',async({page})=>{
    await page.goto('reset-password.html');
    await expect(page.locator('#accountStatus')).toContainText('Open the password reset link');
    await expect(page.getByRole('link',{name:'Request a new reset link'})).toBeVisible();
    await expect(page.locator('#accountForm [type=submit]')).toBeDisabled();
  });
  test('an expired confirmation link explains what to do',async({page})=>{
    await page.goto('auth-callback.html#error_description=Link+expired');
    await expect(page.locator('#callbackStatus')).toContainText('invalid or has expired');
    expect(new URL(page.url()).hash).toBe('');
  });
  test('opening the confirmation page while signed out suggests logging in',async({page})=>{
    await page.goto('auth-callback.html');
    await expect(page.locator('#callbackStatus')).toContainText('you can now log in');
  });
});

test.describe('read-aloud practice',()=>{
  test.use({permissions:['microphone']});
  test('text comes from the link, recording can be stopped and replayed, and assessment stays off',async({page})=>{
    await page.goto('pronunciation.html?text='+encodeURIComponent('Je voudrais un café.'));
    await expect(page.locator('#pronReference')).toHaveValue('Je voudrais un café.');
    await expect(page.locator('#pronAvailability')).toContainText('not connected yet');
    await page.getByRole('button',{name:'🎙 Record my reading'}).click();
    await expect(page.getByRole('button',{name:'■ Stop recording'})).toBeVisible();
    await expect(page.locator('#pronStatus')).toContainText('Recording · 0:');
    await page.waitForTimeout(1200);
    await page.getByRole('button',{name:'■ Stop recording'}).click();
    await expect(page.locator('#pronPlayback')).toBeVisible();
    await expect(page.getByRole('button',{name:'🎙 Record again'})).toBeVisible();
    await expect(page.locator('#pronStatus')).toContainText('Recording ready for replay');
    await page.locator('#pronConsent').check();
    await expect(page.locator('#pronCheck')).toBeDisabled();
    await page.locator('#pronReference').fill('Merci beaucoup.');
    await expect(page.locator('#pronPlayback')).toBeHidden();
    await expect(page.locator('#pronStatus')).toHaveText('Text changed. Record a new reading of this text.');
  });
});

test.describe('realm lessons in depth',()=>{
  const realms=['cafe','school','transport','life','shopping','directions','news','adverts','interview','friends','party','park','picnic','business','service','registration','wedding','birthday','invitation'];
  test('every realm renders its reading and both roles without a browser voice or microphone',async({page})=>{
    test.skip(test.info().project.name!=='desktop','runs once');
    test.setTimeout(120000);
    for(const id of realms){
      await page.goto('realm-learning.html?realm='+id);
      await page.getByRole('button',{name:'Read & understand'}).click();
      await expect(page.locator('.lesson-panel blockquote').first(),id).toBeVisible();
      await page.getByRole('button',{name:'Conversation',exact:true}).click();
      await page.getByRole('button',{name:'Start conversation'}).click();
      await page.getByRole('button',{name:'Use my reply'}).click();
      await expect(page.getByText('Type a reply or finish a recording first.'),id).toBeVisible();
      await page.getByLabel('Your French reply').fill('Bonjour.');
      await page.getByRole('button',{name:'Use my reply'}).click();
      await expect(page.getByLabel('Your French reply'),id).toHaveCount(0);
      await page.getByRole('button',{name:'Continue'}).click();
      await expect(page.getByLabel('Your French reply'),id).toBeVisible();
    }
  });
  test('a typed full scene records completion without earning pronunciation points',async({page})=>{
    await page.goto('realm-learning.html?realm=shopping');
    await page.getByRole('button',{name:'Conversation',exact:true}).click();
    await page.getByRole('button',{name:'Start conversation'}).click();
    for(let i=0;i<20&&!(await page.getByText('Scene complete').isVisible());i++){
      const reply=page.getByLabel('Your French reply');
      if(await reply.isVisible()){await reply.fill('Merci.');await page.getByRole('button',{name:'Use my reply'}).click();}
      else await page.getByRole('button',{name:'Continue'}).click();
    }
    await expect(page.getByText('Scene complete')).toBeVisible();
    const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-v1')));
    expect(data.realmPackProgress['shopping:0:0']).toBe(true);
    expect(data.xp).toBe(0);
  });
  test('French questions hide English by default; toggling keeps answered state',async({page})=>{
    await page.goto('realm-learning.html?realm=shopping');
    await page.getByRole('button',{name:'Read & understand'}).click();
    await expect(page.getByText('Quelle taille le client demande-t-il d’abord ?')).toBeVisible();
    const english=page.locator('.english-support');
    expect(await english.count()).toBeGreaterThanOrEqual(4);
    for(const n of await english.all())await expect(n).toBeHidden();
    await page.getByRole('button',{name:'Show English'}).click();
    for(const n of await english.all())await expect(n).toBeVisible();
    const option=page.locator('.answers button').filter({hasText:'La taille M'});
    await option.click();
    await expect(option).toBeDisabled();
    await page.getByRole('button',{name:'Hide English'}).click();
    await expect(option).toBeDisabled();
    for(const n of await english.all())await expect(n).toBeHidden();
    await page.getByRole('button',{name:'Next'}).click();
    await expect(page.getByText('Où sont les cabines d’essayage ?')).toBeVisible();
    for(const n of await english.all())await expect(n).toBeHidden();
  });
  test('the learner sees what the partner said and can review the submitted reply',async({page})=>{
    await page.goto('realm-learning.html?realm=cafe');
    await page.getByRole('button',{name:'Conversation',exact:true}).click();
    await page.getByLabel('Your role').selectOption('1');
    await page.getByRole('button',{name:'Start conversation'}).click();
    await page.getByRole('button',{name:'Continue'}).click();
    await expect(page.locator('.partner-context')).toBeVisible();
    await expect(page.getByRole('button',{name:'Listen to partner again'})).toBeVisible();
    await page.getByLabel('Your French reply').fill('Je voudrais une café, merci.');
    await page.getByRole('button',{name:'Use my reply'}).click();
    await page.getByRole('button',{name:'Conversation review'}).click();
    await expect(page.getByRole('heading',{name:'Conversation review'})).toBeVisible();
    await expect(page.locator('.review-turn')).toContainText('Je voudrais une café, merci.');
    await expect(page.locator('.review-turn mark')).toHaveText('une café');
    await expect(page.locator('.review-turn')).toContainText('une café → un café');
    await expect(page.getByText('Suggested model reply')).toBeVisible();
    await page.getByLabel('My corrected French reply').fill('Je voudrais un café, merci.');
    await page.getByRole('button',{name:'Save correction'}).click();
    await expect(page.locator('.review-turn')).toContainText('Correction saved on this browser.');
    await page.reload();
    await page.getByRole('button',{name:'Conversation review'}).click();
    await expect(page.getByLabel('My corrected French reply')).toHaveValue('Je voudrais un café, merci.');
    await page.getByRole('button',{name:'Delete this conversation'}).click();
    await expect(page.getByText('No submitted replies yet.')).toBeVisible();
  });
  test('word practice runs a session, records progress and offers a review of misses',async({page})=>{
    await page.goto('realm-learning.html?realm=cafe');
    await page.getByRole('button',{name:'Start practice'}).click();
    for(let i=0;i<30&&!(await page.getByText(/Practice complete/).isVisible());i++){
      await page.locator('.answers button').last().click();
      await page.getByRole('button',{name:'Next'}).click();
    }
    await expect(page.getByText(/Practice complete · \d+\/\d+/)).toBeVisible();
    const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-v1')));
    expect(data.sessions).toBe(1);
    expect(Object.keys(data.vocabularyProgress).length).toBeGreaterThan(0);
    expect(data.packCursor.cafe).toBe(5);
    if(await page.getByRole('button',{name:'Review missed questions'}).isVisible()){
      await page.getByRole('button',{name:'Review missed questions'}).click();
      await expect(page.getByText(/^Review 1 \//)).toBeVisible();
    }
  });
  test('a recorded reply can be replayed and sent without typing',async({page,context})=>{
    await context.grantPermissions(['microphone']);
    await page.goto('realm-learning.html?realm=cafe');
    await page.getByRole('button',{name:'Conversation',exact:true}).click();
    await page.getByRole('button',{name:'Start conversation'}).click();
    await page.getByRole('button',{name:'Record my reply'}).click();
    await expect(page.getByRole('button',{name:'Stop recording'})).toBeVisible();
    await page.waitForTimeout(1200);
    await page.getByRole('button',{name:'Stop recording'}).click();
    await expect(page.locator('.lesson-panel audio')).toBeVisible();
    await expect(page.getByRole('button',{name:'Record again'})).toBeVisible();
    await page.getByRole('button',{name:'Use my reply'}).click();
    await expect(page.getByLabel('Your French reply')).toHaveCount(0);
  });
  test('watching both roles plays the scene by itself',async({page})=>{
    await page.goto('realm-learning.html?realm=cafe');
    await page.evaluate(()=>{window.VocaFrenchAudio.play=(t,o)=>setTimeout(()=>o.onEnd?.(),10);});
    await page.getByRole('button',{name:'Conversation',exact:true}).click();
    await page.getByLabel('Your role').selectOption('-1');
    await page.getByRole('button',{name:'Start conversation'}).click();
    await expect(page.getByText('Scene complete')).toBeVisible({timeout:20000});
  });
});

test.describe('Hotel app in depth',()=>{
  // Instant fake French speech so conversation playback can be tested without a voice installed.
  const fastSpeech=()=>{const s=window.speechSynthesis;s.speak=u=>setTimeout(()=>{u.onstart?.();setTimeout(()=>u.onend?.(),20);},10);s.cancel=()=>{};s.pause=()=>{};s.resume=()=>{};};
  async function answerAll(page,{wrongFirst=false}={}){
    for(let i=0;i<80;i++){
      if(await page.getByText(/SESSION COMPLETE/).isVisible())return;
      const q=await page.evaluate(()=>document.querySelector('.workspace .row .muted')?.textContent||'');
      if(!q)return;
      // The right answer is option 0 in the data; buttons carry id o<index>.
      await page.locator(wrongFirst&&i===0?'#o1':'#o0').click();
      await page.locator('#check').click();
      await page.locator('#check').click();
    }
  }
  test('a standard Hotel session: questions, a missed word comes back, results and saved progress',async({page})=>{
    await page.goto('learn.html?realm=hotel');
    await expect(page.getByRole('heading',{name:'Your mission'})).toBeVisible();
    await expect(page.locator('#session')).toHaveValue('10');
    await page.locator('#session').selectOption('5');
    await page.getByRole('button',{name:'Enter the realm →'}).click();
    await expect(page.locator('.workspace .row .muted')).toHaveText(/^Hotel · Practice · 1\/\d+$/);
    const total=Number((await page.locator('.workspace .row .muted').textContent()).split('/')[1]);
    await expect(page.locator('#check')).toBeDisabled();
    await page.locator('#o1').click();
    await page.locator('#check').click();
    await expect(page.locator('#feedback .feedback.bad')).toContainText('Not quite.');
    await page.locator('#check').click();
    await expect(page.locator('.workspace .row .muted')).toHaveText(new RegExp('^Hotel · Practice · 2/'+(total+2)+'$'));
    await answerAll(page);
    await expect(page.getByText('HOTEL SESSION COMPLETE')).toBeVisible();
    await expect(page.locator('.metric').first()).toContainText('/'+total);
    const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-v1')));
    expect(d.sessions).toBe(1);
    expect(d.done['A1:hotel']).toBe(true);
    expect(d.packCursor.hotel).toBe(5);
    expect(d.missed.length).toBe(1);
    expect(Array.isArray(d.missed[0])).toBe(true);
    expect(d.xp).toBeGreaterThan(0);
    expect(d.attempts.length).toBe(total+2);
    expect(Object.keys(d.vocabularyProgress)).toHaveLength(5);
    expect(Object.values(d.vocabularyProgress).every(p=>['learning','familiar','needs_review','mastered'].includes(p.state))).toBe(true);
    await expect(page.locator('#xp')).toHaveText('✦ '+d.xp+' XP');
    await page.locator('#nav').getByRole('button',{name:/Progress/}).click();
    await expect(page.getByText('Every word is a step forward.')).toBeVisible();
    await expect(page.locator('.metric').nth(1)).toContainText('1');
    await expect(page.getByRole('heading',{name:'Words to revisit'}).locator('..')).toContainText(d.missed[0][0]);
    await page.getByRole('button',{name:'Review introduced Hotel words'}).click();
    await expect(page.locator('.workspace .row .muted')).toHaveText(/^Hotel · Review · 1\//);
  });
  test('Progress and Profile panels, audio settings and resetting progress',async({page})=>{
    await page.goto('learn.html');
    await expect(page.getByRole('heading',{name:'Your French pathway · A1 to C2'})).toBeVisible();
    await expect(page.getByRole('link',{name:'Explore the complete catalogue →'})).toBeVisible();
    await page.locator('#nav').getByRole('button',{name:/Progress/}).click();
    await expect(page.getByRole('heading',{name:'Hotel starter vocabulary'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Hotel starter vocabulary'}).locator('..').locator('.row')).toHaveCount(20);
    page.once('dialog',d=>d.accept());
    await page.getByRole('button',{name:'Café',exact:true}).click();
    await expect(page.getByText('Every word is a step forward.')).toBeVisible();
    await page.locator('#nav').getByRole('button',{name:/Profile/}).click();
    await expect(page.getByRole('heading',{name:'Make learning your own.'})).toBeVisible();
    await expect(page.locator('#speakTarget')).toHaveText('Bonjour ! Je voudrais pratiquer le français.');
    await expect(page.getByRole('heading',{name:'Audio settings'})).toBeVisible();
    await page.locator('#speechRate').selectOption('1');
    await page.evaluate(()=>localStorage.setItem('vocarealm-v1',JSON.stringify({xp:50,sessions:2,done:{},missed:[]})));
    page.once('dialog',d=>d.accept());
    await page.getByRole('button',{name:'Reset learning progress'}).click();
    await expect(page.getByRole('heading',{name:'A little practice. A world of possibility.'})).toBeVisible();
    expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-v1')))).xp).toBe(0);
    await expect(page.locator('#xp')).toHaveText('✦ 0 XP');
  });
  test('an A2 starter lesson runs words, challenge and dialog, then offers a missed-word review',async({page})=>{
    await page.goto('learn.html?realm=hotel&course=A2');
    await expect(page.getByText('Explain a hotel problem and arrange a solution.')).toBeVisible();
    await page.getByRole('button',{name:'Enter the realm →'}).click();
    await expect(page.locator('.workspace .row .muted')).toHaveText('Hotel · Discover · 1/7');
    const answers=['Air conditioning','Another room','An extra night','pourriez','La climatisation ne fonctionne pas.','Est-ce qu’elle est au même étage ?','Oui, je voudrais rester une nuit supplémentaire.'];
    for(let i=0;i<7;i++){
      // Miss the first word on purpose, answer everything else correctly.
      await page.locator('.options .option').filter(i===0?{hasNotText:answers[0]}:{hasText:answers[i]}).first().click();
      await page.locator('#check').click();
      await expect(page.locator('#feedback .feedback')).toHaveClass(i===0?/bad/:/^feedback\s*$/);
      await page.locator('#check').click();
    }
    await expect(page.getByText('REALM COMPLETE')).toBeVisible();
    await expect(page.getByText('1 word(s) could use another look.')).toBeVisible();
    await page.getByRole('button',{name:'Review missed words'}).click();
    await expect(page.locator('.workspace .row .muted')).toHaveText('Hotel · Review · 1/1');
    const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('vocarealm-v1')));
    expect(d.done['A2:hotel']).toBe(true);
  });
  test('non-Hotel realms open their full lesson page; Realms goes to the catalogue',async({page})=>{
    await page.goto('learn.html?realm=cafe');
    await expect(page).toHaveURL(/realm-learning\.html\?realm=cafe/);
    await page.goto('learn.html');
    await page.locator('.card').filter({hasText:'School'}).click();
    await expect(page).toHaveURL(/realm-learning\.html\?realm=school/);
    await page.goto('learn.html');
    await page.locator('#nav').getByRole('button',{name:/Realms/}).click();
    await expect(page).toHaveURL(/realms\.html/);
  });
  async function openPlayer(page){
    await page.goto('learn.html?realm=hotel');
    await page.getByRole('button',{name:'▶ Watch check-in'}).click();
  }
  test('the demo’s “Open Hotel practice” link opens the conversation player',async({page})=>{
    await page.goto('learn.html?practice=hotel');
    await expect(page.getByRole('heading',{name:'A conversation at the hotel.'})).toBeVisible();
    await page.getByRole('button',{name:'← Back to learning'}).click();
    await expect(page.getByRole('heading',{name:'A little practice. A world of possibility.'})).toBeVisible();
  });
  test('the conversation player opens as the guest and waits for a typed reply, which goes to review',async({page})=>{
    await page.addInitScript(fastSpeech);
    await openPlayer(page);
    await expect(page.getByRole('heading',{name:'A conversation at the hotel.'})).toBeVisible();
    await expect(page.locator('#dialogRole')).toHaveValue('guest');
    await expect(page.locator('#dialogStatus')).toContainText('You are the guest.');
    await page.locator('#dialogScene').selectOption('booking');
    await expect(page.locator('#dialogCount')).toHaveText('1 / 12');
    await page.locator('#dialogPlay').click();
    await expect(page.locator('#learnerReplyPanel')).toBeVisible();
    await expect(page.locator('#dialogStatus')).toHaveText('Your turn. Speak or type, then choose Send reply & continue.');
    await expect(page.locator('#dialogPlay')).toHaveText('Your turn · reply below');
    await expect(page.locator('#learnerReplyPanel .partner-context')).toContainText('Bonjour, Hôtel Bellevue.');
    await page.getByRole('button',{name:'Send reply & continue →'}).click();
    await expect(page.locator('#learnerStatus')).toContainText('No reply was captured.');
    await page.getByRole('button',{name:'Need a hint?'}).click();
    await page.getByRole('button',{name:'Put this line in my reply'}).click();
    await expect(page.locator('#learnerReply')).toHaveValue('Bonjour. Je voudrais réserver une chambre, s’il vous plaît.');
    await expect(page.locator('#sceneDialogBubble')).toContainText('Je voudrais réserver une chambre');
    await page.getByRole('button',{name:'Send reply & continue →'}).click();
    await expect(page.locator('#dialogCount')).toHaveText('4 / 12');
    await expect(page.locator('#learnerReplyPanel')).toBeVisible();
    await page.getByRole('button',{name:'Next →'}).click();
    await expect(page.locator('#learnerStatus')).toHaveText('Send your reply first, or use the hint to get started.');
    await page.getByRole('button',{name:'Hide English'}).click();
    await expect(page.locator('.bubble-en')).toHaveCount(0);
    await page.locator('#hotelReviewButton').click();
    const dialog=page.locator('#conversationReviewDialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.review-turn')).toContainText('Je voudrais réserver une chambre');
    await dialog.getByRole('button',{name:'Close review'}).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('button',{name:'← Back to learning'}).click();
    await expect(page.getByRole('heading',{name:'Your mission'})).toBeVisible();
  });
  test('watching both characters plays the booking call through to the end',async({page})=>{
    await page.addInitScript(fastSpeech);
    await openPlayer(page);
    await page.locator('#dialogScene').selectOption('booking');
    await page.locator('#dialogRole').selectOption('watch');
    await expect(page.locator('#dialogStatus')).toHaveText('Ready to watch both characters.');
    await page.locator('#dialogPlay').click();
    await expect(page.locator('#dialogStatus')).toHaveText('Conversation complete. Replay a line, start again, or try the other scene.',{timeout:15000});
    await expect(page.locator('#dialogCount')).toHaveText('12 / 12');
    await expect(page.locator('#dialogPlay')).toHaveText('↻ Play again');
  });
  test('check-in video turns fall back to system audio when the clip cannot play',async({page})=>{
    await page.addInitScript(fastSpeech);
    await openPlayer(page);
    await page.locator('#dialogRole').selectOption('watch');
    await expect(page.locator('#hotelDialogVideo')).toHaveCount(1);
    await expect(page.locator('.video-mode-badge')).toHaveText('Video preview · 3/14 clips available');
    await page.evaluate(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new Error('blocked'));};});
    await page.locator('#dialogPlay').click();
    await expect(page.locator('#dialogStatus')).toContainText('Video playback was blocked');
    await page.getByRole('button',{name:'Use system audio for this line'}).click();
    await expect(page.locator('#hotelDialogVideo')).toHaveCount(0);
  });
  test('“Listen to this line” plays an example without submitting the learner’s reply',async({page})=>{
    await page.addInitScript(fastSpeech);
    await openPlayer(page);
    await page.locator('#dialogScene').selectOption('booking');
    await page.getByText('Full conversation · French & English').click();
    await page.locator('[data-turn="1"]').getByRole('button',{name:'▶ Listen to this line'}).click();
    await expect(page.locator('#dialogStatus')).toContainText('Example finished. Continue in your chosen role.');
    await expect(page.locator('#dialogCount')).toHaveText('1 / 12');
  });
  test('a recorded voice reply is sent without typing',async({page,context})=>{
    await context.grantPermissions(['microphone']);
    await page.addInitScript(fastSpeech);
    await openPlayer(page);
    await page.locator('#dialogScene').selectOption('booking');
    await page.locator('#dialogPlay').click();
    await page.getByRole('button',{name:'🎙 Record my reply'}).click();
    await expect(page.locator('#recordingIndicator')).toBeVisible();
    await page.waitForTimeout(1200);
    await page.getByRole('button',{name:'■ Stop recording'}).click();
    await expect(page.locator('#recordedReplyPlayback audio')).toBeVisible();
    await expect(page.locator('#learnerStatus')).toContainText('Voice reply recorded.');
    await page.getByRole('button',{name:'Send reply & continue →'}).click();
    await expect(page.locator('#dialogCount')).toHaveText('4 / 12');
  });
});
