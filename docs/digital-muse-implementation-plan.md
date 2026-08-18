# Implementation Plan — Muse
### Adaptive museum interpretation · solo build · 9 phases

**Source documents:** PRD (`digital-muse-prd.md`), Design Document (`digital-muse-design-doc.md`), TRD (`digital-muse-trd.md`).

**Conflict resolution applied** (per precedence rule: TRD for technical, Design Doc for UX, PRD for priority):
- Stack: TRD's Next.js monolith supersedes the PRD's Vite + separate serverless functions.
- Testing: TRD explicitly waives automated tests and coverage targets for this build. Testing requirements below are therefore manual smoke checks plus two cheap scripted validators, not unit suites with coverage percentages.
- Parallelization: the PRD's parallel-track schedule assumed 3–4 people. Build is solo and sequential. Parallelization notes are included only where they would apply if a second developer joined.

---

## Phase 1 — Foundation and deployment pipeline

**1. Objective**
Stand up a deployed, publicly reachable Next.js application shell with the design system tokens in place and the LLM API key wired server-side.

**2. Features to build**
- Deployed application URL reachable from a mobile browser
- Base visual theme (paper background, ink text, accent colour)
- Header shell with product name

**3. Technical tasks**
1. Initialise a Next.js 15 project with App Router and TypeScript.
2. Add `.gitignore` covering `.env*` before the first commit.
3. Install and configure Tailwind CSS.
4. Define design tokens in the Tailwind theme: `paper #FAF8F4`, `paper-raised #FFFFFF`, `ink #1A1A18`, `ink-muted #5C5A54`, `rule #E2DED6`, `accent #1F5F5B`, `accent-soft #E6EFEE`, `verified #1B6B3A`, `flagged #A62A21`, `notice #8A5A00`.
5. Configure fonts via `next/font`: Source Serif 4 (serif role) and Inter (sans role); self-host at build.
6. Set the base type scale in Tailwind using `rem` units: body 17px equivalent, line-height 1.65, measure cap 68ch.
7. Build `app/layout.tsx` with the root layout, font variables, paper background, and a static header.
8. Add a global focus-ring style (2px accent, 2px offset) and confirm default outlines are not suppressed.
9. Create the repository on GitHub and connect it to a Vercel project.
10. Add `ANTHROPIC_API_KEY` to Vercel environment variables for Production and Preview; confirm it is not prefixed `NEXT_PUBLIC_`.
11. Deploy and confirm the live URL loads on a physical phone.

**4. Dependencies**
- Anthropic API key with available credit.
- GitHub and Vercel accounts.
- Design Document §2 (palette) and §3 (typography) as the token source.
- Resolution of the two document conflicts listed above (already applied).

**5. Testing requirements**
- Manual: live URL loads over mobile data, not just localhost.
- Manual: colour tokens render; serif and sans are visibly distinct.
- Manual: keyboard Tab shows a visible focus ring.
- Security: confirm the API key does not appear in the client bundle (search the built output for the key string).

**6. Completion criteria**
- [ ] Live Vercel URL loads on a physical phone
- [ ] Git push triggers an automatic deploy
- [ ] Both font families render correctly
- [ ] All ten colour tokens available as Tailwind classes
- [ ] `ANTHROPIC_API_KEY` set server-side and absent from the client bundle
- [ ] `.env` files are gitignored and no secret is in commit history

**Scope/Trade-offs**
No error tracking, analytics, CI pipeline, or automated tests are configured. TRD §B waives all four for this build.

---

## Phase 2 — Content data layer

**2. Objective**
Author the artifact records and hand-written claim ledgers that every later phase depends on, and lock the data shape.

**2. Features to build**
- Seeded collection of six artifact records from a single museum
- Per-artifact fact checklist (claim ledger) backing the fidelity feature

**3. Technical tasks**
1. Define TypeScript types in `lib/types.ts` for `Artifact`, `Claim`, `Variant`, and `FidelityReport` exactly as specified in TRD §F.
2. Select the museum content source; record the licence for each image and text record.
3. Download six openly-licensed artifact images to `public/images/` named `{artifactId}.jpg`.
4. Author `data/artifacts.json` with six records: `id`, `museumName`, `title`, `imageUrl`, `curatorAltText`, `period`, `material`, `culture`, `provenanceLine`, `canonicalText` (120–200 words), `sensitivityFlags`, `contentNoticeText`.
5. Hand-write 4–6 atomic claims per artifact with `id`, `text`, `type`, `criticality`, `hedge`. Do not extract these with an LLM.
6. Ensure at least two artifacts contain hedged claims (`circa`, `attributed_to`) so hedge preservation is demonstrable.
7. Write `scripts/validate-data.ts` to assert: required fields present, `canonicalText` ≥ 40 words, ≥ 4 claims per artifact, at least one `must_include` claim per artifact, image file exists at the stated path.
8. Add `lib/artifacts.ts` exposing `getAllArtifacts()` and `getArtifactById(id)` from the static import.
9. Run the validator and fix all failures.

