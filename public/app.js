import { initFilters } from './components/filters.js';
import { renderRegisterForm } from './components/register.js';

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
  filteredStudents: []
};

// Ekip 6 — filtre kontrol nesnesi (initFilters sonrası atanır)
let filterControls = null;

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

// ── Ekip 6: İstemci tarafı filtreleme (Firestore sorgusu ATILMAZ) ──
function applyFilters(filters) {
  const { ilgiAlanlari, sinif, arama } = filters;
  const searchLower = arama.toLowerCase();

  state.filteredStudents = state.students.filter(s => {
    // Sınıf filtresi
    if (sinif !== null && s.sinif !== sinif) return false;

    // İlgi alanı filtresi (çoklu — hepsi eşleşmeli)
    if (ilgiAlanlari.length > 0) {
      const ogrenciAlanlari = s.ilgiAlanlari || [];
      const hasMatch = ilgiAlanlari.some(id => ogrenciAlanlari.includes(id));
      if (!hasMatch) return false;
    }

    // Metin arama (ad veya okul)
    if (searchLower) {
      const ad = (s.ad || s.isim || s.name || '').toLowerCase();
      const okul = (s.okul || s.school || '').toLowerCase();
      if (!ad.includes(searchLower) && !okul.includes(searchLower)) return false;
    }

    return true;
  });

  // Sayacı güncelle
  if (filterControls) {
    filterControls.setCount(state.filteredStudents.length);
  }

  // Ekip 4 entegrasyonu: cards.js varsa renderStudentList çağır
  if (typeof window.renderStudentList === 'function') {
    window.renderStudentList('student-list', state.filteredStudents);
  }
}

function renderContent() {
  els.content.innerHTML = `
    <div id="register-container"></div>
    <div id="filter-container"></div>
    <div id="student-list"></div>
  `;
  renderRegisterForm('register-container');
}

function renderMap() {
  els.map.innerHTML = `<div class="map-placeholder">Harita alanı</div>`;
}

function subscribeStudents() {
  return onSnapshot(collection(db, "students"), snap => {
    state.students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.filteredStudents = [...state.students];
    renderStats();
    // Filtre aktifse yeniden uygula
    if (filterControls) {
      filterControls.setCount(state.filteredStudents.length);
    }
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

  // Ekip 6: Filtreleri başlat
  filterControls = await initFilters('filter-container', applyFilters);
}

init();

export { state, db, auth };
