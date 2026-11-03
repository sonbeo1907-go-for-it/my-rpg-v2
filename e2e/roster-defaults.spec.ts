import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page){
  const c=createGameSave(content);
  Object.assign(c.characters.arthur,{level:50,limitBreakRank:3});
  Object.assign(c.characters.iris,{level:12,limitBreakRank:0});
  await page.addInitScript(raw=>{
    if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);
    sessionStorage.setItem('northern-prisma.entered','1');
    localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));
    localStorage.setItem('northern-prisma.combat.speed','fast');
  },encodeGameSave(c,content));
  await page.emulateMedia({reducedMotion:'reduce'});
  return c;
}

test('danh sách nhân vật mặc định chỉ hiện người đã sở hữu và sắp Level giảm dần',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  const save=await seed(page);
  const owned=save.unlockedCharacterIds.length;
  await page.goto('/characters');
  await expect(page.getByRole('combobox',{name:'Sở hữu',exact:true})).toHaveValue('owned');
  await expect(page.getByRole('combobox',{name:'Sắp xếp',exact:true})).toHaveValue('level');
  await expect(page.getByRole('combobox',{name:'Thứ tự',exact:true})).toHaveValue('desc');
  await expect(page.locator('.character-grid .character-card')).toHaveCount(owned);
  await expect(page.locator('.character-grid .character-level').first()).toContainText('Level 50');
  await expect(page.locator('.character-grid .character-card.locked')).toHaveCount(0);
  await page.getByRole('combobox',{name:'Sở hữu',exact:true}).selectOption('all');
  await expect(page).toHaveURL(/ownership=all/);
  await expect(page.locator('.character-grid .character-card').first()).toBeVisible();
  await expect(page.locator('.character-grid .character-card.locked').first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox',{name:'Sở hữu',exact:true})).toHaveValue('all');
  await expect(page.locator('.character-grid .character-card.locked').first()).toBeVisible();
  expect(errors).toEqual([]);
});
