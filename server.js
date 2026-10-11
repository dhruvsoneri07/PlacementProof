const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const root = __dirname;
const port = Number(process.env.PORT || 3000);

const dataFilePath = path.join(root, 'data', 'notices.json');
const auditLogsPath = path.join(root, 'data', 'audit-logs.json');

// --- Cryptographic Engine ---
function generateNoticeHash(notice) {
  const canonicalString = [
    (notice.id || '').trim().toUpperCase(),
    (notice.company || '').trim().toLowerCase(),
    (notice.domain || '').trim().toLowerCase(),
    (notice.contact || '').trim().toLowerCase(),
    Number(notice.feeValue ?? 0),
    (notice.deadline || '').trim().toLowerCase(),
  ].join('|');
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

// --- Storage Helpers ---
function readNotices() {
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    const data = JSON.parse(raw);
    let changed = false;
    // Ensure all notices have a cryptographically computed SHA-256 hash
    data.notices = (data.notices || []).map((notice) => {
      const computed = generateNoticeHash(notice);
      if (notice.hash !== computed) {
        notice.hash = computed;
        changed = true;
      }
      return notice;
    });
    if (changed) writeNotices(data);
    return data;
  } catch (err) {
    return { notices: [] };
  }
}

function writeNotices(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

function readAuditLogs() {
  try {
    const raw = fs.readFileSync(auditLogsPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { logs: [] };
  }
}

function logAuditEvent(entry) {
  try {
    const store = readAuditLogs();
    const logItem = {
      id: `AUDIT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    store.logs.unshift(logItem);
    if (store.logs.length > 100) store.logs = store.logs.slice(0, 100); // retain last 100
    fs.writeFileSync(auditLogsPath, JSON.stringify(store, null, 2), 'utf-8');
    return logItem;
  } catch (err) {
    console.error('Failed to log audit event:', err);
    return null;
  }
}

// --- Defensive Cybersecurity Middlewares ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://placehold.co"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));

// Anti-DDoS / Rate Limiter for Notice Verification
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // 120 verification requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded: too many verification queries. Please try again later.' },
});

// Serve static assets from public/ and root
app.use(express.static(path.join(root, 'public')));
app.use('/data', express.static(path.join(root, 'data')));

// --- Page Routes (Multi-Page Architecture) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(root, 'public', 'index.html'));
});

app.get('/check', (req, res) => {
  res.sendFile(path.join(root, 'public', 'check.html'));
});

app.get('/board', (req, res) => {
  res.sendFile(path.join(root, 'public', 'board.html'));
});

app.get('/portal', (req, res) => {
  res.sendFile(path.join(root, 'public', 'portal.html'));
});

// --- REST API Routes ---

// 1. List Notices (with search & status filter)
app.get('/api/notices', (req, res) => {
  const store = readNotices();
  let notices = store.notices;

  const { status, search } = req.query;
  if (status && status !== 'all') {
    notices = notices.filter(n => n.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    notices = notices.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.company.toLowerCase().includes(q) ||
      n.id.toLowerCase().includes(q) ||
      n.domain.toLowerCase().includes(q)
    );
  }

  res.json({ notices });
});

// 2. Post New Notice (Placement Officer)
app.post('/api/notices', (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.company || !payload.domain || !payload.contact) {
      return res.status(400).json({ error: 'Title, company, domain, and contact email are required.' });
    }

    const store = readNotices();
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const randomSeq = String(Math.floor(100 + Math.random() * 900));
    const noticeId = payload.id || `PP-2026-${randomSeq}`;
    const feeNum = Number(String(payload.fee ?? 0).replace(/[^0-9.]/g, '')) || 0;

    const newNotice = {
      id: noticeId,
      title: payload.title.trim(),
      company: payload.company.trim(),
      type: payload.type || 'Job',
      location: payload.location || 'Pan India / Remote',
      domain: payload.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
      officialUrl: payload.officialUrl || `https://${payload.domain}`,
      contact: payload.contact.trim().toLowerCase(),
      deadline: payload.deadline || 'Open',
      fee: `₹${feeNum.toLocaleString('en-IN')}`,
      feeValue: feeNum,
      reviewedOn: payload.status === 'approved' ? todayFormatted : 'Pending review',
      reviewer: payload.status === 'approved' ? (payload.reviewer || 'Training & Placement Cell') : 'Awaiting officer review',
      status: payload.status || 'pending',
      sourceNote: payload.sourceNote || (payload.status === 'approved' ? 'Verified by Training & Placement Cell' : 'Submitted for placement cell verification.')
    };

    newNotice.hash = generateNoticeHash(newNotice);

    store.notices.unshift(newNotice);
    writeNotices(store);

    logAuditEvent({
      noticeId: newNotice.id,
      action: 'NOTICE_CREATED',
      result: 'SUCCESS',
      details: `Created notice for ${newNotice.company} (${newNotice.title}) with status ${newNotice.status}`,
      severity: 'INFO',
      ip: req.ip,
    });

    res.status(201).json({ success: true, notice: newNotice });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. Update Notice Status
app.patch('/api/notices/:id', (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const store = readNotices();
    const index = store.notices.findIndex(n => n.id.toLowerCase() === id.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ error: `Notice with ID ${id} not found.` });
    }

    const existing = store.notices[index];
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (payload.status) {
      existing.status = payload.status;
      if (payload.status === 'approved') {
        existing.reviewedOn = todayFormatted;
        existing.reviewer = 'Training & Placement Cell';
        existing.sourceNote = 'Source URL and contact verified by Training & Placement Cell.';
      } else if (payload.status === 'withdrawn') {
        existing.reviewedOn = todayFormatted;
        existing.sourceNote = 'The placement cell withdrew this opportunity. Do not apply using old copies.';
      }
    }

    if (payload.reviewer) existing.reviewer = payload.reviewer;
    if (payload.sourceNote) existing.sourceNote = payload.sourceNote;
    if (payload.deadline) existing.deadline = payload.deadline;

    existing.hash = generateNoticeHash(existing);

    writeNotices(store);

    logAuditEvent({
      noticeId: existing.id,
      action: 'NOTICE_UPDATED',
      result: 'SUCCESS',
      details: `Updated status of notice ${existing.id} to ${existing.status}`,
      severity: 'INFO',
      ip: req.ip,
    });

    res.json({ success: true, notice: existing });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update notice' });
  }
});

// 4. Delete Notice
app.delete('/api/notices/:id', (req, res) => {
  const id = req.params.id;
  const store = readNotices();
  const initialLen = store.notices.length;
  store.notices = store.notices.filter(n => n.id.toLowerCase() !== id.toLowerCase());

  if (store.notices.length === initialLen) {
    return res.status(404).json({ error: `Notice with ID ${id} not found.` });
  }

  writeNotices(store);

  logAuditEvent({
    noticeId: id,
    action: 'NOTICE_DELETED',
    result: 'SUCCESS',
    details: `Notice ${id} permanently removed by officer.`,
    severity: 'WARNING',
    ip: req.ip,
  });

  res.json({ success: true, id });
});

// 5. Advanced Forensic Verification Engine (Threat & Cryptographic Analysis)
app.post('/api/verify', verifyLimiter, (req, res) => {
  const { noticeId, domain, contact, fee, rawText } = req.body;
  const store = readNotices();

  const id = (noticeId || '').trim();
  const approved = store.notices.find(n => n.id.toLowerCase() === id.toLowerCase() && n.status === 'approved');

  // Threat & Phishing Heuristic Checks
  const phishingFlags = [];
  const freeEmailProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com', 'proton.me'];
  const submittedContact = (contact || '').trim().toLowerCase();
  const submittedDomain = (domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const submittedFee = Number(String(fee ?? 0).replace(/[^0-9.]/g, '')) || 0;

  // Check 1: Free email provider
  const emailDomain = submittedContact.includes('@') ? submittedContact.split('@')[1] : '';
  if (freeEmailProviders.includes(emailDomain)) {
    phishingFlags.push({
      type: 'FREE_EMAIL_RISK',
      severity: 'HIGH',
      message: `Contact uses a free public email service (@${emailDomain}). Legitimate campus recruiters use verified corporate domains.`
    });
  }

  // Check 2: Domain mismatch between email and claimed employer website
  if (emailDomain && submittedDomain && !freeEmailProviders.includes(emailDomain)) {
    if (!emailDomain.includes(submittedDomain) && !submittedDomain.includes(emailDomain)) {
      phishingFlags.push({
        type: 'DOMAIN_MISMATCH',
        severity: 'MEDIUM',
        message: `Contact email domain (@${emailDomain}) does not match the employer website (${submittedDomain}).`
      });
    }
  }

  // Check 3: Fee extortion risk
  if (submittedFee > 0) {
    phishingFlags.push({
      type: 'UPFRONT_FEE_RISK',
      severity: 'CRITICAL',
      message: `Demanding ₹${submittedFee.toLocaleString('en-IN')}. Under official placement cell policies, no legitimate recruiter charges student registration or training fees.`
    });
  }

  // Check 4: Raw Text Threat Keyword Scanner (if raw WhatsApp/SMS forward pasted)
  if (rawText && typeof rawText === 'string') {
    const textLower = rawText.toLowerCase();
    const threatKeywords = [
      { word: 'deposit', desc: 'Demands refundable security deposit' },
      { word: 'registration fee', desc: 'Demands upfront registration charges' },
      { word: 'immediate transfer', desc: 'Urgency coercion for money' },
      { word: 'telegram', desc: 'Directing students to private anonymous chat channels' },
      { word: 'qr code', desc: 'Asking for payment via unverified QR scan' },
      { word: 'upi', desc: 'Personal payment transfer request' },
    ];

    threatKeywords.forEach(k => {
      if (textLower.includes(k.word)) {
        phishingFlags.push({
          type: 'SUSPICIOUS_KEYWORD',
          severity: 'HIGH',
          message: `Suspicious wording detected: "${k.word}" (${k.desc}).`
        });
      }
    });
  }

  // If Notice is Unknown in Approved Records
  if (!approved) {
    logAuditEvent({
      noticeId: id || 'UNSPECIFIED',
      action: 'VERIFY_ATTEMPT',
      result: 'NOT_REVIEWED',
      details: `Unknown or unreviewed notice checked: ${id || 'N/A'}. Flags: ${phishingFlags.length}`,
      severity: phishingFlags.length > 0 ? 'HIGH' : 'LOW',
      ip: req.ip,
    });

    return res.json({
      state: 'unknown',
      noticeId: id,
      phishingFlags,
      submitted: { domain: submittedDomain, contact: submittedContact, fee: submittedFee },
      guidance: 'This notice is not recorded in your college placement records. Do not pay any fee or disclose identity documents. Share this with your Placement Officer.'
    });
  }

  // Notice Exists: Perform Field-by-Field & Cryptographic Integrity Check
  const domainMatch = submittedDomain === approved.domain.toLowerCase();
  const contactMatch = submittedContact === approved.contact.toLowerCase();
  const feeMatch = submittedFee === approved.feeValue;

  const fields = [
    { label: 'Employer Domain', submitted: submittedDomain, approved: approved.domain, different: !domainMatch },
    { label: 'Recruitment Contact', submitted: submittedContact, approved: approved.contact, different: !contactMatch },
    { label: 'Requested Fee', submitted: `₹${submittedFee.toLocaleString('en-IN')}`, approved: approved.fee, different: !feeMatch },
  ];

  // Cryptographic Signature Comparison
  const mockSubmittedNotice = {
    id: approved.id,
    company: approved.company,
    domain: submittedDomain,
    contact: submittedContact,
    feeValue: submittedFee,
    deadline: approved.deadline,
  };
  const submittedHash = generateNoticeHash(mockSubmittedNotice);
  const hashMatches = (submittedHash === approved.hash);

  const isTampered = !domainMatch || !contactMatch || !feeMatch || !hashMatches;
  const state = isTampered ? 'different' : 'match';

  // Audit Log
  logAuditEvent({
    noticeId: approved.id,
    action: 'VERIFY_ATTEMPT',
    result: isTampered ? 'TAMPER_DETECTED' : 'VERIFIED_MATCH',
    details: isTampered
      ? `Tampering detected on notice ${approved.id}. Hash matched: ${hashMatches}. Fee submitted: ₹${submittedFee}`
      : `Verified match for notice ${approved.id}. SHA-256 integrity confirmed.`,
    severity: isTampered ? 'HIGH' : 'LOW',
    ip: req.ip,
  });

  res.json({
    state,
    notice: approved,
    fields,
    phishingFlags,
    cryptography: {
      approvedHash: approved.hash,
      submittedHash,
      integrityVerified: hashMatches,
      algorithm: 'SHA-256',
      canonicalFields: 'ID|COMPANY|DOMAIN|CONTACT|FEE|DEADLINE'
    },
    verificationTimestamp: new Date().toISOString(),
  });
});

// 6. Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  const store = readAuditLogs();
  res.json({ logs: store.logs });
});

// Start Express Server
const serverInstance = app.listen(port, '0.0.0.0', () => {
  console.log(`placementProof (Express MPA) running at http://localhost:${port}`);
});

module.exports = { app, serverInstance, generateNoticeHash };
