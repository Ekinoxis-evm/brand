# Ekinoxis brand

The single source for the Ekinoxis brand: colors, type, corners, logos, fonts and imagery.
Every other copy (Figma, the claude.ai design system, each repo's `DESIGN.md`, `marketing/design-system`) is downstream of this repo. If a copy disagrees with this repo, the copy is wrong.

**Idea.** Ekinoxis comes from the equinox, the moment light and dark are equal. The brand is a near-black ground with one line of Equinox Cyan light running through it.

## Install

```bash
npm i github:Ekinoxis-evm/brand          # latest
npm i github:Ekinoxis-evm/brand#v0.1.2   # pinned (recommended)
```

```js
// Tailwind 3: tailwind.config.js
module.exports = { presets: [require('@ekinoxis/brand/tailwind')], /* … */ };
```

```css
/* Plain CSS: CSS variables (--ekx-color-obsidian…) and type classes (.ekx-type-display…) */
@import '@ekinoxis/brand/tokens.css';
@import '@ekinoxis/brand/fonts.css';
```

```js
// JS (Remotion, scripts): a flat token object
import brand from '@ekinoxis/brand';
brand['color-equinox-cyan']; // '#8ff5ff'
```

Logos, fonts and imagery are available at `@ekinoxis/brand/logos/…`, `/fonts/…` and `/imagery/…`.

## Change a token

1. Edit `tokens.json`. It uses the W3C Design Tokens format.
2. Run `npm run build`. This regenerates `dist/` and fails if a text color drops below 4.5:1.
3. Commit, tag (`v0.x.y`) and push. Update Figma variables to match.
4. Projects bump their pinned tag.

## Color

Dark only. Black is the canvas, and cyan is the one light.

| Token | Hex | Use |
|---|---|---|
| void | `#000000` | Canvas, lowest surface |
| obsidian | `#0a0a0a` | Page background |
| deep-tide | `#111111` | Cards |
| tide | `#171717` | Containers, card hover |
| raised-tide | `#1c1c1c` | Inputs |
| high-tide | `#242424` | Highest container |
| bright-tide | `#2a2a2a` | Brightest surface |
| first-light | `#ededed` | Main text (16.9:1) |
| mist | `#a3a3a3` | Secondary text (7.9:1) |
| slate-label | `#8f8f8f` | Labels. The dimmest color allowed for text (6.1:1) |
| hairline | `#3d3d3d` | 1px dividers. Never text |
| logo-ring | `#707070` | Logo ring only. Never text (4.2:1) |
| equinox-cyan | `#8ff5ff` | The one accent |
| equinox-cyan-deep | `#00deec` | Hover / pressed |
| equinox-cyan-on-light | `#00789e` | Logo on light backgrounds only |
| ink-on-cyan | `#005d63` | Text on cyan (6.1:1) |
| cosmic-blue | `#9492ff` | Secondary accent |
| signal-lime | `#beee00` | End states only: done, live, the goal |
| alert-coral | `#ff716c` | Errors, and the low step of a scale |
| signal-amber | `#ffd45c` | Warnings, and the middle step of a scale |
| chart-1…4 | `#c47524` `#0f98a6` `#7a9700` `#5585ff` | Charts |

Contrast ratios are measured on obsidian.

**Rules**
- **One light.** Each screen, slide or frame has one cyan focal point. If two things glow, one of them is wrong.
- **Full-strength text.** Never fade text with opacity. Use mist or slate-label at full strength.
- **Lime means arrival.** Signal lime marks an end state. It is never decoration.
- **Status colors are signals, not accents.** Coral, amber and lime only mean bad / good / excellent (or error / warning / done). Rating scales run coral → amber → lime, like a traffic light. Always pair the color with a word, never color alone.

## Type

Three faces, each with one job. All are OFL-licensed and bundled in `fonts/`.

| Face | Job |
|---|---|
| Space Grotesk 700 (300 for the wordmark's brackets) | Headlines, wordmark, buttons |
| Inter 400 | Body. Never 300 on black, because it blooms |
| Space Mono 400 | Labels, metadata, figures |

Scale: display `clamp(3rem, 9vw, 8rem)` / 0.9 / −0.05em · headline `clamp(1.875rem, 4vw, 3rem)` · title 1.5rem · body 1.125rem / 1.625 · label 12px mono +0.1em uppercase · label-sm 11px.
Nothing is smaller than 11px, and 11px is for badges only.

## Corners

**Square everywhere: 0px.** This covers web, reels, video covers, slides and print. `radius-full` is only for things that are circles by nature, such as avatars and status dots.

## Logo

The mark is a solid half-disc inside a thin ring, split by a vertical axis: light and dark in balance. The lockup is mark + `[ EKINOXIS ]`, with the brackets in cyan at weight 300.

| Folder | Variants |
|---|---|
| `logos/mark` | cyan-on-black, cyan-transparent, white, black |
| `logos/horizontal` | + cyan-on-light |
| `logos/stacked` | cyan-on-black, cyan-transparent, white |
| `logos/wordmark` | + cyan-on-light, black |

Tones: cyan (ring `#3d3d3d`, disc and brackets cyan, type `#ededed`) · white (ring `#707070`, everything else `#ededed`) · black (ring `#707070`, everything else black).
Keep clear space of at least the mark's half-width on every side. Don't recolor, stretch, outline or add effects.

> **Known issue (v0.1.0).** The logo masters don't agree yet. The SVGs were recolored to graphite, but the horizontal SVG has no ring and uses `<text>` (it needs Space Grotesk installed to render). The PNGs are the 16 Sep blue-era renders. The geometry that is actually live is `ekinoxisweb/src/components/ui/BrandLogo.tsx`. Until the masters are redrawn as outlined SVGs from that component, use the component on the web and the PNGs elsewhere.

## Imagery

Two jobs, never mixed:

- **Message: cyan-lit objects on near-black** (`imagery/message/`: `metodo-*`, `control-*`). Use these for blocks that carry a point. One object, half in shadow, lit cyan from one side.
- **Mood: liquid backgrounds** (`imagery/mood/`: `metal`, `fog`, `horizon`, `horizon.mp4`). Use these as atmosphere only, behind a hero or section. They never carry a message.

Every image follows the same rules: a dark half and a lit half, cyan light, and no text, logos or faces.

## Voice

**Open.** The live site speaks to the reader as *tú* in sentence case. The claude.ai design system built on 24 Nov says to avoid "you" and to set headlines in ALL CAPS. Decide which one wins, then record it here.

## Copies and their status

| Copy | Status |
|---|---|
| `company/ekinoxisweb` (DESIGN.md, tailwind, globals.css) | Graphite since a877783. To be wired to this package |
| `company/ekinoxisweb/public/brand/` (colors.md, typography.md, zip) | Stale (blue, 16 Sep). Replace with this package |
| `marketing/design-system`, `marketing/DESIGN.md` | Blue, with 12/20px corners. To be pointed at this package (amber is now a brand token) |
| `company/design-system` | Stale (blue, 25 Aug, no git). Retire |
| claude.ai design system `Cwh4Z8bwcXScrE91H4rtT3` | Built from blue sources. Rebuild from this repo |
| Figma | Variables to be synced from `tokens.json` |
