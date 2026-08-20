// Map definitions live together so new map points can be added without changing UI code.
let mapSteps = [
  { title: 'Market Positioning Analysis', category: 'Market strategy', purpose: 'Define MyRISK market focus, competitive frame, wedge positioning and market-entry logic.', inputs: ['Gartner PMF & target-market prioritisation', 'Brand handbook & wedge definitions', 'Sector / competitive-category research', 'Early customer / beta feedback & buyer language', 'Trace vs Essentials use-case logic'], questions: ['Which market should MyRISK target first?', 'Which buyer feels the problem most urgently?', 'Which category should MyRISK avoid being trapped in?', 'What alternatives does the buyer use today?', 'Which wedge leads in each priority market?'], outputs: 'Priority ICPs and segments; competitive frame of reference; positioning statement and differentiation themes; Trace / Essentials market-entry logic.', feeds: '2, 3, 6, 9, 15, 19, 22, 27, 28' },
  { title: 'Ideal Customer Profile', category: 'Customer strategy', purpose: 'Turn the market-positioning decision into a clear, prioritised ideal-customer profile.', inputs: ['Previous market positioning output', 'Customer research', 'Sales and beta feedback'], questions: ['Which customer profile should be prioritised first?', 'What firmographic and behavioural signals define the best-fit buyer?', 'Which customer profiles should be deprioritised?'], outputs: 'Prioritised ICP, buying triggers and qualification criteria.', feeds: '3, 6, 9, 15, 19, 22, 27, 28' },
  { title: 'Buyer Problem & Urgency', category: 'Customer strategy', purpose: 'Clarify the priority buyer problem, urgency and language that should guide messaging.', inputs: ['Previous outputs', 'Buyer interviews and feedback', 'Current workarounds'], questions: ['What job is the buyer trying to complete?', 'What makes the problem urgent now?', 'What language does the buyer use to describe the pain?'], outputs: 'Priority problem statement, urgency signals and buyer-language themes.', feeds: '6, 9, 15, 19, 22, 27, 28' }
];

const defaultState = () => ({ step: 0, documents: [], outputs: [], history: {} });
const $ = selector => document.querySelector(selector);
const toast = $('#toast');
let state = defaultState();
let selectedInput = '';
let currentUser = null;

// Keep the most useful navigation controls close to the header as well as at the page end.
document.querySelector('.site-header').insertAdjacentHTML('afterend', '<nav class="top-map-navigation" aria-label="Process navigation"><button class="previous-button" id="topPrev" type="button">&larr; Previous process</button><button class="next-button" id="topNext" type="button">Next process <span>&rarr;</span></button></nav>');
$('#runAnalysis').insertAdjacentHTML('afterend', '<button class="generate-pdf-button" id="generatePdf" type="button">Generate PDF</button>');
document.querySelector('#documentForm .primary-button').innerHTML = 'Add information <span>&rarr;</span>';
document.querySelector('.output-panel h2').insertAdjacentHTML('afterend', '<button class="expand-output-button" id="expandOutput" type="button">Expand output</button>');

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
    if (!session.user) return render();
    currentUser = session.user;
    const saved = await api('/api/state');
    state = saved.state || defaultState();
    state.documents ||= []; state.outputs ||= []; state.history ||= {};
    state.step = Math.min(state.step || 0, mapSteps.length - 1);
    $('#headerAuth').innerHTML = `<span>Signed in as ${escapeHtml(currentUser.email || currentUser.username)}</span><button id="headerSave" type="button">Save progress</button><button id="headerLogout" type="button">Log out</button><a class="header-signup" href="login.html">My workspace</a>`;
    $('#headerSave').addEventListener('click', () => saveProgress(true));
    $('#headerLogout').addEventListener('click', logout);
    applyCompanyName(currentUser.companyName);
  } catch { showToast('Unable to restore your saved workspace.'); }
  render();
}

function applyCompanyName(name) {
  document.querySelectorAll('.company-name').forEach(element => { element.textContent = name; });
  document.title = `${name} | Linear Gartner Map`;
}
async function logout() {
  await api('/api/auth/logout', { method: 'POST', body: '{}' });
  location.reload();
}

function currentStep() { return mapSteps[state.step]; }

