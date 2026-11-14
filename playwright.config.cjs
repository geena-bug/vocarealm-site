// Browser tests: `npm run test:e2e` checks the local copy; set BASE_URL to check a deployed site,
// e.g. BASE_URL=https://vocarealm.vercel.app npm run test:e2e
const {defineConfig,devices}=require('@playwright/test');
const port=4173,baseURL=process.env.BASE_URL||`http://127.0.0.1:${port}`;
module.exports=defineConfig({
  testDir:'e2e',
  fullyParallel:true,
  retries:process.env.BASE_URL?1:0,
  reporter:[['list'],['html',{open:'never',outputFolder:'e2e-report'}]],
  outputDir:'e2e-results',
  // A fake microphone lets the read-aloud test record without a real device.
  use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']}},
  projects:[
    {name:'desktop',use:{...devices['Desktop Chrome']}},
    {name:'mobile',use:{...devices['Pixel 7']}}
  ],
  webServer:process.env.BASE_URL?undefined:{command:'npx vite build --logLevel warn && node scripts/serve.mjs',env:{PORT:String(port)},url:baseURL,reuseExistingServer:false}
});
