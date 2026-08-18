TECHNICAL REQUIREMENTS DOCUMENT — MUSE
Hackathon prototype · solo developer · 5–6 hours · single museum · no billing


CONFIRMED CONSTRAINTS
- Target: hackathon prototype only. Not a production system.
- Team: solo. All work is sequential — no parallel tracks.
- Tenancy: single museum, hard-coded. No multi-tenancy.
- Monetization: none.
- Users: judges and demo viewers. Real-user scale is not a design input.

CONSEQUENCE, STATED UP FRONT
The single most valuable architectural decision here is subtraction. No database,
no auth, no separate backend service, no container runtime, no queue, no CDN
config, no payments, no notifications. One Next.js app on Vercel reading static
JSON, with two API routes. Everything below follows from that.

WARNING — PRD CONFLICT
The PRD's hour-by-hour plan assumed 3–4 people on parallel frontend/backend/data
tracks. Solo execution is sequential and costs roughly 40% of that capacity.
Section Q re-scopes. Read it before you start coding.


================================================================================
A. PROJECT SUMMARY
================================================================================

Muse is a mobile-first web prototype that takes a museum's own artifact
description and re-voices it for the person reading — adult, child, specialist,
or screen-reader user — while proving that no factual claim was changed. Each
adapted version carries a mandatory attribution line, a one-tap toggle back to
the museum's verbatim text, and a fidelity badge showing per-claim coverage
against a curator-authored fact checklist. The prototype demonstrates six to
eight seeded artifacts from one museum, four reader personas, and a designed
failure state where a failed fidelity check reverts the visitor to the museum's
original words.


================================================================================
B. RECOMMENDED TECH STACK
================================================================================

Frontend framework
  Next.js 15 (App Router) + React + TypeScript
  Why: co-locates UI and API routes in one repo and one deploy — for a solo dev
  this removes an entire class of CORS, env, and deployment problems.
  Free tier: yes, open source; deploys free on Vercel Hobby.
  NOTE: this overrides the PRD's "Vite + separate serverless functions." Vite is
  faster for a team splitting frontend/backend. Solo, one app wins.

Styling
  Tailwind CSS
  Why: no CSS file management, no naming decisions at hour four.
  Free tier: open source.

Backend framework
  Next.js Route Handlers (same app, /app/api/*)
  Why: two endpoints do not justify a second service or repo.
  Free tier: included in Vercel Hobby.

Database
  NONE. Static JSON committed to the repo, imported at build time.
  Why: 6–8 records. A database is 45 minutes of setup for zero judge-visible
  value, and it introduces a live dependency that can fail on stage.
  Free tier: n/a — this is the free option.

Authentication
  NONE. No accounts in the product.
  Persona selection persists in sessionStorage.

Payments
  NONE. Out of scope.

Analytics
  Vercel Web Analytics (one line, optional) or nothing.
  Why: nobody judges a hackathon on funnel data. Skip unless free and instant.
  Free tier: included on Hobby.

File storage
  /public in the repo, for openly-licensed artifact images.
  Why: no bucket, no signed URLs, no CORS. Optimized automatically by next/image.
  Free tier: n/a.

Hosting / deployment
  Vercel (Hobby)
  Why: git push deploys, HTTPS and a shareable URL by default, server-side env
  vars keep the API key off the client.
  Free tier: generous and sufficient for a demo.

CI/CD
  Vercel's built-in git integration. No GitHub Actions.
  Why: a pipeline you have to debug at hour five is a liability.

Observability / error tracking
  Vercel function logs + browser console. No Sentry.
  Why: Sentry is right for production and wrong for a 5-hour build; the setup
  time buys nothing a judge will see.

LLM
  Anthropic API (Claude), server-side only, structured JSON output.
  Why: constrained/schema-shaped output removes response-parsing bugs, which is
  where LLM hackathon apps most often die.
  Cost: pay-as-you-go, negligible at this volume (see Q).


================================================================================
C. FRONTEND ARCHITECTURE
================================================================================

Structure: hybrid — Server Components for static content, Client Components for
interaction.
- Collection page and artifact page shells render on the server from imported
  JSON. Fast first paint, good for a phone on conference wifi.
- Persona selector, source toggle, fidelity sheet, and read-aloud are Client
  Components ("use client").
- Reason: everything except persona state is known at build time. Pre-rendering
  it means the demo works even if the API is unreachable.

State management: React useState + one Context for persona. No Redux, no Zustand.
- Persona shape: { audience, depth, accessibility } persisted to sessionStorage.
- Variant data is passed as props from the server, not fetched client-side.
- Reason: there are exactly two pieces of global state. A library is overhead.

Component hierarchy (mirrors the design doc's 11 components):

  app/layout          → Header (PersonaChip) + main
   ├─ page            → CollectionGrid → ArtifactCard[]
   └─ artifact/[id]   → ArtifactHeader (image, title, metadata)
                        ReadAloudButton
                        AttributionBlock          [always visible]
                        SourceToggle              [Muse | Museum original]
                        ExplanationBlock          → Section[]
                        LookCloserList
                        FidelityBadge             → opens FidelityReportSheet
      overlays        → ContextSheet, FidelityReportSheet, SensitivityNotice
      shared          → Sheet (one primitive, three uses), NoticeBanner, Skeleton

UI library: none — hand-rolled on Tailwind, plus Radix UI Dialog only if the
bottom sheet's focus trapping fights you. Reason: the design doc specifies a
distinctive editorial look; a component kit would be fought more than used. One
Sheet primitive serves all three overlays.

Build and testing:
- Build: Next.js default (Turbopack). No custom config.
- Testing: NO automated tests. This is a deliberate call for a 5-hour solo build
  — the correct substitute is a written manual smoke checklist run twice:
    [ ] all 4 personas render on all artifacts
    [ ] fidelity badge green everywhere
    [ ] rigged failure reverts to museum text
    [ ] source toggle works both directions
    [ ] accessibility mode reorders sections; read-aloud speaks
    [ ] loads on a real phone over hotspot at 320px width
- If you have spare time at 5:00, spend it rehearsing, not writing tests.


================================================================================
D. BACKEND ARCHITECTURE
================================================================================

API style: REST, two POST endpoints. Rationale: two operations. GraphQL and gRPC
are unjustifiable here.

Service boundaries: monolith — a single Next.js app. There is no MVP scale at
which splitting this helps.

Endpoints:
  POST /api/muse    { artifactId, persona } → variant JSON (see H)
  POST /api/verify  { artifactId, variant } → claim report JSON

Both are used at build time by the pre-generation script. At demo time the app
reads committed JSON; /api/muse is called live only from the optional add-artifact
screen.

Background jobs / queue: none. The "batch job" is a Node script you run manually
from your terminal (scripts/generate.ts) that loops artifacts × personas, calls
both routes, and writes data/variants.json. This is the single most important
implementation detail in this document — see Q.

Realtime: none required. Optionally stream the LLM response on the add-artifact
screen via the Anthropic SDK's streaming mode for demo texture. Not worth it if
you are behind schedule.

Deployment model: serverless (Vercel Functions), implicit. No Docker, no VM.
Set maxDuration on the API routes if a generation call approaches the default
function timeout.


================================================================================
E. DATABASE CHOICE
================================================================================

Recommended primary database: none.

Justification: the dataset is 6–8 artifacts, ~40 claims, and ~32 pre-generated
variants — a few hundred KB of static JSON, read-only at runtime, with no writes,
no queries, no concurrency, and no user data. Adding Postgres or Supabase costs
setup time, a network dependency during the demo, and a class of failures that
static imports simply do not have.

Specialized stores: none. No Redis (Vercel's edge cache and static imports cover
it), no search engine (8 items), no vector store (no retrieval in v1 — local
enrichment was explicitly cut in the PRD).

If the add-artifact screen must persist across page loads: use React state within
the session, or write to sessionStorage. Do NOT add a database for this.

Scalability and cost: static JSON served from Vercel's edge is effectively free
and faster than any database you could configure in the time available.

Migration note: when this becomes a product, the JSON shapes in F map 1:1 onto
Postgres tables (Supabase recommended then, for row-level security and generous
free tier). Design the JSON now so that migration is mechanical.


================================================================================
F. DATA SCHEMA
================================================================================

Two files under /data. Shapes are written so they map directly onto future tables.

data/artifacts.json — array of Artifact

  Artifact {
    id                  string      "art-001"          [PK]
    museumName          string
    title               string
    imageUrl            string      "/images/art-001.jpg"
    curatorAltText      string      required for accessibility mode
    period              string
    material            string
    culture             string
    provenanceLine      string      verbatim; never paraphrased by the LLM
    canonicalText       string      120–200 words; the source of truth
    sensitivityFlags    string[]    [] | ["contested_provenance", ...]
    contentNoticeText   string|null
    claims              Claim[]     4–6 per artifact
  }

  Claim {
    id                  string      "c1"               [PK within artifact]
    text                string      one atomic fact, hand-written
    type                string      material|date|provenance|function|attribution
    criticality         string      "must_include" | "optional"
    hedge               string|null "circa" | "attributed_to" | null
  }

data/variants.json — object keyed by composite id, generated by the script

  key = `${artifactId}:${audience}:${depth}`      e.g. "art-001:child:standard"

  Variant {
    artifactId          string      → Artifact.id            [FK]
    persona             { audience, depth, accessibility }
    attribution         string      "Based on the museum-provided description by X."
    aiDisclosure        string
    tags                { tone, level, tier }
    readingTimeSeconds  number
    sections            [{ heading, body }]
    lookCloser          string[]    length 2, or []
    glossary            [{ term, plainDefinition }]
    changelog           { operations[], claimsCovered[], claimsOmitted[] }
    fidelity            FidelityReport
  }

  FidelityReport {
    verdict             string      "pass" | "fail" | "unverified"
    covered             number
    total               number
    claims              [{ id, status, span }]   status: covered|omitted|contradicted
  }

Relationships (textual ER):
  Artifact 1 ──< Claim              (composition; claims live inside the artifact)
  Artifact 1 ──< Variant            (via artifactId; ~4 variants per artifact)
  Variant  1 ──1 FidelityReport     (embedded)
  FidelityReport 1 ──< ClaimStatus  (one per Claim, referenced by claim id)

Indexes: none needed. Build a Map keyed by the composite variant key at module
load if lookup ever feels slow — it will not at this size.

Authoring note: write the claims by hand. LLM-extracting them saves ~20 minutes
and puts a failure mode inside the exact component the entire pitch rests on.


================================================================================
G. AUTHENTICATION FLOW
================================================================================

Not applicable. The prototype has no accounts, no sign-up, no sign-in, no password
reset, no email verification, no OAuth, no sessions, no tokens, and no RBAC/ABAC.

- Visitors are anonymous. Persona lives in sessionStorage, is not PII, and is
  never transmitted to a server.
- The add-artifact screen is unprotected. Acceptable because the deployment is a
  demo URL, the data is not persisted server-side, and nothing is at risk. Do NOT
  carry this forward past the hackathon.

Production migration note (out of scope, recorded for the roadmap slide):
Supabase Auth with magic links for curators, RLS scoped by museum_id, no visitor
accounts at all. Visitors should never need to log in to read a label.


================================================================================
H. APIS AND INTEGRATIONS
================================================================================

Feature → API mapping

  Feature (PRD)              Endpoint / data source
  -------------------------  --------------------------------------------------
  F1 Artifact records        data/artifacts.json (static import, no endpoint)
  F2 Persona selector        client state only; no network call
  F3 Muse personalization    POST /api/muse   (build-time; live on /add only)
  F4 Attribution & original  rendered from artifact.canonicalText + variant
  F5 Fidelity check          POST /api/verify (build-time; embedded in variant)
  F6 Accessibility mode      same variant data, reordered client-side

POST /api/muse
  Request : { artifactId, persona: { audience, depth, accessibility } }
  Response: Variant (minus fidelity)
  Server  : loads artifact, composes prompt from prompts/persona-rules.json,
            calls Anthropic with temperature 0.3 and a JSON output schema.

POST /api/verify
  Request : { artifactId, variant }
  Response: FidelityReport
  Server  : temperature 0, compares each claim against the variant text.
            Returns findings only; performs no repair.

Design considerations (right-sized for a prototype):
- Versioning: none. Single client, single deploy.
- Pagination: none. 8 artifacts.
- Rate limiting: none needed at demo scale, but the routes are unauthenticated
  and call a paid API. Mitigate cheaply: keep the live path only on /add, and
  unpublish or password-gate /add after the demo.
- Validation: check artifactId exists and persona.audience is in the allowed set
  before calling the LLM. Ten lines, prevents the two realistic failures.
- Errors: return 200 with { status: "fallback", reason } rather than a 5xx, so
  the UI can render the museum's original text as a designed state, not an error.

Third-party integrations:
  Anthropic API — the only one. Mandatory.
  Google Fonts  — Source Serif 4 + Inter, via next/font (self-hosted at build,
                  so no runtime third-party request).
  Everything else (Stripe, Auth0, Twilio, SendGrid, Segment) — not applicable.


================================================================================
I. PAYMENTS
================================================================================

Not applicable. No billing, no subscriptions, no one-time charges, no Stripe, no
webhooks, no PCI scope. The prototype never touches payment data, which keeps it
entirely outside PCI DSS.

Recorded for the roadmap only: if this becomes a museum SaaS, Stripe Billing with
per-institution subscriptions and a webhook handler for subscription lifecycle
events is the conventional choice. Do not build any of it now.


================================================================================
J. ANALYTICS
================================================================================

Recommendation: instrument nothing, or add Vercel Web Analytics as a one-line
import. There is no user base to learn from in six hours, and judges do not
evaluate event pipelines.

If you want one signal for the pitch, log to console (not a service):
  persona_selected, artifact_viewed, source_toggled_to_original,
  fidelity_report_opened, read_aloud_started

Privacy: capture no IP, no device fingerprint, no persona data server-side.
Persona is inferred from three taps and stays in sessionStorage — the prototype
collects zero personal data, which is the correct posture given the child persona
(see N).


================================================================================
K. FILE STORAGE
================================================================================

Solution: images committed to /public/images/, served by Vercel's CDN and
optimized by next/image.

- URL strategy: /images/{artifactId}.jpg — predictable, matches the JSON.
- Signed uploads: not applicable, no user uploads.
- Virus scanning: not applicable.
- Preview generation: not applicable; next/image handles resizing and format
  negotiation automatically. Set width/height or aspect-ratio to prevent layout
  shift, per the design doc.
- Licensing: use openly-licensed images only. Several museums publish open-access
  collection images; verify each licence and record it in the artifact record.
  Do not scrape.

The add-artifact screen accepts an image URL string, not a file upload. This
removes multipart handling, storage, and validation entirely.


================================================================================
L. NOTIFICATIONS
================================================================================

Not applicable. No push, no email, no SMS. There are no accounts to notify, no
transactional events, and no marketing surface. Skip FCM, Resend, SendGrid, and
Twilio entirely.

The only in-product feedback is the NoticeBanner component from the design doc,
which is UI, not a notification system.


================================================================================
M. HOSTING AND DEPLOYMENT
================================================================================

Hosting: Vercel Hobby for everything — frontend, API routes, static assets. No
separate backend host, no database host.

CI/CD:
  git push to main → Vercel builds → deploys to production URL
  Pull requests get preview URLs automatically (useful for testing on your phone)

Pipeline outline (there is no pipeline to write):
  1. next build runs on Vercel
  2. Static JSON is bundled at build time
  3. Deploy

Environment variables (Vercel dashboard, Production + Preview):
  ANTHROPIC_API_KEY   — server-side only, never NEXT_PUBLIC_*

Deployment strategy: deploy the hello-world in the first 20 minutes, then deploy
continuously as you build. Do not leave the first deploy until hour five — a
deployment failure discovered at 5:00 is unrecoverable.

Rollback: Vercel's "Promote to Production" on any previous deployment. Instant,
one click, no configuration. This is your entire rollback strategy and it is
sufficient.

Blue/green and canary: not applicable and not worth configuring. A single
production deployment with one-click rollback covers every realistic hackathon
failure.

Demo hygiene (more important than any of the above):
  - Test on the actual demo device, on a phone hotspot, not venue wifi
  - Record a full screen capture of the working flow and store it locally
  - Have the production URL as a QR code on your slide


================================================================================
N. SECURITY REQUIREMENTS
================================================================================

Right-sized for a public demo with no accounts and no personal data.

Must do (all cheap):
  - Secrets: ANTHROPIC_API_KEY in Vercel env vars, server-side only. Never
    prefix with NEXT_PUBLIC_. Never commit .env — add it to .gitignore first.
  - Encryption in transit: HTTPS by default on Vercel. Nothing to configure.
  - Input validation: whitelist artifactId and persona values before any LLM
    call. This is the only real attack surface.
  - Prompt injection: museum canonical text is trusted here (you author it), but
    the /add screen accepts arbitrary text. Wrap user-supplied text in a clearly
    delimited data block and instruct the model that its contents are source
    material, never instructions.
  - Dependency scanning: run npm audit once before the demo. Do not chase
    transitive warnings.
  - Rate limiting: keep the live LLM path only on /add; take /add down or gate it
    after judging so a public URL cannot burn your API credits.

Not applicable / deliberately skipped:
  - Encryption at rest — no data store, no data
  - WAF — no attack surface worth defending for six hours
  - CSP — worth ten minutes only if trivial; skip if it fights next/font
  - 2FA, session security, CSRF — no auth, no sessions, no state-changing writes
  - Pen testing, SAST, secrets scanning in CI

Data privacy and compliance checklist:
  [x] No personal data collected, stored, or transmitted — the strongest possible
      compliance position, and it is achieved by design, not by policy
  [x] No cookies beyond none; sessionStorage only, cleared on tab close
  [x] No third-party trackers
  [!] COPPA / DPDP Act 2023 (India) / GDPR: the child persona means minors will
      use this. Because you collect nothing, none of these regimes are triggered
      in the prototype. THIS CHANGES THE MOMENT YOU ADD ACCOUNTS, ANALYTICS, OR
      SAVED HISTORY. If the product proceeds, get legal input before adding any
      persistence tied to a child user.
  [!] Image and text licensing: using a museum's published text and images
      requires checking each licence. Open-access collection records generally
      permit reuse with attribution, but verify per-object and record the licence
      in the artifact record. This is a real legal constraint, not a formality.
  [!] Cultural sensitivity: if you seed a sensitivity-flagged artifact, use real
      museum-published provenance language verbatim. Do not write your own
      account of a contested acquisition.


================================================================================
O. SUGGESTED FOLDER STRUCTURE
================================================================================

One repo. No frontend/backend split — that split is what Next.js exists to avoid.

  muse/
  ├─ app/
  │  ├─ layout.tsx              root layout, fonts, Header, PersonaProvider
  │  ├─ page.tsx                S1 Collection (Server Component)
  │  ├─ artifact/[id]/page.tsx  S2 Artifact (Server Component; loads variant)
  │  ├─ add/page.tsx            S3 Add artifact (stretch goal — cut if behind)
  │  ├─ not-found.tsx           S4
  │  └─ api/
  │     ├─ muse/route.ts        POST — generate a variant
  │     └─ verify/route.ts      POST — fidelity check
  ├─ components/
  │  ├─ ArtifactCard.tsx
  │  ├─ PersonaChip.tsx
  │  ├─ ContextSheet.tsx        B1
  │  ├─ AttributionBlock.tsx
  │  ├─ SourceToggle.tsx
  │  ├─ ExplanationBlock.tsx
  │  ├─ LookCloserList.tsx
  │  ├─ FidelityBadge.tsx
  │  ├─ FidelityReportSheet.tsx B2
  │  ├─ SensitivityNotice.tsx   B3
  │  ├─ ReadAloudButton.tsx
  │  └─ ui/Sheet.tsx            one primitive, three uses
  ├─ lib/
  │  ├─ personas.ts             persona type + resolution order
  │  ├─ variants.ts             lookup by composite key, with fallback
  │  └─ anthropic.ts            client wrapper, schema, retry-once
  ├─ prompts/
  │  ├─ policy.md               the immutable rules block
  │  ├─ persona-rules.json      length, grade, tone, structure per persona
  │  └─ verify.md               the fidelity-audit prompt
  ├─ data/
  │  ├─ artifacts.json          hand-authored, with claim ledgers
  │  └─ variants.json           GENERATED — committed, do not hand-edit
  ├─ scripts/
  │  └─ generate.ts             batch pre-generation; run manually
  ├─ public/images/
  └─ package.json

Notes on what belongs where:
- prompts/ is separate from code so you can iterate persona voice without
  touching components. This is the file you will edit most between hours 2 and 4.
- data/variants.json is a build artifact that is deliberately committed. That is
  unusual and correct: it is what makes the demo independent of the API.
- lib/variants.ts must fall back to the artifact's canonicalText whenever a
  variant is missing or its fidelity verdict is "fail". Put that logic in one
  place so the fallback cannot be forgotten in a component.


================================================================================
P. KEY TECHNICAL DECISIONS AND TRADE-OFFS
================================================================================

1. Pre-generate all variants; serve static JSON
   Pro: removes latency, API flakiness, rate limits, and non-determinism from the
        demo — the largest single cause of hackathon demo failure.
   Con: content is frozen; changing a prompt means re-running the script (~2 min).
   Migration: swap the static import for a cache-read; the code path is identical.

2. Next.js monolith instead of Vite + separate API (overrides the PRD)
   Pro: one repo, one deploy, one env config; server-side key handling is free.
   Con: slightly slower dev server than Vite; less clean if a team later splits.
   Migration: API routes lift out to standalone functions with minimal change.

3. No database
   Pro: eliminates setup time, a runtime dependency, and a demo failure mode.
   Con: no persistence for anything created during the demo.
   Migration: the JSON shapes in F map 1:1 onto Postgres tables. Supabase when
   the time comes, for RLS and a generous free tier.

4. No automated tests; manual smoke checklist instead
   Pro: buys roughly an hour, which is 20% of the budget.
   Con: regressions are caught by eye. Genuinely risky if you refactor late.
   Mitigation: freeze features at 4:35 and only fix bugs after that.

5. Hand-written claim ledgers rather than LLM extraction
   Pro: removes a failure mode from the component the entire pitch depends on.
   Con: ~50 minutes of typing, the largest single non-code task.
   Mitigation: author the content before the clock starts if the rules allow.

6. Fidelity check as a second LLM call, not a rule-based checker
   Pro: works on paraphrase, which substring matching cannot; ~30 minutes to build.
   Con: the verifier can itself be wrong; temperature 0 reduces but does not
        remove this.
   Mitigation: you author both the claims and the canonical text, so verify all
   32 reports by eye during pre-generation. At this scale that is feasible and it
   is also your QA.

7. Errors return 200 with a fallback payload, not 5xx
   Pro: makes "show the museum's text" a designed state rather than an error page,
        which is exactly the product's thesis.
   Con: unconventional; would need revisiting for a public API.

8. Accessibility mode kept in scope despite solo constraints
   Pro: ~25 minutes, and it is a genuine differentiator most teams will skip.
   Con: 25 minutes is 8% of the budget.
   Recommendation: keep it. Cut the /add screen instead (see Q).

9. No error tracking or analytics
   Pro: saves setup; Vercel logs cover the realistic failure cases.
   Con: a silent client-side failure during judging would be hard to diagnose live.
   Mitigation: the recorded screen capture is your real insurance.

10. Single hard-coded museum
    Pro: no tenancy model, no museum switcher, no data scoping.
    Con: the attribution line is effectively a constant.
    Migration: museumId on the artifact record already; add a museums table later.


================================================================================
Q. EFFORT AND COST ESTIMATE
================================================================================

Effort — re-scoped for solo, sequential execution (the PRD's plan assumed 3–4
people in parallel and is not achievable alone).

  Time     Task                                                        Cumulative
  -------  ----------------------------------------------------------  ----------
  0:00     Scaffold Next.js + Tailwind, push, DEPLOY hello-world        0:20
  0:20     Author 6 artifacts: text, metadata, claim ledgers, images    1:10
  1:10     S1 Collection + S2 Artifact rendering statically from JSON   1:40
  1:40     /api/muse + prompts/ + persona-rules; test via curl alone    2:30
  2:30     Wire PersonaChip + ContextSheet; sections render per persona 3:00
  3:00     /api/verify + FidelityBadge + report sheet + fail fallback   3:40
  3:40     AttributionBlock, SourceToggle, notice banner, visual polish 4:10
  4:10     Accessibility mode + read-aloud                              4:35
  4:35     RUN generate.ts → commit variants.json → switch to static    5:00
  5:00     Rehearse on the demo phone; record screen capture backup     5:30
  5:30     Buffer — bug fixes only, no new features                     6:00

  In developer-hours: frontend ~2.5, backend/LLM ~1.7, content ~0.9,
  demo prep ~0.5. Total ~5.6 hours with 24 minutes of slack. That is thin.

  CUT LIST, in the order to cut, if you fall behind:
    1. /add artifact screen (S3)         saves ~40 min — cut this first
    2. Sixth through eighth artifacts    saves ~20 min — four is enough to demo
    3. Read-aloud button                 saves ~15 min — keep the reordering
    4. Fourth persona (specialist)       saves ~15 min — three still shows range
  Never cut: attribution block, source toggle, fidelity badge, fail fallback.
  Those four are the product.

  PRE-WORK, if the rules allow anything before the clock starts: write the six
  artifact records and claim ledgers. It is the largest non-code task, requires
  no repo, and moves you an hour ahead.

Cost — approximate, small scale:

  Vercel Hobby              $0
  Static JSON + images      $0
  Google Fonts (self-hosted at build)  $0
  Anthropic API             pay-as-you-go. Roughly 32 generations plus 32
                            verifications, each a short prompt and a short
                            completion, run perhaps 3–4 times as you iterate on
                            prompts. This is a very small number of tokens; expect
                            a few dollars at most for the whole build. Check
                            current per-token pricing on Anthropic's site rather
                            than budgeting from an estimate here.
  ---------------------------------------------------------------------------
  Monthly running cost after the hackathon, if left deployed and unused:
  $0 on the free tiers, since the demo serves static content.


================================================================================
R. OPEN QUESTIONS AND ASSUMPTIONS
================================================================================

Assumptions made:
  1. You have an Anthropic API key with credit available before the clock starts.
  2. You are comfortable with React and TypeScript. If you are not, cut the /add
     screen and the fourth persona immediately and add an hour to the frontend
     tasks.
  3. Judging is live from your own device on your own network connection.
  4. Artifact images and text come from an open-access museum collection whose
     licence permits reuse with attribution, or are clearly labelled as synthetic.
  5. The prototype will not be left publicly deployed with an open /add endpoint
     after judging.
  6. English only. No translation in scope.

Follow-up questions:
  1. Do you already have the museum content chosen? This is the 50-minute task
     and the only one with no shortcut. If not, pick the source before anything
     else — it gates the whole build.
  2. Can you do content authoring before the official start? Changes the schedule
     from "thin" to "comfortable."
  3. Is /add (live generation on stage) important to your pitch, or is the
     recorded pre-generated flow sufficient? It is the first thing on the cut list
     and I would like to know if that is wrong.
  4. Are you seeding a sensitivity-flagged artifact? It is the strongest maturity
     signal in the demo but adds the B3 interstitial and requires real, carefully
     sourced provenance text — roughly 20 extra minutes plus research.
  5. Does the hackathon mandate a specific stack, cloud provider, or sponsor API?
     Any mandate overrides section B entirely.
  6. Do you need the repo to be judged for code quality, or only the demo? If code
     is judged, add back a minimal test file and a real README, and cut a persona
     to pay for it.