**4. Dependencies**
- Museum content source confirmed (TRD §R, open question 1). This is the gating decision for the phase.
- Image licence verification per object.

**5. Testing requirements**
- Scripted: `validate-data.ts` passes with zero errors.
- Manual: each `canonicalText` is read once end to end and confirmed to be the museum's published wording, not a paraphrase.
- Manual: every claim is verifiably present in its artifact's `canonicalText`.
- Legal check: every image and text record has a recorded licence permitting reuse with attribution, or is clearly labelled synthetic.

**6. Completion criteria**
- [ ] Six artifact records authored and validating
- [ ] 24–36 claims total, all traceable to canonical text
- [ ] At least two hedged claims present
- [ ] Six images present and loading
- [ ] Licence recorded for every asset
- [ ] `getAllArtifacts()` and `getArtifactById()` return typed data

**Scope/Trade-offs**
This is the largest non-code task and has no shortcut. If pre-build authoring is permitted, complete Phase 2 before the clock starts. If behind schedule, reduce to four artifacts rather than reducing claims per artifact — the claim ledger is what the fidelity feature demonstrates.

---

## Phase 3 — Static UI shell

**1. Objective**
Render the Collection and Artifact screens from static data with canonical text only, establishing the layout the personalization layer will later populate.

**2. Features to build**
- Collection screen with artifact cards
- Artifact detail screen showing image, title, metadata, and the museum's canonical text
- Back navigation
- Not-found screen

**3. Technical tasks**
1. Build `components/ArtifactCard.tsx`: image at 4:3, serif title, one metadata line, whole card tappable.
2. Build `app/page.tsx` (S1) as a Server Component: one-line product statement plus a card grid, 1-up at 320px, 2-up ≤640px, 3-up above.
3. Build `app/artifact/[id]/page.tsx` (S2) as a Server Component loading the artifact by route param.
4. Build `components/ArtifactHeader.tsx`: image with reserved aspect ratio, serif title, metadata line.
5. Render `canonicalText` in the serif face at 18px equivalent, line-height 1.7, within the 68ch measure.
6. Add the `← Collection` text back link to S2.
7. Build `app/not-found.tsx` (S4) with a message and a link to the collection.
8. Implement the empty state for a missing image: paper-toned block with serif title and the caption "No image available for this object" — no broken-image icon.
9. Implement the empty state for an empty collection: heading, muted body, and an action link.
10. Apply the responsive rules from Design Doc §12: single column ≤640px, 680px capped column to 1024px, two-column sticky-image layout above 1025px.
11. Verify all touch targets are ≥44×44px.

**4. Dependencies**
- Phase 1 (theme, layout, deploy).
- Phase 2 (`data/artifacts.json`, `lib/artifacts.ts`).
- Design Document §5 (screen list), §6 (screen purpose), §12 (responsive rules).

**5. Testing requirements**
- Manual: every artifact card navigates to the correct detail page.
- Manual: layout tested at 320px, 390px, 768px, and 1280px widths.
- Manual: an unknown artifact id renders the not-found screen.
- Manual: browser back returns to the collection with scroll position intact.
- Accessibility: heading order is h1 → h2 with no skipped levels; images have alt text from `curatorAltText`.
- Performance: no cumulative layout shift on image load.

**6. Completion criteria**
- [ ] All six artifacts reachable from the collection
- [ ] Canonical text renders in serif at the specified measure
- [ ] Responsive at all four test widths with no horizontal scroll
- [ ] Not-found and missing-image empty states implemented
- [ ] Deployed and verified on a physical phone

**Parallelization opportunities**
If a second developer joins: the Collection screen (tasks 1–2) and the Artifact screen (tasks 3–5) are independent once the types from Phase 2 are fixed.

---

## Phase 4 — Persona context system

**1. Objective**
Let the reader declare who they are in three taps and persist that choice across the session.

