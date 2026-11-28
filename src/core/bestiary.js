import {enemyHpProfile,levelScaledEnemyStats} from './enemy-scaling.js';

// Discovery is definition-based, but stat curves belong to the encounter.
export function normalizeBestiary(value,content){
 const rows=Array.isArray(value)?value:[],records=new Map();
 for(const row of rows){
  if(!row||typeof row.enemyId!=="string"||!Object.hasOwn(content.enemies,row.enemyId)||!Array.isArray(row.encounterIds))continue;
  const ids=row.encounterIds.filter(id=>typeof id==='string'&&Object.hasOwn(content.encounters,id));
  if(!ids.length)continue;
  records.set(row.enemyId,new Set([...(records.get(row.enemyId)??[]),...ids]));
 }
 return [...records].sort(([a],[b])=>a.localeCompare(b)).map(([enemyId,ids])=>({enemyId,encounterIds:[...ids].sort()}));
}
export function legacyBestiary(campaign,content){
 return normalizeBestiary((campaign.claimedFirstClearRewards??[]).flatMap(id=>{const e=content.encounters[id];return (e?.waves??[e?.enemies??[]]).flat().map(enemyId=>({enemyId,encounterIds:[id]}));}),content);
}
export function battleDiscoveries(battle,content){
 if(!battle||battle.training||battle.arena||!content.encounters[battle.encounterId])return [];
 return normalizeBestiary([...(battle.actors??[])].filter(a=>a.team==='enemy'&&a.actorKind!=='character'&&content.enemies[a.definitionId]).map(a=>({enemyId:a.definitionId,encounterIds:[battle.encounterId]})),content);
}
export function mergeBestiary(value,discoveries,content){return normalizeBestiary([...(Array.isArray(value)?value:[]),...discoveries],content);}
export function recordBattleDiscovery(campaign,battle,content){
 const bestiary=mergeBestiary(campaign.bestiary,battleDiscoveries(battle,content),content);
 return JSON.stringify(bestiary)===JSON.stringify(campaign.bestiary??[])?campaign:{...campaign,bestiary};
}
export function bestiaryLevelLimit(content,encounter){return content.progressionRules.default.enemyHpCurves[enemyHpProfile(encounter)].at(-1).untilLevel;}
export function inspectBestiary(campaign,content,enemyId,encounterId,level){
 const record=normalizeBestiary(campaign.bestiary,content).find(r=>r.enemyId===enemyId);
 if(!record?.encounterIds.includes(encounterId))throw Error('Chưa ghi nhận kẻ thù trong trận này.');
 const enemy=content.enemies[enemyId],encounter=content.encounters[encounterId],maxLevel=bestiaryLevelLimit(content,encounter);
 if(!Number.isInteger(level)||level<1||level>maxLevel)throw Error('Cấp tra cứu không hợp lệ.');
 return {...structuredClone(enemy),stats:levelScaledEnemyStats(enemy,level,content,1,encounter),level,maxLevel,hpProfile:enemyHpProfile(encounter)};
}
