// TETZ2026 Networking Platform - Profile Component
// Ekip 2 Görevi

/**
 * data/categories.json dosyasından ilgi alanlarını yükleyen yardımcı fonksiyon.
 */
async function loadCategories() {
  for (const path of ["data/categories.json", "../data/categories.json", "categories.json"]) {
    try {
      const res = await fetch(path);
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error("Kategori listesi yüklenemedi.");
}

/**
 * Bir chip elementinin stilini kategori rengine ve seçili olma durumuna göre günceller.
 */
function updateChipStyle(chip, category, isSelected) {
  const color = category.color || '#4F8CFF';
  if (isSelected) {
    chip.style.backgroundColor = color;
    chip.style.color = '#ffffff';
    chip.style.borderColor = color;
    chip.style.boxShadow = `0 4px 12px ${color}66`;
  } else {
    chip.style.backgroundColor = `${color}1A`; // %10 opaklık
    chip.style.color = color;
    chip.style.borderColor = `${color}4D`; // %30 opaklık
    chip.style.boxShadow = 'none';
  }
}

/**
 * Gerekli bileşen stillerini dokümana enjekte eder.
 */
function injectStyles() {
  const styleId = "tetz-profile-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .tetz-profile-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      animation: tetzFadeIn 0.4s ease;
      color: var(--text);
      max-width: 100%;
      box-sizing: border-box;
    }

    .tetz-profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }

    .tetz-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      box-shadow: 0 4px 15px rgba(79, 140, 255, 0.3);
      user-select: none;
      flex-shrink: 0;
    }

    .tetz-student-info h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--text);
    }

    .tetz-student-meta {
      font-size: 14px;
      color: var(--text-muted);
      margin: 2px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tetz-section-divider {
      height: 1px;
      background: var(--border);
      margin: 20px 0;
    }

    .tetz-section {
      margin-bottom: 24px;
    }

    .tetz-section h4 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--text);
    }

    .tetz-section-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    .tetz-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 10px;
    }

    .tetz-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      user-select: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: inherit;
    }

    .tetz-chip:hover {
      transform: translateY(-2px);
    }

    .tetz-chip:active {
      transform: translateY(0) scale(0.96);
    }

    .tetz-chip-icon {
      font-size: 15px;
    }

    .tetz-toggle-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: var(--surface-2);
      border-radius: 12px;
      border: 1px solid var(--border);
      gap: 16px;
    }

    .tetz-toggle-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .tetz-toggle-label {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }

    .tetz-toggle-desc {
      font-size: 12px;
      color: var(--text-muted);
    }

    .tetz-switch {
      position: relative;
      display: inline-block;
      min-width: 48px;
      width: 48px;
      height: 26px;
      flex-shrink: 0;
    }

    .tetz-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .tetz-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--border);
      transition: .3s;
      border: 1px solid var(--border);
    }

    .tetz-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: var(--text-muted);
      transition: .3s;
    }

    .tetz-switch input:checked + .tetz-slider {
      background-color: rgba(79, 140, 255, 0.2);
      border-color: var(--primary);
    }

    .tetz-switch input:checked + .tetz-slider:before {
      background-color: var(--primary);
      transform: translateX(22px);
    }

    .tetz-slider.round {
      border-radius: 34px;
    }

    .tetz-slider.round:before {
      border-radius: 50%;
    }

    .tetz-actions {
      margin-top: 20px;
    }

    .tetz-btn-primary {
      width: 100%;
      padding: 12px 20px;
      background: linear-gradient(135deg, var(--primary), #3b70cc);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 15px rgba(79, 140, 255, 0.25);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-family: inherit;
    }

    .tetz-btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-hover), var(--primary));
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 140, 255, 0.35);
    }

    .tetz-btn-primary:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }

    .tetz-btn-primary:disabled {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
      cursor: not-allowed;
      box-shadow: none;
    }

    .tetz-feedback-message {
      margin: 16px 0;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      display: none;
      animation: tetzSlideInDown 0.3s ease;
      transition: opacity 0.5s ease;
    }

    .tetz-feedback-message.success {
      display: block;
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
    }

    .tetz-feedback-message.error {
      display: block;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    .tetz-feedback-message.fade-out {
      opacity: 0;
    }

    .tetz-profile-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 20px;
      color: var(--text-muted);
      gap: 12px;
    }

    .tetz-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: tetzSpin 1s infinite linear;
    }

    .tetz-profile-error {
      padding: 30px 20px;
      text-align: center;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 12px;
      color: #ef4444;
    }

    @keyframes tetzFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes tetzSlideInDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes tetzSpin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .tetz-profile-card {
        padding: 16px;
      }
      .tetz-profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
      }
      .tetz-toggle-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .tetz-switch {
        align-self: flex-end;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Profil kartı arayüzünü oluşturup olay dinleyicilerini tanımlar.
 */
function renderUI(container, studentId, studentData, categories, updateDoc, studentDocRef) {
  // Veritabanı alanlarının esnek eşleşmesi (ad, name, okul, school, sinif, grade gibi olası tüm alternatifleri destekler)
  const ad = studentData.ad || studentData.name || studentData.adSoyad || 'Bilinmeyen Öğrenci';
  const okul = studentData.okul || studentData.school || 'Belirtilmemiş Okul';
  const sinif = studentData.sinif || studentData.grade || studentData.class || 'Belirtilmemiş Sınıf';
  
  // Seçili ilgi alanları set'i ve buluşma kabul durumu
  const selectedCategories = new Set(studentData.ilgiAlanlari || []);
  let bulusmaKabul = studentData.bulusmaKabul === true;

  // Ana profil yapısını render etme
  container.innerHTML = `
    <div class="tetz-profile-card">
      <div class="tetz-profile-header">
        <div class="tetz-avatar">
          <span>${ad.charAt(0).toUpperCase()}</span>
        </div>
        <div class="tetz-student-info">
          <h3>${ad}</h3>
          <p class="tetz-student-meta">🏫 ${okul}</p>
          <p class="tetz-student-meta">🎓 Sınıf: ${sinif}</p>
        </div>
      </div>

      <div class="tetz-section-divider"></div>

      <div class="tetz-profile-body">
        <div class="tetz-section">
          <h4>🎯 İlgi Alanlarım</h4>
          <p class="tetz-section-desc">Networking için ilgi duyduğun alanları seç (birden fazla seçebilirsin):</p>
          <div class="tetz-chips-container" id="tetz-chips-grid"></div>
        </div>

        <div class="tetz-section">
          <div class="tetz-toggle-container">
            <div class="tetz-toggle-text">
              <span class="tetz-toggle-label">🤝 Beni Eşleştir</span>
              <span class="tetz-toggle-desc">Diğer öğrencilerle networking buluşmaları için eşleşmek istiyor musun?</span>
            </div>
            <label class="tetz-switch">
              <input type="checkbox" id="tetz-match-toggle" ${bulusmaKabul ? 'checked' : ''}>
              <span class="tetz-slider round"></span>
            </label>
          </div>
        </div>

        <div class="tetz-feedback-message" id="tetz-status-msg"></div>

        <div class="tetz-actions">
          <button type="button" id="tetz-save-btn" class="tetz-btn-primary">
            <span>Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // İlgi alanları chiplerini oluşturup ekleme
  const chipsGrid = container.querySelector("#tetz-chips-grid");
  categories.forEach(cat => {
    const isSelected = selectedCategories.has(cat.id);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `tetz-chip ${isSelected ? 'selected' : ''}`;
    chip.dataset.id = cat.id;
    
    // Renge göre başlangıç stilini ver
    updateChipStyle(chip, cat, isSelected);

    chip.innerHTML = `<span class="tetz-chip-icon">${cat.icon || '✨'}</span> ${cat.name}`;

    // Tıklama olay dinleyicisi: seç/kaldır
    chip.addEventListener("click", () => {
      if (selectedCategories.has(cat.id)) {
        selectedCategories.delete(cat.id);
        updateChipStyle(chip, cat, false);
        chip.classList.remove("selected");
      } else {
        selectedCategories.add(cat.id);
        updateChipStyle(chip, cat, true);
        chip.classList.add("selected");
      }
    });

    chipsGrid.appendChild(chip);
  });

  // Buluşma kabul toggle olayı
  const toggleInput = container.querySelector("#tetz-match-toggle");
  toggleInput.addEventListener("change", (e) => {
    bulusmaKabul = e.target.checked;
  });

  // Kaydetme işlemi ve geri bildirim mesajları
  const saveBtn = container.querySelector("#tetz-save-btn");
  const statusMsg = container.querySelector("#tetz-status-msg");

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.classList.add("tetz-btn-loading");
    saveBtn.innerHTML = `<span>Kaydediliyor...</span>`;
    statusMsg.className = "tetz-feedback-message";
    statusMsg.innerHTML = "";

    try {
      await updateDoc(studentDocRef, {
        ilgiAlanlari: Array.from(selectedCategories),
        bulusmaKabul: bulusmaKabul
      });

      statusMsg.className = "tetz-feedback-message success";
      statusMsg.innerHTML = "✨ Değişiklikler kaydedildi.";
      
      // Mesajın 3 saniye sonra yavaşça kaybolması
      setTimeout(() => {
        statusMsg.classList.add("fade-out");
        setTimeout(() => {
          statusMsg.className = "tetz-feedback-message";
          statusMsg.innerHTML = "";
        }, 500);
      }, 3000);
      
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      statusMsg.className = "tetz-feedback-message error";
      statusMsg.innerHTML = "❌ Güncelleme başarısız oldu: " + error.message;
    } finally {
      saveBtn.disabled = false;
      saveBtn.classList.remove("tetz-btn-loading");
      saveBtn.innerHTML = `<span>Kaydet</span>`;
    }
  });
}

/**
 * Dışarıya aktarılan ana render fonksiyonu.
 * Belirtilen containerId içine ilgili öğrenci bilgilerini, kategorileri ve profil düzenleme formunu render eder.
 * 
 * @param {string} containerId - Arayüzün render edileceği HTML elementinin id'si
 * @param {string} studentId - Bilgileri getirilecek ve güncellenecek olan öğrencinin Firestore ID'si
 */
export async function renderProfile(containerId, studentId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Bileşenin yerleştirileceği "${containerId}" ID'li element bulunamadı.`);
    return;
  }

  // Yükleniyor durumunu göster
  container.innerHTML = `
    <div class="tetz-profile-loading">
      <div class="tetz-spinner"></div>
      <p>Profil bilgileri yükleniyor...</p>
    </div>
  `;

  // Dinamik CSS stillerini enjekte et
  injectStyles();

  try {
    // Kategorileri yükle
    const categories = await loadCategories();

    // Firestore verilerini çek
    const { db, firestore } = window.tetz;
    const { doc, getDoc, updateDoc } = firestore;
    
    const studentDocRef = doc(db, "students", studentId);
    const studentSnap = await getDoc(studentDocRef);

    if (!studentSnap.exists()) {
      container.innerHTML = `
        <div class="tetz-profile-error">
          <p>Öğrenci bulunamadı (ID: ${studentId})</p>
        </div>
      `;
      return;
    }

    const studentData = studentSnap.data();

    // Arayüzü oluştur
    renderUI(container, studentId, studentData, categories, updateDoc, studentDocRef);

  } catch (err) {
    console.error("Profil yükleme hatası:", err);
    container.innerHTML = `
      <div class="tetz-profile-error">
        <p>Profil yüklenirken bir hata oluştu.</p>
        <small>${err.message}</small>
      </div>
    `;
  }
}
