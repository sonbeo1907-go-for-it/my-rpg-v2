import { test, expect, type Page } from '@playwright/test';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave, changePresetSlot } from '../src/core/game-save.js';
const content: any = await loadContent();
async function begin(page: Page, party = ['arthur', 'iris', 'elaine', 'garrek'], encounter = 'forest_patrol') {
  let save = createGameSave(content); save.unlockedCharacterIds = Object.keys(content.characters); save.party = party;
  save.partyPresets[0].slots = Array.from({ length: 4 }, (_, index) => party[index] ?? null);
  await page.addInitScript(raw => { localStorage.setItem('northern-prisma.campaign.v4', raw); sessionStorage.setItem('northern-prisma.entered', '1'); localStorage.setItem('northern-prisma.combat.speed', 'fast'); }, encodeGameSave(save, content));
  await page.goto(`/quests?selected=${encounter}`); await page.getByRole('button', { name: /Xuất chiến/ }).click();
  await expect(page.locator('.execute')).toBeEnabled();
}
const card = (page: Page, id: string) => page.locator(`.combatant[data-actor-id="${id}"]`);
test('direct targeting preserves one ally and enemy through turns and route navigation', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await begin(page);
  await expect(page.locator('.command-panel select')).toHaveCount(0);
  await expect(page.locator('.ally-grid .is-target')).toHaveCount(1); await expect(page.locator('.enemy-grid .is-target')).toHaveCount(1);
  await card(page, 'enemy_1').locator('.target-hitbox').click(); await card(page, 'garrek').locator('.target-hitbox').click();
  await expect(card(page, 'enemy_1')).toHaveClass(/is-target/); await expect(card(page, 'garrek')).toHaveClass(/is-target/);
  await expect(page.locator('.execute')).toContainText('B');
  await expect(page.locator('.skill-command small')).toHaveCount(0);
  await page.locator('.execute').click(); await expect(page.locator('.execute')).toBeEnabled();
  await expect(card(page, 'enemy_1')).toHaveClass(/is-target/); await expect(card(page, 'garrek')).toHaveClass(/is-target/);
  await page.getByRole('link', { name: /The Prisma Origin/ }).click(); await page.getByRole('link', { name: /Tiếp tục trận/ }).click();
  await expect(card(page, 'enemy_1')).toHaveClass(/is-target/); await expect(card(page, 'garrek')).toHaveClass(/is-target/);
  await page.locator('.skill-command').filter({ hasText: 'Thủy thuẫn' }).click();
  await expect(page.locator('.execute')).toContainText('Garrek');
  await page.locator('.skill-command').filter({ hasText: 'Phòng thủ' }).click(); await expect(card(page, 'elaine')).toHaveClass(/is-target/);
  await page.locator('.skill-command').filter({ hasText: 'Thủy thuẫn' }).click(); await expect(card(page, 'garrek')).toHaveClass(/is-target/);
  expect(errors).toEqual([]);
});
test('AoE lights all allies and selected shield cards retain the blue shield with orange corners', async ({ page }) => {
  await begin(page); await page.locator('.execute').click(); await expect(page.locator('.execute')).toBeEnabled();
  await page.locator('.skill-command').filter({ hasText: 'Thánh vực thủy triều' }).click();
  await expect(page.locator('.ally-grid .is-affected')).toHaveCount(4);
  await expect(page.locator('.ally-grid .is-target')).toHaveCount(1);
  await expect(page.locator('.execute')).toContainText('Toàn đội');
  await page.keyboard.press('Escape'); await page.locator('.execute').click(); await expect(page.locator('.execute')).toBeEnabled();
  const shielded = page.locator('.ally-grid .has-shield').first(); await shielded.locator('.target-hitbox').click();
  await expect(shielded).toHaveClass(/is-target/); await expect(shielded.locator('.target-corners i')).toHaveCount(4);
});
test('skill popovers expose description, cost and live scaling on hover and focus, including unavailable skills', async ({ page }) => {
  await begin(page, ['dain']);
  const skill = page.locator('.skill-command').filter({ hasText: 'Trọng kích' });
  await expect(skill).toHaveAttribute('aria-disabled', 'true'); await skill.hover();
  const tooltip = page.getByRole('tooltip', { name: 'Kỹ năng Trọng kích' });
  await expect(tooltip).toBeVisible(); await expect(tooltip).toContainText('10 MP'); await expect(tooltip).toContainText('Chưa đủ Quyết tâm');
  await expect(tooltip).toContainText('Quyết tâm: 0/3');
  const before = await page.locator('.skill-command.selected').textContent(); await skill.click({ force: true });
  expect(await page.locator('.skill-command.selected').textContent()).toEqual(before);
  await page.keyboard.press('Escape'); await expect(tooltip).toHaveCount(0);
  await page.locator('.combat-speed button').first().focus(); await skill.focus(); await expect(tooltip).toBeVisible();
  await page.screenshot({ path: 'test-results/combat-popover.png', fullPage: true });
});
test('dead selected enemies fall back to living enemies and turn order highlights the right card', async ({ page }) => {
  await begin(page, ['seraphine'], 'goblin_forest_ambush');
  await card(page, 'enemy_1').locator('.target-hitbox').click();
  await page.locator('.skill-command').filter({ hasText: 'Kiếm quyết Valmont' }).click(); await page.keyboard.press('Escape');
  await page.locator('.execute').click(); await expect(page.locator('.execute')).toBeEnabled();
  await expect(card(page, 'enemy_1')).toHaveClass(/fallen/); await expect(card(page, 'enemy_1')).not.toHaveClass(/is-target/);
  await expect(card(page, 'enemy_0')).toHaveClass(/is-target/);
  await page.getByRole('button', { name: 'Xem vị trí Seraphine Valmont' }).hover(); await expect(card(page, 'seraphine')).toHaveClass(/turn-hovered/);
  await expect(page.locator('.battle-log')).toContainText('Quỷ lùn nhỏ B');
});
test('status tooltip shows its source and actual duration; speed selection is remembered', async ({ page }) => {
  await begin(page, ['elaine', 'garrek']);
  await page.locator('.skill-command').filter({ hasText: 'Phòng thủ' }).click(); await page.keyboard.press('Escape');
  await page.locator('.execute').click(); await expect(page.locator('.execute')).toBeEnabled();
  await page.getByRole('button', { name: 'Xem hiệu ứng Phòng thủ', exact: true }).hover();
  const tooltip = page.getByRole('tooltip', { name: 'Hiệu ứng Phòng thủ' });
  await expect(tooltip).toContainText('Nguồn: Elaine'); await expect(tooltip).toContainText('1 lượt của người mang'); await expect(tooltip).toContainText('40%');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Bình thường', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('northern-prisma.combat.speed'))).toEqual('normal');
  await page.screenshot({ path: 'test-results/combat-targets.png', fullPage: true });
});
test('phone long press opens skill information without selecting or executing it', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  await begin(page, ['seraphine']);
  const skill = page.locator('.skill-command').filter({ hasText: 'Kiếm quyết Valmont' });
  await skill.scrollIntoViewIfNeeded();
  const selectedBefore = await page.locator('.skill-command.selected').textContent();
  await skill.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 300 });
  await expect(page.getByRole('tooltip', { name: 'Kỹ năng Kiếm quyết Valmont' })).toBeVisible();
  await skill.dispatchEvent('pointerup', { pointerType: 'touch' }); await skill.dispatchEvent('click');
  expect(await page.locator('.skill-command.selected').textContent()).toEqual(selectedBefore);
  expect(await page.locator('.battle-log li').count()).toEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: 'test-results/combat-phone.png', fullPage: true }); await context.close();
});

test('Aurora linked attacks display the shared FuA label and source in both feedback and logs', async ({ page }) => {
  await begin(page, ['freya', 'aurora']);
  await page.locator('.skill-command').filter({ hasText: 'Truyền dẫn ma lực' }).click(); await page.keyboard.press('Escape');
  await page.locator('.execute').click(); await expect(page.locator('.execute')).toBeEnabled();
  await page.getByRole('button', { name: 'Bình thường', exact: true }).click();
  await page.locator('.skill-command').filter({ hasText: 'Hỏa cầu' }).click(); await page.keyboard.press('Escape');
  await page.locator('.execute').click();
  await expect(page.locator('.reaction-ribbon.follow_up')).toContainText('Liên kích (FuA)');
  await expect(page.locator('.reaction-ribbon.follow_up')).toContainText('Aurora');
  await expect(page.locator('.battle-log')).toContainText('Aurora Liên kích (FuA)');
});
