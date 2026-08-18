# Digital Muse — Personalized Artifact Interpretation Layer
### Product & Engineering Specification v1.0

**Scope:** A museum-facing platform where institutions upload artifact records (image + canonical explanation + metadata), and an AI "Muse" renders that canonical content into audience-adapted explanations without altering the museum's factual claims.

**Core design axiom:** *The Muse re-voices; it does not re-write.* Museum text is the source of truth. Personalization is a **rendering layer** over an immutable canonical record — never a replacement for it.

**Audience for this document:** product managers, backend/ML engineers, prompt developers, design, and museum-partnerships leads.

---

## 1. Clarified Goals and Success Criteria

### 1.1 Problem restatement (disambiguated)

The original brief is ambiguous in three places. This spec resolves them as follows:

| Ambiguity | Resolution adopted |
|---|---|
| Does the AI *add* new facts (e.g., local landmark links)? | Only in an explicitly-flagged **Enrichment** tier, opt-in per museum, with inline sources. Default tier adds zero new facts. |
| Is generation real-time per user? | **No.** Pre-generated per *persona bucket*, cached. Real-time only for long-tail contexts and conversational follow-ups. |
| "Personalized" = per-individual or per-segment? | **Per-segment (bucketed)** by default. Individual-level signals only refine ranking/length, not factual content. This is the privacy-safe and cache-efficient choice. |

### 1.2 Primary user goals and success criteria

**A. Visitors**

| Goal | Measurable success criterion |
|---|---|
| Understand the artifact at my level without feeling talked down to | ≥70% "this was at the right level for me" on 1-tap feedback; ≤5% "too simple"/"too complex" combined at >15% skew for any persona |
| Read/listen without hitting a wall of text | Median completion rate ≥60% for the primary explanation block |
| Feel the artifact connects to something I know | ≥25% click-through on "related / nearby / see also" anchors for local-persona users |
| Trust what I'm reading | ≥85% of surveyed users correctly identify that content is museum-sourced and AI-adapted (attribution comprehension test) |
| Access content regardless of ability | 100% WCAG 2.2 AA conformance on the explanation surface; screen-reader task success ≥90% in moderated testing |

**B. Museum staff (curators, education officers)**

| Goal | Measurable success criterion |
|---|---|
| My scholarship is not distorted | **Zero** tolerance: contradiction rate against canonical claims = 0 in production; any confirmed incident is a P0 |
| I stay in control | 100% of variants reviewable pre-publish; per-museum toggle for auto-publish vs. mandatory review |
| Upload is not a burden | Median time-to-publish for one artifact ≤8 minutes (upload → validated → first variants generated) |
| I can see what the AI changed | 100% of variants carry a machine-readable transformation changelog + claim-coverage report |
| Curator effort scales | Curator edit rate (variants requiring manual correction) trends below 10% by month 3 |

**C. Platform admin / operations**

| Goal | Measurable success criterion |
|---|---|
| Cost-controlled generation | ≥85% cache hit rate; ≤0.15 LLM calls per artifact-view |
| Fast surfaces | p95 ≤400 ms cached delivery; p95 first-token ≤900 ms for on-demand generation |
| Auditability | 100% of published variants traceable to (canonical_version, prompt_version, model_version, reviewer) |
| Safety | 0 published variants on `restricted` artifacts without recorded community/curator sign-off |

### 1.3 Explicit non-goals (v1)

- Not a chatbot that answers arbitrary questions about the collection.
- Not a translation service of record (translations are assistive; canonical language remains authoritative).
- Not a replacement for wall labels or curator-authored gallery text.
- No generation of images, reconstructions, or "what it looked like" renderings of real artifacts.

---

## 2. Functional Requirements

### 2.1 Artifact ingestion (MUST)

**FR-1 — Upload formats**
- Images: JPEG, PNG, WebP, TIFF. Min 1200 px on long edge; max 50 MB. Up to 12 images per artifact (primary + detail + context shots).
- Bulk ingest: CSV/JSON manifest + image archive; and a **CIDOC-CRM / LIDO / Dublin Core** mapping importer for museums with existing collection-management systems (TMS, eHive, Axiell).
- Canonical text: plain text or restricted Markdown (headings, bold, italic, links only). Max 8,000 characters per language.

**FR-2 — Required metadata (upload blocked without these)**

| Field | Type | Notes |
|---|---|---|
| `artifact_id` | string | Museum-local accession number |
| `title` | string | As catalogued |
| `museum_name`, `museum_id` | string | Drives mandatory attribution line |
| `canonical_text` | text | The museum's own description — immutable once published |
| `canonical_language` | BCP-47 | e.g. `en-IN`, `hi-IN`, `kn-IN` |
| `culture_of_origin` | controlled vocab | Free-text fallback with review flag |
| `date_or_period` | structured | Supports ranges + circa + uncertainty flag |
| `material`, `dimensions` | structured | |
| `provenance_summary` | text | Required; may be "Provenance under research" |
| `sensitivity_flags[]` | enum[] | See §4.3 |
| `enrichment_consent` | enum | `none` \| `local_context` \| `full` — per-museum default, per-artifact override |
| `rights_statement` | RightsStatements.org URI | Governs image display and reuse |

**Optional but high-value:** `curator_notes` (never surfaced verbatim), `pronunciation_guide`, `alt_text` (curator-authored preferred), `geo_point` (for local anchoring), `related_artifact_ids`, `reading_level_of_canonical`, `content_warnings`.

**FR-3 — Metadata validation**
- Hard blocks: missing required fields, unreadable image, canonical text < 40 words, rights statement absent.
- Soft warnings (publish allowed, flagged in queue): no alt text, no geo point, culture-of-origin free-text, canonical text above grade 14 readability, detected uncertainty language without an uncertainty flag.

### 2.2 Canonical claim extraction (MUST — this is the keystone feature)

At ingest, the system decomposes `canonical_text` into an **atomic claim ledger**. This is what makes fidelity testable rather than aspirational.

```json
{
  "canonical_version": "cv_004",
  "claims": [
    {"id": "c1", "text": "<atomic factual statement>", "type": "attribution",
     "criticality": "must_include", "hedge": null},
    {"id": "c2", "text": "<atomic factual statement>", "type": "date",
     "criticality": "must_include", "hedge": "circa"},
    {"id": "c3", "text": "<atomic factual statement>", "type": "interpretation",
     "criticality": "optional", "hedge": "scholars_suggest"}
  ]
}
```

- Claim types: `material`, `date`, `provenance`, `function`, `attribution`, `interpretation`, `measurement`, `cultural_significance`.
- `criticality`: `must_include` (every variant must convey it) | `optional` (may be dropped for length) | `must_not_simplify` (hedges and uncertainty must survive verbatim in meaning).
- Extraction is LLM-assisted but **curator-confirmable**: the museum sees the ledger and can promote/demote criticality in the review UI. Confirmed ledgers are the QA oracle for §7.

**Hedge preservation rule:** if the canonical text says "probably," "attributed to," "circa," or "one interpretation suggests," the variant MUST retain equivalent epistemic hedging. Downgrading a hedge to a bare assertion is classified as a **contradiction**, not a style choice.

### 2.3 User context inputs

