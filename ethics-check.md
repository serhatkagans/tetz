# Etik Kontrol Listesi

> TETZ2026 projesi için etik uyumluluk kontrol listesi.
> Her madde ilgili ekip tarafından incelenmeli ve onaylanmalıdır.

---

## 🔒 Kişisel Veri Güvenliği

- [ ] Kişisel veri (T.C. kimlik numarası, telefon numarası, ev adresi) saklanmıyor
- [ ] Firestore'da yalnızca gerekli minimum veri tutuluyor (ad, ilgi alanları)
- [ ] Firebase güvenlik kuralları hassas verilere erişimi kısıtlıyor
- [ ] `.env` dosyası ve API anahtarları `.gitignore` ile korunuyor

## 🖼️ Görsel İçerik

- [ ] Görsel içerikler uygun ve telif hakkı temiz
- [ ] Kullanılan tüm görseller için lisans bilgisi mevcut
- [ ] Uygunsuz veya yanıltıcı görsel içerik bulunmuyor

## 🤖 AI Kullanımı

- [ ] AI tarafından üretilen kod gözden geçirildi
- [ ] AI üretimi kodda güvenlik açıkları tarandı
- [ ] AI ile üretilen içerikler doğruluk açısından kontrol edildi
- [ ] Kullanılan AI araçları ve promptları `prompts.md` dosyasında belgelendi

## 👤 Kullanıcı Bilgilendirme

- [ ] Kullanıcılar verilerinin nasıl kullanıldığını biliyor
- [ ] Gizlilik politikası / kullanım koşulları sayfası mevcut
- [ ] Anonim giriş yapıldığı kullanıcıya bildiriliyor
- [ ] Veri silme/düzeltme talep mekanizması tanımlanmış

## ♿ Erişilebilirlik

- [ ] Engelli kullanıcılar için erişilebilirlik düşünüldü
- [ ] Renk kontrastı WCAG AA standardını karşılıyor
- [ ] Klavye ile navigasyon mümkün
- [ ] Ekran okuyucu uyumluluğu test edildi (ARIA etiketleri)
- [ ] Metin boyutu yeterli ve okunabilir

## 🧒 Minör Kullanıcı Güvenliği

- [ ] Minör kullanıcı verileri korunuyor
- [ ] 18 yaş altı kullanıcılar için ek güvenlik önlemleri alındı
- [ ] Öğrenci profilleri yalnızca onaylı kullanıcılar tarafından görüntülenebilir
- [ ] Buluşma talepleri güvenli ve denetlenebilir şekilde yönetiliyor

---

## 📋 Onay Durumu

| Kontrol Alanı | Sorumlu Ekip | Durum |
|----------------|-------------|-------|
| Kişisel Veri Güvenliği | Ekip 4 (Backend), Ekip 13 (Güvenlik) | ⏳ Bekliyor |
| Görsel İçerik | Ekip 2 (UI/UX) | ⏳ Bekliyor |
| AI Kullanımı | Ekip 14 (Dokümantasyon), Tüm Ekipler | ⏳ Bekliyor |
| Kullanıcı Bilgilendirme | Ekip 1 (Proje Yönetimi), Ekip 3 (Frontend) | ⏳ Bekliyor |
| Erişilebilirlik | Ekip 2 (UI/UX), Ekip 3 (Frontend) | ⏳ Bekliyor |
| Minör Kullanıcı Güvenliği | Ekip 5 (Auth), Ekip 13 (Güvenlik) | ⏳ Bekliyor |

---

> ⚠️ **Önemli:** Bu kontrol listesi projenin her sürümünde gözden geçirilmeli ve güncellenmelidir. Tüm maddeler onaylanmadan proje canlıya alınmamalıdır.
