import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';

test('unlocked Miraebolis offers all four levels and retains selected level on reload',async({page})=>{
 const content:any=await loadContent(),save=createGameSave(content);
 save.chronicles.books.book2.finaleCleared=true;
 await page.addInitScript(raw=>{
  if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);
  sessionStorage.setItem('northern-prisma.entered','1');
  localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));
 },encodeGameSave(save,content));
 await page.goto('/quests?tab=sinister&selected=miraebolis_superboss');
 const selector=page.getByRole('region',{name:'Cấp thử thách'});
 for(const level of [60,70,80,90])await expect(selector.getByRole('button',{name:`Level ${level}`,exact:true})).toBeVisible();
 await selector.getByRole('button',{name:'Level 90',exact:true}).click();
 await expect(selector.getByRole('button',{name:'Level 90',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page).toHaveURL(/superLevel=90/);
 await page.reload();
 await expect(selector.getByRole('button',{name:'Level 90',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(selector).not.toContainText('Không cấp tiền tệ');
 await page.screenshot({path:'test-results/miraebolis-level90.png',fullPage:true});
});
