import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
test('normal-damage recipes can be found, previewed, forged and persisted using the shared workbench',async({page})=>{
 const s=createGameSave(c);s.coins=100000;s.prismaFragments=50000;s.gear=Array.from({length:2},(_,i)=>({id:'gear_'+(i+1),typeId:'t3_focused',stats:{attack:5}}));s.gacha.totalPulls=2;
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/blacksmith?tab=effects');
 for(let i=0;i<12;i++){if(await page.getByRole('button',{name:/Ấn Võ Tâm/}).count())break;await page.getByRole('button',{name:'Trang sau',exact:true}).click();}
 await expect(page.getByRole('button',{name:/Ấn Võ Tâm/})).toContainText('ATK +20%');
 await expect(page.getByRole('button',{name:/Ấn Thuật Tâm/})).toContainText('MAG +20%');
 await page.getByRole('button',{name:/Ấn Võ Tâm/}).click();
 await page.getByRole('button',{name:'Chọn nguyên liệu Gear T3',exact:true}).click();
 await page.getByRole('dialog').locator('.gear-card').first().click();
 await page.getByRole('button',{name:'Rèn Gear Siêu Cấp',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('150 ATK căn bản');
 await page.getByRole('button',{name:'Xác nhận chế tạo',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('Ấn Võ Tâm');
 await expect(page.getByRole('dialog').getByText(c.gearEffects.martial_insight.description,{exact:true})).toHaveCount(1);
 const raw=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));
 expect(raw.gear.some((g:any)=>g.effectId==='martial_insight')).toBe(true);
 await page.setViewportSize({width:390,height:844});await page.reload();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(errors).toEqual([]);
});
