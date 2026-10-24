# Snacks Match – Raohe | 小吃消消樂－饒河

A bilingual browser match-3 game under the illuminated Raohe night-market gate: six snack identities, an 8×8 board, 15 levels across three chapters, and unlimited Free Play. The creative director approved the desktop/mobile visuals and the Hint/Shuffle substitution on 2026-10-24 and authorized autonomous GitHub Pages deployment. Release evidence and manual QA limits are recorded in [the release record](docs/RELEASE-v0.1.0.md).

## Develop

Node.js 24 and npm. Use the existing isolated checkout; no worktree is needed.

```sh
cd /workspace/snacks-match-raohe
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173 --strictPort
```

Outside this cloud environment, use your checkout location and omit the cache override. All artwork, sounds and engine logic are bundled locally; no backend, credentials, remote fonts or runtime network services are required.

```sh
npm run typecheck
npm test
npm run build
npm run test:browser
npm run validate:levels
# With a static server already serving dist at the chosen URL:
RAOHE_VERIFY_URL=<target-url> npm run verify:site
```

Browser tests use installed Chromium at `/usr/bin/chromium` if available. Otherwise run `npx playwright install chromium`; `CHROMIUM_PATH` overrides the executable. Tests start a production preview on port 4173. `npm run validate:levels` regenerates deterministic engine-based win/loss witnesses; this is feasibility evidence, not human difficulty certification.

## Play

Tap two neighboring snacks, swipe/drag toward a neighbor, or use arrow keys and Enter/Space. Escape clears selection. Four large direction buttons provide an alternative. Larger pieces provides 44px+ cells with bounded horizontal scrolling and pan controls.

Match three identical snacks. Four creates a line, five a prism, and an intersecting match a bomb. Specials carry visible badges and follow the unchanged Match3 Core rules. Complete every order before your moves run out; Free Play has unlimited moves and no target. Hint reveals an engine-authorized move; Shuffle rearranges existing pieces without spending a move and asks for confirmation.

English/繁體中文 switching preserves state. Settings offers audio/mute/volume, optional synthesized music, reduced motion and larger pieces. Pause, restart, instructions, level selection and separate saved Journey/Free Play sessions are available. Exact board/RNG state, progress and preferences save under an independent `snacks-raohe-*` namespace. Corrupt saves are retained until explicit recovery; blocked storage allows in-memory play with a warning.

## References and evidence

- [Architecture, exact reference commits and documented differences](docs/ARCHITECTURE.md)
- [Supplied GDD](docs/design/GDD-v1.0.md) and [pinned UGDS](docs/design/UGDS-v1.0.0.md)
- [QA evidence and remaining reviews](docs/QA.md)
- [Art provenance](docs/ASSETS.md)
- [Desktop gameplay](docs/evidence/active-1440-en.png), [phone gameplay](docs/evidence/active-390-en.png), [Traditional Chinese phone](docs/evidence/active-390-zh-TW.png)

The core is pinned byte-for-byte to Match3 Core v1.0.0 at `9863f8e023a227540a58491282e87d9f11a0cf79`. Shape Match's released functional foundation and Cute Animal Match's conventions were inspected and referenced; this edition has its own visual composition and artwork. The attached mockup informed architecture and lighting, and is not a baked-in game image.

## Release

`npm run build` produces a static `dist/` with relative asset URLs compatible with GitHub Pages subpaths. CI is configured in `.github/workflows/ci.yml`. A separate Pages workflow, started by manual dispatch or an explicit `[deploy]` commit on `main`, validates, deploys, and verifies the public assets/gameplay only when the owner runs it and Pages is configured for GitHub Actions. Source publication to `main` is separate from deploying the playable site. Local validation does not establish hosted CI success, a public deployment or live verification.
