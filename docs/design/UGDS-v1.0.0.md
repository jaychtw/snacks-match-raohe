# Universal Game Development Standard (UGDS)

**Version:** 1.0.0  
**Status:** Adopted baseline  
**Applies to:** New game projects that explicitly adopt this version  
**Owner:** Project creative director

## 1. Purpose and authority

UGDS defines reusable delivery, quality, accessibility, visual-production, and verification expectations. The project Game Design Document (GDD) defines the game's identity, rules, content, and project-specific decisions. The Codex brief defines the implementation assignment.

**Governing principle:** Standardize what should be consistent; preserve creative freedom where differences create value.

Each project must pin a UGDS release tag or commit SHA (a version label alone is insufficient for reproducibility). Keep a local copy or immutable reference accessible to implementers. Future UGDS changes do not silently modify an existing project's acceptance criteria.

**Priority and conflicts:** Applicable law, platform policy, and safety requirements take precedence. UGDS establishes defaults; the GDD may strengthen them. If a GDD appears to conflict with a mandatory UGDS requirement, do not silently choose one: document the conflict and seek the creative director's approval for a scoped exception before implementation. A Codex task brief cannot silently waive either document.

**Requirement types:** MUST = mandatory unless an explicitly approved exception exists; SHOULD = default with documented rationale for departure; IF APPLICABLE = mandatory when its stated trigger holds. A project's acceptance checklist must mark each item Pass, Fail, Not Applicable (with reason), or Not Verified. Never treat Not Verified as Pass.

## 2. Product and interaction

**UGDS-P01 — Complete playable loop (MUST).** Provide an understandable entry point, goal, controls, feedback, success/failure or completion conditions, and a clear replay/restart path. A project-specific GDD may define nontraditional outcomes.

**UGDS-P02 — Input compatibility (MUST).** Support desktop keyboard/mouse and mobile touch for the game's primary interactions. Do not rely on hover, tiny hit targets, or keyboard-only input. Use controls appropriate to the game; offer an alternative when gestures are essential.

**UGDS-P03 — Responsive presentation (MUST).** Test real rendered layouts at narrow phone (320px), representative phone (~390px), tablet (~768px), and desktop (~1440px) widths, adapting orientation when the GDD requires it. The primary play area must remain readable and operable; avoid accidental horizontal overflow, clipped controls, and obscured targets. If a puzzle cannot remain legible at once, define and test a navigation/zoom strategy.

**UGDS-P04 — Fair and observable mechanics (MUST).** The rendered state must match the game engine: routes, connections, hitboxes, evidence, collision, scoring, and outcomes must be consistent. Disclose or teach mechanics players need to make meaningful decisions; avoid invisible rules masquerading as skill.

**UGDS-P05 — Recovery (MUST).** Players can recover from mistakes without corrupting progress. Destructive actions affecting progress require appropriate confirmation or undo.

## 3. Language and accessibility

**UGDS-L01 — Bilingual from the outset (MUST).** Support English and Traditional Chinese (zh-TW) using centralized localization resources, including instructions, menus, status, errors, results, accessibility labels, and meaningful dynamic text. Do not scatter hard-coded user-facing strings through gameplay code.

**UGDS-L02 — Live switching (MUST).** Players can change language without losing game state or restarting. Test both languages across primary flows; check for overflow, missing keys, and mixed-language artifacts.

**UGDS-A01 — Accessible interaction (MUST).** Use legible text, sufficient contrast, visible focus, meaningful labels, and keyboard access to primary functions. Provide touch targets appropriate to device size (aim for at least 44×44 CSS px unless spacing/alternative interaction makes a smaller target reliably usable). Do not rely on color alone.

**UGDS-A02 — Motion and sound (IF APPLICABLE).** If the game includes nonessential animation, respect reduced-motion preferences and provide a usable reduced-motion experience. If it includes sound, provide mute/volume or equivalent user control. Essential cues need visual alternatives.

## 4. Mandatory visual production standard

**UGDS-V01 — Concept art is reference, never the deliverable (MUST).** Reference images illustrate mood, composition, quality ambition, and style. Do not insert concept images as complete gameplay backgrounds or present concept/prototype screenshots as finished artwork. Create or license appropriate production assets, respecting intellectual property rights; never copy another game's proprietary art or level layouts.

**UGDS-V02 — Separate prototype and production quality gates (MUST).** A functional proof of concept validates mechanics, not visual acceptance. Production must include a coherent art direction, refined game-ready assets, and evaluation of the fully composed game at actual target resolutions. Passing automated functional tests does not satisfy visual acceptance.

**UGDS-V03 — Consistency and integration (MUST).** Artwork, interactive objects, animations, lighting, perspective, scale, and effects must feel coherent. Visual affordances must accurately convey playable geometry and state. Do not hide poor alignment or disconnected visual logic beneath decorative art.

