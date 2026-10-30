import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,basicAbility,DEFEND,abilityAvailability} from '../src/core/battle.js';
import {mpCost,resourceCost} from '../src/core/conditional-combat.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
import {skillCost,skillScaling} from '../src/ui/skill-presentation.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {liveSkillChoices,statusDetails,compactSkillScaling} from '../src/ui/combat-presentation.js';
const content=await loadContent();
function setup(party=['sieg','arthur'],change=()=>{}){
 const c=structuredClone(content);change(c);const save=createGameSave(c);save.party=party;save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];const b=createBattle(c,save,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.statuses=[];e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}return {b,c,save};
}
function act(b,id='$defend',target){const a=activeActor(b),skill=id==='$defend'?DEFEND:id==='$attack'?basicAbility(a):b.content.abilities[id];executeAction(b,{actorId:a.id,abilityId:id,targetId:target??(skill.target==='enemy'?b.actors.find(t=>t.team!==a.team&&t.hp>0).id:a.id)});}
function until(b,check){for(let i=0;i<160;i++){if(check())return;assert.equal(b.outcome,null);act(b);}throw Error('Condition unreachable');}
const ready=(b,id)=>until(b,()=>activeActor(b)?.id===id);
const damage=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id);
const fast=c=>c.characters.sieg.stats.speed=100;
test('new official recruits have the authored identity, remain locked and preserve the save schema',()=>{
 const save=createGameSave(content);for(const id of ['sieg','minerva']){assert.ok(content.banners.standard.characterPool.includes(id));assert.equal(save.unlockedCharacterIds.includes(id),false);assert.equal(save.extraGearSlots[id]??0,0);}assert.deepEqual(decodeGameSave(encodeGameSave(save,content),content),save);assert.equal(content.characters.sieg.roleGroup,'fighter');assert.equal(content.characters.sieg.element,'water');assert.equal(content.characters.sieg.stats.speed,6);assert.ok(content.characters.sieg.tags.includes('elf'));assert.equal(content.characters.sieg.abilities.length,4);assert.equal(content.characters.minerva.roleGroup,'defensive_support');assert.equal(content.characters.minerva.element,'earth');assert.ok(content.characters.minerva.stats.speed>=20);
});
test('Sieg gains 1 / 2 / 1 Sword Arts per cast, caps at four and basic attacks generate none',()=>{
 const {b}=setup(),s=getActor(b,'sieg');ready(b,s.id);act(b,'sieg.opening');assert.equal(s.resourceValues.sword_art,1);ready(b,s.id);act(b,'sieg.sanctuary');assert.equal(s.resourceValues.sword_art,3);ready(b,s.id);act(b,'sieg.break_form');assert.equal(s.resourceValues.sword_art,4);ready(b,s.id);act(b,'sieg.opening');assert.equal(s.resourceValues.sword_art,4);ready(b,s.id);act(b,'$attack');assert.equal(s.resourceValues.sword_art,4);
});
for(const [stacks,mp,leftStacks,leftMp]of [[0,24,0,0],[3,24,3,0],[4,0,0,0],[4,80,0,80]])test(`preferred cost at ${stacks} stacks and ${mp} MP uses exactly one payment route`,()=>{
 const {b}=setup(undefined,fast),s=getActor(b,'sieg'),skill=content.abilities['sieg.still_sea'];s.resourceValues.sword_art=stacks;s.mp=mp;assert.equal(abilityAvailability(b,s,skill).ok,true);assert.equal(mpCost(skill,s),stacks===4?0:24);assert.equal(Boolean(resourceCost(skill,s)),stacks===4);act(b,skill.id);assert.equal(s.mp,leftMp);assert.equal(s.resourceValues.sword_art,leftStacks);assert.equal(damage(b,s.id)[0].amount,104);assert.equal(s.cooldowns[skill.id],3);
});
test('insufficient alternative payment and invalid targets never spend MP or Sword Arts',()=>{
 const {b}=setup(undefined,fast),s=getActor(b,'sieg'),skill=content.abilities['sieg.still_sea'];s.resourceValues.sword_art=3;s.mp=23;assert.equal(abilityAvailability(b,s,skill).ok,false);assert.throws(()=>act(b,skill.id),/MP/);assert.equal(s.mp,23);assert.equal(s.resourceValues.sword_art,3);s.resourceValues.sword_art=4;s.mp=0;assert.throws(()=>act(b,skill.id,'missing'),/Mục tiêu/);assert.equal(s.resourceValues.sword_art,4);assert.equal(s.mp,0);
});
test('resource route is frozen at cast start and consumes the four stacks after the hit',()=>{
 const {b}=setup(undefined,c=>{fast(c);c.statuses.test_evade={id:'test_evade',name:'Evade',kind:'buff',modifiers:{evasion:.1}};});const s=getActor(b,'sieg');s.resourceValues.sword_art=4;getActor(b,'enemy_0').statuses.push({id:'test_evade',remaining:3});let draws=0;b.random=()=>{draws++;assert.equal(s.resourceValues.sword_art,4);return .99;};act(b,'sieg.still_sea');assert.equal(draws,1);assert.equal(s.resourceValues.sword_art,0);assert.equal(s.mp,80);
});
test('Sword Arts do not bypass cooldowns and the UI reports the real chosen cost',()=>{
 const {b}=setup(undefined,fast),s=getActor(b,'sieg'),skill=content.abilities['sieg.still_sea'];assert.match(skillCost(skill,s),/Thiếu tầng: 24 MP/);s.resourceValues.sword_art=4;s.mp=0;assert.match(skillCost(skill,s),/Hiện tại: 4 Kiếm Kĩ/);assert.equal(liveSkillChoices(skill,s,getActor(b,'enemy_0'),b).spent,4);s.cooldowns[skill.id]=1;assert.equal(abilityAvailability(b,s,skill).ok,false);assert.throws(()=>act(b,skill.id),/Hồi chiêu/);assert.equal(s.resourceValues.sword_art,4);
});
test('global three-round protection survives all main/extra turns, expires after round 3 and has exactly two empty rounds',()=>{
 const {b}=setup(),s=getActor(b,'sieg');ready(b,s.id);assert.equal(b.round,1);act(b,'sieg.sanctuary');assert.equal(b.round,2);for(const a of b.actors.filter(a=>a.team==='party')){assert.equal(a.shield,60);assert.equal(a.shieldExpiresAfterRound,3);assert.equal(a.statuses.find(t=>t.id==='silver_tide').remaining,2);assert.equal(battleStat(content,a,'defense'),a.stats.defense*1.3);}
 b.extraTurnGrants=new Set(['sieg','arthur']);b.extraPhaseRequired=true;until(b,()=>b.phase==='extra');assert.equal(b.round,2);assert.equal(s.statuses.find(t=>t.id==='silver_tide').remaining,2);act(b);assert.equal(s.statuses.find(t=>t.id==='silver_tide').remaining,2);until(b,()=>b.round===3);assert.equal(s.shield,60);assert.equal(s.statuses.find(t=>t.id==='silver_tide').remaining,1);
 for(const round of [4,5]){until(b,()=>b.round===round);assert.equal(s.shield,0);assert.equal(s.statuses.some(t=>t.id==='silver_tide'),false);assert.equal(abilityAvailability(b,s,content.abilities['sieg.sanctuary']).ok,false);}until(b,()=>b.round===6);assert.equal(abilityAvailability(b,s,content.abilities['sieg.sanctuary']).ok,true);
});
test('an untimed stronger shield removes the old deadline; weaker shields cannot extend the timed shield',()=>{
 const {b}=setup(undefined,c=>{fast(c);c.abilities['test.shield']={id:'test.shield',name:'Shield',target:'self',effects:[{type:'shield',flat:80}]};});const s=getActor(b,'sieg');s.abilities.push('test.shield');act(b,'sieg.sanctuary');ready(b,s.id);act(b,'test.shield');assert.equal(s.shield,80);assert.equal(s.shieldExpiresAfterRound,undefined);until(b,()=>b.round===4);assert.equal(s.shield,80);assert.equal(s.statuses.some(t=>t.id==='silver_tide'),false);
 const other=setup(['sieg','elaine'],fast).b;act(other,'sieg.sanctuary');ready(other,'elaine');act(other,'elaine.shield','sieg');assert.equal(getActor(other,'sieg').shield,60);assert.equal(getActor(other,'sieg').shieldSourceId,'sieg');assert.equal(getActor(other,'sieg').shieldExpiresAfterRound,3);
});
test('timed shield expiration is not shield-break MP recovery, and new-room entry cannot extend an expired window',()=>{
 const {b,c,save}=setup(['sieg','victorina'],fast),s=getActor(b,'sieg'),v=getActor(b,'victorina');act(b,'sieg.sanctuary');s.shieldSourceId=v.id;s.mp=0;until(b,()=>b.round===3);const carried=b.actors.filter(a=>a.team==='party');const next=createBattle(c,save,'forest_patrol',()=>.99,{partyActors:carried,roundOffset:3});assert.equal(getActor(next,s.id).shield,0);assert.equal(getActor(next,s.id).statuses.some(t=>t.id==='silver_tide'),false);assert.equal(next.log.some(l=>l.includes('Nhựa sống dưới gai')),false);
});
test('8% damage native checks the current shield from any source, and adds to ordinary damage bonuses',()=>{
 for(const [shield,empowered,expected]of [[0,false,29],[1,false,31],[1,true,42]]){const {b}=setup(undefined,fast),s=getActor(b,'sieg');s.shield=shield;s.shieldSourceId='elaine';if(empowered)s.statuses.push({id:'empowered',remaining:3});act(b,'$attack');assert.equal(damage(b,s.id)[0].amount,expected);}
});
test('Sieg debuffs require an actual hit; evasion still allows the authored cast resource gain',()=>{
 const {b}=setup(undefined,c=>{fast(c);c.statuses.test_evade={id:'test_evade',name:'Evade',kind:'buff',modifiers:{evasion:.85}};});b.random=()=>0;const e=getActor(b,'enemy_0');e.statuses.push({id:'test_evade',remaining:3});act(b,'sieg.break_form');assert.equal(e.statuses.some(t=>t.id==='tide_disarmed'),false);assert.equal(getActor(b,'sieg').resourceValues.sword_art,1);
});
function curseSetup(){const state=setup(['minerva','arthur','sieg'],c=>{c.characters.minerva.stats.speed=100;c.abilities['test.curse']={id:'test.curse',name:'Curse',target:'enemy',effects:[{type:'status',status:'shaken',duration:3}]};c.abilities['test.double']={id:'test.double',name:'Double curse',target:'enemy',effects:[{type:'status',status:'shaken',duration:3},{type:'status',status:'fractured',duration:3}]};});const e=getActor(state.b,'enemy_0');e.abilities.push('test.curse','test.double');return state;}
function curse(b,target,skill='test.curse'){b.queue=['enemy_0',b.actors.find(a=>a.team==='party'&&a.hp>0&&a.id!==target).id];b.cursor=0;act(b,skill,target);}
test('Minerva heals actual enemy debuffs per recipient, includes herself and shares main/extra quotas',()=>{
 const {b}=curseSetup(),m=getActor(b,'minerva'),a=getActor(b,'arthur');m.hp=100;a.hp=100;curse(b,a.id);assert.equal(a.hp,114);curse(b,a.id);assert.equal(a.hp,114);b.phase='extra';curse(b,a.id);assert.equal(a.hp,114);curse(b,m.id);assert.equal(m.hp,114);b.round++;curse(b,a.id);assert.equal(a.hp,128);
});
test('Hộ Ấn blocks one debuff, not the whole multi-effect skill; blocked effects never trigger the native',()=>{
 const {b}=curseSetup(),a=getActor(b,'arthur');act(b,'minerva.ward');a.hp=100;curse(b,a.id);assert.equal(a.hp,100);assert.equal(a.statuses.some(s=>s.id==='effect_ward'),false);assert.equal(a.procRounds?.['debuff_heal:minerva'],undefined);a.statuses.push({id:'effect_ward',remaining:null,sourceId:'minerva',charges:1});curse(b,a.id,'test.double');assert.equal(a.hp,114);assert.equal(a.statuses.some(s=>s.id==='shaken'),false);assert.equal(a.statuses.some(s=>s.id==='fractured'),true);
});
test('ward refresh never stacks charges and cleanse removes all debuffs while retaining buffs',()=>{
 const {b}=curseSetup(),m=getActor(b,'minerva'),a=getActor(b,'arthur');act(b,'minerva.ward');ready(b,m.id);m.cooldowns['minerva.ward']=0;act(b,'minerva.ward');assert.equal(a.statuses.filter(s=>s.id==='effect_ward').length,1);assert.equal(a.statuses.find(s=>s.id==='effect_ward').charges,1);a.statuses.push({id:'shaken',remaining:2,sourceId:'enemy_0'},{id:'fractured',remaining:2,sourceId:'enemy_0'});ready(b,m.id);a.hp=100;act(b,'minerva.cleanse');assert.equal(a.statuses.some(s=>content.statuses[s.id].kind==='debuff'),false);assert.equal(a.statuses.some(s=>s.id==='effect_ward'),true);assert.equal(a.hp,100);
});
test('self-inflicted debuffs, dead healers and pure damage do not trigger Minerva healing',()=>{
 for(const mode of ['friendly','healer_ko','damage']){const {b}=curseSetup(),m=getActor(b,'minerva'),a=getActor(b,'arthur');a.hp=100;if(mode==='friendly'){b.content.abilities['test.own_curse']={id:'test.own_curse',name:'Own curse',target:'ally',effects:[{type:'status',status:'shaken',duration:2}]};m.abilities.push('test.own_curse');act(b,'test.own_curse',a.id);assert.equal(a.hp,100);assert.equal(a.statuses.some(s=>s.id==='shaken'),true);}else{if(mode==='healer_ko')m.hp=0;if(mode==='damage'){b.queue=['enemy_0','sieg'];b.cursor=0;act(b,'$attack',a.id);assert.ok(a.hp<100);}else curse(b,a.id);assert.equal(a.procRounds?.['debuff_heal:minerva'],undefined);}}
});
test('full HP does not spend the native quota and healing caps at max HP using current MAG',()=>{
 const {b}=curseSetup(),a=getActor(b,'arthur');curse(b,a.id);assert.equal(a.procRounds?.['debuff_heal:minerva'],undefined);a.hp=a.stats.maxHp-3;curse(b,a.id);assert.equal(a.hp,a.stats.maxHp);assert.equal(a.procRounds['debuff_heal:minerva'],b.round);
});
test('weak direct healing has no hidden emergency multiplier and no debuff trigger',()=>{
 const {b}=curseSetup(),a=getActor(b,'arthur');a.hp=1;act(b,'minerva.herbs',a.id);assert.equal(a.hp,26);assert.equal(getActor(b,'minerva').mp,106);assert.equal(a.procRounds?.['debuff_heal:minerva'],undefined);
});
test('UI distinguishes global rounds, preferred costs and native conditions without internal fields',()=>{
 const {b}=setup(undefined,fast),s=getActor(b,'sieg'),skill=content.abilities['sieg.sanctuary'];assert.match(skillPresentation(skill,s,content).facts.join(' '),/3 vòng/);assert.match(skillScaling(skill,s,content).join(' '),/3 vòng/);act(b,skill.id);const status=s.statuses.find(t=>t.id==='silver_tide');assert.match(statusDetails(status,s,b,content).duration,/vòng/);assert.match(passivePresentation(s,content).facts.join(' '),/8%/);assert.match(passivePresentation(content.characters.minerva,content).facts.join(' '),/50% MAG/);
});
test('malformed fallback costs, round durations and passives fail validation before battle',()=>{
 for(const mutate of [c=>c.abilities['sieg.still_sea'].cost.preferResource.amount=5,c=>c.abilities['sieg.still_sea'].cost.mp=0,c=>c.abilities['sieg.still_sea'].cost.resource={id:'sword_art',amount:1},c=>c.abilities['sieg.still_sea'].cost.preferResource.id='missing',c=>c.abilities['sieg.sanctuary'].effects[0].durationRounds=0,c=>c.statuses.silver_tide.persistent=true,c=>c.characters.sieg.passive.ratio=2,c=>c.characters.minerva.passive.oncePerRecipientPerRound=false]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
});

test('compact shield bonus is shown only for damaging actions while a shield actually exists',()=>{
 const {b}=setup(undefined,fast),s=getActor(b,'sieg');s.shield=60;
 assert.match(compactSkillScaling(basicAbility(s),s,getActor(b,'enemy_0'),content,b),/8% ST từ khiên/);
 assert.doesNotMatch(compactSkillScaling(DEFEND,s,s,content,b),/8%/);
 assert.doesNotMatch(compactSkillScaling(content.abilities['sieg.sanctuary'],s,s,content,b),/8%/);
 s.shield=0;assert.doesNotMatch(compactSkillScaling(basicAbility(s),s,getActor(b,'enemy_0'),content,b),/8%/);
});
