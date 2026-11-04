import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page){
  const c=createGameSave(content);
  c.unlockedCharacterIds=Object.keys(content.characters);
  c.party=['flammelapis','arthur','iris','takeshi'];
  c.partyPresets[0].slots=[...c.party];
  await page.addInitScript(raw=>{
    if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);
    sessionStorage.setItem('northern-prisma.entered','1');
    localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));
    localStorage.setItem('northern-prisma.combat.speed','fast');
  },encodeGameSave(c,content));
  await page.emulateMedia({reducedMotion:'reduce'});
}

test('Flammelapis hiển thị nội tại, ba kỹ năng và vừa màn hình điện thoại',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await seed(page);
  await page.goto('/characters/flammelapis');
  await expect(page.locator('.character-overview')).toContainText('Flammelapis');
  await expect(page.locator('.passive-copy')).toContainText('Cổ Kiếm Thức Tỉnh');
  await expect(page.locator('.passive-copy')).toContainText('Phá Thành');
  await page.locator('.character-tabs [data-tab-id=skills]').click();
  await expect(page.locator('.skill-card').filter({hasText:'Trảm Thủy'}).first()).toBeVisible();
  await expect(page.locator('.skill-card').filter({hasText:'Kiếm Ấn Phá Thành'}).first()).toBeVisible();
  await expect(page.locator('.skill-card').filter({hasText:'Triều Kiếm Bạo Phá'}).first()).toBeVisible();
  const body=page.locator('main');
  await expect(body).toContainText('Trảm Thủy');
  await expect(body).toContainText('Kiếm Ấn Phá Thành');
  await expect(body).toContainText('Triều Kiếm Bạo Phá');
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});
