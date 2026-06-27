/**
 * TETZ2026 — Ekip 6: Filtre Bileşeni
 *
 * Öğrenci listesini ilgi alanı, sınıf ve metin aramasıyla
 * istemci tarafında filtreler. Firestore'a ek sorgu atmaz.
 *
 * Kullanım:
 *   import { initFilters } from './components/filters.js';
 *   const filters = await initFilters('filter-container', ({ ilgiAlanlari, sinif, arama }) => { … });
 *   filters.setCount(42);   // "42 öğrenci bulundu"
 *   filters.reset();        // filtreleri programatik sıfırla
 */

// ── Modül durumu ──────────────────────────────────────────────
let _categories = [];
let _state = { ilgiAlanlari: [], sinif: null, arama: '' };
let _onFilterChange = null;
let _container = null;

// DOM referansları
let _searchInput = null;
let _gradeButtons = [];
let _categoryButtons = [];
let _clearBtn = null;
let _countEl = null;

// ── Yardımcı: CSS inject (tek sefer) ─────────────────────────
let _stylesInjected = false;

function injectStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;

  const css = `
/* ═══════════════════════════════════════════════════════════════
   TETZ Filtre Bileşeni — Ekip 6
   ═══════════════════════════════════════════════════════════════ */
.tetz-filters {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: rgba(24, 27, 34, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border, #2a2f3a);
  border-radius: var(--radius, 10px);
}

/* ── Bölüm başlıkları ─────────────────────────────────────── */
.tetz-filters__section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-muted, #9aa1ad);
  margin-bottom: 8px;
}

/* ── Arama kutusu ──────────────────────────────────────────── */
.tetz-filters__search-wrap {
  position: relative;
}

.tetz-filters__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
  opacity: 0.55;
}

.tetz-filters__search {
  width: 100%;
  padding: 10px 14px 10px 38px;
  background: var(--surface-2, #1f232c);
  border: 1px solid var(--border, #2a2f3a);
  border-radius: 8px;
  color: var(--text, #e6e8ee);
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.tetz-filters__search::placeholder {
  color: var(--text-muted, #9aa1ad);
  opacity: 0.7;
}

.tetz-filters__search:focus {
  outline: none;
  border-color: var(--primary, #4f8cff);
  box-shadow: 0 0 0 3px rgba(79, 140, 255, 0.15);
}

/* ── Buton grupları ────────────────────────────────────────── */
.tetz-filters__btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── Sınıf butonları ───────────────────────────────────────── */
.tetz-filters__grade-btn {
  position: relative;
  padding: 7px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1.5px solid var(--border, #2a2f3a);
  background: var(--surface-2, #1f232c);
  color: var(--text-muted, #9aa1ad);
  transition: all 0.2s ease;
  user-select: none;
}

.tetz-filters__grade-btn:hover {
  border-color: var(--primary, #4f8cff);
  color: var(--text, #e6e8ee);
  transform: translateY(-1px);
}

.tetz-filters__grade-btn--active {
  background: var(--primary, #4f8cff);
  border-color: var(--primary, #4f8cff);
  color: #fff;
  box-shadow: 0 2px 10px rgba(79, 140, 255, 0.35);
}

.tetz-filters__grade-btn--active:hover {
  background: var(--primary-hover, #6aa0ff);
  border-color: var(--primary-hover, #6aa0ff);
}

/* ── Kategori (ilgi alanı) butonları ───────────────────────── */
.tetz-filters__cat-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1.5px solid var(--border, #2a2f3a);
  background: var(--surface-2, #1f232c);
  color: var(--text-muted, #9aa1ad);
  transition: all 0.25s ease;
  user-select: none;
  overflow: hidden;
}

.tetz-filters__cat-btn .tetz-cat-icon {
  font-size: 15px;
  line-height: 1;
}

.tetz-filters__cat-btn:hover {
  transform: translateY(-1px);
}

.tetz-filters__cat-btn--active {
  color: #fff;
  font-weight: 600;
}

/* ── Alt bar: sayaç + temizle ──────────────────────────────── */
.tetz-filters__bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border, #2a2f3a);
}

.tetz-filters__count {
  font-size: 13px;
  color: var(--text-muted, #9aa1ad);
  transition: color 0.2s ease;
}

.tetz-filters__count strong {
  color: var(--text, #e6e8ee);
  font-weight: 700;
  font-size: 15px;
  margin-right: 2px;
}

.tetz-filters__clear-btn {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1.5px solid var(--border, #2a2f3a);
  background: transparent;
  color: var(--text-muted, #9aa1ad);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tetz-filters__clear-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.tetz-filters__clear-btn--has-filters {
  border-color: #ef4444;
  color: #ef4444;
}

/* ── Mobil uyumluluk ───────────────────────────────────────── */
@media (max-width: 600px) {
  .tetz-filters {
    padding: 14px;
    gap: 16px;
  }

  .tetz-filters__btn-group {
    gap: 6px;
  }

  .tetz-filters__cat-btn {
    font-size: 12px;
    padding: 5px 10px;
  }

  .tetz-filters__grade-btn {
    padding: 6px 14px;
    font-size: 12px;
  }

  .tetz-filters__bottom-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .tetz-filters__clear-btn {
    text-align: center;
  }
}

/* ── Giriş animasyonu ──────────────────────────────────────── */
@keyframes tetzFilterFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.tetz-filters {
  animation: tetzFilterFadeIn 0.35s ease-out;
}
  `;

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-tetz-filters', '');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

