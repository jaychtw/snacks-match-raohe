import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loadGame } from '@jaychtw/match3-core';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const base = new URL(process.env.RAOHE_VERIFY_URL || 'http://127.0.0.1:4180/snacks-match-raohe/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const published = !['localhost', '127.0.0.1'].includes(base.hostname);
const prefix = published ? 'live' : 'release-local';
const key = 'snacks-raohe-session-v1';
const progressKey = 'snacks-raohe-progress-v1';
const preferencesKey = 'snacks-raohe-preferences';
const witnesses = JSON.parse(readFileSync('docs/evidence/level-validation.json', 'utf8'));
const hash = data => createHash('sha256').update(data).digest('hex');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
});
const result = {
  target: base.href, scope: published ? 'published site' : 'local static-host simulation',
  commit: process.env.GITHUB_SHA || null, checkedAt: new Date().toISOString(), files: [], viewports: [],
};

async function read(page) {
  return JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
}
async function activate(page, selector, touch) {
  const control = page.locator(selector);
  if (touch) await control.tap(); else await control.click();
}
async function turn(page, action, touch) {
  const game = loadGame((await read(page)).state);
  assert.equal(game.applyMove(action).ok, true, 'Engine must authorize the tested move');
  for (const at of [action.from, action.to]) await activate(page, `[data-cell="${at.row * 8 + at.col}"]`, touch);
  await page.waitForFunction(({ key, state }) =>
    JSON.parse(localStorage.getItem(key) || '{}').state === state &&
    document.querySelector('.board')?.dataset.reconciled === 'true', { key, state: game.serialize() });
  assert.deepEqual(await page.locator('.cell').evaluateAll(cells => cells.map(el => ({
    id: Number(el.dataset.id), type: el.dataset.type || null, special: el.dataset.special || null,
  }))), game.state.board.flat(), 'Rendered pieces must match exact engine state');
}
async function assertHealthy(page) {
  assert.equal(await page.locator('.cell').count(), 64);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No page overflow');
  assert.equal(await page.locator('.gate-art').evaluate(img => img.complete && img.naturalWidth > 0), true, 'Gate asset decoded');
  assert.ok(await page.locator('.snack').first().evaluate(el => getComputedStyle(el).backgroundImage.includes('snacks')), 'Food sprite CSS loaded');
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], 'Accessibility audit');
  const visible = await page.locator('#moves').evaluate(el => {
    const r = el.getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('#moves') !== null;
  });
  assert.equal(visible, true, 'HUD must not be obscured');
}

try {
  const assets = await browser.newContext();
  for (const name of readdirSync('dist', { recursive: true }).filter(name => statSync(`dist/${name}`).isFile())) {
    const response = await assets.request.get(new URL(name, base).href);
    assert.equal(response.status(), 200, name);
    const data = readFileSync(`dist/${name}`);
    assert.equal(hash(await response.body()), hash(data), `Published asset must match checkout build: ${name}`);
    result.files.push({ name, sha256: hash(data), bytes: data.length });
  }
  await assets.close();

  for (const width of [320, 390, 768, 1440]) for (const lang of ['en', 'zh-TW']) {
    const touch = width < 640, height = touch ? 900 : 1100;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [], failedRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() }); });
    await page.goto(base.href);
    if (lang === 'zh-TW') await activate(page, '#language', touch);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    await assertHealthy(page);
    for (let i = 0; i < 3; i++) await turn(page, loadGame((await read(page)).state).listLegalMoves()[0], touch);
    const checkpoint = await read(page);
    await page.reload();
    assert.deepEqual(await read(page), checkpoint, 'Exact session survives reload');
    assert.equal(await page.locator('html').getAttribute('lang'), lang, 'Language survives reload');

    await activate(page, '#free', touch);
    assert.equal((await read(page)).level, 'free-play');
    await turn(page, loadGame((await read(page)).state).listLegalMoves()[0], touch);
    const free = await read(page);
    await activate(page, '#journey', touch);
    assert.deepEqual(await read(page), checkpoint, 'Journey session preserved across modes');
    await activate(page, '#free', touch);
    assert.deepEqual(await read(page), free, 'Free Play session preserved across modes');
    await activate(page, '#journey', touch);
    await activate(page, '#language', touch);
    assert.equal(await page.locator('html').getAttribute('lang'), lang === 'en' ? 'zh-TW' : 'en');
    assert.deepEqual(await read(page), checkpoint, 'Live language switch preserves state');
    await activate(page, '#language', touch);
    await page.reload();
    assert.deepEqual(await read(page), checkpoint);
    assert.equal(JSON.parse(await page.evaluate(k => localStorage.getItem(k), preferencesKey)).lang, lang);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `docs/evidence/${prefix}-verified-${width}-${lang}.png`, fullPage: true });
    assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
    result.viewports.push({ width, height, language: lang, journeyTurns: 3, freeTurns: 1, exactState: true, reload: true,
      separateModePersistence: true, liveLanguageSwitch: true, preferencesPersisted: true, assetLoading: true,
      axeViolations: 0, pageErrors: errors, failedRequests });
    await context.close();
  }

  // A complete public playthrough demonstrates the terminal and progression flows.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage(); await page.goto(base.href); await activate(page, '#language', true);
  for (const action of witnesses.levels[0].loss.actions) await turn(page, action, true);
  assert.equal(await page.locator('.board').getAttribute('data-status'), 'lost');
  await page.getByRole('button', { name: '再玩一次', exact: true }).tap();
  for (const action of witnesses.levels[0].win.actions) await turn(page, action, true);
  assert.equal(await page.locator('.board').getAttribute('data-status'), 'won');
  const progress = JSON.parse(await page.evaluate(k => localStorage.getItem(k), progressKey));
  assert.ok(progress.completed.includes(witnesses.levels[0].level.id));
  await page.screenshot({ path: `docs/evidence/${prefix}-verified-victory-zh-TW.png`, fullPage: true });
  await page.getByRole('button', { name: '下一關', exact: true }).tap();
  const second = await read(page); assert.equal(second.level, witnesses.levels[1].level.id);
  await page.reload(); assert.deepEqual(await read(page), second);
  assert.deepEqual(JSON.parse(await page.evaluate(k => localStorage.getItem(k), progressKey)), progress);
  result.completePlaythrough = { language: 'zh-TW', viewport: '390x844 touch', defeatMoves: witnesses.levels[0].loss.actions.length,
    retry: true, victoryMoves: witnesses.levels[0].win.actions.length, nextLevel: true, progressPersists: true };
  await context.close();
  result.status = 'passed';
  writeFileSync(`docs/evidence/${prefix}-verification.json`, JSON.stringify(result, null, 2) + '\n');
  const summary = `## Raohe ${result.scope} verification: passed\n\nURL: ${base.href}\n\nCommit: ${result.commit || 'local working tree'}\n\n${result.files.length} asset hashes matched. Eight viewport/language cases passed at 320, 390, 768 and 1440px in English and Traditional Chinese. All cases exercised real gameplay, exact saves/reload, separate Journey/Free Play sessions, live language switching, decoded artwork, unobscured HUD and axe accessibility audits. A touch-phone zh-TW playthrough verified defeat, retry, victory, next level and persistent progression. No page errors or failed requests.\n\nManual physical-device, screen-reader, sustained mobile performance, independent language and player/balance checks remain unverified.\n`;
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
} finally { await browser.close(); }
