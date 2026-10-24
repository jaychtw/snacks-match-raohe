# Snacks Match – Raohe | 小吃消消樂－饒河
## Game Design Document — v1.0 (implementation baseline)

**Status:** Approved direction; implementation-ready, subject to asset/technical feasibility checks  
**Edition:** Raohe / 饒河  
**Series:** Snacks Match / 小吃消消樂  
**Working repository:** `snacks-match-raohe`  
**Reference mockup:** `Raohe_Visual_Concept.png` (provided alongside this GDD)

## 1. Product vision
A polished, accessible, bilingual, family-friendly browser match-3 game that feels like stepping into Taipei's Raohe Street Night Market. The iconic night-market entrance gate must be an **integral architectural frame of the gameplay**, not a decorative picture behind an unrelated rectangular app. A cohesive environment extends beyond the play area across the viewport, or gracefully falls back to a matching palette/background where scenic extension is impractical.

**Design promise:** Proven mechanics; unmistakably new visual identity. Gameplay must remain immediately legible and responsive, especially on phones.

## 2. Locked decisions
- English edition title: **Snacks Match – Raohe**. Traditional Chinese: **小吃消消樂－饒河**.
- Exactly **six active standard snack types**, selected for distinctive visual appearance, not sales rank.
- Reuse the released, pinned **Match3 Core v1.0.0** as authoritative gameplay logic. Do not fork or reimplement matching, gravity, specials, RNG, or persistence unless a documented integration issue makes a change essential.
- Preserve established, proven Shape Match / Cute Animal Match *functional* conventions as a baseline, but **do not copy their UI composition, palette, or visual identity**.
- Target a vibrant, illustrated, commercial-feeling 2D experience with culturally recognizable night-market architecture.
- Bilingual English / Traditional Chinese, responsive mobile and desktop, accessible input, and local progress saving.
- The mockup is a **visual direction reference, not a pixel-accurate implementation contract**; see §5 for deviations and corrections.

## 3. Six gameplay pieces
| ID | Traditional Chinese | English | Primary visual cue | Distinction to protect |
|---|---|---|---|---|
| pepper_bun | 胡椒餅 | Pepper pork bun | Round golden sesame-topped baked bun | Simple round pastry, no fried-paper pouch |
| grilled_squid | 烤魷魚 | Grilled squid | Red-orange body with prominent tentacles | Recognizable tentacle silhouette |
| candied_fruit | 糖葫蘆 | Candied fruit skewer | Glossy vivid red fruit spheres on stick | Bold red clustered circles |
| grilled_corn | 烤玉米 | Grilled corn | Yellow elongated cob with kernel grid | Clear kernel texture, distinct from squid |
| bubble_tea | 珍珠奶茶 | Bubble milk tea | Cup, straw, dark tapioca pearls | Only beverage; legible cup outline |
| chicken_cutlet | 炸雞排 | Fried chicken cutlet | Irregular golden crispy cutlet, optionally in paper sleeve | Avoid reading as pepper bun |

**Artwork acceptance:** Every snack must remain recognizable at the smallest supported tile size, without depending on hue alone. Validate in grayscale and under common color-vision deficiencies; protect silhouette and texture. Illustrations may be stylized for clarity but should still resemble the actual foods. Each snack must map deterministically to one of the six engine piece types.

**Availability:** These foods were selected on the premise that they are obtainable at Raohe; this is **not** a ranking of Raohe's most popular foods or a claim about any particular stall's current stock. Do not label pieces as “top six.”

## 4. Core gameplay and content
- Match-3, **8 × 8** grid, six standard piece types; use Match3 Core's existing legal moves, match detection, cascades, special pieces, combination rules, ordered events, and deterministic state model.
- Preserve the established 15-level / three-chapter progression plus Free Play **as the initial content baseline**, subject to compatibility with the core and existing implementation contracts. Adapt objective labels, rewards, and presentation to the Raohe theme; do not invent a new rule system.
- Start with a coherent first level showing **Level 1**, a visible target, and remaining moves; numbers in the visual mockup are illustrative, **not mandated balancing**.
- Keep goals, move counts, power-up inventories, pause/restart, completion/failure states, sound settings, and language switching readable and reachable.
- Reuse existing save/load conventions and locally persisted progress. Do not add accounts, payments, ads, analytics, or external services by default.
- Preserve authoritative event-driven animation: effects should respond to engine events, not infer game outcomes from rendered positions.

