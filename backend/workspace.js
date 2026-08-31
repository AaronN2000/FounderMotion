const $ = selector => document.querySelector(selector);

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value ?? '';
  return node.innerHTML;
}

function showToast(message) {
  const toast = $('#workspaceToast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function emptyState(message) {
  return `<div class="workspace-empty">${escapeHtml(message)}</div>`;
}

let currentSegments = [];

function renderSegments(segments) {
  currentSegments = Array.isArray(segments) ? segments : [];

  const list = $('#segmentsList');

  $('#segmentStat').textContent = `${currentSegments.length}`;

  if (!currentSegments.length) {
    list.innerHTML = emptyState('No market segments have been defined yet. Add priority segments to continue.');
    return;
  }

  list.innerHTML = currentSegments.map((segment, index) => `
    <div class="workspace-list-item">
      <span class="workspace-index">SEGMENT ${String(index + 1).padStart(2, '0')}</span>
      <strong>${escapeHtml(segment.name)}</strong>
      ${segment.description ? `<p>${escapeHtml(segment.description)}</p>` : ''}
      <div class="workspace-meta">
        ${segment.geography ? `<span>${escapeHtml(segment.geography)}</span>` : ''}
        ${segment.companySize ? `<span>${escapeHtml(segment.companySize)}</span>` : ''}
        ${segment.wedge ? `<span>${escapeHtml(segment.wedge)}</span>` : ''}
      </div>
      <div class="workspace-list-item-footer">
        <button class="delete-segment" type="button" data-delete-segment="${segment.id}">
          Remove
        </button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-delete-segment]').forEach(button => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.deleteSegment);
      if (!confirm('Remove this market segment?')) return;

      try {
        await api(`/api/segments/${id}/delete`, {
          method: 'POST',
          body: '{}'
        });

        renderSegments(currentSegments.filter(segment => segment.id !== id));
        showToast('Segment removed.');
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

function initSegmentDialog() {
  const addButton = $('#addSegmentButton');
  const dialog = $('#segmentDialog');
  const form = $('#segmentForm');

  if (!addButton || !dialog || !form) return;

  addButton.addEventListener('click', event => {
    event.preventDefault();
    form.reset();
    dialog.showModal();
  });

  $('#cancelSegment').addEventListener('click', () => dialog.close());
  $('#closeSegmentDialog').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const payload = {
      name: $('#segmentName').value.trim(),
      description: $('#segmentDescription').value.trim(),
      geography: $('#segmentGeography').value.trim(),
      companySize: $('#segmentCompanySize').value.trim(),
      wedge: $('#segmentWedge').value
    };

    if (!payload.name) {
      showToast('Enter a segment name.');
      return;
    }

    const submitButton = form.querySelector('.primary-button');
    submitButton.disabled = true;

    try {
      const response = await api('/api/segments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      renderSegments([...currentSegments, response.segment]);
      dialog.close();
      showToast('Market segment saved.');
    } catch (error) {
      showToast(error.message);
    } finally {
      submitButton.disabled = false;
    }
  });
}

function renderProgress(state, processCount) {
  const outputs = Array.isArray(state.outputs) ? state.outputs : [];
  const completed = outputs.filter(Boolean).length;
  const current = Math.min((state.step || 0) + 1, processCount);

  $('#progressStat').textContent = `${completed} / ${processCount}`;

  $('#progressDetails').innerHTML = `
    <div class="progress-block">
      <div class="progress-track">
        <span style="width: ${processCount ? Math.round((completed / processCount) * 100) : 0}%"></span>
      </div>
      <strong>${completed} of ${processCount} processes completed</strong>
      <p>Current process: ${current} of ${processCount}</p>
    </div>
  `;
}

function renderOutputs(state, processes) {
  const list = $('#outputsList');
  const outputs = Array.isArray(state.outputs) ? state.outputs : [];

  const completed = outputs
    .map((output, index) => ({ output, index }))
    .filter(item => item.output);

  const outputStat = $('#outputStat');
  if (outputStat) {
    outputStat.textContent = String(completed.length);
  }

  if (!completed.length) {
    list.innerHTML = emptyState(
      'No generated outputs yet. Start a process from the map to generate a decision brief.'
    );
    return;
  }

  list.innerHTML = completed.map(item => {
    const process = processes[item.index];

    let summary = String(item.output || '')
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (summary.length > 180) {
      summary = summary.slice(0, 180).trimEnd() + '…';
    }

    return `
      <div class="workspace-output-item">
        <div>
          <span class="workspace-index">
            PROCESS ${String(item.index + 1).padStart(2, '0')}
          </span>

          <strong>
            ${escapeHtml(process?.title || `Process ${item.index + 1}`)}
          </strong>

          <span class="workspace-history-meta">
            Decision brief
          </span>

          ${summary
            ? `<p>${escapeHtml(summary)}</p>`
            : ''
          }
        </div>

        <button
          class="workspace-view-button"
          type="button"
          data-output-index="${item.index}"
        >
          View output
          <span>→</span>
        </button>
      </div>
    `;
  }).join('');
}

function renderHistory(state) {
  const list = $('#historyList');
  const history = Array.isArray(state.history) ? state.history : [];

  // Workspace total: each process may keep up to 3 history records,
  // so this stat shows the total number of saved records across all processes.
  $('#historyStat').textContent = `${history.length}`;

  if (!history.length) {
    list.innerHTML = emptyState('No previous searches yet.');
    return;
  }

  list.innerHTML = history.map((item, index) => {
    const title =
      item.title ||
      item.processTitle ||
      item.process ||
      'Previous search';

    let summary =
      item.summary ||
      item.description ||
      item.answer ||
      item.output ||
      '';

    summary = String(summary)
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (summary.length > 150) {
      summary = summary.slice(0, 150).trimEnd() + '…';
    }

    return `
      <div class="workspace-history-item">
        <div class="workspace-history-main">
          <span class="workspace-index">
            SEARCH ${String(index + 1).padStart(2, '0')}
          </span>

          <strong>${escapeHtml(title)}</strong>

          <span class="workspace-history-meta">
            Decision brief
          </span>

          ${summary
            ? `<p>${escapeHtml(summary)}</p>`
            : ''
          }
        </div>

        <button
          class="workspace-view-button"
          type="button"
          data-history-index="${index}"
        >
          View
          <span>→</span>
        </button>
      </div>
    `;
  }).join('');
}

function renderDocuments(state) {
  const list = $('#documentsList');

  const savedEvidence = Array.isArray(state.documents)
    ? state.documents
    : [];

  const evidenceStat = $('#evidenceStat');

  if (evidenceStat) {
    evidenceStat.textContent = String(savedEvidence.length);
  }
  const documents = Array.isArray(state.documents) ? state.documents : [];

  if (!documents.length) {
    list.innerHTML = emptyState('No saved evidence is currently attached to the workspace.');
    return;
  }

  list.innerHTML = documents.map(document => `
    <div class="workspace-list-item">
      <strong>${escapeHtml(document.name || 'Untitled document')}</strong>
      <p>${escapeHtml(document.input || 'General')}</p>
    </div>
  `).join('');
}

function renderStyles() {
  const style = document.createElement('style');

  style.textContent = `
    /* =========================================================
       FounderMotion Workspace — visual polish
       ========================================================= */

    body.workspace-page {
      background:
        radial-gradient(circle at 85% 8%, rgba(73, 29, 126, .06), transparent 28%),
        linear-gradient(180deg, #ffffff 0%, #fbfafc 100%);
    }

    .workspace-shell {
      width: min(1320px, calc(100% - 72px));
      margin: 54px auto 96px;
    }

    .workspace-topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 40px;
      margin-bottom: 38px;
    }

    .workspace-topbar .eyebrow {
      margin-bottom: 10px;
    }

    .workspace-topbar h1 {
      margin: 0 0 12px;
      font-size: clamp(3rem, 5vw, 5.2rem);
      line-height: .95;
      letter-spacing: -.055em;
    }

    .workspace-lede {
      margin: 0;
      font-size: 1rem;
      line-height: 1.6;
      color: rgba(35, 29, 42, .62);
      max-width: 680px;
    }

    .workspace-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .workspace-actions .secondary-button,
    .workspace-actions .primary-button {
      min-height: 46px;
      padding: 0 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }

    .workspace-actions .secondary-button {
      min-width: 150px;
      white-space: nowrap;
      border: 1px solid rgba(55, 27, 104, .18);
      border-radius: 10px;
      background: #fff;
      color: #35166f;
    }

    .workspace-actions .secondary-button:hover {
      background: rgba(55, 27, 104, .05);
    }

    .workspace-actions .primary-button {
      border: 0;
      border-radius: 10px;
      background: #3c1778;
      color: #fff;
      cursor: pointer;
    }

    /* ---------- Summary stats ---------- */

    .workspace-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .workspace-stat {
      position: relative;
      min-height: 132px;
      padding: 24px 25px;
      border: 1px solid rgba(44, 25, 70, .09);
      border-radius: 16px;
      background: rgba(255,255,255,.9);
      box-shadow: 0 10px 35px rgba(33, 19, 49, .045);
      overflow: hidden;
    }

    .workspace-stat::after {
      content: '';
      position: absolute;
      right: -25px;
      bottom: -35px;
      width: 105px;
      height: 105px;
      border-radius: 50%;
      background: rgba(63, 27, 119, .045);
    }

    .workspace-stat span {
      display: block;
      margin-bottom: 14px;
      font-size: .68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .12em;
      color: #74569d;
    }

    .workspace-stat strong {
      position: relative;
      z-index: 1;
      display: block;
      font-size: 2.25rem;
      line-height: 1;
      letter-spacing: -.045em;
      color: #241d2b;
    }

    /* ---------- Main cards ---------- */

    .workspace-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr);
      gap: 20px;
    }

    .workspace-card {
      min-width: 0;
      padding: 28px;
      border: 1px solid rgba(44, 25, 70, .09);
      border-radius: 18px;
      background: rgba(255,255,255,.92);
      box-shadow: 0 12px 40px rgba(33, 19, 49, .045);
    }

    .workspace-card-wide {
      grid-column: span 2;
    }

    .workspace-card-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 22px;
      padding-bottom: 17px;
      border-bottom: 1px solid rgba(44, 25, 70, .08);
    }

    .workspace-card-heading .eyebrow {
      margin-bottom: 8px;
    }

    .workspace-card-heading h2 {
      margin: 0;
      font-size: 1.45rem;
      letter-spacing: -.025em;
      color: #28212f;
    }

    /* ---------- Account ---------- */

    .account-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .account-details > div {
      padding: 18px 20px;
      border-radius: 12px;
      background: #faf8fc;
    }

    .account-details span {
      display: block;
      margin-bottom: 8px;
      font-size: .66rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .1em;
      color: #8064a5;
    }

    .account-details strong {
      font-size: 1rem;
      color: #29222f;
    }

    /* ---------- History & output cards ---------- */

    .workspace-history-item,
    .workspace-output-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 19px 20px;
      border: 1px solid rgba(44, 25, 70, .08);
      border-radius: 14px;
      background: #fbfafc;
    }

    .workspace-history-main,
    .workspace-output-item > div {
      min-width: 0;
    }

    .workspace-history-item strong,
    .workspace-output-item strong {
      display: block;
      margin-bottom: 5px;
      font-size: 1rem;
      line-height: 1.35;
      color: #29222f;
    }

    .workspace-history-meta {
      display: inline-block;
      margin-bottom: 5px;
      font-size: .72rem;
      font-weight: 600;
      color: #8064a5;
    }

    .workspace-history-item p,
    .workspace-output-item p {
      max-width: 760px;
      margin: 4px 0 0;
      font-size: .82rem;
      line-height: 1.5;
      color: rgba(42, 34, 47, .58);
    }

    .workspace-view-button {
      flex-shrink: 0;
      min-width: 92px;
      min-height: 40px;
      padding: 0 14px;
      border: 1px solid rgba(60, 23, 120, .2);
      border-radius: 9px;
      background: #fff;
      color: #3c1778;
      font-size: .8rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }

    .workspace-view-button:hover {
      background: #f5f0fa;
    }

    .workspace-view-button span {
      margin-left: 5px;
      color: #e0ae19;
    }


    /* ---------- Lists ---------- */

    .workspace-list {
      display: grid;
      gap: 12px;
    }

    .workspace-list-item {
      padding: 18px 19px;
      border: 1px solid rgba(44, 25, 70, .07);
      border-radius: 13px;
      background: #fbfafc;
      transition: transform .18s ease, box-shadow .18s ease;
    }

    .workspace-list-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(33, 19, 49, .06);
    }

    .workspace-list-item strong {
      display: block;
      margin-bottom: 7px;
      font-size: .98rem;
      line-height: 1.35;
      color: #29222f;
    }

    .workspace-list-item p {
      margin: 6px 0 0;
      font-size: .86rem;
      line-height: 1.6;
      color: rgba(42, 34, 47, .67);
    }

    .workspace-index {
      display: block;
      margin-bottom: 8px;
      font-size: .62rem;
      font-weight: 700;
      letter-spacing: .12em;
      color: #8064a5;
    }

    .workspace-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 13px;
    }

    .workspace-meta span {
      padding: 5px 9px;
      border-radius: 999px;
      background: #f0ebf6;
      color: #5b3d82;
      font-size: .67rem;
      font-weight: 600;
    }

    .workspace-empty {
      padding: 20px;
      border: 1px dashed rgba(44, 25, 70, .13);
      border-radius: 12px;
      background: #fcfbfd;
      color: rgba(42, 34, 47, .55);
      font-size: .88rem;
    }

    /* ---------- Market segments ---------- */

    .add-segment-button {
      flex: 0 0 auto;
      min-height: 40px;
      border: 0;
      border-radius: 9px;
      padding: 0 16px;
      background: #3c1778;
      color: #fff;
      font: inherit;
      font-size: .8rem;
      font-weight: 700;
      cursor: pointer;
    }

    .add-segment-button:hover {
      background: #2f1260;
    }

    .workspace-list-item-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }

    .delete-segment {
      border: 0;
      background: transparent;
      color: #8a7d95;
      font-size: .74rem;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 2px;
    }

    .delete-segment:hover {
      color: #a4293f;
    }

    /* ---------- Segment dialog ---------- */

    #segmentDialog {
      width: min(560px, calc(100vw - 32px));
      max-width: 560px;
      padding: 0;
      border: 0;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 24px 80px rgba(35, 20, 60, .24);
      overflow: hidden;
    }

    #segmentDialog::backdrop {
      background: rgba(35, 25, 55, .38);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
    }

    #segmentDialog form {
      padding: 30px 32px 28px;
    }

    #segmentDialog .dialog-heading {
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 22px;
    }

    #segmentDialog .dialog-heading h2 {
      margin: 0;
      font-size: 26px;
      line-height: 1.1;
      letter-spacing: -.02em;
      color: #29222f;
    }

    #segmentDialog .dialog-heading .eyebrow {
      margin-bottom: 7px;
    }

    #segmentDialog .close {
      flex: 0 0 auto;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: #4b3a57;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }

    #segmentDialog .close:hover {
      background: rgba(0,0,0,.05);
    }

    #segmentDialog label {
      display: block;
      margin: 0 0 14px;
      font-size: 12px;
      font-weight: 650;
      color: #3c3442;
    }

    #segmentDialog input,
    #segmentDialog textarea,
    #segmentDialog select {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-top: 7px;
      border: 1px solid #ddd8e5;
      border-radius: 9px;
      background: #fff;
      padding: 11px 12px;
      font: inherit;
      font-size: 13px;
      color: #28232d;
      outline: none;
      transition: border-color .15s ease, box-shadow .15s ease;
    }

    #segmentDialog input {
      height: 43px;
    }

    #segmentDialog textarea {
      min-height: 90px;
      resize: vertical;
      line-height: 1.45;
    }

    #segmentDialog select {
      height: 43px;
      cursor: pointer;
    }

    #segmentDialog input:focus,
    #segmentDialog textarea:focus,
    #segmentDialog select:focus {
      border-color: #4b1b8f;
      box-shadow: 0 0 0 3px rgba(75,27,143,.10);
    }

    #segmentDialog .segment-two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    #segmentDialog .segment-dialog-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      padding-top: 20px;
      border-top: 1px solid #eeeaf1;
    }

    #segmentDialog .segment-dialog-actions button {
      min-height: 44px;
      border-radius: 9px;
      padding: 0 18px;
      font: inherit;
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
    }

    #segmentDialog .secondary-button {
      border: 1px solid #ddd8e5;
      background: #fff;
      color: #4a4350;
    }

    #segmentDialog .secondary-button:hover {
      background: #f8f6fa;
    }

    #segmentDialog .primary-button {
      min-width: 190px;
      border: 0;
      background: #3c1778;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    #segmentDialog .primary-button:hover {
      background: #2f1260;
    }

    #segmentDialog .primary-button span {
      color: #f4c94d;
    }

    @media (max-width: 600px) {
      #segmentDialog {
        width: calc(100vw - 24px);
      }

      #segmentDialog form {
        padding: 24px 20px 22px;
      }

      #segmentDialog .segment-two-column {
        grid-template-columns: 1fr;
      }

      #segmentDialog .segment-dialog-actions {
        flex-direction: column-reverse;
        align-items: stretch;
      }

      #segmentDialog .segment-dialog-actions button {
        width: 100%;
      }
    }

    /* ---------- Progress ---------- */

    .progress-block {
      display: grid;
      gap: 14px;
    }

    .progress-track {
      height: 9px;
      overflow: hidden;
      border-radius: 999px;
      background: #eeeaf2;
    }

    .progress-track span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: #4a2183;
      transition: width .3s ease;
    }

    .progress-block strong {
      font-size: .92rem;
      color: #302739;
    }

    .progress-block p {
      margin: 0;
      font-size: .84rem;
      color: rgba(42, 34, 47, .6);
    }

    /* ---------- View modal ---------- */

    body.workspace-modal-open {
      overflow: hidden;
    }

    #workspaceViewModal {
      display: none;
    }

    #workspaceViewModal.is-open {
      display: block;
    }

    .workspace-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: rgba(25, 17, 34, .48);
      backdrop-filter: blur(7px);
    }

    .workspace-modal {
      position: fixed;
      z-index: 1000;
      top: 50%;
      left: 50%;
      width: min(850px, calc(100% - 40px));
      max-height: min(760px, calc(100vh - 80px));
      padding: 34px 38px 38px;
      overflow-y: auto;
      transform: translate(-50%, -50%);
      border: 1px solid rgba(44, 25, 70, .12);
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 30px 90px rgba(25, 17, 34, .22);
    }

    .workspace-modal-close {
      position: absolute;
      top: 18px;
      right: 20px;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 50%;
      background: #f4f0f7;
      color: #4b3a57;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
    }

    .workspace-modal-close:hover {
      background: #ebe5ef;
    }

    .workspace-modal h2 {
      margin: 0 48px 24px 0;
      font-size: clamp(1.7rem, 3vw, 2.4rem);
      line-height: 1.1;
      letter-spacing: -.035em;
      color: #29222f;
    }

    .workspace-modal-content {
      padding: 28px 30px;
      border: 1px solid rgba(44, 25, 70, .08);
      border-radius: 14px;
      background: #fbfafc;
      color: #3c3442;
      font-size: .96rem;
      line-height: 1.75;
    }

    .workspace-modal-content p {
      margin: 0 0 20px;
    }

    .workspace-modal-content p:last-child {
      margin-bottom: 0;
    }

    .workspace-modal-content h3 {
      margin: 30px 0 14px;
      color: #2b2232;
      font-size: 1.12rem;
      line-height: 1.4;
      letter-spacing: -.015em;
    }

    .workspace-modal-content h3:first-child {
      margin-top: 0;
    }

    .workspace-modal-content h4 {
      margin: 24px 0 8px;
      color: #5b3d82;
      font-size: .78rem;
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .workspace-modal-content ul {
      margin: 0 0 22px;
      padding-left: 24px;
    }

    .workspace-modal-content li {
      margin: 7px 0;
      padding-left: 4px;
    }

    .workspace-modal-content strong {
      color: #2f2537;
      font-weight: 700;
    }

    .workspace-modal-content code {
      padding: 2px 6px;
      border-radius: 5px;
      background: #eee8f3;
      font-size: .88em;
    }

    .brief-table-wrapper {
      width: 100%;
      margin: 22px 0 28px;
      overflow-x: auto;
      border: 1px solid rgba(44, 25, 70, .10);
      border-radius: 12px;
      background: #fff;
    }

    .brief-table {
      width: 100%;
      min-width: 620px;
      border-collapse: collapse;
      font-size: .88rem;
      line-height: 1.55;
    }

    .brief-table th {
      padding: 13px 15px;
      border-bottom: 1px solid rgba(44, 25, 70, .12);
      background: #f3eef7;
      color: #4d3470;
      text-align: left;
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
      vertical-align: top;
    }

    .brief-table td {
      padding: 14px 15px;
      border-bottom: 1px solid rgba(44, 25, 70, .08);
      color: #403746;
      vertical-align: top;
    }

    .brief-table tbody tr:last-child td {
      border-bottom: 0;
    }

    .brief-table tbody tr:nth-child(even) td {
      background: #fcfbfd;
    }

    .brief-numbered-item {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 4px;
      margin: 12px 0;
      line-height: 1.7;
    }

    .brief-number {
      color: #5b3d82;
      font-weight: 700;
    }

    .brief-numbered-text {
      min-width: 0;
    }

    .brief-divider {
      height: 1px;
      margin: 26px 0;
      background: rgba(44, 25, 70, .1);
    }

    .brief-empty {
      color: rgba(42, 34, 47, .55);
    }


    /* ---------- Responsive ---------- */

    @media (max-width: 1000px) {
      .workspace-shell {
        width: min(100% - 44px, 900px);
      }

      .workspace-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .workspace-grid {
        grid-template-columns: 1fr;
      }

      .workspace-card-wide {
        grid-column: span 1;
      }
    }

    @media (max-width: 700px) {
      .workspace-shell {
        width: calc(100% - 28px);
        margin-top: 34px;
      }

      .workspace-topbar {
        align-items: flex-start;
        flex-direction: column;
        gap: 22px;
      }

      .workspace-topbar h1 {
        font-size: 3rem;
      }

      .workspace-stats {
        grid-template-columns: 1fr 1fr;
      }

      .workspace-card {
        padding: 21px;
      }

      .account-details {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .workspace-history-item,
      .workspace-output-item {
        align-items: flex-start;
        flex-direction: column;
        gap: 14px;
      }

      .workspace-view-button {
        width: 100%;
      }
    }


    @media (max-width: 480px) {
      .workspace-stats {
        grid-template-columns: 1fr;
      }

      .workspace-actions {
        width: 100%;
      }

      .workspace-actions a,
      .workspace-actions button {
        flex: 1;
      }
    }
  `;

  document.head.appendChild(style);
}


function createViewModal() {
  if ($('#workspaceViewModal')) return;

  const modal = document.createElement('div');

  modal.id = 'workspaceViewModal';
  modal.innerHTML = `
    <div class="workspace-modal-backdrop" data-close-modal></div>

    <div
      class="workspace-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspaceModalTitle"
    >
      <button
        class="workspace-modal-close"
        type="button"
        aria-label="Close"
        data-close-modal
      >
        ×
      </button>

      <p class="eyebrow" id="workspaceModalEyebrow">
        DECISION BRIEF
      </p>

      <h2 id="workspaceModalTitle">Output</h2>

      <div class="workspace-modal-content" id="workspaceModalContent"></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('[data-close-modal]').forEach(button => {
    button.addEventListener('click', closeViewModal);
  });
}

function parseBriefTable(lines) {
  const rows = [];

  for (const line of lines) {
    const cleaned = line.trim();

    if (!cleaned.includes('|')) continue;

    const cells = cleaned
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

    if (cells.length < 2) continue;

    // Ignore Markdown separator rows such as |---|---|---|
    if (cells.every(cell => /^:?-{2,}:?$/.test(cell))) {
      continue;
    }

    rows.push(cells);
  }

  if (rows.length < 2) {
    return null;
  }

  const header = rows[0];
  const body = rows.slice(1);

  let html = `
    <div class="brief-table-wrapper">
      <table class="brief-table">
        <thead>
          <tr>
            ${header.map(cell => `<th>${formatInlineBriefText(cell)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  for (const row of body) {
    html += `
      <tr>
        ${header.map((_, index) => {
          const cell = row[index] || '';
          return `<td>${formatInlineBriefText(cell)}</td>`;
        }).join('')}
      </tr>
    `;
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function formatBriefContent(text) {
  if (!text) {
    return '<p class="brief-empty">No content available.</p>';
  }

  const value = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  const lines = value.split('\n');
  const html = [];

  let paragraph = [];
  let tableLines = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  }

  function flushParagraph() {
    if (!paragraph.length) return;

    const text = paragraph.join(' ').trim();

    if (text) {
      html.push(`<p>${formatInlineBriefText(text)}</p>`);
    }

    paragraph = [];
  }

  function flushTable() {
    if (!tableLines.length) return;

    const table = parseBriefTable(tableLines);

    if (table) {
      html.push(table);
    } else {
      const fallback = tableLines.join(' ');
      html.push(`<p>${formatInlineBriefText(fallback)}</p>`);
    }

    tableLines = [];
  }

  function isTableLine(line) {
    if (!line.includes('|')) return false;

    const pipeCount = (line.match(/\|/g) || []).length;

    return pipeCount >= 2;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      closeList();
      flushTable();
      continue;
    }

    // Markdown table
    if (isTableLine(line)) {
      flushParagraph();
      closeList();
      tableLines.push(line);
      continue;
    }

    // If a normal line follows a table, finish the table first.
    flushTable();

    // Markdown horizontal rules
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<div class="brief-divider"></div>');
      continue;
    }

    // Numbered question / section heading
    if (/^\*\*\d+\.\s+.*\*\*$/.test(line)) {
      flushParagraph();
      closeList();

      const heading = line.replace(
        /^\*\*(\d+\.\s+.*)\*\*$/,
        '$1'
      );

      html.push(
        `<h3>${formatInlineBriefText(heading)}</h3>`
      );
      continue;
    }

    // Markdown headings
    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      closeList();

      const heading = line.replace(/^#{1,3}\s+/, '');

      html.push(
        `<h3>${formatInlineBriefText(heading)}</h3>`
      );
      continue;
    }

    // Bullet points
    if (/^[-•]\s+/.test(line)) {
      flushParagraph();

      if (!inList) {
        html.push('<ul>');
        inList = true;
      }

      const item = line.replace(/^[-•]\s+/, '');

      html.push(
        `<li>${formatInlineBriefText(item)}</li>`
      );
      continue;
    }

    // Numbered list items: 1. / 2. / 3. or 1) / 2) / 3)
    if (/^\d+[.)]\s+/.test(line)) {
      flushParagraph();
      closeList();

      const match = line.match(/^(\d+)[.)]\s+(.*)$/);

      if (match) {
        html.push(
          `<div class="brief-numbered-item">
            <span class="brief-number">${match[1]}.</span>
            <span class="brief-numbered-text">${formatInlineBriefText(match[2])}</span>
          </div>`
        );
      }

      continue;
    }

    closeList();

    // Bold-only label
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      flushParagraph();

      const label = line.replace(/^\*\*|\*\*$/g, '');

      html.push(
        `<h4>${escapeHtml(label)}</h4>`
      );
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  flushTable();

  return html.join('');
}

