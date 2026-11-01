import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {claimBattleReward} from '../src/core/economy.js';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page,solo=false){
 let c=createGameSave(content);c.storyFlags.push('illusion.sinister_unlocked');
 for(const story of ['iris','fiona','takeshi'])for(const id of content.travelerStories[story].chapters){const e=content.encounters[id];c=claimBattleReward(c,{encounterId:id,outcome:'victory',rewardRandom:()=>0,actors:(e.requiredPartyIds??[]).map((id:string)=>({id,team:'party'})),...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content);}
 if(solo){c.party=['arthur',null,null,null];c.partyPresets[0].slots=[...c.party];}
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(c,content));
 await page.emulateMedia({reducedMotion:'reduce'});
}

for(const encounter of Object.values(content.encounters).filter((e:any)=>e.category==='bounty') as any[])test(encounter.id+' applies Boss HP across all five difficulties and battle entry',async({page})=>{
 await seed(page);await page.goto('/quests?tab=bounty&selected='+encounter.id);
 const enemyDefinition=content.enemies[encounter.enemies[0]];
 for(const [difficulty,level]of [['very_easy',5],['easy',15],['medium',25],['hard',35],['very_hard',45]] as const){
  await page.locator('.quest-difficulty-buttons button').nth(['very_easy','easy','medium','hard','very_hard'].indexOf(difficulty)).click();
  const hp=Math.round(enemyDefinition.stats.maxHp*1.03**(Math.min(level,30)-1)*1.04**Math.max(0,level-30));
  await expect(page.locator('.quest-enemies')).toContainText('HP '+hp);await expect(page.locator('.quest-enemies')).toContainText('Level '+level);
 }
 await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page).toHaveURL(/battle$/);
 const enemy=page.locator('[data-actor-id=enemy_0]');await expect(enemy).toContainText(enemyDefinition.name);await expect(enemy.locator('.hp-bar')).toHaveAttribute('max',String(Math.round(enemyDefinition.stats.maxHp*1.03**29*1.04**15)));await expect(enemy).toContainText('Level 45');
});

test('Bounty defeat result returns to the same boss and difficulty without resetting to Level 25',async({page})=>{
 await seed(page,true);await page.goto('/quests?tab=bounty&selected=bounty_black_script_cleric&difficulty=very_hard');await page.getByRole('button',{name:/Xuất chiến/}).click();
 for(let i=0;i<35;i++){
  await expect.poll(async()=>await page.locator('.battle-result').count()>0||await page.locator('.execute:enabled').count()>0).toBe(true);
  if(await page.locator('.battle-result').count())break;
  await page.locator('[data-gamepad-skill="$attack"]').click();await page.locator('.execute').click();
 }
 await expect(page.locator('.battle-result')).toHaveClass(/defeat/);
 const back=page.getByRole('link',{name:/Trở về chọn trận/});await expect(back).toHaveAttribute('href','/quests?tab=bounty&selected=bounty_black_script_cleric&difficulty=very_hard');await back.click();await expect(page).toHaveURL(/tab=bounty&selected=bounty_black_script_cleric&difficulty=very_hard/);await expect(page.locator('.quest-enemies')).toContainText('Level 45');await expect(page.locator('.quest-enemies')).toContainText('HP 4753');
});
for(const [quest,hp]of [['alice_superboss','6372'],['miraebolis_superboss','9558']])test(`${quest} preview uses HP ref1 while combat stays Lv60`,async({page})=>{
 await seed(page);await page.goto(`/quests?tab=sinister&selected=${quest}`);await expect(page.locator('.quest-enemies')).toContainText(`HP ${hp}`);
 await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page).toHaveURL(/battle$/);await expect(page.locator('[data-actor-id=enemy_0] .hp-bar')).toHaveAttribute('max',hp);await expect(page.locator('[data-actor-id=enemy_0]')).toContainText('Level 60');
});
