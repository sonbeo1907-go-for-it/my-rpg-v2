import { mkdir, writeFile } from 'node:fs/promises';

// Original procedural vector scenery. Keep the seed fixed for reproducible builds.
const out = new URL('../public/art/', import.meta.url);
await mkdir(out, { recursive: true });
let seed = 48291;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const mix = (a, b) => a + random() * (b - a);
const f = n => Number(n.toFixed(2));
const rect = (x, y, width, height, fill, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, width = 1, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const wrap = (name, defs, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-labelledby="title"><title id="title">${name}</title><defs>${defs}</defs>${content}</svg>`;
const sharedDefs = `
  <filter id="shadow" x="-40%" y="-60%" width="180%" height="230%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#080a0d" flood-opacity=".65"/></filter>
  <filter id="glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".055 .29" numOctaves="3" seed="11"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".12"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
  <linearGradient id="iron" x2=".7" y2="1"><stop stop-color="#887c65"/><stop offset=".34" stop-color="#393c39"/><stop offset=".65" stop-color="#1f2527"/><stop offset="1" stop-color="#93836a"/></linearGradient>
  <radialGradient id="candle"><stop stop-color="#fff9bb" stop-opacity=".85"/><stop offset=".17" stop-color="#ffc76a" stop-opacity=".55"/><stop offset="1" stop-color="#f99b43" stop-opacity="0"/></radialGradient>
`;

function bottle(x, y, scale = 1, color = '#4d6653') {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M-7 0V-30L-3-37V-48H4V-37L9-30V0Z', color, 'stroke="#b9ab78" stroke-opacity=".24"')}${rect(-5, -23, 12, 12, '#b8a16a', 'opacity=".5"')}${line(-4, -33, -4, -3, '#e9dbb5', 2, 'opacity=".24"')}${rect(-4, -51, 9, 5, '#b08d59')}</g>`;
}
function cup(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M-17-35H16L13 0H-13Z', 'url(#iron)', 'stroke="#b3a28b" stroke-width="2"')}${path('M15-29C37-36 36-3 14-8', 'none', 'stroke="#96856a" stroke-width="5"')}${ellipse(0, -35, 17, 5, '#261e17', 'stroke="#a69576" stroke-width="2"')}</g>`;
}
function candle(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(0, -35, 95, 90, 'url(#candle)')}${ellipse(0, 0, 24, 7, '#4c3823', 'stroke="#a58350" stroke-width="2"')}${rect(-9, -48, 18, 46, '#e8cea0', 'rx="3"')}${path('M-9-43L-5-35 -3-43 1-30 4-45 9-43', 'none', 'stroke="#fff0b9" stroke-width="3"')}${path('M0-73C-16-52-4-48 0-49 11-53 8-61 0-73', '#ffda73')}${path('M0-65C-6-56-3-52 0-52 4-55 4-60 0-65', '#fff9db')}</g>`;
}
function barrel(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" filter="url(#shadow)">${path('M-68-166C-89-129-91-44-68 0Q0 20 68 0C91-44 89-129 68-166Z', 'url(#barrel)', 'stroke="#30251c" stroke-width="5"')}${[-48, -24, 0, 24, 48].map(n => path(`M${n}-166Q${n * 1.32}-80 ${n} 5`, 'none', 'stroke="#392a1f" stroke-width="3"')).join('')}${[-143, -33].map(n => path(`M-78 ${n}Q0 ${n + 20} 78 ${n}`, 'none', 'stroke="#49443c" stroke-width="15"')).join('')}${ellipse(0, -166, 68, 20, '#8d6741', 'stroke="#403325" stroke-width="6"')}${ellipse(0, -166, 54, 13, '#735232', 'stroke="#b68d54" stroke-opacity=".35"')}</g>`;
}
function stool(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" filter="url(#shadow)">${ellipse(0, 76, 62, 13, '#100f0e', 'opacity=".35"')}${line(-31, -3, -49, 77, '#352d23', 12)}${line(32, -3, 48, 77, '#352d23', 12)}${line(-17, 0, -26, 65, '#6d4e30', 10)}${line(-44, 43, 44, 43, '#7b6245', 6)}${ellipse(0, -6, 58, 20, '#392a1e', 'stroke="#a77a44" stroke-width="3"')}${ellipse(0, -13, 56, 18, 'url(#table)', 'stroke="#ba8d4c" stroke-width="2"')}${line(-35, -20, 30, -3, '#4f3521', 2)}</g>`;
}
function table(x, y, scale = 1, laden = false) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" filter="url(#shadow)">${ellipse(0, 185, 160, 25, '#120f0b', 'opacity=".45"')}${path('M-22 0L-28 156 -91 184 -85 197 0 172 85 197 91 184 28 156 22 0Z', '#3e2b1c', 'stroke="#7b5633" stroke-width="5"')}${ellipse(0, 6, 210, 77, '#4a2d19', 'stroke="#342619" stroke-width="8"')}${ellipse(0, -6, 210, 77, 'url(#table)', 'stroke="#a27c49" stroke-width="4"')}${[-130, -65, 0, 65, 130].map(n => path(`M${n - 25} ${-60 + Math.abs(n) * .15}L${n + 25} ${48 - Math.abs(n) * .1}`, 'none', 'stroke="#5b3924" stroke-width="2" opacity=".7"')).join('')}${cup(-97, -24, 1)}${candle(65, -35, 1.05)}${laden ? `${ellipse(-5, -8, 70, 19, '#b6a179', 'stroke="#e3cd9c" stroke-width="3"')}${path('M-65-13Q-45-53 10-35Q61-23 64-6Q-8 9-65-13', '#ba733c', 'stroke="#d69c59" stroke-width="3"')}${[-35, -5, 25].map(n => path(`M${n}-29L${n + 15}-10`, 'none', 'stroke="#e8c386" stroke-width="5"')).join('')}${bottle(-13, -51, 1.5, '#71814d')}${[105, 126, 145].map((n, i) => ellipse(n, -8 - i * 8, 11, 9, '#b34526', 'stroke="#d28237" stroke-width="2"')).join('')}${cup(145, -46, .8)}` : bottle(12, -24, 1.4, '#615840')}</g>`;
}

function tavern() {
  const defs = sharedDefs + `
    <linearGradient id="wall"><stop stop-color="#2e3432"/><stop offset=".52" stop-color="#62523c"/><stop offset="1" stop-color="#7d6040"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2=".25" y2="1"><stop stop-color="#3a2c22"/><stop offset=".5" stop-color="#8d6039"/><stop offset="1" stop-color="#463323"/></linearGradient>
    <linearGradient id="barrel"><stop stop-color="#493323"/><stop offset=".34" stop-color="#8b653c"/><stop offset=".66" stop-color="#78502d"/><stop offset="1" stop-color="#37291e"/></linearGradient>
    <radialGradient id="table" cx=".6" cy=".2" r=".9"><stop stop-color="#bf8b4d"/><stop offset=".42" stop-color="#8f5e33"/><stop offset="1" stop-color="#4e3220"/></radialGradient>
    <linearGradient id="window" x2=".1" y2="1"><stop stop-color="#f5f8dd"/><stop offset=".5" stop-color="#d8e3da"/><stop offset="1" stop-color="#e3c894"/></linearGradient>
    <linearGradient id="ray" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fff3c5" stop-opacity=".4"/><stop offset="1" stop-color="#ffd888" stop-opacity="0"/></linearGradient>
    <radialGradient id="ambience" cx=".64" cy=".34" r=".8"><stop stop-color="#e5b86f" stop-opacity=".12"/><stop offset=".6" stop-color="#171c21" stop-opacity="0"/><stop offset="1" stop-color="#090f17" stop-opacity=".66"/></radialGradient>
    <radialGradient id="hearth"><stop stop-color="#ffd38a" stop-opacity=".6"/><stop offset=".3" stop-color="#e39343" stop-opacity=".2"/><stop offset="1" stop-color="#be7028" stop-opacity="0"/></radialGradient>
  `;
  let s = rect(0, 0, 1920, 1080, '#202827');
  s += path('M0 0H1920V650L1040 575 0 650Z', 'url(#wall)');
  // Stone wall left, fitted around the open balcony door.
  for (let row = 0; row < 8; row++) for (let col = 0; col < 5; col++) {
    const x = col * 154 - (row % 2) * 77;
    s += rect(x, row * 73 + 70, 148, 67, ['#39413c', '#343d39', '#41453c', '#3b423d'][Math.floor(random() * 4)], 'rx="7" stroke="#232c2a" stroke-width="2"');
  }
  // Right wall panels, structural beams and a carved notice board.
  for (let x = 1265; x < 1920; x += 73) s += path(`M${x} 105L${x + 67} 84V692L${x} 682Z`, ['#765234', '#694b32', '#5e4631'][Math.floor(random() * 3)], 'stroke="#3b3023" stroke-width="3"');
  s += path('M1240 0L1291 0 1320 680 1259 667Z', '#332b21', 'stroke="#89704a" stroke-width="5"');
  s += path('M0 45L1920 0V59L0 118Z', '#282b25', 'stroke="#847249" stroke-width="4"');
  s += path('M0 0H1640L1403 105 0 171Z', '#292b25');
  s += line(0, 175, 1290, 65, '#a18456', 4, 'opacity=".35"');
  s += path('M1705 145Q1772 59 1836 139L1857 594 1731 597Z', '#332c23', 'stroke="#a58251" stroke-width="9"');
  s += path('M1718 156Q1770 82 1824 151L1842 582 1740 584Z', '#665137', 'stroke="#3c3125" stroke-width="7"');
  for (let y = 210; y < 540; y += 92) s += line(1730, y, 1830, y - 4, '#9c7b4c', 3);
  s += rect(1584, 226, 105, 158, '#3e2e20', 'rx="7" stroke="#a58558" stroke-width="7" transform="rotate(-5 1637 305)"');
  for (const [x, y, r] of [[1596, 247, 2], [1643, 276, -7], [1613, 304, 8]]) {
    s += rect(x, y, 45, 54, '#c8b183', `transform="rotate(${r} ${x} ${y})"`);
    for (let j = 0; j < 4; j++) s += line(x + 7, y + 13 + j * 7, x + 36 - j * 3, y + 13 + j * 7, '#87734c', 1.2);
  }
  // Flooring vanishes toward the back of the room.
  s += path('M0 614L1030 563 1920 670V1080H0Z', 'url(#floor)');
  for (let i = -12; i < 18; i++) {
    const xb = i * 150;
    const xv = 1010 + (xb - 1010) * .11;
    const shade = ['#9b6c3f', '#6c482d', '#a77747', '#7b5232'][((i % 4) + 4) % 4];
    s += path(`M${xv} 577L${xv + 17} 577 ${xb + 150} 1080 ${xb} 1080Z`, shade, `opacity="${f(mix(.13, .35))}" stroke="#2e251d" stroke-width="3"`);
    for (let j = 1; j < 5; j++) {
      const t = j / 5, y = 577 + t * t * 503;
      const xl = xv + (xb - xv) * t * t;
      s += line(f(xl), f(y), f(xl + 17 + 133 * t * t), f(y), '#36281b', 2);
    }
  }
  for (let i = 0; i < 65; i++) {
    const y = mix(610, 1080), x = mix(30, 1900), width = mix(12, 58);
    s += path(`M${f(x)} ${f(y)}q${f(width / 2)}-5 ${f(width)}-1`, 'none', 'stroke="#d7aa68" stroke-opacity=".13" stroke-width="1.3"');
  }
  // Door, shutters, balcony and morning sun.
  s += rect(405, 102, 326, 437, '#262c2b', 'stroke="#80765d" stroke-width="15"');
  s += rect(429, 123, 280, 367, 'url(#window)');
  s += path('M429 320Q458 275 487 324Q519 254 554 313Q608 266 647 318Q678 285 709 304V420H429Z', '#a5b5a4', 'opacity=".4"');
  s += rect(428, 425, 282, 61, '#e1c8a1');
  for (let x = 432; x < 710; x += 32) s += line(x, 361, x, 433, '#8b7562', 7);
  s += line(425, 364, 711, 364, '#9b8264', 10);
  s += line(425, 406, 711, 406, '#9b8264', 5);
  s += path('M411 105L332 133 340 547 411 523Z', '#35413d', 'stroke="#7a8066" stroke-width="5"');
  s += path('M734 103L792 133 790 556 732 524Z', '#35433e', 'stroke="#77866c" stroke-width="5"');
  s += path('M428 491H711L734 518H411Z', '#c6b18b', 'stroke="#716752" stroke-width="4"');
  s += path('M411 520H734L757 548H389Z', '#a58c67', 'stroke="#5e5544" stroke-width="4"');
  s += path('M388 551H757L781 578H366Z', '#8c7455', 'stroke="#534839" stroke-width="4"');
  s += path('M438 343L700 334 1765 1080H919Z', 'url(#ray)');
  s += path('M451 448L530 442 1228 1080H968Z', '#ffe4a7', 'opacity=".05"');
  // Bottle shelves and wooden counter.
  s += rect(811, 83, 432, 406, '#322e23', 'stroke="#765637" stroke-width="12"');
  for (let x = 822; x < 1243; x += 53) s += line(x, 87, x, 474, '#675035', 3);
  for (const y of [165, 256, 350, 449]) {
    for (let x = 834; x < 1222; x += 25) s += bottle(x, y - 5, mix(.8, 1.24), ['#6d6440', '#6a7c57', '#916b49', '#4e6255'][Math.floor(random() * 4)]);
    s += rect(811, y, 432, 13, '#7c5734', 'stroke="#ae8550" stroke-width="2"');
  }
  // Hanging mugs and pan above the counter.
  s += line(822, 65, 1247, 65, '#91754b', 6);
  for (let x = 856; x < 1225; x += 80) {
    s += path(`M${x} 66v31q24 0 24 19q-8 34-32 27q-20-8-10-28q4-12 18-18`, '#625447', 'stroke="#b29c78" stroke-width="3"');
  }
  s += path('M787 480L1274 476 1328 531 753 540Z', '#9d6d3c', 'stroke="#c3975f" stroke-width="5" filter="url(#shadow)"');
  s += path('M754 540L1328 532 1328 668 781 651Z', '#553b26', 'stroke="#997143" stroke-width="5"');
  for (let x = 790; x < 1320; x += 40) s += line(x, 545, x, 655, '#34291d', 4);
  s += path('M780 653L1327 669V689L780 675Z', '#30291f');
  s += line(809, 629, 1290, 643, '#a17b49', 7);
  for (const [x, y] of [[852, 495], [986, 490], [1210, 488]]) s += cup(x, y, .65);
  s += bottle(1108, 487, .85, '#5b714c');
  // A stack of casks and small work table at the right.
  s += barrel(1394, 344, 1.0) + barrel(1386, 566, 1.03);
  s += path('M1323 546L1541 551 1571 580 1300 578Z', '#88613c', 'stroke="#ba8b51" stroke-width="4"');
  s += line(1327, 578, 1339, 735, '#3d3022', 16) + line(1527, 581, 1515, 735, '#3d3022', 16);
  s += barrel(1540, 758, .78);
  s += candle(1460, 546, .68);
  // Wall-mounted shield and a pair of crossed blades.
  s += `<g transform="translate(1510 139) rotate(7)">${line(-68, -58, 60, 81, '#a6a18c', 9)}${line(69, -58, -59, 81, '#a6a18c', 9)}${line(-70, -34, -44, -58, '#c4a468', 8)}${line(48, -57, 72, -31, '#c4a468', 8)}${ellipse(0, 12, 57, 69, '#62492d', 'stroke="#ab8c53" stroke-width="7"')}${ellipse(0, 12, 38, 48, '#755634', 'stroke="#3d3327" stroke-width="3"')}${ellipse(0, 12, 13, 15, '#a98c56')}</g>`;
  // Light fixtures and the chandelier: leave silhouette detail against the door.
  for (const [x, y] of [[1266, 225], [1669, 144]]) {
    s += ellipse(x, y, 140, 150, 'url(#candle)');
    s += path(`M${x - 17} ${y - 29}L${x + 17} ${y - 29} ${x + 12} ${y + 23} ${x - 12} ${y + 23}Z`, '#8c7048', 'stroke="#282c28" stroke-width="6"');
    s += rect(x - 9, y - 24, 18, 42, '#ffc975', 'opacity=".8"');
  }
  s += `<g filter="url(#shadow)">${path('M495-15L390 176M496-15L603 176M496-15L497 205', 'none', 'stroke="#282e2c" stroke-width="10"')}${path('M274 171Q492 243 718 167L704 192Q492 269 285 196Z', 'url(#iron)', 'stroke="#ab9670" stroke-width="3"')}${ellipse(498, 181, 219, 53, 'none', 'stroke="#343a32" stroke-width="10"')}${[299, 384, 491, 606, 695].map((x, i) => { const y = [174, 207, 222, 207, 171][i]; return path(`M${x} ${y}V${y - 76}`, 'none', 'stroke="#393e33" stroke-width="7"') + rect(x - 7, y - 112, 14, 37, '#b1aa83', 'rx="4"') + path(`M${x} ${y - 126}q-7 11 0 13q8-2 0-13`, '#e6d8a3'); }).join('')}</g>`;
  // Room furniture, from background to foreground.
  s += stool(915, 690, .66) + stool(1179, 702, .63);
  s += stool(361, 718, .69) + table(469, 646, .72) + stool(551, 813, .8);
  s += stool(1000, 836, .9) + stool(1438, 795, .93);
  s += table(1170, 773, 1.04, true);
  s += stool(924, 1054, 1.26) + stool(1393, 1016, 1.22);
  s += stool(252, 916, 1.0) + stool(650, 971, 1.0);
  s += table(418, 1111, 1.4);
  s += ellipse(1145, 799, 480, 310, 'url(#hearth)', 'opacity=".25"');
  // Dust motes in sun, and a unified painted grain.
  for (let i = 0; i < 46; i++) s += ellipse(f(mix(500, 1560)), f(mix(80, 920)), f(mix(.7, 2.1)), f(mix(.8, 2.4)), '#ffe1a1', `opacity="${f(mix(.13, .55))}"`);
  s += rect(0, 0, 1920, 1080, 'transparent', 'filter="url(#grain)" opacity=".45"');
  s += rect(0, 0, 1920, 1080, 'url(#ambience)');
  return wrap('Quán trọ phương Bắc, ánh nắng xuyên qua cửa và những bàn gỗ', defs, s);
}

function summon() {
  const defs = sharedDefs + `
    <radialGradient id="night"><stop stop-color="#322762"/><stop offset=".44" stop-color="#181c42"/><stop offset="1" stop-color="#080f22"/></radialGradient>
    <radialGradient id="portal"><stop stop-color="#d0f1ee" stop-opacity=".42"/><stop offset=".32" stop-color="#977ce0" stop-opacity=".24"/><stop offset="1" stop-color="#9787d7" stop-opacity="0"/></radialGradient>
    <linearGradient id="prism" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9de2dc"/><stop offset=".46" stop-color="#d9c89b"/><stop offset="1" stop-color="#9d78d0"/></linearGradient>
    <linearGradient id="spire"><stop stop-color="#363052"/><stop offset="1" stop-color="#0d1626"/></linearGradient>
  `;
  let s = rect(0, 0, 1920, 1080, 'url(#night)');
  s += ellipse(846, 515, 720, 650, 'url(#portal)');
  for (let i = 0; i < 130; i++) {
    const x = mix(20, 1900), y = mix(20, 1050), r = mix(.7, 2.7);
    s += ellipse(f(x), f(y), f(r), f(r), '#d8d5ee', `opacity="${f(mix(.2, .8))}"`);
    if (i % 13 === 0) s += path(`M${f(x - 7)} ${f(y)}h14M${f(x)} ${f(y - 7)}v14`, 'none', 'stroke="#b2cbe1" stroke-opacity=".5"');
  }
  s += `<g transform="translate(821 497)">`;
  for (const r of [278, 302, 360, 377]) s += ellipse(0, 0, r, r, 'none', `stroke="url(#prism)" stroke-width="${r === 302 ? 3 : 1.3}" opacity="${r === 360 ? .7 : .4}"`);
  s += ellipse(0, 0, 325, 325, 'none', 'stroke="#b9a3eb" stroke-width="31" opacity=".1" filter="url(#glow)"');
  for (let i = 0; i < 36; i++) {
    const angle = i * 10, a = angle * Math.PI / 180;
    const r = 339;
    s += `<g transform="translate(${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}) rotate(${angle + 90})">${path('M-5-9L0-14 5-9V9L0 14-5 9Z', 'none', 'stroke="#d6c69e" stroke-width="1.5" opacity=".65"')}${line(-9, 0, 9, 0, '#a9bed7', 1, 'opacity=".5"')}</g>`;
  }
  for (let i = 0; i < 8; i++) s += `<g transform="rotate(${i * 45})">${path('M0-406L13-378 0-348-13-378Z', 'url(#prism)', 'opacity=".7"')}${line(0, -347, 0, -277, '#b9d8d8', 1.5, 'opacity=".6"')}</g>`;
  s += path('M0-212L110-42 64 109 0 211-64 109-110-42Z', 'url(#prism)', 'fill-opacity=".13" stroke="#c3e9e2" stroke-width="2"');
  s += path('M0-212L-40-40 0 211 40-40Z', '#c0dff2', 'fill-opacity=".19" stroke="#b0d6ef" stroke-opacity=".35"');
  s += path('M-110-42H110M-64 109L40-40M64 109L-40-40', 'none', 'stroke="#e7d6ec" stroke-opacity=".45"');
  s += ellipse(0, 0, 137, 228, 'url(#portal)', 'opacity=".9"');
  s += '</g>';
  // Ancient architecture frames the encounter, with no borrowed character art.
  for (const [x, flip] of [[160, 1], [1490, -1]]) {
    s += `<g transform="translate(${x} 0) scale(${flip} 1)">${path('M0 999L37 246 92 200 147 245 172 999Z', 'url(#spire)', 'stroke="#7e6d75" stroke-opacity=".5" stroke-width="3"')}${path('M29 1000L55 272 90 244 124 272 145 1000', 'none', 'stroke="#a18b68" stroke-opacity=".35" stroke-width="3"')}${path('M-34 282L93 156 216 280 196 309-14 309Z', '#28263c', 'stroke="#a18b68" stroke-opacity=".5" stroke-width="3"')}${rect(-4, 949, 179, 34, '#2b2a3b', 'stroke="#a18b68" stroke-opacity=".3"')}</g>`;
  }
  s += path('M0 1079L455 864 1238 864 1920 1079Z', '#10182b', 'stroke="#847691" stroke-opacity=".4" stroke-width="2"');
  for (let i = 0; i < 6; i++) s += path(`M${i * 385 - 225} 1080L${600 + i * 79} 864`, 'none', 'stroke="#b5a3a7" stroke-opacity=".15"');
  for (let y = 895; y < 1080; y += (y - 820) * .28) s += line(0, f(y), 1920, f(y), '#b6a3aa', 1, 'opacity=".12"');
  return wrap('Ngưỡng cửa Prisma — vòng triệu hồi cổ xưa giữa các vì sao', defs, s);
}

function quest() {
  const defs = sharedDefs + `
    <linearGradient id="map" x2=".8" y2="1"><stop stop-color="#c8b687"/><stop offset=".5" stop-color="#9d8b60"/><stop offset="1" stop-color="#6c6449"/></linearGradient>
    <radialGradient id="edge" cx=".37" cy=".4" r=".9"><stop stop-color="#10292a" stop-opacity="0"/><stop offset=".65" stop-color="#0b2226" stop-opacity=".3"/><stop offset="1" stop-color="#08171f" stop-opacity=".95"/></radialGradient>
    <linearGradient id="mountain" x2=".4" y2="1"><stop stop-color="#465c55"/><stop offset="1" stop-color="#1c3437"/></linearGradient>
    <linearGradient id="sword" x2="1" y2=".1"><stop stop-color="#77918d"/><stop offset=".46" stop-color="#e0e5d0"/><stop offset=".51" stop-color="#819c96"/><stop offset="1" stop-color="#b9c8b6"/></linearGradient>
  `;
  let s = rect(0, 0, 1920, 1080, '#173034');
  s += path('M-96 177L1385 78 1498 1005-21 1128Z', 'url(#map)', 'filter="url(#shadow)"');
  s += path('M52 218L1346 131 1440 968 30 1064Z', 'none', 'stroke="#504f37" stroke-width="3"');
  s += path('M100 240L1328 156 1413 951 60 1037Z', 'none', 'stroke="#e3cfa0" stroke-opacity=".4" stroke-width="2"');
  // Map coastline, river, mountains and forests are all seeded path geometry.
  s += path('M-15 771Q132 705 163 591T355 505Q419 424 501 418T661 321Q721 271 786 332L865 304Q922 379 1030 362L1102 410Q1060 472 1129 525L1050 640Q1120 721 1034 774L950 804Q943 884 826 869L753 931Q652 888 604 955L504 910 395 952Q330 870 246 918L198 851 119 878Z', '#b4b486', 'stroke="#4b6253" stroke-width="4" opacity=".85"');
  s += path('M816 391Q728 459 775 534T709 650Q595 694 651 781T553 918', 'none', 'stroke="#577d72" stroke-width="14" opacity=".65"');
  s += path('M816 391Q728 459 775 534T709 650Q595 694 651 781T553 918', 'none', 'stroke="#c1d5b9" stroke-width="3" opacity=".5"');
  for (let i = 0; i < 32; i++) {
    const x = mix(300, 1080), y = mix(312, 820), size = mix(25, 70);
    s += path(`M${f(x - size)} ${f(y)}L${f(x)} ${f(y - size * 1.3)} ${f(x + size)} ${f(y)}Z`, 'url(#mountain)', 'opacity=".52"');
    s += path(`M${f(x)} ${f(y - size * 1.3)}L${f(x + size * .18)} ${f(y - size * .74)} ${f(x + size * .4)} ${f(y - size * .62)} ${f(x + size)} ${f(y)} ${f(x - size * .14)} ${f(y - size * .46)}Z`, '#c3ceb1', 'opacity=".4"');
  }
  for (let i = 0; i < 62; i++) {
    const x = mix(200, 1080), y = mix(490, 902), r = mix(5, 14);
    s += path(`M${f(x - r)} ${f(y)}L${f(x)} ${f(y - r * 2.8)} ${f(x + r)} ${f(y)}ZM${f(x)} ${f(y)}v${f(r * .5)}`, '#385b47', 'opacity=".58" stroke="#345442" stroke-width="1.5"');
  }
  s += path('M326 822Q457 758 515 655T714 552Q823 514 897 443', 'none', 'stroke="#7b4b38" stroke-width="5" stroke-dasharray="8 12" opacity=".8"');
  for (const [x, y] of [[326, 822], [515, 655], [714, 552], [897, 443]]) {
    s += ellipse(x, y, 12, 12, '#d5c394', 'stroke="#78533b" stroke-width="4"');
    s += ellipse(x, y, 4, 4, '#644430');
  }
  // Compass rose in the lower corner.
  s += `<g transform="translate(1118 812) rotate(-5)">${ellipse(0, 0, 91, 91, 'none', 'stroke="#6d6446" stroke-width="2"')}${ellipse(0, 0, 70, 70, 'none', 'stroke="#6d6446" stroke-width="1"')}${Array.from({ length: 8 }, (_, i) => `<g transform="rotate(${i * 45})">${path('M0-110L15-18 0 0-15-18Z', i % 2 ? '#7b7554' : '#454f42', 'stroke="#b4ab7b" stroke-width="1"')}${path('M0-110V0L-15-18Z', '#c5bc8f', 'opacity=".6"')}</g>`).join('')}${ellipse(0, 0, 12, 12, '#c6b886', 'stroke="#515d48" stroke-width="3"')}</g>`;
  // Foreground guardian blade and stone, original ornamental heraldry.
  s += `<g transform="translate(342 526) rotate(-19)" filter="url(#shadow)">${path('M-22 384L-27-178 0-248 27-178 22 384Z', 'url(#sword)', 'stroke="#536963" stroke-width="4"')}${path('M0-248V387', 'none', 'stroke="#eff0d9" stroke-width="3" opacity=".65"')}${path('M-127-194Q-74-231-23-211L0-223 23-211Q74-231 127-194L121-173Q58-198 24-185H-24Q-61-198-121-173Z', '#ad9962', 'stroke="#e0ca87" stroke-width="4"')}${rect(-14, -340, 28, 121, '#47372e', 'rx="7" stroke="#ad9962" stroke-width="3"')}${[-315, -293, -271, -249].map(y => line(-13, y, 13, y - 11, '#9c8657', 5)).join('')}${path('M0-387L29-359 20-335H-20L-29-359Z', '#8cbdaf', 'stroke="#d2c18c" stroke-width="5"')}</g>`;
  s += path('M64 1000L125 829 239 793 347 824 464 780 572 875 616 1080H0Z', '#203e3d', 'stroke="#59726a" stroke-width="4"');
  s += path('M125 829L239 793 252 886 180 981 64 1000Z', '#40594d', 'opacity=".7"');
  s += path('M347 824L464 780 572 875 428 912Z', '#5c6950', 'opacity=".65"');
  s += rect(0, 0, 1920, 1080, 'transparent', 'filter="url(#grain)" opacity=".35"');
  s += rect(0, 0, 1920, 1080, 'url(#edge)');
  return wrap('Bản đồ phương Bắc và thanh kiếm của người lữ hành', defs, s);
}

for (const [name, create] of [['tavern', tavern], ['summon', summon], ['quest', quest]]) {
  const svg = create();
  await writeFile(new URL(`${name}.svg`, out), svg, 'utf8');
  console.log(`${name}.svg: ${Buffer.byteLength(svg).toLocaleString('en-US')} bytes`);
}
