---
version: alpha
name: "Editorial Heritage & Tactile Museum"
description: "Architectural editorial gravitas tailored for India's national treasures, adaptive audience interpretations, and factual fidelity."
colors:
  paper: "#FAF8F4"
  paper-surface: "#FFFFFF"
  paper-subtle: "#F4F0E8"
  paper-raised: "#FFFFFF"
  ink: "#18181B"
  ink-muted: "#71717A"
  ink-faint: "#A1A1AA"
  accent-patina: "#1F5F5B"
  accent-patina-soft: "#E6EFEE"
  accent-bronze: "#9C6644"
  accent-bronze-soft: "#F7EFE9"
  rule: "rgba(24,24,27,0.08)"
  rule-strong: "rgba(24,24,27,0.16)"
  verified: "#166534"
  verified-soft: "#F0FDF4"
  flagged: "#991B1B"
  flagged-soft: "#FEF2F2"
  notice: "#8A5A00"
  notice-soft: "#FEF9C3"
typography:
  display-hero:
    fontFamily: Fraunces
    fontSize: 3.75rem
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  display-section:
    fontFamily: Fraunces
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  display-card:
    fontFamily: Fraunces
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  canonical-quote:
    fontFamily: Fraunces
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.65
    fontStyle: italic
  body-editorial:
    fontFamily: Geist
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.01em"
  body-ui:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 450
    lineHeight: 1.5
  badge-pill:
    fontFamily: Geist
    fontSize: 0.6875rem
    fontWeight: 600
    letterSpacing: "0.06em"
  code-mono:
    fontFamily: Geist Mono
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  card-artifact:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-artifact-hover:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink}"
  badge-verified:
    backgroundColor: "{colors.verified-soft}"
    textColor: "{colors.verified}"
    rounded: "{rounded.full}"
    padding: 6px
  badge-bronze:
    backgroundColor: "{colors.accent-bronze-soft}"
    textColor: "{colors.accent-bronze}"
    rounded: "{rounded.full}"
    padding: 6px
  button-primary:
    backgroundColor: "{colors.accent-patina}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "#164A47"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
  persona-chip:
    backgroundColor: "{colors.accent-patina-soft}"
    textColor: "{colors.accent-patina}"
    rounded: "{rounded.full}"
    padding: 8px
---

## Overview

Digital Muse represents an **Editorial Heritage & Tactile Museum** design system that translates India's canonical archaeological records into multi-voice adaptive narratives.

The visual language rejects generic AI tropes (neon purple glows, cookie-cutter 3-card rows, default Inter typography, pure `#000000` pitch blacks) in favor of warm museum rag paper (`#FAF8F4`), deep charcoal ink (`#18181B`), ancient verdigris patina (`#1F5F5B`), and terracotta bronze (`#9C6644`). Every interaction reflects the physical tactility of museum vitrines, archival mats, and epigraphic typography.

## Colors

The color palette is derived from natural museum materials, oxidized bronzes, terracotta pottery, and archival paper:

- **Warm Museum Paper (`#FAF8F4`):** Canvas ground for all pages, providing a non-glare, tactile surface.
- **Pure Surface (`#FFFFFF`):** Elevated gallery matting, exhibition plates, and slide-over drawers.
- **Recessed Subtle (`#F4F0E8`):** Inset wells, postal PIN search boxes, and secondary containers.
- **Deep Charcoal Ink (`#18181B`):** Primary text and headings. Contrast ratio 16.2:1 (exceeds WCAG AAA).
- **Muted Stone (`#71717A`):** Secondary descriptions, captions, and inactive controls. Contrast ratio 4.65:1 (WCAG AA).
- **Ancient Verdigris Patina (`#1F5F5B`):** Primary interactive accent, map markers, focus indicators, and active tabs. Contrast ratio 6.88:1 (WCAG AAA Large / AA Body).
- **Ancient Bronze / Terracotta (`#9C6644`):** Secondary cultural accent for dynastic lineage, postal PIN resolution, and regional craft traditions. Contrast ratio 4.72:1 (WCAG AA).
- **Whisper Hairlines (`rgba(24, 24, 27, 0.08)` / `rgba(24, 24, 27, 0.16)`): Crisp 1px structural framing replacing heavy border rules.
- **Archival Verified (`#166534` / `#F0FDF4`):** 100% mathematical claim verification badge and audit indicators.
- **Archival Flagged (`#991B1B` / `#FEF2F2`):** Contradiction warning and automatic fallback banner.
- **Antiquity Notice (`#8A5A00` / `#FEF9C3`):** Sensitivity alerts and provenance notifications.

## Typography

The typography system pairs high-prestige editorial display serifs with crystalline grotesk body type:

- **Display Modern Serif (`Fraunces`):** Variable optical sizing (`opsz` 9..144) for hero headlines, masterwork title plates, and verbatim historical quotes. Features warm, sculptural serifs and editorial italic ligatures.
- **High-Clarity Grotesk (`Geist`):** Engineered for legibility across audience adaptations (Adult, Child, Specialist, Accessibility), curator form inputs, and spatial museum directories.
- **Archival Monospace (`Geist Mono`):** Applied to atomic claim reference IDs (`c1`, `c2`), 6-digit postal PIN codes, geographic coordinates, and verification hashes.