// ── Kategorileri yükle ────────────────────────────────────────
async function loadCategories() {
  // app.js ile aynı yolu dene
  try {
    const res = await fetch('../data/categories.json');
    if (res.ok) return res.json();
  } catch { /* yedek yolu dene */ }

  try {
    const res2 = await fetch('data/categories.json');
    if (res2.ok) return res2.json();
  } catch { /* son çare */ }

  try {
    const res3 = await fetch('/data/categories.json');
    if (res3.ok) return res3.json();
  } catch { /* boş dön */ }

  console.warn('[Ekip6] categories.json yüklenemedi, boş dizi ile devam ediliyor.');
  return [];
}

// ── Renk yardımcıları ─────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function catBtnStyle(color, active) {
  if (!active) {
    return `border-color: ${color}44; color: var(--text-muted, #9aa1ad);`;
  }
  const { r, g, b } = hexToRgb(color);
  return `
    background: ${color};
    border-color: ${color};
    color: #fff;
    box-shadow: 0 2px 12px rgba(${r}, ${g}, ${b}, 0.40);
  `;
}

// ── Filtre durumu güncelle & callback ─────────────────────────
function emitChange() {
  // "Temizle" butonunun görünümünü güncelle
  const hasFilters =
    _state.ilgiAlanlari.length > 0 ||
    _state.sinif !== null ||
    _state.arama.trim() !== '';

  if (_clearBtn) {
    _clearBtn.classList.toggle('tetz-filters__clear-btn--has-filters', hasFilters);
  }

  if (typeof _onFilterChange === 'function') {
    // Klonlanmış kopya gönder ki dışarıda mutasyona uğramasın
    _onFilterChange({
      ilgiAlanlari: [..._state.ilgiAlanlari],
      sinif: _state.sinif,
      arama: _state.arama
    });
  }
}

// ── DOM oluştur ───────────────────────────────────────────────
function buildDOM(container) {
  container.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'tetz-filters';
  root.id = 'tetz-filters-root';

  // 1) Arama
  const searchSection = document.createElement('div');
  searchSection.innerHTML = `
    <div class="tetz-filters__section-title">🔍 Ara</div>
    <div class="tetz-filters__search-wrap">
      <span class="tetz-filters__search-icon">🔎</span>
      <input
        type="text"
        id="tetz-filter-search"
        class="tetz-filters__search"
        placeholder="Öğrenci adı veya okul ara…"
        autocomplete="off"
      />
    </div>
  `;
  root.appendChild(searchSection);

  // 2) Sınıf filtreleri
  const gradeSection = document.createElement('div');
  gradeSection.innerHTML = `<div class="tetz-filters__section-title">🎓 Sınıf</div>`;
  const gradeGroup = document.createElement('div');
  gradeGroup.className = 'tetz-filters__btn-group';

  [9, 10, 11, 12].forEach(grade => {
    const btn = document.createElement('button');
    btn.className = 'tetz-filters__grade-btn';
    btn.dataset.grade = grade;
    btn.textContent = `${grade}. Sınıf`;
    btn.type = 'button';
    gradeGroup.appendChild(btn);
  });

  gradeSection.appendChild(gradeGroup);
  root.appendChild(gradeSection);

  // 3) İlgi alanı filtreleri
  const catSection = document.createElement('div');
  catSection.innerHTML = `<div class="tetz-filters__section-title">💡 İlgi Alanları</div>`;
  const catGroup = document.createElement('div');
  catGroup.className = 'tetz-filters__btn-group';
  catGroup.id = 'tetz-filter-categories';

  _categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tetz-filters__cat-btn';
    btn.dataset.catId = cat.id;
    btn.type = 'button';
    btn.style.cssText = catBtnStyle(cat.color, false);
    btn.innerHTML = `<span class="tetz-cat-icon">${cat.icon}</span> ${cat.name}`;
    catGroup.appendChild(btn);
  });

  catSection.appendChild(catGroup);
  root.appendChild(catSection);

  // 4) Alt bar: Sayaç + Temizle
  const bottomBar = document.createElement('div');
  bottomBar.className = 'tetz-filters__bottom-bar';
  bottomBar.innerHTML = `
    <span id="tetz-filter-count" class="tetz-filters__count">
      <strong>0</strong> öğrenci bulundu
    </span>
    <button type="button" id="tetz-filter-clear" class="tetz-filters__clear-btn">
      ✕ Filtreleri Temizle
    </button>
  `;
  root.appendChild(bottomBar);

  container.appendChild(root);

  // DOM referanslarını yakala
  _searchInput = container.querySelector('#tetz-filter-search');
  _gradeButtons = Array.from(container.querySelectorAll('.tetz-filters__grade-btn'));
  _categoryButtons = Array.from(container.querySelectorAll('.tetz-filters__cat-btn'));
  _clearBtn = container.querySelector('#tetz-filter-clear');
  _countEl = container.querySelector('#tetz-filter-count');
}

