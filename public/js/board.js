// Approved Opportunities Board Controller

document.addEventListener('DOMContentLoaded', async () => {
  let allNotices = [];
  let currentType = 'all';
  let searchQuery = '';

  const container = document.querySelector('#opportunity-list');
  const searchInput = document.querySelector('#search-notices-input');
  const countLabel = document.querySelector('#results-count');
  const typeFilterButtons = document.querySelectorAll('#board-type-filters .tab-btn');

  try {
    const res = await fetch('/api/notices');
    if (!res.ok) throw new Error('Failed to load notices');
    const data = await res.json();
    allNotices = data.notices || [];
    renderBoard();
  } catch (err) {
    container.innerHTML = `<div class="threat-alert-box"><p>${escapeHtml(err.message)}</p></div>`;
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderBoard();
    });
  }

  // Type filter pills
  typeFilterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      typeFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      renderBoard();
    });
  });

  function renderBoard() {
    // Show only approved and withdrawn records on student board
    let filtered = allNotices.filter(n => ['approved', 'withdrawn'].includes(n.status));

    if (currentType !== 'all') {
      filtered = filtered.filter(n => (n.type || '').toLowerCase().includes(currentType.toLowerCase()));
    }

    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery) ||
        n.company.toLowerCase().includes(searchQuery) ||
        n.id.toLowerCase().includes(searchQuery) ||
        n.domain.toLowerCase().includes(searchQuery)
      );
    }

    if (countLabel) {
      countLabel.textContent = `${filtered.length} opportunity${filtered.length === 1 ? '' : 'ies'} listed`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="result-empty" style="grid-column: 1 / -1; min-height: 220px;">
          <div class="result-icon">⌕</div>
          <h3>No opportunities match your filter</h3>
          <p class="muted">Try adjusting your search terms or selecting "All Opportunities".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((notice) => {
      const isApproved = notice.status === 'approved';
      const hashShort = notice.hash ? `${notice.hash.substring(0, 10)}...${notice.hash.substring(notice.hash.length - 6)}` : 'Verified';

      return `
        <article class="opportunity-card ${isApproved ? 'featured' : 'withdrawn'}">
          <div class="opp-top">
            <span class="opp-type">${escapeHtml(notice.type)} · ${escapeHtml(notice.location)}</span>
            <span class="status-pill ${isApproved ? 'approved' : 'withdrawn'}">
              ${isApproved ? '✓ Approved' : 'Withdrawn'}
            </span>
          </div>

          <h3>${escapeHtml(notice.title)}</h3>
          <p class="company">${escapeHtml(notice.company)}</p>

          <div style="margin: 8px 0;">
            <span class="hash-pill" title="Cryptographic SHA-256 Provenance Fingerprint">
              <span>#</span> SHA-256: ${escapeHtml(hashShort)}
            </span>
          </div>

          <div class="opp-details">
            <div>
              <span>Apply by</span>
              <strong>${escapeHtml(notice.deadline)}</strong>
            </div>
            <div>
              <span>Student fee</span>
              <strong style="color: var(--green);">${escapeHtml(notice.fee)}</strong>
            </div>
            <div>
              <span>Verified On</span>
              <strong>${escapeHtml(notice.reviewedOn)}</strong>
            </div>
          </div>

          <div class="opp-footer">
            <a class="source-link" href="${escapeHtml(notice.officialUrl || '#')}" target="_blank" rel="noreferrer">
              Official Source ↗
            </a>
            <a class="small-button" href="/check?id=${encodeURIComponent(notice.id)}">
              Verify in Checker ⌕
            </a>
          </div>
        </article>
      `;
    }).join('');
  }
});
