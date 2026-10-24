# Local QA — Raohe 0.1.0 implementation candidate

Date: 2026-10-24 (Asia/Taipei). Prepared in `/workspace/snacks-match-raohe` on Node 24.19.0 / npm 11.9.0 using system Chromium. The repository began with an unborn `work` branch and no files or remote refs. All new project files remain in the working tree; there is no release commit. `evidence/artifact-manifest.json` identifies the exact source inputs and built assets by SHA-256 instead of inventing a commit.

## Executed results

| Check | Actual outcome |
| --- | --- |
| Read supplied GDD and visually inspect attached concept | Performed before implementation; references/provenance in `ARCHITECTURE.md` |
| Exact Match3 Core tag/commit and tarball checksum | Pass; tag peels to `9863f8e023a227540a58491282e87d9f11a0cf79`, tarball matches `vendor/SHA256SUMS` |
| Core checkout `npm ci` then `npm test` | **112 passed**, 0 failed, 0 skipped; includes 1,200 deterministic simulated actions (1,155 committed / 45 recoverable failures) |
| `bash scripts/cloud-install.sh` | Pass; frozen reinstall and TypeScript/Vite production build, exercised after initial setup |
| App `npm test` | **55 passed**, 0 failed, 0 skipped; identity, all special pairs, projection/rollback, 600 stress turns, restore, progression, all levels, replay checkpoint, typed core failures |
| `npm run validate:levels` | **15/15 win and 15/15 loss witnesses**; engine-driven greedy/beam search, replayed by tests |
| `npm run build` | Pass; TypeScript + Vite; final app JS about 75 kB before gzip, about 28 kB gzipped; production art about 1 MB total |
| Final full `npm run test:browser` | **25 passed**, 0 failed, 0 skipped, about 56 seconds; runner JSON in `evidence/browser-results.json` |
| `npm run verify:site` | Pass against local static server under `/snacks-match-raohe/`; every dist file hash compared; three real turns each at desktop/touch-phone, exact saves/DOM, reload and language switch; `evidence/site-verification.json` |
| Development startup | Pass; dev server started on 5173, local HTTP response plus real browser turn/save/reconciliation checked |
| Cloud reusable configuration | `install_script` and `start_skill` saved successfully; publication and new-task restoration not performed |
| Hosted CI / public deployment / public gameplay | **Not run**; workflows provided, including manual publication and live verification |

The final 25-test run is distinct from earlier 23-test runs and a focused two-test run; the final total is not the sum of repeated tests. An early standalone axe diagnostic used an unsupported Playwright page construction and was corrected by using proper browser contexts; subsequent actual axe audits passed. Initial screenshots exposed mobile overflow, decoration covering the HUD and Chinese-sign text sizing. These were fixed and final screenshots/audits were regenerated.

## Browser coverage

Rendered widths: **320, 390, 768, 1440 CSS px**, English and Traditional Chinese. Phone layouts use 900px height in layout tests and **390×844** with touch emulation. Desktop layout checks use 1100px height; a separate 320px larger-piece mode tests 44px+ cells and bounded panning. No horizontal page overflow was observed in these final checks. HUD hit-testing verifies that moves are not covered by decoration.

Automated flows cover all 15 sequential campaign wins, chapter unlocks, completion/reload/replay, win/loss/retry/next in both languages, exact engine/DOM/save reconciliation, free/journey slot restoration, destructive-action confirmation, corrupt active/inactive/progress recovery, blocked storage, preferences/audio settings, keyboard selection and swaps, touch taps and actual CDP touch swipe, repeated touch/mouse/keyboard navigation, hint legality, free reshuffle identity preservation, ordinary/reduced motion, and larger-board panning.

Axe WCAG 2 A/AA and WCAG 2.1 AA audits returned no violations in gameplay for both languages at all four widths, and in settings/tutorial/level dialogs at 320 and 1440. Automated audits do not certify screen-reader usability or WCAG conformance in all states.

## Visual evidence and comparison

The actual rendered desktop and phone composition was visually inspected against the attached concept's intent: illuminated gate architecture surrounds the playable board, warm signs are live text, navy cells provide contrast, and the street/scenery extends across the viewport. The grid is a real 8×8 board with six deterministic snack identities. No attached concept pixels are used as the full gameplay background.

