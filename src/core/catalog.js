import {masteryEnabled} from './skill-rules.js';
import { resolveCharacter } from './progression.js';
import { gearOwner } from './equipment.js';
export const STAT_LABELS = { maxHp: 'HP', maxMp: 'MP', attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD' };
export const GEAR_NAMES = { t1: 'Trang bị cấp thấp', t2: 'Trang bị cấp trung', t3_dual: 'Trang bị cấp cao đa dụng', t3_focused: 'Trang bị cấp cao chuyên biệt', t4_stats:'Gear Siêu Cấp Chỉ Số', t4_effect:'Gear Siêu Cấp Hiệu Ứng' };
// Giá trị affiliation lưu slug tiếng Anh trong JSON; mọi nhãn người chơi thấy đều ở đây.
// Thêm phe mới: thêm slug vào characters.json + nhãn tiếng Việt vào bảng này (test/affiliations.test.js chặn thiếu nhãn).
export const AFFILIATION_LABELS = {
  witch_garden: 'Khu Vườn Phù Thủy',
  lampkeepers: 'Người Giữ Đèn',
  keijo_mountains: 'Núi Keijo',
  youkai_hunters: 'Hội Thợ Săn Yêu Quái',
  youkai_hunters_guntai: 'Hội Thợ Săn Yêu Quái / Quân đội Keijo',
  keijo_shrine: 'Đền Keijo',
  capital_knights: 'Kị sĩ đoàn Thủ đô',
  hunters_guild: 'Hội Thợ Săn',
  drageshelmfjall_merchants: 'Hội Thương Nhân Drageshelmfjall',
  hunters_guild_magic_academy: 'Hội Thợ Săn / Học viện Ma pháp',
  magic_academy: 'Học viện Ma pháp',
  house_valmont: 'Gia tộc Valmont',
  house_marquis: 'Gia tộc Marquis',
  house_ranoc: 'Gia tộc Ranoc',
  vertosse_clan: 'Gia tộc Vertosse',
  northern_village: 'Làng Phía Bắc',
  black_rose_mafia: 'Băng đảng Mafia Hoa Hồng Đen',
  mikaielis_order: 'Giáo đoàn Mikaielis',
  mage_circle: 'Giới pháp sư',
  time_travelers: 'Lữ khách thời không',
  destiny_heralds: 'Sứ giả Định Mệnh',
  wanderer: 'Lãng khách',
  northern_forest: 'Khu rừng phương Bắc',
  expedition_corps: 'Kị sĩ Sư đoàn Viễn Chinh',
  rhett_research_facility: 'Viện Nghiên Cứu Tự Xưng của Rhett',
};
export const affiliationLabel = value => (value ? (AFFILIATION_LABELS[value] ?? value) : '');
const text = value => String(value).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
const compare = (a, b) => typeof a === 'string' ? a.localeCompare(b, 'vi', { numeric: true }) : a - b;
export function characterCatalog(content, campaign, filters = {}, ownedOnly = false) {
  const { q = '', element = '', role = '', ownership = '', sort = 'name', direction = 'asc', exclusive = '', mastery = '' } = filters;
  // "all" giữ được trong URL khi người chơi chủ động bỏ lọc mặc định "đã sở hữu".
  const ownershipFilter = ownership === 'all' ? '' : ownership;
  const releasedExclusives=new Set(Object.values(content.exclusiveGear??{}).filter(template=>template.enabled===true).map(template=>template.characterId));
  const availabilityMatches=(filter,released)=>filter==='released'?released:filter==='unreleased'?!released:true;
  return Object.values(content.characters).filter(actor => {
    if (actor.developerOnly && !campaign.storyFlags.includes('developer.'+actor.id)) return false;
    const owned = campaign.unlockedCharacterIds.includes(actor.id);
    return (!ownedOnly || owned) && (!ownershipFilter || owned === (ownershipFilter === 'owned')) && (!element || element==='agony' || actor.element === element || ['moon','moonlight'].includes(element)&&(Boolean(actor.moonlightRevelation)||Boolean(actor.moonlightBlessings?.length)||Boolean(content.moonlightBlessings?.[actor.passive?.blessingId])||actor.passive?.type==='moonlight_hymn') || element==='sword_soul' && actor.tags?.includes('sword_soul'))
      && availabilityMatches(exclusive,releasedExclusives.has(actor.id))
      && availabilityMatches(mastery,masteryEnabled(content,actor.id))
      && (!role || actor.roleGroup === role || actor.secondaryRoleGroups?.includes(role))
      && text(`${actor.name} ${actor.title} ${actor.role} ${actor.affiliation ?? ''} ${affiliationLabel(actor.affiliation)}`).includes(text(q));
  }).map(actor => resolveCharacter(content, campaign, actor.id)).sort((a, b) => {
    const value=actor=>sort==='name'?actor.name:sort==='level'?actor.level:sort==='releaseId'?actor.releaseId:actor.stats[sort]??0;
    const result = compare(value(a),value(b));
    return result * (direction === 'desc' ? -1 : 1) || a.id.localeCompare(b.id);
  });
}
export function gearCatalog(content, campaign, filters = {}) {
  const { tier = '', stat = '', status = '', sort = 'received', direction = 'desc' } = filters;
  const tiers = { t1: 1, t2: 2, t3_dual: 3, t3_focused: 3, t4_stats:4, t4_effect:4 };
  const received = new Map(campaign.gear.map((gear, index) => [gear.id, index]));
  return campaign.gear.filter(gear => (!tier || gear.typeId === tier) && (!stat || Object.hasOwn(gear.stats, stat))
    && (!status || Boolean(gearOwner(campaign, gear.id)) === (status === 'equipped'))).slice().sort((a, b) => {
      const value = gear => sort === 'tier' ? tiers[gear.typeId] : sort === 'received' ? received.get(gear.id) : gear.stats[sort] ?? 0;
      return (value(a) - value(b)) * (direction === 'asc' ? 1 : -1) || a.id.localeCompare(b.id, 'en', { numeric: true });
    });
}
