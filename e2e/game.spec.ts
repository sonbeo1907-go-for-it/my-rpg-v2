import { test, expect } from '@playwright/test';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave } from '../src/core/game-save.js';
const content: any = await loadContent();
const save = createGameSave(content);
save.coins = 2000; save.prisma = 20; save.gacha.totalPulls = 4;
save.gear = [{ id: 'gear_1', typeId: 't1', stats: { attack: 1 } }, { id: 'gear_2', typeId: 't3_focused', stats: { attack: 5 } }, { id: 'gear_3', typeId: 't2', stats: { attack: 3 } }, { id: 'gear_4', typeId: 't3_dual', stats: { magic: 2, defense: 2 } }];
save.unlockedCharacterIds.push('seraphine', 'lyon', 'lucien', 'cedric');
const raw = encodeGameSave(save, content);

test('automatic v3 migration, routes, character details and five teams work', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const legacy:any=JSON.parse(raw);legacy.version=3;delete legacy.partyPresets;delete legacy.activePartyPresetId;
  await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v3',raw);},JSON.stringify(legacy));
  await page.goto('/');
  await expect(page.locator('.profile-card')).toHaveCount(1);
  await page.getByRole('button',{name:/^Tiếp tục/}).click();await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('link', { name: /Chiêu Mộ/ })).toBeVisible();
  await page.getByRole('link', { name: /Đội Hình/ }).click();
  await expect(page.locator('.party-member')).toHaveCount(4);
  await page.locator('.preset-bar button').nth(1).click();
  await page.getByLabel('Tên đội', { exact: true }).fill('Đội thám hiểm'); await page.getByRole('button', { name: 'Lưu tên' }).click();
  await page.locator('.party-member-select').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('.character-card')).toHaveCount(10);
  await page.getByRole('dialog').getByRole('button', { name: /Seraphine Valmont/ }).click();
  await page.getByRole('button', { name: /Xếp vào vị trí/ }).click();
  await expect(page.locator('.party-member').first()).toContainText('Seraphine');
  await page.locator('.detail-button').first().click();
  await expect(page).toHaveURL(/characters\/seraphine/);
  await expect(page.locator('.skill-grid')).toContainText('60% ATK');
  await expect(page.locator('.skill-grid')).toContainText('60% MAG');
  await page.getByRole('link', { name: 'Trang bị', exact: true }).click();
  await expect(page).toHaveURL(/seraphine\/equipment/);
  await expect(page.locator('.equipment-slots button')).toHaveCount(6);
  expect(errors).toEqual([]);
});
test('equipment filters sort both directions, equips and persists; inventory is separate', async ({ page }) => {
  await page.addInitScript(raw => { if (!localStorage.getItem('northern-prisma.campaign.v4')) localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); }, raw);
  await page.goto('/characters/arthur/equipment');
  await page.getByRole('combobox', { name: 'Chỉ số', exact: true }).selectOption('attack');
  await page.getByRole('combobox', { name: 'Sắp xếp', exact: true }).selectOption('attack');
  await page.getByRole('combobox', { name: 'Thứ tự', exact: true }).selectOption('asc');
  await expect(page.locator('.gear-grid .gear-card').first()).toContainText('ATK +1');
  await page.getByRole('combobox', { name: 'Thứ tự', exact: true }).selectOption('desc');
  await expect(page.locator('.gear-grid .gear-card').first()).toContainText('ATK +5');
  await page.locator('.gear-grid .gear-card').first().click();
  await page.getByRole('button', { name: 'Trang bị vào ô này', exact: true }).click();
  await expect(page.locator('.equipment-slots button').first()).toContainText('ATK +5');
  await expect(page.locator('.gear-grid .gear-card').filter({ hasText: '#2' }).locator('.equipped-badge')).toHaveText('E');
  await page.reload(); await expect(page.locator('.equipment-slots button').first()).toContainText('ATK +5');
  await page.getByRole('link', { name: 'Trở về', exact: true }).click();
  await expect(page).toHaveURL(/characters\/arthur/);
  await expect(page.locator('.stat-grid [data-stat=attack] .stat-total')).toHaveText('39');
  await expect(page.locator('.stat-grid [data-stat=attack] .stat-gear-bonus')).toHaveText('Trang bị: +5');
  await expect(page.locator('.stat-grid [data-stat=magic] .stat-gear-bonus')).toHaveText('Trang bị: +0');
  await page.goto('/inventory'); await expect(page.locator('.gear-card')).toHaveCount(4);
  await expect(page.locator('.gear-card .equipped-badge')).toHaveCount(1);
  await expect(page.locator('.equipment-slots')).toHaveCount(0);
});
test('gacha commits once to selected profile, quests scroll and battle survives navigation', async ({ page }) => {
  await page.addInitScript(raw => { localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); }, raw);
  await page.goto('/recruitment');
  await page.getByRole('button', { name: /Chiêu mộ 10 lần/ }).click();
  await expect(page.locator('.stone-awakening')).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ qua → Kết quả' }).click();
  await expect(page).toHaveURL(/recruitment\/results/); await expect(page.locator('.summon-result')).toHaveCount(10);
  const coins = await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text).coins);
  expect(coins).toEqual(2000);
  await page.goto('/quests'); await expect(page.locator('.quest-card')).toHaveCount(Object.values(content.encounters).filter((item: any) => !item.travelerStory && item.rewardTier !== 'super').length);
  expect(await page.locator('.quest-list').evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  await page.getByRole('button', { name: /Xuất chiến/ }).click(); await expect(page).toHaveURL(/\/battle$/);
  await expect(page.locator('.combatant[data-actor-id="arthur"]')).toBeVisible();
  await expect(page.locator('.execute')).toBeEnabled();
  await page.locator('.execute').click();
  await expect(page.locator('.execute')).toBeEnabled();
  const before = await page.locator('.battle-log ol').textContent();
  await page.getByRole('link', { name: /The Prisma Origin/ }).click();
  await page.getByRole('link', { name: /Tiếp tục trận/ }).click();
  await expect(page.locator('.battle-log ol')).toHaveText(before!);
});
test('phone layouts fit viewport and route guards return unopened sessions to start', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/party'); await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button',{name:'Tạo hành trình mới'}).click();
  await page.getByLabel('Tên người chơi',{exact:true}).fill('Arthur');
  await page.getByRole('button',{name:'Lưu',exact:true}).click();
  for (const route of ['/home', '/party', '/characters', '/inventory', '/recruitment', '/quests']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
  }
});

