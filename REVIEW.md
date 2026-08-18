# REVIEW — Digital Muse (MUSEUM)

Running record of what went wrong and how it was corrected.
Append only. Never delete a row — an erased mistake gets made again.

Read this file before starting work here.

Write a row when: a mistake was caught and fixed, a plan or assumption turned out wrong,
something took several attempts, or the user corrected something.
Do not write a row for ordinary iteration. The bar is: *would knowing this in advance have
changed what I did?*

---

## 2026-08-18 — Vercel 404: NOT_FOUND due to nested app path and broken remote build
- **What went wrong:** Vercel deployment at `https://museum-ebon-two.vercel.app/` returned 404: NOT_FOUND error.
- **Why:** The Next.js application was originally nested inside a `muse/` subfolder without a root `vercel.json` or updated Vercel project root setting, and subsequent fixes in `app/api/verify/route.ts` were uncommitted/unpushed to `origin/main`.
- **How it was corrected:** Moved Next.js application to repo root, created root `vercel.json` with `"framework": "nextjs"`, fixed syntax and typing errors in API routes, adjusted ESLint configurations, and pushed commits `eab9d7a` and `a9064d4` to `origin/main`.
- **Prevention:** Always configure `vercel.json` when deploying Next.js from repository root, run full production build and lint before push, and verify live edge URL status post-deploy.

## 2026-08-18 — PIN code geospatial resolver sanitized non-digit chars rather than rejecting malformed formats
- **What went wrong:** `findNearestMuseumForPincode` sanitized inputs using `.replace(/\D/g, '')`, inadvertently accepting hyphenated and malformed non-strict strings (e.g. `11-0011`, `11 00 11`) instead of strictly requiring valid 6-digit Indian postal strings.
- **Why:** Premature sanitization before format validation masked malformed query formats.
- **How it was corrected:** Enforced strict regex validation `/^[1-9][0-9]{5}$/` on trimmed strings in `lib/museums.ts` and `lib/pincodes.ts`, and verified against 92 adversarial cases.
- **Prevention:** Validate strict string schema contracts before sanitizing or mutating input tokens.

## 2026-08-18 — Map zoom controls disconnected and placeholder mock vector line
- **What went wrong:** Magnifying zoom controls updated state but were not bound to SVG/canvas transform, and map rendering used placeholder dot patterns and dummy path without authentic Indian geographic boundaries.
- **Why:** `zoomLevel` state was unconnected to DOM styling and lacked a calibrated geographic projection matrix and SVG cartography.
- **How it was corrected:** Created `IndiaMuseumMap.tsx` with authentic high-fidelity SVG contours (mainland India, island archipelagos, river systems, terrain ridges), integrated dynamic pan & zoom (1x-4x) with touch/mouse dragging, purged all "NanoBanana" text, added tabbed museum browsing on Collection page, and integrated Web Speech API narration across all 35 museums.
- **Prevention:** Always bind interactive state to actual rendering transforms and test visual scaling via mechanical state machine test suites.
