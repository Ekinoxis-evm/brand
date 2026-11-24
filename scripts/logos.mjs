// Generates every logo in logos/ from one geometry (the live BrandLogo.tsx on ekinoxis.xyz)
// and the colours in tokens.json. Text is converted to outlines, so the SVGs need no font.
// PNGs are rendered with headless Chrome (macOS). Usage: npm run logos
import { readFileSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import opentype from 'opentype.js';

const root = resolve(import.meta.dirname, '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));
const c = (name) => {
  let v = tokens.color[name].$value;
  while (v.startsWith('{')) v = tokens.color[v.slice(7, -1)].$value;
  return v;
};
// Static TTFs: the web woff2 files are variable fonts, and opentype.js only reads their default weight.
const font = (file) => {
  const b = readFileSync(join(root, 'fonts', 'static', file));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const light = font('SpaceGrotesk-Light.ttf');
const bold = font('SpaceGrotesk-Bold.ttf');

// Geometry, in units where the mark is 200 tall (as in BrandLogo.tsx).
const S = 200;
const GAP = 0.375 * S;          // gap-3 at a 32px mark
const F = 0.64 * S;             // wordmark font size
const TRACK = -0.04 * F;        // letter-spacing -0.04em
const PAD = 0.22 * F;           // padding around EKINOXIS
const CLEAR = 0.25 * S;         // margin around every lockup
const r = 95, ring = 1.6, axis = 1.2; // axis = half the 2.4 gap

const TONES = {
  'cyan-on-black':    { bg: c('void'), ring: c('hairline'), disc: c('equinox-cyan'), type: c('first-light'), bracket: c('equinox-cyan') },
  'cyan-transparent': { ring: c('hairline'), disc: c('equinox-cyan'), type: c('first-light'), bracket: c('equinox-cyan') },
  'cyan-on-light':    { ring: c('logo-ring'), disc: c('equinox-cyan-on-light'), type: c('void'), bracket: c('equinox-cyan-on-light') },
  white:              { ring: c('logo-ring'), disc: c('first-light'), type: c('first-light'), bracket: c('first-light') },
  black:              { ring: c('logo-ring'), disc: c('void'), type: c('void'), bracket: c('void') },
};

// The mark: ring + right half-disc, with the vertical axis cut out as a real gap
// (so it works on any background, unlike the component's background-coloured line).
function mark(x, y, t) {
  const dy = Math.sqrt(r * r - axis * axis);
  const cx = x + 100, cy = y + 100;
  const R = `${cx + axis} ${cy - dy}`, Rb = `${cx + axis} ${cy + dy}`;
  const L = `${cx - axis} ${cy + dy}`, Lt = `${cx - axis} ${cy - dy}`;
  return [
    `<path d="M ${R} A ${r} ${r} 0 0 1 ${Rb} Z" fill="${t.disc}"/>`,
    `<path d="M ${R} A ${r} ${r} 0 0 1 ${Rb} M ${L} A ${r} ${r} 0 0 1 ${Lt}" fill="none" stroke="${t.ring}" stroke-width="${ring}"/>`,
  ].join('');
}

// Lays out "[ EKINOXIS ]" as outlined paths. Returns { svg, w, h } with its top-left at (x, y).
function wordmark(x, y, t) {
  const runs = [[light, '[', t.bracket, PAD], [bold, 'EKINOXIS', t.type, PAD], [light, ']', t.bracket, 0]];
  // line-height 1, as in the component: the text box is F tall, centred by half-leading.
  const k = F / bold.unitsPerEm;
  const baseline = y + (F - (bold.ascender - bold.descender) * k) / 2 + bold.ascender * k;
  let pen = x, out = '';
  runs.forEach(([f, text, fill, after], i) => {
    const glyphs = f.stringToGlyphs(text);
    glyphs.forEach((g, j) => {
      const d = g.getPath(pen, baseline, F).toPathData(2);
      if (d) out += `<path d="${d}" fill="${fill}"/>`;
      pen += g.advanceWidth * (F / f.unitsPerEm);
      if (!(i === runs.length - 1 && j === glyphs.length - 1)) pen += TRACK;
    });
    pen += after;
  });
  return { svg: out, w: pen - x, h: F };
}

function compose(family, t) {
  const wm = wordmark(0, 0, t);
  let w, h, body;
  if (family === 'mark') { w = S; h = S; body = mark(CLEAR, CLEAR, t); }
  else if (family === 'wordmark') { w = wm.w; h = F; body = wordmark(CLEAR, CLEAR, t).svg; }
  else if (family === 'horizontal') {
    w = S + GAP + wm.w; h = S;
    body = mark(CLEAR, CLEAR, t) + wordmark(CLEAR + S + GAP, CLEAR + (S - F) / 2, t).svg;
  } else {
    w = Math.max(S, wm.w); h = S + GAP + F;
    body = mark(CLEAR + (w - S) / 2, CLEAR, t) + wordmark(CLEAR + (w - wm.w) / 2, CLEAR + S + GAP, t).svg;
  }
  const W = Math.ceil(w + 2 * CLEAR), H = Math.ceil(h + 2 * CLEAR);
  const bg = t.bg ? `<rect width="${W}" height="${H}" fill="${t.bg}"/>` : '';
  return { W, H, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ekinoxis">${bg}${body}</svg>\n` };
}

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCALE = 2.56; // the mark renders 512px tall in every PNG
const tmp = mkdtempSync(join(tmpdir(), 'ekx-logos-'));
for (const family of ['mark', 'horizontal', 'stacked', 'wordmark']) {
  rmSync(join(root, 'logos', family), { recursive: true, force: true });
  for (const kind of ['svg', 'png']) mkdirSync(join(root, 'logos', family, kind), { recursive: true });
  for (const [tone, t] of Object.entries(TONES)) {
    const { W, H, svg } = compose(family, t);
    const name = `ekinoxis-${family}-${tone}`;
    writeFileSync(join(root, 'logos', family, 'svg', `${name}.svg`), svg);
    const pw = Math.round(W * SCALE), ph = Math.round(H * SCALE);
    const html = join(tmp, `${name}.html`);
    writeFileSync(html, `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${pw}px;height:${ph}px}</style>${svg}`);
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
      `--window-size=${pw},${ph}`, `--screenshot=${join(root, 'logos', family, 'png', `${name}.png`)}`, `file://${html}`], { stdio: 'ignore' });
    console.log(`${family}/${name} ${pw}x${ph}`);
  }
}
