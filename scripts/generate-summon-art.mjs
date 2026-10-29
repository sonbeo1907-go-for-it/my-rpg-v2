import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Original deterministic SVG art. The centered stage preserves the existing summon
// scenery; silhouettes are hand-built vector poses, never raster or external art.
const out = new URL('../public/art/', import.meta.url);
await mkdir(out, { recursive: true });
const original = await readFile(process.argv[2] ?? new URL('../public/art/summon.svg', import.meta.url), 'utf8');
if (!original.includes('translate(821 497)')) throw new Error('The source summon.svg layout changed; update the center transformation before regenerating.');
let centered = original
  .replace('Ngưỡng cửa Prisma — vòng triệu hồi cổ xưa giữa các vì sao', 'Ngưỡng cửa Prisma — tinh thể ở tâm nghi thức')
  .replace('translate(821 497)', 'translate(960 540)')
  .replace('cx="846" cy="515"', 'cx="960" cy="540"')
  .replace('translate(1490 0) scale(-1 1)', 'translate(1760 0) scale(-1 1)')
  .replace('M0 1079L455 864 1238 864 1920 1079Z', 'M0 1079L569 864 1351 864 1920 1079Z')
  .replace('<path d="M0-212L110-42 64 109 0 211-64 109-110-42Z" fill="url(#prism)" fill-opacity=".13" stroke="#c3e9e2" stroke-width="2"/><path d="M0-212L-40-40 0 211 40-40Z" fill="#c0dff2" fill-opacity=".19" stroke="#b0d6ef" stroke-opacity=".35"/><path d="M-110-42H110M-64 109L40-40M64 109L-40-40" fill="none" stroke="#e7d6ec" stroke-opacity=".45"/>', '<polygon points="0,-200 110,-40 0,200 -110,-40" fill="url(#prism)" fill-opacity=".2" stroke="#d4e1e9" stroke-width="2"/><polygon points="0,-200 0,-40 -110,-40" fill="#dce5eb" fill-opacity=".16"/><polygon points="0,-200 110,-40 0,200 0,-40" fill="#c0cfda" fill-opacity=".13"/><path d="M0-200V200M-110-40H110" fill="none" stroke="#d4dfe8" stroke-opacity=".45"/>')
  .replace('rx="137" ry="228" fill="url(#portal)" opacity=".9"', 'rx="137" ry="228" fill="url(#portal)" opacity=".25"')
  .replace('<linearGradient id="prism" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9de2dc"/><stop offset=".46" stop-color="#d9c89b"/><stop offset="1" stop-color="#9d78d0"/></linearGradient>', '<linearGradient id="prism" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c8d7df"/><stop offset=".46" stop-color="#edf1f4"/><stop offset="1" stop-color="#8295a5"/></linearGradient>');
// The small perspective grid also converges symmetrically below the centered gem.
centered = centered.replace(/<path d="M(-?\d+(?:\.\d+)?) 1080L(\d+(?:\.\d+)?) 864" fill="none" stroke="#b5a3a7" stroke-opacity=".15"\/>/g,
  (_, bottom, top) => `<path d="M${Number(bottom) + 115} 1080L${Number(top) + 115} 864" fill="none" stroke="#b5a3a7" stroke-opacity=".15"/>`);
await writeFile(new URL('summon-centered.svg', out), centered);