## 5. Visual direction — pivotal feature
### 5.1 Architectural board integration
The recognizable Raohe entrance gate spans above and around the board: ornate roofline, illuminated signage, decorative pillars and lanterns create the *structural visual frame* for the play surface. The board should feel **installed beneath or within the gate**, not like a generic square widget pasted over a photo. The game scene must have a cohesive perspective and lighting language.

### 5.2 Whole-page background
**Preferred:** Extend the same night-market environment into the full browser viewport—street depth, vendor stalls, lighting, and atmospheric perspective.  
**Acceptable fallback:** Use a harmonized deep-night base color or restrained gradient sampled from the scene; avoid abrupt mismatched webpage margins, generic cards, or a floating app-on-background appearance.

Background details are subordinate to play. On narrow screens, crop or simplify stalls and decorative wings; **never shrink the board to preserve ornament**. Avoid UI overlap with OS/browser safe areas and maintain legible tile dimensions.

### 5.3 UI arrangement
- **Central:** largest practical 8×8 board, visually nested inside the gate's architecture.
- **Header:** title/edition identity, potentially incorporated into signage, but avoid duplicating large labels that steal board space.
- **Objectives / moves:** clearly readable, integrated as market-style signboards, responsive to compact mobile placement.
- **Power-ups:** visually themed but unambiguous controls; accessible labels, counts, disabled states, and touch targets.
- **Ambient details:** warm lanterns, food stalls, atmospheric night-market lighting, restrained ambient animation and depth.
- **Effects:** snappy matches, satisfying cascades, subtle food-specific motion and feedback without visual noise.

### 5.4 Mockup corrections / nonliteral aspects
The supplied concept art is a **mood and composition reference**, not final UI artwork. It may contain AI-generated or inaccurate text, inconsistent food drawings, decorative stalls, and UI arrangements that do not match the existing product contract. In particular, **reconstruct the grid as a correct, fully functional 8×8 board**, ensure exactly six piece identities, localize every user-facing label, and derive objectives/move counts from actual level data. Do not use the mockup as a baked-in image containing the playable tiles.

### 5.5 Asset pipeline
Use separately authored/layered assets for gate, board frame, tile illustrations, controls, and ambient background. The gate and scenery must scale independently of the grid. Prefer optimized web assets (SVG, WebP, PNG as appropriate), explicit licenses, and performant animation. If generative concept art is used as reference, do not assume it supplies usable layers, sprite sheets, copyright clearance, or accurate Chinese typography. Preserve editable text as UI text where possible.

## 6. Responsive and accessibility requirements
- Desktop, tablet, and portrait phone layouts. Board remains primary at every breakpoint.
- Mouse, touch, and keyboard operation consistent with established games; visible focus, semantic controls, meaningful labels and feedback.
- Support color-vision differences, adequate contrast, non-color-only cues, and reduced-motion preferences.
- EN/zh-TW toggle; all gameplay, menus, onboarding, status, errors, and results localized; Chinese fonts must display reliably.
- Keep effects performant on ordinary phones; avoid expensive full-screen particle layers and overdraw.
- Preserve sound/mute controls and avoid autoplay audio that violates browser rules.

