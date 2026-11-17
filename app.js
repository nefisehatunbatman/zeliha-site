const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobileMenu');
const form = document.getElementById('appointmentForm');
const message = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');
const timeInput = document.getElementById('preferredTime');
const dateInput = document.getElementById('preferredDate');
const privacyDialog = document.getElementById('privacyDialog');

const todayInIstanbul = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

dateInput.min = todayInIstanbul();
document.getElementById('year').textContent = new Date().getFullYear();

menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Menüyü aç' : 'Menüyü kapat');
  mobileMenu.hidden = expanded;
  document.body.classList.toggle('nav-open', !expanded);
});
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
}));

const timeButtons = [...document.querySelectorAll('[data-time]')];
timeButtons.forEach((button) => button.addEventListener('click', () => {
  timeButtons.forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
  button.classList.add('selected'); button.setAttribute('aria-pressed', 'true');
  timeInput.value = button.dataset.time;
  document.querySelector('.time-fieldset').classList.remove('invalid');
}));
timeButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));

document.querySelectorAll('[data-service]').forEach((link) => link.addEventListener('click', () => {
  document.getElementById('service').value = link.dataset.service;
}));

const showMessage = (text, type = 'error') => {
  message.textContent = text;
  message.className = `form-message ${type}`;
  message.style.display = 'block';
};
const clearMessage = () => { message.textContent = ''; message.className = 'form-message'; message.style.display = 'none'; };

form.addEventListener('input', clearMessage);
form.addEventListener('change', clearMessage);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  if (!form.checkValidity()) {
    form.reportValidity();
    showMessage('Lütfen yıldızlı alanları eksiksiz ve geçerli biçimde doldurun.');
    return;
  }
  if (!timeInput.value) {
    document.querySelector('.time-fieldset').classList.add('invalid');
    showMessage('Lütfen tercih ettiğiniz bir saati seçin.');
    document.getElementById('timeOptions').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (dateInput.value < todayInIstanbul()) {
    showMessage('Lütfen bugünden sonraki bir tarih seçin.');
    return;
  }

  const payload = Object.fromEntries(new FormData(form));
  payload.privacyAccepted = document.getElementById('privacyAccepted').checked;
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Gönderiliyor…';
  try {
    const response = await fetch('/api/appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let result;
    try { result = await response.json(); } catch { result = {}; }
    if (!response.ok) throw new Error(result.message || 'Talep gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    form.reset();
    timeInput.value = '';
    timeButtons.forEach((button) => { button.classList.remove('selected'); button.setAttribute('aria-pressed', 'false'); });
    showMessage('Talebiniz iletildi. Bu bir randevu onayı değildir; uygunluk için sizinle iletişime geçilecektir.', 'success');
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    showMessage(error.message || 'Beklenmeyen bir hata oluştu.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Randevu talebimi gönder';
  }
});

const openPrivacy = (event) => { event.preventDefault(); privacyDialog.showModal(); };
document.querySelectorAll('a[href="#gizlilik"]').forEach((link) => link.addEventListener('click', openPrivacy));
document.getElementById('closePrivacy').addEventListener('click', () => privacyDialog.close());
document.getElementById('privacyOk').addEventListener('click', () => privacyDialog.close());
privacyDialog.addEventListener('click', (event) => { if (event.target === privacyDialog) privacyDialog.close(); });

// Reduced-motion users see content immediately; others receive a gentle enter effect.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const items = document.querySelectorAll('.section-intro, .service-card, .step, .about-content, .about-art, .faq-grid, .appointment-shell');
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('reveal-visible'); observer.unobserve(entry.target); }
  }), { threshold: .08, rootMargin: '0px 0px -24px 0px' });
  items.forEach((item) => { item.classList.add('reveal'); observer.observe(item); });
}
