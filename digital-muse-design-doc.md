# Design Document — Muse
### Adaptive museum interpretation · hackathon prototype

**Filled from the PRD.** Two inputs you left blank — *preferred design style* and *apps you like* — I've recommended rather than guessed silently. Rationale in §1, and questions at the end if you want to overrule.

> **Assumptions (flagged):** mobile-first responsive web, no login, no dark mode in v1, one museum's collection, English only.

---

## 1. Overall design direction

**Direction: editorial minimal — "the museum's paper, not the app's chrome."**

This isn't a stylistic preference; three product constraints nearly force it:

| Constraint | Design consequence |
|---|---|
| WCAG 2.2 AA is a **core feature**, not a checkbox | High-contrast neutral palette, real type sizes (17px body minimum), no meaning carried by colour alone, semantic heading order |
| The product's whole claim is **fidelity to museum content** | UI recedes; content is the interface. Heavy branding would undercut the pitch |
| Read on a **phone, standing in a gallery, one-handed** | Single column, thumb-reachable controls, no hover-dependent affordances, generous line height |
| Judges see it for **4 minutes** | Persona switching and the fidelity badge must be visually obvious at a glance |

**Principles**
1. **Content-first.** Artifact image and text occupy the screen; controls sit at the edges.
2. **Two voices, two typefaces.** Museum canonical text is set in serif; Muse-adapted text and all UI in sans. The distinction is legible before you read a word.
3. **Fidelity is visible, always.** Attribution and the fidelity badge are permanent furniture, never buried in a menu.
4. **Print sensibility.** Paper-toned background, ink-toned text, one accent. Restraint reads as institutional trust.
5. **No screen that could be a sheet.** Every secondary surface is a bottom sheet over the artifact so the reader never loses their place.

**Reference points** (in the absence of your list): the reading experience of *Are.na* and *Readwise Reader*; the institutional restraint of the *Rijksmuseum* and *Cooper Hewitt* collection pages. **Avoid:** playful/rounded startup aesthetics — they read as untrustworthy against museum content.

---

## 2. Colour palette

Warm neutral ground, near-black ink, one patina accent. All pairings below meet WCAG AA for their use.

| Token | Hex | Role | Contrast on Paper |
|---|---|---|---|
| `--paper` | `#FAF8F4` | App background | — |
| `--paper-raised` | `#FFFFFF` | Cards, sheets | — |
| `--ink` | `#1A1A18` | Primary text, headings | ~15:1 ✓ AAA |
| `--ink-muted` | `#5C5A54` | Secondary text, labels, metadata | ~6.9:1 ✓ AA |
| `--rule` | `#E2DED6` | Hairlines, dividers, card borders | Non-text ✓ |
| `--accent` | `#1F5F5B` | Active persona, links, primary buttons | ~7.0:1 ✓ AA |
| `--accent-soft` | `#E6EFEE` | Selected-chip fill, Muse text block tint | — |
| `--verified` | `#1B6B3A` | Fidelity pass badge | ~5.9:1 ✓ AA |
| `--flagged` | `#A62A21` | Fidelity fail, error states | ~6.4:1 ✓ AA |
| `--notice` | `#8A5A00` | Fallback / warning banners | ~4.8:1 ✓ AA |

**Rules**
- **Never colour alone.** Every state pairs colour with an icon *and* a text label (`✓ 6/6 facts preserved` / `⚠ Check failed — showing museum text`). Required by the accessibility persona, and it survives a projector with bad colour.
- Focus ring: 2px `--accent` + 2px offset, visible on every interactive element. Do not remove the default outline.
- Sensitivity notices use `--notice` on `--paper-raised` with a left rule — sober, never alarming.
- No gradients, no shadows beyond a single soft sheet shadow. One radius: `8px` (sheets `16px` top).

---

## 3. Typography

Two families, four sizes. Everything else is weight and colour.

| Use | Family | Size / line-height | Weight |
|---|---|---|---|
| Artifact title | Serif (**Source Serif 4** / *Instrument Serif*) | 32 / 1.2 | 600 |
| Section heading | Sans (**Inter**) | 17 / 1.4 | 600 |
| **Muse body text** | Sans (Inter) | 17 / 1.65 | 400 |
| **Museum canonical text** | Serif (Source Serif 4) | 18 / 1.7 | 400 |
| Metadata, labels, chips | Sans (Inter) | 13 / 1.4 | 500, letter-spacing 0.02em |
| Caption / attribution line | Sans (Inter) | 13 / 1.5 | 400, `--ink-muted` |

**Rules**
- **17px minimum** for any body text. 15px and below is metadata only.
- Measure capped at **68ch**; centred column on desktop.
- Serif = museum's own words. Sans = Muse's adaptation. Consistent everywhere, including the fidelity report.
- Persona-driven size shift on the artifact screen: child persona bumps body to 19px, deep/specialist stays 17px with tighter section spacing. Accessibility mode respects OS text scaling — use `rem`, never `px`, in the actual CSS.
- Two weights per family only (400/600). No italics except for artifact titles inside running text.

---

## 4. Main UI components

Eleven components. If a thing isn't on this list, it doesn't get built.

| # | Component | Behaviour |
|---|---|---|
| 1 | **Artifact card** | Image (4:3, object-fit cover), title (serif), one metadata line. Whole card is the tap target. |
| 2 | **Persona chip** | Persistent in the header: `Reading as: Adult · Standard`. Tap → opens Context Sheet. Uses `--accent-soft` fill so it reads as changeable, not decorative. |
| 3 | **Context sheet** | Bottom sheet, three grouped choices (who / depth / accessibility toggle). Selection applies immediately and re-renders behind the sheet. |
| 4 | **Attribution block** | Two lines, always directly above the explanation. Line 1: *Based on the museum-provided description by [Museum]*. Line 2: *Adapted by Muse for a [persona] reader. Facts unchanged.* Not collapsible. |
| 5 | **Source toggle** | Two-option segmented control: **Muse version** / **Museum original**. Sticky under the attribution block. Switching is instant — both texts are already loaded. |
| 6 | **Explanation block** | Rendered `sections[]`: heading + paragraphs. Sans for Muse, serif for canonical. Reading-time label top-right. |
| 7 | **Fidelity badge** | Pill under the explanation. Pass: `✓ 6 of 6 museum facts preserved`. Fail: `⚠ Check failed — showing the museum's text`. Tappable → Fidelity Report. |
| 8 | **Fidelity report sheet** | Per-claim list: claim text + status (`covered` / `omitted` / `contradicted`) + the matching span from the variant. Also lists transformations applied ("simplified vocabulary", "reordered for lead"). This doubles as the "How was this adapted?" surface. |
| 9 | **Look-closer list** | 2 numbered observation prompts in a tinted block. Ordered list, not decorative bullets — screen readers announce the count. |
| 10 | **Read-aloud button** | Icon + label, top of the explanation. `speechSynthesis`, play/stop only. Visible in all modes, not just accessibility mode. |
| 11 | **Notice banner** | Left-ruled block for sensitivity notices, fallback messages, and errors. One visual treatment, colour-varied by severity. |

**Deliberately not built:** bottom tab bar, hamburger menu, modals (sheets only), toasts, carousels, avatars, skeleton shimmer animation (static skeleton only — `reduce-motion` safe by default).

---

## 5. Complete list of screens

Four screens and three sheets. The example flow you gave (onboarding → sign-up → dashboard → feature → details → settings) collapses to this — there's no account, so no sign-up; no settings, because the only setting *is* the persona and it belongs in the header.

| # | Surface | Type | Route |
|---|---|---|---|
| S1 | **Collection** | Screen | `/` |
| S2 | **Artifact** | Screen | `/artifact/:id` |
| S3 | **Add artifact** (museum side) | Screen | `/add` |
| S4 | **Not found / offline** | Screen | `*` |
| B1 | **Context sheet** | Bottom sheet | over S1 or S2 |
| B2 | **Fidelity report sheet** | Bottom sheet | over S2 |
| B3 | **Sensitivity notice** | Interstitial sheet | over S2, before content |

**Cut and why:** onboarding carousel (the context sheet *is* the onboarding), sign-up (no accounts), dashboard (the collection is the dashboard), settings (persona chip covers it), profile, search (8 artifacts), about page (put it in the footer of S1).

---

## 6. Purpose of each screen

**S1 — Collection**
Entry point, usually via QR code. Establishes what the product is in three seconds. Shows the persona chip prominently so the reader knows adaptation is happening before they open anything.
*Contains:* one-line product statement, persona chip, grid of artifact cards (2-up mobile, 3-up desktop), small `+ Add artifact` link for the museum demo.

**S2 — Artifact** — *the product; 90% of demo time lives here*
Delivers the adapted explanation with attribution, the toggle to the museum's original, and the fidelity badge. Everything else exists to get the reader here.
*Vertical order (this order is load-bearing):* image → title + metadata → read-aloud → attribution block → source toggle → explanation → look-closer → fidelity badge → back to collection.
*Accessibility mode reorders to:* image → title → **"What this object looks like"** → attribution → interpretation. Description before meaning.

**S3 — Add artifact**
Proves the museum-facing path in the demo. Single column: museum name, title, image URL, canonical description, and 4–6 claim-ledger lines. One `Generate variants` button.

**S4 — Not found / offline**
Catch-all. Restates what Muse is and offers a route back to the collection.

**B1 — Context sheet** · Resolves who is reading, in three taps, without leaving the artifact.
**B2 — Fidelity report** · Shows the per-claim proof. The curator-trust surface and the demo's peak moment.
**B3 — Sensitivity notice** · Blocks content on flagged artifacts until acknowledged; carries the museum's notice text verbatim.

---

## 7. Navigation

Flat, two levels deep, no navigation chrome.

```
        [QR / URL]
             ↓
      S1 Collection ─────────────→ S3 Add artifact
        │      ↑                        │
        │      │ back                   │ generate → S2
   tap card    │                        ↓
        ↓      │
      S2 Artifact ←────────────────────┘
        ├── B1 Context sheet     (persona chip, from S1 or S2)
        ├── B2 Fidelity report   (fidelity badge)
        └── B3 Sensitivity notice (auto, on flagged artifacts, before content)
```

- **Back** is a single text link (`← Collection`) top-left on S2/S3. Browser back does the same thing. No nav bar.
- **Persona chip** is in the header on both S1 and S2 — persona is changeable from anywhere, always.
- Sheets dismiss on backdrop tap, `Esc`, and swipe-down. Focus returns to the element that opened them.
- Persona persists in `sessionStorage`. First visit auto-opens B1 once; never again in that session.

---

## 8. Main user journey

**Priya, on her phone, standing in front of an object.**

1. Scans the QR → **S1 Collection**. Header reads *Reading as: Adult · Standard*.
2. **B1** auto-opens: three taps — *Adult* → *Standard* → accessibility off. Sheet closes.
3. Taps the object in front of her → **S2 Artifact**.
4. Reads. Attribution is visible above the text; she registers this came from the museum.
5. Curious how much is real → taps **✓ 6 of 6 museum facts preserved** → **B2** lists each museum fact and where it appears. Closes it.
6. Wants more → taps the persona chip → switches depth to *Deep*. The text re-renders in place, longer and more nuanced. Same badge, still 6 of 6.
7. Her son gets bored → switches to *Child*. Text becomes 120 words with two things to spot in the object.
8. Curious what the museum actually wrote → toggles **Museum original**. Serif, verbatim. Toggles back.
9. Returns to **S1**, picks the next object. Persona persists — no re-selection.

**Demo variant of the same journey:** insert the rigged failure between steps 6 and 7 — badge turns red, view reverts to the museum's text, banner reads *Check failed — showing the museum's text*. This is a designed state, styled with the same care as the success state, because in the pitch it's the more important one.

---

## 9. Empty states

| Where | State | Treatment |
|---|---|---|
| S1 Collection | No artifacts | Centred: *"No artifacts yet."* + `Add the first one` → S3. Serif heading, muted body, one action. |
| S2 Artifact | No image supplied | Paper-toned block with the artifact title in serif and a muted caption: *"No image available for this object."* Never a broken-image icon, never a generic placeholder illustration. |
| S2, accessibility mode | No curator visual description | Render the section anyway with: *"The museum has not provided a visual description of this object."* **Do not hide the section, and never guess the appearance from the title.** |
| B2 Fidelity report | No claim ledger for this artifact | *"No fact checklist has been added for this object yet."* + note that the Muse version is unverified. Badge on S2 shows neutral grey `— Not verified`, not green. |
| S2 | Look-closer list empty | Omit the block entirely. No empty container, no placeholder text. |
| S3 Add artifact | Fresh form | Pre-fill one worked example in the placeholder attributes so the demo can be typed fast. |

---

## 10. Loading states

**Rule: never block the whole screen.** Attribution and metadata are known instantly — render them first so the frame appears solid while text fills in.

| Where | Treatment |
|---|---|
| S1 grid | Static grey blocks at card dimensions. No shimmer (respects `prefers-reduced-motion` by default). |
| S2 first paint | Image, title, metadata, and **attribution block render immediately**. Only the explanation area shows placeholder lines. |
| S2 generation (live path) | Stream text in if available; otherwise three placeholder lines + `--ink-muted` label *"Muse is adapting the museum's description…"*. Hard 6s ceiling → fall through to Museum original with a notice. |
| Persona switch | Keep the current text visible at 50% opacity while the new one loads, then swap. Never flash empty — pre-generated variants make this near-instant anyway. |
| Fidelity check | Badge shows a neutral `Checking…` pill. Never show green optimistically before the check returns. |
| S3 generate | Button → `Generating…`, disabled, with a per-persona progress line (`Adult ✓ · Child ✓ · Specialist …`). Good demo texture, cheap to build. |
| Read-aloud | Button label flips to `Stop`. No spinner. |

Announce loading regions with `aria-live="polite"` so screen-reader users aren't left in silence.

---

## 11. Error states

**Governing principle from the PRD: failure degrades to the museum's own words, never to an error screen.** Most "errors" here are notices, not failures.

| Case | Type | Treatment |
|---|---|---|
| Generation failed / timed out | **Notice**, `--notice` | Show canonical text. Banner: *"Showing the museum's original description."* Optional `Try again`. No red, no apology, no error code — this is a valid outcome. |
| **Fidelity check failed** | **Flagged**, `--flagged` | Revert to canonical text. Badge: `⚠ Check failed — showing the museum's text`. Tappable → B2 showing which claim failed and why. **Style this as carefully as the success state; it is the trust argument.** |
| No claim ledger | **Neutral** | Grey badge `— Not verified`. Muse version still shown, honestly labelled. |
| Artifact not found | **Screen** S4 | *"We can't find that object."* + `← Collection`. |
| Offline / network down | **Notice** | Pre-generated variants are static, so most of the app still works. Banner: *"You're offline. Showing saved versions."* |
| Form validation on S3 | **Inline** | Message under the field in `--flagged`, plus `aria-describedby`. Never a modal, never clear the user's input. |
| Read-aloud unsupported | **Silent** | Hide the button. Don't surface a capability the browser lacks. |

Every error message: what happened, what's shown instead, what the user can do. No stack traces, no codes, no "Oops!".

---

## 12. Responsive behaviour

Mobile-first. Three breakpoints — resist adding a fourth.

| Breakpoint | Layout |
|---|---|
| **≤640px** (primary) | Single column, 16px gutters. S1 grid 2-up. S2 stacks: image full-bleed → all content. Persona chip full-width under the header. Sheets slide from bottom, max 85vh. |
| **641–1024px** | 24px gutters, content capped at 680px centred. S1 grid 3-up. Layout otherwise identical to mobile — no new patterns. |
| **≥1025px** | S2 becomes **two columns**: image sticky-left (40%), content scrolls right (60%, capped 68ch). S1 grid 3-up, max 1120px. Sheets become centred dialogs, max 560px. |

**Cross-cutting**
- Touch targets ≥44×44px everywhere, including the source toggle and badge.
- Type and spacing in `rem`; honour OS text scaling up to 200% without horizontal scroll (WCAG 1.4.4 / 1.4.10).
- Test at **320px width** — the collection grid drops to 1-up there.
- Images: `aspect-ratio` reserved to prevent layout shift; `loading="lazy"` below the fold; `srcset` at 2 widths only.
- `prefers-reduced-motion` → disable the sheet slide, keep opacity fades.
- Landscape phone: sheets cap at 70vh so the artifact stays partly visible.
- **Not in v1:** dark mode, print stylesheet, `prefers-contrast` variant.

---

## Questions before this is final

1. **Design style — do you accept "editorial minimal"?** It's argued from your accessibility and fidelity requirements, but if you want playful (for the child persona) or a strong brand identity, say so now — it changes §2 and §3 wholesale, and little else.
2. **Apps or sites you actually like?** My references were inferred. One or two real examples would sharpen the type and spacing choices in ten minutes.
3. **Is the museum-side surface (S3) demoed at all?** If not, cut it and save 40 minutes of frontend work.
4. **Do you want a sensitivity-flagged artifact in the seed set?** B3 only earns its build cost if so.
5. **One museum or several?** Multiple museums means the attribution line varies per card and S1 needs grouping. One museum keeps S1 flat.
6. **Custom fonts or system stack?** Source Serif 4 + Inter costs one Google Fonts call and ~30s of setup. A system stack is faster but loses the serif/sans distinction that carries §3's core idea — I'd spend the 30 seconds.