const p = (d, extra = '') => `<path d="${d}" ${extra}/>`;
const circle = (cx, cy, r, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${extra}/>`;
const seam = d => p(d, 'fill="none" stroke="#283047" stroke-width="2.5" opacity=".62"');
const edge = d => p(d, 'fill="none" stroke="#1c263c" stroke-width="3"');
const head = (x = 160, y = 155, radius = 27) => circle(x, y, radius) + p(`M${x - 28} ${y - 9}Q${x - 31} ${y - 45} ${x - 6} ${y - 42}L${x + 5} ${y - 49} ${x + 9} ${y - 39}Q${x + 34} ${y - 41} ${x + 30} ${y - 9}L${x + 18} ${y - 23} ${x + 4} ${y - 15} ${x - 9} ${y - 26}Z`);
const book = (x, y, size = 1, rotation = 0) => `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${size})">${p('M0 5Q24-7 49 7Q73-7 98 5V71Q73 57 49 73Q24 57 0 71Z')}${seam('M49 7V73M10 18Q27 12 40 20M10 28Q27 22 40 30M10 40Q27 34 40 42M59 20Q75 12 88 18M59 30Q75 22 88 28M59 42Q75 34 88 40')}</g>`;
const sword = (x, y, angle = 0, scale = 1) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${p('M-8-210 0-242 8-210 6 6H-6Z')}${p('M-31 5Q0 15 31 5L28 20 9 21 8 67-8 67-9 21-28 20Z')}${circle(0, 71, 11)}${seam('M0-222V4')}</g>`;
const smallShield = (x, y, width = 90, height = 135) => `<g transform="translate(${x} ${y}) scale(${width / 100} ${height / 150})">${p('M0 17 50 0 100 17 92 90Q80 125 50 150 20 125 8 90Z')}${edge('M12 27 50 14 88 27 82 86Q74 112 50 133 26 112 18 86Z')}${seam('M50 19V125M24 52H76')}</g>`;

function physical() {
  return sword(83, 290, -31, .82) + sword(243, 294, 30, .86)
    + p('M129 192Q95 205 73 258L46 347 78 366 120 291 127 369 103 440 74 579 88 623 114 603 150 481 183 473 209 595 234 610 249 581 214 418 198 365 206 279 247 355 280 340 250 248Q231 211 190 194Z')
    + p('M124 205 72 224 90 327 56 465 21 535 98 505 144 385 189 410 246 548 296 568 260 463 223 228 192 206Z', 'fill="#101627"')
    + p('M115 442 143 450 127 555 111 636 94 647 80 636 92 573Z')
    + p('M179 449 206 436 223 556 239 642 226 655 203 641 192 569Z')
    + p('M84 628 113 633 116 669 95 681 58 679 58 667 83 650ZM208 636 239 632 244 658 272 676 270 687 216 684 202 672Z')
    + head(160, 153, 28) + p('M138 179H183L191 216 161 236 128 214Z')
    + p('M105 234 159 217 209 234 198 365 160 388 120 366Z')
    + p('M82 295 106 307 79 367 57 363 49 347Z') + p('M235 304 258 294 282 340 271 363 250 365Z')
    + seam('M160 238V358M128 285 160 299 193 285M121 365 159 373 197 363M106 441 134 448M184 448 208 438')
    + p('M128 106 151 92 162 103 181 94 197 112 190 139 166 122 145 132 128 144Z');
}
function magical() {
  return p('M135 189Q99 184 72 222L52 359 77 419 42 552 24 636 102 651 139 641 162 661 198 642 235 656 293 631 259 541 234 416 226 258 198 194Z', 'fill="#101626"')
    + p('M124 206 101 242 108 366 81 479 61 634 148 659 177 653 250 630 216 478 200 356 209 245 185 206Z')
    + p('M108 241 87 267 66 336 42 347 38 369 66 385 95 370 126 291Z')
    + p('M201 242 223 249 246 292 267 289 279 310 267 330 241 326 211 300Z')
    + p('M129 166Q99 108 126 78L156 60 187 80Q215 117 188 171L170 188 145 184Z')
    + p('M131 137Q130 98 158 96 188 103 185 144L172 169H147Z', 'fill="#141d30"')
    + p('M143 176 176 176 188 216 158 239 129 213Z')
    + p('M236 116 249 116 255 657 245 677 234 660Z')
    + p('M247 45C195 39 201 101 230 112L236 137H256L263 110C290 98 291 50 265 44L271 67 264 93 248 101 230 88 225 66 237 49Z')
    + circle(247, 75, 15, 'fill="#141c2d"')
    + p('M245 119 225 144 246 153 268 142Z')
    + p('M123 633 146 643 146 677 113 684 94 676 108 657ZM174 643 198 637 218 675 206 685 174 678Z')
    + p('M48 282 57 261 66 282 57 301ZM25 312 31 297 37 312 31 327Z', 'fill="#121c30"')
    + seam('M157 241 147 376 125 528 135 632M177 245 184 386 208 533 214 628M107 372 154 396 201 370M79 605 108 614M219 611 244 601');
}
function offensive() {
  return p('M133 196 105 208 83 279 106 381 83 477 56 582 100 572 127 498 154 415 190 419 219 514 265 586 281 559 230 435 213 346 220 235 186 201Z', 'fill="#101728"')
    + p('M114 222 99 260 119 351 112 437 150 470 194 449 208 362 209 250 183 216Z')
    + p('M108 434 148 448 132 546 115 640 92 644 92 609ZM167 448 198 433 210 538 227 632 205 644 186 573Z')
    + p('M92 634 117 638 123 671 109 680 71 678 68 666 91 650ZM205 633 230 625 243 650 275 667 271 680 226 679 208 667Z')
    + head(161, 156, 27)
    + p('M133 179 189 179 195 212 166 241 127 216Z')
    + p('M112 231 94 230 62 259 37 265 31 289 60 309 88 294 129 260Z')
    + p('M207 243 228 256 246 325 260 337 251 361 230 357 208 306 194 270Z')
    + sword(244, 351, 174, .98)
    + book(26, 250, 1.01, -12)
    + p('M131 208 147 227 140 357 126 364 113 248ZM177 217 190 213 195 355 183 366Z', 'fill="#131c2c"')
    + seam('M129 294 180 323M119 360 149 375 198 357M118 439 145 449M172 448 196 439');
}
function defensive() {
  return p('M120 202Q93 199 79 236L60 321 88 363 91 426 73 531 45 634Q79 661 117 651L153 672 190 657 231 663 277 639 244 526 222 422 227 264 201 211Z', 'fill="#11182a"')
    + p('M131 195 104 234 109 359 103 436 86 567 78 645 135 659 164 651 207 659 244 644 218 514 198 406 205 255 187 211Z')
    + p('M124 177Q95 143 110 107L134 80 159 65 189 84 210 115Q222 158 193 186L174 201 148 194Z')
    + p('M133 131Q131 103 159 98 189 102 189 133L179 166 150 172 136 153Z', 'fill="#161e30"')
    + p('M143 179H179L191 215 159 237 128 211Z')
    + p('M107 234 90 248 64 285 42 284 31 309 50 327 83 319 127 270Z')
    + p('M200 242 222 258 245 285 271 280 284 300 274 321 243 317 212 296 191 269Z')
    + book(24, 276, 1, -9)
    + p('M258 96H271L277 650 268 675 256 655Z')
    + p('M254 35H275V67H306V89H275V127H254V89H224V67H254Z')
    + p('M240 77 265 52 291 77 265 103Z', 'fill="#141d2e"')
    + p('M117 647 144 652 145 681 111 690 92 679ZM177 654 203 647 225 679 212 689 177 683Z')
    + seam('M158 239 148 386 140 650M174 239 184 385 204 646M110 417 156 435 204 414M91 588 115 600M202 604 228 590');
}
function tank() {
  return sword(239, 258, 11, .9)
    + p('M118 195 83 207 61 247 73 334 94 359 84 443 101 530 84 617 115 642 151 571 166 469 190 468 205 570 228 636 263 628 250 531 229 430 232 342 261 303 255 235 212 203Z')
    + p('M101 211 73 224 55 267 93 287 122 261ZM202 213 241 222 267 260 231 286 197 259Z', 'fill="#111a2b"')
    + p('M109 248 164 227 215 253 208 358 169 393 116 359Z', 'fill="#0a1220"')
    + p('M124 354 165 374 207 355 226 431 186 467 138 466 101 434Z')
    + p('M113 451 144 465 140 536 122 587 115 648 84 649 81 621 102 536ZM180 468 210 451 229 529 245 614 264 648 237 663 211 635 203 574Z')
    + p('M82 635 116 636 124 672 108 691 61 690 57 673 80 653ZM236 644 264 634 280 659 306 679 301 693 257 690 238 675Z')
    + p('M126 183 119 139 129 104 165 89 196 104 208 139 201 184 181 205 147 203Z')
    + p('M136 112 164 100 192 115 195 155 182 186 151 186 135 153Z', 'fill="#101b2a"')
    + p('M117 124 163 137 209 124 207 146 163 154 120 146Z')
    + p('M154 97 147 61 164 24 189 37 200 69 185 82 169 56 166 100Z', 'fill="#0c1422"')
    + p('M225 285 244 287 258 337 242 363 221 352 212 315Z')
    + smallShield(16, 263, 150, 257)
    + seam('M125 270 164 287 202 269M165 289V350M118 357 165 377 209 356M111 531 137 538M207 538 233 531');
}
function fighter() {
  return p('M135 208 109 218 75 272 62 375 43 434 7 500 63 493 109 435 147 387 198 374 224 286 191 217Z', 'fill="#12182a"')
    + p('M119 230 103 280 118 370 101 425 130 471 186 458 211 394 203 328 211 267 181 225Z')
    + p('M120 440 147 467 131 542 97 605 77 669 47 667 57 629 94 529ZM175 452 202 429 222 496 238 559 267 646 240 666 221 628 203 576 176 533Z')
    + p('M48 656 78 657 81 682 68 696 28 694 26 681 47 673ZM240 651 267 641 281 666 308 683 304 698 262 692 241 676Z')
    + head(163, 163, 28)
    + p('M136 186 185 186 199 224 162 245 129 224Z')
    + p('M111 245 87 255 62 316 55 359 75 371 100 343 131 280Z')
    + sword(65, 339, 16, .91)
    + p('M201 252 224 256 252 289 252 325 230 343 207 321 187 282Z')
    + smallShield(206, 274, 104, 164)
    + p('M104 240 121 226 149 253 136 283 108 273ZM176 244 192 226 213 248 207 278 185 280Z', 'fill="#111b2a"')
    + seam('M151 255 159 349 193 369M119 365 160 380 199 365M113 425 141 441M179 434 199 424M93 531 118 543M206 532 226 523');
}

const silhouettes = {
  physical_dps: ['Kiếm sĩ song kiếm — bóng hình người tiên phong', physical],
  magical_dps: ['Pháp sư áo choàng — bóng hình người giữ tinh tú', magical],
  offensive_support: ['Sách và kiếm — bóng hình người dẫn trận', offensive],
  defensive_support: ['Sách và thánh ấn — bóng hình người chữa lành', defensive],
  tank: ['Thủ hộ giáp nặng — bóng hình tấm khiên bất khuất', tank],
  fighter: ['Đấu sĩ kiếm khiên — bóng hình người phá trận', fighter],
};
for (const [id, [title, render]] of Object.entries(silhouettes)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="720" viewBox="0 0 320 720" role="img" aria-labelledby="title"><title id="title">${title}</title><g fill="#050c15" stroke="#0f1728" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${render()}</g></svg>`;
  await writeFile(new URL(`silhouette-${id}.svg`, out), svg);
}
console.log('Generated centered summon stage and six original role silhouettes.');
