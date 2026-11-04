import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page){
  const c=createGameSave(content);
  c.unlockedCharacterIds=Object.keys(content.characters);
  c.party=['amaryllis','brant','arthur','iris'];
  c.partyPresets[0].slots=[...c.party];
  await page.addInitScript(raw=>{
    if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);
    sessionStorage.setItem('northern-prisma.entered','1');
    localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));
    localStorage.setItem('northern-prisma.combat.speed','fast');
  },encodeGameSave(c,content));
  await page.emulateMedia({reducedMotion:'reduce'});
}

test('Amaryllis và Brant hiển thị nội tại, kỹ năng và không tràn ngang trên điện thoại',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await seed(page);
  await page.goto('/characters/amaryllis');
  await expect(page.locator('.character-overview')).toContainText('Amaryllis');
  await expect(page.locator('.passive-copy')).toContainText('Đèn Dầu Không Tắt');
  await page.locator('.character-tabs [data-tab-id=skills]').click();
  await expect(page.locator('.skill-card').filter({hasText:'Lời Cầu Dịu Êm'}).first()).toBeVisible();
  await expect(page.locator('.skill-card').filter({hasText:'Vòng Tay Che Chở'}).first()).toBeVisible();
  const revive=page.locator('.skill-card').filter({hasText:'Kinh Cầu Hồi Sinh'}).first();
  await expect(revive).toBeVisible();
  await expect(revive).toContainText('Hồi sinh toàn đội');
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);

  await page.goto('/characters/brant');
  await expect(page.locator('.character-overview')).toContainText('Brant');
  await expect(page.locator('.passive-copy')).toContainText('Thân Chắn Bão Tố');
  await page.locator('.character-tabs [data-tab-id=skills]').click();
  await expect(page.locator('.skill-card').filter({hasText:'Khiên Sắt Tiền Tuyến'}).first()).toBeVisible();
  const challenge=page.locator('.skill-card').filter({hasText:'Lời Hứa Chắn Trước'}).first();
  await expect(challenge).toBeVisible();
  await expect(challenge).toContainText('Khiêu khích');
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});
