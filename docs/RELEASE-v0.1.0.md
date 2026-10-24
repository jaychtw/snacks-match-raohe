# Raohe v0.1.0 release record

## Creative approval and publication authorization

On 2026-10-24 (Asia/Taipei), the creative director explicitly approved the visuals, including desktop/mobile layouts, and accepted Hint and Shuffle replacing the concept's consumable tools. The same instruction authorized autonomous GitHub Pages deployment, verification, and fixes within the approved GDD, without additional approval checkpoints.

This is explicit user approval, independent of any approval language in the supplied GDD. The approved visual/gameplay source is initial commit `89a53088fa0b08e474c4bbcb6b110393859b7ee9`. The pinned engine and UGDS versions remain unchanged. No application rules, content or accepted visuals are changed for release.

## Release workflow

The initial source's hosted CI passed: [run 40089369106](https://github.com/jaychtw/snacks-match-raohe/actions/runs/40089369106). It runs frozen installation, 55 app tests, TypeScript/production build, and 25 actual Chromium browser tests.

The existing Pages workflow repeats these gates, uploads the exact `dist/`, deploys with GitHub's official Pages actions, then verifies the public site against the same checkout. Because the cloud machine's current network policy blocks the GitHub API, an explicit `[deploy]` commit marker on `main` can trigger that same job; ordinary pushes do not publish. Manual dispatch remains available.

Public verification matches every deployed asset's SHA-256 against `dist/`, tests English/zh-TW at 320/390/768/1440px, real engine-authorized moves, exact DOM/state reconciliation, artwork loading, axe audits, reload persistence, separate Journey/Free Play sessions, preferences and live language switching. A touch-phone zh-TW playthrough exercises defeat, retry, victory, next level and persistent progression. The runner writes `live-verification.json`, screenshots and a job summary to the release evidence artifact.

## Verified deployment

- **Live game:** https://jaychtw.github.io/snacks-match-raohe/
- **Deployed source:** `29886ca22efd0cb27b248aecc0415093e38cd4bb` (release tag `v0.1.0`).
- **Exact-commit CI:** [run 40090182293](https://github.com/jaychtw/snacks-match-raohe/actions/runs/40090182293), completed successfully.
- **Pages deployment and public verification:** [run 40090182305](https://github.com/jaychtw/snacks-match-raohe/actions/runs/40090182305), [publish job 120861085234](https://github.com/jaychtw/snacks-match-raohe/actions/runs/40090182305/job/120861085234), completed successfully.
- **Deployment completed:** 2026-10-24 19:33:04 Asia/Taipei (11:33:04 UTC). Public verification completed at 19:33:39 Asia/Taipei.

The deployment job passed frozen installation, all 55 app tests, TypeScript/production build, all 25 browser tests, Pages configuration/upload/deployment, public verification and evidence upload. Verification ran against the actual published HTTPS site using normal TLS on GitHub-hosted Chromium, not a local preview.

All six published files matched the same job's built SHA-256 values. All eight width/language cases passed at 320, 390, 768 and 1440px in English and Traditional Chinese, with three real Journey turns and one Free Play turn per case, exact engine/DOM/state equality, decoded gate artwork, food-sprite CSS, successful asset responses, no page overflow, unobscured moves HUD, and zero axe violations. Exact sessions, separate mode slots and language preferences survived reload; live language switching preserved the active game. A 390×844 touch-phone zh-TW run additionally executed all 18 defeat-witness moves, retry, all 8 victory-witness moves, next-level transition and persisted completed-level progression. No page errors or failed requests were observed by the public verifier.

The Actions artifact **raohe-release-evidence** contains `live-verification.json`, nine public screenshots and the other QA records. GitHub reports archive SHA-256 `95f9ad068ef62a6045b072039404ce59c3fb695b75c374561e1386b684f6da89`, size 39.6 MB. Artifact retention is controlled by repository settings; download it before expiry if a permanent independent archive is needed. The archive was not independently downloaded from the cloud machine, whose egress policy blocks `api.github.com` and `jaychtw.github.io`. This did not block hosted verification; the full exact-commit workflow and every required job step were observed successful through public GitHub Actions pages. [Permanent status evidence](evidence/release-status.json) records those observations and their scope.

The accepted application visuals, engine and gameplay source are unchanged from the approved build. Release changes add approval records, an explicit deployment trigger and broader public-site verification. Documentation on `main` may advance beyond the immutable deployed commit; documentation-only pushes do not redeploy.

## Known manual QA limits

The user's visual approval closes the visual/layout and Hint/Shuffle review. It does not certify physical iOS/Android touch behavior, actual Safari/Firefox, screen readers, subjective audio permissions/quality, sustained ordinary-phone battery/thermal/performance behavior, independent Traditional Chinese/English linguistic review, or first-time-player/balance evaluation. These remain explicitly unverified manual checks, not fabricated passes.

`docs/QA.md` and its initial evidence capture the earlier local validation phase. Later release results belong here and in the Actions artifacts so that earlier "not run" observations are not mistaken for current release status.
