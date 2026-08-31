// Map definitions live together so new map points can be added without changing UI code.
let mapSteps = [
  { title: 'Market Positioning Analysis', category: 'Market strategy', purpose: 'Define FounderMotion market focus, competitive frame, wedge positioning and market-entry logic.', inputs: ['PMF & target-market prioritisation', 'Brand handbook & wedge definitions', 'Sector / competitive-category research', 'Early customer / beta feedback & buyer language', 'Trace vs Essentials use-case logic'], questions: ['Which market should FounderMotion target first?', 'Which buyer feels the problem most urgently?', 'Which category should FounderMotion avoid being trapped in?', 'What alternatives does the buyer use today?', 'Which wedge leads in each priority market?'], outputs: 'Priority ICPs and segments; competitive frame of reference; positioning statement and differentiation themes; Trace / Essentials market-entry logic.', feeds: '2, 3, 6, 9, 15, 19, 22, 27, 28' },
  { title: 'Ideal Customer Profile', category: 'Customer strategy', purpose: 'Turn the market-positioning decision into a clear, prioritised ideal-customer profile.', inputs: ['Previous market positioning output', 'Customer research', 'Sales and beta feedback'], questions: ['Which customer profile should be prioritised first?', 'What firmographic and behavioural signals define the best-fit buyer?', 'Which customer profiles should be deprioritised?'], outputs: 'Prioritised ICP, buying triggers and qualification criteria.', feeds: '3, 6, 9, 15, 19, 22, 27, 28' },
  { title: 'Buyer Problem & Urgency', category: 'Customer strategy', purpose: 'Clarify the priority buyer problem, urgency and language that should guide messaging.', inputs: ['Previous outputs', 'Buyer interviews and feedback', 'Current workarounds'], questions: ['What job is the buyer trying to complete?', 'What makes the problem urgent now?', 'What language does the buyer use to describe the pain?'], outputs: 'Priority problem statement, urgency signals and buyer-language themes.', feeds: '6, 9, 15, 19, 22, 27, 28' }
];

const defaultState = () => ({
  step: 0,
  documents: [],
  outputs: [],
  history: [],
  segments: [],
  processProgress: []
});
const $ = selector => document.querySelector(selector);
const toast = $('#toast');
let state = defaultState();
let selectedInput = '';
let currentUser = null;


document.querySelector('#documentForm .primary-button').innerHTML = 'Add information <span>&rarr;</span>';
document.querySelector('.output-panel h2').insertAdjacentHTML('afterend', '<button class="expand-output-button" id="expandOutput" type="button">Expand output</button>');
document.querySelector('.output-panel').insertAdjacentHTML('beforeend', `
  <section class="previous-searches" id="previousSearches">
    <div class="previous-searches-header">
      <div>
        <p class="eyebrow">Saved history</p>
        <h3>Previous history</h3>
      </div>
      <span class="history-count" id="historyCount">0 / 3</span>
    </div>
    <div id="historyList" class="history-list"></div>
  </section>
`);

document.body.insertAdjacentHTML('beforeend', `
  <div class="history-modal" id="historyModal" aria-hidden="true">
    <div class="history-modal-backdrop" data-close-history></div>
    <section class="history-modal-card" role="dialog" aria-modal="true" aria-labelledby="historyModalTitle">
      <button class="history-modal-close" id="closeHistoryModal" type="button" aria-label="Close">×</button>
      <p class="eyebrow">Previous search</p>
      <h2 id="historyModalTitle">Decision brief</h2>
      <p class="history-modal-date" id="historyModalDate"></p>
      <div id="historyModalBody"></div>
    </section>
  </div>
`);

document.body.insertAdjacentHTML('beforeend', `
  <div class="output-modal" id="outputModal" aria-hidden="true">
    <div class="output-modal-backdrop" id="outputModalBackdrop"></div>

    <section class="output-modal-card"
             role="dialog"
             aria-modal="true"
             aria-labelledby="outputModalTitle">

      <button class="output-modal-close"
              id="outputModalClose"
              type="button"
              aria-label="Close generated output">×</button>

      <p class="eyebrow">Generated output</p>
      <h2 id="outputModalTitle">Decision brief</h2>

      <div class="output-modal-body" id="outputModalBody"></div>
    </section>
  </div>
`);

const historyStyle = document.createElement('style');
historyStyle.textContent = `
.previous-searches {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid rgba(30, 30, 30, 0.10);
}

.previous-searches-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 14px;
}

.previous-searches-header h3 {
  margin: 3px 0 0;
  font-size: 20px;
}

.history-count {
  font-size: 12px;
  opacity: .6;
}

.history-list {
  display: grid;
  gap: 10px;
}

.history-empty {
  margin: 0;
  font-size: 14px;
  opacity: .58;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid rgba(30,30,30,.10);
  border-radius: 12px;
  background: rgba(255,255,255,.65);
}

.history-item-info {
  min-width: 0;
}

.history-item-title {
  margin: 0 0 4px;
  font-weight: 600;
}

.history-item-meta {
  margin: 0;
  font-size: 12px;
  opacity: .55;
}

.history-view {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  font-weight: 600;
  cursor: pointer;
}

.history-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.history-modal.open {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.history-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 18, 20, .52);
  backdrop-filter: blur(4px);
}

.history-modal-card {
  position: relative;
  z-index: 1;
  width: min(900px, 100%);
  max-height: min(82vh, 800px);
  overflow: auto;
  padding: 32px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 80px rgba(0,0,0,.22);
}

.history-modal-close {
  position: absolute;
  top: 16px;
  right: 18px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(0,0,0,.06);
  font-size: 24px;
  cursor: pointer;
}

.history-modal-card h2 {
  margin: 4px 40px 4px 0;
}

.history-modal-date {
  margin: 0 0 24px;
  font-size: 13px;
  opacity: .55;
}

.history-modal-card .generated-answer {
  margin-top: 20px;
}

@media (max-width: 700px) {
  .history-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-modal-card {
    padding: 24px 20px;
  }
}
`;

document.head.appendChild(historyStyle);

const outputModalStyle = document.createElement('style');
outputModalStyle.id = 'generatedOutputModalStyle';

outputModalStyle.textContent = `
  /* Keep the right-hand workspace card compact. */
  .output-panel #analysisOutput {
    display: none !important;
  }

  .output-panel {
    align-self: start;
    height: fit-content;
    min-height: 0 !important;
  }

  /* Modal layer */
  .output-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }

  .output-modal.open {
    display: flex;
  }

  /* Blurred background */
  .output-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(31, 20, 42, .38);
    backdrop-filter: blur(9px);
    -webkit-backdrop-filter: blur(9px);
  }

  /* Center card */
  .output-modal-card {
    position: relative;
    z-index: 1;

    width: min(860px, 100%);
    max-height: min(82vh, 820px);

    display: flex;
    flex-direction: column;

    overflow: hidden;
    box-sizing: border-box;

    padding: 30px 32px 32px;

    border: 1px solid rgba(44, 25, 70, .12);
    border-radius: 22px;

    background: #fff;

    box-shadow:
      0 30px 90px rgba(34, 20, 50, .24);
  }

  .output-modal-card h2 {
    margin: 3px 50px 22px 0;

    font-family: "Playfair Display", Georgia, serif;
    font-size: 30px;
    line-height: 1.1;

    color: #29232e;
  }

  .output-modal-close {
    position: absolute;
    top: 22px;
    right: 24px;

    width: 38px;
    height: 38px;

    border: 1px solid #e4dfea;
    border-radius: 50%;

    background: #faf8fc;
    color: #4a3f50;

    font-size: 24px;
    line-height: 1;

    cursor: pointer;
  }

  .output-modal-close:hover {
    background: #f1edf5;
  }

  /* Only the modal content scrolls. */
  .output-modal-body {
    min-height: 0;
    overflow-y: auto;
    padding-right: 10px;
  }

  .output-modal-body .generated-answer {
    margin-top: 0 !important;
  }

  .output-modal-body .downstream {
    margin-top: 22px;
  }

  .output-modal-body::-webkit-scrollbar {
    width: 8px;
  }

  .output-modal-body::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: #d8d0df;
  }

  body.output-modal-open {
    overflow: hidden;
  }

  @media (max-width: 760px) {
    .output-modal {
      padding: 16px;
    }

    .output-modal-card {
      max-height: 88vh;
      padding: 24px 20px 22px;
      border-radius: 18px;
    }

    .output-modal-card h2 {
      font-size: 26px;
    }

    .output-modal-close {
      top: 17px;
      right: 17px;
    }
  }
`;

document.head.appendChild(outputModalStyle);


function renderHistory() {
  const processIndex = state.step;

  // Show only the latest 3 history records for the CURRENT process.
  const history = Array.isArray(state.history)
    ? state.history
        .filter(item => {
          const itemProcess =
            Number.isInteger(item.processIndex)
              ? item.processIndex
              : Number(item.processNumber || 1) - 1;

          return itemProcess === processIndex;
        })
        .slice(0, 3)
    : [];

  $('#historyCount').textContent = `${history.length} / 3`;

  if (!history.length) {
    $('#historyList').innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 3.5H14.5L18.5 7.5V12"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"/>
            <path d="M14.5 3.5V7.5H18.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"/>
            <path d="M6 3.5V20.5H12"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"/>
            <circle cx="16.5" cy="16.5" r="3.5"
              stroke="currentColor"
              stroke-width="1.8"/>
            <path d="M19 19L21 21"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"/>
          </svg>
        </div>

        <p class="history-empty-title">
          No previous history yet
        </p>

        <p class="history-empty-description">
          Generated results for this process will appear here after you run the analysis.
        </p>
      </div>
    `;
    return;
  }

  $('#historyList').innerHTML = history.map((item, index) => {
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleString()
      : 'Saved result';

    return `
      <article class="history-item">
        <div class="history-item-info">
          <p class="history-item-title">
            ${escapeHtml(item.title || `Process ${item.processNumber || processIndex + 1}`)}
          </p>

          <p class="history-item-meta">
            Process ${item.processNumber || (item.processIndex + 1)} · ${escapeHtml(date)}
          </p>
        </div>

        <button
          class="history-view"
          type="button"
          data-history-index="${index}">
          View result →
        </button>
      </article>
    `;
  }).join('');

  $('#historyList')
    .querySelectorAll('[data-history-index]')
    .forEach(button => {
      button.addEventListener('click', () => {
        const item = history[Number(button.dataset.historyIndex)];

        if (!item) return;

        $('#historyModalTitle').textContent =
          item.title || 'Decision brief';

        $('#historyModalDate').textContent =
          item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : 'Saved result';

        $('#historyModalBody').innerHTML = `
          <div class="generated-answer">
            ${formatAnswer(item.answer || '')}
          </div>
        `;

        $('#historyModal').classList.add('open');
        $('#historyModal').setAttribute('aria-hidden', 'false');
      });
    });
}

function closeHistoryModal() {
  $('#historyModal').classList.remove('open');
  $('#historyModal').setAttribute('aria-hidden', 'true');
}

$('#closeHistoryModal').addEventListener('click', closeHistoryModal);
$('#historyModal').querySelector('[data-close-history]').addEventListener('click', closeHistoryModal);


async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// The public page opens without an account. Accounts are required to save or generate AI work.
async function restoreAccount() {
  try {
    const processResponse = await api('/api/processes');
    mapSteps = processResponse.processes;

    const session = await api('/api/auth/session');

    if (!session.user) {
      render();
      return;
    }

    currentUser = session.user;
    syncAuthScreenUI();

    const saved = await api('/api/state');

    state = saved.state || defaultState();

    // Always restore arrays safely.
    state.documents = Array.isArray(state.documents)
      ? state.documents
      : [];

    state.outputs = Array.isArray(state.outputs)
      ? state.outputs
      : [];

    state.history = Array.isArray(state.history)
      ? state.history
      : [];

    state.segments = Array.isArray(state.segments)
      ? state.segments
      : [];

    state.processProgress = Array.isArray(state.processProgress)
      ? state.processProgress
      : [];

    await loadProcessProgress();

    /*
     * IMPORTANT:
     * Restore the exact saved process.
     *
     * Process index:
     * 0 = Process 1
     * 1 = Process 2
     * 2 = Process 3
     * ...
     *
     * Do NOT default back to Process 1 when state.step is 0.
     */
    const savedStep = Number.isInteger(state.step)
      ? state.step
      : Number(state.step);

    if (Number.isFinite(savedStep)) {
      state.step = Math.max(
        0,
        Math.min(savedStep, mapSteps.length - 1)
      );
    } else {
      state.step = 0;
    }

    $('#headerAuth').innerHTML = `
      <span>
        Signed in as ${escapeHtml(
          currentUser.email || currentUser.username
        )}
      </span>

      <button id="headerSave" type="button">
        Save progress
      </button>

      <button id="headerLogout" type="button">
        Log out
      </button>

      <a class="header-signup" href="workspace.html">
        My workspace
      </a>
    `;

    $('#headerSave').addEventListener(
      'click',
      () => saveProgress(true)
    );

    $('#headerLogout').addEventListener(
      'click',
      logout
    );

    applyCompanyName(currentUser.companyName);

  } catch (error) {
    console.error('Unable to restore saved workspace:', error);
    showToast('Unable to restore your saved workspace.');
  }

  // Render AFTER state.step has been restored.
  render();

  // Make sure Previous / Next buttons reflect the restored process.
  updateProcessNavigation();
}

function applyCompanyName(name) {
  document.querySelectorAll('.company-name').forEach(element => { element.textContent = name; });
  document.title = `${name} | FounderMotion`;
}
async function logout() {
  if (currentUser) {
    try {
      await saveProgress(false);
    } catch (error) {
      console.error('Final autosave before logout failed:', error);
    }
  }

  await api('/api/auth/logout', {
    method: 'POST',
    body: '{}'
  });

  currentUser = null;
  syncAuthScreenUI();
  location.reload();
}

function currentStep() { return mapSteps[state.step]; }


async function loadProcessProgress() {
  if (!currentUser) {
    state.processProgress = [];
    return;
  }

  try {
    const response = await api('/api/process-progress');

    state.processProgress = Array.isArray(response.progress)
      ? response.progress
      : [];
  } catch (error) {
    console.error('Unable to load process progress:', error);
    state.processProgress = [];
  }
}


async function updateProcessProgress(processNumber, status) {
  if (!currentUser) return;

  try {
    const response = await api('/api/process-progress', {
      method: 'PUT',
      body: JSON.stringify({
        processNumber,
        status
      })
    });

    state.processProgress = Array.isArray(response.progress)
      ? response.progress
      : [];

    renderDecisionGates();
    updateProcessNavigation();
  } catch (error) {
    console.error('Unable to update process progress:', error);
  }
}


function getProcessProgressStatus(processNumber) {
  const rows = Array.isArray(state.processProgress)
    ? state.processProgress
    : [];

  const row = rows.find(
    item => Number(item.process_number) === Number(processNumber)
  );

  return row?.status || 'Not Started';
}


function getPhaseStatus(startProcess, endProcess) {
  // "Done" / completion counts below key off hasSavedProcessOutput(),
  // the same signal that already drives the checkmarks on the step
  // dots and the unlock logic (getHighestUnlockedProcessIndex()) --
  // process_progress.status alone can lag behind it (e.g. older saved
  // generations that only exist in Previous History), which is why the
  // "X of N processes completed" message could previously show a
  // smaller count than the number of checked-off steps.
  const firstStatus =
    getProcessProgressStatus(startProcess);

  if (hasSavedProcessOutput(endProcess - 1)) {
    return 'Done';
  }

  if (
    firstStatus !== 'Not Started' ||
    hasSavedProcessOutput(startProcess - 1)
  ) {
    return 'In Progress';
  }

  return 'Not Started';
}


function getCompletedCount(startProcess, endProcess) {
  let completed = 0;

  for (
    let processNumber = startProcess;
    processNumber <= endProcess;
    processNumber++
  ) {
    if (hasSavedProcessOutput(processNumber - 1)) {
      completed++;
    }
  }

  return completed;
}





function renderDecisionGates() {
  const card1 = document.getElementById('fmPhase1');
  const card2 = document.getElementById('fmPhase2');

  if (!card1 || !card2) return;

  const phase1Completed = getCompletedCount(1, 5);
  const phase2Completed = getCompletedCount(6, 13);

  const phase1Status = getPhaseStatus(1, 5);
  const phase2Status = getPhaseStatus(6, 13);

  const phase1Done = phase1Status === 'Done';
  const phase2Done = phase2Status === 'Done';

  const statusSlug = status =>
    status.toLowerCase().replace(/\s+/g, '-');

  card1.classList.toggle('is-done', phase1Done);
  card1.dataset.state = statusSlug(phase1Status);

  card2.classList.toggle('is-done', phase2Done);
  card2.classList.toggle('is-locked', !phase1Done);
  card2.dataset.state = phase1Done ? statusSlug(phase2Status) : 'locked';

  document.getElementById('fmPhase1State').textContent =
    phase1Status;

  document.getElementById('fmPhase2State').textContent =
    phase1Done ? phase2Status : 'Locked';

  document.getElementById('fmPhase1Message').textContent =
    `${phase1Completed} of 5 processes completed`;

  if (phase2Done) {
    document.getElementById('fmPhase2Message').textContent =
      'Phase 2 is complete.';
  } else if (phase1Done) {
    document.getElementById('fmPhase2Message').textContent =
      `${phase2Completed} of 8 processes completed`;
  } else {
    document.getElementById('fmPhase2Message').textContent =
      'Phase 1 must be completed before starting Phase 2.';
  }
}


function hasSavedProcessOutput(index) {
  const directOutput =
    Array.isArray(state.outputs)
      ? state.outputs[index]
      : null;

  if (
    typeof directOutput === 'string' &&
    directOutput.trim()
  ) {
    return true;
  }

  /*
   * Older/saved generations may exist in Previous History
   * even when process_answers / state.outputs is empty.
   * Treat that saved generation as a real process output.
   */
  if (Array.isArray(state.history)) {
    return state.history.some(item => {
      const processIndex =
        Number.isInteger(item.processIndex)
          ? item.processIndex
          : Number(item.processNumber || 1) - 1;

      return (
        processIndex === index &&
        typeof item.answer === 'string' &&
        item.answer.trim()
      );
    });
  }

  return false;
}


function getHighestUnlockedProcessIndex() {
  let unlocked = 0;

  for (
    let index = 0;
    index < mapSteps.length - 1;
    index++
  ) {
    if (!hasSavedProcessOutput(index)) {
      break;
    }

    unlocked = index + 1;
  }

  return unlocked;
}


function cleanupProcess3Icons() {
  // Process 3 only
  if (state.step !== 2) return;

  const cards = document.querySelectorAll('#inputList .input-source');

  cards.forEach(card => {
    const icons = Array.from(card.querySelectorAll('.input-icon'));

    // Nothing to clean
    if (icons.length <= 1) return;

    // Keep the newest/current icon and remove all older duplicates.
    icons.slice(0, -1).forEach(icon => icon.remove());
  });
}

function render() {
  const step = currentStep();

  const directOutput =
    Array.isArray(state.outputs)
      ? state.outputs[state.step]
      : null;

  const currentProcessNumber =
    step?.number || state.step + 1;

  const latestHistoryOutput =
    Array.isArray(state.history)
      ? state.history
          .filter(item => {
            const processIndex =
              Number.isInteger(item.processIndex)
                ? item.processIndex
                : Number(item.processNumber || 1) - 1;

            return processIndex === state.step;
          })
          .sort((a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
          )[0]?.answer
      : null;

  const output =
    typeof directOutput === 'string' &&
    directOutput.trim()
      ? directOutput
      : latestHistoryOutput || '';

  const phaseNumber = state.step < 5 ? 1 : 2;
  renderDecisionGates();
  $('#stepLabel').textContent =
    state.step < 5
      ? 'Phase 1 – Market and buyer validation'
      : 'Phase 2 – Product, offer and pricing';
  $('#progressLabel').textContent = `${state.step + 1} of ${mapSteps.length}`;
  const phases = [
    {
      name: 'Phase 1',
      title: 'Market and buyer validation',
      start: 0,
      end: 5
    },
    {
      name: 'Phase 2',
      title: 'Product, offer and pricing',
      start: 5,
      end: 13
    }
  ];

  const currentPhase = state.step < 5 ? phases[0] : phases[1];
  const currentProcess = mapSteps[state.step];

  const renderPhaseSteps = (start, end) => {
    return mapSteps.slice(start, end).map((process, offset) => {
      const index = start + offset;
      const complete = hasSavedProcessOutput(index);
      const current = index === state.step;

      return `
        <button
          class="fm-phase-step ${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''}"
          data-process="${index}"
          type="button"
          ${index <= getHighestUnlockedProcessIndex() || current ? '' : 'disabled'}
          aria-label="Process ${process.number}: ${escapeHtml(process.title)}"
          title="${escapeHtml(process.title)}"
        >
          <span class="fm-phase-step-mark">${complete ? '✓' : process.number}</span>
          <span class="fm-phase-step-title">${escapeHtml(process.title)}</span>
        </button>
      `;
    }).join('');
  };

  $('#fmPhase1Steps').innerHTML = renderPhaseSteps(0, 5);
  $('#fmPhase2Steps').innerHTML = renderPhaseSteps(5, 13);

  document.querySelectorAll('#fmPhase1Steps [data-process], #fmPhase2Steps [data-process]').forEach(dot => {
    dot.addEventListener('click', () => {
      state.step = Number(dot.dataset.process);
      render();
      saveProgress(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  $('#stepCategory').textContent = step.category;
  $('#stepTitle').textContent = step.title;
  const processPurpose = companyText(step.purpose);
  $('#stepPurpose').textContent =
    processPurpose.charAt(0).toUpperCase() + processPurpose.slice(1);

  const outputDependencies = (step.outputSources || []).map(processNumber => {
    const sourceProcess = mapSteps.find(process => process.number === processNumber);
    const hasAnswer = Boolean(state.outputs[processNumber - 1]);
    return `<li class="output-source ${hasAnswer ? 'ready' : ''}">Process ${processNumber}: ${escapeHtml(sourceProcess?.title || 'Untitled process')}<span>${hasAnswer ? 'available' : 'awaiting output'}</span></li>`;
  }).join('');
  const outputsToUse = outputDependencies ? `<section class="outputs-to-use"><h4>Outputs to use</h4><ul>${outputDependencies}</ul></section>` : '';

  const getInputIcon = (input, index) => {
    return `<span class="input-icon" aria-hidden="true"><span class="input-number">${String(index + 1).padStart(2, '0')}</span></span>`;
  };

  $('#inputList').innerHTML = outputsToUse + step.inputs.map((input, index) => {

    const sources = state.documents.filter(document => document.input === input);
    const sourceHtml = sources.map(document =>
      `<span class="source-chip">${escapeHtml(document.name)} <button data-remove="${state.documents.indexOf(document)}" aria-label="Remove ${escapeHtml(document.name)}">×</button></span>`
    ).join('');

    const displayInput = String(input).charAt(0).toUpperCase() + String(input).slice(1);
    const inputIcon = getInputIcon(input, index);

    return `
      <section class="input-source">
        ${inputIcon}
        <div class="input-content">
          <div class="input-heading">
            <span class="input-label">${escapeHtml(displayInput)}</span>
            <small>Required</small>
          </div>
          <button class="add-source-inline" data-input="${index}" type="button">+ Add information</button>
          <div class="source-chips">${sourceHtml || '<p class="no-sources">No information attached.</p>'}</div>
        </div>
      </section>
    `;
  }).join('');
  $('#inputList').querySelectorAll('[data-input]').forEach(button => button.addEventListener('click', () => openDocumentation(step.inputs[Number(button.dataset.input)])));
  $('#inputList').querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => { state.documents.splice(Number(button.dataset.remove), 1); render(); saveProgress(false); }));
  $('#questionList').innerHTML = step.questions.map((question, index) => `<div class="question-item"><b>${String(index + 1).padStart(2, '0')}</b><p>${escapeHtml(companyText(question))}</p></div>`).join('');
  $('#analysisOutput').innerHTML = output ? `<div class="generated-answer">${formatAnswer(output)}</div><div class="downstream"><strong>Outputs & downstream</strong><p>${escapeHtml(companyText(step.outputs))}</p><small>Feeds: ${escapeHtml(step.feeds)}</small></div>` : '';
  $('#outputEmpty').hidden = Boolean(output);
  document.querySelectorAll('.previous-button').forEach(button => { button.hidden = state.step === 0; });
  document.querySelectorAll('.next-button').forEach(button => {
    button.hidden = state.step === mapSteps.length - 1;
    button.disabled = !output;
  });
  $('#generatePdf').disabled = !output;
  if ($('#generateCsv')) $('#generateCsv').disabled = !output;
  $('#expandOutput').disabled = !output;
  renderHistory();

  // Process 3 only: remove duplicate/legacy input icons.
  cleanupProcess3Icons();
}

function openDocumentation(input) {
  if (!currentUser) return showToast('Log in or sign up to add and save information.');
  selectedInput = input;
  $('#documentDialogTitle').textContent = input;
  $('#documentName').value = '';
  $('#documentDialog').showModal();
}

function createProcessEvidenceRecord(name, text) {
  const step = currentStep();
  const inputs = Array.isArray(step?.inputs) ? step.inputs : [];
  const inputIndex = inputs.indexOf(selectedInput);

  return {
    name,
    text,
    input: selectedInput,
    inputNumber: inputIndex >= 0 ? inputIndex + 1 : null,
    processNumber: step?.number || state.step + 1,
    processTitle: step?.title || `Process ${state.step + 1}`,
    evidenceSource: 'process-input'
  };
}

$('#documentForm').addEventListener('submit', async event => {
  event.preventDefault();

  const documentName = $('#documentName').value.trim();
  const documentText = $('#documentText').value.trim();

  if (!documentName && !documentText) {
    showToast('Add a document name or evidence content.');
    return;
  }

  invalidateProcessOneOutputs();

  if (!Array.isArray(state.documents)) {
    state.documents = [];
  }

  const evidenceRecord = createProcessEvidenceRecord(
    documentName || 'Uploaded evidence',
    documentText
  );

  state.documents.push(evidenceRecord);

  try {
    const stateToSave = {
      ...state,
      step: Number(state.step) || 0,
      documents: Array.isArray(state.documents)
        ? state.documents
        : [],
      outputs: Array.isArray(state.outputs)
        ? state.outputs
        : [],
      history: Array.isArray(state.history)
        ? state.history
        : [],
      segments: Array.isArray(state.segments)
        ? state.segments
        : []
    };

    await api('/api/state', {
      method: 'PUT',
      body: JSON.stringify(stateToSave)
    });

    state = {
      ...state,
      ...stateToSave
    };

    event.target.reset();
    $('#documentDialog').close();

    render();

    showToast('Evidence saved.');
  } catch (error) {
    state.documents = state.documents.filter(
      item => item !== evidenceRecord
    );

    console.error('Evidence save failed:', error);
    showToast('Evidence could not be saved.');
  }
});
$('.close').addEventListener('click', () => $('#documentDialog').close());
$('#chooseFile').addEventListener('click', () => $('#fileInput').click());
$('#dropZone').addEventListener('click', event => { if (!event.target.closest('#chooseFile')) $('#fileInput').click(); });
$('#fileInput').addEventListener('change', () => addFiles($('#fileInput').files));
['dragenter', 'dragover'].forEach(type => $('#dropZone').addEventListener(type, event => { event.preventDefault(); $('#dropZone').classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => $('#dropZone').addEventListener(type, event => { event.preventDefault(); $('#dropZone').classList.remove('dragging'); }));
$('#dropZone').addEventListener('drop', event => addFiles(event.dataTransfer.files));

const MAX_UPLOAD_BYTES = 12_000_000;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

async function addFiles(files) {
  invalidateProcessOneOutputs();
  let failures = 0;

  for (const file of [...files]) {
    if (file.size > MAX_UPLOAD_BYTES) {
      failures++;
      continue;
    }

    try {
      const dataBase64 = await fileToBase64(file);
      const uploaded = await api('/api/evidence/upload', {
        method: 'POST',
        body: JSON.stringify({ name: file.name, dataBase64 })
      });

      state.documents.push(
        createProcessEvidenceRecord(uploaded.name, uploaded.text)
      );
    } catch (error) {
      failures++;
    }
  }

  $('#fileInput').value = ''; $('#documentDialog').close(); render(); await saveProgress(false);
  showToast(failures ? `Added with ${failures} file(s) skipped (too large or unreadable).` : 'Information added.');
}

async function saveProgress(notify) {
  if (!currentUser) {
    if (notify) {
      showToast('Log in to save your map securely.');
    }
    return;
  }

  try {
    /*
     * Explicitly preserve the CURRENT process before sending
     * the state to the server.
     */
    const stateToSave = {
      ...state,
      step: Number(state.step) || 0,

      documents: Array.isArray(state.documents)
        ? state.documents
        : [],

      outputs: Array.isArray(state.outputs)
        ? state.outputs
        : [],

      history: Array.isArray(state.history)
        ? state.history
        : [],

      segments: Array.isArray(state.segments)
        ? state.segments
        : []
    };

    await api('/api/state', {
      method: 'PUT',
      body: JSON.stringify(stateToSave)
    });

    // Keep local state in sync with exactly what was saved.
    state = {
      ...state,
      ...stateToSave
    };

    updateProcessNavigation();

    const currentProcessNumber =
      currentStep()?.number || state.step + 1;

    if (
      getProcessProgressStatus(currentProcessNumber) ===
      'Not Started'
    ) {
      await updateProcessProgress(
        currentProcessNumber,
        'In Progress'
      );
    }

    if (notify) {
      showToast('Progress saved securely.');
    }

  } catch (error) {
    console.error('Save progress failed:', error);

    if (notify) {
      showToast(error.message);
    }
  }
}

$('#runAnalysis').addEventListener('click', async () => {
  if (!currentUser) return showToast('Log in or sign up to generate an AI decision brief.');
  if (!state.documents.length) return showToast('Add information before generating an output.');
  const button = $('#runAnalysis'); button.disabled = true; button.textContent = 'Generating decision brief…';
  try {
    const requiredOutputs = (currentStep().outputSources || []).map(processNumber => state.outputs[processNumber - 1]).filter(Boolean);
    // The database stores a default company name in some process wording. Replace it
    // before sending the process to the AI, so analysis always uses this workspace's name.
    const analysisStep = {
      ...currentStep(),
      purpose: companyText(currentStep().purpose),
      questions: currentStep().questions.map(companyText),
      outputs: companyText(currentStep().outputs)
    };
    const response = await api('/api/analyze', { method: 'POST', body: JSON.stringify({ step: analysisStep, documents: state.documents, previousOutputs: requiredOutputs }) });
    if (!Array.isArray(state.history)) state.history = [];

    /*
     * Every successful AI generation is immediately saved
     * to Previous searches.
     */
    state.history.unshift({
      title: currentStep().title,
      processIndex: state.step,
      processNumber: currentStep().number || state.step + 1,
      answer: response.answer,
      createdAt: new Date().toISOString()
    });

    // Keep up to 3 history records PER PROCESS.
    state.history = state.history.filter((item, index, array) => {
      const processIndex =
        Number.isInteger(item.processIndex)
          ? item.processIndex
          : Number(item.processNumber || 1) - 1;

      const sameProcess = array
        .filter(other => {
          const otherProcess =
            Number.isInteger(other.processIndex)
              ? other.processIndex
              : Number(other.processNumber || 1) - 1;

          return otherProcess === processIndex;
        })
        .indexOf(item);

      return sameProcess < 3;
    });

    const completedProcessIndex = Number(state.step) || 0;
    const completedProcessNumber =
      currentStep()?.number || completedProcessIndex + 1;

    if (!Array.isArray(state.outputs)) {
      state.outputs = [];
    }

    // Store the generated output against the process that produced it.
    state.outputs[completedProcessIndex] = response.answer;

    const hasNextProcess =
      completedProcessIndex < mapSteps.length - 1;

    const nextProcessIndex =
      hasNextProcess
        ? completedProcessIndex + 1
        : completedProcessIndex;

    /*
     * Persist output, history and the next process position in one
     * explicit state request. Do not rely on saveProgress() here.
     */
    const completedState = {
      ...state,
      step: nextProcessIndex,
      outputs: [...state.outputs],
      history: Array.isArray(state.history)
        ? [...state.history]
        : [],
      documents: Array.isArray(state.documents)
        ? [...state.documents]
        : []
    };

    await api('/api/state', {
      method: 'PUT',
      body: JSON.stringify(completedState)
    });

    // Only mark the process Completed after its output is persisted.
    await updateProcessProgress(
      completedProcessNumber,
      'Completed'
    );

    // Move the local application to the persisted process.
    state = {
      ...state,
      ...completedState
    };

    if (hasNextProcess) {
      const nextProcessNumber =
        mapSteps[nextProcessIndex]?.number ||
        nextProcessIndex + 1;

      await updateProcessProgress(
        nextProcessNumber,
        'In Progress'
      );
    }

    render();
    updateProcessNavigation();
    renderDecisionGates();

    showToast(
      hasNextProcess
        ? `Process ${completedProcessNumber} completed. Process ${completedProcessNumber + 1} is now in progress.`
        : `Process ${completedProcessNumber} completed.`
    );
  } catch (error) { showToast(error.message); } finally { button.disabled = false; button.innerHTML = 'Run the process <span>→</span>'; }
});

function isCurrentProcessComplete() {
  return Boolean(
    state.outputs &&
    state.outputs[state.step]
  );
}

function updateProcessNavigation() {
  const previousButton = $('#prevStep');
  const nextButton = $('#nextStep');

  if (!previousButton || !nextButton) return;

  const currentIndex = Number(state.step) || 0;

  /*
   * Previous:
   * Always available when we are not on Process 1.
   */
  const canGoPrevious = currentIndex > 0;

  previousButton.disabled = !canGoPrevious;
  previousButton.setAttribute(
    'aria-disabled',
    String(!canGoPrevious)
  );

  /*
   * Next:
   * ONLY available when the CURRENT process has a generated
   * output.
   *
   * Saved history does NOT count as completion.
   */
  const hasNextProcess =
    currentIndex < mapSteps.length - 1;

  const currentOutput =
    Array.isArray(state.outputs)
      ? state.outputs[currentIndex]
      : null;

  const hasGeneratedOutput =
    typeof currentOutput === 'string' &&
    currentOutput.trim().length > 0;

  const processNumber =
    mapSteps[currentIndex]?.number || currentIndex + 1;

  const processStatus =
    getProcessProgressStatus(processNumber);

  const processComplete =
    hasGeneratedOutput ||
    processStatus === 'Completed';

  const canGoNext =
    hasNextProcess && processComplete;

  nextButton.disabled = !canGoNext;
  nextButton.setAttribute(
    'aria-disabled',
    String(!canGoNext)
  );

  nextButton.title =
    !processComplete && hasNextProcess
      ? 'Complete this process before continuing.'
      : '';
}


async function moveStep(direction) {
  const currentIndex = Number(state.step) || 0;
  const next = currentIndex + direction;

  // Hard boundary.
  if (next < 0 || next >= mapSteps.length) {
    return;
  }

  /*
   * NEVER allow Next unless the CURRENT process has
   * a newly generated output.
   */
  if (direction > 0) {
    const currentOutput =
      Array.isArray(state.outputs)
        ? state.outputs[currentIndex]
        : null;

    const hasGeneratedOutput =
      typeof currentOutput === 'string' &&
      currentOutput.trim().length > 0;

    const processNumber =
      mapSteps[currentIndex]?.number || currentIndex + 1;

    const processStatus =
      getProcessProgressStatus(processNumber);

    const processComplete =
      hasGeneratedOutput ||
      processStatus === 'Completed';

    if (!processComplete) {
      showToast(
        'Complete this process before moving to the next process.'
      );

      updateProcessNavigation();
      return;
    }
  }

  // Previous is always allowed when next >= 0.
  state.step = next;

  render();
  updateProcessNavigation();

  /*
   * Persist the exact process currently displayed.
   */
  try {
    await api('/api/state', {
      method: 'PUT',
      body: JSON.stringify({
        ...state,
        step: next
      })
    });
  } catch (error) {
    console.error(
      'Failed to save process position:',
      error
    );
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


$('#prevStep').addEventListener('click', () => moveStep(-1));
$('#nextStep').addEventListener('click', () => moveStep(1));

$('#generatePdf').addEventListener('click', () => {
  const answer = state.outputs[state.step];
  if (!answer) return showToast('Run the process before creating a PDF.');
  const step = currentStep();
  const fileName = `${(currentUser?.companyName || 'FounderMotion').replace(/[^a-z0-9]+/gi, '-')}-process-${step.number || state.step + 1}.pdf`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(createPdf([`${currentUser?.companyName || 'Company'} - Process ${step.number || state.step + 1}`, step.title, '', ...answer.split('\n')]));
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

/* =========================================================
   CSV EXPORT
   The "Generate CSV" button existed in the HTML/CSS but had
   no click handler wired up, so clicking it did nothing.
   ========================================================= */

function csvEscapeCell(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function stripMarkdownForCsv(text) {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\r/g, '')
    .trim();
}

// Splits a decision-brief answer into (section title, section body)
// pairs using its "**N. Question**" bold headers, so the CSV has one
// row per question/section instead of one giant blob of text.
function answerToCsvRows(answer) {
  const lines = String(answer || '').split('\n');
  const rows = [];
  let currentTitle = 'Summary';
  let currentBody = [];

  const flush = () => {
    const body = stripMarkdownForCsv(currentBody.join('\n'));
    if (body) rows.push([currentTitle, body]);
    currentBody = [];
  };

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed === '---') return;
    const headerMatch = trimmed.match(/^\*\*(.+?)\*\*\s*$/);
    if (headerMatch) {
      flush();
      currentTitle = headerMatch[1].trim();
    } else {
      currentBody.push(line);
    }
  });
  flush();

  return rows;
}

$('#generateCsv')?.addEventListener('click', () => {
  const answer = state.outputs[state.step];
  if (!answer) return showToast('Run the process before creating a CSV.');
  const step = currentStep();
  const rows = [['Section', 'Content'], ...answerToCsvRows(answer)];
  // Leading BOM so Excel opens the UTF-8 file with correct characters.
  const csvContent = '﻿' + rows.map(row => row.map(csvEscapeCell).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${(currentUser?.companyName || 'FounderMotion').replace(/[^a-z0-9]+/gi, '-')}-process-${step.number || state.step + 1}.csv`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

/* =========================================================
   GENERATED OUTPUT — CENTERED MODAL
   ========================================================= */

function openOutputModal() {
  const output = $('#analysisOutput');
  const modal = $('#outputModal');
  const modalBody = $('#outputModalBody');

  if (!output || !modal || !modalBody || !output.innerHTML.trim()) return;

  modalBody.innerHTML = output.innerHTML;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('output-modal-open');

  requestAnimationFrame(() => {
    $('#outputModalClose').focus();
  });
}

function closeOutputModal() {
  const modal = $('#outputModal');
  if (!modal) return;

  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('output-modal-open');
}

$('#expandOutput').addEventListener('click', openOutputModal);
$('#outputModalClose').addEventListener('click', closeOutputModal);
$('#outputModalBackdrop').addEventListener('click', closeOutputModal);

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if ($('#historyModal')?.classList.contains('open')) {
    closeHistoryModal();
    return;
  }

  if ($('#outputModal')?.classList.contains('open')) {
    closeOutputModal();
  }
});

// Creates a compact, self-contained PDF so it downloads without a third-party browser service.
function createPdf(lines) {
  const wrap = value => String(value).replace(/[^\x20-\x7E\n]/g, ' ').replace(/\*\*(.*?)\*\*/g, '$1').split('\n').flatMap(line => {
    const words = line.trim().split(/\s+/).filter(Boolean); const rows = []; let row = '';
    words.forEach(word => { const next = row ? `${row} ${word}` : word; if (next.length > 88) { if (row) rows.push(row); row = word; } else row = next; });
    if (row) rows.push(row); return rows.length ? rows : [''];
  });
  const allLines = lines.flatMap((value, index) => wrap(value).map(text => ({ text, bold: index < 2 || /^\*\*/.test(String(value)) || /^Recommended decision/i.test(text) })));
  const pages = []; for (let index = 0; index < allLines.length; index += 48) pages.push(allLines.slice(index, index + 48));
  const escapePdf = value => value.replace(/[\\()]/g, '\\$&');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
  const pageIds = [];
  pages.forEach((page, index) => {
    const pageId = 5 + index * 2; const contentId = pageId + 1; pageIds.push(pageId);
    const text = page.map((line, row) => `${row ? '0 -14 Td ' : ''}/${line.bold ? 'F2' : 'F1'} ${line.bold ? 12 : 11} Tf (${escapePdf(line.text)}) Tj`).join('\n');
    const stream = `BT 48 744 Td ${text} ET`;
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const start = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}


/* =========================================================
   FOUNDERMOTION — DASHBOARD EVIDENCE
   ========================================================= */

(() => {
  const EVIDENCE_TYPES = [
    'Interview Note',
    'Objection',
    'Pricing Signal',
    'Proof Point'
  ];

  let dashboardEvidence = [];

  function evidenceEscape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function evidenceStyles() {
    if (document.getElementById('fmDashboardEvidenceStyles')) return;

    const style = document.createElement('style');
    style.id = 'fmDashboardEvidenceStyles';

    style.textContent = `

      /* =====================================================
         DASHBOARD EVIDENCE
         Clean single-card / collapsible layout
         ===================================================== */

      #fmDashboardEvidence {
        width: min(1280px, calc(100% - 72px));
        margin: 22px auto 0;
        box-sizing: border-box;

        border: 1px solid rgba(44, 25, 70, .10);
        border-radius: 18px;

        background: #fff;

        box-shadow:
          0 8px 26px rgba(38, 24, 52, .045);

        overflow: hidden;
      }

      /* ---------------------------------------------
         CLOSED STATE
         --------------------------------------------- */

      #fmDashboardEvidence .fm-evidence-toggle {
        width: 100%;
        min-height: 78px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 20px;

        padding: 18px 22px;

        box-sizing: border-box;

        border: 0;
        background: #fff;

        color: #29222f;

        text-align: left;
        font: inherit;

        cursor: pointer;
      }

      #fmDashboardEvidence .fm-evidence-toggle:hover {
        background: #fcfbfd;
      }

      #fmDashboardEvidence .fm-evidence-toggle-left {
        min-width: 0;

        display: flex;
        flex-direction: column;

        gap: 3px;
      }

      #fmDashboardEvidence .fm-evidence-eyebrow {
        margin: 0;

        color: #8062a6;

        font-size: .68rem;
        font-weight: 750;

        letter-spacing: .11em;
        text-transform: uppercase;
      }

      #fmDashboardEvidence .fm-evidence-toggle-title {
        color: #29222f;

        font-size: 1.12rem;
        font-weight: 700;

        line-height: 1.25;
        letter-spacing: -.02em;
      }

      #fmDashboardEvidence .fm-evidence-toggle-description {
        color: rgba(42,34,47,.55);

        font-size: .76rem;
        line-height: 1.4;
      }

      #fmDashboardEvidence .fm-evidence-toggle-right {
        flex: 0 0 auto;

        display: flex;
        align-items: center;

        gap: 9px;

        color: #4b1d88;

        font-size: .76rem;
        font-weight: 700;
      }

      #fmDashboardEvidence .fm-evidence-toggle-label {
        white-space: nowrap;
      }

      #fmDashboardEvidence .fm-evidence-chevron {
        width: 28px;
        height: 28px;

        display: grid;
        place-items: center;

        border-radius: 50%;

        background: #f2edf7;

        font-size: .9rem;
        line-height: 1;
      }

      /* ---------------------------------------------
         OPEN STATE
         --------------------------------------------- */

      #fmDashboardEvidence.fm-evidence-open
      .fm-evidence-toggle {
        border-bottom: 1px solid rgba(44,25,70,.08);
      }

      #fmDashboardEvidence .fm-evidence-body {
        padding: 20px 22px 22px;

        box-sizing: border-box;

        background: #fff;
      }

      /* ---------------------------------------------
         OPEN HEADER
         --------------------------------------------- */

      #fmDashboardEvidence .fm-evidence-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 18px;

        padding-bottom: 17px;

        border-bottom: 1px solid rgba(44,25,70,.08);
      }

      #fmDashboardEvidence .fm-evidence-header > div {
        min-width: 0;
      }

      /*
       * Hide the duplicated eyebrow because the
       * collapsed header already identifies the section.
       */

      #fmDashboardEvidence
      .fm-evidence-header
      .fm-evidence-eyebrow {
        display: none;
      }

      #fmDashboardEvidence .fm-evidence-header h2 {
        margin: 0 0 5px;

        color: #2d2533;

        font-size: 1rem;
        font-weight: 700;

        line-height: 1.3;
      }

      #fmDashboardEvidence .fm-evidence-description {
        max-width: 680px;

        margin: 0;

        color: rgba(42,34,47,.58);

        font-size: .78rem;
        line-height: 1.5;
      }

      #fmDashboardEvidence .fm-add-evidence {
        flex: 0 0 auto;

        min-height: 38px;

        padding: 0 15px;

        border: 0;
        border-radius: 8px;

        background: #4b1d88;
        color: #fff;

        font: inherit;
        font-size: .76rem;
        font-weight: 700;

        cursor: pointer;
      }

      #fmDashboardEvidence .fm-add-evidence:hover {
        background: #3d1672;
      }

      /* ---------------------------------------------
         EVIDENCE GRID
         --------------------------------------------- */

      #fmDashboardEvidence .fm-evidence-grid {
        display: grid;

        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap: 12px;

        margin-top: 17px;
      }

      #fmDashboardEvidence .fm-evidence-card {
        min-width: 0;

        padding: 16px 17px;

        border: 1px solid rgba(44,25,70,.08);
        border-radius: 12px;

        background: #fbfafc;
      }

      #fmDashboardEvidence .fm-evidence-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 10px;

        margin-bottom: 10px;
      }

      #fmDashboardEvidence .fm-evidence-type {
        display: inline-flex;

        padding: 4px 8px;

        border-radius: 999px;

        background: #eee8f5;
        color: #5b3d82;

        font-size: .61rem;
        font-weight: 800;

        letter-spacing: .045em;
        text-transform: uppercase;
      }

      #fmDashboardEvidence .fm-evidence-type.objection {
        background: #f5eee8;
        color: #85552d;
      }

      #fmDashboardEvidence .fm-evidence-type.pricing-signal {
        background: #eeeaf8;
        color: #674c91;
      }

      #fmDashboardEvidence .fm-evidence-type.proof-point {
        background: #eaf2ee;
        color: #416c55;
      }

      #fmDashboardEvidence .fm-evidence-card h3 {
        margin: 0 0 6px;

        color: #2d2533;

        font-size: .88rem;
        line-height: 1.35;
      }

      #fmDashboardEvidence .fm-evidence-content {
        margin: 0;

        color: rgba(42,34,47,.68);

        font-size: .76rem;
        line-height: 1.55;
      }

      #fmDashboardEvidence .fm-evidence-source {
        margin: 11px 0 0;

        padding-top: 9px;

        border-top: 1px solid rgba(44,25,70,.07);

        color: rgba(42,34,47,.45);

        font-size: .66rem;
      }

      #fmDashboardEvidence .fm-evidence-delete {
        border: 0;
        background: transparent;

        color: rgba(42,34,47,.42);

        cursor: pointer;

        font: inherit;
        font-size: .7rem;
      }

      #fmDashboardEvidence .fm-evidence-empty {
        grid-column: 1 / -1;

        padding: 22px;

        border: 1px dashed rgba(44,25,70,.14);
        border-radius: 11px;

        background: #fcfbfd;

        color: rgba(42,34,47,.52);

        text-align: center;

        font-size: .78rem;
      }

      /* ---------------------------------------------
         MOBILE
         --------------------------------------------- */

      @media (max-width: 760px) {

        #fmDashboardEvidence {
          width: calc(100% - 28px);
        }

        #fmDashboardEvidence .fm-evidence-toggle {
          min-height: 72px;
          padding: 16px 18px;
        }

        #fmDashboardEvidence .fm-evidence-toggle-description {
          display: none;
        }

        #fmDashboardEvidence .fm-evidence-body {
          padding: 18px;
        }

        #fmDashboardEvidence .fm-evidence-header {
          align-items: flex-start;
          flex-direction: column;
        }

        #fmDashboardEvidence .fm-add-evidence {
          width: 100%;
        }

        #fmDashboardEvidence .fm-evidence-grid {
          grid-template-columns: 1fr;
        }
      }

    `;

    document.head.appendChild(style);
  }

  function createEvidenceSection() {
    if (!currentUser) return null;

    const existing = document.getElementById('fmDashboardEvidence');

    if (existing) return existing;

    const anchor = document.querySelector('.site-header');

    if (!anchor) {
      console.warn('Evidence: anchor element not found.');
      return null;
    }

    const section = document.createElement('section');

    section.id = 'fmDashboardEvidence';

    section.innerHTML = `
      <button
        class="fm-evidence-toggle"
        id="fmEvidenceToggle"
        type="button"
        aria-expanded="false"
        aria-controls="fmEvidenceBody"
      >
        <span class="fm-evidence-toggle-left">
          <span class="fm-evidence-eyebrow">Evidence</span>

          <span class="fm-evidence-toggle-title">
            Customer & market evidence
          </span>

          <span class="fm-evidence-toggle-description">
            Customer and market evidence supporting strategic decisions
          </span>
        </span>

        <span class="fm-evidence-toggle-right">
          <span class="fm-evidence-toggle-label">
            View evidence
          </span>

          <span class="fm-evidence-chevron">↓</span>
        </span>
      </button>

      <div
        class="fm-evidence-body"
        id="fmEvidenceBody"
        hidden
      >
        <div class="fm-evidence-header">
          <div>
            <p class="fm-evidence-eyebrow">Evidence</p>

            <h2>Customer & market evidence</h2>

            <p class="fm-evidence-description">
              Evidence captured from customers and market research that supports
              the strategic decisions in this workspace.
            </p>
          </div>

          <button
            class="fm-add-evidence"
            id="fmAddDashboardEvidence"
            type="button"
          >
            + Add evidence
          </button>
        </div>

        <div
          class="fm-evidence-grid"
          id="fmDashboardEvidenceGrid"
        >
          <div class="fm-evidence-empty">
            Loading evidence...
          </div>
        </div>
      </div>
    `;

    anchor.insertAdjacentElement('afterend', section);

    const toggle = section.querySelector('#fmEvidenceToggle');
    const body = section.querySelector('#fmEvidenceBody');
    const label = section.querySelector('.fm-evidence-toggle-label');
    const chevron = section.querySelector('.fm-evidence-chevron');

    toggle.addEventListener('click', () => {
      const open = section.classList.toggle('fm-evidence-open');

      toggle.setAttribute('aria-expanded', String(open));
      body.hidden = !open;

      label.textContent = open
        ? 'Hide evidence'
        : 'View evidence';

      chevron.textContent = open
        ? '↑'
        : '↓';
    });

    section
      .querySelector('#fmAddDashboardEvidence')
      .addEventListener('click', openEvidenceModal);

    return section;
  }


  async function loadDashboardEvidence() {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/evidence', {
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Evidence could not be loaded.');
      }

      const data = await response.json();

      dashboardEvidence = Array.isArray(data.evidence)
        ? data.evidence
        : [];

      renderDashboardEvidence();

    } catch (error) {
      console.error(error);

      const grid =
        document.getElementById('fmDashboardEvidenceGrid');

      if (grid) {
        grid.innerHTML = `
          <div class="fm-evidence-empty">
            Evidence could not be loaded.
          </div>
        `;
      }
    }
  }

  function renderDashboardEvidence() {
    const grid =
      document.getElementById('fmDashboardEvidenceGrid');

    if (!grid) return;

    if (!dashboardEvidence.length) {
      grid.innerHTML = `
        <div class="fm-evidence-empty">
          No evidence has been added to this workspace yet.
        </div>
      `;
      return;
    }

    grid.innerHTML = dashboardEvidence.map(item => {
      const typeClass = String(item.type || '')
        .toLowerCase()
        .replace(/\s+/g, '-');

      return `
        <article class="fm-evidence-card">

          <div class="fm-evidence-card-top">

            <span class="fm-evidence-type ${typeClass}">
              ${evidenceEscape(item.type)}
            </span>

            <button
              class="fm-evidence-delete"
              type="button"
              data-delete-evidence="${evidenceEscape(item.id)}"
            >
              Delete
            </button>

          </div>

          <h3>
            ${evidenceEscape(item.title)}
          </h3>

          <p class="fm-evidence-content">
            ${evidenceEscape(item.content)}
          </p>

          ${
            item.source
              ? `
                <p class="fm-evidence-source">
                  Source: ${evidenceEscape(item.source)}
                </p>
              `
              : ''
          }

        </article>
      `;
    }).join('');

    grid
      .querySelectorAll('[data-delete-evidence]')
      .forEach(button => {
        button.addEventListener('click', async () => {

          const id = button.dataset.deleteEvidence;

          if (!confirm('Delete this evidence item?')) {
            return;
          }

          const response = await fetch(
            `/api/evidence/${id}/delete`,
            {
              method: 'POST',
              credentials: 'same-origin'
            }
          );

          if (!response.ok) {
            alert('Unable to delete evidence.');
            return;
          }

          await loadDashboardEvidence();
        });
      });
  }

  function createEvidenceModal() {
    if (document.getElementById('fmEvidenceModal')) return;

    const modal = document.createElement('dialog');

    modal.id = 'fmEvidenceModal';

    modal.style.cssText = `
      width: min(620px, calc(100% - 40px));
      border: 0;
      border-radius: 18px;
      padding: 0;
      box-shadow: 0 30px 90px rgba(25,17,34,.25);
    `;

    modal.innerHTML = `
      <form
        method="dialog"
        id="fmEvidenceForm"
        style="
          padding:30px;
          font-family:inherit;
        "
      >

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:20px;
          margin-bottom:22px;
        ">

          <div>
            <p class="fm-evidence-eyebrow">
              NEW EVIDENCE
            </p>

            <h2 style="
              margin:0;
              color:#29222f;
            ">
              Add evidence
            </h2>
          </div>

          <button
            type="button"
            id="fmCloseEvidence"
            style="
              border:0;
              width:34px;
              height:34px;
              border-radius:50%;
              background:#f2edf6;
              font-size:20px;
              cursor:pointer;
            "
          >
            ×
          </button>

        </div>

        <label style="
          display:grid;
          gap:7px;
          margin-bottom:16px;
          font-size:.84rem;
          font-weight:700;
        ">
          Evidence type

          <select
            id="fmEvidenceType"
            required
            style="
              padding:11px;
              border:1px solid #ddd5e5;
              border-radius:8px;
              font:inherit;
            "
          >
            <option value="">Select evidence type</option>
            ${EVIDENCE_TYPES.map(type =>
              `<option value="${type}">${type}</option>`
            ).join('')}
          </select>
        </label>

        <label style="
          display:grid;
          gap:7px;
          margin-bottom:16px;
          font-size:.84rem;
          font-weight:700;
        ">
          Title

          <input
            id="fmEvidenceTitle"
            required
            maxlength="200"
            placeholder="e.g. Strong buying trigger"
            style="
              padding:11px;
              border:1px solid #ddd5e5;
              border-radius:8px;
              font:inherit;
            "
          >
        </label>

        <label style="
          display:grid;
          gap:7px;
          margin-bottom:16px;
          font-size:.84rem;
          font-weight:700;
        ">
          Source

          <input
            id="fmEvidenceSource"
            placeholder="e.g. Customer interview"
            style="
              padding:11px;
              border:1px solid #ddd5e5;
              border-radius:8px;
              font:inherit;
            "
          >
        </label>

        <label style="
          display:grid;
          gap:7px;
          margin-bottom:22px;
          font-size:.84rem;
          font-weight:700;
        ">
          Evidence

          <textarea
            id="fmEvidenceContent"
            required
            placeholder="Enter the customer quote, observation, pricing signal or proof point..."
            style="
              min-height:130px;
              resize:vertical;
              padding:11px;
              border:1px solid #ddd5e5;
              border-radius:8px;
              font:inherit;
            "
          ></textarea>
        </label>

        <div style="
          display:flex;
          justify-content:flex-end;
          gap:10px;
        ">

          <button
            type="button"
            id="fmCancelEvidence"
            style="
              padding:10px 16px;
              border:1px solid #ddd5e5;
              border-radius:8px;
              background:#fff;
              font-weight:700;
              cursor:pointer;
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            style="
              padding:10px 17px;
              border:0;
              border-radius:8px;
              background:#4b1d88;
              color:#fff;
              font-weight:700;
              cursor:pointer;
            "
          >
            Add evidence
          </button>

        </div>

      </form>
    `;

    document.body.appendChild(modal);

    document
      .getElementById('fmCloseEvidence')
      .addEventListener('click', () => modal.close());

    document
      .getElementById('fmCancelEvidence')
      .addEventListener('click', () => modal.close());

    document
      .getElementById('fmEvidenceForm')
      .addEventListener('submit', saveDashboardEvidence);
  }

  function openEvidenceModal() {
    createEvidenceModal();

    const modal =
      document.getElementById('fmEvidenceModal');

    if (modal) modal.showModal();
  }

  async function saveDashboardEvidence(event) {
    event.preventDefault();

    const type =
      document.getElementById('fmEvidenceType').value;

    const title =
      document.getElementById('fmEvidenceTitle').value.trim();

    const source =
      document.getElementById('fmEvidenceSource').value.trim();

    const content =
      document.getElementById('fmEvidenceContent').value.trim();

    if (!type || !title || !content) {
      alert('Please complete the evidence type, title and evidence.');
      return;
    }

    const response = await fetch('/api/evidence', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        title,
        source,
        content
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));

      alert(
        data.error ||
        'Unable to save evidence.'
      );

      return;
    }

    document.getElementById('fmEvidenceForm').reset();

    document
      .getElementById('fmEvidenceModal')
      .close();

    await loadDashboardEvidence();
  }

  function initialiseDashboardEvidence() {
    if (!currentUser) return;

    evidenceStyles();
    createEvidenceSection();
    createEvidenceModal();
    loadDashboardEvidence();
  }

  /*
   * Existing login/session code remains untouched.
   * We simply initialise Evidence once the user exists.
   */
  function waitForDashboardUser() {
    if (currentUser) {
      initialiseDashboardEvidence();
      return;
    }

    setTimeout(waitForDashboardUser, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      waitForDashboardUser
    );
  } else {
    waitForDashboardUser();
  }
})();


function companyText(text) { return String(text).replace(/foundermotion/gi, currentUser?.companyName || 'FounderMotion'); }
function archiveCurrentOutput() {
  const answer = state.outputs?.[state.step];

  if (!answer) return;

  if (!Array.isArray(state.history)) state.history = [];

  const processIndex = state.step;

  state.history.unshift({
    title: currentStep().title,
    processIndex,
    processNumber: currentStep().number || processIndex + 1,
    answer,
    createdAt: new Date().toISOString()
  });

  // Keep maximum 3 history records for THIS process.
  const sameProcessHistory = state.history
    .filter(item => {
      const itemProcess =
        Number.isInteger(item.processIndex)
          ? item.processIndex
          : Number(item.processNumber || 1) - 1;

      return itemProcess === processIndex;
    });

  if (sameProcessHistory.length > 3) {
    const recordsToRemove = sameProcessHistory.slice(3);

    state.history = state.history.filter(item =>
      !recordsToRemove.includes(item)
    );
  }
}

function invalidateProcessOneOutputs() {
  if (state.step === 0 && state.outputs?.[0]) {
    archiveCurrentOutput();

    // Only clear Process 1.
    // Keep all completed outputs from other processes.
    state.outputs[0] = null;

    render();
    saveProgress(false);

    showToast('Previous generated output was saved to Previous history. Add new information to generate a fresh result.');
  }
}
function formatAnswer(answer) {
  const tables = [];
  const escaped = escapeHtml(answer).replace(/^\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/gm, (_, header, rows) => {
    const cells = line => line.split('|').slice(1, -1).map(cell => `<td>${cell.trim()}</td>`).join('');
    const headerCells = header.split('|').map(cell => `<th>${cell.trim()}</th>`).join('');
    const table = `<div class="answer-table-wrap"><table class="answer-table"><thead><tr>${headerCells}</tr></thead><tbody>${rows.trim().split('\n').map(row => `<tr>${cells(row)}</tr>`).join('')}</tbody></table></div>`;
    tables.push(table); return `@@TABLE${tables.length - 1}@@`;
  });
  return escaped
    .replace(/^\*\*(.+?)\*\*$/gm, '<h3 class="answer-question">$1</h3>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h3 class="answer-section">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/@@TABLE(\d+)@@/g, (_, index) => tables[Number(index)])
    .replace(/\n/g, '<br>');
}
function escapeHtml(value) { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 3500); }

syncAuthScreenUI();
restoreAccount();

setTimeout(() => {
  updateProcessNavigation();
}, 0);


/* FOUNDERMOTION_DASHBOARD_POLISH_V2 */

const founderMotionDashboardPolish = document.createElement('style');
founderMotionDashboardPolish.id = 'founderMotionDashboardPolish';
founderMotionDashboardPolish.textContent = `

/* =========================================================
   COLLAPSIBLE DASHBOARD EVIDENCE
   ========================================================= */

#fmDashboardEvidence {
  width: min(1370px, calc(100% - 96px));
  max-width: 1370px;
  margin: 24px auto 0;
  box-sizing: border-box;

  border: 1px solid rgba(44, 25, 70, .10);
  border-radius: 20px;
  background: #fff;

  box-shadow:
    0 10px 32px rgba(38, 24, 52, .045);

  overflow: hidden;
}

/* ---------- collapsed header ---------- */

#fmDashboardEvidence .fm-evidence-toggle {
  width: 100%;
  min-height: 82px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 20px 28px;

  border: 0;
  background: #fff;

  color: #29222f;
  text-align: left;

  cursor: pointer;

  box-sizing: border-box;
}

#fmDashboardEvidence .fm-evidence-toggle:hover {
  background: #fcfbfd;
}

#fmDashboardEvidence .fm-evidence-toggle-left {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

#fmDashboardEvidence .fm-evidence-eyebrow {
  margin: 0;

  color: #8062a6;

  font-size: 10px;
  font-weight: 750;
  letter-spacing: .12em;
  text-transform: uppercase;
}

#fmDashboardEvidence .fm-evidence-toggle-title {
  color: #29222f;

  font-size: 21px;
  font-weight: 750;
  line-height: 1.15;

  letter-spacing: -.025em;
}

#fmDashboardEvidence .fm-evidence-toggle-description {
  color: #817987;

  font-size: 12px;
  line-height: 1.4;
}

#fmDashboardEvidence .fm-evidence-toggle-right {
  flex: 0 0 auto;

  display: flex;
  align-items: center;
  gap: 10px;

  color: #421580;

  font-size: 12px;
  font-weight: 700;
}

#fmDashboardEvidence .fm-evidence-chevron {
  width: 28px;
  height: 28px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #f2ecf7;

  font-size: 14px;
}

/* ---------- opened state ---------- */

#fmDashboardEvidence.fm-evidence-open .fm-evidence-toggle {
  min-height: 76px;

  padding-bottom: 16px;

  border-bottom: 1px solid rgba(44, 25, 70, .08);
}

#fmDashboardEvidence.fm-evidence-open .fm-evidence-toggle-title {
  font-size: 20px;
}

#fmDashboardEvidence .fm-evidence-body {
  padding: 0 28px 28px;
  background: #fff;
}

/* ---------- header inside opened section ---------- */

#fmDashboardEvidence .fm-evidence-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding: 20px 0 18px;

  border-bottom: 1px solid rgba(44, 25, 70, .08);
}

#fmDashboardEvidence .fm-evidence-header > div {
  min-width: 0;
}

#fmDashboardEvidence .fm-evidence-header .fm-evidence-eyebrow {
  display: none;
}

#fmDashboardEvidence .fm-evidence-header h2 {
  margin: 0 0 5px;

  color: #29222f;

  font-size: 18px;
  font-weight: 750;
  line-height: 1.2;

  letter-spacing: -.025em;
}

#fmDashboardEvidence .fm-evidence-description {
  max-width: 760px;

  margin: 0;

  color: #817987;

  font-size: 12px;
  line-height: 1.45;
}

#fmDashboardEvidence .fm-add-evidence {
  flex: 0 0 auto;

  min-height: 40px;

  padding: 0 16px;

  border: 0;
  border-radius: 9px;

  background: #421580;
  color: #fff;

  font: inherit;
  font-size: 12px;
  font-weight: 700;

  cursor: pointer;
}

#fmDashboardEvidence .fm-add-evidence:hover {
  background: #35106a;
}

/* ---------- evidence cards ---------- */

#fmDashboardEvidence .fm-evidence-grid {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 14px;

  margin-top: 18px;
}

#fmDashboardEvidence .fm-evidence-card {
  min-width: 0;

  padding: 18px;

  border: 1px solid rgba(44, 25, 70, .09);
  border-radius: 14px;

  background: #fbfafc;

  box-sizing: border-box;
}

#fmDashboardEvidence .fm-evidence-card-top {
  margin-bottom: 10px;
}

#fmDashboardEvidence .fm-evidence-card h3 {
  margin: 0 0 7px;

  color: #302937;

  font-size: 14px;
  line-height: 1.35;

  letter-spacing: -.01em;
}

#fmDashboardEvidence .fm-evidence-card p {
  margin: 0;

  color: #706875;

  font-size: 12px;
  line-height: 1.55;
}

#fmDashboardEvidence .fm-evidence-empty {
  padding: 22px;

  border: 1px dashed rgba(44, 25, 70, .12);
  border-radius: 12px;

  color: #8a828e;

  font-size: 12px;
  text-align: center;
}

/* ---------- mobile ---------- */

@media (max-width: 800px) {

  #fmDashboardEvidence {
    width: calc(100% - 32px);
  }

  #fmDashboardEvidence .fm-evidence-toggle {
    min-height: 74px;
    padding: 16px 18px;
  }

  #fmDashboardEvidence .fm-evidence-toggle-description {
    display: none;
  }

  #fmDashboardEvidence .fm-evidence-toggle-right {
    font-size: 0;
  }

  #fmDashboardEvidence .fm-evidence-body {
    padding: 18px;
  }

  #fmDashboardEvidence .fm-evidence-header {
    align-items: flex-start;
    flex-direction: column;
  }

  #fmDashboardEvidence .fm-add-evidence {
    width: 100%;
  }
}


/* =========================================================
   GLOBAL DASHBOARD
   ========================================================= */

html {
  background: #fbfafc;
}

body {
  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #fbfafc 42%,
      #faf9fc 100%
    );
}

.site-header {
  min-height: 108px;
  padding: 0 7%;
  box-sizing: border-box;
}

.site-header .brand {
  font-size: clamp(34px, 3vw, 48px);
  letter-spacing: -.045em;
}

.site-header .header-note {
  font-size: 13px;
}

.site-header .header-auth {
  gap: 18px;
}


/* =========================================================
   COMMON DASHBOARD WIDTH
   ========================================================= */

.segments-panel,
.fm-evidence-section,
.map-workspace,
.map-navigation {
  width: min(1370px, calc(100% - 96px));
  max-width: 1370px;
  box-sizing: border-box;
}


/* =========================================================
   MARKET SEGMENTS
   ========================================================= */

.segments-panel {
  margin: 32px auto 0;
  padding: 28px 30px 30px;

  border: 1px solid rgba(44, 25, 70, .10);
  border-radius: 20px;

  background: rgba(255, 255, 255, .96);

  box-shadow:
    0 12px 35px rgba(38, 24, 52, .045);
}

.segments-header {
  align-items: flex-start;
  padding-bottom: 22px;
  border-bottom: 1px solid rgba(44, 25, 70, .09);
}

.segments-header .eyebrow {
  margin-bottom: 8px;
}

.segments-header h2 {
  margin: 0 0 7px;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -.035em;
  color: #29222f;
}

.segments-subtitle {
  font-size: 14px;
  line-height: 1.5;
  color: #756e7b;
  opacity: 1;
}

.add-segment-button {
  min-height: 42px;
  padding: 0 17px;

  border: 0;
  border-radius: 9px;

  background: #421580;
  color: #fff;

  font-size: 13px;
  font-weight: 700;
}

.add-segment-button:hover {
  background: #35106a;
}

.segments-list {
  gap: 16px;
  margin-top: 20px;
}

.segment-card {
  padding: 22px 22px 20px;

  border: 1px solid rgba(44, 25, 70, .09);
  border-radius: 14px;

  background: #fbfafc;
}

.segment-number {
  margin-bottom: 7px;
  color: #7d5ba7;
  font-size: 10px;
  font-weight: 700;
}

.segment-card h3 {
  margin-bottom: 8px;
  font-size: 17px;
  line-height: 1.3;
}

.segment-description {
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.55;
  color: #756e7b;
  opacity: 1;
}

.segment-meta {
  gap: 7px;
}

.segment-meta span {
  padding: 6px 10px;
  background: #eee8f5;
  color: #5c3b81;
  font-size: 11px;
  font-weight: 650;
}

.segments-empty {
  padding: 16px 18px;
  font-size: 13px;
  color: #817a87;
  opacity: 1;
}


/* =========================================================
   EVIDENCE
   ========================================================= */

.fm-evidence-section {
  margin: 28px auto 0 !important;
  padding: 30px !important;

  border: 1px solid rgba(44, 25, 70, .10) !important;
  border-radius: 20px !important;

  background: #fff !important;

  box-shadow:
    0 12px 35px rgba(38, 24, 52, .045) !important;
}

.fm-evidence-header {
  align-items: flex-start !important;
  padding-bottom: 22px !important;
  border-bottom: 1px solid rgba(44, 25, 70, .09) !important;
}

.fm-evidence-eyebrow {
  margin-bottom: 8px !important;
}

.fm-evidence-title {
  margin: 0 0 8px !important;
  font-size: 28px !important;
  line-height: 1.15 !important;
  letter-spacing: -.035em !important;
  color: #29222f !important;
}

.fm-evidence-subtitle {
  max-width: 760px;
  margin: 0 !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  color: #756e7b !important;
}

.fm-add-evidence {
  min-height: 42px !important;
  padding: 0 17px !important;

  border-radius: 9px !important;

  background: #421580 !important;
  color: #fff !important;

  font-size: 13px !important;
  font-weight: 700 !important;
}

.fm-evidence-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 16px !important;
  margin-top: 20px !important;
}

.fm-evidence-card {
  min-width: 0 !important;
  padding: 22px !important;

  border: 1px solid rgba(44, 25, 70, .09) !important;
  border-radius: 14px !important;

  background: #fbfafc !important;
}

.fm-evidence-card h3,
.fm-evidence-card-title {
  font-size: 16px !important;
  line-height: 1.35 !important;
}

.fm-evidence-card p {
  font-size: 13px !important;
  line-height: 1.55 !important;
}

.fm-evidence-empty {
  padding: 18px !important;
  border-radius: 12px !important;
  font-size: 13px !important;
}


/* =========================================================
   PROCESS MAP
   ========================================================= */

.map-workspace {
  margin: 58px auto 0 !important;
  padding-bottom: 20px;
}

.map-intro {
  margin-bottom: 28px;
}

.map-intro .eyebrow {
  margin-bottom: 10px;
}

.map-intro h1 {
  margin: 0 0 12px;
  font-size: clamp(46px, 5vw, 68px);
  line-height: .98;
  letter-spacing: -.055em;
}

.map-intro .lede {
  max-width: 780px;
  font-size: 16px;
  line-height: 1.6;
  color: #756e7b;
}


/* =========================================================
   PROCESS PROGRESS
   ========================================================= */

.map-progress {
  padding: 20px 24px;
  margin-bottom: 20px;

  border: 1px solid rgba(44, 25, 70, .09);
  border-radius: 16px;

  background: #fff;

  box-shadow:
    0 8px 25px rgba(38, 24, 52, .035);
}

.progress-label {
  margin-bottom: 14px;
}

.progress-dots {
  gap: 8px;
}


/* =========================================================
   MAIN PROCESS CARDS
   ========================================================= */

.map-layout {
  display: grid !important;
  grid-template-columns: minmax(0, 1.35fr) minmax(340px, .75fr) !important;
  gap: 20px !important;
  align-items: stretch !important;
}

.map-card,
.output-panel {
  min-width: 0;

  border: 1px solid rgba(44, 25, 70, .10) !important;
  border-radius: 20px !important;

  background: #fff !important;

  box-shadow:
    0 12px 35px rgba(38, 24, 52, .045) !important;
}

.map-card {
  padding: 32px !important;
}

.output-panel {
  padding: 32px !important;
}

.map-card h2,
.output-panel h2 {
  margin-top: 0;
  font-size: 30px;
  line-height: 1.12;
  letter-spacing: -.035em;
}

.map-card .purpose {
  margin-top: 12px;
  color: #756e7b;
  font-size: 14px;
  line-height: 1.6;
}

.map-section {
  margin-top: 28px !important;
  padding-top: 24px !important;
  border-top: 1px solid rgba(44, 25, 70, .09);
}

.map-section h3 {
  margin-bottom: 14px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #76539b;
}

.input-list,
.question-list {
  gap: 9px;
}

.analyse-button {
  width: 100%;
  min-height: 48px;
  margin-top: 28px;

  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}

.output-panel h2 {
  margin-bottom: 18px;
}

.output-empty {
  padding: 18px !important;
  border-radius: 12px !important;

  background: #fbfafc !important;
  color: #817a87 !important;

  font-size: 13px !important;
  line-height: 1.55 !important;
}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

.map-navigation {
  margin: 20px auto 60px !important;
  padding: 0 !important;
}

.map-navigation button {
  min-height: 46px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}


/* =========================================================
   GLOBAL BUTTON POLISH
   ========================================================= */

button {
  transition:
    transform .15s ease,
    box-shadow .15s ease,
    background .15s ease,
    border-color .15s ease;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
}


/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 1100px) {
  .site-header {
    padding: 0 32px;
  }

  .segments-panel,
  .fm-evidence-section,
  .map-workspace,
  .map-navigation {
    width: min(100% - 48px, 1370px);
  }

  .map-layout {
    grid-template-columns: 1fr !important;
  }

  .output-panel {
    min-height: auto;
  }
}

@media (max-width: 760px) {
  .site-header {
    min-height: 90px;
    padding: 18px 20px;
    flex-wrap: wrap;
  }

  .site-header .brand {
    font-size: 32px;
  }

  .site-header .header-note {
    display: none;
  }

  .segments-panel,
  .fm-evidence-section,
  .map-workspace,
  .map-navigation {
    width: calc(100% - 28px);
  }

  .segments-panel,
  .fm-evidence-section {
    padding: 22px !important;
    border-radius: 16px !important;
  }

  .segments-header,
  .fm-evidence-header {
    gap: 16px;
    flex-direction: column;
  }

  .add-segment-button,
  .fm-add-evidence {
    width: 100%;
  }

  .segments-list,
  .fm-evidence-grid {
    grid-template-columns: 1fr !important;
  }

  .map-workspace {
    margin-top: 38px !important;
  }

  .map-intro h1 {
    font-size: 46px;
  }

  .map-card,
  .output-panel {
    padding: 24px !important;
    border-radius: 16px !important;
  }
}

`;

document.head.appendChild(founderMotionDashboardPolish);


/* FOUNDERMOTION_DASHBOARD_DENSITY_V3 */

const founderMotionDashboardDensity = document.createElement('style');
founderMotionDashboardDensity.id = 'founderMotionDashboardDensity';
founderMotionDashboardDensity.textContent = `

/* Main content — closer to My Workspace density */

.segments-panel,
.fm-evidence-section,
.map-workspace,
.map-navigation {
  width: min(1280px, calc(100% - 72px));
  max-width: 1280px;
}


/* Market Segments */

.segments-panel {
  margin-top: 24px;
  padding: 24px 26px 26px;
  border-radius: 18px;
}

.segments-header {
  padding-bottom: 18px;
}

.segments-header h2 {
  font-size: 25px;
  margin-bottom: 5px;
}

.segments-subtitle {
  font-size: 13px;
}

.segments-list {
  margin-top: 16px;
  gap: 14px;
}

.segment-card {
  padding: 18px 20px;
  border-radius: 13px;
}

.segment-card h3 {
  font-size: 16px;
}

.segment-description {
  font-size: 12.5px;
  margin-bottom: 11px;
}


/* Evidence */

.fm-evidence-section {
  margin-top: 20px !important;
  padding: 24px 26px !important;
  border-radius: 18px !important;
}

.fm-evidence-header {
  padding-bottom: 18px !important;
}

.fm-evidence-title {
  font-size: 25px !important;
  margin-bottom: 5px !important;
}

.fm-evidence-subtitle {
  font-size: 13px !important;
}

.fm-evidence-grid {
  gap: 14px !important;
  margin-top: 16px !important;
}

.fm-evidence-card {
  padding: 18px 20px !important;
  border-radius: 13px !important;
}

.fm-evidence-card h3,
.fm-evidence-card-title {
  font-size: 15px !important;
}

.fm-evidence-card p {
  font-size: 12.5px !important;
  line-height: 1.5 !important;
}


/* Process Map */

.map-workspace {
  margin-top: 38px !important;
}

.map-intro {
  margin-bottom: 20px;
}

.map-intro h1 {
  font-size: clamp(42px, 4.5vw, 58px);
  margin-bottom: 9px;
}

.map-intro .lede {
  font-size: 14px;
  line-height: 1.5;
}

.map-progress {
  padding: 17px 20px;
  margin-bottom: 16px;
  border-radius: 14px;
}


/* Process cards */

.map-layout {
  gap: 16px !important;
}

.map-card,
.output-panel {
  border-radius: 17px !important;
}

.map-card {
  padding: 25px !important;
}

.output-panel {
  padding: 25px !important;
}

.map-card h2,
.output-panel h2 {
  font-size: 26px;
}

.map-card .purpose {
  font-size: 13px;
}

.map-section {
  margin-top: 21px !important;
  padding-top: 19px !important;
}

.map-section h3 {
  margin-bottom: 11px;
}

.input-list,
.question-list {
  gap: 7px;
}

.analyse-button {
  min-height: 44px;
  margin-top: 22px;
}


/* Bottom navigation */

.map-navigation {
  margin-top: 14px !important;
  margin-bottom: 38px !important;
}


/* Header slightly tighter */

.site-header {
  min-height: 100px;
}


/* Tablet */

@media (max-width: 1100px) {
  .segments-panel,
  .fm-evidence-section,
  .map-workspace,
  .map-navigation {
    width: calc(100% - 48px);
  }
}


/* Mobile */

@media (max-width: 760px) {
  .segments-panel,
  .fm-evidence-section,
  .map-workspace,
  .map-navigation {
    width: calc(100% - 28px);
  }

  .segments-panel,
  .fm-evidence-section {
    padding: 20px !important;
  }

  .map-card,
  .output-panel {
    padding: 21px !important;
  }
}

`;

document.head.appendChild(founderMotionDashboardDensity);

/* =========================================================
   FOUNDERMOTION — CLEAN DASHBOARD LAYOUT
   ========================================================= */

(function cleanDashboardLayout() {

  function arrangeDashboard() {
    const map = document.querySelector('.map-workspace');
    const navigation = document.querySelector('.map-navigation');
    const segments = document.getElementById('segmentsPanel');
    const evidence = document.getElementById('fmDashboardEvidence');

    if (!map) return;

    /*
     * 1. Keep Next process directly underneath the Process Map.
     *    It belongs visually to the Process Map.
     */
    if (navigation && navigation.parentElement !== map) {
      map.appendChild(navigation);
    }

    /*
     * 2. Put Market Segments + Evidence into ONE dedicated row.
     *
     * IMPORTANT:
     * This row is only for these two supporting panels.
     * Nothing else on the dashboard is moved.
     */
    /* Segment/Evidence placement handled by dashboard grid. */

    /*
     * 4. Make the navigation visually belong to the Process Map.
     */
    if (navigation) {
      navigation.classList.add('fm-clean-next-process');
    }
  }

  function addStyles() {

    if (document.getElementById('fmCleanDashboardStyles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'fmCleanDashboardStyles';

    style.textContent = `

      /* =====================================================
         PROCESS MAP
         ===================================================== */

      .map-workspace {
        margin-bottom: 0 !important;
      }

      /*
       * Next process sits inside the Process Map,
       * immediately below the process content.
       */

      .map-navigation.fm-clean-next-process {
        width: 100%;
        max-width: none;
        margin: 18px 0 0 !important;
        padding: 0 !important;

        display: flex;
        justify-content: flex-end;
        align-items: center;

        box-sizing: border-box;
      }

      .map-navigation.fm-clean-next-process button {
        min-width: 165px;
        min-height: 44px;
        margin: 0 !important;

        border-radius: 10px;
      }


      /* =====================================================
         MARKET SEGMENTS
         ===================================================== */

      #segmentsPanel {
        width: min(1280px, calc(100% - 72px));
        max-width: 1280px;

        margin: 34px auto 0 !important;
        box-sizing: border-box;
      }


      /* =====================================================
         CUSTOMER & MARKET EVIDENCE
         ===================================================== */

      #fmDashboardEvidence {
        width: min(1280px, calc(100% - 72px));
        max-width: 1280px;

        margin: 20px auto 50px !important;
        box-sizing: border-box;
      }


      /* =====================================================
         CONSISTENT VERTICAL RHYTHM
         ===================================================== */

      .map-workspace + #segmentsPanel {
        margin-top: 34px !important;
      }

      #segmentsPanel + #fmDashboardEvidence {
        margin-top: 20px !important;
      }


      /* =====================================================
         RESPONSIVE
         ===================================================== */

      @media (max-width: 1100px) {

        #segmentsPanel,
        #fmDashboardEvidence {
          width: calc(100% - 48px);
        }

      }


      @media (max-width: 760px) {

        #segmentsPanel,
        #fmDashboardEvidence {
          width: calc(100% - 28px);
        }

        .map-navigation.fm-clean-next-process {
          justify-content: stretch;
        }

        .map-navigation.fm-clean-next-process button {
          width: 100%;
        }

      }

    `;

    document.head.appendChild(style);
  }


  function run() {

    addStyles();
    arrangeDashboard();

    /*
     * Evidence is created after login, so observe the dashboard
     * instead of using multiple competing timers.
     */

    const observer = new MutationObserver(() => {
      arrangeDashboard();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    /*
     * Run once more after the current render cycle.
     */
    requestAnimationFrame(arrangeDashboard);
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();


/* =========================================================
   FOUNDERMOTION_FINAL_UI_SYSTEM
   One visual system for the whole dashboard
   ========================================================= */

(function () {

  function addFinalDashboardStyles() {

    if (document.getElementById('fmFinalDashboardStyles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'fmFinalDashboardStyles';

    style.textContent = `

      /* =====================================================
         1. GLOBAL DASHBOARD GRID
         ===================================================== */

      .map-workspace,
      #segmentsPanel,
      #fmDashboardEvidence {

        width: min(1280px, calc(100% - 72px));
        max-width: 1280px;
        box-sizing: border-box;

      }


      /* =====================================================
         2. PROCESS INTRO
         ===================================================== */

      .map-intro {

        margin-bottom: 20px !important;

      }

      .map-intro h1 {

        font-size: clamp(42px, 4.5vw, 58px) !important;
        line-height: 1 !important;
        letter-spacing: -.045em !important;
        margin-bottom: 10px !important;

      }

      .map-intro .lede {

        max-width: 720px;
        font-size: 14px !important;
        line-height: 1.55 !important;

      }


      /* =====================================================
         3. PROCESS PROGRESS
         ===================================================== */

      .map-progress {

        margin-bottom: 18px !important;
        padding: 16px 20px !important;
        border-radius: 14px !important;

      }


      /* =====================================================
         4. MAIN TWO-COLUMN PROCESS AREA
         ===================================================== */

      .map-layout {

        display: grid !important;

        grid-template-columns:
          minmax(0, 1.08fr)
          minmax(360px, .92fr) !important;

        align-items: start !important;

        gap: 18px !important;

      }


      /* =====================================================
         5. PROCESS CARD
         ===================================================== */

      .map-card {

        padding: 26px !important;
        border-radius: 17px !important;

      }

      .map-card h2 {

        margin-bottom: 10px !important;

        font-size: 26px !important;
        line-height: 1.15 !important;
        letter-spacing: -.025em !important;

      }

      .map-card .purpose {

        max-width: 620px;
        font-size: 13px !important;
        line-height: 1.55 !important;

      }


      /* =====================================================
         6. INPUT / QUESTION SECTIONS
         ===================================================== */

      .map-section {

        margin-top: 20px !important;
        padding-top: 18px !important;

      }

      .map-section h3 {

        margin-bottom: 10px !important;

        font-size: 12px !important;
        letter-spacing: .04em;

      }

      .input-list,
      .question-list {

        gap: 7px !important;

      }


      /* =====================================================
         7. GENERATE BUTTON
         ===================================================== */

      .analyse-button {

        min-height: 44px !important;

        margin-top: 20px !important;

        border-radius: 10px !important;

        font-size: 13px !important;
        font-weight: 700 !important;

      }


      /* =====================================================
         8. GENERATED OUTPUT
         ===================================================== */

      .output-panel {

        align-self: start !important;

        height: fit-content !important;
        min-height: 0 !important;

        padding: 24px !important;

        border-radius: 17px !important;

      }

      .output-panel h2 {

        margin: 3px 0 10px !important;

        font-size: 25px !important;
        line-height: 1.15 !important;

      }

      .output-empty {

        margin-bottom: 0 !important;

        font-size: 13px !important;
        line-height: 1.55 !important;

      }


      /* =====================================================
         9. PREVIOUS SEARCHES
         ===================================================== */

      .previous-searches {

        margin-top: 22px !important;
        padding-top: 18px !important;

      }

      .previous-searches-header {

        margin-bottom: 12px !important;

      }

      .previous-searches-header h3 {

        font-size: 17px !important;

      }


      /* =====================================================
         10. PROCESS NAVIGATION
         ===================================================== */

      .map-navigation {

        width: 100% !important;
        max-width: 1280px !important;

        margin: 14px auto 0 !important;

        padding: 0 !important;

        display: flex !important;

        justify-content: space-between !important;
        align-items: center !important;

      }

      .map-navigation button {

        min-height: 44px !important;

        padding: 0 17px !important;

        border-radius: 10px !important;

        font-size: 13px !important;

      }

      .map-navigation .next-button {

        margin-left: auto !important;

      }


      /* =====================================================
         11. MARKET SEGMENTS
         ===================================================== */

      #segmentsPanel {

        margin: 32px auto 0 !important;

        padding: 24px 26px 26px !important;

        border-radius: 18px !important;

      }


      /* =====================================================
         12. EVIDENCE
         ===================================================== */

      #fmDashboardEvidence {

        margin: 18px auto 50px !important;

      }


      /* =====================================================
         13. KEEP SECTIONS VISUALLY CONNECTED
         ===================================================== */

      #segmentsPanel,
      #fmDashboardEvidence {

        box-shadow:
          0 10px 30px rgba(38, 24, 52, .045);

      }


      /* =====================================================
         14. TABLET
         ===================================================== */

      @media (max-width: 1050px) {

        .map-layout {

          grid-template-columns: 1fr !important;

        }

        .output-panel {

          width: 100%;

        }

      }


      /* =====================================================
         15. MOBILE
         ===================================================== */

      @media (max-width: 760px) {

        .map-workspace,
        #segmentsPanel,
        #fmDashboardEvidence,
        .map-navigation {

          width: calc(100% - 28px) !important;

        }

        .map-card,
        .output-panel {

          padding: 21px !important;

        }

        .map-navigation {

          gap: 10px;

        }

        .map-navigation button {

          flex: 1;

        }

      }

    `;

    document.head.appendChild(style);
  }


  function removeOldNavigationClasses() {

    const navigation = document.querySelector('.map-navigation');

    if (!navigation) return;

    navigation.classList.remove(
      'fm-next-process-positioned',
      'fm-clean-next-process'
    );

  }


  function run() {

    addFinalDashboardStyles();
    removeOldNavigationClasses();

  }


  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      run
    );

  } else {

    run();

  }

})();


const founderMotionProcessNavigationPolish = document.createElement('style');
founderMotionProcessNavigationPolish.id = 'founderMotionProcessNavigationPolish';
founderMotionProcessNavigationPolish.textContent = `

/* =========================================================
   FINAL PROCESS NAVIGATION POLISH
   Keep navigation visually attached to Process Map.
   ========================================================= */

.map-workspace .map-navigation,
.map-navigation.fm-next-process-positioned {
  width: 100% !important;
  max-width: none !important;

  margin: 18px 0 0 !important;
  padding: 14px 0 0 !important;

  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 10px !important;

  box-sizing: border-box !important;

  border-top: 1px solid rgba(44, 25, 70, .08);
}

.map-workspace .map-navigation button,
.map-navigation.fm-next-process-positioned button {
  min-width: 0 !important;
  min-height: 42px !important;

  padding: 0 18px !important;

  border-radius: 10px !important;

  font-family: inherit !important;
  font-size: 13px !important;
  font-weight: 700 !important;

  line-height: 1 !important;

  transition:
    background .16s ease,
    border-color .16s ease,
    transform .16s ease,
    box-shadow .16s ease !important;
}

/* Previous = quiet secondary action */

.map-workspace .map-navigation .previous-button {
  border: 1px solid #ded8e6 !important;
  background: #fff !important;
  color: #655c6c !important;
}

.map-workspace .map-navigation .previous-button:hover:not(:disabled) {
  background: #f8f6fa !important;
  border-color: #cfc6d9 !important;
}

/* Next = primary action */

.map-workspace .map-navigation .next-button {
  min-width: 148px !important;

  border: 1px solid #421580 !important;
  background: #421580 !important;
  color: #fff !important;

  box-shadow: 0 5px 14px rgba(66, 21, 128, .14) !important;
}

.map-workspace .map-navigation .next-button:hover:not(:disabled) {
  background: #35106a !important;
  border-color: #35106a !important;

  transform: translateY(-1px);

  box-shadow: 0 7px 18px rgba(66, 21, 128, .20) !important;
}

.map-workspace .map-navigation button:disabled {
  opacity: .42 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  transform: none !important;
}

/* Make the arrow feel like part of the button label */

.map-workspace .map-navigation .next-button span,
.map-workspace .map-navigation .previous-button span {
  display: inline-block;
  margin-left: 6px;
}

/* Don't let old positioning rules pull navigation left */

.map-navigation.fm-next-process-positioned {
  position: static !important;
  left: auto !important;
  right: auto !important;
}

/* Mobile */

@media (max-width: 760px) {
  .map-workspace .map-navigation,
  .map-navigation.fm-next-process-positioned {
    justify-content: stretch !important;
    gap: 8px !important;
  }

  .map-workspace .map-navigation button,
  .map-navigation.fm-next-process-positioned button {
    flex: 1 1 0 !important;
    width: auto !important;
  }

  .map-workspace .map-navigation .next-button {
    min-width: 0 !important;
  }
}
`;
document.head.appendChild(founderMotionProcessNavigationPolish);

/* FOUNDERMOTION_PROCESS_MAP_POSITION */
(function () {
  const style = document.createElement('style');
  style.id = 'founderMotionProcessMapPosition';

  style.textContent = `
    .map-workspace {
      margin-top: 8px !important;
    }

    .map-intro {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    @media (max-width: 760px) {
      .map-workspace {
        margin-top: 4px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();



/* =========================================================
   QUESTIONS TO ANSWER — PURPLE FRAME ONLY
   ========================================================= */

(() => {
  const style = document.createElement('style');
  style.id = 'questions-to-answer-border-fix';

  style.textContent = `
    /* Purple frame belongs ONLY around Questions to answer */
    #questionList {
      border: 1.5px solid rgba(125, 87, 190, 0.42) !important;
      border-radius: 16px !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
    }

    /* Do not add another frame to individual questions */
    #questionList .question-item {
      border-left: none !important;
      border-right: none !important;
      box-shadow: none !important;
    }

    /* Saved History keeps its existing normal styling */
    .history-card,
    .history-panel,
    #previousSearches {
      border-color: inherit;
    }
  `;

  document.head.appendChild(style);
})();




















/* =========================================================
   AUTH SCREEN UI
   UI ONLY — does not change authentication/data logic.
   ========================================================= */

function syncAuthScreenUI() {
  const loggedIn = Boolean(currentUser);
  document.body.classList.toggle('auth-logged-in', loggedIn);
  document.body.classList.toggle('auth-logged-out', !loggedIn);

  const appScreen = document.getElementById('appScreen');
  const header = document.querySelector('.site-header');

  if (appScreen) {
    appScreen.style.display = loggedIn ? '' : 'none';
  }

  if (header) {
    header.style.display = loggedIn ? '' : 'none';
  }
}


(() => {
  const style = document.createElement('style');
  style.id = 'supporting-area-final-ui';

  style.textContent = `
    /* =====================================================
       SUPPORTING AREA
       Only affects Market Segments + Evidence
       ===================================================== */

    #supportingResources {
      width: min(1280px, calc(100% - 72px));
      margin: 28px auto 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: stretch;
      box-sizing: border-box;
    }

    #supportingResources #segmentsPanel,
    #supportingResources #fmDashboardEvidence {
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      box-sizing: border-box;
    }

    /* MARKET SEGMENTS */

    #supportingResources #segmentsPanel {
      padding: 26px 28px !important;
      border: 1px solid rgba(44, 25, 70, .10) !important;
      border-radius: 18px !important;
      background: #ffffff !important;
      box-shadow: 0 8px 26px rgba(38, 24, 52, .035) !important;
    }

    #supportingResources #segmentsPanel .segments-header {
      margin-bottom: 18px !important;
    }

    #supportingResources #segmentsPanel .segments-subtitle {
      max-width: 430px;
    }

    #supportingResources #segmentsPanel .add-segment-button {
      border-radius: 10px !important;
    }

    #supportingResources #segmentsPanel .segments-list {
      margin-top: 18px !important;
    }

    /* EMPTY SEGMENT STATE */

    #supportingResources #segmentsPanel .segments-list:empty::before {
      content: 'Add one or two priority market segments to define your focus.';
      display: block;
      padding: 18px 20px;
      border: 1px dashed #ddd8e5;
      border-radius: 12px;
      color: #8d8794;
      font-size: 13px;
      line-height: 1.5;
      background: #faf9fb;
    }

    /* CUSTOMER & MARKET EVIDENCE */

    #supportingResources #fmDashboardEvidence {
      border: 1px solid rgba(44, 25, 70, .10) !important;
      border-radius: 18px !important;
      background: #ffffff !important;
      box-shadow: 0 8px 26px rgba(38, 24, 52, .035) !important;
      overflow: hidden !important;
    }

    #supportingResources #fmDashboardEvidence .fm-evidence-toggle {
      min-height: 100% !important;
      padding: 26px 28px !important;
      box-sizing: border-box;
    }

    /* NEXT PROCESS */

    .map-navigation {
      width: min(1280px, calc(100% - 72px)) !important;
      margin: 20px auto 0 !important;
      padding: 0 !important;
      display: flex !important;
      justify-content: flex-end !important;
      align-items: center !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    .map-navigation .next-button {
      min-width: 156px !important;
      min-height: 46px !important;
      padding: 0 20px !important;
      border-radius: 12px !important;
      border: 1px solid rgba(112, 80, 166, .18) !important;
      background: #b29acb !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      box-shadow: none !important;
      transition: transform .18s ease, background .18s ease !important;
    }

    .map-navigation .next-button:not(:disabled):hover {
      background: #7650a6 !important;
      transform: translateY(-1px);
    }

    .map-navigation .next-button:disabled {
      opacity: .7 !important;
      cursor: not-allowed !important;
    }

    .map-navigation .previous-button {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    @media (max-width: 800px) {
      #supportingResources {
        grid-template-columns: 1fr;
      }

      .map-navigation {
        width: calc(100% - 32px) !important;
      }
    }
  `;

  document.head.appendChild(style);

  /* Supporting wrapper disabled.
     Segment and Evidence are positioned independently. */
})();



/* =========================================================
   SEGMENT / EVIDENCE — DASHBOARD COLUMN PLACEMENT
   Segment: directly below Questions
   Evidence: directly below Previous History
   ========================================================= */
(() => {
  function placeSupportingPanels() {
    const layout = document.querySelector('.map-layout');
    const questions = layout?.querySelector('.question-card');
    const history = layout?.querySelector('#previousSearches');
    const segments = document.getElementById('segmentsPanel');
    const evidence = document.getElementById('fmDashboardEvidence');

    if (!layout || !questions || !segments) return;

    const oldSupporting = document.getElementById('supportingResources');
    if (oldSupporting) {
      if (oldSupporting.contains(segments)) {
        oldSupporting.parentNode.insertBefore(segments, oldSupporting);
      }

      if (evidence && oldSupporting.contains(evidence)) {
        oldSupporting.parentNode.insertBefore(evidence, oldSupporting);
      }

      oldSupporting.remove();
    }

    const oldLowerRow = document.getElementById('fmSegmentEvidenceRow');
    if (oldLowerRow) {
      if (oldLowerRow.contains(segments)) {
        oldLowerRow.parentNode.insertBefore(segments, oldLowerRow);
      }

      if (evidence && oldLowerRow.contains(evidence)) {
        oldLowerRow.parentNode.insertBefore(evidence, oldLowerRow);
      }

      oldLowerRow.remove();
    }

    if (segments.parentElement !== layout) {
      layout.appendChild(segments);
    }

    segments.style.setProperty('grid-column', '1', 'important');
    segments.style.setProperty('width', '100%', 'important');
    segments.style.setProperty('max-width', 'none', 'important');
    segments.style.setProperty('margin', '0', 'important');
    segments.style.setProperty('align-self', 'start', 'important');

    if (evidence) {
      if (evidence.parentElement !== layout) {
        layout.appendChild(evidence);
      }

      evidence.style.setProperty('grid-column', '2', 'important');
      evidence.style.setProperty('width', '100%', 'important');
      evidence.style.setProperty('max-width', 'none', 'important');
      evidence.style.setProperty('margin', '0', 'important');
      evidence.style.setProperty('align-self', 'start', 'important');
    }
  }

  placeSupportingPanels();
  requestAnimationFrame(placeSupportingPanels);
  setTimeout(placeSupportingPanels, 150);
  setTimeout(placeSupportingPanels, 500);
})();


/* SEGMENT EVIDENCE NEXT PROCESS — REFINED UI */
/* =========================================================
   FINAL UI OVERRIDE
   ONLY: Market Segments + Evidence + Next Process
   ========================================================= */
/* =========================================================
   FINAL LOWER UI
   ONLY: SEGMENT + EVIDENCE + NEXT PROCESS BUTTON
   ========================================================= */

/* =========================================================
   LOWER UI FIX 2
   ONLY: SEGMENT + EVIDENCE + NEXT PROCESS
   ========================================================= */

(() => {
  const style = document.createElement('style');
  style.id = 'clean-segment-evidence-next-process';

  style.textContent = `
    /*
     * =====================================================
     * FOUNDERMOTION — LOWER SUPPORTING UI
     *
     * ONLY affects:
     * 1. Market segments
     * 2. Customer & market evidence
     * 3. Next process button
     *
     * DO NOT affect any other dashboard frame.
     * =====================================================
     */

    /* -----------------------------
       SEGMENT + EVIDENCE
       Same width and alignment as
       the two main frames above.
       ----------------------------- */

    #segmentsPanel,
    #fmDashboardEvidence {
      box-sizing: border-box !important;

      width: calc((1134px - 20px) / 2) !important;
      max-width: calc((1134px - 20px) / 2) !important;
      min-width: 0 !important;

      display: inline-block !important;
      vertical-align: top !important;

      margin-top: 18px !important;

      height: 196px !important;
      min-height: 196px !important;
      max-height: 196px !important;

      overflow: hidden !important;

      border-radius: 16px !important;
    }

    /* Segment = left frame */

    #segmentsPanel {
      margin-left: calc((100% - 1134px) / 2) !important;
      margin-right: 10px !important;

      padding: 22px 24px !important;
    }

    /* Evidence = right frame */

    #fmDashboardEvidence {
      margin-left: 10px !important;
      margin-right: 0 !important;
    }

    /* Keep evidence header compact and centred vertically */

    #fmDashboardEvidence .fm-evidence-toggle {
      min-height: 0 !important;
      height: 100% !important;

      padding: 22px 24px !important;

      box-sizing: border-box !important;
    }

    /* -----------------------------
       NEXT PROCESS
       Align its right edge with
       the upper right frame.
       ----------------------------- */

    .map-navigation .next-button {
      width: 148px !important;
      min-width: 148px !important;
      height: 42px !important;

      margin-left: auto !important;
      margin-right: calc((100% - 1134px) / 2) !important;

      box-sizing: border-box !important;
    }

    /* -----------------------------
       RESPONSIVE
       ----------------------------- */

    @media (max-width: 1174px) {
      #segmentsPanel {
        margin-left: 20px !important;
        margin-right: 10px !important;
      }

      #fmDashboardEvidence {
        margin-left: 10px !important;
        margin-right: 20px !important;
      }

      .map-navigation .next-button {
        margin-right: 20px !important;
      }
    }

    @media (max-width: 800px) {
      #segmentsPanel,
      #fmDashboardEvidence {
        display: block !important;

        width: calc(100% - 40px) !important;
        max-width: none !important;

        margin-left: 20px !important;
        margin-right: 20px !important;

        height: 180px !important;
        min-height: 180px !important;
        max-height: 180px !important;
      }

      #fmDashboardEvidence {
        margin-top: 14px !important;
      }

      .map-navigation .next-button {
        margin-right: 20px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();


/* =========================================================
   FINAL — SEGMENT + EVIDENCE + NEXT PROCESS ONLY
   ========================================================= */

(() => {
  const style = document.createElement('style');
  style.id = 'fm-real-segment-evidence-layout';

  style.textContent = `
    /*
     * The row is the ONLY new layout container.
     * It is aligned to the same centred width as the
     * Process Map above.
     */

    #fmSegmentEvidenceRow {
      width: min(1134px, calc(100% - 40px)) !important;
      max-width: 1134px !important;

      margin: 18px auto 0 !important;
      padding: 0 !important;

      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;

      gap: 20px !important;

      box-sizing: border-box !important;
    }

    /*
     * Segment and Evidence occupy exactly one column each.
     */

    #fmSegmentEvidenceRow #segmentsPanel,
    #fmSegmentEvidenceRow #fmDashboardEvidence {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;

      margin: 0 !important;

      box-sizing: border-box !important;

      height: 196px !important;
      min-height: 196px !important;
      max-height: 196px !important;

      overflow: hidden !important;

      border-radius: 16px !important;
    }

    /*
     * Evidence header stays compact.
     */

    #fmSegmentEvidenceRow #fmDashboardEvidence .fm-evidence-toggle {
      min-height: 0 !important;
      height: 100% !important;

      padding: 22px 24px !important;

      box-sizing: border-box !important;
    }

    /*
     * Next Process:
     * keep it inside the Process Map and align its
     * right edge with the same centred 1134px content area.
     */

    .map-workspace .map-navigation .next-button {
      margin-left: auto !important;
      margin-right: max(
        20px,
        calc((100% - 1134px) / 2)
      ) !important;

      width: 148px !important;
      min-width: 148px !important;
      height: 42px !important;

      box-sizing: border-box !important;
    }

    /*
     * Do NOT change anything else.
     */

    @media (max-width: 800px) {
      #fmSegmentEvidenceRow {
        width: calc(100% - 40px) !important;
        max-width: none !important;

        grid-template-columns: 1fr !important;
        gap: 14px !important;

        margin-left: 20px !important;
        margin-right: 20px !important;
      }

      #fmSegmentEvidenceRow #segmentsPanel,
      #fmSegmentEvidenceRow #fmDashboardEvidence {
        width: 100% !important;

        height: 180px !important;
        min-height: 180px !important;
        max-height: 180px !important;
      }

      .map-workspace .map-navigation .next-button {
        margin-right: 20px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();


/* =========================================================
   FINAL LAYOUT FIX
   ONLY:
   - Market segments
   - Customer & market evidence
   - Next process button
   ========================================================= */

(() => {
  const finalLayoutStyle = document.createElement('style');
  finalLayoutStyle.id = 'final-segment-evidence-layout';

  finalLayoutStyle.textContent = `
    /* -----------------------------------------
       MARKET SEGMENTS + CUSTOMER EVIDENCE
       Same width, same height, same row
       ----------------------------------------- */

    #segmentsPanel,
    #fmDashboardEvidence {
      box-sizing: border-box !important;

      width: 557px !important;
      min-width: 557px !important;
      max-width: 557px !important;

      height: 190px !important;
      min-height: 190px !important;
      max-height: 190px !important;

      display: inline-block !important;
      vertical-align: top !important;

      margin-top: 18px !important;
      margin-bottom: 0 !important;

      overflow: hidden !important;
    }

    /* LEFT FRAME
       Align exactly with the left edge
       of the main 1134px content area */
    #segmentsPanel {
      margin-left: calc((100vw - 1134px) / 2) !important;
      margin-right: 20px !important;
    }

    /* RIGHT FRAME */
    #fmDashboardEvidence {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    /* -----------------------------------------
       NEXT PROCESS
       Align its right edge with the
       right edge of the main content area
       ----------------------------------------- */

    .map-navigation {
      width: 1134px !important;
      max-width: calc(100vw - 40px) !important;

      margin-left: auto !important;
      margin-right: auto !important;

      box-sizing: border-box !important;
    }

    .map-navigation .next-button {
      width: 148px !important;
      min-width: 148px !important;
      height: 42px !important;

      margin-left: auto !important;
      margin-right: 0 !important;

      box-sizing: border-box !important;
    }

    /* -----------------------------------------
       TABLET
       ----------------------------------------- */

    @media (max-width: 1174px) {
      #segmentsPanel,
      #fmDashboardEvidence {
        width: calc((100vw - 60px) / 2) !important;
        min-width: 0 !important;
        max-width: calc((100vw - 60px) / 2) !important;
      }

      #segmentsPanel {
        margin-left: 20px !important;
        margin-right: 20px !important;
      }

      #fmDashboardEvidence {
        margin-left: 0 !important;
        margin-right: 20px !important;
      }

      .map-navigation {
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;
      }
    }

    /* -----------------------------------------
       MOBILE
       ----------------------------------------- */

    @media (max-width: 800px) {
      #segmentsPanel,
      #fmDashboardEvidence {
        display: block !important;

        width: calc(100vw - 40px) !important;
        min-width: 0 !important;
        max-width: calc(100vw - 40px) !important;

        margin-left: 20px !important;
        margin-right: 20px !important;
      }

      #fmDashboardEvidence {
        margin-top: 14px !important;
      }
    }
  `;

  document.head.appendChild(finalLayoutStyle);
})();



/* FINAL FIX: segment + evidence + next process only */
(() => {
  const style = document.createElement('style');
  style.id = 'final-segment-evidence-row-fix';

  style.textContent = `
    /* =========================================
       ONLY:
       - Market segments
       - Customer & market evidence
       - Next process
       ========================================= */

    #fmSegmentEvidenceRow {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      gap: 20px !important;

      width: var(--fm-main-content-width, 1134px) !important;
      max-width: calc(100vw - 40px) !important;

      margin-left: auto !important;
      margin-right: auto !important;

      box-sizing: border-box !important;
    }

    #fmSegmentEvidenceRow > #segmentsPanel,
    #fmSegmentEvidenceRow > #fmDashboardEvidence {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;

      margin-left: 0 !important;
      margin-right: 0 !important;
      margin-top: 18px !important;

      box-sizing: border-box !important;
    }

    #fmSegmentEvidenceRow > #segmentsPanel {
      grid-column: 1 !important;
    }

    #fmSegmentEvidenceRow > #fmDashboardEvidence {
      grid-column: 2 !important;
    }

    .map-navigation .next-button {
      margin-left: auto !important;
    }

    @media (max-width: 800px) {
      #fmSegmentEvidenceRow {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;
      }

      #fmSegmentEvidenceRow > #segmentsPanel,
      #fmSegmentEvidenceRow > #fmDashboardEvidence {
        grid-column: 1 !important;
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
    }
  `;

  document.head.appendChild(style);

  /*
   * Make the bottom row use EXACTLY the same
   * horizontal width as the main process/navigation area.
   */
  function alignSegmentEvidenceRow() {
    const row = document.getElementById('fmSegmentEvidenceRow');
    const navigation = document.querySelector('.map-navigation');

    if (!row || !navigation) return;

    if (window.innerWidth <= 800) {
      row.style.removeProperty('width');
      row.style.removeProperty('max-width');
      return;
    }

    const navRect = navigation.getBoundingClientRect();

    row.style.width = `${navRect.width}px`;
    row.style.maxWidth = `${navRect.width}px`;
    row.style.marginLeft = `${navRect.left}px`;
    row.style.marginRight = '0';
  }

  requestAnimationFrame(alignSegmentEvidenceRow);

  window.addEventListener('resize', () => {
    requestAnimationFrame(alignSegmentEvidenceRow);
  });
})();


/* =========================================================
   FINAL UI — SEGMENTS / EVIDENCE / NEXT PROCESS ONLY
   ========================================================= */

(() => {
  const style = document.createElement('style');
  style.id = 'final-segment-evidence-next-ui';

  style.textContent = `
    /* -----------------------------------------
       TWO TARGET FRAMES
       ----------------------------------------- */

    #fmSegmentEvidenceRow {
      width: min(1134px, calc(100vw - 40px)) !important;
      max-width: min(1134px, calc(100vw - 40px)) !important;

      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;

      column-gap: 24px !important;
      row-gap: 0 !important;

      margin: 22px auto 0 !important;
      padding: 0 !important;

      box-sizing: border-box !important;

      align-items: stretch !important;
    }

    /* -----------------------------------------
       SEGMENTS
       ----------------------------------------- */

    #fmSegmentEvidenceRow #segmentsPanel {
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;

      height: 250px !important;
      min-height: 250px !important;
      max-height: 250px !important;

      margin: 0 !important;
      padding: 24px 26px !important;

      box-sizing: border-box !important;

      border-radius: 18px !important;
      overflow: hidden !important;
    }

    /* -----------------------------------------
       EVIDENCE
       ----------------------------------------- */

    #fmSegmentEvidenceRow #fmDashboardEvidence {
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;

      height: 250px !important;
      min-height: 250px !important;
      max-height: 250px !important;

      margin: 0 !important;
      padding: 24px 26px !important;

      box-sizing: border-box !important;

      border-radius: 18px !important;
      overflow: hidden !important;
    }

    /* Keep the inside spacing visually consistent */

    #fmSegmentEvidenceRow #segmentsPanel .segments-header {
      margin-bottom: 18px !important;
    }

    #fmSegmentEvidenceRow #segmentsPanel .segments-header h2 {
      margin-top: 4px !important;
      margin-bottom: 4px !important;
    }

    #fmSegmentEvidenceRow #segmentsPanel .segments-subtitle {
      margin-top: 0 !important;
    }

    /* -----------------------------------------
       NEXT PROCESS
       Full-width bar below both cards
       ----------------------------------------- */

    .map-navigation {
      width: min(1134px, calc(100vw - 40px)) !important;
      max-width: min(1134px, calc(100vw - 40px)) !important;

      margin: 18px auto 0 !important;
      padding: 0 !important;

      box-sizing: border-box !important;
    }

    .map-navigation .next-button {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      width: 100% !important;
      min-width: 0 !important;
      height: 58px !important;

      margin: 0 !important;
      padding: 0 28px !important;

      box-sizing: border-box !important;

      border-radius: 14px !important;

      font-size: 16px !important;
      font-weight: 700 !important;
    }

    /* -----------------------------------------
       DESKTOP BALANCE
       ----------------------------------------- */

    @media (min-width: 1175px) {
      #fmSegmentEvidenceRow {
        margin-top: 18px !important;
      }
    }

    /* -----------------------------------------
       TABLET
       ----------------------------------------- */

    @media (max-width: 900px) {
      #fmSegmentEvidenceRow {
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;

        grid-template-columns: 1fr !important;
        row-gap: 14px !important;

        margin-left: 20px !important;
        margin-right: 20px !important;
      }

      #fmSegmentEvidenceRow #segmentsPanel,
      #fmSegmentEvidenceRow #fmDashboardEvidence {
        width: 100% !important;
        max-width: none !important;
        min-width: 0 !important;

        height: 220px !important;
        min-height: 220px !important;
        max-height: 220px !important;
      }

      .map-navigation {
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;

        margin-left: 20px !important;
        margin-right: 20px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   REAL FINAL LAYOUT FIX
   ONLY:
   - Market segments
   - Customer & market evidence
   - Next process
   ========================================================= */

(() => {
  function finalLayoutFix() {
    const row = document.getElementById('fmSegmentEvidenceRow');
    const segment = document.getElementById('segmentsPanel');
    const evidence = document.getElementById('fmDashboardEvidence');

    if (!row || !segment || !evidence) return;

    /* -----------------------------------------------------
       SEGMENT + EVIDENCE
       ----------------------------------------------------- */

    row.style.setProperty('display', 'grid', 'important');
    row.style.setProperty(
      'grid-template-columns',
      'minmax(0, 1fr) minmax(0, 1fr)',
      'important'
    );

    row.style.setProperty('gap', '24px', 'important');

    row.style.setProperty(
      'width',
      'min(1134px, calc(100vw - 40px))',
      'important'
    );

    row.style.setProperty(
      'max-width',
      'min(1134px, calc(100vw - 40px))',
      'important'
    );

    row.style.setProperty(
      'margin',
      '0 auto !important',
      'important'
    );

    row.style.setProperty(
      'transform',
      'translateY(-20px)',
      'important'
    );

    row.style.setProperty(
      'box-sizing',
      'border-box',
      'important'
    );

    /* Same exact frame size */

    [segment, evidence].forEach(el => {

      el.style.setProperty(
        'width',
        '100%',
        'important'
      );

      el.style.setProperty(
        'min-width',
        '0',
        'important'
      );

      el.style.setProperty(
        'max-width',
        'none',
        'important'
      );

      el.style.setProperty(
        'height',
        '250px',
        'important'
      );

      el.style.setProperty(
        'min-height',
        '250px',
        'important'
      );

      el.style.setProperty(
        'max-height',
        '250px',
        'important'
      );

      el.style.setProperty(
        'margin',
        '0',
        'important'
      );

      el.style.setProperty(
        'box-sizing',
        'border-box',
        'important'
      );

      el.style.setProperty(
        'position',
        'relative',
        'important'
      );

      el.style.setProperty(
        'left',
        '0',
        'important'
      );

      el.style.setProperty(
        'right',
        'auto',
        'important'
      );

      el.style.setProperty(
        'top',
        '0',
        'important'
      );
    });

    /* -----------------------------------------------------
       NEXT PROCESS
       Completely reset old positioning
       ----------------------------------------------------- */

    const navigations =
      document.querySelectorAll('.map-navigation');

    navigations.forEach(navigation => {

      /* Remove old positioning rules */

      navigation.style.setProperty(
        'position',
        'relative',
        'important'
      );

      navigation.style.setProperty(
        'display',
        'block',
        'important'
      );

      navigation.style.setProperty(
        'float',
        'none',
        'important'
      );

      navigation.style.setProperty(
        'left',
        'auto',
        'important'
      );

      navigation.style.setProperty(
        'right',
        'auto',
        'important'
      );

      navigation.style.setProperty(
        'top',
        'auto',
        'important'
      );

      navigation.style.setProperty(
        'bottom',
        'auto',
        'important'
      );

      navigation.style.setProperty(
        'transform',
        'none',
        'important'
      );

      navigation.style.setProperty(
        'margin',
        '18px auto 0',
        'important'
      );

      navigation.style.setProperty(
        'width',
        'min(1134px, calc(100vw - 40px))',
        'important'
      );

      navigation.style.setProperty(
        'max-width',
        'min(1134px, calc(100vw - 40px))',
        'important'
      );

      navigation.style.setProperty(
        'min-width',
        '0',
        'important'
      );

      navigation.style.setProperty(
        'padding',
        '0',
        'important'
      );

      navigation.style.setProperty(
        'box-sizing',
        'border-box',
        'important'
      );

      const next =
        navigation.querySelector('.next-button');

      if (!next) return;

      next.style.setProperty(
        'display',
        'flex',
        'important'
      );

      next.style.setProperty(
        'position',
        'static',
        'important'
      );

      next.style.setProperty(
        'width',
        '100%',
        'important'
      );

      next.style.setProperty(
        'min-width',
        '0',
        'important'
      );

      next.style.setProperty(
        'height',
        '58px',
        'important'
      );

      next.style.setProperty(
        'margin',
        '0',
        'important'
      );

      next.style.setProperty(
        'padding',
        '0 28px',
        'important'
      );

      next.style.setProperty(
        'align-items',
        'center',
        'important'
      );

      next.style.setProperty(
        'justify-content',
        'center',
        'important'
      );

      next.style.setProperty(
        'box-sizing',
        'border-box',
        'important'
      );

      next.style.setProperty(
        'border-radius',
        '14px',
        'important'
      );
    });

    /* -----------------------------------------------------
       Force navigation after target row in DOM
       ----------------------------------------------------- */

    const navigation =
      document.querySelector('.map-navigation');

    if (navigation && row.parentElement) {

      row.parentElement.insertAdjacentElement(
        'afterend',
        navigation
      );
    }
  }

  finalLayoutFix();

  window.addEventListener(
    'load',
    finalLayoutFix
  );

  setTimeout(finalLayoutFix, 100);
  setTimeout(finalLayoutFix, 500);
  setTimeout(finalLayoutFix, 1000);
  setTimeout(finalLayoutFix, 2000);

  window.addEventListener(
    'resize',
    finalLayoutFix
  );
})();


/* =========================================================
   MOVE NEXT PROCESS BELOW SEGMENT + EVIDENCE
   ONLY changes DOM position of Next Process.
   ========================================================= */

(() => {
  function moveNextProcessBelowTargetRow() {
    const row = document.getElementById('fmSegmentEvidenceRow');
    const navigation = document.querySelector('.map-navigation');

    if (!row || !navigation) {
      console.warn('Target row or Next Process not found.');
      return;
    }

    /* Put Next Process immediately AFTER the Segment/Evidence row */
    row.insertAdjacentElement('afterend', navigation);

    /* Reset old positioning that was keeping it beside the
       upper Process Map cards. */
    navigation.style.setProperty('position', 'relative', 'important');
    navigation.style.setProperty('left', 'auto', 'important');
    navigation.style.setProperty('right', 'auto', 'important');
    navigation.style.setProperty('top', 'auto', 'important');
    navigation.style.setProperty('bottom', 'auto', 'important');
    navigation.style.setProperty('float', 'none', 'important');
    navigation.style.setProperty('transform', 'none', 'important');

    navigation.style.setProperty(
      'width',
      'min(1134px, calc(100vw - 40px))',
      'important'
    );

    navigation.style.setProperty(
      'max-width',
      'min(1134px, calc(100vw - 40px))',
      'important'
    );

    navigation.style.setProperty(
      'margin',
      '18px auto 0',
      'important'
    );

    navigation.style.setProperty(
      'box-sizing',
      'border-box',
      'important'
    );

    const nextButton = navigation.querySelector('.next-button');

    if (nextButton) {
      nextButton.style.setProperty(
        'width',
        '100%',
        'important'
      );

      nextButton.style.setProperty(
        'margin',
        '0',
        'important'
      );

      nextButton.style.setProperty(
        'height',
        '58px',
        'important'
      );

      nextButton.style.setProperty(
        'box-sizing',
        'border-box',
        'important'
      );
    }

    console.log(
      'OK: Next Process moved below Segment + Evidence'
    );
  }

  moveNextProcessBelowTargetRow();

  setTimeout(moveNextProcessBelowTargetRow, 300);
  setTimeout(moveNextProcessBelowTargetRow, 1000);
})();

/* ==========================================================
   NEXT PROCESS — VISUAL POSITION ONLY
   DO NOT TOUCH SEGMENTS / EVIDENCE / HEADER / BODY / DOM
   ========================================================== */

(() => {
  function positionNextProcessOnly() {
    const nav = document.querySelector('.map-navigation');
    const row = document.getElementById('fmSegmentEvidenceRow');

    if (!nav || !row) return;

    const navRect = nav.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    /*
     * Only move the navigation visually.
     * The DOM structure remains completely untouched.
     */
    const gap = 18;
    const moveDown = rowRect.bottom + gap - navRect.top;

    nav.style.setProperty(
      'transform',
      `translateY(${Math.max(0, moveDown)}px)`,
      'important'
    );

    nav.style.setProperty(
      'width',
      `${Math.round(rowRect.width)}px`,
      'important'
    );

    nav.style.setProperty(
      'max-width',
      `${Math.round(rowRect.width)}px`,
      'important'
    );

    nav.style.setProperty(
      'margin-left',
      `${Math.round(rowRect.left)}px`,
      'important'
    );

    nav.style.setProperty(
      'margin-right',
      '0px',
      'important'
    );

    const button = nav.querySelector('.next-button');

    if (button) {
      button.style.setProperty(
        'width',
        '100%',
        'important'
      );

      button.style.setProperty(
        'height',
        '60px',
        'important'
      );

      button.style.setProperty(
        'margin',
        '0',
        'important'
      );
    }
  }

  setTimeout(positionNextProcessOnly, 300);
  setTimeout(positionNextProcessOnly, 1000);
  setTimeout(positionNextProcessOnly, 2000);

  window.addEventListener('resize', positionNextProcessOnly);
})();

/* ==========================================================
   FINAL NEXT PROCESS POSITION
   ONLY .map-navigation / .next-button
   DO NOT TOUCH SEGMENTS OR EVIDENCE
   ========================================================== */

(() => {
  function fixNextProcessOnly() {
    const nav = document.querySelector('.map-navigation');
    const row = document.getElementById('fmSegmentEvidenceRow');

    if (!nav || !row) return;

    const rowRect = row.getBoundingClientRect();
    const navParent = nav.offsetParent;

    if (!navParent) return;

    const parentRect = navParent.getBoundingClientRect();

    /* Align Next Process exactly with the Segment/Evidence row */
    nav.style.setProperty(
      'position',
      'relative',
      'important'
    );

    nav.style.setProperty(
      'left',
      `${Math.round(rowRect.left - parentRect.left)}px`,
      'important'
    );

    nav.style.setProperty(
      'width',
      `${Math.round(rowRect.width)}px`,
      'important'
    );

    nav.style.setProperty(
      'max-width',
      `${Math.round(rowRect.width)}px`,
      'important'
    );

    nav.style.setProperty(
      'margin-left',
      '0px',
      'important'
    );

    nav.style.setProperty(
      'margin-right',
      '0px',
      'important'
    );

    nav.style.setProperty(
      'transform',
      'none',
      'important'
    );

    /* Keep the bar directly below the two frames */
    nav.style.setProperty(
      'margin-top',
      '18px',
      'important'
    );

    nav.style.setProperty(
      'height',
      '60px',
      'important'
    );

    nav.style.setProperty(
      'min-height',
      '60px',
      'important'
    );

    const button = nav.querySelector('.next-button');

    if (button) {
      button.style.setProperty(
        'width',
        '100%',
        'important'
      );

      button.style.setProperty(
        'min-width',
        '0',
        'important'
      );

      button.style.setProperty(
        'height',
        '60px',
        'important'
      );

      button.style.setProperty(
        'margin',
        '0',
        'important'
      );

      button.style.setProperty(
        'border-radius',
        '14px',
        'important'
      );

      button.style.setProperty(
        'box-sizing',
        'border-box',
        'important'
      );
    }
  }

  fixNextProcessOnly();

  setTimeout(fixNextProcessOnly, 300);
  setTimeout(fixNextProcessOnly, 1000);
  setTimeout(fixNextProcessOnly, 2000);

  window.addEventListener(
    'resize',
    fixNextProcessOnly
  );
})();

/* ==========================================================
   NEXT PROCESS — FINAL VISUAL ALIGNMENT ONLY
   DO NOT MODIFY SEGMENTS / EVIDENCE / DOM ORDER
   ========================================================== */

(() => {
  function alignNextProcess() {
    const nav = document.querySelector('.map-navigation');
    const row = document.getElementById('fmSegmentEvidenceRow');

    if (!nav || !row) return;

    const rowRect = row.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();

    /* Desired position:
       directly below Segment + Evidence row,
       aligned to exactly the same left/right edges.
    */
    const targetLeft = rowRect.left;
    const targetTop = rowRect.bottom + 18;

    const moveX = targetLeft - navRect.left;
    const moveY = targetTop - navRect.top;

    nav.style.setProperty(
      'width',
      `${Math.round(rowRect.width)}px`,
      'important'
    );

    nav.style.setProperty(
      'max-width',
      `${Math.round(rowRect.width)}px`,
      'important'
    );

    nav.style.setProperty(
      'margin-left',
      '0',
      'important'
    );

    nav.style.setProperty(
      'margin-right',
      '0',
      'important'
    );

    /* THIS is the important part:
       move the existing button visually only.
       No DOM movement. No Segment/Evidence changes.
    */
    nav.style.setProperty(
      'transform',
      `translate(${Math.round(moveX)}px, ${Math.round(moveY)}px)`,
      'important'
    );

    const button = nav.querySelector('.next-button');

    if (button) {
      button.style.setProperty(
        'width',
        '100%',
        'important'
      );

      button.style.setProperty(
        'height',
        '60px',
        'important'
      );

      button.style.setProperty(
        'margin',
        '0',
        'important'
      );

      button.style.setProperty(
        'box-sizing',
        'border-box',
        'important'
      );

      button.style.setProperty(
        'border-radius',
        '14px',
        'important'
      );
    }
  }

  setTimeout(alignNextProcess, 300);
  setTimeout(alignNextProcess, 1000);
  setTimeout(alignNextProcess, 2000);

  window.addEventListener('resize', alignNextProcess);
})();

/* FINAL: move ONLY the 3 target elements upward */
(() => {
  const style = document.createElement('style');
  style.id = 'final-target-up-only';

  style.textContent = `
    #fmSegmentEvidenceRow {
      position: relative !important;
      top: -20px !important;
    }

    .map-navigation {
      position: relative !important;
      top: -20px !important;
    }
  `;

  const old = document.getElementById('final-target-up-only');
  if (old) old.remove();

  document.head.appendChild(style);
})();

/* SPACING ONLY — DO NOT CHANGE SIZES OR POSITIONS */
(() => {
  const styleId = 'spacing-only-final';

  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `
    /* ONLY reduce the vertical gap before Segment + Evidence */
    #fmSegmentEvidenceRow {
      margin-top: -52px !important;
    }
  `;

  document.head.appendChild(style);
})();

/* FINAL MICRO SPACING — ONLY SEGMENT + EVIDENCE ROW */
(() => {
  const styleId = 'spacing-only-final-2';

  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `
    #fmSegmentEvidenceRow {
      margin-top: -24px !important;
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   FINAL TARGET LAYOUT
   ONLY:
   - Market segments
   - Customer & market evidence
   - Next process button

   DO NOT TOUCH ANY OTHER SECTION
   ========================================================= */

(() => {
  const styleId = 'final-segment-evidence-target-layout';

  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `

    /* ---------- ONLY THE TWO TARGET FRAMES ---------- */

    #fmSegmentEvidenceRow {
      width: min(860px, calc(100% - 40px)) !important;
      max-width: 860px !important;
      min-width: 0 !important;

      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;

      gap: 24px !important;

      margin-left: auto !important;
      margin-right: auto !important;

      margin-top: -24px !important;
      margin-bottom: 0 !important;

      transform: none !important;
      box-sizing: border-box !important;
    }

    #fmSegmentEvidenceRow > #segmentsPanel,
    #fmSegmentEvidenceRow > #fmDashboardEvidence {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;

      height: 200px !important;
      min-height: 200px !important;
      max-height: 200px !important;

      margin: 0 !important;

      position: relative !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;

      transform: none !important;

      box-sizing: border-box !important;
    }


    /* ---------- ONLY NEXT PROCESS BUTTON ---------- */

    #fmSegmentEvidenceRow ~ .fm-clean-next-process,
    .fm-clean-next-process {
      width: min(860px, calc(100% - 40px)) !important;
      max-width: 860px !important;

      margin-left: auto !important;
      margin-right: auto !important;

      margin-top: 16px !important;
      margin-bottom: 0 !important;

      height: 58px !important;
      min-height: 58px !important;

      box-sizing: border-box !important;

      transform: none !important;

      position: relative !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;
    }


    /* ---------- MOBILE: KEEP TWO FRAMES STACKED ---------- */

    @media (max-width: 760px) {
      #fmSegmentEvidenceRow {
        width: calc(100% - 32px) !important;
        grid-template-columns: 1fr !important;
      }

      #fmSegmentEvidenceRow > #segmentsPanel,
      #fmSegmentEvidenceRow > #fmDashboardEvidence {
        height: auto !important;
        min-height: 190px !important;
        max-height: none !important;
      }

      .fm-clean-next-process {
        width: calc(100% - 32px) !important;
      }
    }

  `;

  document.head.appendChild(style);

  console.log('FINAL TARGET LAYOUT APPLIED — ONLY SEGMENT / EVIDENCE / NEXT PROCESS');

})();


/* ============================================================
   FOUNDERMOTION — EVIDENCE LIBRARY MODAL
   Evidence functionality only.
   ============================================================ */

(function initEvidenceLibraryModal() {

  const EVIDENCE_TYPES = [
    'Interview Note',
    'Objection',
    'Pricing Signal',
    'Proof Point'
  ];

  let evidenceItems = [];

  let editingId = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getFrame() {
    return document.querySelector('#fmDashboardEvidence');
  }

  function getToggle(frame) {
    if (!frame) return null;

    return frame.querySelector('#fmEvidenceToggle') ||
      [...frame.querySelectorAll('button')]
        .find(button =>
          button.textContent
            .toLowerCase()
            .includes('view evidence')
        );
  }

  function createModal() {
    if (document.querySelector('#fmEvidenceLibraryModal')) {
      return document.querySelector('#fmEvidenceLibraryModal');
    }

    const modal = document.createElement('div');

    modal.id = 'fmEvidenceLibraryModal';

    modal.innerHTML = `
      <div class="fm-evidence-modal-backdrop" data-evidence-close></div>

      <div
        class="fm-evidence-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fmEvidenceModalTitle"
      >

        <div class="fm-evidence-modal-header">

          <div>
            <div class="fm-evidence-modal-eyebrow">
              Evidence library
            </div>

            <h2 id="fmEvidenceModalTitle">
              Customer & market evidence
            </h2>

            <p>
              Evidence uploaded across strategic process inputs.
            </p>
          </div>

          <button
            type="button"
            class="fm-evidence-modal-close"
            data-evidence-close
            aria-label="Close evidence"
          >
            ×
          </button>

        </div>

        <div class="fm-evidence-modal-toolbar">

          <div class="fm-evidence-modal-summary">
            <strong id="fmEvidenceCount">0</strong>
            <span>evidence items</span>
          </div>

        </div>

        <div
          class="fm-evidence-list"
          id="fmEvidenceList"
        ></div>

        <form
          class="fm-evidence-form"
          id="fmEvidenceForm"
          hidden
        >

          <div class="fm-evidence-form-header">

            <div>
              <div class="fm-evidence-modal-eyebrow">
                Evidence item
              </div>

              <h3 id="fmEvidenceFormTitle">
                Add evidence
              </h3>
            </div>

            <button
              type="button"
              class="fm-evidence-form-cancel"
              id="fmEvidenceCancelButton"
            >
              Cancel
            </button>

          </div>

          <div class="fm-evidence-form-grid">

            <label>
              <span>Type</span>

              <select
                id="fmEvidenceType"
                required
              >
                ${EVIDENCE_TYPES.map(type => `
                  <option value="${escapeHtml(type)}">
                    ${escapeHtml(type)}
                  </option>
                `).join('')}
              </select>
            </label>

            <label>
              <span>Source</span>

              <input
                id="fmEvidenceSource"
                type="text"
                placeholder="Customer interview"
                required
              >
            </label>

            <label class="fm-evidence-form-full">
              <span>Content</span>

              <textarea
                id="fmEvidenceContent"
                rows="4"
                placeholder="Describe the evidence..."
                required
              ></textarea>
            </label>

            <label>
              <span>Segment</span>

              <input
                id="fmEvidenceSegment"
                type="text"
                placeholder="Target segment"
              >
            </label>

            <label>
              <span>Persona</span>

              <input
                id="fmEvidencePersona"
                type="text"
                placeholder="Persona"
              >
            </label>

            <label>
              <span>Offer</span>

              <input
                id="fmEvidenceOffer"
                type="text"
                placeholder="Offer"
              >
            </label>

            <label>
              <span>Message</span>

              <input
                id="fmEvidenceMessage"
                type="text"
                placeholder="Message"
              >
            </label>

          </div>

          <div class="fm-evidence-form-actions">

            <button
              type="button"
              class="fm-evidence-secondary-button"
              id="fmEvidenceCancelButtonBottom"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="fm-evidence-primary-button"
            >
              Save evidence
            </button>

          </div>

        </form>

      </div>
    `;

    document.body.appendChild(modal);

    return modal;
  }

  function renderEvidenceList() {
    const modal = document.querySelector('#fmEvidenceLibraryModal');
    if (!modal) return;

    const list = modal.querySelector('#fmEvidenceList');
    const count = modal.querySelector('#fmEvidenceCount');

    const documents = Array.isArray(state.documents)
      ? state.documents
      : [];

    count.textContent = String(documents.length);

    if (!documents.length) {
      list.innerHTML = `
        <div class="fm-evidence-empty-state">
          <strong>No evidence uploaded yet.</strong>
          <span>
            Evidence uploaded from process inputs will appear here.
          </span>
        </div>
      `;

      return;
    }

    list.innerHTML = documents.map((item, index) => {
      const name =
        item.name ||
        `Evidence ${index + 1}`;

      const content =
        String(item.text || '').trim();

      const processLabel = item.processNumber
        ? `Process ${item.processNumber}${item.processTitle
            ? ` · ${item.processTitle}`
            : ''}`
        : '';

      const inputLabel = item.input
        ? `${item.inputNumber
            ? `Input ${item.inputNumber} · `
            : 'Input · '}${item.input}`
        : '';

      return `
        <article
          class="fm-evidence-library-card"
          data-document-index="${index}"
        >
          <div class="fm-evidence-library-card-top">

            <span class="fm-evidence-library-type">
              Uploaded evidence
            </span>

            <div class="fm-evidence-library-actions">
              <button
                type="button"
                data-delete-document="${index}"
              >
                Delete
              </button>
            </div>

          </div>

          <strong
            style="
              display:block;
              margin:0 0 7px;
              color:#2d2533;
              font-size:.84rem;
            "
          >
            ${escapeHtml(name)}
          </strong>

          ${content ? `
            <p class="fm-evidence-library-content">
              ${escapeHtml(content)}
            </p>
          ` : ''}

          ${(processLabel || inputLabel) ? `
            <div class="fm-evidence-library-links">

              ${processLabel ? `
                <span>
                  ${escapeHtml(processLabel)}
                </span>
              ` : ''}

              ${inputLabel ? `
                <span>
                  ${escapeHtml(inputLabel)}
                </span>
              ` : ''}

            </div>
          ` : ''}

        </article>
      `;
    }).join('');

    list
      .querySelectorAll('[data-delete-document]')
      .forEach(button => {
        button.addEventListener('click', async () => {
          const index = Number(button.dataset.deleteDocument);

          if (!Number.isInteger(index)) return;

          if (!confirm('Delete this evidence item?')) return;

          state.documents.splice(index, 1);

          render();

          await saveProgress(false);

          renderEvidenceList();

          showToast('Evidence deleted.');
        });
      });
  }

  function openModal() {
    const modal = createModal();

    modal.classList.add('is-open');

    /* Keep page scrolling enabled while Evidence modal is open. */

    renderEvidenceList();

    const form = modal.querySelector('#fmEvidenceForm');

    form.hidden = true;

    editingId = null;
  }

  function closeModal() {
    const modal = document.querySelector('#fmEvidenceLibraryModal');

    if (!modal) return;

    modal.classList.remove('is-open');

    document.body.classList.remove('fm-evidence-modal-active');

    editingId = null;
  }

  function resetForm() {
    const modal = document.querySelector('#fmEvidenceLibraryModal');
    if (!modal) return;

    const form = modal.querySelector('#fmEvidenceForm');

    form.reset();

    form.hidden = true;

    editingId = null;

    modal.querySelector('#fmEvidenceFormTitle').textContent =
      'Add evidence';
  }

  function showForm(item = null) {
    const modal = createModal();

    const form = modal.querySelector('#fmEvidenceForm');

    form.hidden = false;

    editingId = item ? item.id : null;

    modal.querySelector('#fmEvidenceFormTitle').textContent =
      item ? 'Edit evidence' : 'Add evidence';

    modal.querySelector('#fmEvidenceType').value =
      item?.type || EVIDENCE_TYPES[0];

    modal.querySelector('#fmEvidenceSource').value =
      item?.source || '';

    modal.querySelector('#fmEvidenceContent').value =
      item?.content || '';

    modal.querySelector('#fmEvidenceSegment').value =
      item?.segment || '';

    modal.querySelector('#fmEvidencePersona').value =
      item?.persona || '';

    modal.querySelector('#fmEvidenceOffer').value =
      item?.offer || '';

    modal.querySelector('#fmEvidenceMessage').value =
      item?.message || '';

    modal.querySelector('#fmEvidenceSource').focus();
  }

  function saveEvidence(event) {
    event.preventDefault();

    const modal = document.querySelector('#fmEvidenceLibraryModal');

    if (!modal) return;

    const item = {
      id: editingId || crypto.randomUUID(),

      type: modal.querySelector('#fmEvidenceType').value,

      source: modal.querySelector('#fmEvidenceSource').value.trim(),

      content: modal.querySelector('#fmEvidenceContent').value.trim(),

      segment: modal.querySelector('#fmEvidenceSegment').value.trim(),

      persona: modal.querySelector('#fmEvidencePersona').value.trim(),

      offer: modal.querySelector('#fmEvidenceOffer').value.trim(),

      message: modal.querySelector('#fmEvidenceMessage').value.trim()
    };

    if (!item.source || !item.content) {
      return;
    }

    if (editingId) {
      const index = evidenceItems.findIndex(
        existing => existing.id === editingId
      );

      if (index !== -1) {
        evidenceItems[index] = item;
      }
    } else {
      evidenceItems.unshift(item);
    }

    renderEvidenceList();

    resetForm();

    console.log('Evidence saved:', item);
  }

  function bindModalEvents() {
    const modal = createModal();

    modal
      .querySelectorAll('[data-evidence-close]')
      .forEach(button => {
        button.addEventListener('click', closeModal);
      });

    document.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        modal.classList.contains('is-open')
      ) {
        closeModal();
      }
    });
  }

  function bindEvidenceToggle() {
    const frame = getFrame();

    if (!frame) {
      console.log('Evidence frame not found yet.');
      return false;
    }

    let toggle = getToggle(frame);

    if (!toggle) {
      console.log('Evidence toggle not found.');
      return false;
    }

    const cleanToggle = toggle.cloneNode(true);

    toggle.replaceWith(cleanToggle);

    toggle = cleanToggle;

    toggle.id = 'fmEvidenceToggle';

    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      openModal();
    });

    return true;
  }

  function addStyles() {
    if (document.querySelector('#fmEvidenceLibraryModalStyles')) {
      return;
    }

    const style = document.createElement('style');

    style.id = 'fmEvidenceLibraryModalStyles';

    style.textContent = `

      #fmEvidenceLibraryModal {
        position: fixed;
        inset: 0;
        z-index: 99999;

        display: none;

        align-items: center;
        justify-content: center;

        padding: 28px;

        box-sizing: border-box;
      }

      #fmEvidenceLibraryModal.is-open {
        display: flex;
      }

      .fm-evidence-modal-backdrop {
        position: absolute;
        inset: 0;

        background: rgba(35, 25, 45, .28);

        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }

      .fm-evidence-modal-dialog {
        position: relative;
        z-index: 1;

        width: min(900px, 100%);
        max-height: min(760px, calc(100vh - 56px));

        overflow-y: auto;

        box-sizing: border-box;

        padding: 28px;

        border: 1px solid rgba(75, 29, 136, .14);
        border-radius: 22px;

        background: #fff;

        box-shadow:
          0 30px 90px rgba(39, 24, 54, .22);
      }

      .fm-evidence-modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;

        gap: 24px;

        padding-bottom: 20px;

        border-bottom: 1px solid rgba(44, 25, 70, .08);
      }

      .fm-evidence-modal-eyebrow {
        margin-bottom: 7px;

        color: #8062a6;

        font-size: .68rem;
        font-weight: 800;

        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .fm-evidence-modal-header h2 {
        margin: 0 0 7px;

        color: #2d2533;

        font-size: 1.55rem;
        line-height: 1.2;
      }

      .fm-evidence-modal-header p {
        margin: 0;

        color: rgba(42,34,47,.58);

        font-size: .78rem;
        line-height: 1.5;
      }

      .fm-evidence-modal-close {
        width: 36px;
        height: 36px;

        flex: 0 0 auto;

        border: 0;
        border-radius: 50%;

        background: #f2edf7;
        color: #4b1d88;

        font-size: 1.35rem;
        line-height: 1;

        cursor: pointer;
      }

      .fm-evidence-modal-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 16px;

        padding: 20px 0;
      }

      .fm-evidence-modal-summary {
        display: flex;
        align-items: baseline;

        gap: 6px;

        color: rgba(42,34,47,.58);

        font-size: .75rem;
      }

      .fm-evidence-modal-summary strong {
        color: #2d2533;

        font-size: 1.15rem;
      }

      .fm-evidence-add-button,
      .fm-evidence-primary-button {
        min-height: 38px;

        padding: 0 16px;

        border: 0;
        border-radius: 8px;

        background: #4b1d88;
        color: #fff;

        font: inherit;
        font-size: .75rem;
        font-weight: 700;

        cursor: pointer;
      }

      .fm-evidence-add-button:hover,
      .fm-evidence-primary-button:hover {
        background: #3d1672;
      }

      .fm-evidence-list {
        display: flex;
        flex-direction: column;

        gap: 12px;
      }

      .fm-evidence-library-card {
        padding: 17px;

        border: 1px solid rgba(44,25,70,.09);
        border-radius: 13px;

        background: #fbfafc;
      }

      .fm-evidence-library-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 12px;

        margin-bottom: 9px;
      }

      .fm-evidence-library-type {
        display: inline-flex;

        padding: 5px 9px;

        border-radius: 999px;

        background: #eee8f5;
        color: #5b3d82;

        font-size: .61rem;
        font-weight: 800;

        letter-spacing: .05em;
        text-transform: uppercase;
      }

      .fm-evidence-library-actions {
        display: flex;
        gap: 8px;
      }

      .fm-evidence-library-actions button {
        border: 0;

        background: transparent;
        color: #5b3d82;

        font: inherit;
        font-size: .7rem;
        font-weight: 700;

        cursor: pointer;
      }

      .fm-evidence-library-actions button:hover {
        text-decoration: underline;
      }

      .fm-evidence-library-source {
        margin-bottom: 7px;

        color: rgba(42,34,47,.48);

        font-size: .67rem;
      }

      .fm-evidence-library-content {
        margin: 0;

        color: rgba(42,34,47,.72);

        font-size: .78rem;
        line-height: 1.55;
      }

      .fm-evidence-library-links {
        display: flex;
        flex-wrap: wrap;

        gap: 6px;

        margin-top: 13px;
      }

      .fm-evidence-library-links span {
        padding: 5px 8px;

        border: 1px solid rgba(75,29,136,.10);
        border-radius: 7px;

        background: #fff;

        color: rgba(42,34,47,.56);

        font-size: .63rem;
      }

      .fm-evidence-empty-state {
        display: flex;
        flex-direction: column;

        align-items: center;

        gap: 5px;

        padding: 38px 20px;

        border: 1px dashed rgba(44,25,70,.14);
        border-radius: 13px;

        color: rgba(42,34,47,.5);

        text-align: center;

        font-size: .76rem;
      }

      .fm-evidence-empty-state strong {
        color: #2d2533;
      }

      .fm-evidence-form {
        margin-top: 18px;

        padding-top: 22px;

        border-top: 1px solid rgba(44,25,70,.08);
      }

      .fm-evidence-form-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 16px;

        margin-bottom: 18px;
      }

      .fm-evidence-form-header h3 {
        margin: 0;

        color: #2d2533;

        font-size: 1rem;
      }

      .fm-evidence-form-cancel,
      .fm-evidence-secondary-button {
        border: 0;

        background: transparent;
        color: #5b3d82;

        font: inherit;
        font-size: .72rem;
        font-weight: 700;

        cursor: pointer;
      }

      .fm-evidence-form-grid {
        display: grid;

        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap: 14px;
      }

      .fm-evidence-form-grid label {
        display: flex;
        flex-direction: column;

        gap: 6px;
      }

      .fm-evidence-form-grid label span {
        color: #4a4051;

        font-size: .68rem;
        font-weight: 700;
      }

      .fm-evidence-form-grid input,
      .fm-evidence-form-grid select,
      .fm-evidence-form-grid textarea {
        width: 100%;

        box-sizing: border-box;

        padding: 10px 11px;

        border: 1px solid rgba(44,25,70,.14);
        border-radius: 8px;

        background: #fff;
        color: #30283a;

        font: inherit;
        font-size: .75rem;

        outline: none;
      }

      .fm-evidence-form-grid textarea {
        resize: vertical;
      }

      .fm-evidence-form-grid input:focus,
      .fm-evidence-form-grid select:focus,
      .fm-evidence-form-grid textarea:focus {
        border-color: rgba(75,29,136,.42);

        box-shadow:
          0 0 0 3px rgba(75,29,136,.07);
      }

      .fm-evidence-form-full {
        grid-column: 1 / -1;
      }

      .fm-evidence-form-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;

        gap: 15px;

        margin-top: 18px;
      }

      @media (max-width: 760px) {

        #fmEvidenceLibraryModal {
          padding: 14px;
        }

        .fm-evidence-modal-dialog {
          max-height: calc(100vh - 28px);

          padding: 20px;

          border-radius: 17px;
        }

        .fm-evidence-form-grid {
          grid-template-columns: 1fr;
        }

        .fm-evidence-form-full {
          grid-column: auto;
        }

        .fm-evidence-modal-toolbar {
          align-items: flex-start;
          flex-direction: column;
        }

      }

    `;

    document.head.appendChild(style);
  }

  function setup() {
    addStyles();

    createModal();

    bindModalEvents();

    if (bindEvidenceToggle()) {
      console.log('Evidence library modal initialized.');
      return;
    }

    setTimeout(setup, 500);
  }

  setup();

})();


(() => {
  const style = document.createElement('style');

  style.textContent = `
    section.map-progress {
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }

    section.map-progress + section.map-layout {
      margin-top: 32px !important;
      padding-top: 0 !important;
    }

    section.map-progress + section.map-layout .map-card,
    section.map-progress + section.map-layout .right-column-stack {
      margin-top: 0 !important;
    }

    section.map-progress + section.map-layout {
      position: relative !important;
      top: 0 !important;
    }

    section.map-progress {
      transform: none !important;
    }
  `;

  document.head.appendChild(style);
})();



/* ===== PROCESS INPUT / OUTPUT TABS ===== */

(() => {
  function setupProcessTabs() {
    const card = document.querySelector('.map-card');
    const layout = document.querySelector('.map-layout');
    const purpose = document.querySelector('#stepPurpose');
    const outputPanel = document.querySelector('.output-panel');

    const inputSections = Array.from(
      document.querySelectorAll('.map-card > .map-section')
    );

    const runButton = document.querySelector('#runAnalysis');
    const outputEmpty = document.querySelector('#outputEmpty');
    const analysisOutput = document.querySelector('#analysisOutput');
    const expandOutput = document.querySelector('#expandOutput');

    if (
      !card ||
      !layout ||
      !purpose ||
      !outputPanel ||
      !inputSections.length ||
      !runButton ||
      !outputEmpty ||
      !analysisOutput
    ) {
      return;
    }

    if (document.querySelector('.process-tabs')) {
      return;
    }

    /*
     * Turn the existing Process layout into one full-width
     * Inputs / Outputs workspace.
     */
    layout.classList.add('process-tabs-layout');
    outputPanel.classList.add('process-output-source');

    // --------------------------------------------------------
    // Tabs
    // --------------------------------------------------------

    const tabs = document.createElement('div');

    tabs.className = 'process-tabs';
    tabs.setAttribute('role', 'tablist');

    tabs.innerHTML = `
      <button
        class="process-tab active"
        id="processInputsTabButton"
        type="button"
        role="tab"
        aria-selected="true"
        aria-controls="processInputsTab"
      >
        Inputs
      </button>

      <button
        class="process-tab"
        id="processOutputsTabButton"
        type="button"
        role="tab"
        aria-selected="false"
        aria-controls="processOutputsTab"
      >
        Outputs
      </button>
    `;

    // --------------------------------------------------------
    // Inputs panel
    // --------------------------------------------------------

    const inputsPanel = document.createElement('section');

    inputsPanel.className =
      'process-tab-panel process-inputs-tab';

    inputsPanel.id = 'processInputsTab';

    inputsPanel.setAttribute('role', 'tabpanel');
    inputsPanel.setAttribute(
      'aria-labelledby',
      'processInputsTabButton'
    );

    const inputsContent = document.createElement('div');

    inputsContent.className =
      'process-inputs-content';

    inputSections.forEach(section => {
      inputsContent.appendChild(section);
    });

    inputsContent.appendChild(runButton);

    inputsPanel.appendChild(inputsContent);

    // --------------------------------------------------------
    // Outputs panel
    // --------------------------------------------------------

    const outputsPanel = document.createElement('section');

    outputsPanel.className =
      'process-tab-panel process-output-tab';

    outputsPanel.id = 'processOutputsTab';

    outputsPanel.hidden = true;

    outputsPanel.setAttribute('role', 'tabpanel');

    outputsPanel.setAttribute(
      'aria-labelledby',
      'processOutputsTabButton'
    );

    /*
     * Move the EXISTING generated output into the Outputs tab.
     * This means the existing AI/API logic continues working.
     */
    if (expandOutput) {
      outputsPanel.appendChild(expandOutput);
    }

    outputsPanel.appendChild(outputEmpty);
    outputsPanel.appendChild(analysisOutput);

    // --------------------------------------------------------
    // Insert into Process card
    // --------------------------------------------------------

    purpose.insertAdjacentElement(
      'afterend',
      tabs
    );

    tabs.insertAdjacentElement(
      'afterend',
      inputsPanel
    );

    inputsPanel.insertAdjacentElement(
      'afterend',
      outputsPanel
    );

    // --------------------------------------------------------
    // Tab switching
    // --------------------------------------------------------

    const inputButton =
      document.querySelector('#processInputsTabButton');

    const outputButton =
      document.querySelector('#processOutputsTabButton');

    function selectTab(tab) {
      const showInputs = tab === 'inputs';

      inputButton.classList.toggle(
        'active',
        showInputs
      );

      outputButton.classList.toggle(
        'active',
        !showInputs
      );

      inputButton.setAttribute(
        'aria-selected',
        String(showInputs)
      );

      outputButton.setAttribute(
        'aria-selected',
        String(!showInputs)
      );

      inputsPanel.hidden = !showInputs;
      outputsPanel.hidden = showInputs;
    }

    inputButton.addEventListener(
      'click',
      () => selectTab('inputs')
    );

    outputButton.addEventListener(
      'click',
      () => selectTab('outputs')
    );

    console.log(
      '✓ Process Inputs / Outputs tabs initialized'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      setupProcessTabs,
      { once: true }
    );
  } else {
    setupProcessTabs();
  }
})();

/* =========================================================
   PROCESS INPUT / OUTPUT TABS
   ========================================================= */

(() => {
  function setupProcessTabs() {
    const inputsTab = document.getElementById('inputsTab');
    const outputsTab = document.getElementById('outputsTab');
    const inputsPanel = document.getElementById('inputsPanel');
    const outputsPanel = document.getElementById('outputsPanel');
    const outputState = document.querySelector('.fm-output-state');
    const realOutput = document.querySelector('.fm-real-output');

    if (
      !inputsTab ||
      !outputsTab ||
      !inputsPanel ||
      !outputsPanel
    ) return;

    function showInputs() {
      inputsTab.classList.add('active');
      outputsTab.classList.remove('active');

      inputsTab.setAttribute('aria-selected', 'true');
      outputsTab.setAttribute('aria-selected', 'false');

      inputsPanel.style.display = '';
      outputsPanel.style.display = 'none';

      outputsPanel.style.removeProperty('grid-column');
      outputsPanel.style.removeProperty('width');
      outputsPanel.style.removeProperty('max-width');

      /*
       * Marks that we are NOT on the dedicated Outputs tab, so the
       * six-tile AI summary renders as the compact vertical preview
       * next to Inputs instead of the full horizontal Outputs layout.
       */
      outputsPanel.classList.remove('fm-outputs-tab-active');

      const actions = document.getElementById('processOutputActions');

      if (actions) {
        actions.style.removeProperty('display');
      }

      if (outputState) {
        outputState.classList.remove('fm-output-empty-centered');
      }
    }

    function showOutputs() {
      inputsTab.classList.remove('active');
      outputsTab.classList.add('active');

      inputsTab.setAttribute('aria-selected', 'false');
      outputsTab.setAttribute('aria-selected', 'true');

      inputsPanel.style.display = 'none';

      outputsPanel.style.display = 'block';
      outputsPanel.style.gridColumn = '1 / -1';
      outputsPanel.style.width = '100%';
      outputsPanel.style.maxWidth = 'none';

      /*
       * On the Outputs tab, restore the original full-width,
       * horizontal six-tile layout.
       */
      outputsPanel.classList.add('fm-outputs-tab-active');

      const actions = document.getElementById('processOutputActions');

      if (actions) {
        actions.style.setProperty(
          'display',
          'none',
          'important'
        );
      }

      if (
        outputState &&
        (!realOutput || getComputedStyle(realOutput).display === 'none')
      ) {
        outputState.classList.add('fm-output-empty-centered');
      }
    }

    inputsTab.onclick = showInputs;
    outputsTab.onclick = showOutputs;

    showInputs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProcessTabs);
  } else {
    setupProcessTabs();
  }
})();













(function() {
  const styleId = 'input-layout-safe-fix';

  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `
    #inputList .input-source {
      display: flex !important;
      align-items: flex-start !important;
      gap: 24px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    #inputList .input-source .input-icon {
      flex: 0 0 50px !important;
      width: 50px !important;
      height: 50px !important;
      min-width: 50px !important;
      min-height: 50px !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 14px !important;
      box-sizing: border-box !important;
      color: #5b21d6 !important;
      background: #f5efff !important;
      border: 1px solid #e4d4ff !important;
    }

    #inputList .input-source .input-icon svg {
      width: 27px !important;
      height: 27px !important;
      display: block !important;
    }

    #inputList .input-source .input-content {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      width: auto !important;
    }

    #inputList .input-source .input-heading {
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 20px !important;
      width: 100% !important;
      margin: 0 !important;
    }

    #inputList .input-source .input-label {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      display: block !important;
      margin: 0 !important;
      line-height: 1.45 !important;
      text-align: left !important;
      word-break: normal !important;
      overflow-wrap: break-word !important;
    }

    #inputList .input-source .input-heading small {
      flex: 0 0 auto !important;
      margin: 2px 0 0 auto !important;
      white-space: nowrap !important;
    }

    #inputList .input-source .add-source-inline {
      display: block !important;
      margin: 10px 0 0 !important;
    }

    #inputList .input-source .source-chips {
      margin-top: 8px !important;
    }
  `;

  document.head.appendChild(style);
})();




(function threeInputAlignmentFix() {
  const styleId = 'three-input-alignment-fix';

  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `
    /* Align only the final three input cards with the inputs above */
    #inputList .input-source[data-final-three] {
      gap: 24px !important;
    }

    #inputList .input-source[data-final-three] > .input-icon {
      margin-left: -74px !important;
    }

    #inputList .input-source[data-final-three] > .input-content {
      margin-left: 0 !important;
    }
  `;

  document.head.appendChild(style);
})();



(function() {
  const styleId = 'remove-input-source-pseudo-icon';

  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `
    #inputList .input-source::before,
    #inputList .input-source::after {
      content: none !important;
      display: none !important;
    }
  `;

  document.head.appendChild(style);
})();


/* RESTORE INPUT ICON ALIGNMENT */
(function() {
  const styleId = 'restore-input-icon-alignment';

  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `
    #inputList .input-source {
      position: relative !important;
      padding-left: 0 !important;
    }

    #inputList .input-source > .input-icon {
      flex: 0 0 50px !important;
      width: 50px !important;
      height: 50px !important;
      min-width: 50px !important;
      min-height: 50px !important;
      margin: 0 !important;
      position: relative !important;
      left: 0 !important;
      transform: none !important;
    }

    #inputList .input-source > .input-content {
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
  `;

  document.head.appendChild(style);
})();

/* ===== PROCESS 3 VISUAL FIX ONLY ===== */
(function () {
  const STYLE_ID = 'process3-visual-fix';

  function applyProcess3Visual() {
    let style = document.getElementById(STYLE_ID);

    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    const isProcess3 =
      typeof state !== 'undefined' &&
      Number(state.step) === 2;

    style.textContent = isProcess3 ? `
      /* Keep Process 3 cards aligned with the original card frame */
      #inputList .input-source {
        box-sizing: border-box !important;
        padding: 14px 16px !important;
        display: flex !important;
        align-items: center !important;
        gap: 0 !important;
      }

      /* Icon frame: inset from card edge */
      #inputList .input-source > .input-icon {
        flex: 0 0 50px !important;
        width: 50px !important;
        height: 50px !important;
        min-width: 50px !important;
        min-height: 50px !important;
        margin: 0 20px 0 0 !important;
        border-radius: 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
      }

      /* Keep the actual SVG centered */
      #inputList .input-source > .input-icon svg {
        width: 24px !important;
        height: 24px !important;
        display: block !important;
      }

      /* Bigger input titles */
      #inputList .input-source .input-label {
        font-size: 17px !important;
        line-height: 1.35 !important;
        font-weight: 600 !important;
      }

      /* Content starts cleanly after icon */
      #inputList .input-source .input-content {
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }

      #inputList .input-source .input-heading {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16px !important;
      }

      #inputList .input-source .add-source-inline {
        margin-top: 8px !important;
      }

      #inputList .input-source .source-chips {
        margin-top: 5px !important;
      }
    ` : '';
  }

  applyProcess3Visual();

  if (!window.__process3VisualWatcher) {
    window.__process3VisualWatcher = setInterval(applyProcess3Visual, 250);
  }
})();

/* PROCESS 3 - FINAL CARD ALIGNMENT */
(function () {
  const STYLE_ID = 'process3-final-card-alignment';

  function fixProcess3() {
    if (typeof state === 'undefined' || Number(state.step) !== 2) return;

    let style = document.getElementById(STYLE_ID);

    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    style.textContent = `
      #inputList .input-source {
        box-sizing: border-box !important;
        padding: 14px 16px !important;
        display: flex !important;
        align-items: center !important;
      }

      #inputList .input-source > .input-icon {
        position: static !important;
        flex: 0 0 50px !important;
        width: 50px !important;
        height: 50px !important;
        min-width: 50px !important;
        min-height: 50px !important;
        margin: 0 24px 0 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      #inputList .input-source > .input-content {
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }

      #inputList .input-source .input-label {
        font-size: 17px !important;
        line-height: 1.35 !important;
        font-weight: 600 !important;
      }

      #inputList .input-source .input-heading {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
    `;
  }

  fixProcess3();
  setInterval(fixProcess3, 300);
})();

/* ============================================================
   FINAL INPUT CARD DESIGN OVERRIDE
   Applies consistently to Process 2 + Process 3
   ============================================================ */
(function finalInputCardDesign() {
  function applyFinalInputDesign() {
    const styleId = 'final-input-card-design-override';

    document.getElementById(styleId)?.remove();

    const style = document.createElement('style');
    style.id = styleId;

    style.textContent = `
      /* CARD */
      #inputList .input-source {
        display: flex !important;
        align-items: center !important;
        gap: 24px !important;

        box-sizing: border-box !important;
        width: 100% !important;

        padding: 22px 24px !important;
        min-height: 122px !important;

        margin: 0 0 24px 0 !important;

        position: relative !important;
        left: auto !important;
        right: auto !important;
        transform: none !important;
      }

      /* ICON FRAME */
      #inputList .input-source > .input-icon {
        position: relative !important;
        inset: auto !important;
        transform: none !important;

        flex: 0 0 58px !important;
        width: 58px !important;
        height: 58px !important;
        min-width: 58px !important;
        min-height: 58px !important;

        margin: 0 !important;

        display: flex !important;
        align-items: center !important;
        justify-content: center !important;

        align-self: center !important;

        box-sizing: border-box !important;
      }

      /* ICON ITSELF */
      #inputList .input-source > .input-icon svg {
        width: 27px !important;
        height: 27px !important;

        display: block !important;

        margin: 0 !important;
      }

      /* CONTENT */
      #inputList .input-source > .input-content {
        flex: 1 1 auto !important;
        min-width: 0 !important;

        margin: 0 !important;
        padding: 0 !important;

        align-self: center !important;
      }

      /* HEADING */
      #inputList .input-source .input-heading {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;

        width: 100% !important;

        gap: 18px !important;

        margin: 0 !important;
        padding: 0 !important;
      }

      /* TITLE */
      #inputList .input-source .input-label {
        font-size: 16px !important;
        line-height: 1.4 !important;
        font-weight: 600 !important;

        margin: 0 !important;
        padding: 0 !important;
      }

      /* REQUIRED */
      #inputList .input-source .input-heading small {
        flex: 0 0 auto !important;

        font-size: 10px !important;
        line-height: 1.3 !important;

        margin: 2px 0 0 0 !important;
        padding: 0 !important;
      }

      /* ADD INFORMATION */
      #inputList .input-source .add-source-inline {
        display: inline-block !important;

        margin: 9px 0 0 0 !important;
        padding: 0 !important;
      }

      /* NO INFORMATION */
      #inputList .input-source .source-chips,
      #inputList .input-source .no-sources {
        margin: 6px 0 0 0 !important;
        padding: 0 !important;
      }

      /* REMOVE ANY OLD POSITIONING */
      #inputList .input-source::before,
      #inputList .input-source::after {
        transform: none !important;
      }

      /* MOBILE */
      @media (max-width: 700px) {
        #inputList .input-source {
          gap: 18px !important;
          padding: 18px !important;
          min-height: 110px !important;
          margin-bottom: 20px !important;
        }

        #inputList .input-source > .input-icon {
          flex-basis: 54px !important;
          width: 54px !important;
          height: 54px !important;
          min-width: 54px !important;
          min-height: 54px !important;
        }

        #inputList .input-source > .input-icon svg {
          width: 25px !important;
          height: 25px !important;
        }

        #inputList .input-source .input-label {
          font-size: 15px !important;
        }
      }
    `;

    document.head.appendChild(style);
    console.log('FINAL INPUT CARD DESIGN APPLIED');
  }

  /*
   * Delay one tick so this override is inserted AFTER
   * the existing runtime CSS injected by app.js.
   */
  setTimeout(applyFinalInputDesign, 0);
})();

/* ============================================================
   PROCESS 3 — ICON ONLY FIX
   Change ONLY "Current customer & prospect data*" icon.
   No layout / spacing / typography changes.
   ============================================================ */
(function process3IconOnlyFix() {

  const newIcon = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="7" ry="3"></ellipse>
      <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"></path>
      <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"></path>
      <path d="M8 9h.01"></path>
      <path d="M8 16h.01"></path>
    </svg>
  `;

  function changeOnlyTargetIcon() {
    const cards = document.querySelectorAll('#inputList .input-source');

    cards.forEach(card => {
      const label = card.querySelector('.input-label');

      if (!label) return;

      const text = label.textContent.trim();

      if (text === 'Current customer & prospect data*') {
        const icon = card.querySelector('.input-icon');

        if (!icon) return;

        // Guard against re-applying: without this check, setting
        // innerHTML below is itself a DOM mutation that the
        // MutationObserver below reacts to, which calls this
        // function again, which mutates again — an infinite loop
        // that pegs the CPU and freezes the tab.
        if (icon.dataset.processThreeIconFixed === '1') return;

        icon.innerHTML = newIcon;
        icon.dataset.processThreeIconFixed = '1';

        console.log(
          'ICON ONLY FIXED:',
          'Current customer & prospect data*'
        );
      }
    });
  }

  changeOnlyTargetIcon();

  const observer = new MutationObserver(() => {
    changeOnlyTargetIcon();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();

/* =========================================================
   QUESTION + HISTORY UI REFRESH
   Scoped only to Key Questions and Previous Searches.
   Does not modify inputs, processes, login, logout, or other sections.
   ========================================================= */

(() => {
  if (document.getElementById('question-history-ui-refresh')) return;

  const style = document.createElement('style');
  style.id = 'question-history-ui-refresh';

  style.textContent = `
    /* ---------- Key Questions ---------- */

    .ui-refresh-questions {
      background: #ffffff !important;
      border: 1px solid #e7dcf8 !important;
      border-radius: 22px !important;
      padding: 30px 32px !important;
      box-shadow: 0 8px 28px rgba(70, 38, 120, 0.06) !important;
      box-sizing: border-box !important;
    }

    .ui-refresh-questions .question-item {
      display: flex !important;
      align-items: center !important;
      gap: 22px !important;
      min-height: 78px !important;
      padding: 10px 4px !important;
      border-bottom: 1px solid #eee7f7 !important;
      box-sizing: border-box !important;
      position: relative !important;
    }

    .ui-refresh-questions .question-item:last-child {
      border-bottom: none !important;
    }

    .ui-refresh-questions .question-item > b {
      flex: 0 0 48px !important;
      width: 48px !important;
      height: 48px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 8px !important;
      background: #f5edff !important;
      color: #5520bd !important;
      font-size: 16px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
    }

    .ui-refresh-questions .question-item > p {
      flex: 1 !important;
      margin: 0 !important;
      color: #242035 !important;
      font-size: 16px !important;
      line-height: 1.45 !important;
      font-weight: 500 !important;
      padding-right: 28px !important;
    }

    .ui-refresh-questions .question-arrow {
      position: absolute !important;
      right: 4px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: #251a3c !important;
      font-size: 24px !important;
      font-weight: 400 !important;
    }

    .ui-refresh-question-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 8px 14px !important;
      border-radius: 10px !important;
      background: #f5edff !important;
      color: #5520bd !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      letter-spacing: .02em !important;
      white-space: nowrap !important;
    }

    /* ---------- Shared Key Questions / History layout ---------- */

    .ui-refresh-question-history-grid {
      display: grid !important;
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.25fr) !important;
      gap: 18px !important;
      align-items: stretch !important;
    }

    /* ---------- Previous Searches ---------- */

    .ui-refresh-history {
      background: #ffffff !important;
      border: 1px solid #e7dcf8 !important;
      border-radius: 22px !important;
      padding: 30px 28px !important;
      box-shadow: 0 8px 28px rgba(70, 38, 120, 0.06) !important;
      box-sizing: border-box !important;
    }

    .ui-refresh-history-item {
      background: #ffffff !important;
      border: 1px solid #e9e3f2 !important;
      border-radius: 15px !important;
      padding: 20px 22px !important;
      margin-top: 12px !important;
      box-shadow: 0 3px 12px rgba(50, 30, 90, 0.025) !important;
      box-sizing: border-box !important;
      transition: border-color .15s ease, box-shadow .15s ease !important;
    }

    .ui-refresh-history-item:hover {
      border-color: #d7c3f4 !important;
      box-shadow: 0 7px 18px rgba(70, 38, 120, 0.07) !important;
    }

    .ui-refresh-history-item a,
    .ui-refresh-history-item button {
      color: #5520bd !important;
      font-weight: 700 !important;
    }

    .ui-refresh-history-status {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      margin-top: 9px !important;
      padding: 6px 10px !important;
      border-radius: 8px !important;
      background: #eef9f0 !important;
      color: #16803a !important;
      font-size: 12px !important;
      font-weight: 700 !important;
    }

    @media (max-width: 900px) {
      .ui-refresh-question-history-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  document.head.appendChild(style);

  function findExactText(text) {
    return [...document.querySelectorAll('h1,h2,h3,h4,h5,p,span,div')]
      .find(el => el.children.length === 0 && el.textContent.trim() === text);
  }

  function closestCard(element) {
    if (!element) return null;

    let current = element;

    for (let i = 0; i < 7 && current; i++) {
      if (
        current.matches &&
        (
          current.matches('section') ||
          current.matches('article') ||
          /card|panel|history|question/i.test(current.className || '')
        )
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return element.parentElement?.parentElement || null;
  }

  function applyQuestionHistoryDesign() {
    const questionList = document.getElementById('questionList');

    if (!questionList) return;

    const questionCard =
      closestCard(questionList) ||
      questionList.parentElement;

    if (questionCard) {
      questionCard.classList.add('ui-refresh-questions');

      if (!questionCard.querySelector('.ui-refresh-question-badge')) {
        const badge = document.createElement('span');
        badge.className = 'ui-refresh-question-badge';
        badge.textContent = `${questionList.querySelectorAll('.question-item').length || 5} QUESTIONS`;

        const heading =
          questionCard.querySelector('h1,h2,h3,h4');

        if (heading) {
          heading.insertAdjacentElement('afterend', badge);
        }
      }
    }

    questionList.querySelectorAll('.question-item').forEach(item => {
      if (!item.querySelector('.question-arrow')) {
        const arrow = document.createElement('span');
        arrow.className = 'question-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '›';
        item.appendChild(arrow);
      }
    });

    const historyHeading = findExactText('Previous searches');

    if (!historyHeading) return;

    const historyCard = closestCard(historyHeading);

    if (!historyCard) return;

    historyCard.classList.add('ui-refresh-history');

    const resultLinks = [
      ...historyCard.querySelectorAll('a,button')
    ].filter(el =>
      el.textContent.trim().toLowerCase().includes('view result')
    );

    resultLinks.forEach(link => {
      const item = closestCard(link);

      if (item && item !== historyCard) {
        item.classList.add('ui-refresh-history-item');
      }
    });

    const qParent = questionCard?.parentElement;
    const hParent = historyCard.parentElement;

    if (qParent && qParent === hParent) {
      qParent.classList.add('ui-refresh-question-history-grid');
    }
  }

  applyQuestionHistoryDesign();

  const observer = new MutationObserver(() => {
    applyQuestionHistoryDesign();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();


/* =========================================================
   FINAL FIX — KEY QUESTIONS + PREVIOUS SEARCHES ONLY
   ========================================================= */

(() => {
  const styleId = 'final-question-history-layout-fix';

  if (document.getElementById(styleId)) {
    document.getElementById(styleId).remove();
  }

  const style = document.createElement('style');
  style.id = styleId;

  style.textContent = `
    /* ===== KEY QUESTIONS ===== */

    .ui-refresh-questions {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    .ui-refresh-questions #questionList,
    .ui-refresh-questions .question-list {
      width: 100% !important;
      min-width: 0 !important;
      display: block !important;
    }

    .ui-refresh-questions .question-item {
      width: 100% !important;
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: 48px minmax(0, 1fr) 20px !important;
      align-items: center !important;
      column-gap: 20px !important;
      min-height: 78px !important;
      padding: 10px 4px !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    .ui-refresh-questions .question-item > b {
      grid-column: 1 !important;
      grid-row: 1 !important;
      width: 48px !important;
      height: 48px !important;
      flex: none !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }

    .ui-refresh-questions .question-item > p {
      grid-column: 2 !important;
      grid-row: 1 !important;
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      white-space: normal !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
      font-size: 16px !important;
      line-height: 1.45 !important;
      font-weight: 500 !important;
    }

    .ui-refresh-questions .question-arrow {
      grid-column: 3 !important;
      grid-row: 1 !important;
      position: static !important;
      transform: none !important;
      justify-self: end !important;
      margin: 0 !important;
      padding: 0 !important;
      font-size: 25px !important;
      line-height: 1 !important;
    }


    /* ===== PREVIOUS SEARCHES ===== */

    .ui-refresh-history {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    .ui-refresh-history-item {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }


    /* ===== FORCE THE TWO SECTIONS INTO A CLEAN 2-COLUMN AREA ===== */

    .ui-refresh-question-history-grid {
      width: 100% !important;
      max-width: none !important;
      display: grid !important;
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.25fr) !important;
      gap: 18px !important;
      align-items: stretch !important;
      box-sizing: border-box !important;
    }

    .ui-refresh-question-history-grid > * {
      min-width: 0 !important;
      width: 100% !important;
      max-width: none !important;
      box-sizing: border-box !important;
    }


    /* ===== HISTORY HEADER ===== */

    .ui-refresh-history h1,
    .ui-refresh-history h2,
    .ui-refresh-history h3,
    .ui-refresh-history h4 {
      margin-top: 0 !important;
    }


    /* ===== HISTORY ITEM CONTENT ===== */

    .ui-refresh-history-item {
      display: block !important;
      min-height: 105px !important;
      padding: 20px 22px !important;
    }

    .ui-refresh-history-item p {
      max-width: none !important;
    }


    /* ===== RESPONSIVE ===== */

    @media (max-width: 900px) {
      .ui-refresh-question-history-grid {
        grid-template-columns: 1fr !important;
      }

      .ui-refresh-questions .question-item {
        grid-template-columns: 44px minmax(0, 1fr) 18px !important;
        column-gap: 15px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();







/* PREVIOUS_HISTORY_FINAL_SOURCE_DESIGN */
(() => {
  const STYLE_ID = 'previousHistoryCleanFinal';

  const old = document.getElementById(STYLE_ID);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    /* =====================================================
       PREVIOUS HISTORY ONLY
       Do not affect Questions or parent two-column layout
       ===================================================== */

    #previousSearches {
      box-sizing: border-box !important;
    }

    #previousSearches .previous-searches-header {
      width: 100% !important;
      min-height: 96px !important;
      padding: 26px 30px 22px !important;
      margin: 0 !important;
      box-sizing: border-box !important;

      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      grid-template-rows: auto auto !important;
      column-gap: 20px !important;
      align-items: start !important;

      border-bottom: 1px solid #eee9f3 !important;
    }

    #previousSearches .previous-searches-header .eyebrow {
      grid-column: 1 !important;
      grid-row: 1 !important;
      margin: 0 0 6px !important;
    }

    #previousSearches .previous-searches-header h3 {
      grid-column: 1 !important;
      grid-row: 2 !important;
      margin: 0 !important;
    }

    #previousSearches #historyCount {
      grid-column: 2 !important;
      grid-row: 1 / span 2 !important;
      align-self: center !important;

      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      min-width: 54px !important;
      height: 32px !important;
      padding: 0 12px !important;

      border: 0 !important;
      border-radius: 999px !important;
      background: #f5efff !important;

      color: #5724c8 !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
    }

    #previousSearches #historyList {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;

      margin: 0 !important;
      padding: 28px 30px 30px !important;

      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;

      box-sizing: border-box !important;
    }

    /* Empty state: ONE clean centered area, no inner card */
    #previousSearches #historyList > .history-empty {
      width: 100% !important;
      max-width: none !important;

      height: auto !important;
      min-height: 360px !important;
      max-height: none !important;

      margin: 0 !important;
      padding: 44px 32px !important;

      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0 !important;

      box-sizing: border-box !important;

      border: 0 !important;
      outline: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;

      text-align: center !important;

      grid-template-columns: none !important;
      grid-template-rows: none !important;
    }

    #previousSearches .history-empty-icon {
      width: 72px !important;
      height: 72px !important;

      margin: 0 0 20px !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 72px !important;

      border: 0 !important;
      border-radius: 50% !important;
      background: #f5efff !important;
      box-shadow: none !important;
    }

    #previousSearches .history-empty-icon svg {
      width: 30px !important;
      height: 30px !important;
    }

    #previousSearches .history-empty-title {
      width: 100% !important;
      max-width: 420px !important;

      margin: 0 0 9px !important;

      color: #292332 !important;
      font-size: 18px !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
      text-align: center !important;
    }

    #previousSearches .history-empty-description {
      width: 100% !important;
      max-width: 390px !important;

      margin: 0 auto !important;

      color: #8d8795 !important;
      font-size: 14px !important;
      font-weight: 400 !important;
      line-height: 1.55 !important;
      text-align: center !important;
    }

    /* Generated history entries */
    #previousSearches #historyList > .history-item {
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;

      margin: 0 !important;
      padding: 18px 20px !important;

      border: 1px solid #eee9f3 !important;
      border-radius: 14px !important;
      background: #ffffff !important;
      box-shadow: none !important;
    }
  `;

  document.head.appendChild(style);

  function cleanHistoryInlineStyles() {
    const history = document.querySelector('#previousSearches');
    if (!history) return;

    const list = history.querySelector('#historyList');
    const empty = list?.querySelector(':scope > .history-empty');

    if (list) {
      list.style.setProperty('width', '100%', 'important');
      list.style.setProperty('max-width', 'none', 'important');
    }

    if (empty) {
      empty.style.setProperty('display', 'flex', 'important');
      empty.style.setProperty('flex-direction', 'column', 'important');
      empty.style.setProperty('align-items', 'center', 'important');
      empty.style.setProperty('justify-content', 'center', 'important');

      empty.style.setProperty('width', '100%', 'important');

      empty.style.setProperty('height', 'auto', 'important');
      empty.style.setProperty('min-height', '360px', 'important');
      empty.style.setProperty('max-height', 'none', 'important');

      empty.style.setProperty('border', '0', 'important');
      empty.style.setProperty('outline', '0', 'important');
      empty.style.setProperty('background', 'transparent', 'important');
      empty.style.setProperty('box-shadow', 'none', 'important');

      empty.style.setProperty('grid-template-columns', 'none', 'important');
      empty.style.setProperty('grid-template-rows', 'none', 'important');
    }
  }

  cleanHistoryInlineStyles();

  setTimeout(cleanHistoryInlineStyles, 100);
  setTimeout(cleanHistoryInlineStyles, 400);
  setTimeout(cleanHistoryInlineStyles, 900);
})();


/* =========================================================
   HISTORY EMPTY STATE — ALIGNMENT ONLY
   Do not modify Questions or outer History layout
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyEmptyAlignmentOnly';

  style.textContent = `
    #previousSearches #historyList > .history-empty {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;

      width: 100% !important;
      min-height: 360px !important;

      padding: 40px !important;
      box-sizing: border-box !important;

      text-align: center !important;
    }

    #previousSearches #historyList > .history-empty > * {
      position: static !important;
      float: none !important;
      flex: none !important;
      align-self: center !important;

      width: auto !important;
      max-width: 420px !important;

      margin-left: auto !important;
      margin-right: auto !important;

      transform: none !important;
    }

    #previousSearches #historyList > .history-empty > .history-empty-icon {
      width: 72px !important;
      height: 72px !important;
      min-width: 72px !important;
      max-width: 72px !important;

      margin: 0 auto 20px !important;
    }

    #previousSearches #historyList > .history-empty > .history-empty-title {
      width: 100% !important;
      max-width: 420px !important;

      margin: 0 auto 8px !important;

      text-align: center !important;
    }

    #previousSearches #historyList > .history-empty > .history-empty-description {
      width: 100% !important;
      max-width: 390px !important;

      margin: 0 auto !important;

      text-align: center !important;
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — HEADER SPACING ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'previousHistoryHeaderSpacingOnly';

  style.textContent = `
    #previousSearches .previous-searches-header {
      width: 100% !important;
      box-sizing: border-box !important;

      padding: 26px 30px 22px !important;
      margin: 0 !important;

      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      grid-template-rows: auto auto !important;

      column-gap: 20px !important;
      align-items: start !important;

      border-bottom: 1px solid #eee9f3 !important;
    }

    #previousSearches .previous-searches-header > div {
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    #previousSearches .previous-searches-header .eyebrow {
      margin: 0 0 6px !important;
      padding: 0 !important;

      grid-column: 1 !important;
      grid-row: 1 !important;
    }

    #previousSearches .previous-searches-header h3 {
      margin: 0 !important;
      padding: 0 !important;

      grid-column: 1 !important;
      grid-row: 2 !important;

      line-height: 1.2 !important;
    }

    #previousSearches #historyCount {
      grid-column: 2 !important;
      grid-row: 1 / span 2 !important;

      align-self: center !important;
      justify-self: end !important;

      margin: 0 !important;
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   OUTPUT EMPTY STATE — GRID CENTER ONLY
   Active only when Outputs tab is selected
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'outputEmptyGridCenterOnly';

  style.textContent = `
    #outputsPanel .fm-output-state.fm-output-empty-centered {
      grid-column: 1 / -1 !important;
      grid-row: auto !important;

      justify-self: stretch !important;
      align-self: stretch !important;

      width: 100% !important;
      max-width: none !important;

      position: static !important;
      transform: none !important;

      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;

      text-align: center !important;
    }
  `;

  document.head.appendChild(style);
})();


/* =========================================================
   HIDE PROCESS NAVIGATION BUTTONS ONLY
   ========================================================= */
(() => {
  function hideProcessNavigationButtons() {
    const previousButton = document.getElementById('prevStep');
    const nextButton = document.getElementById('nextStep');

    if (previousButton) {
      previousButton.style.setProperty(
        'display',
        'none',
        'important'
      );
    }

    if (nextButton) {
      nextButton.style.setProperty(
        'display',
        'none',
        'important'
      );
    }
  }

  hideProcessNavigationButtons();

  const observer = new MutationObserver(() => {
    hideProcessNavigationButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
})();

/* =========================================================
   PREVIOUS HISTORY — CARD FIT ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'previousHistoryCardFitOnly';

  style.textContent = `
    #previousSearches #historyList {
      display: grid !important;
      grid-template-rows: repeat(3, minmax(96px, 1fr)) !important;
      gap: 12px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    #previousSearches #historyList > .history-item {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 96px !important;
      height: 100% !important;

      margin: 0 !important;
      padding: 20px 22px !important;

      box-sizing: border-box !important;

      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 20px !important;

      border: 1px solid #eee9f3 !important;
      border-radius: 14px !important;
      background: #ffffff !important;
      box-shadow: none !important;
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — FILL AVAILABLE SPACE ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'previousHistoryFillAvailableSpaceOnly';

  style.textContent = `
    #previousSearches {
      display: flex !important;
      flex-direction: column !important;
    }

    #previousSearches #historyList {
      flex: 1 1 auto !important;

      display: grid !important;
      grid-template-rows: repeat(3, 1fr) !important;

      width: 100% !important;
      min-height: 0 !important;

      gap: 12px !important;
      box-sizing: border-box !important;
      align-content: stretch !important;
    }

    #previousSearches #historyList > .history-item {
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;

      margin: 0 !important;
      box-sizing: border-box !important;

      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — FULL HEIGHT ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'previousHistoryFullHeightOnly';

  style.textContent = `
    #previousSearches {
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
      min-height: 0 !important;
    }

    #previousSearches .previous-searches-header {
      flex: 0 0 auto !important;
    }

    #previousSearches #historyList {
      flex: 1 1 0 !important;
      min-height: 0 !important;

      display: grid !important;
      grid-template-rows: repeat(3, minmax(0, 1fr)) !important;
      gap: 12px !important;

      width: 100% !important;
      height: auto !important;

      padding-bottom: 0 !important;
      margin-bottom: 0 !important;

      box-sizing: border-box !important;
    }

    #previousSearches #historyList > .history-item {
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;

      margin: 0 !important;
      box-sizing: border-box !important;

      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — TIGHT FILL ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'previousHistoryTightFillOnly';

  style.textContent = `
    #previousSearches #historyList {
      flex: 1 1 0 !important;

      display: grid !important;
      grid-template-rows: repeat(3, minmax(0, 1fr)) !important;

      width: 100% !important;
      min-height: 0 !important;

      padding-top: 12px !important;
      padding-bottom: 0 !important;

      margin-top: 0 !important;
      margin-bottom: 0 !important;

      gap: 12px !important;
      box-sizing: border-box !important;
    }

    #previousSearches #historyList > .history-item {
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;

      margin: 0 !important;

      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;

      box-sizing: border-box !important;
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — RECORD SIZE ONLY
   ========================================================= */
(() => {
  function resizeHistoryRecords() {
    const history = document.querySelector('#previousSearches');
    const header = history?.querySelector('.previous-searches-header');
    const list = history?.querySelector('#historyList');
    const items = list
      ? [...list.querySelectorAll(':scope > .history-item')]
      : [];

    if (!history || !header || !list || items.length === 0) return;

    const historyRect = history.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();

    const gap = 12;
    const topPadding = 12;
    const bottomPadding = 12;

    const availableHeight =
      historyRect.bottom -
      headerRect.bottom -
      topPadding -
      bottomPadding -
      gap * (items.length - 1);

    /*
     * FIX: this used to have no upper bound, so with fewer than 3
     * saved results (often just 1) the leftover vertical space
     * (stretched to match the height of the Key Questions column on
     * the left) all got assigned to that one card, producing a huge
     * block of blank space inside it. Cap the per-item height so a
     * card never grows past a sensible size -- any leftover space
     * in the panel just stays empty below the list instead.
     */
    const itemHeight = Math.min(
      140,
      Math.max(
        96,
        Math.floor(availableHeight / items.length)
      )
    );

    list.style.setProperty('display', 'grid', 'important');
    list.style.setProperty('grid-template-columns', '1fr', 'important');
    list.style.setProperty('gap', `${gap}px`, 'important');
    list.style.setProperty(
      'padding',
      `${topPadding}px 0 ${bottomPadding}px`,
      'important'
    );
    list.style.setProperty('margin', '0', 'important');
    list.style.setProperty('width', '100%', 'important');
    list.style.setProperty('box-sizing', 'border-box', 'important');

    items.forEach(item => {
      item.style.setProperty('height', `${itemHeight}px`, 'important');
      item.style.setProperty('min-height', `${itemHeight}px`, 'important');
      item.style.setProperty('margin', '0', 'important');
      item.style.setProperty('box-sizing', 'border-box', 'important');
    });
  }

  function runHistoryResize() {
    requestAnimationFrame(() => {
      resizeHistoryRecords();
    });
  }

  runHistoryResize();

  setTimeout(runHistoryResize, 100);
  setTimeout(runHistoryResize, 400);
  setTimeout(runHistoryResize, 900);

  const historyList = document.querySelector('#historyList');

  if (historyList) {
    const observer = new MutationObserver(() => {
      runHistoryResize();
    });

    observer.observe(historyList, {
      childList: true,
      subtree: false
    });
  }

  window.addEventListener('resize', runHistoryResize);
})();

/* =========================================================
   PREVIOUS HISTORY — RECORD INSET + SOFT PURPLE BORDER ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyRecordInsetFix';

  style.textContent = `
    #previousSearches #historyList {
      padding: 12px !important;
      gap: 12px !important;
      box-sizing: border-box !important;
    }

    #previousSearches #historyList > .history-item {
      width: 100% !important;
      border: 1px solid rgba(111, 66, 193, 0.20) !important;
      border-radius: 14px !important;
      box-sizing: border-box !important;
    }
  `;

  document.getElementById('historyRecordInsetFix')?.remove();
  document.head.appendChild(style);

  function fitHistoryRecords() {
    const history = document.querySelector('#previousSearches');
    const header = history?.querySelector('.previous-searches-header');
    const list = history?.querySelector('#historyList');

    if (!history || !header || !list) return;

    const items = [...list.querySelectorAll(':scope > .history-item')];

    if (!items.length) return;

    const historyRect = history.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();

    const topPadding = 12;
    const bottomPadding = 12;
    const gap = 12;

    const availableHeight =
      historyRect.bottom -
      headerRect.bottom -
      topPadding -
      bottomPadding -
      gap * (items.length - 1);

    const itemHeight = Math.floor(
      availableHeight / items.length
    );

    list.style.setProperty('display', 'grid', 'important');
    list.style.setProperty('grid-template-columns', '1fr', 'important');
    list.style.setProperty('gap', `${gap}px`, 'important');
    list.style.setProperty(
      'padding',
      `${topPadding}px 12px ${bottomPadding}px`,
      'important'
    );
    list.style.setProperty('margin', '0', 'important');
    list.style.setProperty('width', '100%', 'important');
    list.style.setProperty('box-sizing', 'border-box', 'important');

    items.forEach(item => {
      item.style.setProperty('height', `${itemHeight}px`, 'important');
      item.style.setProperty('min-height', `${itemHeight}px`, 'important');
      item.style.setProperty('margin', '0', 'important');
      item.style.setProperty('box-sizing', 'border-box', 'important');
    });
  }

  const run = () => requestAnimationFrame(fitHistoryRecords);

  run();
  setTimeout(run, 100);
  setTimeout(run, 400);
  setTimeout(run, 900);

  const list = document.querySelector('#historyList');

  if (list) {
    new MutationObserver(run).observe(list, {
      childList: true
    });
  }

  window.addEventListener('resize', run);
})();

/* =========================================================
   SEGMENT PANEL — UI ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'segmentPanelUiFix';

  style.textContent = `
    /* Allow the segment panel to grow with its records */
    #segmentsPanel {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
    }

    /* Header */
    #segmentsPanel .segments-header {
      align-items: center !important;
      gap: 24px !important;
    }

    #segmentsPanel .segments-header > div:first-child {
      min-width: 0 !important;
      flex: 1 1 auto !important;
    }

    #segmentsPanel #addSegmentButton {
      flex: 0 0 auto !important;
      min-width: 180px !important;
    }

    /* Segment list */
    #segmentsPanel #segmentsList {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      gap: 12px !important;
      margin-top: 18px !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    /* Each segment becomes a full-width row */
    #segmentsPanel #segmentsList > .segment-card {
      position: relative !important;

      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      grid-template-areas:
        "number remove"
        "title remove"
        "description remove"
        "meta remove" !important;

      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      height: auto !important;
      min-height: 128px !important;

      margin: 0 !important;
      padding: 20px 22px !important;
      box-sizing: border-box !important;

      background: #ffffff !important;
      border: 1px solid rgba(103, 53, 183, 0.20) !important;
      border-radius: 16px !important;
      box-shadow: none !important;
    }

    #segmentsPanel .segment-number {
      grid-area: number !important;
      margin: 0 0 7px !important;

      font-size: 11px !important;
      font-weight: 700 !important;
      letter-spacing: 0.08em !important;
      color: #9b82c8 !important;
    }

    #segmentsPanel .segment-card h3 {
      grid-area: title !important;
      margin: 0 !important;

      font-size: 17px !important;
      line-height: 1.3 !important;
    }

    #segmentsPanel .segment-description {
      grid-area: description !important;
      margin: 6px 0 0 !important;

      font-size: 13px !important;
      line-height: 1.5 !important;
      color: #77717e !important;
    }

    #segmentsPanel .segment-meta {
      grid-area: meta !important;

      display: flex !important;
      flex-wrap: wrap !important;
      gap: 7px !important;

      margin-top: 12px !important;
    }

    #segmentsPanel .segment-meta span {
      padding: 5px 9px !important;
      border-radius: 999px !important;
      background: #f7f2ff !important;

      font-size: 11px !important;
      color: #6941a5 !important;
    }

    /* Keep existing footer only as the Remove-button container */
    #segmentsPanel .segment-card-footer {
      grid-area: remove !important;

      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;

      margin: 0 0 0 20px !important;
      padding: 0 !important;
      border: 0 !important;
    }

    #segmentsPanel .segment-card-footer > span {
      display: none !important;
    }

    #segmentsPanel .delete-segment {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      min-width: 88px !important;
      height: 38px !important;
      padding: 0 16px !important;

      border: 1px solid rgba(103, 53, 183, 0.22) !important;
      border-radius: 10px !important;
      background: #ffffff !important;

      color: #5b21b6 !important;
      font: inherit !important;
      font-size: 12px !important;
      font-weight: 700 !important;

      cursor: pointer !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    #segmentsPanel .delete-segment:hover {
      background: #f8f4ff !important;
    }

    @media (max-width: 700px) {
      #segmentsPanel #segmentsList > .segment-card {
        grid-template-columns: 1fr !important;
        grid-template-areas:
          "number"
          "title"
          "description"
          "meta"
          "remove" !important;
      }

      #segmentsPanel .segment-card-footer {
        justify-content: flex-start !important;
        margin: 16px 0 0 !important;
      }
    }
  `;

  document.getElementById('segmentPanelUiFix')?.remove();
  document.head.appendChild(style);
})();

/* =========================================================
   SEGMENT PANEL — FINAL DESIGN ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'segmentPanelFinalDesignOnly';

  style.textContent = `
    #segmentsPanel {
      width: 100% !important;
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 28px 28px 24px !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    #segmentsPanel .segments-header {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: start !important;
      gap: 24px !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 0 18px !important;
      border-bottom: 1px solid #eee9f3 !important;
      box-sizing: border-box !important;
    }

    #segmentsPanel .segments-header > div:first-child {
      min-width: 0 !important;
    }

    #segmentsPanel .segments-header .eyebrow {
      margin: 0 0 8px !important;
    }

    #segmentsPanel .segments-header h2 {
      margin: 0 0 6px !important;
      font-size: 24px !important;
      line-height: 1.2 !important;
    }

    #segmentsPanel .segments-subtitle {
      margin: 0 !important;
      max-width: 420px !important;
      font-size: 13px !important;
      line-height: 1.5 !important;
    }

    #segmentsPanel #addSegmentButton {
      align-self: center !important;
      min-width: 196px !important;
      height: 44px !important;
      padding: 0 20px !important;
      border-radius: 10px !important;
      font-size: 13px !important;
      font-weight: 700 !important;
    }

    #segmentsPanel #segmentsList {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      max-width: none !important;
      gap: 12px !important;
      margin: 18px 0 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    #segmentsPanel #segmentsList > .segment-card {
      display: grid !important;
      grid-template-columns: 48px minmax(0, 1fr) auto !important;
      grid-template-areas:
        "number content remove" !important;

      align-items: center !important;

      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      min-height: 92px !important;

      margin: 0 !important;
      padding: 14px 16px !important;

      box-sizing: border-box !important;

      border: 1px solid rgba(111, 66, 193, 0.18) !important;
      border-radius: 14px !important;
      background: #ffffff !important;
      box-shadow: none !important;
    }

    #segmentsPanel .segment-number {
      grid-area: number !important;

      width: 38px !important;
      height: 38px !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      margin: 0 !important;

      border-radius: 10px !important;
      background: #f5efff !important;

      font-size: 12px !important;
      font-weight: 700 !important;
      color: #5b21b6 !important;
      letter-spacing: 0 !important;
      opacity: 1 !important;
    }

    #segmentsPanel .segment-card h3,
    #segmentsPanel .segment-description,
    #segmentsPanel .segment-meta {
      grid-column: 2 !important;
    }

    #segmentsPanel .segment-card h3 {
      margin: 0 !important;
      font-size: 15px !important;
      line-height: 1.3 !important;
      color: #292332 !important;
    }

    #segmentsPanel .segment-description {
      margin: 4px 0 0 !important;
      font-size: 12px !important;
      line-height: 1.45 !important;
      color: #7e7787 !important;
    }

    #segmentsPanel .segment-meta {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin-top: 8px !important;
    }

    #segmentsPanel .segment-meta span {
      padding: 4px 8px !important;
      border-radius: 999px !important;

      background: #f6f1ff !important;
      color: #6f42c1 !important;

      font-size: 10px !important;
      font-weight: 600 !important;
    }

    #segmentsPanel .segment-card-footer {
      grid-area: remove !important;

      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;

      margin: 0 0 0 16px !important;
      padding: 0 !important;
      border: 0 !important;
    }

    #segmentsPanel .segment-card-footer > span {
      display: none !important;
    }

    #segmentsPanel .delete-segment {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      min-width: 86px !important;
      height: 36px !important;

      padding: 0 14px !important;

      border: 1px solid rgba(220, 53, 69, 0.14) !important;
      border-radius: 9px !important;
      background: #fff7f8 !important;

      color: #d84b5f !important;
      font: inherit !important;
      font-size: 11px !important;
      font-weight: 700 !important;

      opacity: 1 !important;
      visibility: visible !important;
      cursor: pointer !important;
    }

    #segmentsPanel .delete-segment:hover {
      background: #fff0f2 !important;
    }

    #segmentsPanel .segments-empty {
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 18px !important;
      border: 1px dashed rgba(111, 66, 193, 0.18) !important;
      border-radius: 12px !important;
      text-align: center !important;
    }

    @media (max-width: 700px) {
      #segmentsPanel {
        padding: 22px 18px !important;
      }

      #segmentsPanel .segments-header {
        grid-template-columns: 1fr !important;
      }

      #segmentsPanel #addSegmentButton {
        width: 100% !important;
      }

      #segmentsPanel #segmentsList > .segment-card {
        grid-template-columns: 42px minmax(0, 1fr) !important;
        grid-template-areas:
          "number content"
          "remove remove" !important;
      }

      #segmentsPanel .segment-card-footer {
        justify-content: flex-start !important;
        margin: 12px 0 0 !important;
      }
    }
  `;

  document.getElementById('segmentPanelFinalDesignOnly')?.remove();
  document.head.appendChild(style);
})();

/* =========================================================
   SEGMENT — FULL WIDTH INSIDE MAP LAYOUT ONLY
   ========================================================= */
(() => {
  function placeSegmentFullWidth() {
    const segment = document.getElementById('segmentsPanel');
    const mapLayout = document.querySelector('.map-layout');
    const questions = mapLayout?.querySelector('.question-card');
    const history = mapLayout?.querySelector('#previousSearches');

    if (!segment || !mapLayout || !questions || !history) return;

    // 2026-08-31: Key Questions now lives inside the Inputs-tab right-hand
    // stack, nested several levels down from .map-layout rather than as a
    // direct child of it. `questions` above is still found (it's a
    // descendant search), but it's no longer a valid anchor for
    // mapLayout.insertBefore below -- only a direct child of mapLayout can
    // be used as a reference node there.
    if (questions.parentElement !== mapLayout) return;

    /*
      Move ONLY the segment panel into the main two-column grid.
      Put it immediately after the Question / History row.
    */
    if (segment.parentElement !== mapLayout) {
      const nextRowAnchor =
        [...mapLayout.children].find(el => {
          if (el === questions || el === history) return false;

          const style = getComputedStyle(el);
          return style.gridColumnStart === '1';
        });

      if (nextRowAnchor) {
        mapLayout.insertBefore(segment, nextRowAnchor);
      } else {
        mapLayout.appendChild(segment);
      }
    }

    segment.style.setProperty('grid-column', '1 / -1', 'important');
    segment.style.setProperty('width', '100%', 'important');
    segment.style.setProperty('max-width', 'none', 'important');
    segment.style.setProperty('justify-self', 'stretch', 'important');
    segment.style.setProperty('align-self', 'start', 'important');
  }

  const style = document.createElement('style');
  style.id = 'segmentFullWidthPlacementOnly';

  style.textContent = `
    /* ONLY SEGMENT PANEL */
    .map-layout > #segmentsPanel {
      grid-column: 1 / -1 !important;

      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;

      justify-self: stretch !important;
      align-self: start !important;

      margin: 0 !important;
      box-sizing: border-box !important;
    }

    /*
      Segment cards can use the new full width.
      Does not affect History cards.
    */
    .map-layout > #segmentsPanel #segmentsList {
      width: 100% !important;
      max-width: none !important;
    }

    .map-layout > #segmentsPanel #segmentsList > .segment-card {
      width: 100% !important;
      max-width: none !important;
    }

    @media (max-width: 900px) {
      .map-layout > #segmentsPanel {
        grid-column: 1 !important;
      }
    }
  `;

  document.getElementById('segmentFullWidthPlacementOnly')?.remove();
  document.head.appendChild(style);

  placeSegmentFullWidth();

  setTimeout(placeSegmentFullWidth, 100);
  setTimeout(placeSegmentFullWidth, 500);
})();


/* =========================================================
   SEGMENT — PLACE DIRECTLY BELOW QUESTIONS ONLY
   ========================================================= */
(() => {
  function placeSegmentBelowQuestions() {
    const segment = document.getElementById('segmentsPanel');
    const mapLayout = document.querySelector('.map-layout');
    const questions = mapLayout?.querySelector('.question-card');

    if (!segment || !mapLayout || !questions) return;

    // 2026-08-31: same reasoning as placeSegmentFullWidth above -- Key
    // Questions is now nested inside the Inputs-tab right-hand stack, not
    // a direct child of .map-layout, so it can no longer be used as an
    // insertBefore reference node here.
    if (questions.parentElement !== mapLayout) return;

    if (segment.parentElement !== mapLayout) {
      mapLayout.insertBefore(segment, questions.nextElementSibling);
    } else if (questions.nextElementSibling !== segment) {
      mapLayout.insertBefore(segment, questions.nextElementSibling);
    }

    segment.style.setProperty('grid-column', '1', 'important');
    segment.style.setProperty('grid-row', 'auto', 'important');
    segment.style.setProperty('width', '100%', 'important');
    segment.style.setProperty('max-width', 'none', 'important');
    segment.style.setProperty('justify-self', 'stretch', 'important');
    segment.style.setProperty('align-self', 'start', 'important');
    segment.style.setProperty('margin', '0', 'important');
  }

  const style = document.createElement('style');
  style.id = 'segmentBelowQuestionsOnly';

  style.textContent = `
    .map-layout > #segmentsPanel {
      grid-column: 1 !important;
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      justify-self: stretch !important;
      align-self: start !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }

    @media (max-width: 900px) {
      .map-layout > #segmentsPanel {
        grid-column: 1 !important;
      }
    }
  `;

  document.getElementById('segmentBelowQuestionsOnly')?.remove();
  document.head.appendChild(style);

  placeSegmentBelowQuestions();

  setTimeout(placeSegmentBelowQuestions, 100);
  setTimeout(placeSegmentBelowQuestions, 400);
  setTimeout(placeSegmentBelowQuestions, 900);
})();


/* =========================================================
   PREVIOUS HISTORY — CENTER EMPTY STATE CONTENT ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyEmptyStateCenterOnly';

  style.textContent = `
    #previousSearches #historyList > .history-empty {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;

      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      max-height: none !important;

      margin: 0 !important;
      padding: 24px !important;

      box-sizing: border-box !important;
      text-align: center !important;
    }

    #previousSearches #historyList > .history-empty > * {
      margin-left: auto !important;
      margin-right: auto !important;
    }

    #previousSearches .history-empty-icon {
      margin-top: 0 !important;
      margin-bottom: 18px !important;
    }

    #previousSearches .history-empty-title {
      margin-top: 0 !important;
      margin-bottom: 8px !important;
      text-align: center !important;
    }

    #previousSearches .history-empty-description {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      text-align: center !important;
    }
  `;

  document
    .getElementById('historyEmptyStateCenterOnly')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — TRUE EMPTY STATE CENTER ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyTrueEmptyCenterOnly';

  style.textContent = `
    /*
      Only when Previous History contains the empty state:
      make the entire remaining content area a flex container.
    */
    #previousSearches #historyList:has(> .history-empty) {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;

      padding: 0 !important;
      margin: 0 !important;

      box-sizing: border-box !important;
    }

    #previousSearches #historyList:has(> .history-empty)
      > .history-empty {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;

      width: 100% !important;
      height: 100% !important;

      min-height: 0 !important;
      max-height: none !important;

      margin: 0 !important;
      padding: 0 32px !important;

      box-sizing: border-box !important;
      text-align: center !important;

      position: static !important;
      inset: auto !important;
      transform: none !important;
    }

    #previousSearches
      #historyList:has(> .history-empty)
      .history-empty-icon {
      margin: 0 0 18px !important;
    }

    #previousSearches
      #historyList:has(> .history-empty)
      .history-empty-title {
      margin: 0 0 9px !important;
      text-align: center !important;
    }

    #previousSearches
      #historyList:has(> .history-empty)
      .history-empty-description {
      margin: 0 !important;
      max-width: 420px !important;
      text-align: center !important;
    }
  `;

  document.getElementById('historyTrueEmptyCenterOnly')?.remove();
  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — FORCE TRUE EMPTY CENTER
   EMPTY STATE ONLY
   ========================================================= */
(() => {
  function centerHistoryEmptyState() {
    const history = document.querySelector('#previousSearches');
    const header = history?.querySelector('.previous-searches-header');
    const list = history?.querySelector('#historyList');
    const empty = list?.querySelector(':scope > .history-empty');

    if (!history || !header || !list || !empty) return;

    const headerHeight = Math.ceil(
      header.getBoundingClientRect().height
    );

    /* Keep the existing outer History frame unchanged */
    history.style.setProperty('position', 'relative', 'important');

    /*
      Make historyList occupy EXACTLY the area below the header.
      This overrides old inline height rules.
    */
    list.style.setProperty('position', 'absolute', 'important');
    list.style.setProperty('top', `${headerHeight}px`, 'important');
    list.style.setProperty('right', '0', 'important');
    list.style.setProperty('bottom', '0', 'important');
    list.style.setProperty('left', '0', 'important');

    list.style.setProperty('width', 'auto', 'important');
    list.style.setProperty('height', 'auto', 'important');
    list.style.setProperty('min-height', '0', 'important');
    list.style.setProperty('max-height', 'none', 'important');

    list.style.setProperty('margin', '0', 'important');
    list.style.setProperty('padding', '0', 'important');

    list.style.setProperty('display', 'flex', 'important');
    list.style.setProperty('align-items', 'center', 'important');
    list.style.setProperty('justify-content', 'center', 'important');

    list.style.setProperty('box-sizing', 'border-box', 'important');

    /* Center the complete icon + text group */
    empty.style.setProperty('position', 'static', 'important');

    empty.style.setProperty('display', 'flex', 'important');
    empty.style.setProperty('flex-direction', 'column', 'important');
    empty.style.setProperty('align-items', 'center', 'important');
    empty.style.setProperty('justify-content', 'center', 'important');

    empty.style.setProperty('width', '100%', 'important');
    empty.style.setProperty('height', 'auto', 'important');
    empty.style.setProperty('min-height', '0', 'important');
    empty.style.setProperty('max-height', 'none', 'important');

    empty.style.setProperty('margin', '0', 'important');
    empty.style.setProperty('padding', '24px 32px', 'important');

    empty.style.setProperty('transform', 'none', 'important');
    empty.style.setProperty('text-align', 'center', 'important');
    empty.style.setProperty('box-sizing', 'border-box', 'important');
  }

  centerHistoryEmptyState();

  requestAnimationFrame(centerHistoryEmptyState);

  setTimeout(centerHistoryEmptyState, 100);
  setTimeout(centerHistoryEmptyState, 400);
  setTimeout(centerHistoryEmptyState, 900);

  const historyList = document.querySelector('#historyList');

  if (historyList) {
    new MutationObserver(centerHistoryEmptyState).observe(
      historyList,
      {
        childList: true,
        subtree: false
      }
    );
  }

  window.addEventListener('resize', centerHistoryEmptyState);
})();

/* =========================================================
   PREVIOUS HISTORY — INNER EMPTY CONTENT SIZE ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyEmptyInnerContentSizeFix';

  style.textContent = `
    #previousSearches .history-empty-icon {
      flex: 0 0 auto !important;

      width: 72px !important;
      height: 72px !important;
      min-width: 72px !important;
      min-height: 72px !important;
      max-width: 72px !important;
      max-height: 72px !important;

      margin: 0 0 18px !important;
      padding: 0 !important;
    }

    #previousSearches .history-empty-title {
      flex: 0 0 auto !important;

      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      max-width: 420px !important;

      margin: 0 0 9px !important;
      padding: 0 !important;

      line-height: 1.3 !important;
      text-align: center !important;
    }

    #previousSearches .history-empty-description {
      flex: 0 0 auto !important;

      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      max-width: 420px !important;

      margin: 0 !important;
      padding: 0 !important;

      line-height: 1.55 !important;
      text-align: center !important;
    }

    #previousSearches #historyList > .history-empty {
      gap: 0 !important;
    }
  `;

  document
    .getElementById('historyEmptyInnerContentSizeFix')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — EXACT CENTER OF OUTER FRAME
   EMPTY STATE ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyExactOuterFrameCenter';

  style.textContent = `
    #previousSearches {
      position: relative !important;
    }

    /*
      Remove previous positioning from the list so the empty
      state can position itself relative to the OUTER frame.
    */
    #previousSearches #historyList:has(> .history-empty) {
      position: static !important;

      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      margin: 0 !important;
      padding: 0 !important;

      display: block !important;
    }

    /*
      EXACT geometric centre of the whole Previous History frame
    */
    #previousSearches #historyList > .history-empty {
      position: absolute !important;

      top: 50% !important;
      left: 50% !important;
      right: auto !important;
      bottom: auto !important;

      transform: translate(-50%, -50%) !important;

      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;

      width: min(520px, calc(100% - 64px)) !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      margin: 0 !important;
      padding: 0 !important;

      box-sizing: border-box !important;
      text-align: center !important;
    }

    #previousSearches .history-empty-icon {
      flex: 0 0 auto !important;

      width: 72px !important;
      height: 72px !important;

      margin: 0 0 18px !important;
      padding: 0 !important;
    }

    #previousSearches .history-empty-title {
      flex: 0 0 auto !important;

      width: auto !important;
      height: auto !important;
      min-height: 0 !important;

      margin: 0 0 9px !important;
      padding: 0 !important;

      text-align: center !important;
    }

    #previousSearches .history-empty-description {
      flex: 0 0 auto !important;

      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      max-width: 430px !important;

      margin: 0 !important;
      padding: 0 !important;

      text-align: center !important;
    }
  `;

  document
    .getElementById('historyExactOuterFrameCenter')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — FINAL EXACT FRAME CENTER
   EMPTY STATE ONLY
   ========================================================= */
(() => {
  function forceHistoryExactCenter() {
    const history = document.querySelector('#previousSearches');
    const list = history?.querySelector('#historyList');
    const empty = list?.querySelector('.history-empty');

    if (!history || !list || !empty) return;

    /* Outer History frame remains unchanged */
    history.style.setProperty('position', 'relative', 'important');

    /*
      Remove the old absolute positioning from historyList.
      Inline !important is required because previous JS used
      inline !important as well.
    */
    list.style.setProperty('position', 'static', 'important');
    list.style.setProperty('top', 'auto', 'important');
    list.style.setProperty('right', 'auto', 'important');
    list.style.setProperty('bottom', 'auto', 'important');
    list.style.setProperty('left', 'auto', 'important');

    list.style.setProperty('width', '100%', 'important');
    list.style.setProperty('height', 'auto', 'important');
    list.style.setProperty('min-height', '0', 'important');
    list.style.setProperty('max-height', 'none', 'important');

    list.style.setProperty('margin', '0', 'important');
    list.style.setProperty('padding', '0', 'important');
    list.style.setProperty('display', 'block', 'important');

    /*
      Position the WHOLE empty-state group relative to
      #previousSearches itself.
    */
    empty.style.setProperty('position', 'absolute', 'important');

    empty.style.setProperty('top', '50%', 'important');
    empty.style.setProperty('left', '50%', 'important');
    empty.style.setProperty('right', 'auto', 'important');
    empty.style.setProperty('bottom', 'auto', 'important');

    empty.style.setProperty(
      'transform',
      'translate(-50%, -50%)',
      'important'
    );

    empty.style.setProperty('display', 'flex', 'important');
    empty.style.setProperty('flex-direction', 'column', 'important');
    empty.style.setProperty('align-items', 'center', 'important');
    empty.style.setProperty('justify-content', 'center', 'important');

    empty.style.setProperty(
      'width',
      'calc(100% - 64px)',
      'important'
    );

    empty.style.setProperty('height', 'auto', 'important');
    empty.style.setProperty('min-height', '0', 'important');
    empty.style.setProperty('max-height', 'none', 'important');

    empty.style.setProperty('margin', '0', 'important');
    empty.style.setProperty('padding', '0', 'important');
    empty.style.setProperty('text-align', 'center', 'important');
  }

  /*
    Old History scripts still have delayed 100/400/900ms updates.
    Run AFTER all of them.
  */
  setTimeout(forceHistoryExactCenter, 1200);
  setTimeout(forceHistoryExactCenter, 1600);

  window.addEventListener('resize', () => {
    setTimeout(forceHistoryExactCenter, 0);
  });
})();

/* =========================================================
   MARKET SEGMENTS — CLEAN UI ONLY
   ========================================================= */
(() => {
  [
    'segmentPanelUiFix',
    'segmentPanelFinalDesignOnly',
    'segmentCardsCleanFinalOverride'
  ].forEach(id => {
    document.getElementById(id)?.remove();
  });

  const style = document.createElement('style');
  style.id = 'segmentCleanUiOnly';

  style.textContent = `
    /* Panel */
    #segmentsPanel {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
    }

    /* Header */
    #segmentsPanel .segments-header {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
      gap: 28px !important;

      width: 100% !important;

      margin: 0 !important;
      padding-bottom: 22px !important;

      border-bottom: 1px solid #eee8f3 !important;
    }

    #segmentsPanel .segments-header > div:first-child {
      min-width: 0 !important;
    }

    #segmentsPanel .segments-header h2 {
      margin: 5px 0 7px !important;
    }

    #segmentsPanel .segments-subtitle {
      margin: 0 !important;
      max-width: 520px !important;
      line-height: 1.5 !important;
    }

    #segmentsPanel #addSegmentButton {
      position: static !important;

      width: auto !important;
      min-width: 205px !important;
      height: 46px !important;

      margin: 0 !important;
      padding: 0 22px !important;

      align-self: center !important;
    }

    /* List */
    #segmentsPanel #segmentsList {
      display: flex !important;
      flex-direction: column !important;

      grid-template-columns: none !important;
      grid-template-rows: none !important;

      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      gap: 14px !important;

      margin: 18px 0 0 !important;
      padding: 0 !important;

      overflow: visible !important;
    }

    /* Segment card */
    #segmentsPanel #segmentsList > .segment-card {
      position: relative !important;

      display: block !important;

      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;

      height: auto !important;
      min-height: 132px !important;
      max-height: none !important;

      margin: 0 !important;
      padding: 20px 135px 20px 22px !important;

      box-sizing: border-box !important;

      background: #ffffff !important;

      border: 1px solid #e6dcef !important;
      border-radius: 14px !important;

      box-shadow: none !important;
      overflow: visible !important;

      transform: none !important;
    }

    /* Segment label */
    #segmentsPanel .segment-card > .segment-number {
      position: static !important;

      display: block !important;

      width: auto !important;
      height: auto !important;
      min-width: 0 !important;
      min-height: 0 !important;

      margin: 0 0 8px !important;
      padding: 0 !important;

      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;

      color: #8764b3 !important;

      font-size: 10px !important;
      line-height: 1 !important;
      font-weight: 700 !important;
      letter-spacing: .09em !important;

      white-space: nowrap !important;

      grid-area: auto !important;
      grid-column: auto !important;
      grid-row: auto !important;
    }

    /* Segment name */
    #segmentsPanel .segment-card > h3 {
      position: static !important;

      display: block !important;

      width: auto !important;
      height: auto !important;

      margin: 0 !important;
      padding: 0 !important;

      color: #272230 !important;

      font-size: 16px !important;
      line-height: 1.35 !important;
      font-weight: 700 !important;

      grid-area: auto !important;
      grid-column: auto !important;
      grid-row: auto !important;
    }

    /* Description */
    #segmentsPanel .segment-card > .segment-description {
      position: static !important;

      display: block !important;

      width: auto !important;
      max-width: 950px !important;
      height: auto !important;
      min-height: 0 !important;

      margin: 7px 0 0 !important;
      padding: 0 !important;

      color: #77717e !important;
      opacity: 1 !important;

      font-size: 13px !important;
      line-height: 1.5 !important;

      grid-area: auto !important;
      grid-column: auto !important;
      grid-row: auto !important;
    }

    /* Metadata */
    #segmentsPanel .segment-card > .segment-meta {
      position: static !important;

      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;

      width: auto !important;
      height: auto !important;

      gap: 7px !important;

      margin: 13px 0 0 !important;
      padding: 0 !important;

      grid-area: auto !important;
      grid-column: auto !important;
      grid-row: auto !important;
    }

    #segmentsPanel .segment-meta > span {
      display: inline-flex !important;
      align-items: center !important;

      width: auto !important;
      height: 25px !important;

      padding: 0 10px !important;

      border: 0 !important;
      border-radius: 999px !important;

      background: #f3edfa !important;
      color: #68449a !important;

      font-size: 10.5px !important;
      line-height: 1 !important;
      font-weight: 650 !important;

      white-space: nowrap !important;
    }

    /* Remove button container */
    #segmentsPanel .segment-card > .segment-card-footer {
      position: absolute !important;

      top: 18px !important;
      right: 18px !important;
      bottom: auto !important;
      left: auto !important;

      display: block !important;

      width: auto !important;
      height: auto !important;

      margin: 0 !important;
      padding: 0 !important;

      border: 0 !important;

      grid-area: auto !important;
      grid-column: auto !important;
      grid-row: auto !important;
    }

    #segmentsPanel .segment-card-footer > span {
      display: none !important;
    }

    #segmentsPanel .delete-segment {
      position: static !important;

      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      width: auto !important;
      min-width: 88px !important;
      height: 38px !important;

      margin: 0 !important;
      padding: 0 16px !important;

      border: 1px solid #f0ccd2 !important;
      border-radius: 10px !important;

      background: #fff8f8 !important;
      color: #d64b5d !important;

      font-family: inherit !important;
      font-size: 11px !important;
      font-weight: 700 !important;

      opacity: 1 !important;
      visibility: visible !important;

      cursor: pointer !important;
    }

    #segmentsPanel .delete-segment:hover {
      background: #fff0f2 !important;
    }

    /* Empty state */
    #segmentsPanel .segments-empty {
      width: 100% !important;

      margin: 0 !important;
      padding: 22px !important;

      box-sizing: border-box !important;

      border: 1px dashed #e1d6eb !important;
      border-radius: 12px !important;

      text-align: center !important;
      opacity: 1 !important;
    }

    @media (max-width: 700px) {
      #segmentsPanel .segments-header {
        grid-template-columns: 1fr !important;
      }

      #segmentsPanel #addSegmentButton {
        width: 100% !important;
      }

      #segmentsPanel #segmentsList > .segment-card {
        padding: 18px 18px 70px !important;
      }

      #segmentsPanel .segment-card > .segment-card-footer {
        top: auto !important;
        right: auto !important;
        bottom: 18px !important;
        left: 18px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();

/* =========================================================
   PROCESS INPUTS — UPLOAD EVIDENCE BUTTON ONLY
   ========================================================= */
(() => {
  function addUploadEvidenceButtons() {
    const inputList = document.querySelector('#inputList');

    if (!inputList) return;

    /*
     * Only inspect input cards inside #inputList.
     * Nothing outside the Process Inputs area is changed.
     */
    const addInformationButtons =
      inputList.querySelectorAll('.add-source-inline');

    addInformationButtons.forEach(addButton => {
      const inputCard =
        addButton.closest('.input-item') ||
        addButton.closest('.input-card') ||
        addButton.parentElement;

      if (!inputCard) return;

      /* Do not create duplicates after render() */
      if (inputCard.querySelector('.upload-evidence-inline')) return;

      const inputValue =
        addButton.dataset.input ||
        addButton.getAttribute('data-input');

      if (inputValue === null || inputValue === undefined) return;

      const uploadButton = document.createElement('button');

      uploadButton.type = 'button';
      uploadButton.className = 'upload-evidence-inline';
      uploadButton.textContent = '+ Upload evidence';
      uploadButton.dataset.input = inputValue;

      /*
       * Place it immediately after Add information.
       * No parent layout or other section is moved.
       */
      addButton.insertAdjacentElement('afterend', uploadButton);

      uploadButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        /*
         * Reuse the existing input value used by
         * Add information.
         */
        const inputIndex = Number(uploadButton.dataset.input);

        if (!Number.isInteger(inputIndex)) return;

        const step = currentStep();
        const inputName = step?.inputs?.[inputIndex];

        if (!inputName) return;

        /*
         * Store the real input name so uploaded evidence remains
         * linked to the correct process input.
         */
        selectedInput = inputName;

        const title = document.querySelector('#documentDialogTitle');

        if (title) {
          title.textContent =
            `Upload evidence for Input ${inputIndex + 1}`;
        }

        const name = document.querySelector('#documentName');
        const text = document.querySelector('#documentText');

        if (name) name.value = '';
        if (text) text.value = '';

        const dialog = document.querySelector('#documentDialog');

        if (!dialog) {
          showToast('Evidence upload is unavailable.');
          return;
        }

        dialog.showModal();
      });
    });
  }

  /* Style ONLY the new button */
  const style = document.createElement('style');
  style.id = 'processInputUploadEvidenceButtonOnly';

  style.textContent = `
    #inputList .upload-evidence-inline {
      appearance: none !important;

      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      width: auto !important;
      height: auto !important;
      min-height: 0 !important;

      margin: 8px 0 0 10px !important;
      padding: 0 !important;

      border: 0 !important;
      background: transparent !important;

      color: #6f42a5 !important;

      font-family: inherit !important;
      font-size: 12px !important;
      line-height: 1.4 !important;
      font-weight: 600 !important;

      cursor: pointer !important;
      box-shadow: none !important;
      transform: none !important;
    }

    #inputList .upload-evidence-inline:hover {
      color: #4f247f !important;
      text-decoration: underline !important;
    }
  `;

  document
    .getElementById('processInputUploadEvidenceButtonOnly')
    ?.remove();

  document.head.appendChild(style);

  addUploadEvidenceButtons();

  /*
   * render() rebuilds the input cards when process/state changes,
   * so add the button again only when #inputList changes.
   */
  const inputList = document.querySelector('#inputList');

  if (inputList) {
    const observer = new MutationObserver(() => {
      addUploadEvidenceButtons();
    });

    observer.observe(inputList, {
      childList: true
    });
  }
})();

/* =========================================================
   PROCESS INPUT ACTIONS — SPACING + TYPOGRAPHY ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'processInputActionAlignmentFinal';

  style.textContent = `
    /*
     * ONLY the two action buttons inside process input cards.
     * No other section/layout is affected.
     */

    #inputList .add-source-inline,
    #inputList .upload-evidence-inline {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-start !important;

      vertical-align: middle !important;

      height: auto !important;
      min-height: 0 !important;

      padding: 0 !important;

      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;

      font-family: inherit !important;
      font-size: 13px !important;
      line-height: 1.4 !important;
      font-weight: 700 !important;

      color: #54208f !important;

      transform: none !important;
    }

    /* Keep Add information exactly in its current position */
    #inputList .add-source-inline {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }

    /*
     * Upload evidence:
     * same baseline, same font, same colour,
     * but clearly separated horizontally.
     */
    #inputList .add-source-inline + .upload-evidence-inline {
      margin: 0 0 0 30px !important;
    }

    #inputList .upload-evidence-inline:hover,
    #inputList .add-source-inline:hover {
      color: #54208f !important;
    }
  `;

  document
    .getElementById('processInputActionAlignmentFinal')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   PROCESS INPUT ACTIONS — EXACT SAME ROW + BASELINE
   INPUTS ONLY
   ========================================================= */
(() => {
  function alignInputActionButtons() {
    const inputList = document.querySelector('#inputList');
    if (!inputList) return;

    inputList.querySelectorAll('.add-source-inline').forEach(addButton => {
      const uploadButton =
        addButton.parentElement?.querySelector('.upload-evidence-inline');

      if (!uploadButton) return;

      let row = addButton.closest('.input-action-row');

      if (!row) {
        row = document.createElement('div');
        row.className = 'input-action-row';

        addButton.parentNode.insertBefore(row, addButton);

        row.appendChild(addButton);
        row.appendChild(uploadButton);
      } else if (uploadButton.parentElement !== row) {
        row.appendChild(uploadButton);
      }
    });
  }

  const style = document.createElement('style');
  style.id = 'inputActionExactRowFix';

  style.textContent = `
    #inputList .input-action-row {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: flex-start !important;

      gap: 42px !important;

      width: auto !important;
      height: auto !important;

      margin: 6px 0 0 !important;
      padding: 0 !important;

      line-height: 1 !important;
    }

    #inputList .input-action-row > .add-source-inline,
    #inputList .input-action-row > .upload-evidence-inline {
      position: static !important;

      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-start !important;

      flex: 0 0 auto !important;

      width: auto !important;
      height: 18px !important;
      min-height: 18px !important;

      margin: 0 !important;
      padding: 0 !important;

      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;

      color: #54208f !important;

      font-family: inherit !important;
      font-size: 13px !important;
      line-height: 18px !important;
      font-weight: 700 !important;

      vertical-align: middle !important;
      transform: none !important;
    }

    #inputList .input-action-row > .add-source-inline:hover,
    #inputList .input-action-row > .upload-evidence-inline:hover {
      color: #54208f !important;
    }
  `;

  document.getElementById('inputActionExactRowFix')?.remove();
  document.head.appendChild(style);

  alignInputActionButtons();

  const inputList = document.querySelector('#inputList');

  if (inputList) {
    new MutationObserver(() => {
      alignInputActionButtons();
    }).observe(inputList, {
      childList: true,
      subtree: true
    });
  }
})();

/* =========================================================
   PROCESS INPUT ACTIONS — FINAL BASELINE + SPACING ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'inputActionBaselineSpacingFinal';

  style.textContent = `
    #inputList .input-action-row {
      display: flex !important;
      flex-direction: row !important;

      /* align text using the same baseline */
      align-items: baseline !important;
      justify-content: flex-start !important;

      /* slightly wider spacing */
      column-gap: 58px !important;
      row-gap: 0 !important;

      width: auto !important;
      height: auto !important;

      margin: 7px 0 0 !important;
      padding: 0 !important;
    }

    #inputList .input-action-row > .add-source-inline,
    #inputList .input-action-row > .upload-evidence-inline {
      position: static !important;

      display: inline !important;

      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      margin: 0 !important;
      padding: 0 !important;

      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;

      color: #54208f !important;

      font-family: inherit !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1.4 !important;

      vertical-align: baseline !important;

      transform: none !important;
      translate: none !important;
    }

    #inputList .input-action-row > .upload-evidence-inline {
      top: auto !important;
      bottom: auto !important;
    }
  `;

  document
    .getElementById('inputActionBaselineSpacingFinal')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   INPUT BUTTONS — EXACT ALIGNMENT ONLY
   ========================================================= */
(() => {
  function fixInputActionsExactly() {
    document
      .querySelectorAll('#inputList .input-action-row')
      .forEach(row => {
        const add = row.querySelector('.add-source-inline');
        const upload = row.querySelector('.upload-evidence-inline');

        if (!add || !upload) return;

        /* Row only */
        row.style.setProperty('display', 'flex', 'important');
        row.style.setProperty('flex-direction', 'row', 'important');
        row.style.setProperty('align-items', 'flex-start', 'important');
        row.style.setProperty('justify-content', 'flex-start', 'important');
        row.style.setProperty('gap', '0', 'important');
        row.style.setProperty('margin', '7px 0 0', 'important');
        row.style.setProperty('padding', '0', 'important');

        /* Make both buttons identical */
        [add, upload].forEach(button => {
          button.style.setProperty('position', 'relative', 'important');
          button.style.setProperty('display', 'block', 'important');

          button.style.setProperty('width', 'auto', 'important');
          button.style.setProperty('height', '20px', 'important');
          button.style.setProperty('min-height', '20px', 'important');

          button.style.setProperty('margin', '0', 'important');
          button.style.setProperty('padding', '0', 'important');

          button.style.setProperty('border', '0', 'important');
          button.style.setProperty('background', 'transparent', 'important');
          button.style.setProperty('box-shadow', 'none', 'important');

          button.style.setProperty('color', '#54208f', 'important');

          button.style.setProperty('font-family', 'inherit', 'important');
          button.style.setProperty('font-size', '13px', 'important');
          button.style.setProperty('font-weight', '700', 'important');
          button.style.setProperty('line-height', '20px', 'important');

          button.style.setProperty('top', '0', 'important');
          button.style.setProperty('bottom', 'auto', 'important');
          button.style.setProperty('transform', 'none', 'important');
        });

        /* Make Upload evidence clearly farther away */
        upload.style.setProperty('margin-left', '72px', 'important');

        /*
         * Measure actual rendered positions.
         * If an old rule still shifts Upload evidence,
         * compensate automatically.
         */
        requestAnimationFrame(() => {
          const addTop = add.getBoundingClientRect().top;
          const uploadTop = upload.getBoundingClientRect().top;
          const difference = Math.round(addTop - uploadTop);

          if (difference !== 0) {
            upload.style.setProperty(
              'top',
              `${difference}px`,
              'important'
            );
          }
        });
      });
  }

  fixInputActionsExactly();

  requestAnimationFrame(fixInputActionsExactly);

  setTimeout(fixInputActionsExactly, 100);
  setTimeout(fixInputActionsExactly, 400);
  setTimeout(fixInputActionsExactly, 1000);

  const inputList = document.querySelector('#inputList');

  if (inputList) {
    new MutationObserver(() => {
      requestAnimationFrame(fixInputActionsExactly);
    }).observe(inputList, {
      childList: true,
      subtree: true
    });
  }
})();

/* =========================================================
   INPUT ACTION BUTTONS — VISUAL ALIGNMENT ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'inputActionVisualAlignmentOnly';

  style.textContent = `
    #inputList .input-action-row {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      justify-content: flex-start !important;

      gap: 0 !important;

      margin-top: 7px !important;
      padding: 0 !important;
    }

    #inputList .input-action-row > .add-source-inline,
    #inputList .input-action-row > .upload-evidence-inline {
      display: inline-block !important;

      width: auto !important;
      height: 20px !important;
      min-height: 20px !important;

      margin: 0 !important;
      padding: 0 !important;

      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;

      color: #54208f !important;

      font-family: inherit !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 20px !important;

      vertical-align: top !important;
    }

    #inputList .input-action-row > .upload-evidence-inline {
      margin-left: 64px !important;
      position: relative !important;
      top: 4px !important;
    }

    #inputList .input-action-row > .add-source-inline {
      position: relative !important;
      top: 0 !important;
    }
  `;

  document.getElementById('inputActionVisualAlignmentOnly')?.remove();
  document.head.appendChild(style);
})();

/* INPUT ACTION FINAL VERTICAL ALIGNMENT ONLY */
(() => {
  const style = document.createElement('style');
  style.id = 'inputActionFinalVerticalAlignment';

  style.textContent = `
    #inputList .input-action-row > .upload-evidence-inline {
      position: relative !important;
      top: 6px !important;
    }
  `;

  document.getElementById('inputActionFinalVerticalAlignment')?.remove();
  document.head.appendChild(style);
})();

/* INPUT ACTION SPACING ONLY */
(() => {
  const style = document.createElement('style');
  style.id = 'inputActionSpacingOnly';

  style.textContent = `
    #inputList .input-action-row > .upload-evidence-inline {
      margin-left: 48px !important;
    }
  `;

  document.getElementById('inputActionSpacingOnly')?.remove();
  document.head.appendChild(style);
})();

/* =========================================================
   ALL INPUTS — EVIDENCE MODAL LABEL + CLOSE FIX
   ========================================================= */
(() => {
  function formatInputNumber(index) {
    return `Input ${String(index + 1).padStart(2, '0')}`;
  }

  document.addEventListener('click', event => {
    const uploadButton = event.target.closest(
      '#inputList .upload-evidence-inline'
    );

    if (!uploadButton) return;

    const inputIndex = Number(uploadButton.dataset.input);

    if (!Number.isInteger(inputIndex)) return;

    const title = document.querySelector('#documentDialogTitle');

    if (title) {
      title.textContent =
        `Upload evidence for ${formatInputNumber(inputIndex)}`;
    }
  });

  const dialog = document.querySelector('#documentDialog');

  if (!dialog) return;

  const closeButton = dialog.querySelector('.close');

  if (closeButton) {
    closeButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      if (dialog.open) {
        dialog.close();
      }
    });
  }
})();

/* =========================================================
   SEGMENT + EVIDENCE — FULL WIDTH ONLY
   ========================================================= */
(() => {
  function applySegmentEvidenceFullWidth() {
    const segment = document.querySelector('#segmentsPanel');
    const evidence = document.querySelector('#fmDashboardEvidence');

    if (!segment || !evidence) return;

    [segment, evidence].forEach(section => {
      section.style.setProperty('grid-column', '1 / -1', 'important');
      section.style.setProperty('grid-row', 'auto', 'important');

      section.style.setProperty('width', '100%', 'important');
      section.style.setProperty('max-width', 'none', 'important');

      section.style.setProperty('justify-self', 'stretch', 'important');
      section.style.setProperty('align-self', 'start', 'important');

      section.style.setProperty('margin-left', '0', 'important');
      section.style.setProperty('margin-right', '0', 'important');
    });
  }

  applySegmentEvidenceFullWidth();

  window.addEventListener('load', applySegmentEvidenceFullWidth);

  setTimeout(applySegmentEvidenceFullWidth, 500);
  setTimeout(applySegmentEvidenceFullWidth, 2500);
})();

/* =========================================================
   PREVIOUS HISTORY — COMPACT RECORD SIZE ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyRecordCompactOnly';

  style.textContent = `
    #previousSearches #historyList > .history-item,
    #previousSearches .history-list > .history-item {
      min-height: 108px !important;
      height: auto !important;

      padding: 18px 20px !important;

      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;

      box-sizing: border-box !important;
    }

    #previousSearches #historyList,
    #previousSearches .history-list {
      gap: 12px !important;
    }
  `;

  document.getElementById('historyRecordCompactOnly')?.remove();
  document.head.appendChild(style);
})();

/* =========================================================
   PREVIOUS HISTORY — CLEAN COMPACT LAYOUT ONLY
   ========================================================= */
(() => {
  document.getElementById('historyRecordCompactOnly')?.remove();

  const style = document.createElement('style');
  style.id = 'historyCleanCompactLayout';

  style.textContent = `
    #previousSearches {
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    #previousSearches .previous-searches-header {
      flex: 0 0 auto !important;
    }

    #previousSearches #historyList,
    #previousSearches .history-list {
      position: relative !important;
      inset: auto !important;

      flex: 1 1 auto !important;

      display: flex !important;
      flex-direction: column !important;

      gap: 12px !important;

      padding: 12px !important;
      margin: 0 !important;

      overflow-y: auto !important;

      box-sizing: border-box !important;
    }

    #previousSearches #historyList > .history-item,
    #previousSearches .history-list > .history-item {
      position: relative !important;
      inset: auto !important;

      flex: 0 0 auto !important;

      width: 100% !important;
      height: auto !important;
      min-height: 92px !important;

      margin: 0 !important;
      padding: 16px 20px !important;

      box-sizing: border-box !important;

      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;

      transform: none !important;
    }
  `;

  document.getElementById('historyCleanCompactLayout')?.remove();
  document.head.appendChild(style);

  function clearForcedHistoryHeight() {
    const history = document.querySelector('#previousSearches');

    if (!history) return;

    history.style.removeProperty('height');
    history.style.removeProperty('min-height');
    history.style.removeProperty('max-height');
  }

  clearForcedHistoryHeight();

  window.addEventListener(
    'load',
    clearForcedHistoryHeight
  );

  setTimeout(clearForcedHistoryHeight, 100);
  setTimeout(clearForcedHistoryHeight, 500);
})();

/* =========================================================
   PREVIOUS HISTORY — FIT 3 RECORDS ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyThreeRecordFit';

  style.textContent = `
    #previousSearches {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      display: flex !important;
      flex-direction: column !important;

      overflow: hidden !important;
    }

    #previousSearches .previous-searches-header {
      flex: 0 0 auto !important;
    }

    #previousSearches #historyList,
    #previousSearches .history-list {
      position: relative !important;
      inset: auto !important;

      display: flex !important;
      flex-direction: column !important;

      gap: 10px !important;

      padding: 12px !important;
      margin: 0 !important;

      overflow: visible !important;

      box-sizing: border-box !important;
    }

    #previousSearches #historyList > .history-item,
    #previousSearches .history-list > .history-item {
      position: relative !important;
      inset: auto !important;

      width: 100% !important;

      height: 96px !important;
      min-height: 96px !important;
      max-height: 96px !important;

      flex: 0 0 96px !important;

      margin: 0 !important;
      padding: 16px 20px !important;

      box-sizing: border-box !important;

      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;

      transform: none !important;
    }
  `;

  document.getElementById('historyThreeRecordFit')?.remove();
  document.head.appendChild(style);

  function clearOldForcedHistoryHeight() {
    const history = document.querySelector('#previousSearches');

    if (!history) return;

    history.style.removeProperty('height');
    history.style.removeProperty('min-height');
    history.style.removeProperty('max-height');
  }

  requestAnimationFrame(clearOldForcedHistoryHeight);
  setTimeout(clearOldForcedHistoryHeight, 100);
  setTimeout(clearOldForcedHistoryHeight, 500);
})();

/* =========================================================
   PREVIOUS HISTORY — OUTER FRAME FIT CONTENT ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyOuterFrameFitOnly';

  style.textContent = `
    #previousSearches {
      height: fit-content !important;
      min-height: 0 !important;
      max-height: none !important;
      align-self: start !important;
    }

    #previousSearches #historyList,
    #previousSearches .history-list {
      flex: 0 0 auto !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
    }
  `;

  document.getElementById('historyOuterFrameFitOnly')?.remove();
  document.head.appendChild(style);

  const history = document.querySelector('#previousSearches');

  if (history) {
    history.style.removeProperty('height');
    history.style.removeProperty('min-height');
    history.style.removeProperty('max-height');
  }
})();

/* =========================================================
   PREVIOUS HISTORY — REMOVE LEGACY INLINE HEIGHT ONLY
   ========================================================= */
(() => {
  function clearHistoryInlineHeight() {
    const history = document.querySelector('#previousSearches');

    if (!history) return;

    history.style.removeProperty('height');
    history.style.removeProperty('min-height');
    history.style.removeProperty('max-height');
  }

  function installHistoryHeightGuard() {
    const history = document.querySelector('#previousSearches');

    if (!history) {
      setTimeout(installHistoryHeightGuard, 100);
      return;
    }

    clearHistoryInlineHeight();

    if (history.dataset.heightGuardInstalled === 'true') {
      return;
    }

    history.dataset.heightGuardInstalled = 'true';

    const observer = new MutationObserver(() => {
      const hasForcedHeight =
        history.style.getPropertyValue('height') ||
        history.style.getPropertyValue('min-height') ||
        history.style.getPropertyValue('max-height');

      if (hasForcedHeight) {
        clearHistoryInlineHeight();
      }
    });

    observer.observe(history, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  installHistoryHeightGuard();

  window.addEventListener('load', () => {
    clearHistoryInlineHeight();
    installHistoryHeightGuard();
  });
})();

/* =========================================================
   PREVIOUS HISTORY — REMOVE LEGACY LIST HEIGHT ONLY
   ========================================================= */
(() => {
  function clearHistoryListHeight() {
    const list = document.querySelector('#historyList');

    if (!list) return;

    list.style.removeProperty('height');
    list.style.removeProperty('min-height');
    list.style.removeProperty('max-height');
  }

  function installHistoryListHeightGuard() {
    const list = document.querySelector('#historyList');

    if (!list) {
      setTimeout(installHistoryListHeightGuard, 100);
      return;
    }

    clearHistoryListHeight();

    if (list.dataset.heightGuardInstalled === 'true') {
      return;
    }

    list.dataset.heightGuardInstalled = 'true';

    const observer = new MutationObserver(() => {
      const hasForcedHeight =
        list.style.getPropertyValue('height') ||
        list.style.getPropertyValue('max-height');

      if (hasForcedHeight) {
        clearHistoryListHeight();
      }
    });

    observer.observe(list, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  installHistoryListHeightGuard();

  window.addEventListener('load', () => {
    clearHistoryListHeight();
    installHistoryListHeightGuard();
  });
})();

/* =========================================================
   PREVIOUS HISTORY — RECORD HEIGHT ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'historyRecordHeightFinal';

  style.textContent = `
    #previousSearches #historyList > * {
      height: 140px !important;
      min-height: 140px !important;
    }
  `;

  document.getElementById('historyRecordHeightFinal')?.remove();
  document.head.appendChild(style);
})();

/* =========================================================
   OUTPUTS TAB — SHOW GENERATED OUTPUT ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'processOutputVisibilityFix';

  style.textContent = `
    #processOutputsTab #analysisOutput {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    #processOutputsTab #analysisOutput:empty {
      display: none !important;
    }
  `;

  document.getElementById('processOutputVisibilityFix')?.remove();
  document.head.appendChild(style);
})();



/* =========================================================
   OUTPUT TAB — HORIZONTAL DECISION BRIEF UI
   Scope: #processOutputsTab ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'fmOutputDecisionBriefFinal';

  style.textContent = `
    /* ---------- OUTPUT TAB ONLY ---------- */

    #processOutputsTab {
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 26px 0 8px !important;
    }

    /* Hide old expand button in Outputs */
    #processOutputsTab #expandOutput {
      display: none !important;
    }

    /* Empty state stays centred */
    #processOutputsTab #outputEmpty:not([hidden]) {
      min-height: 420px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      margin: 0 !important;
    }

    /* Existing output is the data source, but not the visual */
    #processOutputsTab #analysisOutput {
      display: none !important;
    }

    #processOutputsTab .fm-output-brief {
      width: 100% !important;
      border: 1px solid #e4d8f7 !important;
      border-radius: 18px !important;
      background: #fff !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    #processOutputsTab .fm-output-head {
      padding: 28px 30px 22px !important;
    }

    #processOutputsTab .fm-output-kicker {
      margin: 0 0 7px !important;
      font-size: 11px !important;
      line-height: 1 !important;
      font-weight: 800 !important;
      letter-spacing: .1em !important;
      text-transform: uppercase !important;
      color: #6b2bd1 !important;
    }

    #processOutputsTab .fm-output-title {
      margin: 0 !important;
      font-size: 28px !important;
      line-height: 1.15 !important;
      color: #211b2b !important;
    }

    #processOutputsTab .fm-output-subtitle {
      margin: 8px 0 0 !important;
      font-size: 14px !important;
      color: #7d7489 !important;
    }

    /* Horizontal question selector */
    #processOutputsTab .fm-output-question-nav {
      display: grid !important;
      grid-template-columns: repeat(var(--fm-question-count, 5), minmax(0, 1fr)) !important;
      border-top: 1px solid #eee7f6 !important;
      border-bottom: 1px solid #eee7f6 !important;
      background: #fff !important;
    }

    #processOutputsTab .fm-output-question-tab {
      appearance: none !important;
      border: 0 !important;
      border-right: 1px solid #eee7f6 !important;
      background: transparent !important;
      padding: 20px 16px 18px !important;
      min-height: 112px !important;
      cursor: pointer !important;
      color: #62596e !important;
      font: inherit !important;
      position: relative !important;
    }

    #processOutputsTab .fm-output-question-tab:last-child {
      border-right: 0 !important;
    }

    #processOutputsTab .fm-output-question-number {
      width: 38px !important;
      height: 38px !important;
      border-radius: 10px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 auto 10px !important;
      background: #f2eafd !important;
      color: #6326c7 !important;
      font-size: 13px !important;
      font-weight: 800 !important;
    }

    #processOutputsTab .fm-output-question-label {
      display: block !important;
      font-size: 13px !important;
      line-height: 1.35 !important;
      font-weight: 650 !important;
    }

    #processOutputsTab .fm-output-question-tab.active {
      color: #5720b6 !important;
    }

    #processOutputsTab .fm-output-question-tab.active::after {
      content: "" !important;
      position: absolute !important;
      left: 18% !important;
      right: 18% !important;
      bottom: 0 !important;
      height: 3px !important;
      border-radius: 999px !important;
      background: #6927d5 !important;
    }

    #processOutputsTab .fm-output-question-tab.active
    .fm-output-question-number {
      background: #6927d5 !important;
      color: #fff !important;
    }

    /* Main selected answer */
    #processOutputsTab .fm-output-answer {
      padding: 28px 32px 32px !important;
      box-sizing: border-box !important;
    }

    #processOutputsTab .fm-output-answer-index {
      margin: 0 0 9px !important;
      color: #6826cf !important;
      font-size: 12px !important;
      font-weight: 800 !important;
    }

    #processOutputsTab .fm-output-answer-question {
      margin: 0 0 22px !important;
      max-width: 950px !important;
      font-size: 23px !important;
      line-height: 1.25 !important;
      color: #211b2b !important;
    }

    #processOutputsTab .fm-output-answer-body {
      max-width: 1100px !important;
      color: #342c40 !important;
      font-size: 14px !important;
      line-height: 1.7 !important;
    }

    #processOutputsTab .fm-output-answer-body p {
      margin: 0 0 12px !important;
    }

    #processOutputsTab .fm-output-answer-body ul,
    #processOutputsTab .fm-output-answer-body ol {
      margin: 10px 0 16px 20px !important;
      padding: 0 !important;
    }

    #processOutputsTab .fm-output-answer-body li {
      margin: 6px 0 !important;
    }

    #processOutputsTab .fm-output-answer-body h1,
    #processOutputsTab .fm-output-answer-body h2,
    #processOutputsTab .fm-output-answer-body h3 {
      font-size: 16px !important;
      margin: 18px 0 8px !important;
    }

    /* Never show downstream block in this new visual */
    #processOutputsTab .fm-output-brief .downstream {
      display: none !important;
    }

    @media (max-width: 900px) {
      #processOutputsTab .fm-output-question-nav {
        grid-template-columns: 1fr 1fr !important;
      }

      #processOutputsTab .fm-output-question-tab {
        border-bottom: 1px solid #eee7f6 !important;
      }
    }
  `;

  document.getElementById('fmOutputDecisionBriefFinal')?.remove();
  document.head.appendChild(style);

  function getQuestions() {
    try {
      const step =
        typeof currentStep === 'function'
          ? currentStep()
          : null;

      return Array.isArray(step?.questions)
        ? step.questions
        : [];
    } catch {
      return [];
    }
  }

  /*
   * Split generated answer by the numbered question headings
   * already produced by the AI.
   */
  function splitAnswerIntoQuestions(rawText, questions) {
    const text = String(rawText || '').trim();

    if (!text) return [];

    if (!questions.length) {
      return [{
        question: 'Generated output',
        content: text
      }];
    }

    const result = [];

    questions.forEach((question, index) => {
      const number = index + 1;

      const escapedQuestion = String(question)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const startPatterns = [
        new RegExp(
          `(?:^|\\n)\\s*${number}\\s*[\\.\\)\\-:]\\s*${escapedQuestion}`,
          'i'
        ),
        new RegExp(
          `(?:^|\\n)\\s*${number}\\s*[\\.\\)\\-:]`,
          'i'
        )
      ];

      let start = -1;
      let matchedLength = 0;

      for (const pattern of startPatterns) {
        const match = pattern.exec(text);

        if (match) {
          start = match.index + (
            match[0].startsWith('\n') ? 1 : 0
          );
          matchedLength = match[0].length;
          break;
        }
      }

      if (start < 0) return;

      let end = text.length;

      if (index < questions.length - 1) {
        const nextNumber = number + 1;

        const nextPattern = new RegExp(
          `\\n\\s*${nextNumber}\\s*[\\.\\)\\-:]`,
          'i'
        );

        const remaining =
          text.slice(start + matchedLength);

        const nextMatch =
          nextPattern.exec(remaining);

        if (nextMatch) {
          end =
            start +
            matchedLength +
            nextMatch.index;
        }
      }

      let content =
        text.slice(
          start + matchedLength,
          end
        ).trim();

      result.push({
        question,
        content
      });
    });

    /*
     * Fallback: if generated format could not be split,
     * show the complete generated output in one view.
     */
    if (!result.length) {
      return [{
        question: questions[0] || 'Generated output',
        content: text
      }];
    }

    return result;
  }

  function renderOutputBrief() {
    const outputsTab =
      document.querySelector('#processOutputsTab');

    const source =
      document.querySelector('#analysisOutput');

    const empty =
      document.querySelector('#outputEmpty');

    if (!outputsTab || !source || !empty) return;

    let brief =
      outputsTab.querySelector('.fm-output-brief');

    const sourceText =
      source.innerText?.trim() || '';

    if (!sourceText) {
      if (brief) brief.remove();
      return;
    }

    /*
     * Remove legacy "Outputs & downstream" text from
     * the visual source before splitting.
     */
    const clone = source.cloneNode(true);

    clone
      .querySelectorAll('.downstream')
      .forEach(el => el.remove());

    const rawText =
      clone.innerText?.trim() || '';

    const questions = getQuestions();

    const sections =
      splitAnswerIntoQuestions(
        rawText,
        questions
      );

    if (!sections.length) return;

    if (!brief) {
      brief = document.createElement('div');
      brief.className = 'fm-output-brief';
      outputsTab.appendChild(brief);
    }

    let activeIndex =
      Number(brief.dataset.activeIndex || 0);

    if (
      !Number.isInteger(activeIndex) ||
      activeIndex < 0 ||
      activeIndex >= sections.length
    ) {
      activeIndex = 0;
    }

    const active =
      sections[activeIndex];

    const escape = value =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const bodyHtml =
      typeof formatAnswer === 'function'
        ? formatAnswer(active.content)
        : `<p>${escape(active.content)
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')}</p>`;

    brief.style.setProperty(
      '--fm-question-count',
      String(Math.max(1, sections.length))
    );

    brief.innerHTML = `
      <div class="fm-output-head">
        <p class="fm-output-kicker">
          Generated output
        </p>

        <h2 class="fm-output-title">
          Decision brief
        </h2>

        <p class="fm-output-subtitle">
          AI-generated from the information provided in this process.
        </p>
      </div>

      <div class="fm-output-question-nav">
        ${sections.map((section, index) => `
          <button
            type="button"
            class="fm-output-question-tab ${
              index === activeIndex ? 'active' : ''
            }"
            data-fm-output-index="${index}"
          >
            <span class="fm-output-question-number">
              ${String(index + 1).padStart(2, '0')}
            </span>

            <span class="fm-output-question-label">
              ${escape(section.question)}
            </span>
          </button>
        `).join('')}
      </div>

      <div class="fm-output-answer">
        <p class="fm-output-answer-index">
          ${String(activeIndex + 1).padStart(2, '0')}
        </p>

        <h3 class="fm-output-answer-question">
          ${escape(active.question)}
        </h3>

        <div class="fm-output-answer-body">
          ${bodyHtml}
        </div>
      </div>
    `;

    brief
      .querySelectorAll(
        '[data-fm-output-index]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            brief.dataset.activeIndex =
              button.dataset.fmOutputIndex;

            renderOutputBrief();
          }
        );
      });

    empty.hidden = true;
  }

  /*
   * Existing render() updates #analysisOutput.
   * Observe only that element so no other page section is touched.
   */
  function initialiseOutputDesign() {
    const source =
      document.querySelector('#analysisOutput');

    const outputTabButton =
      document.querySelector(
        '#processOutputsTabButton'
      );

    if (!source) return;

    const observer =
      new MutationObserver(() => {
        renderOutputBrief();
      });

    observer.observe(source, {
      childList: true,
      subtree: true,
      characterData: true
    });

    if (outputTabButton) {
      outputTabButton.addEventListener(
        'click',
        () => {
          requestAnimationFrame(
            renderOutputBrief
          );
        }
      );
    }

    renderOutputBrief();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialiseOutputDesign,
      { once: true }
    );
  } else {
    initialiseOutputDesign();
  }
})();


/* =========================================================
   OUTPUT TAB — DATA + ACTION VISIBILITY FIX ONLY
   ========================================================= */
(() => {
  function getOutputElements() {
    return {
      inputsButton: document.querySelector('#processInputsTabButton'),
      outputsButton: document.querySelector('#processOutputsTabButton'),
      inputsPanel: document.querySelector('#processInputsTab'),
      outputsPanel: document.querySelector('#processOutputsTab'),
      actions: document.querySelector('#processOutputActions'),
      source: document.querySelector('#analysisOutput'),
      empty: document.querySelector('#outputEmpty')
    };
  }

  function getSourceText(source) {
    if (!source) return '';

    const clone = source.cloneNode(true);

    clone
      .querySelectorAll('.downstream')
      .forEach(el => el.remove());

    return String(clone.textContent || '').trim();
  }

  function getCurrentQuestions() {
    try {
      const step =
        typeof currentStep === 'function'
          ? currentStep()
          : null;

      return Array.isArray(step?.questions)
        ? step.questions
        : [];
    } catch {
      return [];
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function splitGeneratedOutput(text, questions) {
    if (!text) return [];

    if (!questions.length) {
      return [{
        question: 'Generated output',
        content: text
      }];
    }

    const sections = [];

    questions.forEach((question, index) => {
      const number = index + 1;

      const escapedQuestion =
        String(question)
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const patterns = [
        new RegExp(
          `(?:^|\\n)\\s*${number}\\s*[\\.\\)\\-:]\\s*${escapedQuestion}`,
          'i'
        ),
        new RegExp(
          `(?:^|\\n)\\s*${number}\\s*[\\.\\)\\-:]`,
          'i'
        )
      ];

      let start = -1;
      let matchedLength = 0;

      for (const pattern of patterns) {
        const match = pattern.exec(text);

        if (match) {
          start =
            match.index +
            (match[0].startsWith('\n') ? 1 : 0);

          matchedLength = match[0].length;
          break;
        }
      }

      if (start < 0) return;

      let end = text.length;

      if (index < questions.length - 1) {
        const nextNumber = number + 1;

        const remaining =
          text.slice(start + matchedLength);

        const nextMatch =
          new RegExp(
            `\\n\\s*${nextNumber}\\s*[\\.\\)\\-:]`,
            'i'
          ).exec(remaining);

        if (nextMatch) {
          end =
            start +
            matchedLength +
            nextMatch.index;
        }
      }

      sections.push({
        question,
        content: text
          .slice(start + matchedLength, end)
          .trim()
      });
    });

    if (!sections.length) {
      return [{
        question: questions[0] || 'Generated output',
        content: text
      }];
    }

    return sections;
  }

  function renderDecisionBrief() {
    const {
      outputsPanel,
      source,
      empty
    } = getOutputElements();

    if (!outputsPanel || !source || !empty) return;

    const rawText = getSourceText(source);

    let brief =
      outputsPanel.querySelector('.fm-output-brief');

    if (!rawText) {
      if (brief) brief.remove();

      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    const questions = getCurrentQuestions();

    const sections =
      splitGeneratedOutput(rawText, questions);

    if (!sections.length) return;

    if (!brief) {
      brief = document.createElement('div');
      brief.className = 'fm-output-brief';
      outputsPanel.appendChild(brief);
    }

    let activeIndex =
      Number(brief.dataset.activeIndex || 0);

    if (
      !Number.isInteger(activeIndex) ||
      activeIndex < 0 ||
      activeIndex >= sections.length
    ) {
      activeIndex = 0;
    }

    const active = sections[activeIndex];

    const bodyHtml =
      typeof formatAnswer === 'function'
        ? formatAnswer(active.content)
        : `<p>${escapeHtml(active.content)
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')}</p>`;

    brief.style.setProperty(
      '--fm-question-count',
      String(Math.max(1, sections.length))
    );

    brief.innerHTML = `
      <div class="fm-output-head">
        <p class="fm-output-kicker">
          Generated output
        </p>

        <h2 class="fm-output-title">
          Decision brief
        </h2>

        <p class="fm-output-subtitle">
          AI-generated from the information provided in this process.
        </p>
      </div>

      <div class="fm-output-question-nav">
        ${sections.map((section, index) => `
          <button
            type="button"
            class="fm-output-question-tab ${
              index === activeIndex ? 'active' : ''
            }"
            data-fm-output-index="${index}"
          >
            <span class="fm-output-question-number">
              ${String(index + 1).padStart(2, '0')}
            </span>

            <span class="fm-output-question-label">
              ${escapeHtml(section.question)}
            </span>
          </button>
        `).join('')}
      </div>

      <div class="fm-output-answer">
        <p class="fm-output-answer-index">
          ${String(activeIndex + 1).padStart(2, '0')}
        </p>

        <h3 class="fm-output-answer-question">
          ${escapeHtml(active.question)}
        </h3>

        <div class="fm-output-answer-body">
          ${bodyHtml}
        </div>
      </div>
    `;

    brief
      .querySelectorAll('[data-fm-output-index]')
      .forEach(button => {
        button.addEventListener('click', () => {
          brief.dataset.activeIndex =
            button.dataset.fmOutputIndex;

          renderDecisionBrief();
        });
      });
  }

  function showInputsOnlyActions() {
    const { actions } = getOutputElements();

    if (actions) {
      actions.style.removeProperty('display');
    }
  }

  function hideActionsInOutputs() {
    const { actions } = getOutputElements();

    if (actions) {
      actions.style.setProperty(
        'display',
        'none',
        'important'
      );
    }

    requestAnimationFrame(renderDecisionBrief);
  }

  function install() {
    const {
      inputsButton,
      outputsButton,
      source
    } = getOutputElements();

    if (!inputsButton || !outputsButton || !source) {
      setTimeout(install, 100);
      return;
    }

    if (outputsButton.dataset.outputFinalFix === 'true') {
      return;
    }

    outputsButton.dataset.outputFinalFix = 'true';

    inputsButton.addEventListener(
      'click',
      showInputsOnlyActions
    );

    outputsButton.addEventListener(
      'click',
      hideActionsInOutputs
    );

    const observer =
      new MutationObserver(() => {
        renderDecisionBrief();
      });

    observer.observe(source, {
      childList: true,
      subtree: true,
      characterData: true
    });

    renderDecisionBrief();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      install,
      { once: true }
    );
  } else {
    install();
  }
})();

/* =========================================================
   OUTPUTS ONLY — SIX TILE DECISION BRIEF
   IMPORTANT:
   This block only targets #outputsPanel and its output content.
   It does NOT modify Inputs or any other page section.
   ========================================================= */
(() => {
  const STYLE_ID = 'fmSixTileOutputStyle';
  const VIEW_ID = 'fmSixTileOutput';

  /* ---------------------------------------------------------
     OUTPUT-ONLY STYLES
     --------------------------------------------------------- */
  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    /* Hide legacy output presentation ONLY when the new
       summary exists inside the real Outputs panel. */
    #outputsPanel.fm-six-output-ready .fm-output-state,
    #outputsPanel.fm-six-output-ready .fm-real-output {
      display: none !important;
    }

    /* New Output summary */
    #${VIEW_ID} {
      grid-column: 1 / -1 !important;

      width: 100% !important;
      max-width: none !important;

      margin: 0 !important;
      padding: 0 !important;

      box-sizing: border-box !important;

      border: 1px solid rgba(91, 42, 167, .15) !important;
      border-radius: 18px !important;

      background: #fff !important;

      overflow: hidden !important;
    }

    #${VIEW_ID} .fm-six-output-header {
      padding: 28px 30px 24px !important;
    }

    #${VIEW_ID} .fm-six-output-eyebrow {
      margin: 0 0 8px !important;

      color: #7350a0 !important;

      font-size: 11px !important;
      font-weight: 800 !important;

      letter-spacing: .1em !important;
      text-transform: uppercase !important;
    }

    #${VIEW_ID} .fm-six-output-header h2 {
      margin: 0 !important;

      color: #292231 !important;

      font-size: 28px !important;
      line-height: 1.15 !important;
    }

    #${VIEW_ID} .fm-six-output-header p:last-child {
      margin: 8px 0 0 !important;

      color: rgba(42, 34, 47, .58) !important;

      font-size: 14px !important;
      line-height: 1.5 !important;
    }

    /* 6 horizontal tiles (this is the ORIGINAL layout, used on the
       Outputs tab; a separate, later stylesheet block overrides this
       to a compact vertical list for the always-visible preview
       shown next to Inputs -- see "SIX TILE OUTPUT — COMPACT PREVIEW
       MODE (NEXT TO INPUTS)" further down). */
    #${VIEW_ID} .fm-six-output-grid {
      display: grid !important;

      grid-template-columns:
        repeat(6, minmax(0, 1fr)) !important;

      width: 100% !important;

      border-top: 1px solid #eee8f5 !important;
      border-bottom: 1px solid #eee8f5 !important;
    }

    #${VIEW_ID} .fm-six-output-tile {
      min-width: 0 !important;
      min-height: 285px !important;

      padding: 22px 20px 24px !important;

      box-sizing: border-box !important;

      border-right: 1px solid #eee8f5 !important;

      background: #fff !important;

      text-align: left !important;
    }

    #${VIEW_ID} .fm-six-output-tile:last-child {
      border-right: 0 !important;
    }

    #${VIEW_ID} .fm-six-output-number {
      margin: 0 0 15px !important;

      color: #6124c7 !important;

      font-size: 26px !important;
      font-weight: 800 !important;
      line-height: 1 !important;
    }

    #${VIEW_ID} .fm-six-output-tile-title {
      min-height: 55px !important;

      margin: 0 0 17px !important;

      color: #292231 !important;

      font-size: 14px !important;
      font-weight: 750 !important;
      line-height: 1.45 !important;
    }

    #${VIEW_ID} .fm-six-output-divider {
      width: 100% !important;
      height: 1px !important;

      margin: 0 0 17px !important;

      background: #eee8f5 !important;
    }

    #${VIEW_ID} .fm-six-output-summary {
      margin: 0 !important;

      color: #4b4355 !important;

      font-size: 13px !important;
      line-height: 1.65 !important;

      text-align: left !important;
    }

    #${VIEW_ID} .fm-six-output-tile:first-child {
      background:
        linear-gradient(
          180deg,
          rgba(245, 238, 255, .75) 0%,
          #fff 48%
        ) !important;

      box-shadow:
        inset 0 3px 0 #6828d3 !important;
    }

    #${VIEW_ID} .fm-six-output-recommended {
      background:
        linear-gradient(
          180deg,
          rgba(244, 249, 246, .9) 0%,
          #fff 55%
        ) !important;
    }

    #${VIEW_ID} .fm-six-output-recommended
    .fm-six-output-number {
      color: #5b25bd !important;
    }

    /* Assumption bar */
    #${VIEW_ID} .fm-six-assumption {
      margin: 22px 24px 24px !important;
      padding: 18px 22px !important;

      box-sizing: border-box !important;

      border: 1px solid rgba(211, 158, 50, .20) !important;
      border-radius: 13px !important;

      background: #fffaf2 !important;
    }

    #${VIEW_ID} .fm-six-assumption strong {
      display: block !important;

      margin: 0 0 6px !important;

      color: #aa720c !important;

      font-size: 11px !important;
      font-weight: 800 !important;

      letter-spacing: .08em !important;
      text-transform: uppercase !important;
    }

    #${VIEW_ID} .fm-six-assumption p {
      margin: 0 !important;

      color: #4a424f !important;

      font-size: 13px !important;
      line-height: 1.6 !important;
    }

    /* Only affects this Output design on narrower screens */
    @media (max-width: 1050px) {
      #${VIEW_ID} .fm-six-output-grid {
        grid-template-columns:
          repeat(3, minmax(0, 1fr)) !important;
      }

      #${VIEW_ID} .fm-six-output-tile {
        border-bottom:
          1px solid #eee8f5 !important;
      }
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/^[-–—•\s]+/, '')
      .trim();
  }

  function truncate(value, max = 230) {
    const text = cleanText(value);

    if (text.length <= max) {
      return text;
    }

    const short =
      text.slice(0, max);

    const lastSentence =
      Math.max(
        short.lastIndexOf('.'),
        short.lastIndexOf(';')
      );

    if (lastSentence > 100) {
      return short
        .slice(0, lastSentence + 1)
        .trim();
    }

    return short.trim() + '…';
  }

  function nodeRangeText(nodes) {
    return nodes
      .map(node => {
        const clone =
          node.cloneNode(true);

        /*
         * Preserve spacing between separate DOM elements.
         * The AI formatter creates STRONG / BR / text blocks
         * as separate children; wrapper.textContent used to
         * merge them into strings such as:
         *
         * AlternativeWhat it providesLikely limitation
         */
        if (clone.tagName === 'BR') {
          return '\n';
        }

        clone
          .querySelectorAll?.('br')
          .forEach(br => {
            br.replaceWith('\n');
          });

        return String(
          clone.textContent || ''
        ).trim();
      })
      .filter(Boolean)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /* ---------------------------------------------------------
     READ EXISTING AI OUTPUT
     --------------------------------------------------------- */

  function buildOutputData() {
    const source =
      document.querySelector(
        '#analysisOutput .generated-answer'
      );

    if (!source) return null;

    const children =
      [...source.children];

    /*
     * Detect the five numbered strategic questions.
     */
    const questionHeadings =
      children
        .map((element, index) => ({
          element,
          index,
          text:
            element.textContent
              .trim()
        }))
        .filter(item =>
          item.element.classList.contains(
            'answer-question'
          ) &&
          /^[1-5]\.\s*/.test(item.text)
        )
        .slice(0, 5);

    if (questionHeadings.length !== 5) {
      return null;
    }

    /*
     * Locate supplemental output sections.
     */
    const evidenceHeading =
      children.findIndex(element =>
        element.classList.contains(
          'answer-question'
        ) &&
        /evidence\s+gaps?/i.test(
          element.textContent
        )
      );

    const decisionHeading =
      children.findIndex(element =>
        element.classList.contains(
          'answer-question'
        ) &&
        /recommended\s+decision/i.test(
          element.textContent
        )
      );

    const questions =
      questionHeadings.map(
        (item, position) => {
          const next =
            questionHeadings[position + 1];

          let end =
            next
              ? next.index
              : children.length;

          if (
            position === 4 &&
            evidenceHeading > item.index
          ) {
            end = evidenceHeading;
          }

          if (
            position === 4 &&
            decisionHeading > item.index &&
            decisionHeading < end
          ) {
            end = decisionHeading;
          }

          const bodyNodes =
            children.slice(
              item.index + 1,
              end
            );

          let bodyText =
            nodeRangeText(bodyNodes);

          /*
           * Remove Informed assumption from the
           * short tile summary.
           */
          bodyText =
            bodyText.replace(
              /Informed assumption\s*:?\s*[\s\S]*$/i,
              ''
            );

          return {
            number:
              String(position + 1)
                .padStart(2, '0'),

            title:
              item.text.replace(
                /^[1-5]\.\s*/,
                ''
              ),

            summary:
              truncate(bodyText, 235)
          };
        }
      );

    /* Recommended decision */
    let recommended = '';

    if (decisionHeading >= 0) {
      recommended =
        nodeRangeText(
          children.slice(
            decisionHeading + 1
          )
        );
    }

    if (!recommended) {
      recommended =
        questions[4]?.summary || '';
    }

    /* First Informed assumption */
    const fullText =
      nodeRangeText(children);

    const assumptionMatch =
      fullText.match(
        /Informed assumption\s*:?\s*([\s\S]*?)(?=(?:\n\s*)?(?:---|[2-5]\.\s|Evidence gaps?|Recommended decision|$))/i
      );

    const assumption =
      assumptionMatch
        ? cleanText(
            assumptionMatch[1]
          )
        : '';

    return {
      questions,
      recommended:
        truncate(recommended, 250),
      assumption:
        truncate(assumption, 380)
    };
  }

  /* ---------------------------------------------------------
     RENDER — OUTPUT PANEL ONLY
     --------------------------------------------------------- */

  function renderSixTileOutput() {
    const panel =
      document.getElementById(
        'outputsPanel'
      );

    if (!panel) return;

    const data =
      buildOutputData();

    let view =
      document.getElementById(VIEW_ID);

    if (!data) {
      panel.classList.remove(
        'fm-six-output-ready'
      );

      view?.remove();
      return;
    }

    if (!view) {
      view =
        document.createElement('div');

      view.id = VIEW_ID;

      panel.appendChild(view);
    }

    panel.classList.add(
      'fm-six-output-ready'
    );

    const questionTiles =
      data.questions
        .map(item => `
          <section class="fm-six-output-tile">
            <div class="fm-six-output-number">
              ${escapeHtml(item.number)}
            </div>

            <h3 class="fm-six-output-tile-title">
              ${escapeHtml(item.title)}
            </h3>

            <div class="fm-six-output-divider"></div>

            <p class="fm-six-output-summary">
              ${escapeHtml(item.summary)}
            </p>
          </section>
        `)
        .join('');

    view.innerHTML = `
      <header class="fm-six-output-header">
        <p class="fm-six-output-eyebrow">
          Generated output
        </p>

        <h2>
          Decision brief
        </h2>

        <p>
          AI-generated from the information provided in this process.
        </p>
      </header>

      <div class="fm-six-output-grid">
        ${questionTiles}

        <section
          class="
            fm-six-output-tile
            fm-six-output-recommended
          "
        >
          <div class="fm-six-output-number">
            06
          </div>

          <h3 class="fm-six-output-tile-title">
            Recommended decision
          </h3>

          <div class="fm-six-output-divider"></div>

          <p class="fm-six-output-summary">
            ${escapeHtml(data.recommended)}
          </p>
        </section>
      </div>

      ${
        data.assumption
          ? `
            <div class="fm-six-assumption">
              <strong>
                Key assumption
              </strong>

              <p>
                ${escapeHtml(data.assumption)}
              </p>
            </div>
          `
          : ''
      }
    `;
    /*
     * NOTE: tile clicks are NOT wired here. A later block in this
     * file ("FINAL OUTPUT TILE PREVIEW + FULL ANSWER MODAL") already
     * installs a document-level delegated click handler for
     * '#fmSixTileOutput .fm-six-output-tile' that opens a per-tile
     * "full answer" modal — adding another click handler here would
     * pop open a second, different modal on top of it.
     */
  }

  /* ---------------------------------------------------------
     INSTALL ONLY ON THE OUTPUT TAB
     --------------------------------------------------------- */

  function installSixTileOutput() {
    const outputsTab =
      document.getElementById(
        'outputsTab'
      );

    const source =
      document.getElementById(
        'analysisOutput'
      );

    if (
      !outputsTab ||
      !source
    ) {
      setTimeout(
        installSixTileOutput,
        100
      );

      return;
    }

    if (
      outputsTab.dataset
        .sixTileOutputInstalled === 'true'
    ) {
      return;
    }

    outputsTab.dataset
      .sixTileOutputInstalled = 'true';

    /*
     * Build/update only when Outputs is opened.
     */
    outputsTab.addEventListener(
      'click',
      () => {
        requestAnimationFrame(
          renderSixTileOutput
        );
      }
    );

    /*
     * Keep summary synced when AI creates a new output.
     * This runs regardless of which tab is currently active, so the
     * condensed right-hand preview shows up as soon as generation
     * finishes, even while the Inputs tab is still the one showing.
     */
    const observer =
      new MutationObserver(() => {
        renderSixTileOutput();
      });

    observer.observe(
      source,
      {
        childList: true,
        subtree: true,
        characterData: true
      }
    );

    renderSixTileOutput();
  }

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      installSixTileOutput,
      { once: true }
    );
  } else {
    installSixTileOutput();
  }
})();


/* =========================================================
   SIX TILE OUTPUT — VISUAL POLISH ONLY
   Scope: #fmSixTileOutput only
   ========================================================= */
(() => {
  const STYLE_ID = 'fmSixTileOutputPolish';

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    #fmSixTileOutput {
      border-radius: 16px !important;
    }

    #fmSixTileOutput .fm-six-output-header {
      padding: 24px 28px 20px !important;
      text-align: left !important;
    }

    #fmSixTileOutput .fm-six-output-eyebrow {
      margin-bottom: 7px !important;
      font-size: 10px !important;
    }

    #fmSixTileOutput .fm-six-output-header h2 {
      font-size: 26px !important;
    }

    #fmSixTileOutput .fm-six-output-header p:last-child {
      margin-top: 6px !important;
      font-size: 13px !important;
    }

    #fmSixTileOutput .fm-six-output-grid {
      align-items: stretch !important;
    }

    #fmSixTileOutput .fm-six-output-tile {
      min-height: 245px !important;
      padding: 20px 18px 22px !important;
    }

    #fmSixTileOutput .fm-six-output-number {
      margin-bottom: 13px !important;
      font-size: 24px !important;
    }

    #fmSixTileOutput .fm-six-output-tile-title {
      min-height: 62px !important;
      margin-bottom: 14px !important;

      font-size: 13px !important;
      line-height: 1.42 !important;
    }

    #fmSixTileOutput .fm-six-output-divider {
      margin-bottom: 14px !important;
    }

    #fmSixTileOutput .fm-six-output-summary {
      font-size: 12.5px !important;
      line-height: 1.58 !important;

      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    #fmSixTileOutput .fm-six-output-tile:first-child {
      background:
        linear-gradient(
          180deg,
          rgba(246, 240, 255, .9) 0%,
          #fff 52%
        ) !important;
    }

    #fmSixTileOutput .fm-six-output-recommended {
      background:
        linear-gradient(
          180deg,
          rgba(240, 249, 244, .9) 0%,
          #fff 58%
        ) !important;
    }

    #fmSixTileOutput .fm-six-output-recommended
    .fm-six-output-tile-title {
      color: #2e4938 !important;
    }

    #fmSixTileOutput .fm-six-output-recommended
    .fm-six-output-summary {
      color: #405147 !important;
    }

    #fmSixTileOutput .fm-six-assumption {
      margin: 18px 22px 22px !important;
      padding: 16px 18px !important;
    }

    #fmSixTileOutput .fm-six-assumption strong {
      margin-bottom: 5px !important;
      font-size: 10px !important;
    }

    #fmSixTileOutput .fm-six-assumption p {
      font-size: 12.5px !important;
      line-height: 1.55 !important;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  function cleanTileText(value) {
    return String(value || '')
      .replace(/\*\*/g, '')
      .replace(/#{1,6}/g, '')
      .replace(/\|/g, ' ')
      .replace(/\s*---+\s*/g, ' ')
      .replace(/\bAlternativeWhat\b/gi, 'Alternative — What')
      .replace(/\bprovidesLikely\b/gi, ' provides. Likely')
      .replace(/\blimitationDigital\b/gi, ' limitation. Digital')
      .replace(/\btoolsSide-by-side\b/gi, ' tools. Side-by-side')
      .replace(/\bresearchMay\b/gi, ' research. May')
      .replace(/\bclarityUnderstand\b/gi, ' clarity. Understand')
      .replace(/\bengagementBuyers\b/gi, ' engagement. Buyers')
      .replace(/\bvehiclesApples\b/gi, ' vehicles. Applies')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function polishOutputText() {
    const view =
      document.getElementById('fmSixTileOutput');

    if (!view) return;

    view
      .querySelectorAll('.fm-six-output-summary')
      .forEach(summary => {
        const cleaned =
          cleanTileText(summary.textContent);

        summary.textContent = cleaned;
      });

    const assumption =
      view.querySelector('.fm-six-assumption p');

    if (assumption) {
      assumption.textContent =
        cleanTileText(
          assumption.textContent
        );
    }
  }

  polishOutputText();

  const view =
    document.getElementById('fmSixTileOutput');

  if (view) {
    const observer =
      new MutationObserver(() => {
        polishOutputText();
      });

    observer.observe(view, {
      childList: true,
      subtree: true
    });
  }
})();

/* =========================================================
   SIX TILE OUTPUT — INTERNAL TEXT SCROLL ONLY
   Scope: #fmSixTileOutput only
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'fmSixTileInternalScroll';

  style.textContent = `
    /* Keep all 6 tiles the same size */
    #fmSixTileOutput .fm-six-output-tile {
      height: 380px !important;
      min-height: 380px !important;
      max-height: 380px !important;

      display: flex !important;
      flex-direction: column !important;

      overflow: hidden !important;
    }

    /* Title stays fixed at the top */
    #fmSixTileOutput .fm-six-output-number,
    #fmSixTileOutput .fm-six-output-tile-title,
    #fmSixTileOutput .fm-six-output-divider {
      flex: 0 0 auto !important;
    }

    /* Only the answer text scrolls */
    #fmSixTileOutput .fm-six-output-summary {
      flex: 1 1 auto !important;

      min-height: 0 !important;
      max-height: none !important;

      overflow-y: auto !important;
      overflow-x: hidden !important;

      padding-right: 8px !important;

      scrollbar-width: thin !important;
      scrollbar-color:
        rgba(100, 36, 202, .28)
        transparent !important;
    }

    #fmSixTileOutput
    .fm-six-output-summary::-webkit-scrollbar {
      width: 5px !important;
    }

    #fmSixTileOutput
    .fm-six-output-summary::-webkit-scrollbar-track {
      background: transparent !important;
    }

    #fmSixTileOutput
    .fm-six-output-summary::-webkit-scrollbar-thumb {
      background: rgba(100, 36, 202, .25) !important;
      border-radius: 999px !important;
    }

    #fmSixTileOutput
    .fm-six-output-summary::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 36, 202, .42) !important;
    }
  `;

  document
    .getElementById('fmSixTileInternalScroll')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   SIX TILE OUTPUT — TEXT CLEANUP ONLY
   Scope: #fmSixTileOutput only
   ========================================================= */
(() => {
  function normaliseOutputText(value) {
    return String(value || '')
      /* Markdown cleanup */
      .replace(/\*\*/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/`/g, '')

      /* Restore spaces around common merged headings/labels */
      .replace(/AlternativeWhat/gi, 'Alternative. What')
      .replace(/providesLikely/gi, ' provides. Likely')
      .replace(/limitationDigital/gi, ' limitation. Digital')
      .replace(/toolsSide-by-side/gi, ' tools. Side-by-side')
      .replace(/researchMay/gi, ' research. May')
      .replace(/reviewsOpinions/gi, ' reviews. Opinions')
      .replace(/perspectivesInformation/gi, ' perspectives. Information')

      .replace(/Priority marketLeading wedgeCore promise/gi,
        'Priority market. Leading wedge. Core promise.')

      .replace(/promiseFinance/gi, ' promise. Finance')
      .replace(/clarityUnderstand/gi, ' clarity. Understand')
      .replace(/engagementBuyers/gi, ' engagement. Buyers')
      .replace(/vehiclesApples/gi, ' vehicles. Applies')

      /* Remove labels that should not be inside tile summaries */
      .replace(/\bEvidence gap\s*:?\s*/gi, ' ')
      .replace(/\bEvidence gaps\s*:?\s*/gi, ' ')
      .replace(/\bInformed assumption\s*:?\s*/gi, ' ')

      /* Normal spacing */
      .replace(/\s*[-–—]\s*/g, ' – ')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1')
      .trim();
  }

  function cleanSixTileOutput() {
    const view =
      document.getElementById('fmSixTileOutput');

    if (!view) return;

    view
      .querySelectorAll('.fm-six-output-summary')
      .forEach(summary => {
        const clean =
          normaliseOutputText(
            summary.textContent
          );

        summary.textContent = clean;
      });

    const assumption =
      view.querySelector(
        '.fm-six-assumption p'
      );

    if (assumption) {
      assumption.textContent =
        normaliseOutputText(
          assumption.textContent
        );
    }
  }

  cleanSixTileOutput();

  const view =
    document.getElementById('fmSixTileOutput');

  if (view) {
    const observer =
      new MutationObserver(() => {
        cleanSixTileOutput();
      });

    observer.observe(view, {
      childList: true,
      subtree: true
    });
  }
})();

/* =========================================================
   SIX TILE OUTPUT — SAFE SHORT SUMMARY
   Scope: #fmSixTileOutput only
   Does NOT modify History / Inputs / other sections.
   ========================================================= */
(() => {
  function cleanText(value) {
    return String(value || '')
      .replace(/\*\*/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/`/g, '')
      .replace(/\bEvidence gaps?\s*:?.*$/i, '')
      .replace(/\bInformed assumption\s*:?.*$/i, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1')
      .trim();
  }

  function makeShortSummary(value, maxLength = 135) {
    let text = cleanText(value);

    if (!text) return '';

    /*
     * Prefer the first complete sentence.
     */
    const sentenceMatch =
      text.match(/^(.+?[.!?])(?:\s|$)/);

    if (
      sentenceMatch &&
      sentenceMatch[1].length >= 35 &&
      sentenceMatch[1].length <= maxLength + 25
    ) {
      return sentenceMatch[1].trim();
    }

    /*
     * Otherwise truncate at a natural word boundary.
     */
    if (text.length > maxLength) {
      let cut =
        text.slice(0, maxLength);

      const lastSpace =
        cut.lastIndexOf(' ');

      if (lastSpace > 80) {
        cut =
          cut.slice(0, lastSpace);
      }

      text =
        cut.replace(/[,:;\-–—\s]+$/, '') +
        '…';
    }

    return text;
  }

  function applySafeShortSummaries() {
    const view =
      document.getElementById(
        'fmSixTileOutput'
      );

    if (!view) return;

    const summaries =
      view.querySelectorAll(
        '.fm-six-output-summary'
      );

    summaries.forEach(summary => {
      /*
       * Store the original tile text once so repeated
       * clicks/re-renders do not shorten an already-shortened string.
       */
      if (!summary.dataset.fullTileText) {
        summary.dataset.fullTileText =
          summary.textContent || '';
      }

      summary.textContent =
        makeShortSummary(
          summary.dataset.fullTileText,
          135
        );
    });
  }

  /*
   * Apply once after page load.
   */
  requestAnimationFrame(() => {
    applySafeShortSummaries();
  });

  /*
   * Re-apply when the real Outputs tab is opened.
   * No page-wide observer and no changes outside Output.
   */
  const outputsTab =
    document.getElementById('outputsTab');

  if (outputsTab) {
    outputsTab.addEventListener(
      'click',
      () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(
            applySafeShortSummaries
          );
        });
      }
    );
  }
})();

/* =========================================================
   SIX TILE OUTPUT — CLICK TILE TO VIEW FULL ANSWER
   Scope: #fmSixTileOutput only
   ========================================================= */
(() => {
  const MODAL_ID = 'fmTileAnswerModal';
  const STYLE_ID = 'fmTileAnswerModalStyle';

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    #fmSixTileOutput .fm-six-output-tile {
      cursor: pointer !important;
    }

    #fmSixTileOutput .fm-six-output-tile:hover {
      box-shadow:
        inset 0 0 0 1px rgba(100, 36, 202, .18) !important;
    }

    #${MODAL_ID} {
      position: fixed !important;
      inset: 0 !important;
      z-index: 999999 !important;

      display: none !important;

      align-items: center !important;
      justify-content: center !important;

      padding: 28px !important;

      box-sizing: border-box !important;
    }

    #${MODAL_ID}.open {
      display: flex !important;
    }

    #${MODAL_ID} .fm-tile-modal-backdrop {
      position: absolute !important;
      inset: 0 !important;

      background: rgba(35, 25, 45, .30) !important;

      backdrop-filter: blur(5px) !important;
      -webkit-backdrop-filter: blur(5px) !important;
    }

    #${MODAL_ID} .fm-tile-modal-card {
      position: relative !important;
      z-index: 1 !important;

      width: min(760px, 100%) !important;
      max-height: min(720px, calc(100vh - 56px)) !important;

      overflow-y: auto !important;

      padding: 28px 30px 30px !important;

      box-sizing: border-box !important;

      border: 1px solid rgba(91,42,167,.15) !important;
      border-radius: 18px !important;

      background: #fff !important;

      box-shadow:
        0 28px 80px rgba(39,24,54,.22) !important;
    }

    #${MODAL_ID} .fm-tile-modal-close {
      position: absolute !important;
      top: 18px !important;
      right: 18px !important;

      width: 36px !important;
      height: 36px !important;

      border: 0 !important;
      border-radius: 50% !important;

      background: #f2edf7 !important;
      color: #4b1d88 !important;

      font-size: 22px !important;
      line-height: 1 !important;

      cursor: pointer !important;
    }

    #${MODAL_ID} .fm-tile-modal-number {
      margin: 0 0 8px !important;

      color: #6424ca !important;

      font-size: 12px !important;
      font-weight: 800 !important;
    }

    #${MODAL_ID} .fm-tile-modal-title {
      margin: 0 48px 20px 0 !important;

      color: #292231 !important;

      font-size: 24px !important;
      line-height: 1.3 !important;
    }

    #${MODAL_ID} .fm-tile-modal-body {
      color: #3f3748 !important;

      font-size: 14px !important;
      line-height: 1.7 !important;

      text-align: left !important;
    }

    #${MODAL_ID} .fm-tile-modal-body * {
      text-align: left !important;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  function ensureModal() {
    let modal =
      document.getElementById(MODAL_ID);

    if (modal) return modal;

    modal =
      document.createElement('div');

    modal.id = MODAL_ID;

    modal.innerHTML = `
      <div
        class="fm-tile-modal-backdrop"
        data-close-tile-modal
      ></div>

      <section
        class="fm-tile-modal-card"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="fm-tile-modal-close"
          data-close-tile-modal
          aria-label="Close"
        >
          ×
        </button>

        <p class="fm-tile-modal-number"></p>

        <h2 class="fm-tile-modal-title"></h2>

        <div class="fm-tile-modal-body"></div>
      </section>
    `;

    document.body.appendChild(modal);

    modal
      .querySelectorAll('[data-close-tile-modal]')
      .forEach(element => {
        element.addEventListener(
          'click',
          () => {
            modal.classList.remove('open');
          }
        );
      });

    return modal;
  }

  function getFullOutputSections() {
    const source =
      document.querySelector(
        '#analysisOutput .generated-answer'
      );

    if (!source) return [];

    const children =
      [...source.children];

    const headings =
      children
        .map((element, index) => ({
          element,
          index,
          text: element.textContent.trim()
        }))
        .filter(item =>
          item.element.classList.contains(
            'answer-question'
          )
        );

    const questionHeadings =
      headings
        .filter(item =>
          /^[1-5]\.\s*/.test(item.text)
        )
        .slice(0, 5);

    const recommendedHeading =
      headings.find(item =>
        /recommended\s+decision/i.test(
          item.text
        )
      );

    const sections =
      questionHeadings.map(
        (item, position) => {
          const next =
            questionHeadings[position + 1];

          let end =
            next
              ? next.index
              : (
                  recommendedHeading
                    ? recommendedHeading.index
                    : children.length
                );

          const html =
            children
              .slice(
                item.index + 1,
                end
              )
              .map(el => el.outerHTML)
              .join('');

          return {
            number:
              String(position + 1)
                .padStart(2, '0'),

            title:
              item.text.replace(
                /^[1-5]\.\s*/,
                ''
              ),

            html
          };
        }
      );

    if (recommendedHeading) {
      sections.push({
        number: '06',
        title: 'Recommended decision',
        html:
          children
            .slice(
              recommendedHeading.index + 1
            )
            .map(el => el.outerHTML)
            .join('')
      });
    }

    return sections;
  }

  function openTileModal(index) {
    const sections =
      getFullOutputSections();

    const section =
      sections[index];

    if (!section) return;

    const modal =
      ensureModal();

    modal.querySelector(
      '.fm-tile-modal-number'
    ).textContent = section.number;

    modal.querySelector(
      '.fm-tile-modal-title'
    ).textContent = section.title;

    modal.querySelector(
      '.fm-tile-modal-body'
    ).innerHTML = section.html;

    modal.classList.add('open');
  }

  function installTileClicks() {
    const view =
      document.getElementById(
        'fmSixTileOutput'
      );

    if (!view) return;

    const tiles =
      view.querySelectorAll(
        '.fm-six-output-tile'
      );

    tiles.forEach((tile, index) => {
      if (
        tile.dataset
          .fullAnswerReady === 'true'
      ) {
        return;
      }

      tile.dataset
        .fullAnswerReady = 'true';

      tile.setAttribute(
        'role',
        'button'
      );

      tile.setAttribute(
        'tabindex',
        '0'
      );

      tile.addEventListener(
        'click',
        () => openTileModal(index)
      );

      tile.addEventListener(
        'keydown',
        event => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            openTileModal(index);
          }
        }
      );
    });
  }

  requestAnimationFrame(
    installTileClicks
  );

  const outputsTab =
    document.getElementById(
      'outputsTab'
    );

  if (outputsTab) {
    outputsTab.addEventListener(
      'click',
      () => {
        requestAnimationFrame(
          installTileClicks
        );
      }
    );
  }

  document.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Escape') return;

      document
        .getElementById(MODAL_ID)
        ?.classList.remove('open');
    }
  );
})();

/* =========================================================
   OUTPUT TILE MODAL — PERMANENT CLICK FIX
   OUTPUT ONLY
   ========================================================= */
(() => {
  if (window.__fmOutputTileClickFix) return;
  window.__fmOutputTileClickFix = true;

  document.addEventListener('click', event => {
    const tile =
      event.target.closest(
        '#fmSixTileOutput .fm-six-output-tile'
      );

    if (!tile) return;

    const view =
      document.getElementById('fmSixTileOutput');

    if (!view) return;

    const tiles =
      [...view.querySelectorAll(
        '.fm-six-output-tile'
      )];

    const index =
      tiles.indexOf(tile);

    if (index < 0) return;

    /*
     * Reuse the modal/full-answer functions from
     * the previous OUTPUT-ONLY patch.
     */
    const source =
      document.querySelector(
        '#analysisOutput .generated-answer'
      );

    if (!source) {
      console.log(
        'Full generated output source not found'
      );
      return;
    }

    const children =
      [...source.children];

    const headings =
      children
        .map((element, childIndex) => ({
          element,
          index: childIndex,
          text:
            element.textContent
              .trim()
        }))
        .filter(item =>
          item.element.classList.contains(
            'answer-question'
          )
        );

    const questions =
      headings
        .filter(item =>
          /^[1-5]\.\s*/.test(item.text)
        )
        .slice(0, 5);

    const recommended =
      headings.find(item =>
        /recommended\s+decision/i.test(
          item.text
        )
      );

    let title = '';
    let number =
      String(index + 1)
        .padStart(2, '0');

    let bodyHTML = '';

    if (index < 5) {
      const current =
        questions[index];

      if (!current) return;

      const next =
        questions[index + 1];

      let end =
        next
          ? next.index
          : children.length;

      /*
       * Q5 must stop before supplemental
       * Evidence gaps / Recommended decision.
       */
      if (index === 4) {
        const supplemental =
          headings
            .filter(item =>
              item.index > current.index &&
              (
                /evidence\s+gaps?/i.test(
                  item.text
                ) ||
                /recommended\s+decision/i.test(
                  item.text
                )
              )
            )
            .sort(
              (a, b) =>
                a.index - b.index
            )[0];

        if (supplemental) {
          end = supplemental.index;
        }
      }

      title =
        current.text.replace(
          /^[1-5]\.\s*/,
          ''
        );

      bodyHTML =
        children
          .slice(
            current.index + 1,
            end
          )
          .map(element =>
            element.outerHTML
          )
          .join('');

    } else {
      number = '06';
      title = 'Recommended decision';

      if (recommended) {
        bodyHTML =
          children
            .slice(
              recommended.index + 1
            )
            .map(element =>
              element.outerHTML
            )
            .join('');
      } else {
        /*
         * Fallback: use exactly what tile 06
         * currently displays.
         */
        bodyHTML = `
          <p>
            ${
              tile.querySelector(
                '.fm-six-output-summary'
              )?.innerHTML || ''
            }
          </p>
        `;
      }
    }

    let modal =
      document.getElementById(
        'fmTileAnswerModal'
      );

    /*
     * Create modal if previous patch did not.
     */
    if (!modal) {
      modal =
        document.createElement('div');

      modal.id = 'fmTileAnswerModal';

      modal.innerHTML = `
        <div
          class="fm-tile-modal-backdrop"
          data-fm-close-output
        ></div>

        <section
          class="fm-tile-modal-card"
          role="dialog"
          aria-modal="true"
        >
          <button
            class="fm-tile-modal-close"
            type="button"
            data-fm-close-output
            aria-label="Close"
          >
            ×
          </button>

          <div
            class="fm-tile-modal-number"
          ></div>

          <h2
            class="fm-tile-modal-title"
          ></h2>

          <div
            class="fm-tile-modal-body"
          ></div>
        </section>
      `;

      document.body.appendChild(modal);
    }

    modal.querySelector(
      '.fm-tile-modal-number'
    ).textContent = number;

    modal.querySelector(
      '.fm-tile-modal-title'
    ).textContent = title;

    modal.querySelector(
      '.fm-tile-modal-body'
    ).innerHTML = bodyHTML;

    modal.classList.add('open');

    console.log(
      'OUTPUT FULL ANSWER OPENED:',
      number
    );
  });

  /*
   * Delegated close — also survives rerenders.
   */
  document.addEventListener(
    'click',
    event => {
      if (
        !event.target.closest(
          '[data-fm-close-output]'
        )
      ) return;

      document
        .getElementById(
          'fmTileAnswerModal'
        )
        ?.classList.remove('open');
    }
  );

  document.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Escape') return;

      document
        .getElementById(
          'fmTileAnswerModal'
        )
        ?.classList.remove('open');
    }
  );

  console.log(
    '✓ OUTPUT TILE CLICK FIX INSTALLED'
  );
})();

/* =========================================================
   SIX TILE OUTPUT — SHOW FIRST LINES ONLY
   Scope: #fmSixTileOutput only
   Full answer still opens on tile click.
   ========================================================= */
(() => {
  const STYLE_ID = 'fmSixTileLineClampStyle';

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    #fmSixTileOutput .fm-six-output-summary {
      display: -webkit-box !important;
      -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 5 !important;

      overflow: hidden !important;

      max-height: none !important;

      white-space: normal !important;
      text-overflow: ellipsis !important;
    }

    #fmSixTileOutput .fm-six-output-tile {
      cursor: pointer !important;
    }

    #fmSixTileOutput .fm-six-output-tile:hover {
      box-shadow:
        inset 0 0 0 1px rgba(100, 36, 202, .16) !important;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);
})();

/* =========================================================
   FINAL OUTPUT TILE PREVIEW + FULL ANSWER MODAL
   Scope: #fmSixTileOutput ONLY
   ========================================================= */
(() => {
  const STYLE_ID = 'fmFinalTilePreviewStyle';
  const MODAL_ID = 'fmFinalAnswerModal';

  /* ========================================================
     STYLE — OUTPUT ONLY
     ======================================================== */
  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    /* Only the answer preview inside each Output tile */
    #fmSixTileOutput .fm-six-output-summary {
      display: -webkit-box !important;
      -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 4 !important;

      overflow: hidden !important;

      height: auto !important;
      min-height: 0 !important;
      max-height: 6.6em !important;

      padding: 0 !important;
      padding-right: 0 !important;

      white-space: normal !important;
      text-overflow: ellipsis !important;

      overflow-y: hidden !important;
      overflow-x: hidden !important;
    }

    #fmSixTileOutput .fm-six-output-tile {
      cursor: pointer !important;
      transition:
        box-shadow .15s ease,
        transform .15s ease !important;
    }

    #fmSixTileOutput .fm-six-output-tile:hover {
      transform: translateY(-1px) !important;

      box-shadow:
        inset 0 0 0 1px rgba(98, 36, 199, .16) !important;
    }

    /* ======================================================
       FULL ANSWER MODAL
       ====================================================== */
    #${MODAL_ID} {
      position: fixed !important;
      inset: 0 !important;

      z-index: 999999 !important;

      display: none !important;

      align-items: center !important;
      justify-content: center !important;

      padding: 28px !important;

      box-sizing: border-box !important;
    }

    #${MODAL_ID}.open {
      display: flex !important;
    }

    #${MODAL_ID} .fm-final-modal-backdrop {
      position: absolute !important;
      inset: 0 !important;

      background: rgba(32, 24, 42, .34) !important;

      backdrop-filter: blur(5px) !important;
      -webkit-backdrop-filter: blur(5px) !important;
    }

    #${MODAL_ID} .fm-final-modal-card {
      position: relative !important;
      z-index: 1 !important;

      width: min(760px, 100%) !important;
      max-height: calc(100vh - 70px) !important;

      padding: 30px 32px !important;

      box-sizing: border-box !important;

      overflow-y: auto !important;

      border: 1px solid rgba(94, 45, 150, .15) !important;
      border-radius: 18px !important;

      background: #fff !important;

      box-shadow:
        0 28px 70px rgba(35, 21, 50, .22) !important;
    }

    #${MODAL_ID} .fm-final-modal-close {
      position: absolute !important;

      top: 17px !important;
      right: 17px !important;

      width: 36px !important;
      height: 36px !important;

      padding: 0 !important;

      border: 0 !important;
      border-radius: 50% !important;

      background: #f3eef9 !important;
      color: #53209c !important;

      font-size: 22px !important;
      line-height: 36px !important;

      cursor: pointer !important;
    }

    #${MODAL_ID} .fm-final-modal-number {
      margin: 0 0 8px !important;

      color: #6424ca !important;

      font-size: 12px !important;
      font-weight: 800 !important;
    }

    #${MODAL_ID} .fm-final-modal-title {
      margin: 0 48px 22px 0 !important;

      color: #292231 !important;

      font-size: 25px !important;
      line-height: 1.3 !important;

      text-align: left !important;
    }

    #${MODAL_ID} .fm-final-modal-body {
      color: #3d3545 !important;

      font-size: 14px !important;
      line-height: 1.72 !important;

      text-align: left !important;
    }

    #${MODAL_ID} .fm-final-modal-body * {
      text-align: left !important;
    }

    #${MODAL_ID} .fm-final-modal-body .answer-question {
      display: none !important;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  /* ========================================================
     CREATE MODAL
     ======================================================== */
  function getModal() {
    let modal =
      document.getElementById(MODAL_ID);

    if (modal) return modal;

    modal =
      document.createElement('div');

    modal.id = MODAL_ID;

    modal.innerHTML = `
      <div
        class="fm-final-modal-backdrop"
        data-fm-final-close
      ></div>

      <section
        class="fm-final-modal-card"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="fm-final-modal-close"
          data-fm-final-close
          aria-label="Close"
        >
          ×
        </button>

        <div class="fm-final-modal-number"></div>

        <h2 class="fm-final-modal-title"></h2>

        <div class="fm-final-modal-body"></div>
      </section>
    `;

    document.body.appendChild(modal);

    return modal;
  }

  /* ========================================================
     READ FULL ANSWER FROM ORIGINAL GENERATED OUTPUT
     ======================================================== */
  function getFullAnswer(index) {
    const source =
      document.querySelector(
        '#analysisOutput .generated-answer'
      );

    if (!source) return null;

    const children =
      [...source.children];

    const headings =
      children
        .map((element, childIndex) => ({
          element,
          index: childIndex,
          text:
            String(
              element.textContent || ''
            ).trim()
        }))
        .filter(item =>
          item.element.classList.contains(
            'answer-question'
          )
        );

    const questions =
      headings
        .filter(item =>
          /^[1-5]\.\s*/.test(item.text)
        )
        .slice(0, 5);

    /* Q1–Q5 */
    if (index < 5) {
      const current =
        questions[index];

      if (!current) return null;

      const next =
        questions[index + 1];

      let end =
        next
          ? next.index
          : children.length;

      /*
       * Q5 must stop before Evidence gaps /
       * Recommended decision.
       */
      if (index === 4) {
        const extra =
          headings
            .filter(item =>
              item.index > current.index &&
              (
                /evidence\s+gaps?/i.test(
                  item.text
                ) ||
                /recommended\s+decision/i.test(
                  item.text
                )
              )
            )
            .sort(
              (a, b) =>
                a.index - b.index
            )[0];

        if (extra) {
          end = extra.index;
        }
      }

      return {
        number:
          String(index + 1)
            .padStart(2, '0'),

        title:
          current.text.replace(
            /^[1-5]\.\s*/,
            ''
          ),

        html:
          children
            .slice(
              current.index + 1,
              end
            )
            .map(el => el.outerHTML)
            .join('')
      };
    }

    /* Q6 — Recommended decision */
    const recommended =
      headings.find(item =>
        /recommended\s+decision/i.test(
          item.text
        )
      );

    if (recommended) {
      return {
        number: '06',
        title: 'Recommended decision',

        html:
          children
            .slice(
              recommended.index + 1
            )
            .map(el => el.outerHTML)
            .join('')
      };
    }

    /*
     * Fallback to visible Q6 text.
     */
    const tile =
      document.querySelectorAll(
        '#fmSixTileOutput .fm-six-output-tile'
      )[5];

    return {
      number: '06',
      title: 'Recommended decision',
      html: `
        <p>
          ${
            tile
              ?.querySelector(
                '.fm-six-output-summary'
              )
              ?.innerHTML || ''
          }
        </p>
      `
    };
  }

  /* ========================================================
     EVENT DELEGATION — SURVIVES OUTPUT RERENDER
     ======================================================== */
  document.addEventListener(
    'click',
    event => {
      const tile =
        event.target.closest(
          '#fmSixTileOutput .fm-six-output-tile'
        );

      if (!tile) return;

      const tiles =
        [
          ...document.querySelectorAll(
            '#fmSixTileOutput .fm-six-output-tile'
          )
        ];

      const index =
        tiles.indexOf(tile);

      if (index < 0) return;

      const answer =
        getFullAnswer(index);

      if (!answer) {
        console.log(
          'Full Output answer not found:',
          index
        );
        return;
      }

      const modal =
        getModal();

      modal.querySelector(
        '.fm-final-modal-number'
      ).textContent =
        answer.number;

      modal.querySelector(
        '.fm-final-modal-title'
      ).textContent =
        answer.title;

      modal.querySelector(
        '.fm-final-modal-body'
      ).innerHTML =
        answer.html;

      modal.classList.add('open');
    }
  );

  /* Close modal */
  document.addEventListener(
    'click',
    event => {
      if (
        !event.target.closest(
          '[data-fm-final-close]'
        )
      ) {
        return;
      }

      document
        .getElementById(MODAL_ID)
        ?.classList.remove('open');
    }
  );

  document.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Escape') return;

      document
        .getElementById(MODAL_ID)
        ?.classList.remove('open');
    }
  );

  console.log(
    '✓ FINAL OUTPUT TILE PREVIEW INSTALLED'
  );
})();

/* =========================================================
   SIX TILE OUTPUT — HARD 4-LINE PREVIEW FIX
   Scope: #fmSixTileOutput ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'fmHardTileClampStyle';

  style.textContent = `
    #fmSixTileOutput .fm-six-output-summary {
      display: block !important;

      flex: 0 0 auto !important;

      line-height: 1.58 !important;

      height: auto !important;
      min-height: 0 !important;

      /* Approx. 4 lines */
      max-height: 6.32em !important;

      overflow: hidden !important;
      overflow-y: hidden !important;
      overflow-x: hidden !important;

      white-space: normal !important;

      padding: 0 !important;
      padding-right: 0 !important;

      margin-bottom: 0 !important;
    }
  `;

  document
    .getElementById('fmHardTileClampStyle')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   SIX TILE OUTPUT — CLEAR PREVIEW CUE
   Scope: #fmSixTileOutput ONLY
   ========================================================= */
(() => {
  const style = document.createElement('style');
  style.id = 'fmOutputPreviewCueStyle';

  style.textContent = `
    #fmSixTileOutput .fm-six-output-summary {
      display: block !important;

      line-height: 1.58 !important;

      /* Exactly ~3 lines */
      max-height: 4.74em !important;

      overflow: hidden !important;
      overflow-y: hidden !important;

      margin-bottom: 10px !important;
    }

    #fmSixTileOutput .fm-six-output-tile::after {
      content: "Click to view full answer →";

      display: block !important;

      margin-top: 4px !important;

      color: #6424ca !important;

      font-size: 11px !important;
      font-weight: 700 !important;
      line-height: 1.4 !important;

      opacity: .78 !important;
    }

    #fmSixTileOutput
    .fm-six-output-recommended::after {
      content: "Click to view full decision →";
    }

    #fmSixTileOutput .fm-six-output-tile {
      cursor: pointer !important;
    }
  `;

  document
    .getElementById('fmOutputPreviewCueStyle')
    ?.remove();

  document.head.appendChild(style);
})();

/* =========================================================
   OUTPUT ONLY — REMOVE DUPLICATE FULL ANSWER MODAL
   Keep: #fmFinalAnswerModal
   Disable/remove legacy: #fmTileAnswerModal
   ========================================================= */
(() => {
  /*
   * Remove any legacy modal already created.
   */
  document
    .getElementById('fmTileAnswerModal')
    ?.remove();

  /*
   * Prevent the legacy modal from ever becoming visible
   * if an old click listener recreates it.
   */
  const style = document.createElement('style');
  style.id = 'fmDisableLegacyOutputModal';

  style.textContent = `
    #fmTileAnswerModal {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;

  document
    .getElementById('fmDisableLegacyOutputModal')
    ?.remove();

  document.head.appendChild(style);

  /*
   * If legacy code recreates the old modal after a click,
   * remove it immediately.
   */
  const observer = new MutationObserver(() => {
    const oldModal =
      document.getElementById(
        'fmTileAnswerModal'
      );

    if (oldModal) {
      oldModal.remove();
    }
  });

  observer.observe(
    document.body,
    {
      childList: true
    }
  );

  console.log(
    '✓ DUPLICATE OUTPUT MODAL FIX INSTALLED'
  );
})();

/* =========================================================
   OUTPUT ONLY — REAL FULL ANSWER / PREVIEW FIX
   Root cause:
   source.children ignored text nodes.
   This fix reads source.childNodes instead.
   Scope:
   #fmSixTileOutput + #fmFinalAnswerModal ONLY
   ========================================================= */
(() => {
  if (window.__fmRealOutputNodeFix) return;
  window.__fmRealOutputNodeFix = true;

  function getSource() {
    return document.querySelector(
      '#analysisOutput .generated-answer'
    );
  }

  function normaliseText(value) {
    return String(value || '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function serializeNodes(nodes) {
    const holder =
      document.createElement('div');

    nodes.forEach(node => {
      holder.appendChild(
        node.cloneNode(true)
      );
    });

    return holder.innerHTML;
  }

  function textFromNodes(nodes) {
    const holder =
      document.createElement('div');

    nodes.forEach(node => {
      holder.appendChild(
        node.cloneNode(true)
      );
    });

    holder
      .querySelectorAll('br')
      .forEach(br => {
        br.replaceWith(' ');
      });

    return normaliseText(
      holder.textContent
    );
  }

  function parseFullOutput() {
    const source = getSource();

    if (!source) return [];

    /*
     * IMPORTANT:
     * childNodes includes BOTH text nodes and elements.
     */
    const nodes =
      [...source.childNodes];

    const headings =
      nodes
        .map((node, index) => {
          if (
            node.nodeType !==
            Node.ELEMENT_NODE
          ) {
            return null;
          }

          if (
            !node.classList.contains(
              'answer-question'
            )
          ) {
            return null;
          }

          return {
            node,
            index,
            text:
              String(
                node.textContent || ''
              ).trim()
          };
        })
        .filter(Boolean);

    const questionHeadings =
      headings
        .filter(item =>
          /^[1-5]\.\s*/.test(
            item.text
          )
        )
        .slice(0, 5);

    const evidenceHeading =
      headings.find(item =>
        /evidence\s+gaps?/i.test(
          item.text
        )
      );

    const recommendedHeading =
      headings.find(item =>
        /recommended\s+decision/i.test(
          item.text
        )
      );

    const sections =
      questionHeadings.map(
        (heading, questionIndex) => {
          const next =
            questionHeadings[
              questionIndex + 1
            ];

          let end =
            next
              ? next.index
              : nodes.length;

          /*
           * Q5 stops before Evidence gaps /
           * Recommended decision.
           */
          if (questionIndex === 4) {
            const candidates = [
              evidenceHeading,
              recommendedHeading
            ]
              .filter(
                item =>
                  item &&
                  item.index >
                    heading.index
              )
              .sort(
                (a, b) =>
                  a.index - b.index
              );

            if (candidates[0]) {
              end =
                candidates[0].index;
            }
          }

          const bodyNodes =
            nodes.slice(
              heading.index + 1,
              end
            );

          return {
            number:
              String(
                questionIndex + 1
              ).padStart(2, '0'),

            title:
              heading.text.replace(
                /^[1-5]\.\s*/,
                ''
              ),

            nodes: bodyNodes,

            html:
              serializeNodes(
                bodyNodes
              ),

            text:
              textFromNodes(
                bodyNodes
              )
          };
        }
      );

    if (recommendedHeading) {
      const bodyNodes =
        nodes.slice(
          recommendedHeading.index + 1
        );

      sections.push({
        number: '06',
        title:
          'Recommended decision',

        nodes: bodyNodes,

        html:
          serializeNodes(
            bodyNodes
          ),

        text:
          textFromNodes(
            bodyNodes
          )
      });
    }

    return sections;
  }

  /* =======================================================
     TILE PREVIEW
     Show only beginning of REAL answer.
     No summarising. No data modification.
     ======================================================= */

  function updateTilePreviews() {
    const view =
      document.getElementById(
        'fmSixTileOutput'
      );

    if (!view) return;

    const sections =
      parseFullOutput();

    if (!sections.length) return;

    const summaries =
      [
        ...view.querySelectorAll(
          '.fm-six-output-summary'
        )
      ];

    summaries.forEach(
      (element, index) => {
        const section =
          sections[index];

        if (!section) return;

        /*
         * Remove Informed assumption from
         * the little preview only.
         * Full modal still contains it.
         */
        let preview =
          section.text.replace(
            /Informed assumption\s*:?\s*[\s\S]*$/i,
            ''
          );

        preview =
          normaliseText(
            preview
          );

        element.textContent =
          preview;
      }
    );
  }

  /* =======================================================
     MODAL
     Uses REAL section HTML including text nodes.
     ======================================================= */

  function ensureModal() {
    let modal =
      document.getElementById(
        'fmFinalAnswerModal'
      );

    if (modal) return modal;

    modal =
      document.createElement(
        'div'
      );

    modal.id =
      'fmFinalAnswerModal';

    modal.innerHTML = `
      <div
        class="fm-final-modal-backdrop"
        data-fm-node-close
      ></div>

      <section
        class="fm-final-modal-card"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="fm-final-modal-close"
          data-fm-node-close
          aria-label="Close"
        >
          ×
        </button>

        <div
          class="fm-final-modal-number"
        ></div>

        <h2
          class="fm-final-modal-title"
        ></h2>

        <div
          class="fm-final-modal-body"
        ></div>
      </section>
    `;

    document.body.appendChild(
      modal
    );

    return modal;
  }

  /*
   * CAPTURE listener:
   * Handles tile before old Output click
   * listeners can run.
   */
  document.addEventListener(
    'click',
    event => {
      const tile =
        event.target.closest(
          '#fmSixTileOutput .fm-six-output-tile'
        );

      if (!tile) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const tiles =
        [
          ...document.querySelectorAll(
            '#fmSixTileOutput .fm-six-output-tile'
          )
        ];

      const index =
        tiles.indexOf(tile);

      if (index < 0) return;

      const sections =
        parseFullOutput();

      const section =
        sections[index];

      if (!section) {
        console.log(
          'Output section not found:',
          index
        );
        return;
      }

      const modal =
        ensureModal();

      modal.querySelector(
        '.fm-final-modal-number'
      ).textContent =
        section.number;

      modal.querySelector(
        '.fm-final-modal-title'
      ).textContent =
        section.title;

      modal.querySelector(
        '.fm-final-modal-body'
      ).innerHTML =
        section.html;

      modal.classList.add(
        'open'
      );

      console.log(
        'REAL FULL ANSWER:',
        {
          number:
            section.number,

          textLength:
            section.text.length,

          htmlLength:
            section.html.length
        }
      );
    },
    true
  );

  /* Close */
  document.addEventListener(
    'click',
    event => {
      if (
        !event.target.closest(
          '[data-fm-node-close]'
        ) &&
        !event.target.closest(
          '[data-fm-final-close]'
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      document
        .getElementById(
          'fmFinalAnswerModal'
        )
        ?.classList.remove(
          'open'
        );
    },
    true
  );

  document.addEventListener(
    'keydown',
    event => {
      if (
        event.key !== 'Escape'
      ) return;

      document
        .getElementById(
          'fmFinalAnswerModal'
        )
        ?.classList.remove(
          'open'
        );
    }
  );

  /* Initial Output */
  requestAnimationFrame(
    updateTilePreviews
  );

  /*
   * Six-tile view can be rebuilt when
   * Outputs tab is reopened.
   */
  const outputsTab =
    document.getElementById(
      'outputsTab'
    );

  if (outputsTab) {
    outputsTab.addEventListener(
      'click',
      () => {
        requestAnimationFrame(
          () => {
            requestAnimationFrame(
              updateTilePreviews
            );
          }
        );
      }
    );
  }

  console.log(
    '✓ REAL OUTPUT CHILDNODE FIX INSTALLED'
  );
})();

/* =========================================================
   OUTPUTS ON THE INPUTS TAB — "VIEW RESULTS" BUTTON ONLY
   Scope: #outputsPanel ONLY

   Per latest instruction: no generated content (not even a short
   preview) should be visible while on the Inputs tab. Once a result
   exists, the right-hand column shows a single button instead;
   clicking it jumps straight to the Outputs tab, where the existing
   full six-tile view (untouched, original horizontal layout) is
   what's actually shown.

   State is driven by the two classes app.js already toggles on
   #outputsPanel:
     - fm-six-output-ready      -> a result exists
     - fm-outputs-tab-active    -> the Outputs tab is the open one

   This block is appended last on purpose so it wins the cascade
   over any earlier six-tile styling.
   ========================================================= */
(() => {
  const BUTTON_ID = 'fmViewOutputButton';
  const STYLE_ID = 'fmViewOutputButtonStyle';

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    /* Hide the six-tile preview entirely while on the Inputs tab --
       it should only ever be visible on the Outputs tab. */
    #outputsPanel:not(.fm-outputs-tab-active) #fmSixTileOutput {
      display: none !important;
    }

    #${BUTTON_ID} {
      display: none;
    }

    #outputsPanel.fm-six-output-ready:not(.fm-outputs-tab-active) #${BUTTON_ID} {
      display: flex !important;

      grid-column: 2 !important;
      grid-row: 1 !important;

      width: 100% !important;
      min-width: 0 !important;

      align-items: center !important;
      justify-content: center !important;
      flex-direction: column !important;
      gap: 10px !important;

      min-height: 200px !important;
      box-sizing: border-box !important;
      padding: 32px !important;

      border: 1px solid rgba(91, 42, 167, .15) !important;
      border-radius: 18px !important;
      background: #fff !important;

      color: #5b25bd !important;
      font: inherit !important;
      font-weight: 700 !important;
      font-size: 15px !important;

      cursor: pointer !important;
      text-align: center !important;
    }

    #${BUTTON_ID}:hover {
      background: #f8f4ff !important;
      border-color: rgba(91, 42, 167, .32) !important;
    }

    #${BUTTON_ID} .fm-view-output-icon {
      width: 40px !important;
      height: 40px !important;

      display: flex !important;
      align-items: center !important;
      justify-content: center !important;

      border-radius: 50% !important;
      background: #f1e9fa !important;

      font-size: 18px !important;
    }

    #${BUTTON_ID} .fm-view-output-sub {
      color: #7b7485 !important;
      font-weight: 500 !important;
      font-size: 13px !important;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  function ensureButton() {
    const outputsPanel = document.getElementById('outputsPanel');
    const outputsTab = document.getElementById('outputsTab');

    if (!outputsPanel || !outputsTab) {
      setTimeout(ensureButton, 100);
      return;
    }

    if (document.getElementById(BUTTON_ID)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';

    button.innerHTML = `
      <span class="fm-view-output-icon" aria-hidden="true">✦</span>
      <span>Results generated</span>
      <span class="fm-view-output-sub">Click to view in Outputs →</span>
    `;

    button.addEventListener('click', () => {
      outputsTab.click();
    });

    outputsPanel.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButton, { once: true });
  } else {
    ensureButton();
  }
})();

/* =========================================================
   2026-08-31 CLIENT FOLLOW-UP CHANGES
   Appended last on purpose so these rules/moves win the
   cascade over every earlier block that touched the same
   elements.
   ========================================================= */

/* ---------------------------------------------------------
   Key Questions + Market Segments (mini) + Customer & Market
   Evidence now live together as a right-hand stack on the
   Inputs tab, replacing the old empty-state / "View Results"
   button. On the Outputs tab this stack is hidden and the
   full six-tile output takes over the full width exactly as
   before.
   --------------------------------------------------------- */
(() => {
  const STACK_ID = 'fmInputsRightStack';
  const STYLE_ID = 'fmInputsRightStackStyle';
  const MINI_SEGMENTS_ID = 'fmMiniSegments';
  const BUTTON_ID_LEGACY = 'fmViewOutputButton';

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* The old right-column content is fully superseded by the stack. */
    #outputsPanel:not(.fm-outputs-tab-active) > .fm-output-state,
    #outputsPanel:not(.fm-outputs-tab-active) > .fm-real-output,
    #outputsPanel:not(.fm-outputs-tab-active) > #fmSixTileOutput,
    #outputsPanel:not(.fm-outputs-tab-active) > #fmViewOutputButton {
      display: none !important;
    }

    #${STACK_ID} {
      display: none;
    }

    #outputsPanel:not(.fm-outputs-tab-active) > #${STACK_ID} {
      display: flex !important;
      flex-direction: column !important;
      gap: 20px !important;

      grid-column: 2 !important;
      grid-row: 1 !important;

      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    #outputsPanel.fm-outputs-tab-active > #${STACK_ID} {
      display: none !important;
    }

    /* Key Questions, once relocated into the stack, sizes to its own
       content instead of matching a "Previous history" column height. */
    #${STACK_ID} > .question-card {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }

    /* The Evidence card, once relocated into the stack, sits flush like
       the other cards instead of its old full-page-width styling. */
    #${STACK_ID} > #fmDashboardEvidence {
      width: 100% !important;
      margin: 0 !important;
    }

    /* ---------------- Mini market-segments summary ---------------- */
    #${MINI_SEGMENTS_ID} {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--line, #e9e5eb);
      border-radius: 15px;
      padding: 22px 24px;
      background: #fff;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-eyebrow {
      margin: 0 0 6px;
      color: #876ea9;
      text-transform: uppercase;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
    }

    #${MINI_SEGMENTS_ID} h3 {
      margin: 0 0 6px;
      font: 700 18px/1.2 "Playfair Display", serif;
      color: #251f2b;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-sub {
      margin: 0 0 14px;
      color: #746d7a;
      font-size: 12.5px;
      line-height: 1.5;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-segment-list {
      display: grid;
      gap: 10px;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-segment-item {
      padding: 12px 14px;
      border: 1px solid var(--line, #e9e5eb);
      border-radius: 10px;
      background: #faf8fb;
      font-size: 12.5px;
      color: #51475b;
      line-height: 1.5;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-segment-item strong {
      display: block;
      color: #251f2b;
      font-size: 13px;
      margin-bottom: 2px;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-segment-tags {
      margin-top: 4px;
      color: #876ea9;
      font-size: 11px;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-empty {
      color: #948c97;
      font-size: 12.5px;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-manage-link {
      display: inline-block;
      margin-top: 14px;
      color: var(--purple, #351568);
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
    }

    #${MINI_SEGMENTS_ID} .fm-mini-manage-link:hover {
      text-decoration: underline;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  function renderMiniSegments() {
    const card = document.getElementById(MINI_SEGMENTS_ID);
    if (!card) return;

    const list = card.querySelector('.fm-mini-segment-list');
    if (!list) return;

    const segments = Array.isArray(state.segments) ? state.segments : [];

    if (!segments.length) {
      list.innerHTML = `<div class="fm-mini-empty">No market segments defined yet.</div>`;
      return;
    }

    list.innerHTML = segments.map(segment => {
      const tags = [segment.geography, segment.companySize, segment.wedge]
        .filter(Boolean)
        .join(' · ');

      return `
        <div class="fm-mini-segment-item">
          <strong>${escapeHtml(segment.name)}</strong>
          ${segment.description ? escapeHtml(segment.description) : ''}
          ${tags ? `<div class="fm-mini-segment-tags">${escapeHtml(tags)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  async function loadMiniSegments(attemptsLeft = 20) {
    if (!currentUser) {
      if (attemptsLeft <= 0) return;
      setTimeout(() => loadMiniSegments(attemptsLeft - 1), 250);
      return;
    }

    try {
      const response = await api('/api/segments');
      state.segments = response.segments || [];
      renderMiniSegments();
    } catch (error) {
      /* Silently ignore -- the mini summary is non-critical. */
    }
  }

  function ensureStack() {
    const outputsPanel = document.getElementById('outputsPanel');
    const questionCard = document.querySelector('.question-card');

    if (!outputsPanel || !questionCard) {
      setTimeout(ensureStack, 150);
      return;
    }

    let stack = document.getElementById(STACK_ID);

    if (!stack) {
      stack = document.createElement('div');
      stack.id = STACK_ID;
      outputsPanel.appendChild(stack);
    }

    // 1. Key Questions -- moved here, replacing the old right-side content.
    if (questionCard.parentElement !== stack) {
      stack.appendChild(questionCard);
    }

    // The history row now only holds "Previous history" -- drop its
    // two-column grid so that one remaining child doesn't leave a
    // lopsided empty column next to it, and force it to span the full
    // width of .map-layout (it used to occupy just one of two grid
    // tracks, sized for sharing the row with Key Questions).
    restoreHistoryRowStyle();

    // 2. Mini market-segments summary -- per-request, this no longer
    // appears on the main Process Map page (the Evidence card above
    // stays; this "Business setup / Market segments" card is the one
    // being removed here). If an earlier build of this stack already
    // created it, take it back out too.
    const existingMiniSegments = document.getElementById(MINI_SEGMENTS_ID);
    if (existingMiniSegments) {
      existingMiniSegments.remove();
    }
  }

  // The Customer & Market Evidence card is created lazily (only once a
  // user is signed in), so poll for it and relocate it into the stack
  // the moment it exists.
  function watchEvidence(attemptsLeft = 60) {
    const evidence = document.getElementById('fmDashboardEvidence');
    const stack = document.getElementById(STACK_ID);

    if (evidence && stack) {
      if (evidence.parentElement !== stack) {
        stack.appendChild(evidence);
      }
      return;
    }

    if (attemptsLeft <= 0) return;
    setTimeout(() => watchEvidence(attemptsLeft - 1), 250);
  }

  // 2026-08-31: #previousSearches ("Previous history") has since been
  // relocated entirely out of .question-history-row and into the
  // Outputs tab (see the "Move Previous History onto the Outputs tab"
  // block at the very end of this file) -- that row is now permanently
  // empty, and the #historyList/.history-empty anti-clipping fix that
  // used to live in this function has moved there too, re-anchored
  // directly via #previousSearches instead of via this row.
  //
  // A stylesheet rule alone can't hide the now-empty row: a much
  // earlier script (applyFinalQuestionHistoryDesign) only checks that
  // .question-card / #previousSearches exist ANYWHERE in the document
  // (true even after both are relocated elsewhere) before forcing this
  // row's inline display back to 'grid' on every mutation -- inline
  // !important always beats a stylesheet rule. Reassert display:none
  // inline here instead, registered (further below) after that
  // script's own observer so we always run later in any given
  // mutation batch and our value wins.
  function restoreHistoryRowStyle() {
    const historyRow = document.querySelector('.question-history-row');
    if (!historyRow) return;
    historyRow.style.setProperty('display', 'none', 'important');
  }

  // The pre-existing "View Results" button (from the earlier "OUTPUTS ON
  // THE INPUTS TAB" block) is fully superseded by this stack. Its own
  // show-rule (`#outputsPanel.fm-six-output-ready:not(.fm-outputs-tab-active)
  // #fmViewOutputButton`) has higher CSS specificity than any class-only
  // selector we could add here, so a stylesheet override can't beat it --
  // force it hidden via inline style instead, which beats any external
  // stylesheet rule regardless of specificity.
  function hideOldViewButton(attemptsLeft = 60) {
    const button = document.getElementById(BUTTON_ID_LEGACY);
    if (button) {
      button.style.setProperty('display', 'none', 'important');
      return;
    }
    if (attemptsLeft <= 0) return;
    setTimeout(() => hideOldViewButton(attemptsLeft - 1), 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureStack();
      watchEvidence();
      hideOldViewButton();
    });
  } else {
    ensureStack();
    watchEvidence();
    hideOldViewButton();
  }

  new MutationObserver(() => {
    requestAnimationFrame(restoreHistoryRowStyle);
  }).observe(document.body, {
    childList: true,
    subtree: true
  });

  // A much earlier script (forceHistoryExactCenter) re-asserts absolute
  // positioning on the empty-state block specifically at 1200ms/1600ms
  // after load (and again on window resize), later than any mutation
  // our own setup triggers -- explicitly out-run it at the same delays.
  setTimeout(restoreHistoryRowStyle, 1300);
  setTimeout(restoreHistoryRowStyle, 1700);
  setTimeout(restoreHistoryRowStyle, 2200);
  window.addEventListener('resize', () => {
    setTimeout(restoreHistoryRowStyle, 50);
  });
})();


/* ---------------------------------------------------------
   Move "Generate PDF" / "Generate CSV" onto the Outputs tab,
   underneath the six generated results. "Run" (Generate this
   process) stays on the Inputs tab where it already is.
   --------------------------------------------------------- */
(() => {
  const STYLE_ID = 'fmExportButtonsOnOutputsStyle';
  const WRAP_ID = 'fmExportButtonsWrap';

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Only "Run" (#runAnalysis) is left in the original actions row --
       collapse it back to a single column so it doesn't leave two
       empty ghost tracks where the export buttons used to sit. */
    #processOutputActions {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    #${WRAP_ID} {
      display: none;
    }

    #outputsPanel.fm-outputs-tab-active > #${WRAP_ID} {
      display: flex !important;
      grid-column: 1 / -1 !important;

      justify-content: flex-end !important;
      gap: 14px !important;

      width: 100% !important;
      margin: 24px 0 0 !important;
      box-sizing: border-box !important;
    }

    #${WRAP_ID} .fm-export-button {
      width: auto !important;
      min-width: 160px !important;
      height: 48px !important;
      padding: 0 22px !important;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  function ensureMoved() {
    const outputsPanel = document.getElementById('outputsPanel');
    const pdfButton = document.getElementById('generatePdf');
    const csvButton = document.getElementById('generateCsv');

    if (!outputsPanel || !pdfButton || !csvButton) {
      setTimeout(ensureMoved, 150);
      return;
    }

    let wrap = document.getElementById(WRAP_ID);

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = WRAP_ID;
      outputsPanel.appendChild(wrap);
    }

    if (pdfButton.parentElement !== wrap) wrap.appendChild(pdfButton);
    if (csvButton.parentElement !== wrap) wrap.appendChild(csvButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureMoved);
  } else {
    ensureMoved();
  }
})();

/* ---------------------------------------------------------
   Rename "Generate this process" -> "Run the process" and
   right-size the button now that it's the only thing left in
   #processOutputActions (Generate PDF/CSV moved to the Outputs
   tab above, leaving two empty ghost grid tracks next to it).
   Both the button and its row carry INLINE styles set directly
   in index.html (width:100%!important, display:grid!important,
   etc.) -- only another inline write can reliably beat those,
   so everything here goes through .style.setProperty(...)
   rather than a stylesheet rule.
   --------------------------------------------------------- */
(() => {
  function resizeRunButton() {
    const actions = document.getElementById('processOutputActions');
    const button = document.getElementById('runAnalysis');

    if (!actions || !button) {
      setTimeout(resizeRunButton, 150);
      return;
    }

    // Stop the row from reserving its old 3-fr / 1-fr / 1-fr track
    // layout for buttons that are no longer here -- size the single
    // remaining column to the button's own content instead of
    // stretching it across most of the row.
    actions.style.setProperty('grid-template-columns', 'max-content', 'important');
    actions.style.setProperty('justify-items', 'start', 'important');
    actions.style.setProperty('justify-content', 'start', 'important');

    button.style.setProperty('width', 'auto', 'important');
    button.style.setProperty('min-width', '240px', 'important');
    button.style.setProperty('padding', '0 30px', 'important');

    // Defensive: a couple of other scripts write this button's
    // innerHTML too (the loading state and the success/failure reset
    // in the click handler) -- keep the idle-state label current if
    // either of them ever race back in with the old copy.
    if (button.innerHTML.indexOf('Generate this process') !== -1) {
      button.innerHTML = button.innerHTML.replace(
        'Generate this process',
        'Run the process'
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resizeRunButton);
  } else {
    resizeRunButton();
  }

  setTimeout(resizeRunButton, 800);
  setTimeout(resizeRunButton, 1600);
})();

/* ---------------------------------------------------------
   Move "Previous history" onto the Outputs tab, stacked
   between the six-tile decision brief and the Generate PDF /
   Generate CSV buttons (same tab-visibility pattern used just
   above for those buttons). It used to sit in its own full-
   width strip on the Inputs tab, inside what is now an empty
   .question-history-row (Key Questions was relocated out of it
   earlier in this file) -- hide that leftover row and give
   #previousSearches a permanent home inside #outputsPanel
   instead.
   --------------------------------------------------------- */
(() => {
  const STYLE_ID = 'fmHistoryOnOutputsStyle';

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Now permanently empty (Key Questions was relocated out of it
       earlier, Previous history is relocated out of it here) --
       hide the leftover strip instead of showing a blank gap on
       the Inputs tab. */
    .question-history-row {
      display: none !important;
    }
  `;

  document.getElementById(STYLE_ID)?.remove();
  document.head.appendChild(style);

  function ensureHistoryInOutputs() {
    const outputsPanel = document.getElementById('outputsPanel');
    const history = document.getElementById('previousSearches');

    if (!outputsPanel || !history) {
      setTimeout(ensureHistoryInOutputs, 150);
      return;
    }

    if (history.parentElement !== outputsPanel) {
      outputsPanel.appendChild(history);
    }

    // Enforce the full Outputs-tab order every time this runs, since a
    // sibling can get rebuilt and re-appended elsewhere in the panel
    // later (in particular #fmSixTileOutput, which is (re)created
    // whenever a new decision brief is generated -- appendChild()'d at
    // the very end of #outputsPanel the first time it's created, which
    // would otherwise leave it stuck below both the export buttons and
    // Previous history). Desired order: the generated output (or the
    // empty state before anything is generated) first, then the
    // Generate PDF / Generate CSV buttons, then Previous history last.
    //
    // Walked left-to-right so it converges to the right order in a
    // single pass no matter how badly things start out scrambled, and
    // only calls insertBefore() when an element isn't already exactly
    // where it belongs -- a version that unconditionally re-inserted
    // every element on every pass would queue a childList mutation each
    // time even when nothing actually moved, re-triggering the very
    // MutationObserver this function is wired to and looping forever.
    const sixTileOutput = document.getElementById('fmSixTileOutput');
    const exportWrap = document.getElementById('fmExportButtonsWrap');

    // Anchor the reorder to the static content block that ships in the
    // HTML (.fm-output-state / .fm-real-output) instead of starting from
    // outputsPanel.firstElementChild. Before anything has been generated
    // there is no #fmSixTileOutput yet, so without a fixed anchor the
    // first managed element (the export buttons) would get forced to the
    // very front of #outputsPanel -- ahead of the "No output generated
    // yet" message -- which is exactly backwards.
    const contentAnchor =
      outputsPanel.querySelector(':scope > .fm-real-output') ||
      outputsPanel.querySelector(':scope > .fm-output-state');

    let previous = contentAnchor || null;
    [sixTileOutput, exportWrap, history].forEach(el => {
      if (!el) return;

      const referenceNode = previous
        ? previous.nextElementSibling
        : outputsPanel.firstElementChild;

      if (referenceNode !== el) {
        outputsPanel.insertBefore(el, referenceNode);
      }

      previous = el;
    });

    restoreRelocatedHistoryStyle();
  }

  // Only write a style property when it would actually change something.
  // This function is wired up (further below) to a MutationObserver that
  // watches these same elements' own style attribute -- so it can be
  // retriggered by ITS OWN writes. Unconditional .setProperty(...) calls
  // queue a new attribute-mutation record every time regardless of
  // whether the value actually changed, which would fire that observer
  // again forever. Skipping the write once the value already matches
  // breaks the loop after a single pass.
  function setImportant(el, prop, value) {
    if (
      el.style.getPropertyValue(prop) !== value ||
      el.style.getPropertyPriority(prop) !== 'important'
    ) {
      el.style.setProperty(prop, value, 'important');
    }
  }

  // A much earlier script (fixQuestionHistoryLayout, elsewhere in this
  // file) unconditionally keeps #previousSearches' own display / width
  // / margin / padding asserted inline on every DOM mutation,
  // regardless of which tab is active -- left alone, that would make
  // it visible even on the Inputs tab. Reassert its display (block
  // only while the Outputs tab is actually active) plus its position
  // in the new grid parent here, registered after that script so we
  // always run later in any given mutation batch and our values win.
  // The #historyList/.history-empty anti-clipping fix (previously
  // anchored via .question-history-row, see restoreHistoryRowStyle
  // above) is re-anchored directly via #previousSearches here.
  function restoreRelocatedHistoryStyle() {
    const outputsPanel = document.getElementById('outputsPanel');
    const history = document.getElementById('previousSearches');
    if (!outputsPanel || !history) return;

    const active = outputsPanel.classList.contains('fm-outputs-tab-active');

    setImportant(history, 'display', active ? 'block' : 'none');
    setImportant(history, 'grid-column', '1 / -1');
    setImportant(history, 'width', '100%');
    setImportant(history, 'max-width', 'none');
    setImportant(history, 'margin', '28px 0 0');
    setImportant(history, 'box-sizing', 'border-box');

    const historyList = history.querySelector('#historyList');
    if (historyList) {
      setImportant(historyList, 'display', 'flex');
      setImportant(historyList, 'flex-direction', 'column');
      setImportant(historyList, 'align-items', 'stretch');
      setImportant(historyList, 'justify-content', 'center');
      setImportant(historyList, 'min-height', '260px');
      // NOT height/max-height: a much earlier script
      // (installHistoryListHeightGuard) permanently strips those two
      // specific properties off #historyList the instant either is
      // set (its whole purpose is keeping this list's height auto),
      // via its own style-attribute MutationObserver. Setting them
      // here -- even to 'auto'/'none', values that would look like a
      // no-op -- still queues an attribute mutation and re-triggers
      // that guard, which fights back. Leaving them alone entirely
      // gets the same effective result (natural auto height) without
      // the fight, since that's what the guard forces anyway.
      setImportant(historyList, 'box-sizing', 'border-box');

      const empty = historyList.querySelector(':scope > .history-empty');
      if (empty) {
        setImportant(empty, 'position', 'static');
        setImportant(empty, 'inset', 'auto');
        setImportant(empty, 'transform', 'none');
        setImportant(empty, 'width', '100%');
        setImportant(empty, 'height', 'auto');
        setImportant(empty, 'min-height', '0');
        setImportant(empty, 'max-height', 'none');
        setImportant(empty, 'display', 'flex');
        setImportant(empty, 'flex-direction', 'column');
        setImportant(empty, 'align-items', 'center');
        setImportant(empty, 'justify-content', 'center');
        setImportant(empty, 'margin', 'auto');
      }
    }
  }

  // classList toggling (switching tabs) is an attribute mutation, not
  // a childList one -- the childList/subtree observer below won't see
  // it. Watch #outputsPanel's class directly, and back it up with a
  // direct listener on the tab buttons themselves.
  function watchOutputsTabState(attemptsLeft = 60) {
    const outputsPanel = document.getElementById('outputsPanel');
    if (!outputsPanel) {
      if (attemptsLeft <= 0) return;
      setTimeout(() => watchOutputsTabState(attemptsLeft - 1), 150);
      return;
    }
    new MutationObserver(restoreRelocatedHistoryStyle).observe(outputsPanel, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function watchTabButtons(attemptsLeft = 60) {
    const inputsTab = document.getElementById('inputsTab');
    const outputsTab = document.getElementById('outputsTab');
    if (!inputsTab || !outputsTab) {
      if (attemptsLeft <= 0) return;
      setTimeout(() => watchTabButtons(attemptsLeft - 1), 150);
      return;
    }
    const reassert = () => {
      setTimeout(restoreRelocatedHistoryStyle, 20);
      setTimeout(restoreRelocatedHistoryStyle, 200);
      setTimeout(restoreRelocatedHistoryStyle, 600);
    };
    inputsTab.addEventListener('click', reassert);
    outputsTab.addEventListener('click', reassert);
  }

  // NOTE: a style-attribute-scoped MutationObserver was tried here to
  // reassert these styles the instant any other script changed them
  // (the same technique installHistoryHeightGuard uses above for
  // #previousSearches' own height) -- but #historyList's height/
  // max-height are exactly what installHistoryListHeightGuard
  // (elsewhere in this file) strips back out the instant either is
  // set, via its own style-attribute observer on the same element.
  // The two reactive observers ping-ponged forever (mine sets height
  // -> theirs strips it -> mine sets it again -> ...), an infinite
  // microtask loop that hung the page before it ever finished
  // loading. Stick to the same non-reactive pattern already used
  // elsewhere in this file instead: a body-wide childList observer,
  // a handful of fixed timeouts spaced past every legacy script's own
  // delayed passes, and a reassert on tab clicks / resize.

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureHistoryInOutputs();
      watchOutputsTabState();
      watchTabButtons();
    });
  } else {
    ensureHistoryInOutputs();
    watchOutputsTabState();
    watchTabButtons();
  }

  new MutationObserver(() => {
    requestAnimationFrame(ensureHistoryInOutputs);
  }).observe(document.body, {
    childList: true,
    subtree: true
  });

  setTimeout(restoreRelocatedHistoryStyle, 1300);
  setTimeout(restoreRelocatedHistoryStyle, 1700);
  setTimeout(restoreRelocatedHistoryStyle, 2200);
  setTimeout(restoreRelocatedHistoryStyle, 3000);
  window.addEventListener('resize', () => {
    setTimeout(restoreRelocatedHistoryStyle, 50);
  });
})();
