// Placement Officer Portal Controller

document.addEventListener('DOMContentLoaded', async () => {
  let notices = [];
  let auditLogs = [];
  let currentFilter = 'all';

  const reviewList = document.querySelector('#review-list');
  const auditBody = document.querySelector('#audit-log-body');
  const modal = document.querySelector('#add-notice-modal');

  // Load Initial Data
  await loadData();
  await loadAuditLogs();

  async function loadData() {
    try {
      const res = await fetch('/api/notices');
      if (!res.ok) throw new Error('Failed to load notices');
      const data = await res.json();
      notices = data.notices || [];
      renderQueue();
      updateStats();
    } catch (err) {
      if (reviewList) reviewList.innerHTML = `<div class="threat-alert-box"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  async function loadAuditLogs() {
    try {
      const res = await fetch('/api/audit-logs');
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      auditLogs = data.logs || [];
      renderAuditLogs();
      updateStats();
    } catch (err) {
      if (auditBody) auditBody.innerHTML = `<tr><td colspan="4" class="muted">Audit logs unavailable</td></tr>`;
    }
  }

  function updateStats() {
    const counts = notices.reduce((acc, n) => {
      if (acc[n.status] !== undefined) acc[n.status] += 1;
      return acc;
    }, { approved: 0, pending: 0, withdrawn: 0 });

    const elApproved = document.querySelector('#stat-approved');
    if (elApproved) elApproved.textContent = counts.approved;

    const elPending = document.querySelector('#stat-pending');
    if (elPending) elPending.textContent = counts.pending;

    const elWithdrawn = document.querySelector('#stat-withdrawn');
    if (elWithdrawn) elWithdrawn.textContent = counts.withdrawn;

    const elLogs = document.querySelector('#stat-logs');
    if (elLogs) elLogs.textContent = auditLogs.length;

    // Filter tab counts
    document.querySelector('#count-all').textContent = notices.length;
    document.querySelector('#count-pending').textContent = counts.pending;
    document.querySelector('#count-approved').textContent = counts.approved;
    document.querySelector('#count-withdrawn').textContent = counts.withdrawn;
  }

  function renderQueue() {
    if (!reviewList) return;

    const filtered = currentFilter === 'all'
      ? notices
      : notices.filter(n => n.status === currentFilter);

    if (filtered.length === 0) {
      reviewList.innerHTML = `
        <div class="result-empty" style="min-height: 140px; padding: 20px;">
          <p class="muted">No notices in this queue with status: <strong>${escapeHtml(currentFilter)}</strong></p>
        </div>
      `;
      return;
    }

    reviewList.innerHTML = filtered.map((n) => {
      const isApproved = n.status === 'approved';
      const isPending = n.status === 'pending';
      const isWithdrawn = n.status === 'withdrawn';

      let actionButtons = '';
      if (isPending) {
        actionButtons = `
          <button class="btn-action approve" type="button" data-action="approve" data-id="${escapeHtml(n.id)}">✓ Approve</button>
          <button class="btn-action withdraw" type="button" data-action="withdraw" data-id="${escapeHtml(n.id)}">✕ Reject</button>
        `;
      } else if (isApproved) {
        actionButtons = `
          <button class="btn-action withdraw" type="button" data-action="withdraw" data-id="${escapeHtml(n.id)}">Withdraw</button>
        `;
      } else if (isWithdrawn) {
        actionButtons = `
          <button class="btn-action approve" type="button" data-action="approve" data-id="${escapeHtml(n.id)}">Restore</button>
        `;
      }
      actionButtons += `
        <button class="btn-action delete" type="button" data-action="delete" data-id="${escapeHtml(n.id)}" title="Delete notice">Delete</button>
      `;

      const hashShort = n.hash ? `${n.hash.substring(0, 8)}...${n.hash.substring(n.hash.length - 6)}` : 'Signing...';

      return `
        <article class="review-record" data-id="${escapeHtml(n.id)}">
          <div class="record-main">
            <span class="record-avatar">${escapeHtml((n.company || 'C').charAt(0))}</span>
            <div class="record-copy">
              <h3>${escapeHtml(n.title)}</h3>
              <p>${escapeHtml(n.company)} · <span class="mono">${escapeHtml(n.id)}</span></p>
              <span class="hash-pill" style="font-size: 8px;">SHA-256: ${escapeHtml(hashShort)}</span>
            </div>
          </div>

          <div class="record-detail">
            <strong class="status-text ${escapeHtml(n.status)}">${escapeHtml(n.status.toUpperCase())}</strong>
            <div class="record-actions">
              ${actionButtons}
            </div>
          </div>

          <div class="record-provenance">
            <div>
              <span>Official Domain</span>
              <a href="${escapeHtml(n.officialUrl || '#')}" target="_blank" rel="noreferrer">${escapeHtml(n.domain)} ↗</a>
            </div>
            <div>
              <span>Recruiter Email</span>
              <strong>${escapeHtml(n.contact)}</strong>
            </div>
            <div>
              <span>Deadline</span>
              <strong>${escapeHtml(n.deadline)}</strong>
            </div>
            <div>
              <span>Fee Policy</span>
              <strong style="color: var(--green);">${escapeHtml(n.fee)}</strong>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderAuditLogs() {
    if (!auditBody) return;
    if (auditLogs.length === 0) {
      auditBody.innerHTML = `<tr><td colspan="4" class="muted">No verification logs recorded yet.</td></tr>`;
      return;
    }

    auditBody.innerHTML = auditLogs.slice(0, 15).map(log => {
      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <tr>
          <td class="mono">${escapeHtml(timeStr)}</td>
          <td><strong>${escapeHtml(log.noticeId)}</strong></td>
          <td><span class="audit-badge ${escapeHtml(log.result)}">${escapeHtml(log.result)}</span></td>
          <td style="color: ${log.severity === 'HIGH' ? 'var(--coral)' : 'var(--ink-soft)'}; font-weight: 700;">
            ${escapeHtml(log.severity || 'INFO')}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Action delegations
  if (reviewList) {
    reviewList.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!id) return;

      if (action === 'delete') {
        if (!confirm(`Are you sure you want to permanently delete notice ${id}?`)) return;
        try {
          btn.disabled = true;
          const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete notice');
          notices = notices.filter(n => n.id.toLowerCase() !== id.toLowerCase());
          renderQueue();
          updateStats();
          loadAuditLogs();
          showToast(`Notice ${id} deleted.`);
        } catch (err) {
          showToast(err.message, 'error');
        }
        return;
      }

      if (action === 'approve' || action === 'withdraw') {
        const newStatus = action === 'approve' ? 'approved' : 'withdrawn';
        try {
          btn.disabled = true;
          const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          if (!res.ok) throw new Error('Status update failed');
          const data = await res.json();
          const idx = notices.findIndex(n => n.id.toLowerCase() === id.toLowerCase());
          if (idx !== -1 && data.notice) {
            notices[idx] = data.notice;
          }
          renderQueue();
          updateStats();
          loadAuditLogs();
          showToast(`Notice ${id} is now ${newStatus}.`);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  }

  // Filter tabs
  document.querySelectorAll('.filter-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderQueue();
    });
  });

  // Refresh audit logs button
  document.querySelector('#btn-refresh-audit')?.addEventListener('click', async () => {
    await loadAuditLogs();
    showToast('Audit logs refreshed.');
  });

  // Modal controls
  const openModalBtn = document.querySelector('#open-add-notice-btn');
  const closeModalBtn = document.querySelector('#close-modal-btn');
  const cancelModalBtn = document.querySelector('#cancel-modal-btn');

  function openModal() {
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      modal.querySelector('input')?.focus();
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  openModalBtn?.addEventListener('click', openModal);
  closeModalBtn?.addEventListener('click', closeModal);
  cancelModalBtn?.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Add Notice Form Submission
  const addForm = document.querySelector('#add-notice-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addForm);

      const payload = {
        company: formData.get('company'),
        title: formData.get('title'),
        type: formData.get('type') || 'Job',
        location: formData.get('location') || 'Pan India / Remote',
        domain: formData.get('domain'),
        contact: formData.get('contact'),
        officialUrl: formData.get('officialUrl') || '',
        deadline: formData.get('deadline') || 'Open',
        fee: Number(formData.get('fee') || 0),
        status: formData.get('status') || 'approved',
        sourceNote: formData.get('sourceNote') || 'Verified by Training & Placement Cell',
      };

      try {
        const submitBtn = addForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const res = await fetch('/api/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to publish notice');
        }

        const data = await res.json();
        if (data.notice) {
          notices.unshift(data.notice);
          addForm.reset();
          closeModal();
          renderQueue();
          updateStats();
          loadAuditLogs();
          showToast(`Notice ${data.notice.id} cryptographically signed & published!`);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        const submitBtn = addForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
