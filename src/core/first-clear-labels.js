const currencies={coins:'Coin',prisma:'Prisma',recruitmentShards:'Pure Prisma',originalPrisma:'Original Prisma',prismaFragments:'Vụn Prisma'};
export const FIRST_CLEAR_CURRENCIES=Object.keys(currencies);
export function firstClearRewardLabel(content,r){
 if(r.type==='currency')return new Intl.NumberFormat('vi-VN').format(r.amount)+' '+currencies[r.currency];
 if(r.type==='exclusive_recipe')return 'Công thức '+content.exclusiveGear[r.templateId].name;
 if(r.type==='gear_recipe')return 'Công thức '+content.gearEffects[r.recipeId].name;
 if(r.type==='gear_slot')return 'Mở thêm 1 ô trang bị '+content.characters[r.characterId].name+' (tối đa 6 ô)';
 if(r.type==='upgrade'){const u=content.upgrades[r.upgradeId];return 'Mở '+(u.changes.some(c=>c.type==='set_passive')?'nội tại ':'nâng cấp ')+u.name;}
 if(r.type==='exclusive')return content.exclusiveGear[r.templateId].name;
 return (r.type==='duplicate'?'Bản trùng ':'')+content.characters[r.characterId].name;
}
