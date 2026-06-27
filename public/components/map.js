const { db, firestore } = window.tetz;
const { collection, query, where, getDocs } = firestore;

const STYLE_ID = "tetz-map-styles";
const PANEL_ID = "tetz-stand-panel";
let categoriesCache = null;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .fuar-kat {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 320px;
      padding: 16px;
      gap: 12px;
    }
    .fuar-kat-baslik {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-muted, #9aa1ad);
    }
    .fuar-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px;
      align-content: start;
    }
    .stand-hucre {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 110px;
      padding: 14px 10px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      color: #fff;
      text-align: center;
      overflow: hidden;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .stand-hucre:hover,
    .stand-hucre:focus-visible {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      outline: none;
    }
    .stand-hucre:hover .stand-hover,
    .stand-hucre:focus-visible .stand-hover {
      opacity: 1;
    }
    .stand-icon { font-size: 28px; line-height: 1; }
    .stand-ad {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.25;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    .stand-hover {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.55);
      font-size: 13px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.18s ease;
      padding: 8px;
    }
    .stand-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
    }
    .stand-panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border, #2a2f3a);
    }
    .stand-panel-header h2 {
      font-size: 18px;
      margin: 0;
    }
    .stand-panel-header p {
      color: var(--text-muted, #9aa1ad);
      font-size: 13px;
      margin-top: 4px;
    }
    .stand-panel-kapat {
      flex-shrink: 0;
      background: var(--surface-2, #1f232c);
      color: var(--text, #e6e8ee);
      border: 1px solid var(--border, #2a2f3a);
      padding: 6px 12px;
      font-size: 13px;
    }
    .stand-panel-kapat:hover {
      background: var(--border, #2a2f3a);
    }
    .stand-ogrenci-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    .stand-ogrenci-kart {
      background: var(--surface-2, #1f232c);
      border: 1px solid var(--border, #2a2f3a);
      border-radius: 10px;
      padding: 14px;
    }
    .stand-ogrenci-kart h3 {
      font-size: 15px;
      margin: 0 0 6px;
    }
    .stand-ogrenci-kart p {
      font-size: 13px;
      color: var(--text-muted, #9aa1ad);
      margin: 0 0 4px;
    }
    .stand-ilgi-etiketleri {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .stand-ilgi-etiket {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(79, 140, 255, 0.15);
      color: var(--primary, #4f8cff);
      border: 1px solid rgba(79, 140, 255, 0.25);
    }
    .stand-bos {
      text-align: center;
      color: var(--text-muted, #9aa1ad);
      font-size: 14px;
      padding: 32px 16px;
    }
    .stand-yukleniyor {
      text-align: center;
      color: var(--text-muted, #9aa1ad);
      font-size: 14px;
      padding: 24px;
    }
    .stand-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .stand-modal {
      background: var(--surface, #181b22);
      border: 1px solid var(--border, #2a2f3a);
      border-radius: 12px;
      width: min(480px, 100%);
      max-height: min(80vh, 600px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }
    @media (max-width: 480px) {
      .fuar-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stand-hucre { min-height: 96px; }
      .stand-icon { font-size: 24px; }
      .stand-ad { font-size: 12px; }
    }
  `;
  document.head.appendChild(style);
}

function escapeText(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadCategories() {
  if (categoriesCache) return categoriesCache;

  const paths = ["../data/categories.json", "data/categories.json"];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        categoriesCache = await res.json();
        return categoriesCache;
      }
    } catch {
      /* sonraki yolu dene */
    }
  }
  throw new Error("categories.json yüklenemedi");
}

function getCategoryName(kategoriId) {
  const cat = categoriesCache?.find(c => c.id === kategoriId);
  return cat ? cat.name : kategoriId;
}

function getPanelContainer() {
  return document.getElementById("content-area") || document.getElementById(PANEL_ID);
}

function ensurePanelContainer() {
  const existing = document.getElementById("content-area");
  if (existing) return existing;

  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "stand-modal-overlay";
  panel.hidden = true;
  panel.innerHTML = `<div class="stand-modal" role="dialog" aria-modal="true"></div>`;
  document.body.appendChild(panel);

  panel.addEventListener("click", e => {
    if (e.target === panel) closePanel();
  });

  return panel;
}

function closePanel() {
  const contentArea = document.getElementById("content-area");
  if (contentArea) {
    contentArea.innerHTML = `
      <section class="welcome">
        <h2>Hoş geldin!</h2>
        <p>Bir stand seçerek o alandaki öğrencileri görebilirsin.</p>
      </section>
    `;
    return;
  }

  const overlay = document.getElementById(PANEL_ID);
  if (overlay) overlay.hidden = true;
}

function renderPanelContent(html) {
  const panel = ensurePanelContainer();

  if (panel.id === "content-area") {
    panel.innerHTML = html;
    return;
  }

  panel.hidden = false;
  panel.querySelector(".stand-modal").innerHTML = html;
}

/**
 * Kategorilerden fuar kat planını CSS Grid ile oluşturur.
 * @param {string} containerId
 */
export async function renderFuarKatPlani(containerId) {
  injectStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderFuarKatPlani: "${containerId}" bulunamadı`);
    return;
  }

  container.innerHTML = `<p class="stand-yukleniyor">Kat planı yükleniyor…</p>`;

  let categories;
  try {
    categories = await loadCategories();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="stand-bos">Kat planı yüklenemedi.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="fuar-kat">
      <p class="fuar-kat-baslik">Fuar Kat Planı — ${categories.length} stand</p>
      <div class="fuar-grid" role="grid" aria-label="Fuar standları">
        ${categories.map(cat => `
          <button
            type="button"
            class="stand-hucre"
            role="gridcell"
            data-kategori-id="${escapeText(cat.id)}"
            style="background-color: ${escapeText(cat.color)}"
            aria-label="${escapeText(cat.name)} standı"
          >
            <span class="stand-icon" aria-hidden="true">${escapeText(cat.icon)}</span>
            <span class="stand-ad">${escapeText(cat.name)}</span>
            <span class="stand-hover">Bu standa git</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  container.querySelectorAll(".stand-hucre").forEach(btn => {
    btn.addEventListener("click", () => {
      onKategoriSec(btn.dataset.kategoriId);
    });
  });
}

/**
 * Seçilen kategorideki onaylı öğrencileri Firestore'dan çeker ve listeler.
 * @param {string} kategoriId
 */
export async function onKategoriSec(kategoriId) {
  injectStyles();

  if (!categoriesCache) {
    try {
      await loadCategories();
    } catch (err) {
      console.error(err);
    }
  }

  const kategoriAdi = getCategoryName(kategoriId);

  renderPanelContent(`
    <div class="stand-panel">
      <div class="stand-panel-header">
        <div>
          <h2>${escapeText(kategoriAdi)}</h2>
          <p>Stand öğrencileri yükleniyor…</p>
        </div>
        <button type="button" class="stand-panel-kapat" aria-label="Paneli kapat">Kapat</button>
      </div>
      <div class="stand-yukleniyor">Öğrenciler aranıyor…</div>
    </div>
  `);

  const kapatBtn = getPanelContainer()?.querySelector(".stand-panel-kapat");
  kapatBtn?.addEventListener("click", closePanel);

  try {
    const q = query(
      collection(db, "students"),
      where("ilgiAlanlari", "array-contains", kategoriId),
      where("onaylandi", "==", true)
    );

    const snap = await getDocs(q);
    const ogrenciler = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const listContainerId = `stand-list-${kategoriId}`;
    renderPanelContent(`
      <div class="stand-panel">
        <div class="stand-panel-header">
          <div>
            <h2>${escapeText(kategoriAdi)}</h2>
            <p>${ogrenciler.length} onaylı öğrenci</p>
          </div>
          <button type="button" class="stand-panel-kapat" aria-label="Paneli kapat">Kapat</button>
        </div>
        <div id="${listContainerId}" class="stand-ogrenci-list"></div>
      </div>
    `);

    getPanelContainer()?.querySelector(".stand-panel-kapat")
      ?.addEventListener("click", closePanel);

    renderStandOgrencileri(listContainerId, ogrenciler);
  } catch (err) {
    console.error("Öğrenci sorgusu hatası:", err);
    renderPanelContent(`
      <div class="stand-panel">
        <div class="stand-panel-header">
          <div>
            <h2>${escapeText(kategoriAdi)}</h2>
          </div>
          <button type="button" class="stand-panel-kapat" aria-label="Paneli kapat">Kapat</button>
        </div>
        <p class="stand-bos">Öğrenciler yüklenirken bir hata oluştu.</p>
      </div>
    `);
    getPanelContainer()?.querySelector(".stand-panel-kapat")
      ?.addEventListener("click", closePanel);
  }
}

/**
 * Stand öğrencilerini kart listesi olarak render eder.
 * @param {string} containerId
 * @param {Array<object>} ogrenciler
 */
export function renderStandOgrencileri(containerId, ogrenciler) {
  injectStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderStandOgrencileri: "${containerId}" bulunamadı`);
    return;
  }

  if (!ogrenciler?.length) {
    container.innerHTML = `<p class="stand-bos">Bu stantta henüz öğrenci yok</p>`;
    return;
  }

  container.innerHTML = ogrenciler.map(o => {
    const ad = o.adSoyad || o.ad || "İsimsiz Öğrenci";
    const okul = o.okul || "—";
    const sinif = o.sinif != null ? o.sinif : "—";
    const ilgiAlanlari = Array.isArray(o.ilgiAlanlari) ? o.ilgiAlanlari : [];

    const etiketler = ilgiAlanlari.map(id =>
      `<span class="stand-ilgi-etiket">${escapeText(getCategoryName(id))}</span>`
    ).join("");

    return `
      <article class="stand-ogrenci-kart">
        <h3>${escapeText(ad)}</h3>
        <p><strong>Okul:</strong> ${escapeText(okul)}</p>
        <p><strong>Sınıf:</strong> ${escapeText(sinif)}</p>
        ${etiketler ? `<div class="stand-ilgi-etiketleri">${etiketler}</div>` : ""}
      </article>
    `;
  }).join("");
}
