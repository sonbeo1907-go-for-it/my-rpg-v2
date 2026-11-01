export function blueprintRecipeUnlocked(campaign,template){return !template.requires?.blueprint||campaign.unlockedExclusiveRecipes?.includes(template.id)||campaign.exclusiveGear?.some(item=>item.templateId===template.id);}
export function buyExclusiveRecipe(campaign,content,id,options={}){
 const template=content.exclusiveGear[id],cost=content.economy.default.blueprintRecipeCost;
 if(options.battleActive)throw Error('Hãy kết thúc trận hoặc chuyến hầm ngục trước khi mở công thức.');
 if(!template?.enabled||!template.requires?.blueprint)throw Error('Công thức này không bán bằng Bản Thiết Kế.');
 if(blueprintRecipeUnlocked(campaign,template))throw Error('Công thức đã được mở.');
 if(!Number.isSafeInteger(campaign.blueprints)||campaign.blueprints<cost)throw Error('Không đủ Bản Thiết Kế.');
 const next=structuredClone(campaign);next.blueprints-=cost;(next.unlockedExclusiveRecipes??=[]).push(id);return next;
}
export function normalizeBlueprintState(input,content){
 const blueprints=input.blueprints===undefined?0:input.blueprints,ids=input.unlockedExclusiveRecipes===undefined?[]:input.unlockedExclusiveRecipes;
 if(!Number.isSafeInteger(blueprints)||blueprints<0||!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!content.exclusiveGear[id]?.requires?.blueprint))throw Error('Bản Thiết Kế hoặc công thức đã mở không hợp lệ.');
 return {blueprints,unlockedExclusiveRecipes:[...ids]};
}
