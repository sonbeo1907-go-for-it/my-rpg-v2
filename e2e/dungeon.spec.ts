import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page,used=0) {
  const save=createGameSave(content);save.party=['lisbeth','iris','elaine','garrek'];save.partyPresets[0].slots=[...save.party];save.unlockedCharacterIds.push('lisbeth');
  for(const id of ['lisbeth','iris','elaine']){save.extraGearSlots[id]=3;save.equipment[id]=[];for(let i=0;i<6;i++){const gear={id:`gear_${save.gear.length+1}`,typeId:'t3_focused',stats:{magic:5}};save.gear.push(gear);save.equipment[id].push(gear.id);}}
  save.gacha.totalPulls=save.gear.length;
 for(const id of save.party){Object.assign(save.characters[id],{level:45,xp:0,limitBreakRank:3,allocations:id==='garrek'?{defense:15,maxHp:15,resistance:14}:{magic:15,maxHp:15,maxMp:14}});}
  if(used)save.dungeonDaily={day:'2026-10-29',clears:{gold_mine:used}};
  await page.addInitScript(raw=>{
    if(!localStorage.getItem('northern-prisma.campaign.v4'))localStorage.setItem('northern-prisma.campaign.v4',raw);
    sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({controlMode:'mouse',musicEnabled:false,musicVolume:.35}));
    Object.defineProperty(crypto,'getRandomValues',{configurable:true,value:(array:Uint32Array)=>{array.fill(42);return array;}});
  },encodeGameSave(save,content));
  await page.emulateMedia({reducedMotion:'reduce'});
}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));
test('four illustrated doors and Quest-style difficulty boards show current scope and fit phones',async({page,request})=>{
  await seed(page);await page.goto('/dungeon');await expect(page.locator('.dungeon-choice')).toHaveCount(4);
  const widths=await page.locator('.dungeon-choice').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));expect(Math.max(...widths)-Math.min(...widths)).toBeLessThan(2);
  await expect(page.locator('.dungeon-choice.closed')).toHaveCount(0);
  for(const file of ['dungeon-gold.svg','dungeon-danger.svg','dungeon-training.svg','dungeon-breakthrough.svg']){const result=await request.get(`/art/${file}`);expect(result.ok()).toBe(true);expect(await result.text()).toContain('<svg');}
  await page.screenshot({path:'test-results/visual-dungeon-doors.png',fullPage:true});
  await page.locator('a.dungeon-choice[href="/dungeon/gold_mine"]').click();
  await expect(page.locator('.quest-card')).toHaveCount(3);await expect(page.locator('.quest-card.selected')).toContainText('Dễ');await expect(page.locator('.quest-illustration')).toContainText('1.000');
  await page.getByRole('button',{name:/Trung bình/}).click();await expect(page.locator('.quest-illustration')).toContainText('Level 30');await expect(page.locator('.quest-illustration')).toContainText('MP ×2,25');await expect(page.locator('.quest-illustration')).not.toContainText('ATK ×1,25');
  await page.getByRole('button',{name:/Khó/}).click();await expect(page.locator('.embark')).toBeEnabled();await expect(page.locator('.quest-illustration')).toContainText('Level 45');await expect(page.locator('.quest-illustration')).not.toContainText('ATK ×1,6');
  await page.goto('/dungeon/dangerous');await expect(page.locator('.quest-card')).toHaveCount(3);await expect(page.locator('.embark')).toBeEnabled();await expect(page.locator('.quest-card').last()).toContainText('5');await expect(page.locator('.dungeon-room-card')).toHaveCount(0);await page.locator('.embark').click();await expect(page.getByRole('dialog').locator('.dungeon-room-card')).toHaveCount(1);
  await page.setViewportSize({width:390,height:844});
  for(const route of ['/dungeon','/dungeon/gold_mine','/dungeon/dangerous']){await page.goto(route);await expect(page.locator('main')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBe(true);}
  await page.screenshot({path:'test-results/visual-dungeon-phone.png',fullPage:true});
});
for(const [difficulty,waves,reward] of [['easy',3,1000],['medium',4,2000],['hard',4,3000]] as const){
  test(`gold ${difficulty} automatically clears ${waves} waves, carries MP and saves only the final reward/quota`,async({page})=>{
    test.setTimeout(90000);await seed(page);await page.goto(`/dungeon/gold_mine?selected=${difficulty}`);
    await page.locator('.embark').click();await page.getByRole('dialog').getByRole('button',{name:'Bắt đầu thám hiểm',exact:true}).click();await expect(page).toHaveURL(/battle$/);
    const seen=new Set<number>();let blockedStorage=false;
    for(let turn=0;turn<160;turn++){
      await expect.poll(async()=>await page.locator('.command-panel h2').filter({hasText:/Hoàn thành thám hiểm|Chuyến đi đã kết thúc/}).count()>0||await page.locator('.execute').isEnabled()).toBe(true);
      if(await page.locator('.command-panel h2').filter({hasText:/Hoàn thành thám hiểm|Chuyến đi đã kết thúc/}).count())break;
      const wave=Number(await page.locator('main').getAttribute('data-dungeon-wave'));seen.add(wave);
      if(wave>1){expect((await saved(page)).coins).toBe(0);const mp=await page.locator('[data-actor-id=lisbeth] .mp-bar').evaluate(node=>({value:(node as HTMLProgressElement).value,max:(node as HTMLProgressElement).max}));expect(mp.value).toBeLessThan(mp.max);}
      if(difficulty==='easy'&&wave>1&&!blockedStorage){blockedStorage=true;await page.evaluate(()=>{(window as any).__originalStorage=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='northern-prisma.profiles.v1')throw new DOMException('Quota exceeded','QuotaExceededError');return (window as any).__originalStorage.call(this,key,value);};});}
      const turnName=await page.locator('.command-panel h2').textContent();
      const choices=turnName?.includes('Lisbeth')?['lisbeth.judgment','lisbeth.lance']:turnName?.includes('Elaine')?['elaine.sanctuary','elaine.shield']:turnName?.includes('Iris')?['iris.formula']:[];
      for(const id of choices){const skill=page.locator(`.skill-command[data-gamepad-skill="${id}"][aria-disabled=false]`);if(await skill.count()){await skill.click();break;}}
      await page.locator('.execute').click();
    }
    await expect(page.locator('.command-panel h2')).toContainText('Hoàn thành thám hiểm');expect(seen.size).toBe(waves);
    if(blockedStorage){await expect(page.locator('.notice')).toContainText('Quota exceeded');expect((await saved(page)).coins).toBe(0);expect((await saved(page)).dungeonDaily.day).toBeNull();await page.evaluate(()=>{Storage.prototype.setItem=(window as any).__originalStorage;});await page.getByRole('button',{name:'Nhận thưởng chiến thắng'}).click();}
    await expect(page.locator('.battle-outcome')).toContainText(`+${reward} coin đã lưu`);
    const after=await saved(page);expect(after.coins).toBe(reward);expect(after.victories).toBe(1);expect(after.dungeonDaily.clears.gold_mine).toBe(1);expect(after.dailyCommissions.dungeonClears).toBe(1);expect(after.dailyCommissions.questClears).toBe(0);expect(after.claimedFirstClearRewards).toEqual([]);expect(after.unlockedCharacterIds).not.toContain('kai');expect(after.extraGearSlots.arthur).toBeUndefined();
    await page.screenshot({path:`test-results/visual-dungeon-${difficulty}-clear.png`,fullPage:true});
    await page.getByRole('link',{name:/Trở về chọn mức độ/}).click();await expect(page.locator('.page-header')).toContainText('2/3');await page.reload();await expect(page.locator('.page-header')).toContainText('2/3');expect((await saved(page)).coins).toBe(reward);
  });
}
test('shared daily quota survives reload and unlocks both levels at Vietnam midnight',async({page})=>{
  await page.clock.install({time:new Date('2026-10-29T16:59:59.000Z')});await seed(page,3);await page.goto('/dungeon/gold_mine');
  await expect(page.locator('.embark')).toBeDisabled();await expect(page.locator('.page-header')).toContainText('0/3');
  await page.clock.runFor(1500);await expect(page.locator('.page-header')).toContainText('3/3');await expect(page.locator('.embark')).toBeEnabled();
  await page.getByRole('button',{name:/Trung bình/}).click();await expect(page.locator('.embark')).toBeEnabled();
  await page.getByRole('button',{name:/Khó/}).click();await expect(page.locator('.embark')).toBeEnabled();
  expect((await saved(page)).dungeonDaily.clears.gold_mine).toBe(3);
});
