import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,targetsFor,basicAbility,DEFEND,abilityAvailability} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {resolveCharacter} from '../src/core/progression.js';
import {validateContent} from '../src/core/content.js';
import {resolveCombatTargets,compactSkillScaling} from '../src/ui/combat-presentation.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillScaling} from '../src/ui/skill-presentation.js';
import {advanceDungeonWave,createDungeonRun} from '../src/core/dungeon.js';
const content=await loadContent();
function setup(party,change=()=>{}){
 const c=structuredClone(content);change(c);const save=createGameSave(c);save.party=party;save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party.filter(Boolean)])];const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.statuses=[];e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}
 return {b,save,c};
}
function act(b,id='$defend',target){const a=activeActor(b),s=id==='$defend'?DEFEND:id==='$attack'?basicAbility(a):b.content.abilities[id];executeAction(b,{actorId:a.id,abilityId:id,targetId:target??(s.target==='enemy'?b.actors.find(a=>a.team!==activeActor(b).team&&a.hp>0).id:a.id)});}
function until(b,predicate){for(let i=0;i<120;i++){if(predicate())return;assert.equal(b.outcome,null);act(b);}throw Error('Unreachable turn');}
const ready=(b,id)=>until(b,()=>activeActor(b)?.id===id);
const damage=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id);

