// Notice Verification & Threat Detection Engine (Checker)

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#checker-form');
  const rawForm = document.querySelector('#raw-checker-form');
  const resultBox = document.querySelector('#checker-result-box');

  const tabForm = document.querySelector('#tab-form-mode');
  const tabRaw = document.querySelector('#tab-raw-mode');

  // Mode switching
  if (tabForm && tabRaw) {
    tabForm.addEventListener('click', () => {
      tabForm.classList.add('active');
      tabRaw.classList.remove('active');
      form.style.display = 'block';
      rawForm.style.display = 'none';
    });

    tabRaw.addEventListener('click', () => {
      tabRaw.classList.add('active');
      tabForm.classList.remove('active');
      form.style.display = 'none';
      rawForm.style.display = 'block';
    });
  }

  // Quick test examples
  document.querySelector('#btn-example-match')?.addEventListener('click', () => {
    fillFields('PP-2026-014', 'brightpathanalytics.in', 'campus@brightpathanalytics.in', 0);
  });

  document.querySelector('#btn-example-tamper')?.addEventListener('click', () => {
    fillFields('PP-2026-014', 'brightpathanalytics.in', 'campus@brightpathanalytics.in', 1499);
  });

  document.querySelector('#btn-example-phish')?.addEventListener('click', () => {
    fillFields('PP-2026-014', 'brightpath-jobs.xyz', 'brightpath.campus@gmail.com', 2499);
  });

  function fillFields(id, domain, contact, fee) {
    if (tabForm && tabRaw) {
      tabForm.click();
    }
    document.querySelector('#notice-id').value = id;
    document.querySelector('#domain').value = domain;
    document.querySelector('#contact').value = contact;
    document.querySelector('#fee').value = fee;
    form.requestSubmit();
  }

  // Pre-fill from URL query param if present (?id=PP-2026-014)
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('id');
  if (paramId) {
    document.querySelector('#notice-id').value = paramId;
    fetch(`/api/notices?search=${encodeURIComponent(paramId)}`)
      .then(r => r.json())
      .then(data => {
        const found = (data.notices || []).find(n => n.id.toLowerCase() === paramId.toLowerCase());
        if (found) {
          document.querySelector('#domain').value = found.domain;
          document.querySelector('#contact').value = found.contact;
          document.querySelector('#fee').value = found.feeValue;
          form.requestSubmit();
        }
      })
      .catch(() => { });
  }

  // Raw text message parser
  if (rawForm) {
    rawForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawText = document.querySelector('#raw-text').value;
      if (!rawText.trim()) return;

      // Forensic regex extractions
      const idMatch = rawText.match(/PP-\d{4}-[\w-]+/i);
      const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const urlMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
      const feeMatch = rawText.match(/(?:₹|rs\.?|inr|fee[:\s]*)\s*([\d,]+)/i);

      let extractedDomain = '';
      if (urlMatch && urlMatch[1]) {
        extractedDomain = urlMatch[1].split('/')[0].replace(/^www\./, '');
      }

      const extractedId = idMatch ? idMatch[0].toUpperCase() : '';
      const extractedContact = emailMatch ? emailMatch[0].toLowerCase() : '';
      let extractedFee = 0;
      if (feeMatch && feeMatch[1]) {
        extractedFee = Number(feeMatch[1].replace(/,/g, '')) || 0;
      }

      // Switch to structured form and fill
      tabForm.click();
      document.querySelector('#notice-id').value = extractedId;
      document.querySelector('#domain').value = extractedDomain;
      document.querySelector('#contact').value = extractedContact;
      document.querySelector('#fee').value = extractedFee;

      showToast('Text parsed: details extracted and submitting verification.');
      runVerification({
        noticeId: extractedId,
        domain: extractedDomain,
        contact: extractedContact,
        fee: extractedFee,
        rawText,
      });
    });
  }

  // Form submit handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = {
        noticeId: formData.get('noticeId'),
        domain: formData.get('domain'),
        contact: formData.get('contact'),
        fee: formData.get('fee'),
      };
      runVerification(payload);
    });
  }

  async function runVerification(payload) {
    resultBox.innerHTML = `
      <div class="result-empty" style="min-height: 250px;">
        <div class="status-dot" style="width: 16px; height: 16px; animation: pulse 1s infinite;"></div>
        <p class="muted" style="margin-top: 15px;">Running cryptographic hashing and threat analysis...</p>
      </div>
    `;

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Verification query failed');
      }

      const data = await response.json();
      renderVerificationResult(data);
    } catch (err) {
      resultBox.innerHTML = `
        <div class="threat-alert-box">
          <div class="threat-header"><span>!</span> Error</div>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
      showToast(err.message, 'error');
    }
  }

  function renderVerificationResult(res) {
    // 1. Unknown notice
    if (res.state === 'unknown') {
      let threatHtml = '';
      if (res.phishingFlags && res.phishingFlags.length > 0) {
        threatHtml = `
          <div class="threat-alert-box">
            <div class="threat-header"><span>⚠</span> Phishing &amp; Fraud Indicators Detected (${res.phishingFlags.length})</div>
            <ul class="threat-list">
              ${res.phishingFlags.map(f => `<li><strong>[${escapeHtml(f.severity)}]</strong> ${escapeHtml(f.message)}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      resultBox.innerHTML = `
        <div class="result-header">
          <div>
            <h3>Notice Not Found in Verified Registry</h3>
            <p>We do not have a college-reviewed record matching ID: <strong>${escapeHtml(res.noticeId || 'Unspecified')}</strong></p>
          </div>
          <span class="result-stamp unknown">Not<br />Reviewed</span>
        </div>

        ${threatHtml}

        <p class="evidence-heading">Defensive Next Steps</p>
        <div class="next-step" style="background: #2b1f14; border-left: 4px solid var(--yellow);">
          <span class="next-icon" style="background: var(--yellow); color: #000;">!</span>
          <div>
            <strong style="color: var(--yellow);">Pause and Report</strong>
            <span>Do not transfer any money, enter OTPs, or share ID documents. Contact your college Training &amp; Placement Cell to verify if this employer is actively recruiting.</span>
          </div>
        </div>
      `;
      return;
    }

    // 2. Reviewed notice (Match or Different/Tampered)
    const isMatch = res.state === 'match';
    const stampClass = isMatch ? 'match' : 'differ';
    const stampText = isMatch ? 'Matches<br />Approved Record' : 'Tampering<br />Detected';

    const title = isMatch
      ? 'Cryptographically Verified Notice'
      : 'Tampering Detected: Details Differ from Source Record';

    const subtitle = isMatch
      ? 'All recruitment parameters match the placement cell record and the SHA-256 integrity hash is valid.'
      : 'One or more details have been altered from the official college-approved record.';

    // Phishing alerts
    let threatHtml = '';
    if (res.phishingFlags && res.phishingFlags.length > 0) {
      threatHtml = `
        <div class="threat-alert-box">
          <div class="threat-header"><span>⚠</span> Security Risk Assessment (${res.phishingFlags.length} Flags)</div>
          <ul class="threat-list">
            ${res.phishingFlags.map(f => `<li><strong>[${escapeHtml(f.severity)}]</strong> ${escapeHtml(f.message)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Evidence Diff rows
    const evidenceRows = res.fields.map(f => `
      <div class="evidence-row ${f.different ? 'difference' : ''}">
        <span class="evidence-icon">${f.different ? '!' : '✓'}</span>
        <strong>${escapeHtml(f.label)}</strong>
        <div class="row-values">
          <b>${escapeHtml(f.submitted)}</b>
          <small>${f.different ? `Official Record: ${escapeHtml(f.approved)}` : 'Matches Approved Source'}</small>
        </div>
      </div>
    `).join('');

    // Cryptographic Proof Box
    const crypto = res.cryptography || {};
    const cryptoHtml = `
      <div class="crypto-box">
        <div class="crypto-title">
          <span>SHA-256 Provenance Fingerprint</span>
          <span style="color: ${crypto.integrityVerified ? '#48bb78' : '#e36f5f'};">
            ${crypto.integrityVerified ? '✓ Cryptographic Match' : '✕ Hash Mismatch (Tampered)'}
          </span>
        </div>
        <div style="font-size: 9px; color: #8bb3a8; margin-bottom: 4px;">Approved Hash:</div>
        <div class="crypto-hash">${escapeHtml(crypto.approvedHash || 'N/A')}</div>
        <div style="font-size: 9px; color: #8bb3a8; margin: 8px 0 4px;">Submitted Hash:</div>
        <div class="crypto-hash" style="color: ${crypto.integrityVerified ? '#fff' : '#ff9b9b'};">${escapeHtml(crypto.submittedHash || 'N/A')}</div>
      </div>
    `;

    const nextStepHtml = isMatch
      ? `
        <div class="next-step" style="border-left: 4px solid var(--green);">
          <span class="next-icon">✓</span>
          <div>
            <strong>Verified Genuine</strong>
            <span>You may safely proceed to apply on the official employer URL: <a href="${escapeHtml(res.notice.officialUrl)}" target="_blank" style="color: #9bd9c7; text-decoration: underline;">${escapeHtml(res.notice.domain)} ↗</a>. Keep notice ID ${escapeHtml(res.notice.id)} for reference.</span>
          </div>
        </div>
      `
      : `
        <div class="next-step" style="background: #2b110e; border-left: 4px solid var(--coral);">
          <span class="next-icon" style="background: var(--coral); color: #fff;">!</span>
          <div>
            <strong style="color: var(--coral);">Do Not Transfer Funds</strong>
            <span>The requested payment or contact details differ from the placement cell's MoU record. Report this forwarded message immediately to your placement representative.</span>
          </div>
        </div>
      `;

    resultBox.innerHTML = `
      <div class="result-header">
        <div>
          <h3>${title}</h3>
          <p>${subtitle}</p>
        </div>
        <span class="result-stamp ${stampClass}">${stampText}</span>
      </div>

      ${threatHtml}

      <p class="evidence-heading">Parameter Comparison</p>
      <div class="evidence-list">${evidenceRows}</div>

      <p class="evidence-heading">Cryptographic Integrity Evidence</p>
      ${cryptoHtml}

      ${nextStepHtml}

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <button class="small-button" type="button" onclick="window.print()">
          Print / Save Verification Slip 📄
        </button>
      </div>
    `;
  }
});