| Level | Family | Weight | Size | Line Height | Tracking | Purpose |
|---|---|---|---|---|---|---|
| `display-hero` | `Fraunces` | 600 | `3.75rem` | `1.08` | `-0.025em` | Hero title plates |
| `display-section` | `Fraunces` | 600 | `2.00rem` | `1.15` | `-0.02em` | Section headers |
| `display-card` | `Fraunces` | 600 | `1.25rem` | `1.25` | `-0.015em` | Artifact card titles |
| `canonical-quote` | `Fraunces` (Italic) | 400 | `1.125rem` | `1.65` | `0` | Verbatim museum wall texts |
| `body-editorial` | `Geist` | 400 | `1.0625rem` | `1.65` | `-0.01em` | Persona narrative body |
| `body-ui` | `Geist` | 450 | `0.875rem` | `1.50` | `0` | Form labels, UI controls |
| `badge-pill` | `Geist` | 600 | `0.6875rem` | `1.00` | `+0.06em` | Period chips, material tags |
| `code-mono` | `Geist Mono` | 500 | `0.8125rem` | `1.40` | `+0.03em` | Claim IDs, coordinates |

## Layout

Layouts employ asymmetric pacing and deliberate negative space inspired by world-class museum exhibitions:

- **Asymmetric Split Hero:** 7:5 ratio pairing a left-aligned narrative intro with an inline visual punctuation and spotlight preview plate.
- **Staggered Diagonal Masonry:** Variable-height cards celebrating artifact orientation (tall bronze statues vs. wide architectural reliefs) rather than rigid uniform grids.
- **Dual-Column Exhibition Split (Screen 2):** Sticky high-resolution photographic masterwork plate on the left with interactive "Look Closer" callout pins; scrollable editorial panel with 0ms verbatim switch on the right.
- **Spatial Heritage Discovery Canvas (Screen 3):** Full-bleed interactive India SVG map canvas synchronized with a filterable 35+ museum directory list.
- **Postal Lineage Studio (Screen 4):** Prominent 6-digit PIN code search resolver with dynastic chronology badges, Web Speech audio narration, and traditional craft deep-dives.
- **Curator Ingestion Wizard (Screen 5):** Tactile 4-step progressive disclosure wizard with real-time atomic claim verification.
- **Responsive Containment:** All screens enforce `min-h-[100dvh]` with strict zero horizontal scroll on mobile viewports (<768px).

## Elevation & Depth

Surfaces use subtle, natural light shadows (`3000K` museum spotlighting) layered over whisper hairlines:

- **Resting Card (`--shadow-card`):** `0 8px 24px -6px rgba(24, 24, 27, 0.04), 0 2px 6px -2px rgba(24, 24, 27, 0.02)`.
- **Exhibition Lift (`--shadow-museum`):** `0 20px 40px -15px rgba(24, 24, 27, 0.06), 0 0 0 1px rgba(24, 24, 27, 0.04)`.
- **Photographic Masterwork Plate (`--shadow-plate`):** `0 24px 48px -12px rgba(24, 24, 27, 0.08), 0 8px 16px -4px rgba(24, 24, 27, 0.03)`.
- **Floating Persona Bar / Popover (`--shadow-popover`):** `0 12px 32px -4px rgba(24, 24, 27, 0.10), 0 4px 12px -2px rgba(24, 24, 27, 0.05)`.
- **Slide-Over Drawer (`--shadow-drawer`):** `-10px 0 40px -10px rgba(24, 24, 27, 0.12)`.

## Shapes

- **Base Radius (`rounded-md: 8px`):** Used for interactive buttons, search inputs, and modal action controls.
- **Card Radius (`rounded-xl: 16px`):** Used for artifact exhibition cards, museum directory cards, and narrative panels.
- **Pill Radius (`rounded-full: 9999px`):** Used for period badges (`c. 2300–1750 BCE`), material tags, persona switcher pills, and verification chips.
- **Matting Inset:** Archival mats utilize a minimum 8px to 16px perimeter inset around photographic plates.

## Components

- **Tactile Micro-Interactions (`.tactile-press`):** Instant haptic response (`active:scale-[0.98] active:translate-y-[0.5px]`) governed by spring physics (`stiffness: 100, damping: 20`).
- **Museum Card Hover (`.museum-card-lift`):** Smooth elevation lift on pointer hover (`hover:-translate-y-1 hover:shadow-museum`).
- **0ms Verbatim Switch:** Instantaneous toggle between multi-voice adapted interpretation and verbatim canonical museum wall text with fixed min-height to prevent Cumulative Layout Shift (CLS).
- **Slide-Over Factual Fidelity Auditor Drawer:** Right-sliding drawer with atomic claim verification breakdown (`c1`–`c6`), criticality tags (`must_include`, `contextual`, `hedge`), and mathematical verification scorecards.
- **Persona Switcher:** In-situ floating segmented control for instantaneous switching between Adult, Child, Specialist, and Accessibility reading modes.
- **Custom Museum Scrollbars:** Subtle 6px hairline scrollbars styled in muted stone with patina thumb hover.

## Do's and Don'ts

### Do's
- **Do** use `Fraunces` for masterwork titles, canonical museum quotes, and section titles with optical sizing enabled.
- **Do** ground pages in warm museum paper (`#FAF8F4`) and pure surface matting (`#FFFFFF`).
- **Do** use whisper hairlines (`rgba(24, 24, 27, 0.08)`) to structure layout hierarchy.
- **Do** ensure all interactive buttons and links feature `.tactile-press` feedback.
- **Do** guarantee 100% mathematical claim preservation with zero hallucinated facts across all audience voices.
- **Do** preserve full mobile responsiveness with touch targets $\ge 44 \times 44\text{px}$ and `min-h-[100dvh]`.

### Don'ts
- **Don't** use generic `Inter` or default SaaS sans-serif fonts for museum curation headlines.
- **Don't** use neon purple, cyan, or blue glowing gradients.
- **Don't** use rigid equal-width 3-card columns without visual rhythm or asymmetric pacing.
- **Don't** use pure `#000000` pitch black text or harsh gray borders (`#E5E7EB`).
- **Don't** allow cumulative layout shifts during persona switching or verbatim toggles.
