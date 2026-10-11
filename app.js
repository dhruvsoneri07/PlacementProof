const appState = {
  notices: [],
  approved: null,
  currentFilter: 'all',
};

const fallbackNotices = [
  { id: 'PP-2026-014', title: 'Graduate Data Analyst', company: 'BrightPath Analytics', type: 'Job', location: 'Bengaluru / Hybrid', domain: 'brightpathanalytics.in', officialUrl: 'https://brightpathanalytics.in/careers/graduate-analyst', contact: 'campus@brightpathanalytics.in', deadline: '30 Oct 2026', fee: '₹0', feeValue: 0, reviewedOn: '08 Oct 2026', reviewer: 'Training & Placement Cell', status: 'approved', sourceNote: 'Source URL and contact were checked by the placement cell.' },
  { id: 'PP-2026-014-FWD', title: 'Graduate Data Analyst', company: 'BrightPath Analytics (forwarded copy)', type: 'Forwarded notice', location: 'Bengaluru / Hybrid', domain: 'brightpathanalytics.in', officialUrl: 'https://brightpathanalytics.in/careers/graduate-analyst', contact: 'campus@brightpathanalytics.in', deadline: '30 Oct 2026', fee: '₹1,499', feeValue: 1499, reviewedOn: '08 Oct 2026', reviewer: 'Forwarded message — not an approved source', status: 'forwarded', sourceNote: 'This copied version changes the payment request from the approved record.' },
  { id: 'PP-2026-021', title: 'Junior Product Intern', company: 'Northstar Labs', type: 'Internship', location: 'Pune', domain: 'northstarlabs.example', officialUrl: 'https://northstarlabs.example/careers/product-intern', contact: 'placements@northstarlabs.example', deadline: '05 Nov 2026', fee: '₹0', feeValue: 0, reviewedOn: 'Pending review', reviewer: 'Awaiting officer review', status: 'pending', sourceNote: 'Do not treat this listing as reviewed until the cell confirms it.' },
  { id: 'PP-2026-009', title: 'Customer Success Trainee', company: 'Harborline Services', type: 'Job', location: 'Chennai', domain: 'harborline.example', officialUrl: 'https://harborline.example/jobs/customer-success', contact: 'careers@harborline.example', deadline: 'Closed', fee: '₹0', feeValue: 0, reviewedOn: '01 Oct 2026', reviewer: 'Training & Placement Cell', status: 'withdrawn', sourceNote: 'The cell withdrew this opportunity. Do not apply using old copies.' },
];

const statusLabels = {
  approved: 'Approved',
  pending: 'Pending review',
  withdrawn: 'Withdrawn',
  forwarded: 'Forwarded copy',
};