test('battle victory saves coins and first-clear rewards once, then rematch starts fresh', async ({ page }) => {
  await page.addInitScript(raw => { localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); }, raw);
  await page.goto('/quests?selected=goblin_forest_ambush');
  await page.getByRole('button', { name: /Xuất chiến/ }).click();
  for (let action = 0; action < 30; action++) {
    await expect.poll(async () => await page.locator('.battle-outcome').count() > 0 || await page.locator('.execute').isEnabled()).toBe(true);
    if (await page.locator('.battle-outcome').count()) break;
    await page.locator('.execute').click();
  }
  await expect(page.locator('.battle-outcome')).toContainText('+50 coin đã lưu');
  const saved = await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));
  expect(saved.coins).toEqual(2050); expect(saved.victories).toEqual(1);
  expect(saved.unlockedCharacterIds).toContain('kai'); expect(saved.extraGearSlots.arthur).toEqual(1); expect(saved.extraGearSlots.garrek).toEqual(1);
  expect(saved.claimedFirstClearRewards).toEqual(['goblin_forest_ambush']);
  await page.getByRole('button', { name: /Đánh lại/ }).click();
  await expect(page.locator('.battle-outcome')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text).coins)).toEqual(2050);
});

test('failed local save does not spend gacha currency or publish rewards', async ({ page }) => {
  await page.addInitScript(raw => { localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); }, raw);
  await page.goto('/recruitment');
  await expect(page.locator('.recruitment-status [data-currency=coin]')).toContainText('2.000');
  await page.evaluate(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'northern-prisma.profiles.v1') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, key, value); }; });
  await page.getByRole('button', { name: /Chiêu mộ 1 lần/ }).click();
  await expect(page.locator('.notice')).toContainText('Quota exceeded');
  await expect(page.locator('.recruitment-status [data-currency=coin]')).toContainText('2.000');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('SVG and all BGM assets are served, including MP3 byte ranges', async ({ request }) => {
  for (const file of ['tavern.svg', 'summon.svg', 'summon-centered.svg', 'quest.svg', ...['physical_dps', 'magical_dps', 'offensive_support', 'defensive_support', 'tank', 'fighter'].map(role => `silhouette-${role}.svg`)]) {
    const response = await request.get(`/art/${file}`); expect(response.ok()).toBe(true); expect(await response.text()).toContain('<svg');
  }
  for (const file of ['bt1.mp3', 'bt2.mp3', 'boss_1.mp3', 'boss_wyvern.mp3', 'spboss_alice.mp3', 'spboss_miraebolis.mp3', 'victory.mp3']) {
    const response = await request.get(`/bgm/${file}`, { headers: { Range: 'bytes=0-127' } });
    expect(response.status()).toBe(206); expect((await response.body()).length).toBe(128);
  }
});