test('all three are official locked recruits and balance adjustments are present without changing save format',()=>{
 const save=createGameSave(content);for(const id of ['roland','lumine','victorina']){assert.ok(content.banners.standard.characterPool.includes(id));assert.equal(save.unlockedCharacterIds.includes(id),false);assert.equal(save.extraGearSlots[id]??0,0);assert.ok(save.characters[id]);}assert.deepEqual(decodeGameSave(encodeGameSave(save,content),content),save);assert.equal(content.characters.kreider.stats.magic,41);assert.equal(content.characters.kreider.stats.maxHp,125);assert.equal(content.characters.charlemagnes.stats.attack,34);assert.equal(content.characters.charlemagnes.stats.speed,14);
});
for(let slot=0;slot<4;slot++)test('Roland selects the two fixed wrapping adjacent slots at position '+(slot+1),()=>{
 const party=['iris','elaine','garrek'];party.splice(slot,0,'roland');const {b}=setup(party),r=getActor(b,'roland');ready(b,r.id);const skill=content.abilities['roland.march'],ids=targetsFor(b,r,skill).map(a=>a.id);assert.deepEqual(ids,party.filter((id,i)=>i===(slot+3)%4||i===(slot+1)%4));const ui=resolveCombatTargets(b,r,skill,{allyId:r.id});assert.deepEqual(ui.affectedIds,ids);assert.ok(ids.includes(ui.targetId));assert.equal(ui.legalIds.includes(r.id),false);act(b,skill.id,'enemy_0');assert.deepEqual([...b.extraTurnGrants],ids);assert.equal(r.mp,76);assert.equal(r.cooldowns[skill.id],7);
});
test('empty and fallen slots are not compressed and a sole caster cannot spend MP on no recipients',()=>{
 const {b}=setup(['roland',null,'iris','elaine']);ready(b,'roland');let skill=content.abilities['roland.march'];assert.deepEqual(targetsFor(b,getActor(b,'roland'),skill).map(a=>a.id),['elaine']);getActor(b,'elaine').hp=0;assert.equal(targetsFor(b,getActor(b,'roland'),skill).length,0);assert.equal(abilityAvailability(b,getActor(b,'roland'),skill).ok,false);const before=getActor(b,'roland').mp;assert.throws(()=>act(b,skill.id));assert.equal(getActor(b,'roland').mp,before);assert.equal(b.extraTurnGrants.size,0);
});
test('an existing grant is skipped per recipient and no extra phase can chain new grants',()=>{
 const {b}=setup(['roland','iris','elaine','garrek']);ready(b,'roland');b.extraTurnGrants.add('iris');b.extraPhaseRequired=true;act(b,'roland.march');assert.deepEqual([...b.extraTurnGrants],['iris','garrek']);b.extraTurnGrants.add('roland');until(b,()=>b.phase==='extra');ready(b,'roland');getActor(b,'roland').cooldowns['roland.march']=0;getActor(b,'roland').mp=100;const grants=[...b.extraTurnGrants];act(b,'roland.march');assert.deepEqual([...b.extraTurnGrants],grants);assert.ok(b.log.some(x=>x.includes('bỏ qua cấp Lượt Thêm')));
});
test('Roland restores 4% to living allies exactly once after all extra turns, including himself',()=>{
 const {b}=setup(['roland','iris','elaine','garrek']);ready(b,'roland');act(b,'roland.march');until(b,()=>b.phase==='extra');assert.equal(b.log.some(x=>x.includes('Hậu cần tổng chỉ huy cuối Vòng')),false);while(b.cursor<b.queue.length-1)act(b);for(const a of b.actors.filter(a=>a.team==='party'))a.mp=0;act(b,'$attack','enemy_0');assert.equal(b.round,2);for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(a.mp,Math.ceil(a.stats.maxMp*.04));assert.equal(b.log.filter(x=>x.includes('Hậu cần tổng chỉ huy cuối Vòng')).length,1);
});
test('Roland native never restores enemies or dead allies and requires Roland alive',()=>{
 const {b}=setup(['roland','iris','elaine']);ready(b,'roland');act(b);getActor(b,'elaine').hp=0;getActor(b,'roland').hp=0;getActor(b,'iris').mp=0;until(b,()=>b.round===2);assert.equal(b.log.some(x=>x.includes('Hậu cần tổng chỉ huy cuối Vòng')),false);assert.equal(getActor(b,'elaine').mp,100);
});
test('60% speed buff uses the ordinary modifier system without retroactively moving completed turns',()=>{
 const {b}=setup(['roland','iris','elaine','garrek']);ready(b,'roland');const queue=[...b.queue];act(b,'roland.haste');assert.deepEqual(b.queue,queue);for(const a of b.actors.filter(a=>a.team==='party')){assert.equal(battleStat(content,a,'speed'),a.stats.speed*1.6);assert.equal(a.statuses.find(s=>s.id==='grand_march').remaining,3);}until(b,()=>b.round===2);assert.equal(b.queue.indexOf('roland')<b.queue.indexOf('enemy_0'),true);
});
test('Lumine scales basic and active physical damage from MAG rather than ATK, still using DEF',()=>{
 const {b}=setup(['lumine'],c=>{delete c.characters.lumine.passive;c.characters.lumine.stats.speed=100;});const a=getActor(b,'lumine'),e=getActor(b,'enemy_0');a.stats.magic=40;a.stats.attack=9999;e.stats.defense=20;e.stats.resistance=9999;act(b,'$attack',e.id);assert.equal(damage(b,a.id)[0].amount,29);ready(b,a.id);e.statuses=[];act(b,'lumine.verdict',e.id);assert.equal(damage(b,a.id)[0].amount,103);assert.equal(e.mp,e.stats.maxMp);
});
test('MAG buffs increase Lumine physical attacks; ATK buffs do not',()=>{
 for(const [mods,expected]of [[{attack:1},40],[{magic:.5},60]]){const {b}=setup(['lumine'],c=>{delete c.characters.lumine.passive;c.characters.lumine.stats.magic=40;c.characters.lumine.stats.speed=100;c.statuses.test_power={id:'test_power',name:'Test',kind:'buff',modifiers:mods};});getActor(b,'lumine').statuses.push({id:'test_power',remaining:3});act(b,'$attack','enemy_0');assert.equal(damage(b,'lumine')[0].amount,expected);}
});
test('Lumine physical MAG damage can be evaded and cannot trigger Aurora magic follow-up',()=>{
 const {b}=setup(['lumine','aurora'],c=>{c.characters.lumine.stats.speed=100;c.statuses.test_evade={id:'test_evade',name:'Evade',kind:'buff',modifiers:{evasion:.85}};});b.random=()=>0;getActor(b,'enemy_0').statuses.push({id:'test_evade',remaining:3});act(b,'lumine.edict','enemy_0');assert.ok(b.events.some(e=>e.type==='dodge'));assert.equal(damage(b,'aurora').length,0);ready(b,'lumine');getActor(b,'enemy_0').statuses=[];act(b,'$attack','enemy_0');assert.equal(damage(b,'aurora').length,0);assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,0);
});
test('physical and magical vulnerability remain classified by damage type, not the chosen power stat',()=>{
 for(const [type,expected]of [['physical',60],['magical',40]]){const {b}=setup(['lumine'],c=>{delete c.characters.lumine.passive;c.characters.lumine.stats.magic=40;c.characters.lumine.stats.speed=100;});getActor(b,'enemy_0').damageTypeWeaknesses=[type];act(b,'$attack','enemy_0');assert.equal(damage(b,'lumine')[0].amount,expected);}
});
function rose(){const state=setup(['victorina','arthur','iris','elaine'],c=>c.characters.victorina.stats.speed=100);ready(state.b,'victorina');act(state.b,'victorina.petals');return state;}
function enemyHit(b,target,amount=1000){const a=getActor(b,'enemy_0');a.stats.attack=amount;a.statuses=[];b.queue=[a.id,b.actors.find(other=>other.team==='party'&&other.hp>0&&other.id!==target).id];b.cursor=0;act(b,'$attack',target);}
test('Victorina shields use the mean of actual DEF and RES and grow with both buffs',()=>{
 const {b}=rose(),v=getActor(b,'victorina');for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(a.shield,35);v.statuses.push({id:'rose_bastion',remaining:3},{id:'rose_sanctuary',remaining:3});ready(b,v.id);v.cooldowns['victorina.petals']=0;act(b,'victorina.petals');for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(a.shield,47);assert.equal(targetsFor(b,getActor(b,'enemy_0'),basicAbility(getActor(b,'enemy_0'))).length,4);
});
test('each shield recipient gets MP independently, not Victorina; main and extra phases share quotas',()=>{
 const {b}=rose(),v=getActor(b,'victorina'),a=getActor(b,'arthur'),i=getActor(b,'iris');for(const t of [v,a,i]){t.mp=0;t.hp=t.stats.maxHp=10000;}enemyHit(b,a.id);assert.equal(a.mp,6);assert.equal(v.mp,0);i.shield=1;enemyHit(b,i.id);assert.equal(i.mp,6);a.shield=35;a.shieldSourceId=v.id;b.phase='extra';enemyHit(b,a.id);assert.equal(a.mp,6);assert.equal(v.mp,0);assert.equal(b.log.filter(x=>x.includes('kích hoạt Nhựa sống dưới gai')).length,2);
});
test('MP amount uses live source defenses, rounds up and caps at the recipient maximum',()=>{
 const {b}=rose(),v=getActor(b,'victorina'),a=getActor(b,'arthur');v.statuses.push({id:'rose_bastion',remaining:3},{id:'rose_sanctuary',remaining:3});a.mp=30;a.hp=a.stats.maxHp=10000;enemyHit(b,a.id);assert.equal(a.mp,38);a.shield=35;a.shieldSourceId=v.id;b.round++;enemyHit(b,a.id);assert.equal(a.mp,40);
});
test('full MP does not consume the shield-break quota, but a subsequent real refill does',()=>{
 const {b}=rose(),v=getActor(b,'victorina'),a=getActor(b,'arthur');a.hp=a.stats.maxHp=10000;enemyHit(b,a.id);assert.equal(a.procRounds?.['shield_mp:'+v.id],undefined);a.mp=0;a.shield=35;a.shieldSourceId=v.id;enemyHit(b,a.id);assert.equal(a.mp,6);assert.equal(a.procRounds['shield_mp:'+v.id],b.round);
});
test('overwriting, partial damage, wrong shield ownership and source/recipient KO never grant MP',()=>{
 for(const kind of ['partial','wrong_owner','source_ko','recipient_ko']){const {b}=rose(),v=getActor(b,'victorina'),a=getActor(b,'arthur');a.mp=0;if(kind==='wrong_owner')a.shieldSourceId='elaine';if(kind==='source_ko')v.hp=0;if(kind==='recipient_ko')a.hp=1;enemyHit(b,a.id,kind==='partial'?10:1000);assert.equal(a.mp,0);}
 const {b}=rose();getActor(b,'arthur').mp=0;ready(b,'elaine');act(b,'elaine.shield','arthur');assert.equal(getActor(b,'arthur').mp,0);
});
test('fixed slots and shield provenance survive a new dungeon room without free end-round MP',()=>{
 const save=createGameSave(content);save.party=['roland',null,'victorina','lumine'];save.unlockedCharacterIds.push('roland','victorina','lumine');const run=createDungeonRun(content,save,'gold_mine','easy',{random:()=>0,now:new Date('2026-10-30T05:00:00Z')});const b=run.battle,v=getActor(b,'victorina');ready(b,v.id);act(b,'victorina.petals');for(const a of b.actors.filter(a=>a.team==='party'))a.mp=10;for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=1;ready(b,'lumine');act(b,'$attack',b.actors.find(a=>a.team==='enemy').id);const regenCount=b.log.filter(l=>l.includes('Hậu cần tổng chỉ huy cuối Vòng')).length;for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=0;act(b);assert.equal(b.outcome,'victory');advanceDungeonWave(content,run);const r=getActor(run.battle,'roland');assert.equal(r.formationSlot,0);assert.deepEqual(targetsFor(run.battle,r,content.abilities['roland.march']).map(a=>a.id),['lumine']);assert.equal(getActor(run.battle,'lumine').shieldSourceId,'victorina');assert.equal(run.battle.log.filter(l=>l.includes('Hậu cần tổng chỉ huy cuối Vòng')).length,regenCount);
});
test('shared public previews show physical MAG and averaged shields without invented magic interactions',()=>{
 const save=createGameSave(content),l=resolveCharacter(content,save,'lumine'),v=resolveCharacter(content,save,'victorina');assert.match(skillPresentation(basicAbility(l),l,content).facts.join(' '),/vật lí.*100% MAG/);assert.match(skillScaling(content.abilities['lumine.verdict'],l,content).join(' '),/280% MAG/);assert.match(skillPresentation(content.abilities['victorina.petals'],v,content).facts.join(' '),/120% \(DEF \+ RES\)\/2.*35/);assert.match(passivePresentation(v,content).facts.join(' '),/6 MP\/người/);
});
test('invalid power selectors, average definitions, recipients and new native values are rejected',()=>{
 for(const change of [c=>c.abilities['lumine.edict'].effects[0].scalingStat='maxHp',c=>c.characters.lumine.basicAttack[0].scalingStat='maxMp',c=>c.abilities['victorina.petals'].effects[0].scalingStats=['defense','defense'],c=>c.abilities['victorina.petals'].effects[0].scalingStat='magic',c=>c.characters.roland.passive.ratio=2,c=>c.characters.victorina.passive.oncePerRecipientPerRound=false,c=>c.abilities['roland.march'].target='neighbors']){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});
