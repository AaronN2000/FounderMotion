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
  const payload = { identity: $('#authIdentity').value, password: $('#authPassword').value, remember: ($('#rememberMe')?.checked ?? false) };
  if (signingUp) payload.companyName = $('#authCompany').value;
  try {
    await api(signingUp ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    location.href = 'index.html';
  } catch (error) { showToast(error.message); }
});

$('#forgotPassword')?.addEventListener('click', () => { document.querySelector('.auth-screen').hidden = true; $('#forgotScreen').hidden = false; });
$('#backToLogin')?.addEventListener('click', () => { $('#forgotScreen').hidden = true; document.querySelector('.auth-screen').hidden = false; });
$('#forgotForm')?.addEventListener('submit', async event => {
  event.preventDefault();

  const identity = $('#forgotIdentity').value.trim();
  const newPassword = $('#newPassword').value;
  const confirmPassword = $('#confirmPassword').value;

  if (newPassword.length < 8) {
    showToast('Password must be at least 8 characters.');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Passwords do not match.');
    return;
  }

  try {
    const data = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        identity,
        newPassword
      })
    });

    showToast(data.message);

    $('#forgotForm').reset();
    $('#forgotScreen').hidden = true;
    document.querySelector('.auth-screen').hidden = false;

    $('#authIdentity').value = identity;
    $('#authPassword').value = '';
  } catch (error) {
    showToast(error.message);
  }
});
document.querySelectorAll('[data-social]').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.social} sign-in needs OAuth credentials before it can be enabled.`)));
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 3500); }

function escapeHtml(value) { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }
