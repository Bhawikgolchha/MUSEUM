# PRD — Muse: Adaptive Museum Interpretation
### Hackathon prototype spec · 5–6 hour build window

---

## 1. Title & elevator pitch

**Muse** — a digital museum layer that re-voices a museum's own artifact description for whoever is reading it — a child, a local, a scholar, a screen-reader user — **without changing a single fact.**

---

## 2. Product overview

Museums write one description per object; every visitor reads the same wall text. Muse takes the museum's canonical description plus metadata and renders audience-adapted versions on demand. The museum's text stays immutable and one tap away — Muse only changes tone, depth, vocabulary, and framing. A visible fidelity check shows which of the museum's factual claims survived into each version. The value proposition: **personalization curators can actually trust**, because fidelity is demonstrated, not promised.

---

## 3. Problem statement

- **One label, many audiences.** A single description is written at roughly one reading level. It over-serves the specialist and loses the 10-year-old, the non-native speaker, and the casual visitor. *(Assumption, based on standard museum practice of a single interpretive label per object.)*
- **Curators won't hand their scholarship to a black box.** The blocker to AI interpretation isn't capability — it's the risk of an AI silently inventing a date, dropping a hedge ("attributed to"), or softening contested provenance. Any tool without a fidelity guarantee is unshippable in a museum.
- **Accessibility is retrofitted.** Screen-reader users typically get alt text plus the same dense label, not a version structured for listening.
- **Local relevance is lost.** A visitor from the same region has context the label never uses.

---

## 4. Target users

| Persona | Role & goal | Key pain point | Tech-savvy | Platform |
|---|---|---|---|---|
| **Priya, 34 — local visitor** | Weekend museum-goer; wants to understand objects without a background in art history | Labels assume knowledge she doesn't have; she skims and moves on | Medium | Mobile web (on-site, own phone) |
| **Arjun, 10 — child visitor** (with parent) | Wants to find something cool; parent wants him engaged | Nothing is written for him; parent ends up improvising | Low (parent-mediated) | Mobile web |
| **Dr. Rao, 52 — curator / education officer** | Publishes the collection online; wants reach without misrepresentation | Cannot verify what an AI changed; won't risk institutional credibility | Medium-high | Desktop web |
| *(Secondary)* **Meera, 28 — screen-reader user** | Wants the object described before it's interpreted | Alt text ≠ explanation; layout-dependent prose breaks in TTS | High | Mobile/desktop web + screen reader |

**Primary platform: responsive web.** No app install at a museum; a QR code must open instantly.

---

## 5. Core features

### F1 — Artifact record + seeded collection · **Must-have**
Museum-side record holding image, canonical text, metadata, and a claim ledger.
- [ ] 6–8 artifacts seeded with image, title, museum name, canonical description (120–200 words), period, material, provenance line
- [ ] Each artifact has a hand-written **claim ledger**: 4–6 atomic must-include facts
- [ ] Minimal upload/paste form writes a new record (demonstrates the museum path)

### F2 — Visitor context selector · **Must-have**
Three-tap onboarding that resolves the reader into a persona.
- [ ] Taps: who's reading (adult / child / specialist) → depth (quick / standard / deep) → accessibility toggle
- [ ] Selection persists across artifacts in the session
- [ ] Switching persona re-renders the current artifact in place

### F3 — Muse personalization engine · **Must-have**
Closed-world LLM call that re-voices canonical text for the selected persona.
- [ ] One versioned prompt template + persona rules passed as data
- [ ] Structured JSON output (attribution, tags, sections, look_closer, changelog)
- [ ] Temperature ≤0.4; no facts outside canonical text
- [ ] Response renders in <3 s (or instantly from pre-generated cache)

### F4 — Attribution & "read the original" · **Must-have**
Provenance of the words themselves, always visible.
- [ ] Header line: *"Based on the museum-provided description by [Museum]"*
- [ ] AI-adaptation disclosure line
- [ ] One-tap toggle to the museum's verbatim text
- [ ] "How was this adapted?" chip listing the transformations applied

### F5 — Fidelity check badge · **Must-have** ← *the differentiator*
Visible proof that every museum fact survived.
- [ ] Second low-temperature call scores each ledger claim: covered / omitted / contradicted
- [ ] Badge shows **"6/6 museum facts preserved"**, expandable to per-claim detail
- [ ] Any contradiction → badge turns red and the UI falls back to the museum's original text

### F6 — Accessibility mode · **Optional for prototype** *(strongly recommended — it's a 30-min win)*
Screen-reader-first rendering.
- [ ] Visual description section renders **first**, before interpretation
- [ ] Semantic headings, linear reading order, no layout-relative language
- [ ] Browser `speechSynthesis` read-aloud button

---

## 6. User stories

