# Raohe v0.1.0 release record

## Creative approval and publication authorization

On 2026-10-24 (Asia/Taipei), the creative director explicitly approved the visuals, including desktop/mobile layouts, and accepted Hint and Shuffle replacing the concept's consumable tools. The same instruction authorized autonomous GitHub Pages deployment, verification, and fixes within the approved GDD, without additional approval checkpoints.

This is explicit user approval, independent of any approval language in the supplied GDD. The approved visual/gameplay source is initial commit `89a53088fa0b08e474c4bbcb6b110393859b7ee9`. The pinned engine and UGDS versions remain unchanged. No application rules, content or accepted visuals are changed for release.

## Release workflow

The initial source's hosted CI passed: [run 40089369106](https://github.com/jaychtw/snacks-match-raohe/actions/runs/40089369106). It runs frozen installation, 55 app tests, TypeScript/production build, and 25 actual Chromium browser tests.

The existing Pages workflow repeats these gates, uploads the exact `dist/`, deploys with GitHub's official Pages actions, then verifies the public site against the same checkout. Because the cloud machine's current network policy blocks the GitHub API, an explicit `[deploy]` commit marker on `main` can trigger that same job; ordinary pushes do not publish. Manual dispatch remains available.

Public verification matches every deployed asset's SHA-256 against `dist/`, tests English/zh-TW at 320/390/768/1440px, real engine-authorized moves, exact DOM/state reconciliation, artwork loading, axe audits, reload persistence, separate Journey/Free Play sessions, preferences and live language switching. A touch-phone zh-TW playthrough exercises defeat, retry, victory, next level and persistent progression. The runner writes `live-verification.json`, screenshots and a job summary to the release evidence artifact.

Deployment and public verification are pending execution; this section will be updated only from observed results. The intended Pages address is `https://jaychtw.github.io/snacks-match-raohe/`; an intended URL is not proof of a live deployment.

## Known manual QA limits

The user's visual approval closes the visual/layout and Hint/Shuffle review. It does not certify physical iOS/Android touch behavior, actual Safari/Firefox, screen readers, subjective audio permissions/quality, sustained ordinary-phone battery/thermal/performance behavior, independent Traditional Chinese/English linguistic review, or first-time-player/balance evaluation. These remain explicitly unverified manual checks, not fabricated passes.

`docs/QA.md` and its initial evidence capture the earlier local validation phase. Later release results belong here and in the Actions artifacts so that earlier "not run" observations are not mistaken for current release status.