| Source | Attributes | Consent |
|---|---|---|
| Explicit onboarding (3-tap) | age band, language, "who's visiting" (solo / family / school group), depth preference | Primary path |
| Account profile | education level, interests, accessibility settings, home region | Opt-in |
| Device / session | OS accessibility flags (reduce motion, large text, screen reader), locale, coarse geo (city-level max) | System settings honored automatically; geo requires prompt |
| Behavioral | prior artifacts viewed, dwell time, expand/collapse of "more detail," feedback taps | Opt-in, session-scoped by default |
| QR / on-site beacon | gallery zone, museum-defined tour context | Implicit |

**Hard rule:** no inference of ethnicity, religion, caste, health status, or sexual orientation from any signal, ever — including as an intermediate variable. Nationality/region is used only for *language and landmark anchoring*, never to alter interpretive framing of a culture.

### 2.4 Personalization dimensions (the levers the Muse may pull)

Permitted: **tone/register**, **depth**, **length**, **vocabulary tier**, **analogy source**, **reference anchors** (local landmarks, comparable objects), **structure** (narrative vs. Q&A vs. bulleted), **language**, **modality** (text / audio-script / simplified / high-contrast), **entry hook** (what to notice first).

Forbidden as levers: the facts themselves, the hedges, the provenance framing, the attribution, sensitivity disclaimers, and the interpretation the museum endorses.

### 2.5 Transformation tiers

| Tier | Name | New facts allowed? | Use |
|---|---|---|---|
| **T0** | Verbatim | No | Canonical text shown as-is; always available via "Read the museum's original" |
| **T1** | Re-voicing | **No** — closed-world, canonical only | Default for all personas. Reorders, re-levels, re-tones, adds framing questions |
| **T2** | Local/contextual enrichment | Yes, restricted | Adds general context (period, geography, nearby landmarks) from an **approved retrieval corpus** only, each addition inline-cited and visually distinguished |
| **T3** | Conversational follow-up | Yes, restricted | User-initiated Q&A, T2 corpus + canonical, refuses out-of-scope |

T2/T3 require `enrichment_consent` ≠ `none`. Enriched sentences render in a distinct block labelled **"Wider context — not from the museum's description."**

### 2.6 Versioning, audit, and review workflow

**Versioning**
- `canonical_version` is immutable and append-only. Editing canonical text mints a new version and **invalidates all derived variants** (they move to `stale`, are dropped from cache, and re-enter the generation queue).
- `variant_version` = f(`canonical_version`, `persona_bucket`, `language`, `tier`, `prompt_version`, `model_version`, `policy_version`).
- Rollback: any published variant set can be reverted to a prior tuple in one action.

**Audit log (append-only, immutable, exportable)**
Every generation event records: timestamps, actor, canonical_version, prompt_version + full rendered prompt hash, model + params, seed/temperature, claim-coverage report, safety-classifier verdicts, reviewer identity and decision, publish/unpublish events.

**Review workflow (state machine)**

```
draft → validated → claims_confirmed → generating → auto_qa
   ↓ (fail)                                            ↓
 rejected ←──────── curator_review ←──────── flagged / sampled
                          ↓ approve
                      published → (canonical edit) → stale → regenerate
```

- **Mandatory human review** for: any artifact with a sensitivity flag, any T2/T3 output, any variant failing auto-QA, and 100% of a museum's first 20 artifacts (trust-building period).
- **Sampled review** thereafter: 10% random + 100% of low-confidence, adjustable per museum.
- Curators can **edit a variant directly**; edits are captured as preference data and surfaced as prompt-improvement suggestions (never auto-applied to prompts).

### 2.7 Transformation behavior contract (normative)

The Muse MUST:
1. Convey every `must_include` claim, with hedges intact.
2. Preserve attribution: named scholars, excavators, donors, communities of origin.
3. Preserve numerical values exactly; convert units additively (`30 cm (about 12 inches)`), never replacing.
4. Mark interpretation as interpretation ("curators believe," "one reading is").
5. Emit the attribution header and AI-adaptation disclosure.
6. Emit a machine-readable changelog of what it did.

The Muse MUST NOT:
1. Introduce any fact absent from canonical text (T1) or from cited retrieval (T2).
2. Resolve uncertainty, round dates, or collapse ranges.
3. Speak in the first person as the artifact, its maker, or a member of the culture of origin.
4. Add sensory, emotional, or narrative detail presented as historical fact ("the potter's hands trembled").
5. Remove sensitivity disclaimers or content warnings under any length constraint.
6. Alter provenance language — especially language about contested acquisition.

---

## 3. User Profiles and Context Attributes

### 3.1 Context attribute schema

```json
{
  "user_context": {
    "age_band": "under_12 | 12_17 | 18_29 | 30_59 | 60_plus | unknown",
    "language": "BCP-47",
    "language_confidence": 0.0,
    "region_relation": "local_city | same_state | same_country | international | unknown",
    "home_region": "ISO-3166-2 (coarse, opt-in)",
    "education_context": "primary | secondary | undergrad | postgrad | specialist | unknown",
    "domain_expertise": ["archaeology", "textiles", "none"],
    "interests": ["craft_technique", "daily_life", "trade", "religion", "art_history"],
    "visit_mode": "onsite | remote",
    "group_type": "solo | family_with_children | school_group | tour | unknown",
    "accessibility": {
      "screen_reader": false, "low_vision": false, "high_contrast": false,
      "cognitive_support": false, "captions_required": false,
      "reduce_motion": false, "audio_preferred": false
    },
    "depth_preference": "quick | standard | deep",
    "prior_interactions": {"artifacts_viewed": 0, "avg_dwell_s": 0, "expanded_detail_rate": 0.0},
    "consent": {"geo": false, "history": false, "profile": false}
  }
}
```

**Bucketing:** the above collapses into a `persona_bucket` key for caching:
`{persona}:{language}:{depth}:{a11y_profile}` — e.g. `local_adult:kn-IN:standard:default`.
Target: ≤24 pre-generated buckets per artifact for the top 90% of traffic; everything else generated on demand.

### 3.2 Canonical personas and adaptation rules

