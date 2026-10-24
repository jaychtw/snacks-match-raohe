import {existsSync} from 'node:fs';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',fullyParallel:true,workers:3,timeout:45000,reporter:[['list'],['html',{open:'never'}],['json',{outputFile:'docs/evidence/browser-results.json'}]],use:{launchOptions:{executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)},baseURL:'http://127.0.0.1:4173/',trace:'retain-on-failure'},webServer:{command:'npm run preview -- --port 4173 --strictPort',url:'http://127.0.0.1:4173/',reuseExistingServer:true}});
