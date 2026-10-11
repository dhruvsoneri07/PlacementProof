# placementProof implementation plan

## Product approach

Build a lightweight, single-page prototype for an Indian college placement cell. Students can browse officer-reviewed opportunities, compare a forwarded notice with the approved source record, and understand the next step without being told that an unknown offer is automatically safe or fraudulent. Placement staff can switch to a clearly marked demo review view to see pending, approved and withdrawn notices.

The app uses plain HTML, CSS and JavaScript with one local JSON data file. It does not pretend that the demo role switch is access control. Real deployment would add authenticated reviewers and a maintained employer registry.

## Design direction

- **Design movement:** calm editorial utility — a practical notice board with a little print-like warmth, not a dense enterprise dashboard.
- **Core principles:** clear before clever; evidence over alarm; soft hierarchy; friendly guidance.
- **Color philosophy:** warm paper (`#f7f2ea`) keeps the page approachable, ink navy (`#17324d`) gives trustworthy contrast, deep green (`#146b5d`) signals reviewed provenance, and coral (`#e36f5f`) calls attention to differences without using panic red.
- **Layout paradigm:** an offset page shell with a slim rail-like header, a wide hero notice, and stacked evidence cards. On mobile, it becomes a single reading column.
- **Signature elements:** the small “pp” mark in a rounded square, stamped-style status pills, and thin ruler lines used as separators.
- **Interaction philosophy:** users get a preview first, then details on demand. Checker results show each compared field, the difference, and the next action in plain language.
- **Animation:** only small 150–220ms fades and gentle button movement; no distracting motion.
- **Typography system:** system UI sans stack for clarity, with a serif display fallback for the main headline to feel like an official bulletin. Labels are compact uppercase with letter spacing.
- **Brand essence:** a calm checkpoint for students before they apply or pay. Personality: careful, welcoming, practical.
- **Brand voice:** short, human and non-judgemental. Example lines: “Check the notice before you act.” and “A detail changed — pause and verify with your placement cell.”
- **Wordmark & logo:** a two-letter `pp` monogram in a rounded square, paired with the lowercase wordmark.
- **Signature brand color:** deep green `#146b5d`, used only for reviewed provenance and positive guidance.

## Screens and behavior

1. **Approved opportunities board:** show one approved “BrightPath Analytics” graduate analyst notice with source URL, review date, deadline, fee policy and approved contact. Include another withdrawn example so the status language is visible.
2. **Notice checker:** accept notice ID, domain, contact email and requested fee. Prefill a forwarded example with `fee = ₹1,499`, compare with approved `₹0`, and show `details differ` plus a field-by-field evidence panel. A clean matching example shows `matches approved notice`. Unknown IDs show `not reviewed`.
3. **Placement review dashboard:** show summary counts and cards for pending, approved and withdrawn states. Include an explicit “Demo role switch — not access control” note.
4. **Evidence/result panel:** make the next verification step prominent: do not pay, use the official source link, and contact the placement cell using the recorded contact. State that a difference is not proof of fraud, but it is a reason to pause.
5. **Context and SDG 8 note:** explain why final-year students, first-time job seekers and the placement cell need provenance, and connect the prototype to SDG 8 without claiming a local fraud rate. Include source notes for the CERT-In and PIB/Ministry references supplied in the brief.

## Project structure

- `server.js` — tiny static file server on port 3000; serves the app and JSON.
- `index.html` — semantic single-page shell with sections for board, checker, dashboard and guidance.
- `styles.css` — responsive visual system and state styles.
- `app.js` — local dataset loading, navigation, checker comparison, result rendering and demo interactions.
- `data/notices.json` — approved, forwarded, pending and withdrawn notice records.
- `public/manus-routes.json` — route manifest for the single-page app.
- `app.config.ts` — project logo metadata for checkpointing.

## Dependencies and constraints

No external packages are needed. The app should work with `node server.js`, listen on `0.0.0.0:3000`, keep all links relative except official employer source links, and avoid authentication claims. Production publication can use a static build declaration with the committed root files if needed.
