import {defineConfig} from '@playwright/test';
import {randomBytes} from 'node:crypto';
import {mkdtempSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.CIVIS_E2E_ADMIN_PASSWORD ??= randomBytes(32).toString('hex');
process.env.CIVIS_E2E_DB ??= join(mkdtempSync(join(tmpdir(),'civis-e2e-')),'civis.db');
const baseURL='http://127.0.0.1:3100';
export default defineConfig({
  testDir:'./tests',testMatch:'e2e.spec.ts',fullyParallel:false,workers:1,timeout:60000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL,browserName:'chromium',headless:true,launchOptions:{executablePath:existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,args:['--no-sandbox']},trace:'retain-on-failure'},
  webServer:{command:'npm run start -- --port 3100',url:baseURL,reuseExistingServer:false,timeout:120000,env:{CIVIS_DB_PATH:process.env.CIVIS_E2E_DB,CIVIS_ADMIN_PASSWORD:process.env.CIVIS_E2E_ADMIN_PASSWORD,CIVIS_ADMIN_NAME:'editor-teste-e2e'}},
});
