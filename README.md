# Interactive CRT Portfolio

Ivan Dmitrievich · Frontend Developer. A desktop portfolio in a physical retro console scene with one fixed **COMET TRAIL** cartridge. The supplied dark room surrounds one transparent hardware composite containing the CRT, console, controller, cables and cartridge. A colorful game world runs behind its screen opening. Portfolio content and EN/RU navigation retain their existing behavior.

## Development

Use the Node and pnpm versions pinned in package.json.

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

## Source organization (FSD)

Dependencies flow downwards: app → pages → widgets → features → entities → shared. Each slice exposes a public index.ts; code within a slice uses local imports.

| Layer | Responsibility |
| --- | --- |
| src/app | Entry composition, error boundary, global styles, integration tests |
| src/pages/portfolio | The single desktop page, viewport sizing and hardware power lifecycle |
| src/widgets/hardware-scene | Composite artwork, CRT effects and calibrated physical controls |
| src/widgets/rom | ROM boot/input orchestration and its internal screen panels |
| src/features/rom-navigation | Navigation reducer, screen transitions and remembered selections |
| src/entities | Cartridge assets/metadata, project, toolkit and contact models |
| src/shared | Input/power contracts, navigation constants, i18n, desktop fallback and runtime assets |

ABOUT/PROJECTS/TOOLKIT/CONTACT/OPTIONS are panels inside the single ROM widget, not separate routed pages. Keeping them within its slice avoids imports between page slices or imports from widgets to pages. src/main.tsx is the Vite entry point. src/assets is the untouched input artwork pack; application code imports its optimized derivatives from src/shared/assets/scene.

## Lifecycle and input

PortfolioPage owns hardware power; Rom owns navigation and its independent boot sequence. Hardware stays mounted through screen changes and power cycles. Power shuts down with a 550 ms CRT collapse and wakes with a horizontal line. Reset produces a 180 ms flicker, returns hardware directly to on, and lets the ROM finish its 1200 ms boot independently. Reset never enters hardware booting or shuttingDown.

Arrow keys / W/S navigate, Enter/Space selects, Escape/Backspace returns, and O opens Options. Controller A/X selects, B/Y returns, Start/Z opens Options, and C remains reserved. Left/Right permits bounded decorative mascot movement. Transparent native button hitboxes retain accessible labels, focus and tactile mouse/keyboard feedback without shifting the supplied button caps. The external legend communicates mappings; button lettering is omitted to preserve the artwork.

One cartridge stays inserted with no eject, swap or empty-slot path. Unsupported widths below 1000, heights below 600, or portrait/square viewports show the existing minimal desktop message. Runtime failures show a minimal reload message. No-JavaScript contact links remain in index.html.

## Assets and animation

All scene artwork derives from the twelve supplied PNGs in src/assets. Vite imports and hashes only referenced runtime WebP files; its base path remains /portfolio/. Old public images, generated landscape, placeholders and separate hardware pieces have been removed after checking references and confirming Git recovery. Tiny5 font subsets, original font and OFL license are retained in src/shared/assets/fonts. The internal starfall cartridge ID remains to preserve existing state/i18n contracts.

The room uses viewport cover without tiling or stretching. Hardware uses one uniformly scaled 1448 × 1086 canvas within the responsive artboard, with a soft grounding shadow. The separately clipped cartridge poster covers its blank face; the game and CRT effects remain behind the raster screen opening.

Hero images are cropped against alpha > 128 to exclude stray transparent-edge noise, resized into a fixed 240 × 260 canvas and aligned to the same bottom anchor. CSS shows poses 1 → 2 → 3 → 4 → 3 → 2 over 2.4 seconds. The hero and island share a restrained 4 px, seven-second vertical drift. The mid-cloud layer repeats horizontally over 110 seconds at low opacity. Near and foreground clouds are deliberately unused: their large shapes obscure the landscape and menu. Their originals remain available. Reduced motion stops all movement and shows the first hero pose.

MAIN layers and all four hero frames preload during boot and remain in memory. Lossless WebP preserves hardware/pixel-art edges and alpha; the already blurred room uses quality 92 WebP. The small cartridge face and island are resized for their actual display size. Runtime artwork totals approximately 3.6 MB. Original PNGs are never modified or copied into production. To rebuild runtime artwork, run scripts/prepare-scene-assets.py with Python + Pillow.

## Verification

Run TypeScript, Biome, Vitest and production build before publishing. The existing 86 behavioral tests cover navigation, clipboard, keyboard/mouse/controller input, localization, Power/Reset, accessibility and the unsupported-device fallback.

The browser acceptance function is scripts/playwright-critical-flows.txt. It checks all four projects and five toolkit categories, EN/RU, all eleven controller hitboxes, unified hardware, scanlines, reset without power effects, shutdown/wake, reduced motion, fallback, overflow and failed artwork requests. It captures MAIN at 1920 × 1080, 1600 × 900 and 1366 × 768, plus English/Russian screens and temporary hitbox outlines, in ignored output/playwright/.

```sh
npx --yes --package @playwright/cli playwright-cli -s=portfolio open http://localhost:5173/portfolio/
npx --yes --package @playwright/cli playwright-cli -s=portfolio snapshot
npx --yes --package @playwright/cli playwright-cli -s=portfolio run-code --filename=scripts/playwright-critical-flows.txt
```

The GitHub Pages workflow verifies pushes and publishes verified main through an explicit publish dispatch.