## 7. Technical architecture and reuse
- Depend on **Match3 Core v1.0.0** (`https://github.com/jaychtw/match3-core`, tag `v1.0.0`, baseline commit `9863f8e023a227540a58491282e87d9f11a0cf79`). Confirm repository/API compatibility before integration; do not silently upgrade.
- Follow **UGDS v1.0.0** (`https://github.com/jaychtw/game-development-standards`, baseline commit `d5c6696efdd6efc028118600466db44aecae0c9b`).
- Consult **Shape Match** and **Cute Animal Match** for proven behavior, accessibility, localization, saves, test harnesses, and release process—not for copied visual layout.
- Separate content/theme data (names, localized labels, tile asset mapping, backgrounds, decorative assets) from core rules.
- Keep customization straightforward; **do not prematurely build a universal white-label/theme-editor platform**.
- Deploy as a standalone static browser game, compatible with GitHub Pages and typical mobile browsers.

## 8. QA and acceptance gates
1. **Visual POC:** Gate architecture genuinely encloses the board; full-page background is continuous or harmonized. Compare screenshots at desktop and portrait phone sizes against concept intent.
2. **Piece readability:** Six pieces correctly recognized in small tiles, grayscale, and simulated color-vision variants; special pieces and selection states remain distinguishable.
3. **Functional parity:** Existing core gameplay behavior, legal moves, cascades, specials, save/load, restart and level transitions pass automated tests.
4. **Responsive and accessible:** Board and essential controls fit common viewports; touch/keyboard operation, focus, localization, contrast, reduced motion checked.
5. **Performance:** Smooth representative gameplay on desktop and midrange mobile; assets optimized and loading reasonable.
6. **Release evidence:** CI and browser tests recorded against exact commit; manual device and screen-reader checks explicitly marked performed or unverified, never implied.
7. **User acceptance:** Final G5 remains a human creative and gameplay sign-off, distinct from automated passing tests.

## 9. Delivery workflow for Codex
**Phase A — inspect:** Read UGDS, Match3 Core contracts, and both shipped game baselines; write a brief compatibility/reuse plan.  
**Phase B — visual POC:** Build a functioning responsive 8×8 board within the Raohe gate environment, using the six food types and a representative HUD. Provide desktop/mobile screenshots before scaling out.  
**Phase C — complete edition:** Implement levels, menus, saves, localized copy, audio/effects, accessibility, and visual polish.  
**Phase D — verify/release:** Run core, UI, browser, accessibility and responsive checks; publish QA evidence and release candidate for user acceptance.

**Delegated discretion:** Codex may make unspecified, reversible implementation and art-direction decisions consistent with this GDD, the pinned standards, and the mockup. Escalate only decisions that alter locked requirements, core mechanics, budget/rights exposure, major scope, or accepted visual identity. Document meaningful deviations and rationale.

## 10. Commercial direction (strategic context, not v1 feature scope)
**Stage 1:** Publish first-party themed editions to establish quality, brand reputation, engagement, and a portfolio.  
**Stage 2:** Propose commissioned night-market editions to market associations or appropriate managing bodies; validate who has authority to approve imagery, branding, promotion, and participation.  
**Stage 3:** Offer individual vendors branded games focused on their own products, with flexible visual variants where fewer than six distinct products exist.

Business proposals should distinguish editorial/independent editions from sponsored content and obtain appropriate permissions for brand names, logos, likenesses, and marketing claims. Future commercial analytics, calls-to-action, sponsorship and vendor customization are **not included** in the first Raohe build unless separately approved. Success at stage 1 should be measured by gameplay quality and useful engagement evidence, not assumed monetization.

## 11. Explicit non-goals for v1
- New match-3 engine, new fundamental mechanics, or a separate universal game framework.
- Real-time vendor inventories, vendor rankings, unverified “most popular” claims, or tourism survey scoring.
- Payments, accounts, advertisements, sponsored rankings, or a merchant self-service editor.
- Pixel-perfect reproduction of the generated mockup at the cost of functionality, mobile usability, or accuracy.

## 12. Definition of done
A publicly playable, bilingual, responsive Raohe-themed match-3 game with six visually distinct snack pieces, proven engine behavior, accessible and tested controls, local progression, and a cohesive night-market environment in which the iconic entrance gate is a structural part of the board presentation. All major deviations, test results, and remaining manual verification gaps are documented before final user approval.