- `evidence/active-1440-en.png`, `evidence/active-1440-zh-TW.png`: desktop active gameplay.
- `evidence/active-390-en.png`, `evidence/active-390-zh-TW.png`: phone active gameplay and readable order/move HUD.
- `evidence/active-320-*.png`, `evidence/active-768-*.png`: additional responsive evidence.
- `evidence/mobile-touch-zh-TW.png`: touch gameplay after a real swipe and live language switch.
- `evidence/win-en.png`, `evidence/win-zh-TW.png`, `evidence/campaign-completed-journey.png`: meaningful completion transitions.
- `evidence/large-board-320.png`: enlarged accessible board and panning.
- `evidence/snack-readability-{grayscale,protanopia,deuteranopia,tritanopia}.png`: grayscale and approximate color-vision simulations. The six silhouettes/textures remain distinguishable on visual inspection; no independent participant recognition test was performed. These matrices are approximate, not clinical color-vision validation.

`poc-*`, `layout-mobile.png` and `static-subpath-390.png` are historical diagnostic captures, superseded by the final `active-*`, `site-verified-*` and `large-board-*` images. Do not treat the earlier overflow/overlap captures as the current layout.

Mobile compact mode deliberately clips the upper roof/wings inside the gate so the nearly full-width board and HUD remain primary. Larger-piece accessibility mode retains more architecture and uses a taller scrolling page. Desktop retains the complete detailed gate. This is a candidate art direction, not a claim of pixel-accurate mockup reproduction or final creative approval.

## UGDS / acceptance status

| Requirements | Status and evidence |
| --- | --- |
| P01–P05 loop, input, responsive mechanics, recovery | Pass locally under described browser coverage; physical touch accuracy outstanding |
| L01–L02 centralized bilingual/live switching | Pass automated flows; independent linguistic review Not Verified |
| A01–A02 labels, focus, alternatives, motion/sound | Pass automated checks; manual screen-reader and subjective audio review Not Verified |
| V01 concept remains reference | Pass; original separate production layers, editable signage |
| V02–V06 production art / visual review | Screenshots and implementation comparison performed; **human visual-direction and final production acceptance Not Verified** |
| S01–S02 local storage / runtime independence | Pass browser recovery/blocked-storage tests; all runtime assets local |
| S03 ordinary-phone performance | Local Chromium responsive through tested turns; sustained midrange physical-device performance **Not Verified** |
| S04 age-appropriate scope | No accounts, payments, ads, analytics or unverified vendor ranking claims |
| Q01–Q04 rules, browser, balance, accessibility | Local automated checks pass; search witnesses show feasibility, not fun or human difficulty certification |
| Q05–Q06 release integrity / evidence | Local build and static subpath verified; **hosted CI, deployment and live gameplay Not Verified**; exact artifact/source hashes recorded |
| C01–C03 ownership and change control | Pinned UGDS unchanged; documented candidate differences; human creative acceptance pending |

## Outstanding human/release work

Review the actual desktop/phone art and gameplay before calling the visual gate accepted or expanding the production art further. In particular, approve or revise the substitution of engine-backed Hint/Shuffle for the concept's unsupported hammer/rainbow consumable inventory. Neither reference app nor core v1.0.0 defines a consumable-removal contract; none was invented or falsely displayed.

Physical iOS/Android devices, manual Safari/Firefox/WebKit, screen readers, sustained mobile performance/battery/thermal behavior, subjective audio, independent first-time-player usability, language and balance review remain unverified. These limitations prevent a claim of final release acceptance, even though the local development environment and automated workflows work.

At the time of local validation, no push, commit, hosted CI or deployment had been performed. The user subsequently authorized committing and pushing this candidate to `main`; source publication does not establish a deployment or human creative acceptance. The manual Pages workflow is available for a separately authorized release, and verifies asset hashes and actual gameplay after deployment. Cloud environment draft persistence is also distinct from publication: review/save its installation/startup changes in environment settings, then publish that environment to activate a reusable snapshot. Neither environment publication nor fresh-task restoration has been verified here.
