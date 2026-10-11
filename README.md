# placementProof

A security-first, multi-page web application for verifying college placement and internship notices before students pay or apply. Built for MSc Cyber Security coursework.

---

## Key Features

1. **Multi-Page Architecture (MPA)**:
   - `/` — **Landing Page**: Project overview, SDG 8 context, real-world CERT-In advisories, and quick workspace navigation.
   - `/check` — **Notice Checker Workbench**: Structured field comparison, raw WhatsApp/SMS message forensic parser, and cryptographic tamper detection.
   - `/board` — **Approved Placements Board**: Live searchable directory of verified campus drives with guaranteed ₹0 fee policies and SHA-256 fingerprints.
   - `/portal` — **Placement Officer Portal**: Administrative console for publishing notices, managing review queues, signing SHA-256 hashes, and inspecting threat audit logs.

2. **Cybersecurity & Cryptographic Integrity**:
   - **SHA-256 Notice Provenance**: Every approved listing is cryptographically fingerprinted across canonical fields `(ID|COMPANY|DOMAIN|CONTACT|FEE|DEADLINE)`.
   - **Mathematical Tamper Detection**: If a forwarded message alters even ₹1 or a single letter in the email, the SHA-256 mismatch provides mathematical proof of tampering.
   - **Threat & Phishing Heuristics**: Automated flags for free public email services (`@gmail.com`), domain mismatches, upfront fee demands, and high-pressure urgency keywords.
   - **Defensive Server Hardening**: Express.js with `helmet` (CSP, HSTS, X-Content-Type-Options) and `express-rate-limit` against automated brute-force scraping.
   - **Security Audit Logging**: Captures forensic logs of verification attempts in `data/audit-logs.json`.

---

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   npm start
   ```

3. Open your browser:
   - **Landing Page**: `http://localhost:3000/`
   - **Notice Checker**: `http://localhost:3000/check`
   - **Approved Board**: `http://localhost:3000/board`
   - **Officer Portal**: `http://localhost:3000/portal` (PIN: `officer2026`)

---

## Running the Automated Test Suite

To run the automated assert-based test suite that verifies all page routes, security headers, SHA-256 generation, verification matching, and tamper detection:

```bash
npm test
```
