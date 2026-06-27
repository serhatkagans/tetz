# TETZ2026 — Öğrenci Networking Platformu

> İlgi alanlarına göre öğrencileri akıllıca eşleştiren, buluşma talepleri yönetebilen modern bir networking platformu.

🔗 **Canlı Demo:** [tetz2026.web.app](https://tetz2026.web.app)

---

## 📌 Proje Nedir?

TETZ2026, Türkiye genelindeki öğrencileri ortak ilgi alanları üzerinden bir araya getiren bir **networking platformudur**. Platform, öğrencilerin profillerini oluşturmasını, ilgi alanlarına göre birbirleriyle eşleşmesini ve buluşma talepleri göndererek iletişim kurmasını sağlar.

### Temel Hedefler

- Öğrenciler arası **anlamlı bağlantılar** kurmak
- Yapay Zeka, Web Geliştirme, Robotik gibi **17 farklı ilgi alanı** üzerinden eşleştirme yapmak
- **Harita tabanlı** görselleştirme ile öğrenci dağılımını göstermek
- Gerçek zamanlı **buluşma talep sistemi** sunmak

---

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🧠 Akıllı Eşleştirme | Öğrencileri seçtikleri ilgi alanlarına göre eşleştirir |
| 🗺️ Harita Görünümü | Öğrenci dağılımını harita üzerinde görselleştirir |
| 🤝 Buluşma Talepleri | Öğrenciler birbirine tanışma talebi gönderebilir, kabul/red edebilir |
| 📊 Canlı İstatistikler | Toplam öğrenci, onaylı öğrenci ve eşleşme sayısını anlık gösterir |
| 🔔 Toast Bildirimleri | Glassmorphic tasarımlı anlık bildirim sistemi |
| 🔒 Anonim Giriş | Firebase Anonymous Auth ile kullanıcı kaydı gerektirmeden erişim |
| 📱 Responsive Tasarım | Mobil ve masaüstü uyumlu arayüz |
| ⚡ Gerçek Zamanlı | Firestore `onSnapshot` ile anlık veri güncellemeleri |

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| **Backend / BaaS** | Firebase (Hosting, Firestore, Authentication) |
| **Veritabanı** | Cloud Firestore (NoSQL) |
| **Kimlik Doğrulama** | Firebase Anonymous Auth |
| **Hosting** | Firebase Hosting |
| **Tasarım** | CSS Custom Properties, Glassmorphism, Dark Mode |

### Firebase SDK Sürümü
- Firebase Web SDK **v10.12.2** (CDN üzerinden ES Module olarak yüklenir)

### Firestore Koleksiyonları

| Koleksiyon | Açıklama |
|------------|----------|
| `students` | Öğrenci profilleri (ad, soyad, ilgi alanları, onay durumu) |
| `matches` | Eşleşme kayıtları |
| `meetings` | Buluşma talepleri (gönderen, alıcı, durum, tarih) |

---

## 📁 Klasör Yapısı

```
tetz/
├── .env.example            # Firebase yapılandırma şablonu
├── .gitignore              # Git tarafından yok sayılacak dosyalar
├── README.md               # Bu dosya
├── firebase.json           # Firebase Hosting ve Firestore yapılandırması
├── firestore.rules         # Firestore güvenlik kuralları
├── data/
│   └── categories.json     # 17 ilgi alanı kategorisi (id, ad, ikon, renk)
├── public/                 # Firebase Hosting tarafından sunulan dosyalar
│   ├── index.html          # Ana HTML — Firebase SDK yükleme ve yapılandırma
│   ├── app.js              # Ana uygulama mantığı — state, render, subscriptions
│   ├── style.css           # Global stiller — dark mode, CSS variables, responsive
│   └── components/
│       └── meeting.js      # Buluşma talep sistemi — gönderme, listeleme, yanıtlama
├── prompts.md              # AI prompt arşivi
└── ethics-check.md         # Etik kontrol listesi
```

---

## 🚀 Nasıl Çalıştırılır?

### Ön Koşullar

- Bir Firebase projesi oluşturulmuş olmalı
- Firebase CLI yüklü olmalı (`npm install -g firebase-tools`)

### Kurulum Adımları

1. **Depoyu klonlayın:**
   ```bash
   git clone https://github.com/<kullanici>/tetz.git
   cd tetz
   ```

2. **Firebase yapılandırmasını ayarlayın:**
   ```bash
   cp .env.example .env
   # .env dosyasını kendi Firebase bilgilerinizle doldurun
   ```

   > ⚠️ Not: Mevcut projede Firebase config değerleri doğrudan `index.html` içinde tanımlanmıştır. Üretim ortamında bu değerleri ortam değişkenlerine taşımanız önerilir.

3. **Firebase'e giriş yapın:**
   ```bash
   firebase login
   ```

4. **Lokal sunucuyu başlatın:**
   ```bash
   firebase serve
   ```
   Tarayıcınızda `http://localhost:5000` adresine gidin.

5. **Canlıya yayınlayın:**
   ```bash
   firebase deploy
   ```

### Firestore Kuralları

Mevcut güvenlik kuralları:
- **students:** Herkes okuyabilir, onaylanmamış öğrenci oluşturulabilir/güncellenebilir, silme yasak
- **matches:** Okuma ve yazma açık
- **meetings:** Okuma ve yazma açık

---

## 👥 15 Ekip ve Görevleri

| Ekip | Ekip Adı | Görev Alanı |
|------|----------|-------------|
| Ekip 1 | Proje Yönetimi | Genel koordinasyon, sprint planlama, ekipler arası iletişim |
| Ekip 2 | UI/UX Tasarım | Arayüz tasarımı, kullanıcı deneyimi, wireframe/mockup |
| Ekip 3 | Frontend Geliştirme | HTML/CSS/JS ile arayüz kodlama, responsive tasarım |
| Ekip 4 | Backend / Firebase | Firestore yapısı, güvenlik kuralları, Cloud Functions |
| Ekip 5 | Kimlik Doğrulama | Firebase Auth entegrasyonu, kullanıcı oturum yönetimi |
| Ekip 6 | Eşleştirme Algoritması | İlgi alanı bazlı akıllı eşleştirme motoru |
| Ekip 7 | Harita Modülü | Öğrenci konum görselleştirme, harita entegrasyonu |
| Ekip 8 | Buluşma Sistemi | Tanışma talepleri gönderme, kabul/red, bildirim |
| Ekip 9 | Bildirim Sistemi | Toast bildirimler, push notification altyapısı |
| Ekip 10 | Profil Yönetimi | Öğrenci profil oluşturma, düzenleme, görüntüleme |
| Ekip 11 | Admin Paneli | Öğrenci onaylama, moderasyon araçları, istatistikler |
| Ekip 12 | Test & QA | Birim testleri, entegrasyon testleri, hata raporlama |
| Ekip 13 | Performans & Güvenlik | Sayfa hızı optimizasyonu, güvenlik denetimi |
| Ekip 14 | Dokümantasyon | README, API belgeleri, kullanım kılavuzları, etik kontrol |
| Ekip 15 | DevOps & Deployment | CI/CD pipeline, Firebase Hosting, ortam yönetimi |

---

## 🌐 Canlı Demo

**🔗 [tetz2026.web.app](https://tetz2026.web.app)**

Platform Firebase Hosting üzerinde barındırılmaktadır. Herhangi bir kurulum yapmadan doğrudan tarayıcınızdan erişebilirsiniz.

---

## 🤝 Katkıda Bulunanlar

Bu proje TETZ2026 ekibi tarafından geliştirilmektedir. Katkıda bulunmak için:

1. Bu depoyu forklayın
2. Yeni bir dal oluşturun (`git checkout -b ozellik/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Dalınıza push edin (`git push origin ozellik/yeni-ozellik`)
5. Bir Pull Request açın

### Katkı Kuralları

- Her ekip kendi görev alanı kapsamında çalışır
- Kod değişiklikleri PR üzerinden gözden geçirilmelidir
- Commit mesajları açıklayıcı ve Türkçe olmalıdır
- Yeni özellikler için ilgili dokümantasyon güncellenmelidir

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır.

```
MIT License

Copyright (c) 2026 TETZ2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```