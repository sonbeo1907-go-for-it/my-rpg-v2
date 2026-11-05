// Keep the entry route in the URL so reloads and character/equipment detours preserve it.
export function partyReturnPath(value,fallback='/home'){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u001f]/.test(value))return fallback;
 const path=value.split(/[?#]/,1)[0];
 return /^\/(?:home|quests|arena(?:\/(?:match|practice))?|dungeon(?:\/[a-z0-9_-]+)?|stories(?:\/[a-z0-9_-]+)?|chronicles(?:\/book[12])?|characters)$/.test(path)?value:fallback;
}
export function partyLinkHref(origin){const back=partyReturnPath(origin);return '/party?back='+encodeURIComponent(back);}