function formatInlineBriefText(value) {
  let escaped = escapeHtml(value);

  escaped = escaped.replace(
    /\*\*(.+?)\*\*/g,
    '<strong>$1</strong>'
  );

  escaped = escaped.replace(
    /`(.+?)`/g,
    '<code>$1</code>'
  );

  return escaped;
}

function openViewModal(title, content, eyebrow = 'DECISION BRIEF') {
  createViewModal();

  $('#workspaceModalEyebrow').textContent = eyebrow;
  $('#workspaceModalTitle').textContent = title;

  $('#workspaceModalContent').innerHTML =
    formatBriefContent(content);

  $('#workspaceViewModal').classList.add('is-open');
  document.body.classList.add('workspace-modal-open');
}

function closeViewModal() {
  const modal = $('#workspaceViewModal');

  if (!modal) return;

  modal.classList.remove('is-open');
  document.body.classList.remove('workspace-modal-open');
}

function attachViewListeners(state, processes) {
  document.querySelectorAll('[data-output-index]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.outputIndex);
      const output = state.outputs?.[index];

      if (!output) return;

      const process = processes[index];

      openViewModal(
        process?.title || `Process ${index + 1}`,
        output,
        'GENERATED OUTPUT'
      );
    });
  });

  document.querySelectorAll('[data-history-index]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.historyIndex);
      const item = state.history?.[index];

      if (!item) return;

      const title =
        item.title ||
        item.processTitle ||
        item.process ||
        'Previous Search';

      const content =
        item.output ||
        item.answer ||
        item.summary ||
        item.description ||
        'No content available.';

      openViewModal(
        title,
        content,
        'PREVIOUS SEARCH'
      );
    });
  });
}

