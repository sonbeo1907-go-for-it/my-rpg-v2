// Rarity colors describe equipment quality; selection and the red E badge are separate states.
export const EQUIPMENT_RARITIES = {
  low: { label: 'Cấp thấp', mark: 'I' },
  mid: { label: 'Cấp trung', mark: 'II' },
  high: { label: 'Cấp cao', mark: 'III' },
  super: {label:'Siêu cấp',mark:'IV'},
  exclusive: { label: 'Trấn Phái', mark: '✦' },
};
export function gearRarity(typeId) {
  if(['t4_stats','t4_effect'].includes(typeId))return 'super';
  if (typeId === 'exclusive') return 'exclusive';
  if (typeId === 't3_focused' || typeId === 't3_dual') return 'high';
  return typeId === 't2' ? 'mid' : 'low';
}
