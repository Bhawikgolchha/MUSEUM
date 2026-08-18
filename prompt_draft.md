# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full team

Build and integrate the "Find Museums by Area" spatial discovery feature with interactive NanoBanana map visualization, city/PIN/area search, multi-facet filtering (categories, opening hours, accessibility), and seamless deep-linking to the Digital Muse adaptive interpretation engine across museums in India.

Working directory: d:\Hackathon\muse
Integrity mode: development

## Requirements

### R1. Spatial Search & Autocomplete
Support searching Indian museums by city (Delhi, Chennai, Kolkata, Mumbai, Varanasi, Patna, Bengaluru, Hyderabad), postal PIN code (e.g. 110001), landmark, or HTML5 Geolocation ("Near Me") with customizable radius (5 km, 10 km, 25 km, 50 km, 100 km).

### R2. NanoBanana Interactive Map Visuals
Render an interactive map canvas with custom heritage pin markers, urban cluster collapsing, bidirectional card-pin synchronization, and smooth viewport transitions. Provide 100% graceful fallback to SVG schematic map if API keys are absent.

### R3. Dual-Pane Split Interface & Filter Facets
Implement a responsive split view (map + scrollable museum result cards) with instant filter toggles:
- Category (Archaeology, Art & Sculpture, Science & Tech, Textiles, Multidisciplinary)
- Open Today status (evaluated against day-of-week closure rules)
- Free entry vs ticketed pricing
- Wheelchair accessibility badges

### R4. Museum Details & Digital Muse Deep-Linking
Provide a rich museum detail modal with gallery carousel, full address, contact details, operating hours schedule, and direct 1-tap links to the Digital Muse adaptive artifact reader for featured masterworks.

## Acceptance Criteria

### Verification & Performance
- [ ] Spatial search resolves within 250ms client-side using Haversine calculation.
- [ ] Typing any supported city or PIN filters the museum list and centers the map.
- [ ] Clicking a museum pin highlights the card and opens the details drawer.
- [ ] Clicking "Explore with Digital Muse" navigates to `/artifact/[id]` with verified factual interpretation.
- [ ] Zero runtime errors if `OPENROUTER_API_KEY` or `NEXT_PUBLIC_NANOBANANA_KEY` is omitted.
