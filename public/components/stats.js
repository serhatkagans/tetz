/**
 * TETZ2026 — Ekip 9: İstatistik Kartları
 *
 * Kullanım:
 *   import { renderStats } from './components/stats.js';
 *   await renderStats('stats-bar');
 */

async function loadCategories() {
  const paths = ["../data/categories.json", "data/categories.json"];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) return res.json();
    } catch {
      /* try next path */
    }
  }
  return [];
}

function getStudentDate(student) {
  const fields = ["olusturulmaTarihi", "createdAt", "tarih", "kayitTarihi", "olusturulma"];
  for (const field of fields) {
    const value = student[field];
    if (!value) continue;
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function isToday(student, todayStart) {
  const date = getStudentDate(student);
  if (!date) return false;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.getTime() === todayStart.getTime();
}

function findMostPopularInterest(students) {
  const counts = {};
  for (const student of students) {
    for (const id of student.ilgiAlanlari || []) {
      counts[id] = (counts[id] || 0) + 1;
    }
  }

  let popularId = null;
  let max = 0;
  for (const [id, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      popularId = id;
    }
  }
  return popularId;
}

function renderLoading(container) {
  container.innerHTML = `
    <div class="stats-grid">
      ${Array.from({ length: 4 }, () => `
        <div class="stat-card stat-card--loading">
          <span class="stat-card__icon">…</span>
          <span class="stat-card__label">Yükleniyor</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCards(container, { approvedCount, meetingCount, popularName, todayCount }) {
  container.innerHTML = `
    <div class="stats-grid">
      <article class="stat-card">
        <span class="stat-card__icon" aria-hidden="true">👥</span>
        <div class="stat-card__body">
          <strong class="stat-card__value">${approvedCount}</strong>
          <span class="stat-card__label">Öğrenci</span>
        </div>
      </article>
      <article class="stat-card">
        <span class="stat-card__icon" aria-hidden="true">🤝</span>
        <div class="stat-card__body">
          <strong class="stat-card__value">${meetingCount}</strong>
          <span class="stat-card__label">Buluşma</span>
        </div>
      </article>
      <article class="stat-card">
        <span class="stat-card__icon" aria-hidden="true">🏆</span>
        <div class="stat-card__body">
          <strong class="stat-card__value stat-card__value--text">En Popüler: ${popularName}</strong>
        </div>
      </article>
      <article class="stat-card">
        <span class="stat-card__icon" aria-hidden="true">📅</span>
        <div class="stat-card__body">
          <strong class="stat-card__value">Bugün: ${todayCount}</strong>
        </div>
      </article>
    </div>
  `;
}

export async function renderStats(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { db, firestore } = window.tetz;
  const { collection, getDocs, query, where } = firestore;

  renderLoading(container);

  try {
    const [studentsSnap, meetingsSnap, categories] = await Promise.all([
      getDocs(collection(db, "students")),
      getDocs(query(collection(db, "meetings"), where("durum", "==", "kabul"))),
      loadCategories()
    ]);

    const students = studentsSnap.docs.map(doc => doc.data());
    const approvedCount = students.filter(student => student.onaylandi === true).length;
    const meetingCount = meetingsSnap.size;

    const popularId = findMostPopularInterest(students);
    const popularCategory = categories.find(category => category.id === popularId);
    const popularName = popularCategory?.name || popularId || "—";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = students.filter(student => isToday(student, todayStart)).length;

    renderCards(container, {
      approvedCount,
      meetingCount,
      popularName,
      todayCount
    });
  } catch (error) {
    console.error("İstatistikler yüklenemedi:", error);
    container.innerHTML = `
      <div class="stats-error">İstatistikler yüklenirken bir hata oluştu.</div>
    `;
  }
}