| Persona | Tone | Depth / length | Vocabulary | Analogies & anchors | Structure | Special rules |
|---|---|---|---|---|---|---|
| **P1 Child (8–11)** | Warm, curious, second person | 90–140 words, ~45 s read | Grade 3–5; ≤14-word sentences; every domain term defined in-line | Everyday objects, school, food, play | Hook question → 3 short paras → "Look closely for…" | No violence/death detail beyond a neutral one-line note; no scary framing; never mention monetary value |
| **P2 Teen / student (12–17)** | Direct, non-patronizing, slightly informal | 150–220 words | Grade 7–8; 2–3 domain terms, defined | Contemporary tech, media, sport, civics | Hook → how it was made/used → "why it still matters" → one open question | Include one "how we know this" line to model evidence reasoning |
| **P3 General adult (local)** | Conversational, confident | 180–260 words | Grade 8–10 | **Local landmarks, streets, festivals, regional craft traditions** (T2 only, cited) | Lead with local connection → object → significance | Local anchors must be verifiable and cited; if none available, degrade gracefully to P4 |
| **P4 General adult (international tourist)** | Welcoming, orienting | 180–260 words | Grade 8–10; no untranslated local idiom | Cross-cultural comparisons, world-historical timeline pegs | Orientation ("where this sits in the region's history") → object → significance | Include pronunciation guide for names; give date context in a globally legible frame |
| **P5 Older / deep-context visitor (60+ or `depth=deep`)** | Measured, essayistic | 300–420 words | Grade 10–12 | Historical parallels, period social context | Context → object → debate/uncertainty → further reading | Larger default type; **age is not a proxy for expertise** — depth is offered, never imposed; one-tap "shorter version" |
| **P6 Scholar / specialist** | Precise, unembellished | 350–500 words + structured data block | Unrestricted domain vocabulary | Comparanda, typologies, method | Description → technical detail → historiography → open questions → citations | Surfaces full metadata, provenance chain, bibliography; flags evidentiary gaps explicitly; **no simplification of hedges** |
| **P7 Accessibility: screen reader / low vision** | Clear, literal, front-loaded | 160–240 words | Grade 6–8 | Concrete, spatial | **Visual description first**, then meaning; semantic headings; linear reading order | No layout-dependent language ("on the left"→ use object-relative terms); numbers spelled for TTS clarity; alt text ≠ explanation, both required |
| **P8 Accessibility: cognitive / plain language** | Calm, simple, encouraging | 80–120 words | Grade 4–5; one idea per sentence; active voice | Familiar, present-day | Short sentences, one topic per line, optional icon cues | No idioms, metaphors, or sarcasm; no nested clauses; key term glossary chips |
| **P9 Family group** | Playful but informative, dual-register | 140–200 words + 1 "ask your grown-up/child" prompt | Grade 5–6 | Shared, intergenerational | Shared hook → fact both levels enjoy → one activity prompt | Must work read-aloud; avoid content requiring adult mediation without warning |
| **P10 Educator / school group** | Instructional | 200–300 words + teaching aids | Grade 8, curriculum-aligned | Curriculum topics | Explanation → 3 discussion questions → 1 activity → curriculum tags | Never asserts curriculum alignment beyond museum-provided mapping |

**Persona resolution order:** explicit user choice > accessibility system flags (always applied, additively) > onboarding answers > device/session signals > `P4 general adult` default.

**Accessibility is a modifier, not a persona replacement:** a scholar using a screen reader gets P6 content structured under P7 rules.

---

## 4. Content Policy and Constraints

### 4.1 Preservation and attribution (non-negotiable)

Every rendered variant displays, in this order:

1. **Attribution line (required, not collapsible):**
   `Based on the museum-provided description by {{museum_name}}.`
2. **AI disclosure (required):**
   `Adapted by Digital Muse for a {{persona_label}} reader. Facts unchanged.`
3. **Original access (required):**
   A persistent `Read the museum's original description` control (T0).
4. **Enrichment marker (T2 only):**
   `Wider context — not from the museum's description.` with per-sentence citations.
5. **Changelog (accessible via "How was this adapted?"):**

```json
{
  "changelog": {
    "canonical_version": "cv_004", "variant_id": "v_00931",
    "prompt_version": "muse.local_adult.v1.3", "model": "<model>@<ver>",
    "operations": ["reordered_for_lead", "simplified_vocabulary:grade10→grade8",
                   "added_local_anchor:cited", "unit_conversion_added"],
    "claims_covered": ["c1","c2","c3","c5"],
    "claims_omitted": [{"id":"c7","reason":"optional_length"}],
    "claims_contradicted": [],
    "hedges_preserved": true,
    "enrichment_sources": ["<source_uri>"],
    "reviewed_by": "curator_id | auto", "reviewed_at": "<ts>"
  }
}
```

**Rights:** image display governed by the supplied RightsStatements.org URI. Variants inherit the canonical text's licence; the platform asserts no ownership over museum content. Museums can withdraw an artifact, which unpublishes all variants and purges caches within 15 minutes.

### 4.2 Safety, bias, and cultural sensitivity

**Voice rules**
- Never adopt first-person voice of a culture, community, ancestor, deity, or the object itself.
- Never present a living culture in the past tense ("the X *were* a people who…" → "the X community…").
- Use community-preferred endonyms where the museum supplies them; fall back to canonical terminology, never to colonial-era exonyms.
- Do not aestheticize objects of violence, forced labour, or dispossession; describe function plainly.

