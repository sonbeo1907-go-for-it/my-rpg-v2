// Only presentation strings pass here. IDs used by the engine remain stable.
export function fortressText(content,value=''){
 let text=String(value);
 for(const [id,item]of Object.entries(content.chronicles.book2.items))text=text.replaceAll(id,item.displayName);
 for(const [from,to]of [['Guard','Phòng thủ'],['logistic','tiếp vận'],['grate','song chắn'],['combat event','sự kiện chiến đấu']])text=text.replaceAll(from,to);
 return text;
}
