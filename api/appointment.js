// Vercel Function: Sends a booking REQUEST email via Resend when configured.
// No appointment is confirmed, no database is involved, and no health details are collected.
const SERVICES = new Set([
  'Bireysel Psikolojik Danışma',
  'Öğrenci ve Sınav Rehberliği',
  'Eğitim ve Kariyer Yönlendirme',
  'Ön Görüşme / Kararsızım',
]);
const MODES = new Set(['Online', 'Yüz yüze (Ankara)', 'Fark etmez']);
const TIMES = new Set(['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const isText = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const isRealDate = (value) => {
  if (!DATE_REGEX.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
};
const todayInIstanbul = () => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return `${p.find(v => v.type === 'year').value}-${p.find(v => v.type === 'month').value}-${p.find(v => v.type === 'day').value}`;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ message: 'Yalnızca POST isteği kabul edilir.' });
  }
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
    return res.status(415).json({ message: 'Desteklenmeyen içerik türü.' });
  }
  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data) || JSON.stringify(data).length > 6000) {
    return res.status(400).json({ message: 'Geçersiz form verisi.' });
  }
  // Honeypot: silent success without sending; discourages simple spambots.
  if (data.website) return res.status(200).json({ ok: true });

  const { fullName, email, phone, service, preferredDate, preferredTime, mode, privacyAccepted } = data;
  if (!isText(fullName, 2, 100) || !isText(email, 5, 180) || !EMAIL_REGEX.test(email) ||
      !isText(phone, 10, 22) || !/^[+0-9\s()\-]{10,22}$/.test(phone) ||
      !SERVICES.has(service) || !MODES.has(mode) || !TIMES.has(preferredTime) ||
      !isRealDate(preferredDate) || preferredDate < todayInIstanbul() ||
      privacyAccepted !== true) {
    return res.status(400).json({ message: 'Lütfen tüm alanları kontrol ederek yeniden deneyin.' });
  }

  const { RESEND_API_KEY, APPOINTMENT_TO_EMAIL, APPOINTMENT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !APPOINTMENT_TO_EMAIL || !APPOINTMENT_FROM_EMAIL) {
    return res.status(503).json({ message: 'Online randevu talep kanalı henüz etkinleştirilmedi. Lütfen LinkedIn üzerinden iletişime geçin.' });
  }

  const fields = [
    ['Ad Soyad', fullName.trim()], ['E-posta', email.trim()], ['Telefon', phone.trim()],
    ['Görüşme alanı', service], ['Tercih edilen tarih', preferredDate],
    ['Tercih edilen saat (Türkiye saati)', preferredTime], ['Görüşme şekli tercihi', mode],
  ];
  const html = `<div style="font-family:Arial,sans-serif;color:#2b4331;max-width:600px"><h2>Yeni ön görüşme talebi</h2><p><b>Bu bir kesin randevu değildir.</b> Uygunluğu teyit etmek için kişiyle iletişime geçin.</p><table style="border-collapse:collapse;width:100%">${fields.map(([key, val]) => `<tr><td style="padding:10px;border:1px solid #dce7da;font-weight:700">${esc(key)}</td><td style="padding:10px;border:1px solid #dce7da">${esc(val)}</td></tr>`).join('')}</table><p style="font-size:12px;color:#66766a">Bilgileri yalnızca randevu talebini değerlendirmek için kullanın. Kişiye ait iletişim verilerini gerektiğinde güvenle silin.</p></div>`;
  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: APPOINTMENT_FROM_EMAIL,
        to: [APPOINTMENT_TO_EMAIL],
        reply_to: email.trim(),
        subject: `Yeni randevu talebi — ${fullName.trim().slice(0, 80)}`,
        html,
        text: `Yeni ön görüşme talebi (kesin randevu değil)\n\n${fields.map(([k,v]) => `${k}: ${v}`).join('\n')}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) {
      console.error('Email provider failed', upstream.status);
      return res.status(502).json({ message: 'Talep şu anda iletilemedi. Lütfen daha sonra tekrar deneyin.' });
    }
    return res.status(200).json({ ok: true, message: 'Talep iletildi.' });
  } catch (error) {
    console.error('Appointment send failed', error?.name);
    return res.status(502).json({ message: 'Bağlantı sorunu nedeniyle talep iletilemedi. Lütfen daha sonra tekrar deneyin.' });
  }
}