| # | Story | Priority |
|---|---|---|
| 1 | As a **local visitor**, I want the explanation pitched at my level so that I don't give up after two sentences. | Must |
| 2 | As a **local visitor**, I want to switch depth mid-read so that I can go deeper on the objects I like. | Must |
| 3 | As a **parent**, I want a child-level version so that my 10-year-old stays engaged without me translating. | Must |
| 4 | As a **curator**, I want to see the museum's original text one tap away so that my institution's words are never replaced. | Must |
| 5 | As a **curator**, I want a per-claim fidelity report so that I can verify nothing was invented or dropped. | Must |
| 6 | As a **curator**, I want the system to fall back to my original text when the check fails so that a bad generation never reaches a visitor. | Must |
| 7 | As a **screen-reader user**, I want the object described before it's interpreted so that the meaning has something to attach to. | Must (if F6 in) |
| 8 | As a **specialist**, I want hedges and uncertainty preserved so that the version I read is still scholarly. | Must |
| 9 | As a **curator**, I want to paste in a new artifact and see variants generated so that I can picture using this on my collection. | Nice-to-have |
| 10 | As a **local visitor**, I want to see how this object connects to my city so that it feels relevant. | Nice-to-have |

---

## 7. MVP scope & implementation plan

### In scope, and why
**F1–F5, plus F6 if the clock allows.** This is the smallest set that demonstrates the actual thesis. F3 alone is a demo any team can build; **F5 is what makes it a product** — it converts "AI rewrites museum text" (scary) into "AI adapts museum text, provably" (shippable). Cut anything before cutting F4 or F5.

**Hard architectural call: pre-generate everything.** With 8 artifacts × 4 personas = 32 variants, generate them all in a script during hour 4, commit the JSON, and serve from it. Live generation is kept as a code path and shown once on the pasted-in artifact. This removes latency, API flakiness, and non-determinism from the demo — the single biggest cause of hackathon demo failure.

### Timeboxed plan (assumes 3–4 people working in parallel)

| Time | Track | Task |
|---|---|---|
| **0:00–0:30** | All | Repo, Vite + React + Tailwind, API key in env, **deploy a hello-world to Vercel now** (never debug deploys at hour 5). Agree on the artifact JSON schema. |
| **0:30–1:30** | Data | Write 6–8 artifact records: image, canonical text, metadata, hand-written claim ledger. Use openly-licensed images and real museum-published text where available, or clearly-labelled synthetic records. |
| **0:30–1:30** | Frontend | Collection grid → artifact detail shell. Persona selector component. Mobile-first layout. |
| **0:30–1:30** | Backend | `POST /api/muse` — prompt assembler + LLM call + JSON-schema-constrained output. Persona rules live in a separate `personas.json`. |
| **1:30–2:15** | FE + BE | Wire together. Loading state. Persona switch re-renders. Get one artifact rendering all four personas end to end. |
| **2:15–3:00** | Backend | `POST /api/verify` — Template-8-style claim audit. Returns per-claim status + verdict. |
| **2:15–3:00** | Frontend | Attribution header, AI-disclosure line, "read the original" toggle, "how was this adapted?" chip. |
| **3:00–3:45** | FE + BE | Fidelity badge UI + red-state fallback to canonical. Test the fallback deliberately by feeding a deliberately-broken variant. |
| **3:45–4:15** | Frontend | Accessibility mode (F6): visual-description-first ordering, semantic headings, `speechSynthesis` button. |
| **4:15–4:45** | All | **Run the batch pre-generation script.** Generate all variants + verify reports, commit as static JSON, switch the app to read from it. Deploy. |
| **4:45–5:15** | All | Demo rehearsal on the actual demo device and network. Screenshot fallback deck. |
| **5:15–5:30** | Buffer | Bug fixes only. No new features after 4:45. |

### Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Vite + React + Tailwind** | Fastest cold start; no framework ceremony; Tailwind means no CSS debates at hour 3 |
| Backend | **Vercel serverless functions** (or Next.js API routes if you prefer one app) | Zero infra; deploys with the frontend; keeps the API key server-side |
| LLM | **Claude API**, structured JSON output, `temperature 0.3` for generation / `0` for verification | Constrained decoding removes response-parsing bugs, which is where hackathon LLM apps usually die |
| Data | **Static JSON committed to the repo** (upgrade to Supabase only if the upload form needs persistence) | A database is the wrong bet in a 5-hour window; 8 records don't need one |
| Images | Openly-licensed images in `/public` | No storage layer, no signed URLs, no CORS |
| Hosting | **Vercel** | One command, works from a phone browser at the judging table |

**Assumption:** the team has an API key and at least one member comfortable with React. If not, cut F6 and add an hour to the frontend track.

---

## 8. Excluded from v1

