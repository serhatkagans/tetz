# TETZ2026 Güvenlik Test Raporu

**Ekip:** Ekip 13 — Güvenlik Raporlama  
**Tarih:** 27 Haziran 2026  
**Proje:** TETZ2026  

---

## Özet

Bu rapor, TETZ2026 projesinin güvenlik taraması ve kod incelemesi sonuçlarını içermektedir. Tarama kapsamında kaynak kod analizi, bağımlılık denetimi, Firebase yapılandırma kontrolü ve genel güvenlik en iyi uygulamaları değerlendirilmiştir.

| Kategori         | Sayı |
|------------------|------|
| Yüksek Risk      | 0    |
| Orta Risk        | 0    |
| Düşük Risk/Bilgi | 1    |

---

## Yüksek Risk Bulgular

> Şu an için yüksek risk bulgusu tespit edilmemiştir.

---

## Orta Risk Bulgular

> Şu an için orta risk bulgusu tespit edilmemiştir.

---

## Düşük Risk / Bilgi Notu

### Firebase apiKey Notu

> [!NOTE]
> Firebase istemci `apiKey`'i public görünmesi **normaldir** ve bu bir güvenlik açığı değildir.

- Firebase API anahtarı, yalnızca projeyi tanımlamak için kullanılır; yetkilendirme sağlamaz.
- **Güvenlik, Firestore Security Rules ve Storage Security Rules tarafından sağlanır.**
- API anahtarının kaynak kodda veya istemci tarafında görünmesi, Firebase'in tasarım gereği beklenen davranışıdır.
- Bkz: [Firebase Documentation — Use API keys](https://firebase.google.com/docs/projects/api-keys)

**Kontrol Edilen Kurallar:**

| Dosya              | Durum      | Açıklama                                    |
|--------------------|------------|---------------------------------------------|
| `firestore.rules`  | ✅ Mevcut  | Firestore erişim kuralları tanımlanmış       |
| `storage.rules`    | ⚠️ Kontrol | Storage kuralları ayrıca doğrulanmalı        |

---

## Repo Tarama Sonuçları

### Kaynak Kod Analizi

| Kontrol Alanı                        | Sonuç       | Not                                          |
|--------------------------------------|-------------|----------------------------------------------|
| Hardcoded secret/password            | ✅ Temiz    | `.env.example` kullanımı mevcut              |
| `.gitignore` yapılandırması          | ✅ Uygun    | `.env`, `node_modules` vb. hariç tutulmuş    |
| Bağımlılık güvenlik açıkları         | ⏳ Bekliyor | `npm audit` çalıştırılmalı                   |
| XSS / Injection riski                | ⏳ Bekliyor | İstemci tarafı input sanitizasyonu kontrol edilmeli |
| HTTPS zorlaması                      | ✅ Uygun    | Firebase Hosting varsayılan olarak HTTPS kullanır |

### `.env.example` İncelemesi

- `.env.example` dosyası mevcut (316 byte).
- Gerçek `.env` dosyası `.gitignore` ile hariç tutulmuş olmalıdır.
- API anahtarları ve hassas bilgiler `.env` dosyasında saklanmalıdır.

---

## Öneriler

### Kısa Vadeli (Acil)

1. **`npm audit`** çalıştırarak bağımlılık güvenlik açıklarını kontrol edin.
2. **Firestore Security Rules**'u production ortamı için gözden geçirin — açık kurallar (`allow read, write: if true;`) olmamalı.
3. **Storage Security Rules** dosyasının varlığını ve içeriğini doğrulayın.

### Orta Vadeli

4. İstemci tarafındaki kullanıcı girdilerinde **input sanitizasyonu** uygulayın (XSS koruması).
5. Firebase Authentication kullanıyorsanız, **yetkilendirme kontrollerini** backend kurallarına entegre edin.
6. **Content Security Policy (CSP)** başlıklarını yapılandırın.

### Uzun Vadeli

7. Otomatik güvenlik taraması için **CI/CD pipeline'a** güvenlik adımları ekleyin.
8. Düzenli güvenlik denetimleri planlayın.
9. **OWASP Top 10** kontrol listesine göre periyodik değerlendirme yapın.

---

> **Raporu hazırlayan:** Ekip 13 — Güvenlik Raporlama  
> **Son güncelleme:** 27 Haziran 2026
