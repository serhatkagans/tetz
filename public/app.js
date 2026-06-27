import { renderOneriler } from "./components/matching.js";

const { db, auth, firestore, authApi } = window.tetz;
const {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, onSnapshot, serverTimestamp
} = firestore;
const { signInAnonymously, onAuthStateChanged } = authApi;

const state = {
  user: null,
  categories: [],
  students: [],
  matches: [],
  activeStudentId: null
};

const els = {
  app: document.getElementById("app"),
  map: document.getElementById("map-container"),
  content: document.getElementById("content-area"),
  stats: document.getElementById("stats-bar")
};

async function loadCategories() {
  const res = await fetch("../data/categories.json");
  if (!res.ok) {
    const local = await fetch("data/categories.json").catch(() => null);
    if (local && local.ok) return local.json();
    throw new Error("categories.json yüklenemedi");
  }
  return res.json();
}

function renderStats() {
  const total = state.students.length;
  const approved = state.students.filter(s => s.onaylandi).length;
  const matchCount = state.matches.length;
  els.stats.innerHTML = `
    <span><strong>${total}</strong> öğrenci</span>
    <span><strong>${approved}</strong> onaylı</span>
    <span><strong>${matchCount}</strong> eşleşme</span>
  `;
}

function renderContent() {
  if (state.activeStudentId) {
    // Recommendations rendering is handled by renderOneriler
    return;
  }
  els.content.innerHTML = `
    <section class="welcome">
      <h2>Hoş geldin! 👋</h2>
      <p>TETZ2026 Akıllı Eşleştirme Platformu'na hoş geldiniz.</p>
      <p>Sol taraftaki listeden herhangi bir öğrenciyi seçerek o öğrencinin ilgi alanlarına göre en yüksek uyum gösteren diğer öğrencileri (en iyi 3 eşleşme) görebilirsiniz.</p>
      <div class="help-box">
        <h4>💡 Algoritma Nasıl Çalışır?</h4>
        <ul>
          <li>Öğrenciler <strong>Jaccard Benzerlik Algoritması</strong> ile karşılaştırılır.</li>
          <li>Uyum Puanı Formülü: <code>(Ortak İlgi / Toplam Farklı İlgi) * 100</code></li>
          <li>Sadece <strong>Onaylı</strong> ve <strong>Buluşma Kabul Eden</strong> öğrenciler eşleşme adayı olarak değerlendirilir.</li>
        </ul>
      </div>
    </section>
  `;
}

function renderMap() {
  if (state.students.length === 0) {
    els.map.innerHTML = `<div class="map-placeholder">Kayıtlı öğrenci bulunmuyor.</div>`;
    return;
  }

  const categoryMap = new Map(state.categories.map(c => [c.id, c]));

  let html = `
    <div class="student-list-container">
      <h3 class="student-list-title">👥 Kayıtlı Öğrenciler (${state.students.length})</h3>
      <p class="student-list-subtitle">Eşleşme önerilerini görmek için bir öğrenci seçin.</p>
      <div class="student-list">
  `;

  state.students.forEach(s => {
    const isActive = state.activeStudentId === s.id;
    const isApproved = s.onaylandi === true;
    const acceptMeet = s.bulusmaKabul === true;

    const badgeOnay = isApproved
      ? `<span class="badge badge-onay">Onaylı</span>`
      : `<span class="badge badge-bekleme">Beklemede</span>`;

    const badgeBulusma = acceptMeet
      ? `<span class="badge badge-bulusma">Buluşma Aktif</span>`
      : ``;

    const interestsHtml = (s.ilgiAlanlari || []).map(catId => {
      const cat = categoryMap.get(catId);
      const icon = cat ? cat.icon : "🏷️";
      const name = cat ? cat.name : catId;
      return `<span class="student-item-interest-tag">${icon} ${name}</span>`;
    }).join("");

    html += `
      <div class="student-item ${isActive ? 'active' : ''}" data-student-id="${s.id}">
        <div class="student-item-header">
          <span class="student-item-name">${s.ad || 'İsimsiz'}</span>
          <div class="student-item-badges">
            ${badgeOnay}
            ${badgeBulusma}
          </div>
        </div>
        <div class="student-item-school">🏫 ${s.okul || 'Belirtilmemiş Okul'}</div>
        <div class="student-item-interests">
          ${interestsHtml || '<span class="no-interests">İlgi alanı belirtilmemiş</span>'}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  els.map.innerHTML = html;

  // Add click listeners
  const items = els.map.querySelectorAll(".student-item");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const studentId = item.getAttribute("data-student-id");
      selectStudent(studentId);
    });
  });
}

function selectStudent(studentId) {
  state.activeStudentId = studentId;
  renderMap();
  renderOneriler("content-area", studentId);
}

function subscribeStudents() {
  return onSnapshot(collection(db, "students"), snap => {
    state.students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
    renderMap();
  });
}

function subscribeMatches() {
  return onSnapshot(collection(db, "matches"), snap => {
    state.matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
  });
}

async function init() {
  try {
    state.categories = await loadCategories();
  } catch (err) {
    console.error(err);
    state.categories = [];
  }

  onAuthStateChanged(auth, user => {
    state.user = user;
    if (!user) {
      signInAnonymously(auth).catch(err => console.error("Anonim giriş hatası:", err));
      return;
    }
    subscribeStudents();
    subscribeMatches();
  });

  renderMap();
  renderContent();
  renderStats();
}

init();

export { state, db, auth };