| Excluded | Reason |
|---|---|
| **User accounts & login** | Persona selection in session state gets 100% of the demo value at 5% of the cost. Auth is a time sink with zero judge-visible payoff. |
| **Real museum upload pipeline** (bulk ingest, LIDO/CIDOC import, validation, image processing) | Days of work. A paste-in form proves the concept. |
| **Multilingual output** | Each language multiplies generation *and* QA. Cannot verify fidelity in a language nobody on the team reads — a fidelity claim you can't check is worse than no feature. |
| **Local landmark enrichment (T2)** | Needs a retrieval corpus and citation validation. Without those it's exactly the hallucination the product claims to prevent. Mention it in the roadmap slide instead. |
| **Curator review queue & workflow** | Multi-state workflow UI, ~2 hours, and it is not a visitor-facing demo moment. Show the fidelity report as the review *primitive* instead. |
| **Conversational follow-up Q&A** | Unbounded scope, unbounded failure modes, and it invites judges to try to break it live. |

---

## 9. Success criteria & demo plan

### Success criteria
1. **Four personas, one artifact, live persona switching** — visibly different text, no page reload.
2. **Fidelity check passes on every seeded artifact** — every must-include claim marked covered, zero contradictions, badge green across the collection.
3. **Fallback works on demand** — a deliberately broken variant triggers the red badge and reverts to museum text. *(Have this rigged as a demo step, not an accident.)*
4. **Attribution present and the original reachable in one tap** on every screen.
5. **Runs on a phone browser over conference wifi** in under 3 seconds per artifact.

*Deliberately excluded: user-satisfaction or engagement metrics. There are no users yet; inventing numbers weakens the pitch.*

### Demo script (4 minutes)

| Time | Beat |
|---|---|
| **0:00–0:30** | **The problem, on screen.** Open an artifact showing the museum's original label. "This is the only version that exists. It's written for one reader." |
| **0:30–1:30** | **Switch personas live.** Same object: adult → child → specialist. Let the judges watch the text change. Say once: *"Same facts. Different reader."* |
| **1:30–2:15** | **Open the fidelity badge.** "6 of 6 museum facts preserved" → expand to the per-claim list. **This is the beat that wins.** "Curators don't fear AI writing. They fear AI inventing. So we made it checkable." |
| **2:15–2:45** | **Break it on purpose.** Trigger the rigged bad variant. Badge goes red, UI reverts to the museum's text. "When we can't guarantee it, the visitor gets the museum's own words. Failure is safe." |
| **2:45–3:20** | **Accessibility mode.** Toggle on, hit read-aloud. Point out the object is *described* before it's interpreted. |
| **3:20–4:00** | **The museum side + roadmap.** Paste a new description → variants generate live. Close on one line: *"We didn't build a museum chatbot. We built the fidelity layer that lets museums say yes to one."* |

**Demo hygiene:** run from pre-generated JSON, demo device charged and tethered to a phone hotspot, screen-recording of the full flow saved locally as a fallback.

---

## 10. Risks & mitigation

| Risk | Mitigation |
|---|---|
| **LLM latency, rate limits, or an outage during judging** | Pre-generate all 32 variants into static JSON by hour 4:45. Live generation shown exactly once, on the paste-in form, with a recorded backup. |
| **Scope creep — the team starts building enrichment, translation, or Q&A** | Feature freeze at 4:45 is a stated rule from hour zero. Anything not in F1–F6 goes on the roadmap slide, which costs 2 minutes instead of 2 hours. |
| **Personas produce text that isn't visibly different, so the demo falls flat** | Test the persona contrast by hour 2:15, not hour 4. If adult and specialist read the same, the fix is in `personas.json` (length caps, vocabulary tier, structure), not in the app code — cheap to iterate. |

*Runner-up risk: the claim ledger is the demo's spine. Hand-write it for the seeded artifacts rather than extracting it with an LLM — 20 minutes of typing removes an entire class of failure.*

---

## 11. Questions for the team

1. **Which museum's content are we using?** Open-licensed collection (many museums publish open-access records), a partner's text, or clearly-labelled synthetic records? This affects whether we can show real provenance language.
2. **Do we have a curator or subject expert we can text during the build** to sanity-check one child-level and one specialist-level variant? Ten minutes of expert review is worth more than an hour of self-assessment.
3. **Team size and skill split** — how many on frontend vs. backend? The parallel plan in §7 assumes at least 2 frontend-capable people.
4. **Is the judging demo live on our device, on their machine, or a recorded video?** Determines how much we invest in the pre-generation path vs. deployment polish.
5. **Are we judged on the visitor experience, the museum-facing tooling, or the technical approach?** If it's the museum side, we promote the curator review primitive above accessibility mode.
6. **Does the hackathon require a specific stack, cloud provider, or sponsor API?** Changes the §7 recommendations immediately.
7. **Do we include a sensitivity-flagged artifact** (contested provenance) in the seed set? It's the strongest signal of product maturity but requires careful, real, non-invented text.

---

*Assumptions are marked inline. No usage, engagement, or market figures are asserted — none exist yet for this product.*
