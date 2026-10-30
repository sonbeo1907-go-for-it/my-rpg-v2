import { resolveCharacter } from './progression.js';
import { gearOwner } from './equipment.js';
export const STAT_LABELS = { maxHp: 'HP', maxMp: 'MP', attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD' };
export const GEAR_NAMES = { t1: 'Trang bị cấp thấp', t2: 'Trang bị cấp trung', t3_dual: 'Trang bị cấp cao đa dụng', t3_focused: 'Trang bị cấp cao chuyên biệt' };
const text = value => String(value).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
const compare = (a, b) => typeof a === 'string' ? a.localeCompare(b, 'vi', { numeric: true }) : a - b;
export function characterCatalog(content, campaign, filters = {}, ownedOnly = false) {
  const { q = '', element = '', role = '', ownership = '', sort = 'name', direction = 'asc' } = filters;
  return Object.values(content.characters).filter(actor => {
    if (actor.developerOnly && !campaign.storyFlags.includes('developer.'+actor.id)) return false;
    const owned = campaign.unlockedCharacterIds.includes(actor.id);
    return (!ownedOnly || owned) && (!ownership || owned === (ownership === 'owned')) && (!element || actor.element === element)
      && (!role || actor.roleGroup === role || actor.secondaryRoleGroups?.includes(role))
      && text(`${actor.name} ${actor.title} ${actor.role} ${actor.affiliation ?? ''}`).includes(text(q));
  }).map(actor => resolveCharacter(content, campaign, actor.id)).sort((a, b) => {
    const result = compare(sort === 'name' ? a.name : a.stats[sort] ?? 0, sort === 'name' ? b.name : b.stats[sort] ?? 0);
    return result * (direction === 'desc' ? -1 : 1) || a.id.localeCompare(b.id);
  });
}
export function gearCatalog(content, campaign, filters = {}) {
  const { tier = '', stat = '', status = '', sort = 'received', direction = 'desc' } = filters;
  const tiers = { t1: 1, t2: 2, t3_dual: 3, t3_focused: 3 };
  const received = new Map(campaign.gear.map((gear, index) => [gear.id, index]));
  return campaign.gear.filter(gear => (!tier || gear.typeId === tier) && (!stat || Object.hasOwn(gear.stats, stat))
    && (!status || Boolean(gearOwner(campaign, gear.id)) === (status === 'equipped'))).slice().sort((a, b) => {
      const value = gear => sort === 'tier' ? tiers[gear.typeId] : sort === 'received' ? received.get(gear.id) : gear.stats[sort] ?? 0;
      return (value(a) - value(b)) * (direction === 'asc' ? 1 : -1) || a.id.localeCompare(b.id, 'en', { numeric: true });
    });
}
