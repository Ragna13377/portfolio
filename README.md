# Interactive CRT Portfolio

Ivan Dmitrievich · Frontend Developer. A desktop portfolio inside a CRT and six-button console, with two swappable ROM worlds and shared content/navigation.

## Completed implementation

Tickets 11–26 are implemented. Local checks, GitHub CI, Pages deployment and live production browser acceptance pass.

The supplied CRT/console, controller and cartridge PNGs are preserved in public/assets/hardware. The Cartridge Worlds reference is preserved in public/assets/references. Hardware presentation uses these supplied images. The combined CRT image contained an inserted cartridge, so an image edit produced an empty-slot layer for physical eject/insert; the original is retained. No replacement SVG hardware is used.

STARFALL ARCHIVE uses jade islands, amber observatories and blue celestial scenery. NIGHTSHIFT SIGNAL uses plum harbor scenery, teal water and peach typography. Original raster ROM backgrounds were generated for these worlds. Every screen retains the same reducer, portfolio data, localization and actions; projects appear as expedition destinations in the first world and station channels in the second.

The visual shell uses a forest/olive desk setting, dark hardware, warm typography, curved cable and local Tiny5 pixel font. It does not copy the reference's white layout or information cards. The menu mascot has bounded decorative Left/Right movement, without platform physics.

## Development and checks

Use the Node versions and pnpm version pinned in package.json.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm preview
```

Development: http://localhost:5173/portfolio/.
Production preview: http://localhost:4173/portfolio/.
On Windows, installed binaries can also be run directly with node:

```sh
node node_modules/typescript/bin/tsc --noEmit
node node_modules/@biomejs/biome/bin/biome check .
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
```

## Architecture and lifecycle

App owns physical power and inserted/active cartridge state. Rom owns shared navigation and input orchestration. Hardware stays mounted through screen changes and power/reset cycles.

Eject and insert work only when fully off. Eject the current cartridge, choose the other physical cartridge, then explicitly press POWER. An empty slot cannot boot; transitions lock swapping. Boot takes 1200 ms, shutdown 550 ms. RESET returns to Main after the same boot interval, preserving cartridge and locale. Repeated transition actions are ignored.

Only the powered ROM background is requested. Concurrent/repeat visits share cached loading and retain decoded images. Failure or timeout permits navigation and later retry. All runtime URLs respect Vite's /portfolio/ base.

## Controls and accessibility

- Up/Down or W/S select with wrapping; Enter/Space confirm.
- Escape/Backspace return through the screen hierarchy.
- O or START opens Options.
- Controller A/X confirms, B/Y returns, Z opens Options; C remains reserved.
- Left/Right moves the decorative menu marker within bounds.
- Physical controller buttons, POWER, RESET, cartridges and menu entries support mouse clicks and native keyboard focus.

The CRT is inert while off or transitioning. Shortcuts leave unrelated controls and editable fields alone. Reduced motion removes visual transitions while keeping lifecycle guards.

Readable view exposes the same content with standard controls and restores ROM focus on return. Small or portrait screens automatically use readable view. An error boundary and no-JavaScript contact links provide additional fallbacks. Desktop uses a uniformly scaled 1600 × 900 artboard at width >= 1000, height >= 600, landscape, without page scrolling.

## Content and localization

projects.ts, toolkit.ts, contact.ts and menu.ts remain authoritative. The four existing project IDs and real stack are retained; no unsupported VPS case study was invented. Identity excludes surname, age, location and named employers, clients or universities.

English is the primary resource/fallback; Russian is available in Options and readable view. Both retain common, about, projects, toolkit, contact, options and worlds namespaces. Stored preference overrides browser detection; switching remains usable if storage is denied.

## Runtime assets

Vite publicDir is public/runtime. Only optimized WebP images and local WOFF2 fonts are copied into production. Source PNGs, reference images, the original font and earlier placeholder SVGs remain outside the deployment. Hardware images total about 274 KB; world backgrounds are about 222 KB and 161 KB. Tiny5's Latin/Cyrillic subsets total about 16 KB; its OFL license accompanies the runtime files.

## Acceptance and deployment

89 Vitest tests across eight files pass, together with TypeScript, Biome and production build checks. Playwright acceptance covers both ROMs, eight project details, ten toolkit categories, keyboard/mouse, power/reset, empty slot, swap locks, explicit boot, locales, readable/mobile fallback, reduced motion, active-only assets, cache reuse and asset failure recovery. Final English/Russian screen inspection found no viewport overflow. First local production menu appeared in about 1.42 seconds including the deliberate boot.

scripts/playwright-critical-flows.txt is a CLI function expression. Its text extension avoids formatter-added semicolons incompatible with the CLI wrapper. After opening a dedicated browser and inspecting its snapshot:

```sh
playwright-cli -s=portfolio-v1 run-code --filename=scripts/playwright-critical-flows.txt
```

The GitHub workflow verifies main pushes and PRs. Manual workflow dispatch with publish enabled deploys the verified main build to https://ragna13377.github.io/portfolio/. scripts/github-pages.mjs can inspect/configure/dispatch this repository using the existing Git credential helper in memory; it never prints or persists credentials.

Deployment run 37084498296 succeeded for implementation commit 49d5c50. The full critical flow also passed on the live Pages URL without runtime errors; first menu appeared in about 1.54 seconds. Standards review found no findings; specification review found only the then-pending publication, resolved by this deployment. No known acceptance blockers remain.
