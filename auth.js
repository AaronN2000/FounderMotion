// Handles the dedicated Login and Sign-up pages.
const $ = selector => document.querySelector(selector);
const toast = $('#toast');
const signingUp = document.body.dataset.page === 'signup' || location.pathname.endsWith('signup.html');

async function api(url, options) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

$('#authForm').addEventListener('submit', async event => {
  event.preventDefault();
  const payload = { identity: $('#authIdentity').value, password: $('#authPassword').value, remember: $('#rememberMe').checked };
  if (signingUp) payload.companyName = $('#authCompany').value;
  try {
    await api(signingUp ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    location.href = 'index.html';
  } catch (error) { showToast(error.message); }
});

$('#forgotPassword')?.addEventListener('click', () => { document.querySelector('.auth-screen').hidden = true; $('#forgotScreen').hidden = false; });
$('#backToLogin')?.addEventListener('click', () => { $('#forgotScreen').hidden = true; document.querySelector('.auth-screen').hidden = false; });
$('#forgotForm')?.addEventListener('submit', async event => { event.preventDefault(); try { const data = await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identity: $('#forgotIdentity').value }) }); showToast(data.message); } catch (error) { showToast(error.message); } });
document.querySelectorAll('[data-social]').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.social} sign-in needs OAuth credentials before it can be enabled.`)));
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 3500); }

// A signed-in person sees their workspace settings on the Login page instead.
if (!signingUp) {
  (async () => {
    try {
      const session = await api('/api/auth/session');
      if (!session.user) return;
      document.querySelector('.auth-card').innerHTML = `<p class="eyebrow">My workspace</p><h1>Workspace settings</h1><p class="auth-lede">Signed in as ${escapeHtml(session.user.email || session.user.username)}.</p><label>Company name<input id="workspaceCompanyName" maxlength="50" value="${escapeHtml(session.user.companyName)}" /></label><button class="primary-button" id="changeName" type="button">Change name <span>→</span></button><p class="auth-switch"><a href="index.html">← Back to the map</a> · <button class="text-button" id="settingsLogout" type="button">Log out</button></p>`;
      $('#changeName').addEventListener('click', async () => {
        try {
          await api('/api/company', { method: 'PUT', body: JSON.stringify({ companyName: $('#workspaceCompanyName').value }) });
          showToast('Company name updated.');
        } catch (error) { showToast(error.message); }
      });
      $('#settingsLogout').addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST', body: '{}' }); location.href = 'index.html'; });
    } catch { /* Keep the normal login form when the server is unavailable. */ }
  })();
}

function escapeHtml(value) { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }
