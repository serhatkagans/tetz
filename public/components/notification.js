const { db, firestore } = window.tetz;
const {
  collection, doc, getDoc, addDoc,
  query, where, onSnapshot, serverTimestamp
} = firestore;

const STYLE_ID = "tetz-notification-styles";
let meetingsUnsub = null;
let messagesUnsub = null;
let currentOgrenciId = null;
let cachedMesajlar = [];

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .notif-wrap { position: relative; display: inline-flex; }
    .notif-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      background: var(--surface-2, #1f232c);
      border: 1px solid var(--border, #2a2f3a);
      border-radius: 50%;
      font-size: 20px;
    }
    .notif-btn:hover { background: var(--border, #2a2f3a); }
    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 999px;
      background: #ef4444;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      line-height: 20px;
      text-align: center;
      box-shadow: 0 0 0 2px var(--surface, #181b22);
    }
    .notif-badge[hidden] { display: none !important; }
    .mesajlasma {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 280px;
      max-height: min(70vh, 520px);
      gap: 12px;
    }
    .mesajlasma-header {
      font-size: 15px;
      font-weight: 600;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border, #2a2f3a);
    }
    .mesaj-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 4px 2px;
      -webkit-overflow-scrolling: touch;
    }
    .mesaj-list-empty {
      color: var(--text-muted, #9aa1ad);
      font-size: 14px;
      text-align: center;
      margin: auto;
      padding: 24px 12px;
    }
    .mesaj-bubble {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.45;
      word-break: break-word;
    }
    .mesaj-bubble--ben {
      align-self: flex-end;
      background: var(--primary, #4f8cff);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .mesaj-bubble--karsi {
      align-self: flex-start;
      background: var(--surface-2, #1f232c);
      border: 1px solid var(--border, #2a2f3a);
      border-bottom-left-radius: 4px;
    }
    .mesaj-meta {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      opacity: 0.75;
    }
    .mesaj-form {
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border, #2a2f3a);
    }
    .mesaj-form input {
      flex: 1;
      min-width: 0;
    }
    .mesaj-form button {
      flex-shrink: 0;
      white-space: nowrap;
    }
    .mesaj-hata {
      color: #f87171;
      font-size: 14px;
      padding: 12px;
      text-align: center;
    }
    @media (max-width: 480px) {
      .mesaj-bubble { max-width: 90%; }
      .mesaj-form { flex-direction: column; }
      .mesaj-form button { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

function formatTarih(tarih) {
  if (!tarih) return "";
  const date = tarih.toDate ? tarih.toDate() : new Date(tarih);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeText(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Bekleyen toplantı taleplerini dinler ve rozet gösterir.
 * @param {string} containerId
 * @param {string} ogrenciId
 * @returns {() => void} Aboneliği iptal eden fonksiyon
 */
export function initNotifications(containerId, ogrenciId) {
  injectStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`initNotifications: "${containerId}" bulunamadı`);
    return () => {};
  }

  container.innerHTML = `
    <div class="notif-wrap">
      <button type="button" class="notif-btn" aria-label="Bildirimler">
        🔔
        <span class="notif-badge" hidden aria-live="polite">0</span>
      </button>
    </div>
  `;

  const badge = container.querySelector(".notif-badge");

  if (meetingsUnsub) {
    meetingsUnsub();
    meetingsUnsub = null;
  }

  const q = query(
    collection(db, "meetings"),
    where("alici", "==", ogrenciId),
    where("durum", "==", "bekliyor")
  );

  meetingsUnsub = onSnapshot(
    q,
    snap => {
      const count = snap.size;
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
    },
    err => {
      console.error("Bildirim dinleme hatası:", err);
      badge.hidden = true;
    }
  );

  return () => {
    if (meetingsUnsub) {
      meetingsUnsub();
      meetingsUnsub = null;
    }
  };
}

/**
 * Mesaj balonlarını render eder (kendi mesajlar sağda, karşı taraf solda).
 * @param {string} containerId
 * @param {string} meetingId
 */
export function renderMesajlar(containerId, meetingId) {
  injectStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderMesajlar: "${containerId}" bulunamadı`);
    return;
  }

  if (!cachedMesajlar.length) {
    container.innerHTML = `<p class="mesaj-list-empty">Henüz mesaj yok. İlk mesajı sen gönder!</p>`;
    return;
  }

  const sorted = [...cachedMesajlar].sort((a, b) => {
    const ta = a.tarih?.toMillis?.() ?? a.tarih?.seconds * 1000 ?? 0;
    const tb = b.tarih?.toMillis?.() ?? b.tarih?.seconds * 1000 ?? 0;
    return ta - tb;
  });

  container.innerHTML = sorted.map(m => {
    const benim = m.gonderen === currentOgrenciId;
    const sinif = benim ? "mesaj-bubble--ben" : "mesaj-bubble--karsi";
    return `
      <div class="mesaj-bubble ${sinif}" data-meeting="${escapeText(meetingId)}">
        ${escapeText(m.metin)}
        <span class="mesaj-meta">${formatTarih(m.tarih)}</span>
      </div>
    `;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

/**
 * Kabul edilmiş bir toplantı için mesajlaşma arayüzünü açar.
 * @param {string} containerId
 * @param {string} meetingId
 * @param {string} ogrenciId
 */
export async function renderMesajlasma(containerId, meetingId, ogrenciId) {
  injectStyles();
  currentOgrenciId = ogrenciId;
  cachedMesajlar = [];

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`renderMesajlasma: "${containerId}" bulunamadı`);
    return;
  }

  if (messagesUnsub) {
    messagesUnsub();
    messagesUnsub = null;
  }

  const meetingRef = doc(db, "meetings", meetingId);
  const meetingSnap = await getDoc(meetingRef);

  if (!meetingSnap.exists()) {
    container.innerHTML = `<p class="mesaj-hata">Toplantı bulunamadı.</p>`;
    return;
  }

  const meeting = meetingSnap.data();
  if (meeting.durum !== "kabul") {
    container.innerHTML = `<p class="mesaj-hata">Mesajlaşma yalnızca kabul edilmiş toplantılar için açılabilir.</p>`;
    return;
  }

  const listId = `${containerId}-mesaj-list`;

  container.innerHTML = `
    <div class="mesajlasma">
      <div class="mesajlasma-header">Mesajlaşma</div>
      <div id="${listId}" class="mesaj-list" role="log" aria-live="polite"></div>
      <form class="mesaj-form" id="${containerId}-mesaj-form">
        <input
          type="text"
          name="metin"
          placeholder="Mesajınızı yazın..."
          autocomplete="off"
          maxlength="1000"
          required
        />
        <button type="submit">Gönder</button>
      </form>
    </div>
  `;

  const form = container.querySelector(`#${containerId}-mesaj-form`);
  const input = form.querySelector('input[name="metin"]');
  const mesajlarRef = collection(db, "messages", meetingId, "mesajlar");

  messagesUnsub = onSnapshot(
    mesajlarRef,
    snap => {
      cachedMesajlar = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderMesajlar(listId, meetingId);
    },
    err => {
      console.error("Mesaj dinleme hatası:", err);
      const listEl = document.getElementById(listId);
      if (listEl) {
        listEl.innerHTML = `<p class="mesaj-hata">Mesajlar yüklenemedi.</p>`;
      }
    }
  );

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const metin = input.value.trim();
    if (!metin) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      await addDoc(mesajlarRef, {
        gonderen: ogrenciId,
        metin,
        tarih: serverTimestamp()
      });
      input.value = "";
      input.focus();
    } catch (err) {
      console.error("Mesaj gönderme hatası:", err);
      alert("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}
