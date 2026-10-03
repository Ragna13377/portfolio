# Interactive CRT Portfolio

Ivan Dmitrievich · Frontend Developer. A desktop portfolio inside supplied CRT, console and six-button controller artwork, with one fixed **LANTERN TRAIL** cartridge.

The exterior uses warm taupe, tobacco and charcoal around the dark hardware. A compact identity and one controls legend leave the CRT as the focal point. The original star-adventure scenery, tiny lantern traveller and triangular menu cursor share a warm late-16-bit direction. Projects use a compact vertical stage list; Toolkit uses flexible category navigation; Contact uses structured channels. Existing portfolio content, shared reducer and EN/RU localization remain intact.

## Development

Use Node and pnpm versions pinned in package.json.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm preview
```

Development: http://localhost:5173/portfolio/. Production preview: http://localhost:4173/portfolio/.

## Lifecycle and input

App owns hardware power; Rom owns navigation and its independent boot sequence. Hardware stays mounted through screen changes and power cycles. Power shuts down with a 550 ms CRT collapse and wakes with a horizontal line. Reset produces a 180 ms flicker, returns hardware directly to `on`, and lets the ROM finish its 1200 ms boot independently. Reset never enters hardware `booting` or `shuttingDown`.

Arrow keys / W/S navigate, Enter/Space selects, Escape/Backspace returns, and O opens Options. Controller A/X selects, B/Y returns, Start/Z opens Options, and C remains reserved. Left/Right permits bounded decorative mascot movement. Transparent native button hitboxes retain accessible labels, focus and tactile mouse/keyboard feedback. Hardware images cannot be selected or dragged. CRT text remains selectable. Reduced motion disables visual animation while preserving lifecycle behavior.

One cartridge stays inserted with no eject, swap or empty-slot path. No alternate desktop readable mode exists. Unsupported widths below 1000, heights below 600, or portrait/square viewports show a minimal desktop-experience message. Runtime failures show a minimal reload message. No-JavaScript contact links remain in index.html.

## Assets

Supplied original hardware and reference PNGs remain under public/assets. Vite deploys only public/runtime: optimized hardware WebP, one Lantern Trail world and local Tiny5 WOFF2 subsets with their license. Obsolete second-world and spare-cartridge production assets have been removed. The internal `starfall` ID is retained solely to avoid unrelated churn.

The original world was generated with the built-in imagegen tool. Source: `public/assets/rom/lantern-trail.png`; runtime: `public/runtime/assets/rom/lantern-trail.webp`. Generation prompt: `scripts/lantern-trail-art-prompt.txt`. The supplied hardware raster artwork was not changed in this pass. The cable and small controller plug use SVG, with the continuation beginning at the rotated controller image's actual tail endpoint and terminating at the front port.

## Verification

TypeScript, Biome, 86 Vitest tests across seven files and the production build pass. Browser acceptance checks keyboard/mouse/controller navigation, all four projects and five toolkit categories, EN/RU, fixed cartridge, absent obsolete UX, all eleven hitboxes, unselectable controller artwork, Reset without power effects, Power with line effects, scanlines, reduced motion, minimal fallback, viewport overflow and navigation with failed artwork requests.

Visual inspection at 1600 × 900 includes English/Russian menus and content screens, plus temporary browser-only hitbox outlines. Evidence is saved under ignored `output/playwright/`.

`scripts/playwright-critical-flows.txt` is a CLI function expression. Open the preview in a dedicated Playwright CLI session, inspect its snapshot, then run:

```sh
playwright-cli -s=portfolio-polish run-code --filename=scripts/playwright-critical-flows.txt
```

The existing GitHub Pages workflow verifies pushes and publishes verified main through an explicit publish dispatch. The history is consolidated to a complete implementation baseline followed by this focused visual correction; the baseline retains the full prior repository tree.