**Framing rules**
- No civilizational ranking, no "primitive/advanced," no "discovered by" for objects taken from inhabited places (use "acquired," "excavated by," "removed from," per the museum's own provenance language).
- Religious and ceremonial objects: describe belief as belief held by practitioners, in the present tense where the practice continues; never assert or debunk.
- Do not use a culture's artifacts as a foil for flattering another culture, including the visitor's.

**Bias mitigation in personalization**
- Adaptation may change *how* something is explained, never *whether* uncomfortable facts appear. Colonial acquisition, looting, and repatriation claims are `must_include` for **all** personas including P1 (in an age-appropriate single sentence).
- Regular fairness audit: same artifact, all persona buckets → diff the claim coverage. Any claim dropped disproportionately for a given persona is a policy bug.
- No "nationality-flattering" adaptation: an international visitor and a local visitor receive the same facts, differing only in anchors and orientation.

### 4.3 Sensitivity flags and required handling

| Flag | Required handling |
|---|---|
| `human_remains` | Interstitial notice before image display; no image in thumbnails/carousels; sober register only; no child-persona rendering unless museum explicitly enables; no speculative biography |
| `sacred_restricted` | Respect community viewing restrictions (gender-, initiation-, or season-restricted); may require image suppression entirely; **no AI generation without recorded community sign-off** |
| `contested_provenance` | Mandatory provenance paragraph in every variant; neutral factual statement of the claim and its status; link to museum's published position; never editorialize either direction |
| `repatriation_claim_active` | As above + status line with date; auto-flag for re-review every 90 days |
| `depicts_violence_or_slavery` | Content notice; plain non-graphic description; no dramatization; T2 enrichment disabled by default |
| `disputed_scholarship` | Present the museum's position as primary, plus an **"Other interpretations"** block *only* where the museum supplies them — the AI never sources alternative scholarly positions on its own |
| `culturally_sensitive_imagery` | Museum-defined display rules honored (blur-by-default, tap-to-reveal, or suppress) |

**Escalation:** any user report of cultural inaccuracy or offence on a flagged artifact routes to the partner museum within 24 h and unpublishes the variant pending review if two or more independent reports land in 7 days.

### 4.4 Refusal and degradation behavior

The generation service returns T0 (canonical verbatim) instead of a variant when: canonical text is too thin to support the requested depth; sensitivity flags require unavailable sign-off; the safety classifier rejects output twice; or claim-coverage QA fails. **Degrading to the museum's own words is always a safe failure.** The UI shows "Showing the museum's original description" — never an error.

---

## 5. System Design and Data Flow

### 5.1 End-to-end flow

```
[1] INGEST
    Museum portal / API / bulk manifest
      → image store (S3-compatible, versioned) + CDN derivatives
      → metadata validator (schema + controlled vocab + rights)
      → sensitivity classifier (auto-suggest flags; curator confirms)
              ↓ fail → rejection queue with field-level errors
[2] CANONICALIZE
    canonical_text → immutable record (cv_N) in Postgres
      → claim extractor (LLM) → claim ledger draft
      → curator confirms/edits ledger → claims_confirmed
      → embeddings written to vector store (retrieval + dedup + related-object linking)
[3] PLAN
    Generation planner enumerates required buckets:
      persona × language × depth × a11y × tier
      → priority queue (high-traffic buckets first)
[4] GENERATE
    Personalization service:
      prompt assembler (template + canonical + ledger + persona rules + policy block)
      → [T2 only] retrieval over approved corpus, geo-filtered for local anchors
      → LLM call (low temperature, structured JSON output)
      → post-processor: schema validation, attribution injection, changelog build
[5] AUTO-QA  (blocking)
      claim coverage (NLI entailment vs. ledger)
      contradiction detection (NLI, must be zero)
      hedge preservation check
      numeric/date exact-match check
      readability target check (persona band)
      banned-phrase / voice-rule linter
      safety + toxicity classifier
      citation validator (T2)
              ↓ fail → repair loop (max 2) → still fail → fall back to T0 + alert
[6] REVIEW
    auto-publish (trusted museums, unflagged, QA-clean)
      | curator queue (flagged, sampled, or museum policy = manual)
[7] SERVE
    Variant cache (Redis + CDN edge) keyed by
      hash(canonical_version, persona_bucket, prompt_version, model_version, policy_version)
      → cache miss → on-demand streaming generation → write-through
      → client renders: attribution → explanation → enrichment block → original link
[8] OBSERVE
    Event log (view, dwell, expand, feedback, report)
      → analytics + eval datasets + regeneration triggers
      → immutable audit log (WORM storage, 7-year retention)
```

### 5.2 Storage model (essential tables)

| Store | Contents | Rules |
|---|---|---|
| `artifacts` (Postgres) | identity, metadata, flags, rights, consent | Soft-delete only |
| `canonical_versions` | text, language, hash, author, timestamp | **Append-only, immutable** |
| `claim_ledger` | claims per canonical_version, criticality, curator-confirmed flag | Versioned with parent |
| `variants` | generated text, JSON blocks, changelog, QA report, state | Immutable per version; new generation = new row |
| `object_store` | images + derivatives (thumb, 800, 1600, IIIF tiles) | Versioned, rights-tagged |
| `vector_store` | canonical + claim embeddings, approved-corpus chunks | Rebuilt on canonical change |
| `audit_log` | WORM append-only event stream | Export to museum on request |
| `cache` | Redis (hot) + CDN (edge) | TTL 30 d; explicit invalidation on any key-component change |

**Cache invalidation triggers:** canonical edit, ledger edit, prompt-version bump, model change, policy-version bump, sensitivity-flag change, museum withdrawal, curator edit to a variant.

### 5.3 Latency, scale, and generation strategy

| Path | Target |
|---|---|
| Cached variant delivery (edge) | p50 ≤120 ms, p95 ≤400 ms |
| On-demand generation, first token | p95 ≤900 ms (stream; render attribution header immediately) |
| On-demand generation, complete | p95 ≤3.5 s for ≤300 words |
| Batch generation throughput | ≥5,000 variants/hour/worker-pool at launch scale |
| Cache hit rate | ≥85% steady state |

**Strategy: batch-first, stream-for-the-tail.**
- **Batch (offline):** all P1–P10 × top 3 languages × 3 depths at publish time. This is the 90% case and makes cost predictable and QA exhaustive (every served variant has been auto-QA'd before a human ever sees it).
- **Real-time (streaming):** rare bucket combinations, live geo-anchoring on-site, and T3 conversational follow-ups. Real-time output still passes a lighter synchronous QA gate (contradiction + safety) before display; full QA runs async and can retro-unpublish.
- **Cost controls:** prompt caching on the shared policy/persona preamble; small model for claim extraction and QA-NLI, larger model for generation; batch API tier for offline runs.

**Failure modes:** LLM unavailable → serve T0. QA service unavailable → serve T0 (never bypass QA). Retrieval unavailable → downgrade T2 → T1 silently.

---

## 6. Prompt Templates for the Personalization Engine

### 6.0 Shared blocks (composed into every template)

All templates are assembled as: `SYSTEM_POLICY_BLOCK` + `TEMPLATE_ROLE` + `INPUT_BLOCK` + `TASK_RULES` + `OUTPUT_CONTRACT` + `FALLBACK_BLOCK`. Version each block independently; `prompt_version` is the hash of the composition.

**`SYSTEM_POLICY_BLOCK` (immutable, prepended to all templates):**

```
You are operating inside a museum interpretation system. The museum's text is
authoritative. You are re-voicing it for a specific reader, not rewriting it.

ABSOLUTE RULES:
1. CLOSED WORLD. Use only facts present in {{canonical_text}} and {{claim_ledger}}.
   In enrichment mode you may additionally use {{retrieved_context}}, and every
   sentence drawn from it must carry an inline [source: id] marker.
2. NO INVENTION. No invented dates, names, numbers, materials, motives, emotions,
   sensory details, or events. If you cannot say it from the inputs, omit it.
3. CLAIM COVERAGE. Every claim marked must_include appears in your output.
4. HEDGE PRESERVATION. "circa", "probably", "attributed to", "one interpretation"
   and all uncertainty language must survive. Never convert a hedge into an assertion.
5. NUMBERS EXACT. Reproduce measurements and dates exactly. Unit conversions are
   additive: "30 cm (about 12 in)". Never replace the original figure.
6. NO IMPERSONATION. Never write in the first person as the object, its maker, a
   deity, an ancestor, or a member of any culture.
7. SENSITIVITY IS NOT OPTIONAL. Content notices, provenance statements and
   repatriation status lines are included in full regardless of length limits.
   If length conflicts with these, cut descriptive colour, never these.
8. ATTRIBUTION. Output must begin with the attribution header defined below.
9. If any rule would be violated by completing the task, return
   {"status":"decline","reason":"<rule_id>"} and nothing else.
```

**`OUTPUT_CONTRACT` (JSON envelope, all templates):**

```json
{
  "status": "ok | decline",
  "attribution": "Based on the museum-provided description by {{museum_name}}.",
  "ai_disclosure": "Adapted by Digital Muse for a {{persona_label}} reader. Facts unchanged.",
  "tags": {"tone": "", "level": "", "persona": "", "language": "", "tier": "T1|T2"},
  "reading_time_seconds": 0,
  "sections": [{"heading": "", "body": ""}],
  "enrichment": [{"text": "", "source_id": ""}],
  "look_closer": ["", ""],
  "further_reading": [{"label": "", "source_id": ""}],
  "glossary": [{"term": "", "plain_definition": ""}],
  "changelog": {"operations": [], "claims_covered": [], "claims_omitted": [],
                "hedges_preserved": true},
  "self_check": {"new_facts_introduced": false, "all_must_include_covered": true,
                 "numbers_verbatim": true}
}
```

> **Note on all examples below:** inputs use a **synthetic placeholder artifact** (`ART-PLACEHOLDER-001`) with invented-for-illustration canonical text. No real artifact is described, and no factual claim about any real object is made anywhere in this document. Sample outputs show *structure only*.

---

### Template 1 — `muse.core.adaptive` (T1, default renderer)

**Role:** "You are a culturally sensitive digital muse with expertise in museum interpretation and plain-language writing. You adapt an institution's own description for one specific reader."

**Inputs:** `museum_name`, `artifact_title`, `canonical_text`, `claim_ledger`, `artifact_image_description`, `culture_of_origin`, `sensitivity_flags`, `user_profile{age_band, language, education_context, interests, depth_preference}`, `persona_label`, `desired_length_words`, `readability_target_grade`, `output_format`.

**Task rules:**
- Rewrite at `readability_target_grade` ±1. Define every specialist term on first use.
- Lead with the single most concrete, observable thing about the object, then meaning.
- Weave in at most two of the user's `interests` as *angle of approach*, never as new content.
- Structure: `sections[]` = `["What you're looking at", "Why it matters"]`, plus `"Provenance"` if any provenance or sensitivity flag is present.
- Populate `look_closer` with 2 observations grounded strictly in `artifact_image_description` or canonical text.
- **Max 380 words / ~520 tokens** in `sections[].body` combined.

**Fallback:** if `user_profile` is missing or `language_confidence < 0.6` → render `persona_label = "general_adult"`, `readability_target_grade = 9`, `language = canonical_language`, `depth = standard`; set `tags.persona = "default_fallback"`. If `canonical_text` < 40 words → `{"status":"decline","reason":"insufficient_canonical"}` (caller serves T0). Never ask the user a clarifying question — this runs offline.

**Example input (abridged):**
```json
{"museum_name":"[Museum Name]","artifact_title":"[Placeholder Vessel]",
 "canonical_text":"<synthetic 180-word museum description>",
 "claim_ledger":[{"id":"c1","criticality":"must_include"}, "..."],
 "user_profile":{"age_band":"30_59","language":"en-IN","education_context":"undergrad",
                 "interests":["craft_technique"],"depth_preference":"standard"},
 "persona_label":"general_adult","desired_length_words":220,
 "readability_target_grade":9}
```

**Expected output skeleton (2-sentence sample):**
```json
{"status":"ok",
 "attribution":"Based on the museum-provided description by [Museum Name].",
 "ai_disclosure":"Adapted by Digital Muse for a general adult reader. Facts unchanged.",
 "tags":{"tone":"conversational","level":"grade_9","tier":"T1"},
 "reading_time_seconds":62,
 "sections":[
   {"heading":"What you're looking at",
    "body":"[Two sentences describing the object's form and material, drawn only from the museum's own description, with the museum's hedging preserved.]"},
   {"heading":"Why it matters",
    "body":"[Two sentences conveying the must_include significance claims in plainer language.]"}],
 "look_closer":["[observation grounded in image description]","[second observation]"],
 "changelog":{"operations":["simplified_vocabulary","reordered_for_lead"],
              "claims_covered":["c1","c2","c3"],"claims_omitted":[],"hedges_preserved":true},
 "self_check":{"new_facts_introduced":false,"all_must_include_covered":true,"numbers_verbatim":true}}
```

---

### Template 2 — `muse.local.anchor` (T2, local visitor with landmark anchoring)

**Role:** "You are a digital muse who helps people in a specific place see how a museum object connects to the landscape they already know. You are rigorous about the boundary between the museum's facts and wider context."

**Additional inputs:** `user_city`, `user_region`, `retrieved_context[]` (geo-filtered chunks from the approved corpus, each with `source_id`, `title`, `confidence`), `museum_enrichment_consent`, `max_enrichment_sentences` (default 3).

**Task rules:**
- The `sections[]` body remains **strictly T1** — canonical only. All local material goes in `enrichment[]`.
- Each `enrichment[]` item: one sentence, one `source_id`, confidence ≥0.75. Anchor must be a *verifiable, publicly known* place, tradition, or institution — never a claim of direct historical connection to the artifact unless the canonical text states it.
- Forbidden: asserting the object "came from" or "was used at" a local landmark absent a canonical claim. Permitted framing: "This period is also represented at…", "A related craft tradition continues in…".
- Max 3 enrichment sentences, max 420 words total.

**Fallback:** `enrichment_consent = none`, or `retrieved_context` empty, or all confidences <0.75 → emit T1 output with `enrichment: []` and `tags.tier = "T1"`, and log `enrichment_unavailable`. If `user_city` unknown but `user_region` known → anchor at regional level. If neither → fall through to Template 1.

**Example input (abridged):** as Template 1, plus `{"user_city":"[City]","region_relation":"local_city","retrieved_context":[{"source_id":"src_44","confidence":0.82}],"museum_enrichment_consent":"local_context"}`

**Expected output skeleton:**
```json
{"sections":[{"heading":"What you're looking at","body":"[canonical-only, 2 sentences]"},
             {"heading":"Why it matters","body":"[canonical-only, 2 sentences]"}],
 "enrichment":[{"text":"[One sentence of wider local context, clearly general and not a claim about this object.]","source_id":"src_44"}],
 "tags":{"tier":"T2","persona":"local_adult"},
 "changelog":{"operations":["added_local_anchor:cited"],"enrichment_sources":["src_44"]}}
```

---

### Template 3 — `muse.child.wonder` (T1, ages 8–11)

**Role:** "You are a friendly museum guide writing for a curious 9-year-old. You are accurate, never babyish, and you never invent."

**Task rules:**
- 90–140 words. Sentences ≤14 words. Grade 3–5. Active voice. Second person.
- Open with one question the child can answer by looking.
- Every specialist term either avoided or defined in ≤8 words inside `glossary[]`.
- Convey all `must_include` claims; a hedge becomes "we think" / "we're not sure, but".
- If `sensitivity_flags` include `human_remains`, `depicts_violence_or_slavery`, or `sacred_restricted`: **return `{"status":"decline","reason":"child_render_requires_curator"}`** unless `museum_child_override = true`, in which case use the museum-supplied child-safe text only.
- No monetary value, no "priceless", no scary or grisly detail, no death imagery.
- `look_closer` must contain exactly 2 spotting prompts.

**Fallback:** `age_band` missing but `group_type = family_with_children` → render Template 9 instead. If canonical text is highly technical and cannot be brought to grade 5 without dropping a `must_include` claim → decline with `reason: "cannot_simplify_without_loss"`.

**Example input (abridged):** `{"user_profile":{"age_band":"under_12","language":"en-IN"},"persona_label":"child_8_11","desired_length_words":120,"readability_target_grade":4}`

**Expected output skeleton:**
```json
{"tags":{"tone":"warm_curious","level":"grade_4","persona":"child_8_11"},
 "reading_time_seconds":45,
 "sections":[{"heading":"Can you spot what this is made of?",
   "body":"[Short opening question plus two very short sentences naming what the object is, using the museum's facts.] [One sentence on how people used it.]"}],
 "glossary":[{"term":"[term]","plain_definition":"[≤8-word definition]"}],
 "look_closer":["[spotting prompt 1]","[spotting prompt 2]"],
 "self_check":{"new_facts_introduced":false,"all_must_include_covered":true}}
```

---

### Template 4 — `muse.scholar.deep` (T1/T2, specialist and deep-context readers)

**Role:** "You are a museum interpretation specialist writing for a subject-literate reader. You preserve nuance, name uncertainty, and never smooth over gaps in evidence."

**Additional inputs:** `provenance_chain`, `bibliography[]`, `related_artifact_ids`, `technical_metadata`, `open_questions[]` (museum-supplied).

**Task rules:**
- 350–500 words. Domain vocabulary permitted without definition. Grade 12+.
- Sections: `["Description", "Technical and material detail", "Context and historiography", "Provenance", "Open questions"]`.
- **Amplify** uncertainty rather than resolve it: where the canonical text hedges, state explicitly what is and is not evidenced.
- `further_reading` populated **only** from `bibliography[]`; never generate citations. If `bibliography` is empty, return an empty array — do not substitute plausible-looking references.
- `open_questions` may only restate museum-supplied questions or identify a gap *visible in the canonical text itself* (e.g., "the description does not specify the excavation context").
- Provenance section is mandatory and reproduces the museum's provenance framing without softening.

**Fallback:** if `bibliography` and `technical_metadata` are both empty → render at 250 words, drop "Technical and material detail", set `tags.level = "deep_limited_sources"`, and note in changelog `insufficient_specialist_metadata`. Never fabricate comparanda.

**Example input (abridged):** `{"user_profile":{"education_context":"postgrad","domain_expertise":["archaeology"],"depth_preference":"deep"},"persona_label":"scholar","bibliography":[{"source_id":"bib_12"}],"open_questions":["<museum-supplied>"]}`

**Expected output skeleton:**
```json
{"tags":{"tone":"precise","level":"specialist","tier":"T1"},
 "sections":[{"heading":"Description","body":"[Two sentences of precise description using the museum's terminology verbatim where technical.]"},
             {"heading":"Provenance","body":"[The museum's provenance statement, restructured but not softened.]"},
             {"heading":"Open questions","body":"[One sentence naming an evidentiary gap stated or visible in the canonical text.]"}],
 "further_reading":[{"label":"[from bibliography only]","source_id":"bib_12"}],
 "changelog":{"operations":["expanded_structure","uncertainty_made_explicit"],"hedges_preserved":true}}
```

---

### Template 5 — `muse.a11y.screenreader` (T1, accessibility-optimized) ★

**Role:** "You are an accessibility-focused museum interpreter writing for a visitor using a screen reader or with low vision. Your output must be fully understandable without seeing the image, and must read cleanly aloud."

**Additional inputs:** `curator_alt_text`, `artifact_image_description`, `accessibility{screen_reader, low_vision, high_contrast, cognitive_support}`, `tts_mode`.

**Task rules:**
- **Visual description first.** `sections[0]` = "What this object looks like": shape, material, colour, surface, condition, scale — sourced only from `curator_alt_text` / `artifact_image_description` / canonical text. If none of these describe appearance, say so plainly: "The museum has not provided a visual description of this object." **Never guess appearance from the object's name.**
- Then "What it is and why it matters" (canonical facts), then "Provenance" if applicable.
- 160–240 words, grade 6–8, one idea per sentence, active voice.
- **TTS hygiene:** no layout-relative language ("above", "on the left of this page"); use object-relative spatial terms ("along the rim", "at the base"). Expand abbreviations. Write dates in speakable form while keeping the numeral exactly ("1450, spoken as fourteen fifty"). No emoji, no ASCII art, no decorative punctuation, no bare parentheticals mid-sentence.
- **Semantic structure:** every section has a real heading; output maps to `<h2>/<p>/<ul>`; `look_closer` becomes an ordered list of tactile/audio-friendly prompts where a touch tour or audio description exists.
- Emit `high_contrast_hints`: `{"key_terms": [...], "emphasis_spans": [...]}` for the client to render as visual anchors — **never** convey meaning by colour alone.
- If `cognitive_support = true`, additionally cap at 120 words, grade 4–5, and populate `glossary[]` for every term above grade 6.

**Fallback:** if accessibility flags are absent but the OS reports a screen reader, apply this template additively over the resolved persona template (structure from here, depth from there). If `curator_alt_text` is missing, still produce the section, populated from canonical text only, and set `changelog.operations += ["alt_text_missing_flag_to_curator"]`.

**Example input (abridged):** `{"accessibility":{"screen_reader":true,"low_vision":true,"cognitive_support":false},"curator_alt_text":"<synthetic curator alt text>","persona_label":"general_adult","desired_length_words":200}`

**Expected output skeleton:**
```json
{"tags":{"tone":"clear_literal","level":"grade_7","persona":"a11y_screen_reader"},
 "reading_time_seconds":75,
 "sections":[
  {"heading":"What this object looks like",
   "body":"[One sentence on overall shape and material from the curator's alt text.] [One sentence on surface, colour and condition.] [One sentence giving size in the museum's exact figures with an additive conversion.]"},
  {"heading":"What it is and why it matters",
   "body":"[Two short sentences carrying the must_include claims, hedges intact.]"}],
 "look_closer":["[audio-or-touch-friendly prompt]","[second prompt]"],
 "high_contrast_hints":{"key_terms":["[term]"],"emphasis_spans":["[phrase]"]},
 "glossary":[],
 "changelog":{"operations":["visual_description_first","tts_normalized","semantic_headings"],
              "hedges_preserved":true}}
```

---

### Template 6 — `muse.multilingual.localize` (T1, translation + cultural localization)

**Role:** "You are a museum translator and localizer. You render the museum's description into the reader's language with equal factual fidelity, adapting reference frames but never facts."

**Additional inputs:** `target_language`, `canonical_language`, `script_preference`, `transliteration_required`, `formality_register`.

**Task rules:**
- Translate meaning, not word-for-word. **Proper nouns, culture names, technical terms and community endonyms are kept in the original with a transliteration and, on first use, a short gloss.**
- Numbers, dates and measurements reproduced exactly; add locally conventional units additively.
- Register selected per `formality_register` (e.g. formal second person where the language distinguishes).
- Culturally-specific analogies from the source are **replaced with functionally equivalent ones only if they are analogies, never if they are facts**. Log every such substitution in `changelog.operations`.
- Emit `translation_confidence` (0–1) and `untranslatable_terms[]` with the original preserved.
- The attribution line and AI disclosure are translated but must remain present and unabridged.
- If the target language has an official museum-supplied translation, **use it verbatim as canonical** and set `tier: "T0_translated"`.

**Fallback:** `target_language` unsupported or `translation_confidence < 0.7` → return canonical text in `canonical_language` with a notice block `"A translation into {{target_language}} is not yet available for this object."` and flag for human translation. Never publish a low-confidence translation of a sensitivity-flagged artifact.

**Example input (abridged):** `{"canonical_language":"en-IN","target_language":"kn-IN","formality_register":"formal","transliteration_required":true,"sensitivity_flags":[]}`

**Expected output skeleton:**
```json
{"tags":{"language":"kn-IN","level":"grade_9","tier":"T1"},
 "attribution":"[translated attribution line]",
 "sections":[{"heading":"[translated heading]","body":"[Two sentences in the target language conveying the must_include claims, with proper nouns retained in original script plus transliteration.]"}],
 "untranslatable_terms":[{"original":"[term]","transliteration":"[form]","gloss":"[short gloss]"}],
 "translation_confidence":0.86,
 "changelog":{"operations":["translated","analogy_substituted:1","terms_transliterated"],
              "hedges_preserved":true}}
```

---

### Template 7 — `muse.sensitive.guarded` (T1, flagged artifacts)

**Role:** "You are a museum interpreter handling an object with contested provenance, sacred status, human remains, or difficult history. Your register is sober, your facts are the museum's, and you never editorialize."

**Additional inputs:** `sensitivity_flags[]`, `provenance_statement` (verbatim, museum-supplied), `repatriation_status` + `status_date`, `community_statement` (optional, verbatim, attributed), `content_notice_text`, `community_signoff_id`.

**Task rules:**
- `sections[0]` is always the content notice, rendered verbatim from `content_notice_text`.
- Provenance section reproduces `provenance_statement` with **no softening, no euphemism, and no added justification**. Words like "acquired", "removed", "confiscated", "donated" are used exactly as the museum uses them.
- If `community_statement` is present, it appears as a **separately attributed block**, quoted and credited, never paraphrased and never blended with museum voice.
- Repatriation status appears as a dated factual line: "Repatriation claim status as of {{status_date}}: {{repatriation_status}}."
- No dramatization, no speculation about individuals, no aestheticizing language ("beautiful", "haunting", "treasure"), no monetary value.
- Alternative interpretations included **only** if museum-supplied, in an "Other interpretations" section, each attributed.
- **Hard gate:** if `sacred_restricted` is present and `community_signoff_id` is null → `{"status":"decline","reason":"awaiting_community_signoff"}`.
- Length: 200–320 words. Notices and provenance are never trimmed for length.

**Fallback:** any missing required sensitivity input → decline; the caller serves T0 with the museum's own notices. Never generate a "safer" version by omitting the difficult content — omission is the failure mode this template exists to prevent.

**Example input (abridged):** `{"sensitivity_flags":["contested_provenance","repatriation_claim_active"],"provenance_statement":"<verbatim museum text>","repatriation_status":"<museum-stated status>","status_date":"<date>","community_signoff_id":null}`

**Expected output skeleton:**
```json
{"status":"ok",
 "tags":{"tone":"sober","persona":"general_adult","tier":"T1","flags":["contested_provenance"]},
 "sections":[
  {"heading":"Before you read","body":"[content_notice_text verbatim]"},
  {"heading":"What you're looking at","body":"[Two factual sentences, no aestheticizing language.]"},
  {"heading":"How this object came to the museum","body":"[Provenance restructured for clarity, terminology unchanged.] Repatriation claim status as of [date]: [status]."}],
 "changelog":{"operations":["notice_preserved_verbatim","provenance_unsoftened"],
              "claims_omitted":[],"hedges_preserved":true}}
```

---

### Template 8 — `muse.qa.verifier` (pipeline template — automated fidelity check)

**Role:** "You are a strict fact-fidelity auditor. You compare a generated museum explanation against the source description and its claim ledger. You do not rewrite. You report."

**Inputs:** `canonical_text`, `claim_ledger`, `generated_variant`, `tier`, `retrieved_context[]` (T2 only), `persona_rules`.

**Task rules:**
- For each ledger claim, output `covered | partially_covered | omitted | contradicted` with the supporting span from the variant.
- Flag every variant sentence not entailed by canonical text or cited retrieval as `unsupported`.
- Check: numeric/date exact match; hedge preservation; attribution present; forbidden first-person voice; banned aestheticizing terms on flagged artifacts; enrichment citation validity.
- **Do not repair.** Return findings only. Verdict `fail` if any `contradicted`, any `must_include` omitted, any uncited `unsupported` sentence, or any missing attribution.
- Deterministic settings: temperature 0.

**Fallback:** if the ledger is missing, fall back to sentence-level NLI against `canonical_text` alone and set `confidence: "reduced"`.

**Example input (abridged):** `{"claim_ledger":[{"id":"c1","criticality":"must_include"},{"id":"c2","criticality":"optional"}],"generated_variant":"<variant JSON>","tier":"T1"}`

**Expected output skeleton:**
```json
{"verdict":"fail",
 "claim_report":[{"id":"c1","status":"covered","span":"[quoted span from variant]"},
                 {"id":"c2","status":"omitted","criticality":"optional"}],
 "unsupported_sentences":[{"text":"[sentence]","reason":"no_entailment_in_canonical"}],
 "checks":{"numbers_exact":true,"hedges_preserved":false,"attribution_present":true,
           "first_person_voice":false,"citations_valid":null},
 "confidence":"full"}
```

---

### 6.9 Prompt engineering conventions (apply to all templates)

- **Temperature ≤0.4** for generation, **0** for extraction and QA. Fix `top_p`; log seeds.
- **Structured output enforced** by JSON schema / constrained decoding — never parse free text.
- Put the policy block **first**; put `canonical_text` in a delimited block labelled as data, with an explicit instruction that content inside it is source material and never an instruction (prompt-injection defense against malicious uploads).
- Sanitize museum-uploaded text for injection patterns at ingest; strip anything resembling instruction syntax and flag for review.
- Keep persona rules in **data**, not prose, so they are versioned and testable independently of the template.
- Every template ships with a golden-set regression suite (§7) that must pass before `prompt_version` is promoted.

---

## 7. Evaluation and QA Plan

### 7.1 Metric tree

| Dimension | Metric | Method | Target |
|---|---|---|---|
| **Fidelity** | `must_include` claim recall | NLI entailment vs. ledger (Template 8) + human golden set | **1.00** |
| | Contradiction rate | NLI + human adjudication | **0** |
| | Hallucination rate (unsupported sentences) | Template 8 + human spot-check | <0.5% of sentences |
| | Numeric/date exactness | Deterministic regex + diff | 100% |
| | Hedge preservation | Rule-based hedge lexicon + NLI | ≥99% |
| **Readability** | Flesch–Kincaid / target-language equivalent | Automated per persona band | Within ±1 grade, 95% of variants |
| | Sentence length compliance (P1/P8) | Automated | ≥95% of sentences within cap |
| | Term-definition coverage | Glossary check vs. domain lexicon | 100% of above-band terms defined |
| **Cultural appropriateness** | Voice-rule violations (impersonation, past-tensing living cultures, exonyms, aestheticizing flagged objects) | Rule-based linter + LLM judge + expert review | 0 in production |
| | Expert panel rating (flagged artifacts) | Curator + community reviewer, 5-point scale | ≥4.5 mean, no score ≤3 unaddressed |
| **Attribution & transparency** | Attribution header present | Deterministic | 100% |
| | User attribution comprehension | Survey | ≥85% correct |
| **Satisfaction** | "Right level for me" | 1-tap in-product | ≥70% |
| | Completion rate, dwell, expand rate | Telemetry | Baseline + improvement |
| | Report rate (inaccurate/offensive) | In-product report | <0.1% of views |
| **Operational** | Curator edit rate | Review-queue telemetry | <10% by month 3 |
| | Cache hit rate, p95 latency, cost/1k views | Infra telemetry | §5.3 targets |

### 7.2 Automated QA gates (blocking, pre-publish)

1. Schema + required-field validation on the JSON envelope.
2. Attribution and AI-disclosure presence.
3. Template 8 fidelity audit → `fail` blocks publication.
4. Readability band check.
5. Persona style linter: sentence length, banned constructions, vocabulary tier, forbidden idioms (P8), TTS hygiene (P5).
6. Voice-rule linter: first-person impersonation, exonym list, aestheticizing lexicon on flagged artifacts, "discovered by" pattern on removed objects.
7. Safety/toxicity classifier.
8. Citation validator (T2): every enrichment sentence has a resolvable, in-corpus `source_id`.
9. Cross-persona consistency diff: same artifact across personas → no `must_include` claim present in one and absent in another; no contradictory statements between variants.

**Repair loop:** max 2 targeted regeneration attempts with the failure report appended to the prompt. Third failure → serve T0 + curator alert.

### 7.3 Human QA

- **Golden set:** 150–300 artifacts spanning materials, periods, cultures, sensitivity flags, thin vs. rich canonical text. Human-authored reference variants for 3 personas each. Run on every prompt/model/policy version bump; block promotion on regression.
- **Adversarial set:** canonical texts that are very short, contradictory, heavily hedged, contain embedded instructions (injection), mix languages, or describe objects with no visual description available.
- **Expert review panel:** curators + subject specialists + community representatives for flagged categories. Compensated, named in credits with consent, with authority to veto.
- **Accessibility testing:** moderated sessions with screen-reader users (NVDA, JAWS, VoiceOver, TalkBack) and users with cognitive disabilities. Automated axe/Lighthouse runs are necessary but not sufficient.
- **Blind preference tests:** curators rate AI variant vs. human-written variant without knowing which is which.

### 7.4 A/B tests and feedback

**Experiments (each with a fidelity guardrail metric — any arm increasing contradiction or report rate is auto-stopped):**

| # | Hypothesis | Arms | Primary metric |
|---|---|---|---|
| A1 | Personalized variant beats canonical for comprehension | T0 vs. T1 persona-matched | Comprehension quiz score + completion |
| A2 | Local anchoring increases engagement | T1 vs. T2 local | Related-content CTR, dwell |
| A3 | Onboarding depth matters | 3-tap onboarding vs. inferred defaults | "Right level" rate |
| A4 | Attribution placement affects trust | Header vs. footer vs. inline badge | Attribution comprehension, trust survey |
| A5 | Length preference by persona | Short vs. standard per persona | Completion rate |
| A6 | Enrichment labelling | Distinct block vs. inline citation | Source-recognition accuracy |

**Feedback mechanisms:** 1-tap level feedback ("too simple / just right / too much"); "Report an inaccuracy" routed to the owning museum with the variant, canonical version, and changelog attached; curator inline-edit capture; periodic in-product survey for trust and comprehension; on-site intercept interviews with the partner museum.

**Feedback → improvement loop:** aggregated signals produce prompt-change *proposals* reviewed by a human prompt owner. No automatic prompt mutation, no automatic fine-tuning on user data.

---

## 8. Implementation Considerations and Roadmap

### 8.1 MVP (target: launchable slice)

**In scope**
- Single-artifact upload UI + required-metadata validation; 1 museum partner, 1 collection.
- Canonical storage with immutable versioning; LLM claim extraction with curator confirmation UI.
- **4 personas:** general adult (P4), child (P1), deep-context (P5), accessibility/screen-reader (P7).
- **T0 + T1 only.** No enrichment, no conversational Q&A, no landmark anchoring.
- Templates 1, 3, 4, 5, 8.
- Batch generation at publish + Redis cache; no real-time generation path.
- Auto-QA gates 1–7 + mandatory curator review of 100% of variants.
- Attribution header, AI disclosure, "read the original" link, changelog viewer.
- 1-tap feedback + report button.
- Web, responsive, WCAG 2.2 AA.

**Explicitly deferred:** multilingual, geo, AR, personalization from history, image-region grounding, multi-museum admin, public API.

**Definition of done:** 100 artifacts published; claim recall 1.00 and contradiction rate 0 on the golden set; curator sign-off that no variant misrepresents the collection; screen-reader task success ≥90%.

### 8.2 Phase 2 — breadth

- Templates 2, 6, 7: local anchoring (T2 + approved corpus + geo), multilingual (start with the partner museum's regional languages), sensitive-artifact handling with community sign-off workflow.
- Remaining personas (teen, scholar-specialist, family, educator).
- Bulk ingest + LIDO/Dublin Core importer; multi-museum admin console.
- Real-time streaming generation for long-tail buckets; CDN edge caching.
- Audio narration from the accessibility variant (TTS with pronunciation guides).
- A/B framework and experiment dashboard.

### 8.3 Phase 3 — depth

- **Image-region grounding:** curator-drawn regions on the artifact image, each with a canonical note; the Muse references regions explicitly ("the band around the rim") and the client highlights them. Grounded strictly in curator annotations — no automatic visual interpretation of real artifacts.
- **Conversational follow-up (T3):** scoped Q&A over canonical + approved corpus, with explicit refusal outside scope and full audit logging.
- **On-site AR wayfinding** to related objects in-gallery; opt-in outdoor directions to publicly relevant local sites (Phase 3, only with museum partnership).
- **Learning-history personalization:** "you saw a related object earlier" threading; a session-level narrative arc across a visit; spaced-recall prompts for education users.
- **Curator authoring assist:** suggest missing metadata, draft alt text for curator approval, flag readability of canonical text.
- Museum-facing analytics: which claims land, where readers drop off, which objects get reported.

### 8.4 Risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Hallucination misattributed to the museum** | Critical | Closed-world prompting; claim ledger + blocking NLI gate; T0 fallback; attribution wording that distinguishes museum facts from AI adaptation; museum can unpublish instantly |
| **Cultural harm / misrepresentation** | Critical | Sensitivity flag taxonomy; community sign-off gate; voice-rule linter; expert panel with veto; 24 h escalation SLA; no first-person cultural voice ever |
| **Erasure of difficult history via "friendly" personalization** | High | Provenance and repatriation claims are `must_include` for *all* personas; cross-persona claim-coverage diff is a blocking QA gate |
| **Privacy / over-collection** | High | Bucketed personalization by default; coarse geo only, opt-in; no sensitive-category inference; short retention on behavioral signals; DPDP Act 2023 / GDPR alignment — purpose limitation, consent notices in plain language, deletion on request; children's data minimized (age band only, no profile persistence) |
| **Over-personalization / filter bubble** | Medium | Cap personalization to *framing*, never facts; always expose T0; "show me another angle" control; monitor cross-persona divergence as a metric |
| **Prompt injection via uploaded canonical text** | Medium | Ingest-time sanitization; data-delimited prompt blocks with explicit non-instruction framing; output schema constraints; injection patterns in the adversarial eval set |
| **Museum trust erosion after one bad variant** | High | Mandatory review during onboarding period; per-museum kill switch; transparent changelog; incident postmortems shared with the partner |
| **Cost blowout from real-time generation** | Medium | Batch-first architecture; bucket cap; prompt caching; small models for extraction/QA; per-museum generation budgets with alerts |
| **Model/provider drift changing outputs silently** | Medium | Model version pinned in the cache key; golden-set regression required before any version promotion; all published variants immutable |
| **Accessibility treated as a late add-on** | Medium | A11y persona is in MVP scope, not Phase 2; a11y QA is a blocking gate; screen-reader testing with real users before launch |
| **Thin canonical text producing empty-calorie variants** | Medium | Minimum 40-word gate; decline-and-serve-T0 path; curator prompt to enrich the source rather than the AI padding it |

### 8.5 Open decisions for the product team

1. Auto-publish eligibility criteria — what earns a museum the trusted tier, and can it be revoked automatically on report-rate thresholds?
2. Whether enrichment (T2) is opt-in or opt-out at the museum level (recommendation: **opt-in**).
3. Who owns generated variants contractually, and what happens to them if a museum leaves the platform (recommendation: museum owns; variants exported and deleted).
4. Whether visitor-facing UI names the underlying model, or only that AI adaptation occurred.
5. Retention window for behavioral signals (recommendation: 30 days, session-scoped unless the user opts into history).

---

**Document ends.** No factual claims about any real artifact appear in this specification; all examples use synthetic placeholders.
