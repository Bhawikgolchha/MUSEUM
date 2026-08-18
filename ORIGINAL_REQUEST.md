# Original User Request

## 2026-08-18T14:16:13+05:30

Implement an interactive museum doubt chat system below each museum card powered by OpenRouter API, expand the national museum directory by adding 10+ authentic Indian museums with unique PIN codes and metadata, and build a nearest-museum fallback modal when a searched PIN code yields no direct results.

Working directory: d:\Hackathon
Integrity mode: development

## Requirements

### R1. Museum Doubt Chat Box
- Under every museum card on the discovery/explore interface, provide an expandable drawer containing an interactive AI doubt chat box.
- The chat box must support pre-set doubt questions (e.g. timings, fees, highlights, accessibility) as well as free-form user questions.
- Use the configured OpenRouter API key to stream or generate grounded answers based on the specific museum's operational details, history, and collection facts.
- Present clear visual feedback during generation and handle error cases gracefully.

### R2. Dataset Expansion with 10+ New Indian Museums
- Add at least 10 authentic Indian museums to the directory across diverse states and PIN codes (e.g., Jaipur, Ahmedabad, Thiruvananthapuram, Pune, Udaipur, Shillong, Panaji, Lothal, Jammu).
- Each museum entry must contain complete verified metadata: 6-digit postal PIN code, latitude/longitude coordinates, opening/closing schedule, domestic and foreign entry fees, accessibility features, categories, high-resolution thumbnail references, and cultural descriptions.

### R3. PIN Code Search & Nearest Museum Fallback Modal
- Enhance the area and PIN code search functionality so that searching by any 6-digit Indian PIN code queries the museum repository.
- If no museum exists in the queried PIN code or its immediate vicinity, display a "Not Found" notification modal indicating that no museum was found for the entered PIN code, displaying the nearest discovered museum with calculated Haversine distance, and offering a one-click action to view and center on that nearest museum.

## Acceptance Criteria

### AI Chat Verification
- [ ] Every museum card on `/explore` renders an "Ask Doubt" toggle button that expands an inline chat drawer.
- [ ] Submitting a question sends a request to `/api/museum-chat` with the museum context and OpenRouter API key, returning a valid, factual answer.
- [ ] Pre-set doubt prompt chips automatically populate and submit relevant questions.

### Directory Expansion Verification
- [ ] The museum dataset in `data/indian-museums.json` contains a minimum of 18 total museums (at least 10 newly added).
- [ ] All new museums have valid 6-digit PIN codes, valid numeric coordinates (lat/lon within India), and complete metadata fields.

### Nearest Museum Fallback Verification
- [ ] Searching a PIN code with no direct museum match triggers a "Not Found" modal.
- [ ] The modal calculates and displays the nearest museum name and accurate distance in kilometers, with an interactive button to switch to that museum.

### System & Build Verification
- [ ] `npm run build` completes with 0 TypeScript or lint errors.
- [ ] All interactive flows function properly across desktop and mobile screen sizes.