// ── Olay dinleyicileri ────────────────────────────────────────
function attachEvents() {
  // Metin arama — debounced
  let searchTimer = null;
  _searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      _state.arama = _searchInput.value.trim();
      emitChange();
    }, 200);
  });

  // Sınıf butonları — toggle (tekli seçim)
  _gradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const grade = parseInt(btn.dataset.grade, 10);

      if (_state.sinif === grade) {
        // Aynı butona basılınca kaldır
        _state.sinif = null;
        btn.classList.remove('tetz-filters__grade-btn--active');
      } else {
        // Önceki aktif butonu temizle
        _gradeButtons.forEach(b => b.classList.remove('tetz-filters__grade-btn--active'));
        _state.sinif = grade;
        btn.classList.add('tetz-filters__grade-btn--active');
      }

      emitChange();
    });
  });

  // Kategori butonları — toggle (çoklu seçim)
  _categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.catId;
      const cat = _categories.find(c => c.id === catId);
      if (!cat) return;

      const idx = _state.ilgiAlanlari.indexOf(catId);
      if (idx > -1) {
        // Kaldır
        _state.ilgiAlanlari.splice(idx, 1);
        btn.classList.remove('tetz-filters__cat-btn--active');
        btn.style.cssText = catBtnStyle(cat.color, false);
      } else {
        // Ekle
        _state.ilgiAlanlari.push(catId);
        btn.classList.add('tetz-filters__cat-btn--active');
        btn.style.cssText = catBtnStyle(cat.color, true);
      }

      emitChange();
    });
  });

  // Filtreleri temizle
  _clearBtn.addEventListener('click', () => {
    resetFilters();
    emitChange();
  });
}

// ── Sıfırlama ─────────────────────────────────────────────────
function resetFilters() {
  _state.ilgiAlanlari = [];
  _state.sinif = null;
  _state.arama = '';

  // UI güncelle
  if (_searchInput) _searchInput.value = '';

  _gradeButtons.forEach(b => b.classList.remove('tetz-filters__grade-btn--active'));

  _categoryButtons.forEach(btn => {
    const cat = _categories.find(c => c.id === btn.dataset.catId);
    btn.classList.remove('tetz-filters__cat-btn--active');
    if (cat) btn.style.cssText = catBtnStyle(cat.color, false);
  });
}

// ── Sayaç güncelle ────────────────────────────────────────────
function setCount(count) {
  if (_countEl) {
    _countEl.innerHTML = `<strong>${count}</strong> öğrenci bulundu`;
  }
}

// ══════════════════════════════════════════════════════════════
//  ANA EXPORT
// ══════════════════════════════════════════════════════════════

/**
 * Filtre bileşenini başlatır.
 *
 * @param {string} containerId  — Filtrelerin yerleştirileceği DOM öğesinin id'si
 * @param {function} onFilterChange — Filtre değiştiğinde çağrılır
 *        Parametre: { ilgiAlanlari: string[], sinif: number|null, arama: string }
 * @returns {Promise<{ setCount: function, reset: function }>}
 */
export async function initFilters(containerId, onFilterChange) {
  injectStyles();

  _container = document.getElementById(containerId);
  if (!_container) {
    console.error(`[Ekip6] #${containerId} bulunamadı.`);
    return { setCount: () => {}, reset: () => {} };
  }

  _onFilterChange = onFilterChange;

  // Kategorileri yükle
  _categories = await loadCategories();

  // DOM oluştur & olayları bağla
  buildDOM(_container);
  attachEvents();

  // İlk yüklemede boş filtre ile callback çağır
  emitChange();

  return { setCount, reset: resetFilters };
}