test('capture desktop and phone screens for visual review', async ({ page }) => {
  await page.addInitScript(raw => { localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); }, raw);
  for (const [route, name] of [['/home', 'home'], ['/party', 'party'], ['/characters', 'characters'], ['/recruitment', 'recruitment'], ['/quests', 'quests']]) {
    await page.goto(route); await expect(page.locator('main')).toBeVisible();
    await page.screenshot({ path: `test-results/visual-${name}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/home'); await expect(page.locator('.home-nav-left')).toBeVisible();
  await page.screenshot({ path: 'test-results/visual-phone-home.png', fullPage: true });
});

test('new easy quests appear under normal missions with 50 Coin and spawn their authored monsters', async ({ page }) => {
  await page.addInitScript(raw => { localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); }, raw);
  await page.goto('/quests?type=normal&selected=boar_field');
  await expect(page.locator('.quest-card')).toHaveCount(Object.values(content.encounters).filter((encounter: any) => !encounter.travelerStory && encounter.rewardTier === 'normal').length);
  await expect(page.locator('.quest-card.selected')).toContainText('Lợn rừng phá ruộng');
  await expect(page.locator('.quest-card.selected')).toContainText('50 Coin');
  await expect(page.locator('.quest-enemies')).toContainText('Lợn rừng');
  await expect(page.locator('.quest-enemies')).toContainText('Chuột rừng');
  await page.getByRole('button', { name: /Xuất chiến/ }).click();
  await expect(page).toHaveURL(/battle$/);
  await expect(page.locator('.enemy-grid .combatant')).toHaveCount(3);
  await expect(page.locator('.enemy-grid')).toContainText('Lợn rừng');
});

test('Equipped badges mark only worn gear and occupied slots show both dual-stat bonuses', async ({ page }) => {
  const equipped = structuredClone(save); equipped.equipment = { arthur: ['gear_4', null, null] };
  await page.addInitScript(raw => { if (!localStorage.getItem('northern-prisma.campaign.v4')) localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); }, encodeGameSave(equipped, content));
  await page.goto('/characters/arthur/equipment');
  await expect(page.locator('.gear-card .equipped-badge')).toHaveCount(1);
  const slot = page.locator('.equipment-slots button').first();
  await expect(slot.locator('.equipment-slot-stats')).toContainText('MAG +2');
  await expect(slot.locator('.equipment-slot-stats')).toContainText('DEF +2');
  await expect(slot).not.toContainText('#4');
  await expect(slot.locator('.equipped-badge')).toHaveText('E');
  await page.screenshot({ path: 'test-results/visual-equipped-badge.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: 'test-results/visual-equipped-phone.png', fullPage: true });
  await page.getByRole('button', { name: 'Tháo món đang dùng', exact: true }).click();
  await expect(page.locator('.equipped-badge')).toHaveCount(0);
  await expect(slot).toContainText('Trống');
});
