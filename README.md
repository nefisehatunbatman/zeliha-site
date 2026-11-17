# Zeliha Karadutlu — Psikolojik Danışman

Modern, mobil uyumlu, Türkçe, statik bir tanıtım sitesi ve Vercel üzerinde çalışan **ön görüşme talep formu**.

## İçerik

- `index.html` — tek sayfalı site, profesyonel tanıtım, alanlar, süreç, SSS, randevu formu ve KVKK aydınlatma taslağı.
- `styles.css` — mobil ve masaüstü için tasarım sistemi (krem, adaçayı yeşili, serif tipografi).
- `app.js` — mobil menü, akordeon, saat seçimi, form doğrulama, API isteği, aydınlatma diyaloğu.
- `api/appointment.js` — Vercel serverless POST endpoint; Resend üzerinden e-posta gönderir. Veritabanı yoktur.
- `assets/` — yerel SVG illüstrasyon, favicon, sosyal paylaşım görseli.

## Önizleme (lokal)

Bu proje **npm / kurulum gerektirmez**. Proje klasöründe:

```bash
python -m http.server 5173
```

Tarayıcıda `http://localhost:5173` açın. *Not: Bu yerel basit sunucu formun `/api/appointment` endpoint'ini çalıştırmaz.* Vercel üzerinde API çalışır; yerelde API'yi de test etmek için `vercel dev` kullanın.

## Vercel'e yayınlama

1. Proje klasörünü kendi GitHub deponuza yükleyin (gerekirse ZIP'i çıkarın).
2. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** ile depoyu seçin.
3. Framework Preset: **Other**; Root Directory: projenin kendisi; Build Command **boş**; Output Directory **boş** bırakın.
4. Deploy yapın. Sayfa hemen görüntülenir. **Randevu talebi e-postaları, aşağıdaki ortam değişkenleri girilene kadar iletilmez; form açıkça uyarı verir.**
5. [resend.com](https://resend.com) üzerinde bir gönderici alan adı doğrulayın, API key oluşturun.
6. Vercel → Project → Settings → Environment Variables bölümüne şu üç bilgiyi girin:

| Değişken | Ne için? |
| --- | --- |
| `RESEND_API_KEY` | Resend hesabının gizli API anahtarı |
| `APPOINTMENT_TO_EMAIL` | Taleplerin ulaşacağı Zeliha'nın e-posta adresi |
| `APPOINTMENT_FROM_EMAIL` | Doğrulanmış alan adından gönderici (örn. `Zeliha Karadutlu <randevu@alanadiniz.com>`) |

7. Değişkenleri ekledikten sonra **Redeploy** yapın ve kendi bilgilerinizle test randevu talebi gönderin.

**Önemli:** Resend'in `onboarding@resend.dev` adresi ilk testler için kısıtlıdır; üretimde doğrulanmış bir alan adı önerilir. API anahtarını HTML, JavaScript veya herkese açık GitHub koduna kesinlikle yazmayın.

## Kullanılmadan önce onaylanacak bilgiler

- [ ] Zeliha'nın kendi **fotoğrafı**, kişisel izniyle ve isterse tasarıma eklenmeli (şimdilik kişisel fotoğraf yerine yerel illüstrasyon var).
- [ ] Özel danışmanlık verip vermediği ve kapsamı; bireysel psikolojik danışma, online/yüz yüze seçenekleri ve görüşme koşulları kendisiyle **teyit edilmeli**. Şu an sayfadaki seçenekler yalnızca talep tercihidir.
- [ ] Saat seçeneklerini gerçek çalışma takvimine göre düzenleyin (`index.html` üzerindeki `data-time` ve `api/appointment.js` içindeki `TIMES` birlikte).
- [ ] Gerçek iletişim adresi ve gerekiyorsa çalışma adresi eklenmeli; şu an kurum adı ve adresi uydurulmadı.
- [ ] Aydınlatma metninin veri sorumlusu, iletişim, hukuki dayanak, iletim ve saklama süresi vb. kısımları KVKK yönünden uzmanla tamamlanmalı.
- [ ] Üçüncü taraf e-posta sağlayıcısının kişisel veri işlemeye ilişkin koşulları incelenmeli, gizlilik yaklaşımına uygunluğu değerlendirilmelidir.
- [ ] Alana ilişkin beyanlar ve sertifika bilgilerinin sayfada kullanılmasını Zeliha onaylamalıdır.
- [ ] Resend ile gönderim yaparken spam koruması (örn. Turnstile ve kalıcı rate limit) üretim trafiğinde eklenmelidir. Mevcut temel doğrulama/honeypot ileri düzey spam önlemi değildir.

## Tasarım, doğrulanmış bilgiler ve etik sınırlar

Kaynak: Zeliha Karadutlu'nun LinkedIn profili ve 2026 mezuniyet paylaşımı: `https://www.linkedin.com/in/zeliha-karadutlu-89a48a295/`.
Gazi Üniversitesi Rehberlik ve Psikolojik Danışmanlık (2022–2026), oyun terapisi eğitimi sertifikası (NEWSPDR Academy, Eylül 2024) ve LÖSEV gönüllülüğü LinkedIn'de görünüyor. **Dershanede rehber öğretmen olarak çalıştığı** bilgisi proje sahibinden geldi. Sertifika, uzmanlık veya ayrı bir meslek ruhsatı olarak sunulmaz.

Bu web sitesi **tıbbi tanı, ilaç tedavisi veya acil psikolojik kriz hizmeti sunma iddiasında değildir**. Form tıbbi/özel nitelikli veri istemez. Randevu **kesinleştirmez**, yalnızca Zeliha'ya talep iletir.

## Teknik not

- Bağımlılık yok; Vite/Next gerekli değil.
- `/api/appointment` endpoint'i Vercel'de Node.js Function olarak otomatik çalışır.
- İstekte içerik türü, alanlar, tarih, saat ve iletişim bilgileri doğrulanır.
- Gizli anahtarlar yalnızca Vercel sunucu tarafında tutulur.
- Kullanıcı formda başarı mesajını **yalnızca e-posta servisi isteği kabul ettiğinde** görür.
- Zamanlar Türkiye saati (Europe/Istanbul) esas alınarak kontrol edilir.