const statusClasses = {
  approved: 'approved',
  pending: 'pending',
  withdrawn: 'withdrawn',
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

function normalizeDomain(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function moneyValue(value) {
  const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function renderOpportunities() {
  const container = document.querySelector('#opportunity-list');
  if (!container) return;
  const visible = appState.notices.filter((notice) => ['approved', 'withdrawn'].includes(notice.status));
  if (visible.length === 0) {
    container.innerHTML = '<p class="muted">No approved notices currently published.</p>';
    return;
  }
  container.innerHTML = visible.map((notice) => `
    <article class="opportunity-card ${notice.status === 'approved' ? 'featured' : 'withdrawn'}">
      <div class="opp-top">
        <span class="opp-type">${escapeHtml(notice.type)} · ${escapeHtml(notice.location)}</span>
        <span class="status-pill ${statusClasses[notice.status] || ''}">${notice.status === 'approved' ? '✓ ' : ''}${statusLabels[notice.status] || notice.status}</span>
      </div>
      <h3>${escapeHtml(notice.title)}</h3>
      <p class="company">${escapeHtml(notice.company)}</p>
      <div class="opp-details">
        <div><span>Apply by</span><strong>${escapeHtml(notice.deadline)}</strong></div>
        <div><span>Student fee</span><strong>${escapeHtml(notice.fee)}</strong></div>
        <div><span>Reviewed</span><strong>${escapeHtml(notice.reviewedOn)}</strong></div>
      </div>
      <div class="opp-footer">
        <a class="source-link" href="${escapeHtml(notice.officialUrl)}" target="_blank" rel="noreferrer">Open official source ↗</a>
        <span class="review-date">${escapeHtml(notice.id)}</span>
      </div>
    </article>
  `).join('');
}

function renderDashboard() {
  const counts = appState.notices.reduce((result, notice) => {
    if (result[notice.status] !== undefined) result[notice.status] += 1;
    return result;
  }, { approved: 0, pending: 0, withdrawn: 0 });

  const totalCount = appState.notices.length;

  const statsEl = document.querySelector('#dashboard-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card approved-stat"><div class="stat-label"><span>Approved</span><span>01</span></div><span class="stat-value">${counts.approved}</span></div>
      <div class="stat-card pending-stat"><div class="stat-label"><span>Pending</span><span>02</span></div><span class="stat-value">${counts.pending}</span></div>
      <div class="stat-card withdrawn-stat"><div class="stat-label"><span>Withdrawn</span><span>03</span></div><span class="stat-value">${counts.withdrawn}</span></div>
    `;
  }

  const countAll = document.querySelector('#count-all');
  if (countAll) countAll.textContent = totalCount;
  const countPending = document.querySelector('#count-pending');
  if (countPending) countPending.textContent = counts.pending;
  const countApproved = document.querySelector('#count-approved');
  if (countApproved) countApproved.textContent = counts.approved;
  const countWithdrawn = document.querySelector('#count-withdrawn');
  if (countWithdrawn) countWithdrawn.textContent = counts.withdrawn;

  const filteredNotices = appState.currentFilter === 'all'
    ? appState.notices
    : appState.notices.filter(n => n.status === appState.currentFilter);

  const reviewList = document.querySelector('#review-list');
  if (!reviewList) return;

  if (filteredNotices.length === 0) {
    reviewList.innerHTML = `<div class="result-empty" style="padding: 24px; min-height: 120px;"><p class="muted">No notices with status: <strong>${escapeHtml(appState.currentFilter)}</strong></p></div>`;
    return;
  }

  reviewList.innerHTML = filteredNotices.map((notice) => {
    const isApproved = notice.status === 'approved';
    const isPending = notice.status === 'pending';
    const isWithdrawn = notice.status === 'withdrawn';

    let actionButtons = '';
    if (isPending) {
      actionButtons = `
        <button class="btn-action approve" type="button" data-action="approve" data-id="${escapeHtml(notice.id)}">✓ Approve</button>
        <button class="btn-action withdraw" type="button" data-action="withdraw" data-id="${escapeHtml(notice.id)}">✕ Reject</button>
      `;
    } else if (isApproved) {
      actionButtons = `
        <button class="btn-action withdraw" type="button" data-action="withdraw" data-id="${escapeHtml(notice.id)}">Withdraw</button>
      `;
    } else if (isWithdrawn) {
      actionButtons = `
        <button class="btn-action approve" type="button" data-action="approve" data-id="${escapeHtml(notice.id)}">Restore</button>
      `;
    }
    actionButtons += `
      <button class="btn-action delete" type="button" data-action="delete" data-id="${escapeHtml(notice.id)}" title="Delete notice">Delete</button>
    `;

    return `
      <article class="review-record" data-id="${escapeHtml(notice.id)}">
        <div class="record-main">
          <span class="record-avatar">${escapeHtml((notice.company || 'C').charAt(0))}</span>
          <div class="record-copy">
            <h3>${escapeHtml(notice.title)}</h3>
            <p>${escapeHtml(notice.company)} · ${escapeHtml(notice.id)}</p>
            <small>${escapeHtml(notice.reviewer || 'Awaiting officer review')}</small>
          </div>
        </div>
        <div class="record-detail">
          <strong class="status-text ${statusClasses[notice.status] || 'forwarded'}">${statusLabels[notice.status] || 'Forwarded copy'}</strong>
          <div class="record-actions">
            ${actionButtons}
          </div>
        </div>
        <div class="record-provenance">
          <div><span>Official source</span><a href="${escapeHtml(notice.officialUrl || '#')}" target="_blank" rel="noreferrer">${escapeHtml(notice.domain)} ↗</a></div>
          <div><span>Approved contact</span><strong>${escapeHtml(notice.contact)}</strong></div>
          <div><span>Deadline</span><strong>${escapeHtml(notice.deadline)}</strong></div>
          <div><span>Fee policy</span><strong>${escapeHtml(notice.fee)}</strong></div>
        </div>
      </article>
    `;
  }).join('');
}

function fillExample(type) {
  if (!appState.approved) return;
  const fee = type === 'match' ? appState.approved.feeValue : 1499;
  document.querySelector('#notice-id').value = appState.approved.id;
  document.querySelector('#domain').value = appState.approved.domain;
  document.querySelector('#contact').value = appState.approved.contact;
  document.querySelector('#fee').value = fee;
  document.querySelector('#checker-form').requestSubmit();
}

function evidenceRow(label, submitted, approved, isDifferent) {
  const submittedText = escapeHtml(submitted);
  const approvedText = escapeHtml(approved);
  return `
    <div class="evidence-row ${isDifferent ? 'difference' : ''}">
      <span class="evidence-icon">${isDifferent ? '!' : '✓'}</span>
      <strong>${escapeHtml(label)}</strong>
      <div class="row-values"><b>${submittedText}</b><small>${isDifferent ? `Approved record: ${approvedText}` : 'Matches approved record'}</small></div>
    </div>
  `;
}

function renderResult(result) {
  const container = document.querySelector('#checker-result');
  if (result.state === 'unknown') {
    container.innerHTML = `
      <div class="result-header"><div><h3>We do not have a reviewed record for this notice.</h3><p>That does not tell us whether the offer is genuine or fraudulent.</p></div><span class="result-stamp unknown">Not<br />reviewed</span></div>
      <p class="evidence-heading">What to do next</p>
      <div class="next-step"><span class="next-icon">→</span><div><strong>Pause and ask</strong><span>Do not pay or send identity documents yet. Share the message with your placement cell and ask them to confirm the employer through an official source.</span></div></div>
    `;
    return;
  }

  const differentCount = result.fields.filter((field) => field.different).length;
  const state = differentCount ? 'different' : 'match';
  const title = differentCount ? 'Some details do not match the approved record.' : 'This notice matches the approved record.';
  const subtitle = differentCount ? 'A changed detail is a reason to pause and verify. It is not, by itself, proof of fraud.' : 'The four details you entered match the placement cell\'s source record.';
  const nextCopy = differentCount
    ? 'Do not pay. Open the official source link and contact the placement cell using the approved contact below.'
    : 'You can continue to the official source link, and keep the notice ID for your records.';

  container.innerHTML = `
    <div class="result-header"><div><h3>${title}</h3><p>${subtitle}</p></div><span class="result-stamp ${state === 'match' ? 'match' : 'differ'}">${state === 'match' ? 'Matches<br />approved notice' : 'Details<br />differ'}</span></div>
    <p class="evidence-heading">Evidence comparison</p>
    <div class="evidence-list">${result.fields.map((field) => evidenceRow(field.label, field.submitted, field.approved, field.different)).join('')}</div>
    <div class="next-step"><span class="next-icon">→</span><div><strong>Next verification step</strong><span>${nextCopy}</span></div></div>
  `;
}

function compareNotice(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = normalizeText(formData.get('noticeId'));
  const submitted = {
    id,
    domain: normalizeDomain(formData.get('domain')),
    contact: normalizeText(formData.get('contact')),
    fee: moneyValue(formData.get('fee')),
  };
  const approved = appState.notices.find((notice) => normalizeText(notice.id) === submitted.id && notice.status === 'approved');

  if (!approved) {
    renderResult({ state: 'unknown' });
    document.querySelector('#checker-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  const fields = [
    { label: 'Employer domain', submitted: submitted.domain, approved: approved.domain, different: submitted.domain !== normalizeDomain(approved.domain) },
    { label: 'Contact email', submitted: submitted.contact, approved: approved.contact, different: submitted.contact !== normalizeText(approved.contact) },
    { label: 'Requested fee', submitted: `₹${submitted.fee.toLocaleString('en-IN')}`, approved: approved.fee, different: submitted.fee !== approved.feeValue },
  ];
  renderResult({ state: 'reviewed', fields });
  document.querySelector('#checker-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function initNavigation() {
  document.querySelectorAll('.main-nav a, .hero-actions a').forEach((link) => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.main-nav a').forEach((navLink) => navLink.classList.remove('active'));
      const matchingLink = document.querySelector(`.main-nav a[href="${link.getAttribute('href')}"]`);
      if (matchingLink) matchingLink.classList.add('active');
    });
  });
}

function initTabs() {
  document.querySelectorAll('.filter-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.currentFilter = btn.dataset.filter;
      renderDashboard();
    });
  });
}

function showToast(message, type = 'success') {
  const container = document.querySelector('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '!'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function openModal() {
  const modal = document.querySelector('#add-notice-modal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const firstInput = modal.querySelector('input');
    if (firstInput) firstInput.focus();
  }
}

function closeModal() {
  const modal = document.querySelector('#add-notice-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function handleActionClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!id) return;

  if (action === 'delete') {
    if (!confirm(`Are you sure you want to permanently delete notice ${id}?`)) return;
    try {
      button.disabled = true;
      const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notice');
      appState.notices = appState.notices.filter(n => n.id.toLowerCase() !== id.toLowerCase());
      appState.approved = appState.notices.find(n => n.status === 'approved');
      renderOpportunities();
      renderDashboard();
      showToast(`Notice ${id} deleted.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
    return;
  }

  if (action === 'approve' || action === 'withdraw') {
    const newStatus = action === 'approve' ? 'approved' : 'withdrawn';
    try {
      button.disabled = true;
      const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Failed to update notice`);
      const data = await res.json();
      
      const idx = appState.notices.findIndex(n => n.id.toLowerCase() === id.toLowerCase());
      if (idx !== -1 && data.notice) {
        appState.notices[idx] = data.notice;
      }
      appState.approved = appState.notices.find(n => n.status === 'approved');
      renderOpportunities();
      renderDashboard();
      showToast(`Notice ${id} marked as ${newStatus}.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

async function handleAddNoticeSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  const payload = {
    company: formData.get('company'),
    title: formData.get('title'),
    type: formData.get('type') || 'Job',
    location: formData.get('location') || 'Bengaluru / Hybrid',
    domain: formData.get('domain'),
    contact: formData.get('contact'),
    officialUrl: formData.get('officialUrl') || '',
    deadline: formData.get('deadline') || 'Open',
    fee: Number(formData.get('fee') || 0),
    status: formData.get('status') || 'approved',
    sourceNote: formData.get('sourceNote') || 'Verified by Training & Placement Cell',
  };

  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create notice');
    }

    const data = await res.json();
    if (data.notice) {
      appState.notices.unshift(data.notice);
      appState.approved = appState.notices.find(n => n.status === 'approved');
      form.reset();
      closeModal();
      renderOpportunities();
      renderDashboard();
      showToast(`Notice ${data.notice.id} created successfully!`);
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function loadApp() {
  try {
    const response = await fetch('/api/notices');
    if (!response.ok) throw new Error('API fetch failed');
    const data = await response.json();
    appState.notices = data.notices || [];
  } catch (error) {
    try {
      const fallbackRes = await fetch('data/notices.json');
      const fallbackData = await fallbackRes.json();
      appState.notices = fallbackData.notices || fallbackNotices;
    } catch {
      appState.notices = fallbackNotices;
    }
  }

  appState.approved = appState.notices.find((notice) => notice.status === 'approved');
  renderOpportunities();
  renderDashboard();

  document.querySelector('#checker-form').addEventListener('submit', compareNotice);
  document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => fillExample(button.dataset.example)));
  initNavigation();
  initTabs();

  const reviewList = document.querySelector('#review-list');
  if (reviewList) reviewList.addEventListener('click', handleActionClick);

  const openModalBtn = document.querySelector('#open-add-notice-btn');
  if (openModalBtn) openModalBtn.addEventListener('click', openModal);

  const closeModalBtn = document.querySelector('#close-modal-btn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  const cancelModalBtn = document.querySelector('#cancel-modal-btn');
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  const modalBackdrop = document.querySelector('#add-notice-modal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  const addNoticeForm = document.querySelector('#add-notice-form');
  if (addNoticeForm) addNoticeForm.addEventListener('submit', handleAddNoticeSubmit);
}

document.addEventListener('DOMContentLoaded', loadApp);