**2. Features to build**
- Persona chip in the header, visible on all screens
- Three-tap context sheet (audience, depth, accessibility)
- Persona persistence across navigation within a session
- Auto-open of the context sheet on first visit only

**3. Technical tasks**
1. Define the persona model in `lib/personas.ts`: `audience` (adult | child | specialist), `depth` (quick | standard | deep), `accessibility` (boolean), plus the resolution order and the default (adult / standard / off).
2. Create `PersonaProvider` React Context with `sessionStorage` read on mount and write on change.
3. Build `components/ui/Sheet.tsx` as a single bottom-sheet primitive: backdrop, slide-up, dismiss on backdrop tap, `Esc`, and swipe-down; focus trap; focus returned to the opener on close.
4. Respect `prefers-reduced-motion` in the Sheet: disable slide, retain opacity fade.
5. Build `components/PersonaChip.tsx` rendering `Reading as: {audience} · {depth}`, filled with `accent-soft`, opening the context sheet.
6. Build `components/ContextSheet.tsx` (B1) with three grouped choice sets; each selection applies immediately without a confirm button.
7. Mount `PersonaChip` in the root header so it appears on both S1 and S2.
8. Add first-visit detection so the context sheet auto-opens once per session and never again.
9. Cap the sheet at 85vh on portrait and 70vh on landscape phones.

**4. Dependencies**
- Phase 1 (root layout and header).
- Phase 3 (screens for the chip to appear on).
- Design Document §4 (components 2 and 3), §7 (navigation and sheet behaviour).

**5. Testing requirements**
- Manual: persona survives navigation from collection to artifact and back.
- Manual: persona survives a page refresh within the same tab and resets on a new tab.
- Manual: context sheet auto-opens exactly once per session.
- Accessibility: sheet is keyboard-operable; focus is trapped while open and restored on close; `Esc` dismisses.
- Accessibility: sheet has an accessible name and `role="dialog"`.
- Manual: with `prefers-reduced-motion` enabled at OS level, the slide animation is suppressed.

**6. Completion criteria**
- [ ] Persona selectable in three taps
- [ ] Chip reflects current persona on every screen
- [ ] Selection persists across navigation and refresh within the session
- [ ] Sheet dismisses via backdrop, `Esc`, and swipe
- [ ] Focus trap and focus restoration verified with keyboard only
- [ ] Reduced-motion respected

**Scope/Trade-offs**
The persona currently changes nothing visible in the content. That is expected — Phase 6 connects it. Do not build variant rendering here.

---

## Phase 5 — Muse generation endpoint

**1. Objective**
Produce a working server endpoint that converts a canonical description plus a persona into a structured, closed-world variant, verified in isolation before any UI is wired to it.

**2. Features to build**
- Server-side variant generation (not yet surfaced in the UI)

**3. Technical tasks**
1. Install the Anthropic SDK; create `lib/anthropic.ts` wrapping client construction and a single retry.
2. Author `prompts/policy.md` containing the immutable rules block: closed world, no invention, claim coverage, hedge preservation, exact numbers, no impersonation, mandatory attribution, decline behaviour.
3. Author `prompts/persona-rules.json` with per-persona length caps, target reading grade, tone, section structure, and vocabulary constraints, drawn from PRD §5 and Design Doc §3.
4. Define the variant output JSON schema matching TRD §F: `attribution`, `aiDisclosure`, `tags`, `readingTimeSeconds`, `sections[]`, `lookCloser[]`, `glossary[]`, `changelog`.
5. Build the prompt assembler: policy block first, then persona rules as data, then the canonical text inside an explicitly delimited block marked as source material and never as instructions.
6. Implement `app/api/muse/route.ts` (POST) accepting `{ artifactId, persona }`.
7. Validate inputs against an allowlist: `artifactId` must exist; `persona.audience` and `persona.depth` must be in the permitted sets. Reject before any LLM call.
8. Call the model at temperature 0.3 with structured JSON output enforced.
9. Inject the attribution and AI-disclosure lines server-side rather than trusting the model to produce them.
10. Return `{ status: "ok", variant }` on success and `{ status: "fallback", reason }` with HTTP 200 on failure — never a 5xx.
11. Test the endpoint with `curl` across all three audiences and all three depths before writing any UI.
12. Iterate `persona-rules.json` until adult, child, and specialist outputs are visibly distinct in length and vocabulary.

**4. Dependencies**
- Phase 1 (API key configured).
- Phase 2 (`data/artifacts.json` with canonical text and claims).
- Phase 4 (persona model shape — types only, no UI dependency).
- Spec document §6 Template 1, 3, and 4 as the prompt source.

**5. Testing requirements**
- Manual via `curl`: all nine audience × depth combinations return valid, schema-conforming JSON.
- Manual: outputs for child and specialist differ measurably in length and vocabulary for the same artifact.
- Manual: inspect three outputs against the canonical text for invented facts; zero tolerance.
- Manual: confirm hedged claims retain their hedging in child-level output.
- Security: submit an `artifactId` that does not exist and a malformed persona; confirm rejection occurs before any LLM call.
- Security: submit canonical text containing instruction-like syntax and confirm it is treated as data.
- Manual: force an API failure (invalid key) and confirm a 200 fallback response rather than a 5xx.

**6. Completion criteria**
- [ ] Endpoint returns schema-valid JSON for all nine persona combinations
- [ ] Persona differentiation visible without reading closely
- [ ] No invented facts in a manual review of at least three outputs
- [ ] Hedges preserved in simplified output
- [ ] Invalid input rejected before the LLM call
- [ ] Failure path returns 200 with a fallback reason

**Scope/Trade-offs**
The endpoint is not yet called from the browser. Verifying it in isolation prevents debugging prompt quality and UI wiring simultaneously, which is the most common source of lost time in this build.

---

## Phase 6 — Variant rendering, attribution, and source toggle

**1. Objective**
Surface generated variants on the artifact screen with permanent attribution and one-tap access to the museum's original text.

**2. Features to build**
- Persona-adapted explanation rendered on the artifact screen
- Live re-render when the persona changes
- Attribution block and AI-disclosure line, always visible
- Muse / Museum original source toggle
- Look-closer observation list

**3. Technical tasks**
1. Build `components/AttributionBlock.tsx` rendering both required lines; make it non-collapsible and place it directly above the explanation.
2. Build `components/ExplanationBlock.tsx` mapping `sections[]` to heading plus paragraphs, sans face for Muse output.
3. Build `components/LookCloserList.tsx` as an ordered list in a tinted block; omit the component entirely when `lookCloser` is empty rather than rendering an empty container.
4. Build `components/SourceToggle.tsx` as a two-option segmented control, sticky beneath the attribution block.
5. Render canonical text in serif and Muse text in sans so the two voices are typographically distinct.
6. Hold both texts in client state so toggling is instant with no network call.
7. Create `lib/variants.ts` with a single `resolveVariant()` function that returns the variant, or falls back to canonical text when the variant is missing. Centralise this so no component can bypass the fallback.
8. Wire the artifact page to fetch a variant on persona change, keyed by `{artifactId}:{audience}:{depth}`.
9. Implement the persona-switch loading treatment: current text at 50% opacity until the new text resolves, never an empty flash.
10. Implement the artifact-screen loading treatment: image, title, metadata, and attribution render immediately; only the explanation area shows static placeholder lines.
11. Add `aria-live="polite"` to the explanation region so screen-reader users are informed when content changes.
12. Apply the child-persona type bump to 19px body per Design Doc §3.

**4. Dependencies**
- Phase 3 (artifact screen shell).
- Phase 4 (persona context).
- Phase 5 (`/api/muse` verified working).
- Design Document §4 (components 4, 5, 6, 9), §10 (loading states).

**5. Testing requirements**
- Manual: switching persona re-renders the explanation without a page reload.
- Manual: source toggle switches both directions instantly with no network request.
- Manual: attribution block is present on every artifact for every persona and cannot be dismissed.
- Manual: canonical text is byte-identical to `data/artifacts.json` when the toggle is set to Museum original.
- Manual: with the API deliberately disabled, the screen falls back to canonical text with a notice rather than an error.
- Accessibility: persona change is announced via the live region; heading order remains valid after re-render.
- Manual: no empty flash during persona switch.

**6. Completion criteria**
- [ ] All three audiences render distinct explanations on all six artifacts
- [ ] Attribution and AI-disclosure lines present on every render
- [ ] Source toggle works both directions with no network call
- [ ] Museum original is verbatim
- [ ] Fallback to canonical text verified by disabling the API
- [ ] Loading states match Design Doc §10 with no full-screen blocking

**Backward-incompatible change**
The artifact screen changes from rendering canonical text directly to rendering through `resolveVariant()`. Migration task: route all canonical-text rendering added in Phase 3 through `resolveVariant()` and delete the direct read, so a single code path governs the fallback.

---

## Phase 7 — Fidelity verification and fallback

**1. Objective**
Prove per-claim that no museum fact was lost or contradicted, and make failure revert the reader to the museum's own words.

**2. Features to build**
- Fidelity badge showing claim coverage
- Fidelity report sheet listing per-claim status
- Transformation changelog surfaced in the same sheet
- Designed failure state that reverts to canonical text

**3. Technical tasks**
1. Author `prompts/verify.md`: a strict auditor prompt that reports findings only and performs no repair, per spec §6 Template 8.
2. Implement `app/api/verify/route.ts` (POST) accepting `{ artifactId, variant }` and returning a `FidelityReport` with per-claim `status` and supporting `span`.
3. Call the model at temperature 0 for determinism.
4. Implement verdict logic: `fail` if any claim is `contradicted` or any `must_include` claim is `omitted`; `unverified` when no claim ledger exists; otherwise `pass`.
5. Build `components/FidelityBadge.tsx` with three states — pass (`verified` colour, check icon, "N of N museum facts preserved"), fail (`flagged` colour, warning icon, "Check failed — showing the museum's text"), unverified (grey, "Not verified").
6. Pair every badge state with both an icon and a text label; never convey state by colour alone.
7. Build `components/FidelityReportSheet.tsx` (B2) listing each claim with its status and matching span, plus the `changelog.operations` list.
8. Extend `resolveVariant()` so a `fail` verdict returns canonical text instead of the variant, with a notice banner.
9. Build `components/NoticeBanner.tsx` as one left-ruled component, severity-varied by colour token.
10. Add a `Checking…` neutral badge state; never render green optimistically before the verification returns.
11. Add a development-only mechanism to force a `fail` verdict on one artifact so the failure state can be demonstrated deliberately.
12. Verify the forced-failure path end to end.

**4. Dependencies**
- Phase 2 (claim ledgers — the phase cannot function without them).
- Phase 5 (variant generation).
- Phase 6 (`resolveVariant()` as the single fallback path).
- Spec document §6 Template 8.

**5. Testing requirements**
- Manual: verification run against all six artifacts across all personas; every `must_include` claim marked covered.
- Manual: zero contradictions across the full set. Any contradiction blocks phase completion.
- Manual: an artifact with its claim ledger removed shows the unverified state, not a green badge.
- Manual: forced failure reverts the visible text to canonical and shows the notice banner.
- Manual: report sheet spans actually appear in the rendered variant text.
- Accessibility: badge state is announced to screen readers via text, not colour; sheet is keyboard-operable.
- Manual: verify determinism by running verification twice on the same variant and comparing verdicts.

**6. Completion criteria**
- [ ] Badge green on all six artifacts across all personas
- [ ] Report sheet lists every claim with status and span
- [ ] Changelog operations visible in the sheet
- [ ] Forced failure reverts to canonical text with a notice
- [ ] Unverified state renders correctly when no ledger exists
- [ ] No badge state relies on colour alone

**Scope/Trade-offs**
This is the highest-value phase in the plan. If the schedule slips, cut a persona or an artifact rather than any part of this phase.

---

## Phase 8 — Accessibility mode and read-aloud

**1. Objective**
Deliver a screen-reader-first rendering that describes the object before interpreting it, plus browser-native read-aloud.

**2. Features to build**
- Accessibility mode that reorders the artifact screen
- Visual-description-first section
- Read-aloud playback
- Sensitivity notice interstitial

**3. Technical tasks**
1. Add a section-reordering branch to the artifact page: when `accessibility` is on, render image → title → "What this object looks like" → attribution → interpretation.
2. Source the visual description from `curatorAltText`; when absent, render the section with the explicit statement that no visual description was provided, and never infer appearance from the title.
3. Add the accessibility persona rules to `persona-rules.json`: grade 6–8, one idea per sentence, no layout-relative language, object-relative spatial terms only.
4. Build `components/ReadAloudButton.tsx` using the browser `speechSynthesis` API with play and stop only.
5. Hide the read-aloud button when `speechSynthesis` is unsupported rather than showing a disabled control.
6. Emit `highContrastHints` key terms from the accessibility variant and render them as weight emphasis, not colour.
7. Build `components/SensitivityNotice.tsx` (B3) as an interstitial that blocks content until acknowledged, rendering `contentNoticeText` verbatim.
8. Wire B3 to trigger automatically on artifacts with a non-empty `sensitivityFlags` array.
9. Audit the artifact screen for semantic structure: one h1, sequential h2s, ordered lists for look-closer, landmark regions.
10. Verify the full page operates at 200% OS text scaling with no horizontal scroll.

