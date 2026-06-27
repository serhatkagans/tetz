# Form & XSS Guvenlik Test Raporu - Ekip 12

**Proje:** TETZ2026 - Ogrenci Networking Platformu
**Tarih:** 2026-06-27
**Test Edilen Sayfa:** Ogrenci Kayit Formu
**Test Araci:** Manuel (tarayici uzerinden)

---

## Test Sonuclari

| Test | Alan | Payload | Alert Cikti mi? | Risk |
|------|------|---------|-----------------|------|
| T1 | Ad Soyad | `<script>alert('XSS')</script>` | | |
| T2 | Okul | `<script>alert('XSS')</script>` | | |
| T3 | Bos form | *(tum alanlar bos birakildi)* | Hata mesaji var mi? | |
| T4 | Uzun metin | 1000+ karakter | | |
| T5 | Sinif alani | `abc` (harf girildi) | | |
| T6 | Ad Soyad | `<img src=x onerror=alert(1)>` | | |
| T7 | Okul | `" onmouseover="alert(1)` | | |
| T8 | Ad Soyad | `{{constructor.constructor('alert(1)')()}}` | | |

---

## Bulgular

<!--
  Testleri yaptiktan sonra buraya bulgularinizi yazin.
  Ornek:
  - T1: innerHTML kullanildigi icin script etiketi calistirilmadi ancak DOM'a eklendi.
  - T6: img onerror payload'u calisti, XSS acigi mevcut.
-->

1.
2.
3.

---

## Risk Degerlendirmesi

| Seviye | Aciklama |
|--------|----------|
| Kritik | Kullanici verisi caliniyor veya session ele geciriliyor |
| Yuksek | JavaScript calisiyor, potansiyel veri sizintisi |
| Orta | HTML injection mumkun ama script calismiyor |
| Dusuk | Girdi kabul ediliyor ama render edilmiyor |
| Yok | Girdi temizleniyor veya reddediliyor |

---

## Oneriler

<!--
  Bulgulara gore onerilerinizi yazin.
  Ornek:
  - innerHTML yerine textContent kullanilmali
  - Form alanlarina girdi dogrulamasi (validation) eklenmeli
  - Sinif alani sadece sayi kabul etmeli
  - Maksimum karakter siniri eklenmeli
-->

1.
2.
3.

---

## Etkilenen Kod Satirlari

| Dosya | Satir | Sorun |
|-------|-------|-------|
| `public/app.js` | | |
| `public/index.html` | | |

---

*Ekip 12 - TETZ2026 Guvenlik Testi*