**UGDS-V04 — Representative visual POC (MUST for visually ambitious games; otherwise SHOULD).** Before producing the full art set, demonstrate a representative playable scene containing the hardest relevant interactions and sufficient scenery to evaluate composition. Compare actual in-engine desktop and mobile screenshots against the approved direction. Obtain explicit visual-direction approval before scaling production when the brief calls for it.

**UGDS-V05 — No silent quality downgrade (MUST).** If a pipeline cannot meet the intended visual direction, present the gap, alternatives, tradeoffs, and a proposed resolution. Do not quietly substitute generic primitives, flat placeholders, low-detail SVGs, or concept art and claim the visual target was achieved. Simpler stylization is acceptable only as a deliberate, approved art direction.

**UGDS-V06 — Visual evidence (MUST).** Provide screenshots or recordings of the final running build on desktop and emulated mobile, including representative active gameplay and meaningful state changes. Record what a human reviewer has and has not approved. Automated image or accessibility checks are supporting evidence, not proof of aesthetic quality.

## 5. Progress, performance, and safety

**UGDS-S01 — Persistence (IF APPLICABLE).** Save meaningful multi-session progress and user preferences locally when the game has them. Validate saved data, handle blocked or corrupt storage gracefully, and avoid destructive overwrites. Do not add accounts or cloud storage without project authorization.

**UGDS-S02 — Runtime independence (SHOULD).** Prefer locally bundled assets and minimal runtime dependencies. Declare network services, telemetry, permissions, and external asset licenses if used.

**UGDS-S03 — Performance (MUST).** Maintain responsive controls and stable play on ordinary target devices; avoid unbounded animation, excessive asset sizes, and unnecessary background work. Record material performance limitations and the environments tested.

**UGDS-S04 — Age-appropriate safety and honesty (MUST).** Follow the GDD's intended audience; distinguish fictional mechanics from real-world safety or scientific advice where confusion could matter. Do not imply real-world capability based on fictional systems.

## 6. Engineering and QA

**UGDS-Q01 — Verifiable engine (MUST).** Keep consequential game rules testable independently of presentation where feasible. Include automated tests for core rules, edge cases, progression, and data validation.

**UGDS-Q02 — Browser gameplay (MUST).** Run actual browser-based tests that exercise meaningful player interactions, not just page loading. Test desktop and touch-emulated mobile; cover both languages, at least one complete representative playthrough, failure/retry paths, and persistence if applicable.

**UGDS-Q03 — Balance and integrity (IF APPLICABLE).** For authored puzzles, deterministic scenarios, resource systems, or procedural generation, validate solvability, intended difficulty, and nontrivial outcomes using appropriate simulation, search, or authored checks. Report design limitations; test coverage is not proof of fun.

**UGDS-Q04 — Accessibility validation (MUST).** Check keyboard interaction, focus behavior, contrast/labels, and appropriate automated accessibility audits. Distinguish automated audits from physical-device, screen-reader, or human usability testing.

**UGDS-Q05 — Release integrity (MUST).** Separate local build/test success, source push, CI success, deployment success, and live gameplay verification. Never report deployment or live readiness solely from local tests. Verify the published URL and a meaningful interaction when deployment is in scope.

**UGDS-Q06 — Evidence and limits (MUST).** Deliver a QA report with commands, pass/fail counts, tested viewports/browsers/languages, representative screenshots, release commit or artifact identifiers, and known gaps. Explicitly identify physical-device and independent first-time player tests as outstanding if not performed. Never fabricate tests or approval.

## 7. Collaboration and change control

**UGDS-C01 — Decision ownership (MUST).** The creative director owns game identity, experience, quality targets, and acceptance. Codex owns engineering implementation choices within those constraints. Delegate decisions, not accountability.

**UGDS-C02 — Escalation (MUST).** Ask for approval before material scope cuts, visual-direction changes, game-rule changes, external services, security/privacy changes, or exceptions to mandatory standards. Minor implementation decisions need not interrupt delivery.

**UGDS-C03 — Versioned improvements (MUST).** Add reusable lessons through a reviewed UGDS change, update CHANGELOG, and assign a new version. Do not rewrite the standard separately for each game. A project may pin an older version intentionally.

## 8. Definition of done

A release is ready for creative-director acceptance only when:
1. All applicable mandatory requirements pass or have explicit, documented exceptions.
2. Core gameplay and both languages have been tested in actual browser interactions.
3. The production visual gate has been evaluated separately from functional correctness.
4. QA evidence, limitations, and deployment status are truthful and reproducible.
5. Any unverified physical-device or independent-player checks remain clearly identified, not silently marked complete.

This standard is a minimum framework, not a demand for unnecessary features. Project-specific art direction, level count, engine, orientation, difficulty, and mechanics belong in the GDD.