async function loadWorkspace() {
  renderStyles();

  try {
    const session = await api('/api/auth/session');

    if (!session.user) {
      window.location.href = 'login.html';
      return;
    }

    const saved = await api('/api/state');
    const state = saved.state || {};
    const processesResponse = await api('/api/processes');
    const processes = processesResponse.processes || [];
    const segmentsResponse = await api('/api/segments');
    const segments = segmentsResponse.segments || [];

    const companyName = session.user.companyName || 'Workspace';
    const accountName = session.user.email || session.user.username || 'Account';

    $('#companyName').textContent = companyName;
    $('#accountName').textContent = accountName;
    $('#workspaceSubtitle').textContent = `${companyName} · Strategic validation workspace`;

    renderSegments(segments);
    renderProgress(state, processes.length);
    renderHistory(state);
    renderDocuments(state);

    createViewModal();
    initSegmentDialog();
    attachViewListeners(state, processes);
  } catch (error) {
    showToast(error.message);
  }
}

$('#workspaceLogout').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', {
      method: 'POST',
      body: '{}'
    });

    window.location.href = 'login.html';
  } catch (error) {
    showToast(error.message);
  }
});

loadWorkspace();


/* =========================================================
   FOUNDERMOTION — EVIDENCE UI
   ========================================================= */

