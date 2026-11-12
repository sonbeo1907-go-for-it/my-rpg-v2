import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
const c:any=await loadContent();
test('royal exclusive descriptions appear in equipped character skill previews on desktop and mobile',async({page})=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push('geoffrey','nikita');
 for(const id of ['geoffrey.royal_bulwark','nikita.silent_oath']){s.unlockedExclusiveRecipes.push(id);s.exclusiveGear.push({templateId:id,statKey:'maxMp',statValue:exclusiveRollRange(c,'maxMp').min});s.equippedExclusiveGear[c.exclusiveGear[id].characterId]=id;}
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 for(const id of ['geoffrey','nikita']){
 await page.goto('/characters/'+id+'?tab=skills');const panel=page.locator('.character-tab-panel');await expect(panel).toContainText(id==='geoffrey'?'6 DEF':'xóa 1 buff');
 for(const width of [1440,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/royal-${id}-${width}.png`,fullPage:true});}
 }
});
