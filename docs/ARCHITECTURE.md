# Raohe implementation and provenance

The supplied `Snacks_Match_Raohe_GDD_v1.0_RECREATED.md` and `Raohe_Visual_Concept.png` were read and visually inspected before implementation. The GDD is retained unchanged under `design/GDD-v1.0.md`. Its workflow and approval wording is reference material, not evidence of a human approval or authorization to publish.

## Exact references inspected

- **Match3 Core v1.0.0:** https://github.com/jaychtw/match3-core at `9863f8e023a227540a58491282e87d9f11a0cf79`; annotated tag resolves to this exact commit. README, API/types, rules, events, state, QA and test harness inspected. All rules, special interactions, gravity, scoring, RNG and state validation remain in the unchanged package.
- **UGDS v1.0.0:** https://github.com/jaychtw/game-development-standards at `d5c6696efdd6efc028118600466db44aecae0c9b`; unchanged copy in `design/UGDS-v1.0.0.md`.
- **Shape Match released baseline:** https://github.com/jaychtw/shape-match, tag `v1.0.0`, commit `857dfe124cbce152b4aa118550f11276cbb7414e`. Repository main inspected at `8b8bee699f1dc66fb335d6584f98417929d652bb`; reused functional modules were compared to the release with no differences.
- **Cute Animal Match:** https://github.com/jaychtw/animal-match at `372016711574bf216b94b9a3eb1490fa824f0090`. The display title differs from the repository slug. README, architecture, level manifest, pieces, saves, tests and theme conventions inspected. Its independent storage namespace and identity mapping informed this edition. Its README says final acceptance is pending; this project inherits no release/approval claim from it.

No source LICENSE file was present in the reference repositories. Reuse here follows the repository owner's supplied handoff; no broader third-party license grant is asserted. The core's original release evidence and artifact identity are retained in `vendor/`.

## Compatibility/reuse plan and result

Use the exact packed core from Shape Match, verified with its recorded SHA-256 `9513ff12d24ff8b139b593167083ea3dc7390ae17690f495ee4c80de53e5a853`. It is an ESM package supporting ES2022 and structuredClone, with no runtime services. A local package avoids unbuilt Git dependencies or silent upgrades. `package-lock.json` preserves npm integrity.

Reuse Shape Match's transactional controller, ordered-event projection/animation, validated sessions/backups, progression, original synthesized audio and test patterns. Change the six engine IDs deterministically to the six GDD snack IDs; preserve original level seeds, targets, move budgets and authored special setups. Regenerate all win/loss witnesses under the new IDs. Store exclusively under `snacks-raohe-*`; source-game saves cannot collide. Separate Journey and Free Play slots remain exact engine snapshots.

The app never calculates matches, gravity, scoring, random pieces or outcomes. `controller.ts` resolves a candidate with the core; `projection.ts` consumes events and verifies exact state before commit. Shuffling invokes `Game.reshuffle()`, verifies event projection and starts a new diagnostic checkpoint without spending moves. Hints display the first engine-authorized move without changing state. Invalid moves and failed presentation preserve the last committed game.

`pieces.ts`, `i18n.ts`, and `level.ts` separate theme, language and content from rules. The new scene, signboard layout, styling, food illustrations and gate replace the reference games' visual identity.

## Art pipeline

The attached concept was a composition/mood reference, never inserted into gameplay. Three original generated production assets were commissioned separately: transparent architectural frame, transparent six-food sprite sheet, and a continuous night-market street. WebP encoding optimizes the retained original PNGs in the workspace; all production assets are local in `public/art/`. Live text is HTML, including corrected Chinese signage. See `ASSETS.md` for source records and limitations.

The 8×8 board is DOM buttons, not baked artwork. Each tile references its own deterministic sheet region and receives explicit special badges. Gate architecture scales independently. Mobile prioritizes a nearly viewport-wide board, moves the order sign above it and clips roof/wings inside the gate region so they cannot cover the HUD or cause page overflow. Larger pieces enables bounded scrolling and 44px+ cells; large direction buttons provide an alternative to small compact cells.

## Deliberate differences and pending decisions

The concept's hammer/rainbow inventory has no implementation contract in either baseline or core v1.0.0. Adding direct tile removal or consumable specials would require new rules. This candidate uses clearly labeled Hint, Shuffle, Pause, Restart and the existing engine's earned special pieces; it makes no inventory claim. Human acceptance of this presentation difference remains pending.

The baseline's 15 levels/three chapters, scores, move counts, progression, confirmations, free play and recovery conventions are retained. Names, objectives and tutorials refer to Raohe foods. Optional music is synthesized locally after interaction, with mute, effects and volume settings. No accounts, payments, analytics, remote fonts or runtime external services were added.

This is a playable implementation candidate for visual/play review. No human visual gate, production acceptance, hosted CI success or deployment is inferred from local checks. Physical-device, screen-reader and independent player/linguistic/balance reviews remain open.
