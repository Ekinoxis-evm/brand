// Builds dist/ from tokens.json. No dependencies. Usage: npm run build
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'tokens.json'), 'utf8'));
const out = resolve(root, 'dist');
mkdirSync(out, { recursive: true });

// Flatten to { 'color-void': value, ... }, resolving {a.b.c} references.
const flat = {};
const get = (path) => path.split('.').reduce((o, k) => o[k], tokens).$value;
const resolveRefs = (v) => {
  const m = typeof v === 'string' && v.match(/^\{(.+)\}$/);
  return m ? resolveRefs(get(m[1])) : v;
};
(function walk(node, path) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) {
      const val = v.$value;
      flat[[...path, k].join('-')] =
        val && typeof val === 'object' && !Array.isArray(val)
          ? Object.fromEntries(Object.entries(val).map(([a, b]) => [a, resolveRefs(b)]))
          : resolveRefs(val);
    } else if (v && typeof v === 'object') walk(v, [...path, k]);
  }
})(tokens, []);

// Contrast gate: every text colour must reach 4.5:1 on the page background.
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const bg = flat['color-obsidian'];
const failures = [];
for (const name of ['first-light', 'mist', 'slate-label', 'equinox-cyan', 'cosmic-blue', 'signal-green', 'signal-amber', 'alert-coral']) {
  const r = ratio(flat[`color-${name}`], bg);
  console.log(`contrast ${name.padEnd(14)} ${r.toFixed(2)}:1`);
  if (r < 4.5) failures.push(name);
}
const onCyan = ratio(flat['color-ink-on-cyan'], flat['color-equinox-cyan']);
console.log(`contrast ink-on-cyan    ${onCyan.toFixed(2)}:1 (on cyan)`);
if (onCyan < 4.5) failures.push('ink-on-cyan');
if (failures.length) { console.error('Below 4.5:1:', failures.join(', ')); process.exit(1); }

const fontStack = (v) => (Array.isArray(v) ? v.map((f) => (f.includes(' ') ? `'${f}'` : f)).join(', ') : v);
const scalar = Object.entries(flat).filter(([, v]) => typeof v !== 'object' || Array.isArray(v));

// CSS custom properties + one class per type style.
const css = [
  '/* Generated from tokens.json. Do not edit. */',
  ':root {',
  ...scalar.map(([k, v]) => `  --ekx-${k}: ${fontStack(v)};`),
  '}',
  ...Object.entries(flat).filter(([k]) => k.startsWith('typography-')).map(([k, t]) =>
    `.ekx-${k.replace('typography-', 'type-')} { font-family: ${fontStack(t.fontFamily)}; font-size: ${t.fontSize}; font-weight: ${t.fontWeight}; line-height: ${t.lineHeight}; letter-spacing: ${t.letterSpacing}; }`),
  '',
].join('\n');
writeFileSync(resolve(out, 'tokens.css'), css);

writeFileSync(resolve(out, 'tokens.mjs'), `// Generated from tokens.json. Do not edit.\nexport default ${JSON.stringify(flat, null, 2)};\n`);
// Types: every token name as a literal key.
const tsType = (v) => (Array.isArray(v) ? 'readonly string[]' : typeof v === 'object'
  ? `{ ${Object.entries(v).map(([k, x]) => `readonly ${k}: ${typeof x === 'number' ? 'number' : 'string'}`).join('; ')} }`
  : typeof v === 'number' ? 'number' : 'string');
writeFileSync(resolve(out, 'tokens.d.ts'), [
  '// Generated from tokens.json. Do not edit.',
  'declare const tokens: {',
  ...Object.entries(flat).map(([k, v]) => `  readonly ${JSON.stringify(k)}: ${tsType(v)};`),
  '};',
  'export type TokenName = keyof typeof tokens;',
  'export default tokens;',
  '',
].join('\n'));
writeFileSync(resolve(out, 'tailwind-preset.d.cts'), '// Generated. Do not edit.\nimport type { Config } from \'tailwindcss\';\ndeclare const preset: Partial<Config>;\nexport = preset;\n');
writeFileSync(resolve(out, 'tokens.flat.json'), JSON.stringify(flat, null, 2) + '\n');

// Tailwind preset (v3 `presets: [require('@ekinoxis/brand/tailwind')]`).
const pick = (prefix) => Object.fromEntries(scalar.filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]));
const preset = {
  theme: {
    extend: {
      colors: pick('color-'),
      fontFamily: pick('font-family-'),
      borderRadius: { ...pick('radius-'), DEFAULT: flat['radius-none'] },
      spacing: pick('space-'),
    },
  },
};
writeFileSync(resolve(out, 'tailwind-preset.cjs'), `// Generated from tokens.json. Do not edit.\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`);
console.log(`dist/ written: ${scalar.length} tokens`);