function render() {
  const step = currentStep();
  const output = state.outputs[state.step];
  const phaseNumber = state.step < 5 ? 1 : 2;
  $('#stepLabel').textContent = `Phase ${phaseNumber} - Process ${step.number ?? state.step + 1}: ${step.title}`;
  $('#progressLabel').textContent = `${state.step + 1} of ${mapSteps.length}`;
  const phases = [
    { name: 'Phase 1', title: 'Market & Buyer Validation', start: 0, end: 5 },
    { name: 'Phase 2', title: 'Product, Offer & Commercialization', start: 5, end: 13 }
  ];
  $('#progressDots').innerHTML = phases.map(phase => `<section class="phase-group"><div class="phase-heading"><strong>${phase.name}</strong><span>${phase.title}</span></div><div class="phase-dots">${mapSteps.slice(phase.start, phase.end).map((process, offset) => {
    const index = phase.start + offset;
    const complete = Boolean(state.outputs[index]);
    const current = index === state.step;
    return `<button class="process-dot ${complete ? 'complete' : ''} ${current ? 'current' : ''}" data-process="${index}" type="button" ${complete ? '' : 'disabled'} aria-label="Process ${process.number}: ${escapeHtml(process.title)}" title="${escapeHtml(process.title)}">${process.number}</button>`;
  }).join('')}</div></section>`).join('');
  $('#progressDots').querySelectorAll('[data-process]').forEach(dot => dot.addEventListener('click', () => {
    state.step = Number(dot.dataset.process);
    render();
    saveProgress(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  $('#stepCategory').textContent = step.category;
  $('#stepTitle').textContent = step.title;
  $('#stepPurpose').textContent = companyText(step.purpose);

  const outputDependencies = (step.outputSources || []).map(processNumber => {
    const sourceProcess = mapSteps.find(process => process.number === processNumber);
    const hasAnswer = Boolean(state.outputs[processNumber - 1]);
    return `<li class="output-source ${hasAnswer ? 'ready' : ''}">Process ${processNumber}: ${escapeHtml(sourceProcess?.title || 'Untitled process')}<span>${hasAnswer ? 'available' : 'awaiting output'}</span></li>`;
  }).join('');
  const outputsToUse = outputDependencies ? `<section class="outputs-to-use"><h4>Outputs to use</h4><ul>${outputDependencies}</ul></section>` : '';

  $('#inputList').innerHTML = outputsToUse + step.inputs.map((input, index) => {
    const sources = state.documents.filter(document => document.input === input);
    const sourceHtml = sources.map(document => `<span class="source-chip">${escapeHtml(document.name)} <button data-remove="${state.documents.indexOf(document)}" aria-label="Remove ${escapeHtml(document.name)}">×</button></span>`).join('');
    return `<section class="input-source"><div class="input-heading"><span>${escapeHtml(input)}</span><small>Required</small></div><button class="add-source-inline" data-input="${index}" type="button">+ Add information</button><div class="source-chips">${sourceHtml || '<p class="no-sources">No information attached.</p>'}</div></section>`;
  }).join('');
  $('#inputList').querySelectorAll('[data-input]').forEach(button => button.addEventListener('click', () => openDocumentation(step.inputs[Number(button.dataset.input)])));
  $('#inputList').querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => { state.documents.splice(Number(button.dataset.remove), 1); render(); saveProgress(false); }));
  $('#questionList').innerHTML = step.questions.map((question, index) => `<div class="question-item"><b>${String(index + 1).padStart(2, '0')}</b><p>${escapeHtml(companyText(question))}</p></div>`).join('');
  const versions = state.history[String(step.number ?? state.step + 1)] || [];
  const historyHtml = versions.length ? `<section class="output-history"><strong>Previous versions</strong><p>Browse an earlier generated output, then restore it if you want to use it again.</p><div class="history-actions"><button id="previousVersion" type="button" disabled aria-label="Previous saved version">&larr;</button><select id="historyVersion">${versions.map((_, index) => `<option value="${index}">Previous version ${index + 1}</option>`).join('')}</select><button id="nextVersion" type="button" ${versions.length < 2 ? 'disabled' : ''} aria-label="Next saved version">&rarr;</button><button id="restoreVersion" type="button">Restore version</button></div><div class="history-preview" id="historyPreview"></div></section>` : '';
  $('#analysisOutput').innerHTML = output ? `<div class="generated-answer">${formatAnswer(output)}</div>${historyHtml}<div class="downstream"><strong>Outputs & downstream</strong><p>${escapeHtml(companyText(step.outputs))}</p><small>Feeds: ${escapeHtml(step.feeds)}</small></div>` : '';
  if (versions.length) {
    const updateHistoryPreview = () => {
      const selectedIndex = Number($('#historyVersion').value);
      const selected = versions[selectedIndex];
      $('#historyPreview').innerHTML = selected ? formatAnswer(selected.answer) : '';
      $('#previousVersion').disabled = selectedIndex === 0;
      $('#nextVersion').disabled = selectedIndex === versions.length - 1;
    };
    $('#historyVersion').addEventListener('change', updateHistoryPreview);
    $('#previousVersion').addEventListener('click', () => { $('#historyVersion').selectedIndex -= 1; updateHistoryPreview(); });
    $('#nextVersion').addEventListener('click', () => { $('#historyVersion').selectedIndex += 1; updateHistoryPreview(); });
    updateHistoryPreview();
    $('#restoreVersion').addEventListener('click', async () => {
      const selected = versions[Number($('#historyVersion').value)];
      const processNumber = String(step.number ?? state.step + 1);
      const replacedAnswer = state.outputs[state.step];
      state.outputs[state.step] = selected.answer;
      state.history[processNumber] = [{ answer: replacedAnswer }, ...versions.filter(version => version !== selected)].slice(0, 3);
      render(); await saveProgress(false); showToast('Previous version restored.');
    });
  }
  $('#outputEmpty').hidden = Boolean(output);
  document.querySelectorAll('.previous-button').forEach(button => { button.hidden = state.step === 0; });
  document.querySelectorAll('.next-button').forEach(button => {
    button.hidden = state.step === mapSteps.length - 1;
    button.disabled = !output;
  });
  $('#generatePdf').disabled = !output;
  $('#expandOutput').disabled = !output;
}

function openDocumentation(input) {
  if (!currentUser) return showToast('Log in or sign up to add and save information.');
  selectedInput = input;
  $('#documentDialogTitle').textContent = `Add evidence for ${input}`;
  $('#documentName').value = input;
  $('#documentDialog').showModal();
}

$('#documentForm').addEventListener('submit', event => {
  event.preventDefault();
  invalidateProcessOneOutputs();
  state.documents.push({ name: $('#documentName').value.trim(), text: $('#documentText').value.trim(), input: selectedInput });
  event.target.reset(); $('#documentDialog').close(); render(); saveProgress(false); showToast('Information added.');
});
$('.close').addEventListener('click', () => $('#documentDialog').close());
$('#chooseFile').addEventListener('click', () => $('#fileInput').click());
$('#dropZone').addEventListener('click', event => { if (!event.target.closest('#chooseFile')) $('#fileInput').click(); });
$('#fileInput').addEventListener('change', () => addFiles($('#fileInput').files));
['dragenter', 'dragover'].forEach(type => $('#dropZone').addEventListener(type, event => { event.preventDefault(); $('#dropZone').classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => $('#dropZone').addEventListener(type, event => { event.preventDefault(); $('#dropZone').classList.remove('dragging'); }));
$('#dropZone').addEventListener('drop', event => addFiles(event.dataTransfer.files));

async function addFiles(files) {
  invalidateProcessOneOutputs();
  for (const file of [...files]) state.documents.push({ name: file.name, text: /\.(txt|md|csv|json)$/i.test(file.name) ? await file.text() : `Attached file: ${file.name}.`, input: selectedInput });
  $('#fileInput').value = ''; $('#documentDialog').close(); render(); await saveProgress(false); showToast('Information added.');
}

async function saveProgress(notify) {
  if (!currentUser) return notify && showToast('Log in to save your map securely.');
  try { await api('/api/state', { method: 'PUT', body: JSON.stringify(state) }); if (notify) showToast('Progress saved securely.'); } catch (error) { if (notify) showToast(error.message); }
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
    if (state.step === 0) state.outputs = [];
    state.outputs[state.step] = response.answer; render(); await saveProgress(false); showToast('Decision brief generated.');
  } catch (error) { showToast(error.message); } finally { button.disabled = false; button.innerHTML = 'Generate this process <span>→</span>'; }
});

function moveStep(direction) { const next = state.step + direction; if (next >= 0 && next < mapSteps.length) { state.step = next; render(); saveProgress(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
$('#prevStep').addEventListener('click', () => moveStep(-1));
$('#nextStep').addEventListener('click', () => moveStep(1));
$('#topPrev').addEventListener('click', () => moveStep(-1));
$('#topNext').addEventListener('click', () => moveStep(1));

$('#generatePdf').addEventListener('click', () => {
  const answer = state.outputs[state.step];
  if (!answer) return showToast('Generate this process before creating a PDF.');
  const step = currentStep();
  const fileName = `${(currentUser?.companyName || 'FounderMotion').replace(/[^a-z0-9]+/gi, '-')}-process-${step.number || state.step + 1}.pdf`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(createPdf([`${currentUser?.companyName || 'Company'} - Process ${step.number || state.step + 1}`, step.title, '', ...answer.split('\n')]));
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

// Full-page reading mode keeps longer decision briefs easy to review and present.
$('#expandOutput').addEventListener('click', () => {
  const expanded = document.body.classList.toggle('output-expanded');
  $('#expandOutput').textContent = expanded ? 'Return to workspace' : 'Expand output';
  $('#expandOutput').setAttribute('aria-pressed', String(expanded));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('output-expanded')) {
    document.body.classList.remove('output-expanded');
    $('#expandOutput').textContent = 'Expand output';
    $('#expandOutput').setAttribute('aria-pressed', 'false');
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

function companyText(text) { return String(text).replace(/myrisk/gi, currentUser?.companyName || 'MyRISK'); }
function invalidateProcessOneOutputs() {
  if (state.step === 0 && state.outputs.some(Boolean)) {
    state.outputs = [];
    showToast('Process 1 changed. Later process answers have been cleared and will be regenerated from the new evidence.');
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

restoreAccount();