(() => {
  const evidenceTypes = [
    "Interview Note",
    "Objection",
    "Pricing Signal",
    "Proof Point"
  ];

  let evidenceItems = [];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();


/* FOUNDERMOTION_EVIDENCE_COLLAPSE_V1 */

(function setupEvidenceCollapse() {
  function apply() {
    const section = document.getElementById("fmEvidenceSection");
    if (!section) return;

    if (section.dataset.collapsibleReady === "true") return;

    const header = section.querySelector(".fm-evidence-header");
    const grid = section.querySelector(".fm-evidence-grid");
    const addButton = section.querySelector(".fm-add-evidence");

    if (!header || !grid) return;

    section.dataset.collapsibleReady = "true";

    /*
     * Keep the existing Add Evidence button functional.
     * We only move it visually into the expandable panel.
     */
    let panel = section.querySelector(".fm-evidence-collapsible-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.className = "fm-evidence-collapsible-panel";

      if (addButton) {
        panel.appendChild(addButton);
      }

      panel.appendChild(grid);
      section.appendChild(panel);
    }

    /*
     * Replace the large Evidence heading area with one compact button.
     */
    header.innerHTML = `
      <button
        type="button"
        class="fm-evidence-toggle"
        aria-expanded="false"
        aria-controls="fmEvidenceCollapsiblePanel"
      >
        <span class="fm-evidence-toggle-left">
          <span class="fm-evidence-toggle-eyebrow">EVIDENCE</span>
          <span class="fm-evidence-toggle-title">
            Customer & market evidence
          </span>
        </span>

        <span class="fm-evidence-toggle-arrow" aria-hidden="true">
          →
        </span>
      </button>
    `;

    panel.id = "fmEvidenceCollapsiblePanel";
    panel.hidden = true;

    const toggle = header.querySelector(".fm-evidence-toggle");

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      const nextState = !isOpen;

      toggle.setAttribute("aria-expanded", String(nextState));
      panel.hidden = !nextState;
      section.classList.toggle("is-expanded", nextState);
    });
  }

  function injectStyles() {
    if (document.getElementById("fmEvidenceCollapseStyles")) return;

    const style = document.createElement("style");
    style.id = "fmEvidenceCollapseStyles";

    style.textContent = `
      /* Evidence collapsed state */

      #fmEvidenceSection {
        margin-top: 18px !important;
        padding: 0 !important;
        border-radius: 16px !important;
        overflow: hidden;
      }

      #fmEvidenceSection .fm-evidence-header {
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
      }

      .fm-evidence-toggle {
        width: 100%;
        min-height: 76px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 18px 24px;
        border: 0;
        background: #fff;
        color: #29222f;
        text-align: left;
        cursor: pointer;
        font: inherit;
        transition:
          background .16s ease,
          box-shadow .16s ease;
      }

      .fm-evidence-toggle:hover {
        background: #faf8fc;
      }

      .fm-evidence-toggle-left {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
      }

      .fm-evidence-toggle-eyebrow {
        flex: 0 0 auto;
        color: #7956a5;
        font-size: 11px;
        font-weight: 750;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .fm-evidence-toggle-title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -.02em;
        white-space: nowrap;
      }

      .fm-evidence-toggle-arrow {
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #f3eef8;
        color: #4b1b8f;
        font-size: 18px;
        font-weight: 700;
        transition: transform .18s ease;
      }

      #fmEvidenceSection.is-expanded
      .fm-evidence-toggle-arrow {
        transform: rotate(90deg);
      }

      .fm-evidence-collapsible-panel {
        padding: 0 24px 24px;
        border-top: 1px solid rgba(44, 25, 70, .08);
        background: #fff;
      }

      .fm-evidence-collapsible-panel[hidden] {
        display: none !important;
      }

      .fm-evidence-collapsible-panel .fm-add-evidence {
        margin: 18px 0 16px auto;
        display: flex;
      }

      .fm-evidence-collapsible-panel .fm-evidence-grid {
        margin-top: 0 !important;
      }

      @media (max-width: 700px) {
        .fm-evidence-toggle {
          min-height: 68px;
          padding: 16px 18px;
        }

        .fm-evidence-toggle-left {
          gap: 10px;
          flex-direction: column;
          align-items: flex-start;
        }

        .fm-evidence-toggle-title {
          font-size: 16px;
        }

        .fm-evidence-collapsible-panel {
          padding: 0 16px 18px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function start() {
    injectStyles();

    /*
     * Evidence section is created by initialiseEvidence().
     * Wait one tick so its DOM exists.
     */
    setTimeout(apply, 0);
    setTimeout(apply, 150);
    setTimeout(apply, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