**4. Dependencies**
- Phase 6 (variant rendering and section structure).
- Phase 2 (`curatorAltText` and `contentNoticeText` authored).
- Design Document §6 (accessibility reordering), §4 (components 10, 11).

**5. Testing requirements**
- Accessibility: full artifact screen navigated with VoiceOver or TalkBack on a real device; visual description is announced before interpretation.
- Accessibility: automated axe or Lighthouse pass with zero critical violations.
- Manual: 200% text scaling produces no horizontal scroll or clipped content.
- Manual: read-aloud starts and stops; button is hidden where unsupported.
- Manual: sensitivity notice blocks content and renders the museum's notice text verbatim.
- Manual: no meaning conveyed by colour alone anywhere on the screen.

**6. Completion criteria**
- [ ] Accessibility mode reorders sections correctly
- [ ] Visual description present on all six artifacts, including the no-description fallback
- [ ] Screen-reader pass completed on a real device
- [ ] Zero critical axe violations
- [ ] 200% text scaling verified
- [ ] Read-aloud functional with graceful absence

**Scope/Trade-offs**
Read-aloud is the cheapest item to cut here; the section reordering is the substantive accessibility feature and must be retained. Sensitivity notice (tasks 7–8) is only required if a flagged artifact is in the seed set.

---

## Phase 9 — Pre-generation, static switch, and demo hardening

**1. Objective**
Freeze all variants to committed static data so the demo carries no live API dependency, then harden and rehearse the demo.

**2. Features to build**
- Instant variant delivery from static data
- Offline-tolerant behaviour
- Optional add-artifact screen demonstrating the live generation path

**3. Technical tasks**
1. Write `scripts/generate.ts` looping every artifact × audience × depth, calling `/api/muse` then `/api/verify`, and writing `data/variants.json` keyed by `{artifactId}:{audience}:{depth}`.
2. Run the script and manually review all fidelity reports; correct prompts and regenerate until every verdict is `pass`.
3. Commit `data/variants.json` to the repository.
4. Modify `resolveVariant()` to read from the committed static import first and call the API only when a key is absent.
5. Remove or feature-flag the client-side call to `/api/muse` on the artifact screen so the demo path performs no network request.
6. Verify the entire collection renders correctly with the device in airplane mode after first load.
7. Implement the offline notice banner: "You're offline. Showing saved versions."
8. Add the forced-failure demo trigger as a stable, repeatable action rather than a code edit.
9. *(Optional, cut first if behind)* Build `app/add/page.tsx` (S3): a single-column form for museum name, title, image URL, canonical description, and claim lines, with a Generate button calling the live endpoint and a per-persona progress line.
10. Run `npm audit` once and address any critical finding.
11. Deploy the final build and re-verify on the physical demo device over a phone hotspot.
12. Record a full screen capture of the complete demo flow and store it locally.

**4. Dependencies**
- Phases 5, 6, 7, and 8 complete.
- Demo device and hotspot available for testing.

**5. Testing requirements**
- Manual smoke checklist, run twice on the deployed URL:
  - all personas render on all artifacts
  - fidelity badge green everywhere
  - forced failure reverts to museum text
  - source toggle works both directions
  - accessibility mode reorders sections; read-aloud speaks
  - loads on a real phone at 320px width
- Manual: airplane-mode test after first load.
- Manual: full demo script rehearsed end to end on the demo device, twice.
- Security: confirm `/add`, if built, is removed or gated after judging so the unauthenticated live endpoint cannot be abused.
- Performance: artifact screen renders in under three seconds on a phone hotspot.

**6. Completion criteria**
- [ ] `data/variants.json` committed with a passing verdict for every entry
- [ ] Artifact screen makes no network request on the demo path
- [ ] Airplane-mode test passes
- [ ] Forced-failure demo trigger works repeatably
- [ ] Full smoke checklist passed twice on the deployed URL
- [ ] Demo rehearsed twice on the demo device
- [ ] Screen capture backup recorded and stored locally
- [ ] `npm audit` critical findings resolved

**Backward-incompatible change**
The application switches from live generation to static variant reads. Migration task: keep `resolveVariant()` as the single entry point so the switch is a one-function change, and confirm the live path still works on `/add` after the switch.

**Scope/Trade-offs**
Task 9 (`/add`) is the designated first cut. Removing it costs the live-generation demo moment but does not affect any completion criterion above it. Feature freeze applies after task 8 — no new features, bug fixes only.
