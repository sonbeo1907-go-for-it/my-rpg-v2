export const ARENA_PACING=Object.freeze({search:2400,found:1000,think:2000,announce:1000});
export const arenaLoadDuration=seed=>5000+(seed%3001);
export function arenaSkillName(content,actor,command){return command.abilityId==='$defend'?'Phòng thủ':command.abilityId==='$attack'?(actor.basicDamageType==='magical'?'Phép cơ bản':'Đánh thường'):content.abilities[command.abilityId]?.name??'Kỹ năng';}
export function arenaActionSummary(actor,skillName,events){
 const hits=events.filter(e=>e.type==='damage'&&e.sourceId===actor.id),damage=hits.reduce((n,e)=>n+e.amount,0);
 return `${actor.name} đã dùng ${skillName}${hits.length?` · ${damage} sát thương`:''}.`;
}
