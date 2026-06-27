import { renderOneriler, eslesmeleriKaydet } from "./components/matching.js";
import { FuarKatPlani } from "./components/map.js";
import { renderStats as renderStatsCards } from "./components/stats.js";
import { renderModerasyon } from "./components/moderation.js";
import { renderRegisterForm } from "./components/register.js";
import { talepGonder, renderGelenTalepler } from "./components/meeting.js";
import { renderProfile } from "./components/profile.js";
import { initNotifications } from "./components/notification.js";

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
  matches: []
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
  renderStatsCards("stats-container");
}

// Giriş yapan kullanıcının öğrenci kaydının ID'sini döndürür (kayıt yoksa null).
// Kayıt, kullanıcının uid'si ile yazıldığı için doküman id'si = uid.
function getCurrentOgrenciId() {
  if (!state.user) return null;
  const ogrenci = state.students.find(
    (s) => s.id === state.user.uid || s.uid === state.user.uid
  );
  return ogrenci?.id ?? null;
}

// Kayıt durumu değiştiğinde içeriği yeniden çizmek için izlenir
let kayitliMiydi = false;
// Eşleşmeler oturumda yalnızca bir kez kaydedilsin (her gezinmede tekrar yazılmasın)
let eslesmelerKaydedildi = false;
// Bildirim rozeti yalnızca bir kez başlatılsın
let bildirimBaslatildi = false;

async function showOneriler(ogrenciId) {
  if (!ogrenciId) return;
  try {
    if (!eslesmelerKaydedildi) {
      eslesmelerKaydedildi = true;
      await eslesmeleriKaydet(ogrenciId);
    }
    await renderOneriler("content-area", ogrenciId);
  } catch (err) {
    eslesmelerKaydedildi = false;
    console.error("Eşleşme önerileri yüklenemedi:", err);
  }
}

// Kayıt gerektiren bir bölüme kayıtsız erişildiğinde gösterilir
function renderKayitGerekli(mesaj) {
  els.content.innerHTML = `
    <section class="welcome">
      <h2>Önce kayıt ol</h2>
      <p>${mesaj}</p>
      <p><a class="hero-cta" href="#kayit">Kayıt Ol</a></p>
    </section>
  `;
}

// Ana içerik: kayıtlı → öneriler, giriş yapmış ama kayıtsız → kayıt formu, oturum yok → karşılama
function renderContent() {
  const ogrenciId = getCurrentOgrenciId();
  if (ogrenciId) {
    showOneriler(ogrenciId);
  } else if (state.user) {
    renderRegisterForm("content-area");
  } else {
    els.content.innerHTML = `
      <section class="welcome">
        <h2>Hoş geldin!</h2>
        <p>İlgi alanlarına göre seni başka öğrencilerle eşleştireceğiz.</p>
        <p class="muted">Yükleniyor…</p>
      </section>
    `;
  }
}

async function renderMap() {
  try {
    await FuarKatPlani("map-container");
  } catch (err) {
    console.error("Harita hatası:", err);
    if (els.map) {
      els.map.innerHTML = `
        <div class="hata-mesaji">
          <p><strong>Harita yüklenemedi</strong></p>
          <p>${err.message || "Bilinmeyen hata"}</p>
          <p class="hata-mesaji__ipucu">
            index.html dosyasını doğrudan açma — bir sunucu üzerinden aç:
            <code>firebase serve</code> veya VS Code Live Server
          </p>
        </div>
      `;
    }
  }
}

function subscribeStudents() {
  return onSnapshot(collection(db, "students"), snap => {
    state.students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
    // Sadece kayıt durumu değiştiğinde içeriği yenile; aksi halde kullanıcı
    // formu doldururken her snapshot'ta form sıfırlanırdı.
    const kayitli = !!getCurrentOgrenciId();
    if (kayitli !== kayitliMiydi) {
      kayitliMiydi = kayitli;
      if (kayitli && window.location.hash === "#kayit") {
        // Kayıt tamamlandı → önerilere yönlendir
        window.location.hash = "#oneriler";
      } else if (window.location.hash !== "#moderasyon") {
        handleRoute();
      }
    }
  });
}

function subscribeMatches() {
  return onSnapshot(collection(db, "matches"), snap => {
    state.matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
  });
}

// ── Basit hash tabanlı yönlendirme ──────────────────────────
function handleRoute() {
  const hash = window.location.hash;
  const ogrenciId = getCurrentOgrenciId();

  switch (hash) {
    case "#moderasyon":
      renderModerasyon("content-area");
      break;

    case "#kayit":
      if (ogrenciId) {
        // Zaten kayıtlı → profili göster
        renderProfile("content-area", ogrenciId);
      } else if (state.user) {
        renderRegisterForm("content-area");
      } else {
        renderContent();
      }
      break;

    case "#profil":
      if (ogrenciId) renderProfile("content-area", ogrenciId);
      else renderKayitGerekli("Profilini görmek için önce kayıt olmalısın.");
      break;

    case "#bulusmalar":
      if (ogrenciId) renderGelenTalepler("content-area", ogrenciId);
      else renderKayitGerekli("Buluşma taleplerini görmek için önce kayıt olmalısın.");
      break;

    case "#oneriler":
    default:
      renderContent();
      break;
  }

  // İçerik bölümünü görünür alana getir (hero uzun olduğu için)
  if (hash && hash !== "#map-container" && hash !== "#stats-bar") {
    els.content?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

window.addEventListener("hashchange", handleRoute);

async function init() {
  try {
    state.categories = await loadCategories();
  } catch (err) {
    console.error(err);
    state.categories = [];
  }

  // "Tanış" butonu → buluşma talebi gönder (meeting.js kullanıcıya geri bildirim verir)
  window.addEventListener("tetz:tanis", (event) => {
    const { ogrenciId, hedefId } = event.detail ?? {};
    if (ogrenciId && hedefId) talepGonder(ogrenciId, hedefId);
  });

  onAuthStateChanged(auth, user => {
    state.user = user;
    if (!user) {
      signInAnonymously(auth).catch(err => console.error("Anonim giriş hatası:", err));
      return;
    }
    subscribeStudents();
    subscribeMatches();

    // Bekleyen buluşma talepleri için bildirim rozeti
    if (!bildirimBaslatildi) {
      bildirimBaslatildi = true;
      try {
        initNotifications("bildirim-alani", user.uid);
      } catch (err) {
        console.error("Bildirim rozeti başlatılamadı:", err);
      }
    }

    kayitliMiydi = !!getCurrentOgrenciId();
    handleRoute();
  });

  await renderMap();
  handleRoute();
  renderStats();
}

init();

export { state, db, auth };
