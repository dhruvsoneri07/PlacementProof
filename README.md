# PlacementProof 🛡️🎓
### Cybersecurity & Provenance Verification System for College Placement Notices
**MSc Cyber Security — Semester 1 | Coursework: CWT (Cyber Web Technologies)**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-v5.3-black?logo=express)](https://expressjs.com)
[![Security Hardened](https://img.shields.io/badge/Security-Helmet%20%2B%20RateLimit-blue)](https://helmetjs.github.io)
[![Cryptography](https://img.shields.io/badge/Integrity-SHA--256-orange)](https://en.wikipedia.org/wiki/SHA-2)
[![Test Suite](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen)](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/test-api.js)

---

## 1. Executive Summary & Problem Statement

College students are frequent targets of counterfeit campus placement drives and employment scams distributed via WhatsApp, Telegram, and spoofed emails. Fraudsters impersonate legitimate recruiters, request upfront "training", "application", or "laptop deposit" fees, and alter official circular details.

**PlacementProof** is a security-first web application designed to solve this problem. It establishes an authoritative record of university-approved placement drives, guarantees a **strict ₹0 student fee policy**, and uses **SHA-256 cryptographic provenance hashing** combined with **algorithmic threat heuristics** to detect modified or fraudulent notices in real time.

### Alignment with Global Standards
- **UN SDG 8 (Decent Work and Economic Growth)**: Protecting student job seekers from predatory financial exploitation.
- **CERT-In Advisory Compliance**: Addressing fake recruitment drives and unverified corporate email solicitations.

---

## 2. System Architecture & Live Presentation Roadmap

During your presentation, use this high-level workflow to explain how PlacementProof operates:

```
[ Placement Officer ] ──( Publishes Notice )──> [ Canonical String Generator ]
                                                        │
                                                        ▼
                                              [ SHA-256 Hash Engine ]
                                                        │
                                                        ▼
                                            [ Stored in notices.json ]
                                                        │
┌───────────────────────────────────────────────────────┴───────────────────────────────────────────────────────┐
▼                                                                                                               ▼
[ Student Notice Checker (/check) ]                                                         [ Approved Board (/board) ]
  ├── 1. Structured Form / Raw Message                                                        └── Public directory of
  ├── 2. Regex Extraction & Heuristic Scanner                                                     verified drives with
  ├── 3. Canonical Re-Hashing vs Authority Record                                                 ₹0 fee guarantee
  └── 4. Clearance Slip / Red Threat Alert
          │
          ▼
[ Security Audit Logger (audit-logs.json) ] <─── Viewable in Real-Time in [ Officer Portal (/portal) ]
```

---

## 3. Core Modules & Code Map (Where to Find the Code)

Each core capability is mapped directly to its implementation file:

| Module / Feature | What It Does | Source Code Link |
| :--- | :--- | :--- |
| **Backend & Routing** | Express.js 5 Multi-Page Architecture delivering pages and REST endpoints | [`server.js`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/server.js) |
| **Defensive Hardening** | Injects HTTP security headers (CSP, HSTS, X-Content-Type-Options) and rate-limiting | [`server.js:L30-L50`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/server.js#L30-L50) |
| **Cryptographic Provenance** | Computes deterministic canonical SHA-256 fingerprints `(ID\|COMPANY\|DOMAIN\|CONTACT\|FEE\|DEADLINE)` | [`server.js:L56-L65`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/server.js#L56-L65) |
| **Threat Heuristic Engine** | Detects free email scams (`@gmail.com`), fee extortion, domain spoofing, and urgency keywords | [`server.js:L265-L395`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/server.js#L265-L395) |
| **Security Audit Logger** | Logs all verification checks and tamper attempts with timestamps and risk levels | [`server.js:L100-L125`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/server.js#L100-L125) & [`data/audit-logs.json`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/data/audit-logs.json) |
| **Official Notices Store** | Authority dataset storing verified drives and their signed hashes | [`data/notices.json`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/data/notices.json) |
| **Landing Page** | Editorial presentation page with context, CERT-In advisory cards, and interactive preview | [`public/index.html`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/index.html) |
| **Verification Workbench** | Dual-mode student verification UI (structured fields + raw WhatsApp/SMS message parser) | [`public/check.html`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/check.html) & [`public/js/check.js`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/js/check.js) |
| **Approved Placements Board** | Searchable student directory of approved opportunities with search and filter pills | [`public/board.html`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/board.html) & [`public/js/board.js`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/js/board.js) |
| **Placement Officer Portal** | Protected admin console (PIN: `officer2026`) for posting notices and viewing live audit trails | [`public/portal.html`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/portal.html) & [`public/js/portal.js`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/js/portal.js) |
| **Shared Design System** | High-contrast, responsive CSS layout, cybersecurity badges, and modal UI | [`public/styles.css`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/public/styles.css) |
| **Automated Test Suite** | 8-phase assert-based test runner validating routes, headers, hashing, and detection | [`test-api.js`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/test-api.js) |

---

## 4. How the Security Mechanisms Work (Short Technical Explanations)

### A. SHA-256 Mathematical Tamper Detection
- **Concept**: A notice's authenticity is guaranteed through a cryptographic hash.
- **Mechanism**: The backend normalizes fields into a canonical pipeline string:
  ```text
  ID:TNP-2026-001|COMPANY:CYBERDYNE SYSTEMS|DOMAIN:CYBERDYNE.COM|CONTACT:HR@CYBERDYNE.COM|FEE:0|DEADLINE:2026-10-30
  ```
- **Hashing**: Passing this through Node's native `crypto.createHash('sha256')` produces a unique 64-character hexadecimal digest.
- **Detection**: If a scammer alters even ₹1 in the fee or replaces `hr@cyberdyne.com` with `hr-cyberdyne@gmail.com`, the resulting hash changes completely (avalanche effect), producing definitive mathematical proof of tampering.

### B. Threat Heuristics & Phishing Detection
- **Free Mail Provider Rule**: Legitimate campus recruiters do not hire via `@gmail.com`, `@yahoo.com`, or `@outlook.com`. The engine flags public webmail domains.
- **Domain Mismatch Rule**: Checks if the contact email domain matches the official corporate website domain.
- **Upfront Fee Rule**: Legitimate campus placements **never** charge students. Any fee > 0 triggers an immediate high-risk warning.
- **Social Engineering Heuristics**: Scans message content for high-pressure scam triggers (*"urgent"*, *"last chance"*, *"pay deposit"*, *"registration fee"*).

### C. Raw Message Forensic Parser
- Students rarely receive structured JSON—they receive messy WhatsApp or Telegram forwards.
- The client engine uses regular expressions to automatically extract Notice IDs (`TNP-\d{4}-\d{3}`), email addresses, URLs, and fee figures (`₹\s*\d+` or `INR\s*\d+`) from unstructured text.

---

## 5. Live Presentation Demo Script (3-Minute Walkthrough)

When presenting to your teacher and classmates:

1. **Step 1: Introduction (`/`)**
   - Open `http://localhost:3000/`.
   - Point out the SDG 8 context and why student employment scams are an escalating cybersecurity issue.
2. **Step 2: Show Verified Directory (`/board`)**
   - Click **Approved Board** in navigation.
   - Show how verified campus drives display their official ₹0 fee and SHA-256 provenance badges.
3. **Step 3: Simulate a WhatsApp Phishing Scam (`/check`)**
   - Go to **Notice Checker**.
   - Select **Raw Message Paste** mode.
   - Paste this fake notice:
     ```text
     URGENT! Cyberdyne Systems hiring freshers!
     Notice ID: TNP-2026-001
     Send resume to hr.cyberdyne@gmail.com
     Mandatory registration fee: Rs. 500
     Apply immediately!
     ```
   - Click **Scan & Verify Notice**.
   - **Show the Result**: The system flags the `@gmail.com` address, detects the ₹500 fee scam, shows a red warning badge, and confirms hash mismatch!
4. **Step 4: Verify an Authentic Drive (`/check`)**
   - Click **Notice ID Mode**, select `TNP-2026-001`.
   - Leave fee as `₹0` and official email intact.
   - Click **Verify Notice**.
   - **Show the Result**: Green clearance slip appears with matching SHA-256 hash and a printable **Clearance Slip** option.
5. **Step 5: Inspect Audit Logs (`/portal`)**
   - Go to **Officer Portal** and enter PIN: `officer2026`.
   - Scroll to **Security & Verification Audit Log**.
   - Demonstrate that the scam attempt in Step 3 was logged with its timestamp, IP, risk level (`SUSPICIOUS`), and flagged indicators.
6. **Step 6: Terminal Test Validation**
   - Switch to your terminal and run `npm test` to show 100% test automation passing in under 1 second.

---

## 6. How to Run the Project

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm (comes bundled with Node.js)

### Installation & Launch
```bash
# 1. Clone the repository (if on a fresh machine)
git clone https://github.com/dhruvsoneri07/PlacementProof.git
cd PlacementProof

# 2. Install dependencies (express, helmet, express-rate-limit)
npm install

# 3. Start the server
npm start
```

Access the application in your browser:
- **Landing Page**: [http://localhost:3000/](http://localhost:3000/)
- **Notice Checker**: [http://localhost:3000/check](http://localhost:3000/check)
- **Approved Board**: [http://localhost:3000/board](http://localhost:3000/board)
- **Placement Officer Portal**: [http://localhost:3000/portal](http://localhost:3000/portal) *(PIN: `officer2026`)*

---

## 7. How to Test the Project & APIs

### A. Automated Test Suite (`npm test`)
PlacementProof includes an automated, assert-based test runner located in [`test-api.js`](file:///c:/MScCyberSecurity/Sem1/CWT/PlacementProof/test-api.js). It requires **no third-party test framework** (uses Node's native `assert` and `http` modules) and tests the entire system on port `3099`:

```bash
npm test
```

#### What the Automated Suite Validates:
1. **Multi-Page Routes**: Asserts HTTP `200 OK` on `/`, `/check`, `/board`, and `/portal`.
2. **Defensive Headers**: Asserts presence of `x-content-type-options: nosniff` and `content-security-policy` (Helmet).
3. **Directory Retrieval**: Tests `GET /api/notices` and verifies schema structure.
4. **Cryptographic Signing**: Tests `POST /api/notices` and verifies deterministic SHA-256 generation.
5. **Legitimate Verification**: Tests `POST /api/verify` with authentic parameters and verifies `state: "match"` and `integrityVerified: true`.
6. **Tamper & Fee Detection**: Tests `POST /api/verify` with altered ₹1499 fee and verifies `state: "different"`, `integrityVerified: false`, and detection of phishing flags.
7. **Security Threat Auditing**: Tests `GET /api/audit-logs` and verifies that verification queries generate audit records.
8. **Teardown**: Automatically cleans up test records from storage.

---

### B. Manual API Testing via Terminal (`curl` & PowerShell)

You can run these commands during your presentation to demonstrate the backend API directly:

#### 1. Test Verification of an Authentic Notice (Returns `match`)
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d "{\"noticeId\":\"TNP-2026-001\",\"domain\":\"cyberdyne.com\",\"contact\":\"hr@cyberdyne.com\",\"fee\":0}"
```
*Expected response:*
```json
{
  "state": "match",
  "cryptography": {
    "computedHash": "...",
    "officialHash": "...",
    "integrityVerified": true
  },
  "phishingFlags": []
}
```

#### 2. Test Verification of a Tampered Notice with Fake Fee (Returns `different`)
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d "{\"noticeId\":\"TNP-2026-001\",\"domain\":\"cyberdyne.com\",\"contact\":\"hr@cyberdyne.com\",\"fee\":500}"
```
*Expected response:*
```json
{
  "state": "different",
  "cryptography": {
    "integrityVerified": false
  },
  "phishingFlags": [
    "Notice requires a fee of ₹500, but official college policy strictly prohibits any placement fees."
  ]
}
```

#### 3. Test Raw Message Text Scanning
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d "{\"rawText\":\"Notice TNP-2026-001 from cyberdyne.com. Email hr@gmail.com. Fee is INR 250.\"}"
```

#### 4. Inspect Live Audit Logs
```bash
curl http://localhost:3000/api/audit-logs
```

---

## 8. Technology Stack

- **Runtime & Language**: Node.js, JavaScript (ESM / CommonJS)
- **Web Framework**: Express.js (`v5.3.0`)
- **Security Middlewares**: `helmet` (`v8.3.0`), `express-rate-limit` (`v8.7.1`)
- **Cryptography**: Node.js native `crypto` module (SHA-256)
- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom responsive design tokens, glassmorphism, high-contrast dark badges), Vanilla JavaScript
- **Data Persistence**: Atomic JSON flat-file storage (`data/notices.json`, `data/audit-logs.json`)

---

## 9. Contributors & Academic Attribution
- **Dhruv Soneri** & Collaborator Team
- **Course**: MSc Cyber Security (Semester 1)
- **Module**: Cyber Web Technologies (CWT)
- **License**: MIT Academic License
