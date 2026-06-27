/**
 * TETZ2026 Student Matching System - Component 3
 * Handles student matching based on interest similarity.
 */

/**
 * Calculates matching score between two students using Jaccard Similarity.
 * Formula: (Number of Common Interests / Total Unique Interests) * 100
 * @param {object} ogrenci1
 * @param {object} ogrenci2
 * @returns {number} Score from 0 to 100 (rounded to nearest integer)
 */
export function hesaplaPuan(ogrenci1, ogrenci2) {
  if (!ogrenci1 || !ogrenci2) return 0;
  
  const ilgi1 = ogrenci1.ilgiAlanlari || [];
  const ilgi2 = ogrenci2.ilgiAlanlari || [];
  
  if (ilgi1.length === 0 && ilgi2.length === 0) return 0;
  
  const set1 = new Set(ilgi1);
  const set2 = new Set(ilgi2);
  
  let ortakSayisi = 0;
  for (const item of set1) {
    if (set2.has(item)) {
      ortakSayisi++;
    }
  }
  
  const birlesimSayisi = set1.size + set2.size - ortakSayisi;
  if (birlesimSayisi === 0) return 0;
  
  const puan = (ortakSayisi / birlesimSayisi) * 100;
  return Math.round(puan);
}

/**
 * Retrieves the best 3 matches for a given student.
 * Compares target student with approved and meeting-accepting students.
 * @param {string} ogrenciId
 * @returns {Promise<Array>} List of best matches: { ogrenciId, ogrenci, puan, ortakAlanlar }
 */
export async function enIyiEslesmeler(ogrenciId) {
  const { db, firestore } = window.tetz;
  if (!db || !firestore) {
    throw new Error("window.tetz.db veya firestore başlatılmadı.");
  }
  const { doc, getDoc, collection, getDocs, query, where } = firestore;
  
  // 1. Fetch the target student
  const targetRef = doc(db, "students", ogrenciId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) {
    throw new Error("Öğrenci bulunamadı: " + ogrenciId);
  }
  
  const targetOgrenci = { id: targetSnap.id, ...targetSnap.data() };
  const targetInterests = targetOgrenci.ilgiAlanlari || [];
  
  // 2. Fetch candidates where onaylandi == true and bulusmaKabul == true
  const q = query(
    collection(db, "students"),
    where("onaylandi", "==", true),
    where("bulusmaKabul", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  const matches = [];
  
  querySnapshot.forEach(docSnap => {
    // Do not match a student with themselves
    if (docSnap.id !== ogrenciId) {
      const otherOgrenci = { id: docSnap.id, ...docSnap.data() };
      const otherInterests = otherOgrenci.ilgiAlanlari || [];
      
      // Compute matching score
      const score = hesaplaPuan(targetOgrenci, otherOgrenci);
      
      // Determine common interests
      const set2 = new Set(otherInterests);
      const ortakAlanlar = targetInterests.filter(interest => set2.has(interest));
      
      matches.push({
        ogrenciId: otherOgrenci.id,
        ogrenci: otherOgrenci,
        puan: score,
        ortakAlanlar: ortakAlanlar
      });
    }
  });
  
  // 3. Sort by score descending and return top 3
  matches.sort((a, b) => b.puan - a.puan);
  return matches.slice(0, 3);
}

/**
 * Saves recommendations for a given student into the matches collection.
 * Clears old recommendations first to prevent duplicates.
 * @param {string} ogrenciId
 */
export async function eslesmeleriKaydet(ogrenciId) {
  const { db, firestore } = window.tetz;
  if (!db || !firestore) {
    throw new Error("window.tetz.db veya firestore başlatılmadı.");
  }
  const { collection, addDoc, getDocs, query, where, doc, deleteDoc, serverTimestamp } = firestore;
  
  // 1. Get best matches
  const topMatches = await enIyiEslesmeler(ogrenciId);
  
  // 2. Query and delete existing recommendations for this student (durum == 'oneri')
  const q = query(
    collection(db, "matches"),
    where("ogrenci1Id", "==", ogrenciId),
    where("durum", "==", "oneri")
  );
  
  const querySnapshot = await getDocs(q);
  const deletePromises = [];
  querySnapshot.forEach(docSnap => {
    deletePromises.push(deleteDoc(doc(db, "matches", docSnap.id)));
  });
  await Promise.all(deletePromises);
  
  // 3. Write new matches to Firestore
  const writePromises = topMatches.map(match => {
    return addDoc(collection(db, "matches"), {
      ogrenci1Id: ogrenciId,
      ogrenci2Id: match.ogrenciId,
      puan: match.puan,
      ortakAlanlar: match.ortakAlanlar,
      durum: "oneri",
      tarih: serverTimestamp()
    });
  });
  
  await Promise.all(writePromises);
}

/**
 * Dynamically renders the top recommended student cards inside a container.
 * @param {string} containerId
 * @param {string} ogrenciId
 */
export async function renderOneriler(containerId, ogrenciId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Inject CSS styling
  injectStyles();
  
  container.innerHTML = `
    <div class="loading-matches">
      <div class="spinner"></div>
      <p>Sana en uygun öğrenciler eşleştiriliyor...</p>
    </div>
  `;
  
  try {
    const { db, firestore } = window.tetz;
    if (!db || !firestore) {
      throw new Error("window.tetz.db veya firestore başlatılmadı.");
    }
    const { collection, getDocs, query, where, doc, getDoc, updateDoc, serverTimestamp } = firestore;
    
    // 1. Retrieve matches from Firestore
    const q = query(
      collection(db, "matches"),
      where("ogrenci1Id", "==", ogrenciId),
      where("durum", "==", "oneri")
    );
    
    let querySnapshot = await getDocs(q);
    
    // Generate new recommendations if none exist
    if (querySnapshot.empty) {
      await eslesmeleriKaydet(ogrenciId);
      querySnapshot = await getDocs(q);
    }
    
    const matches = [];
    querySnapshot.forEach(docSnap => {
      matches.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // Sort descending by score
    matches.sort((a, b) => b.puan - a.puan);
    const topMatches = matches.slice(0, 3);
    
    if (topMatches.length === 0) {
      container.innerHTML = `
        <div class="no-matches">
          <p>Eşleşme bulunamadı. Lütfen onaylanmış ve buluşma kabul eden diğer öğrencilerin kaydolmasını bekleyin.</p>
        </div>
      `;
      return;
    }
    
    // 2. Fetch profiles for each student in the recommendations
    const matchProfiles = await Promise.all(
      topMatches.map(async (m) => {
        const studentRef = doc(db, "students", m.ogrenci2Id);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          return {
            matchId: m.id,
            puan: m.puan,
            ortakAlanlar: m.ortakAlanlar,
            student: { id: studentSnap.id, ...studentSnap.data() }
          };
        }
        return null;
      })
    );
    
    const validMatches = matchProfiles.filter(item => item !== null);
    if (validMatches.length === 0) {
      container.innerHTML = `
        <div class="no-matches">
          <p>Eşleşen öğrencilerin profillerine erişilemedi.</p>
        </div>
      `;
      return;
    }
    
    // 3. Fetch categories from JSON to render correct icons/colors for tags
    let categories = [];
    try {
      const res = await fetch("../data/categories.json");
      if (res.ok) {
        categories = await res.json();
      } else {
        const local = await fetch("data/categories.json");
        if (local.ok) categories = await local.json();
      }
    } catch (e) {
      console.error("Kategoriler yüklenemedi:", e);
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    // 4. Render the UI
    let html = `
      <div class="matching-container-inner">
        <h3 class="matching-title">🎯 Sana Özel Önerilen Eşleşmeler</h3>
        <p class="matching-subtitle">Ortak ilgi alanlarınıza göre en yüksek uyum gösteren 3 kişi listelenmiştir.</p>
        <div class="matching-cards-container">
    `;
    
    validMatches.forEach(item => {
      const s = item.student;
      const matchId = item.matchId;
      const initials = s.ad ? s.ad.split(" ").map(w => w.charAt(0)).join("").toUpperCase().slice(0, 2) : "?";
      
      const tagsHtml = item.ortakAlanlar.map(catId => {
        const cat = categoryMap.get(catId);
        const name = cat ? cat.name : catId;
        const icon = cat ? cat.icon : "🏷️";
        const color = cat ? cat.color : "#4F8CFF";
        return `
          <span class="interest-tag" style="background: ${color}15; color: ${color}; border: 1px solid ${color}30;">
            <span class="tag-icon">${icon}</span> ${name}
          </span>
        `;
      }).join("");
      
      html += `
        <div class="matching-card" id="match-card-${matchId}">
          <div class="matching-card-header">
            <div class="matching-avatar-wrapper">
              <div class="matching-card-avatar">${initials}</div>
            </div>
            <div class="matching-card-info">
              <h4 class="student-name">${s.ad || "İsimsiz Öğrenci"}</h4>
              <p class="student-school">🏫 ${s.okul || "Belirtilmemiş Okul"}</p>
            </div>
            <div class="matching-card-score">
              <div class="score-circle">
                <span class="score-percent">%${item.puan}</span>
              </div>
            </div>
          </div>
          
          <div class="matching-card-body">
            <div class="common-interests-title">Ortak İlgi Alanları</div>
            <div class="interest-tags-container">
              ${tagsHtml || '<span class="no-common-tags">Ortak ilgi alanı bulunmuyor.</span>'}
            </div>
          </div>
          
          <div class="matching-card-footer">
            <button class="tanis-btn" data-match-id="${matchId}" data-student-name="${s.ad || "Öğrenci"}">
              🤝 Tanış
            </button>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // 5. Add event listeners for meeting invitations
    const buttons = container.querySelectorAll(".tanis-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const mId = e.target.getAttribute("data-match-id");
        const name = e.target.getAttribute("data-student-name");
        e.target.disabled = true;
        e.target.innerHTML = "⌛ Talep İletiliyor...";
        
        try {
          const matchDocRef = doc(db, "matches", mId);
          await updateDoc(matchDocRef, {
            durum: "tanis",
            guncellemeTarihi: serverTimestamp()
          });
          
          e.target.innerHTML = "✅ Tanışma Talebi İletildi";
          e.target.className = "tanis-btn sent";
          
          showNotification(`${name} ile tanışma talebiniz başarıyla iletildi!`);
        } catch (err) {
          console.error("Tanışma talebi hatası:", err);
          e.target.disabled = false;
          e.target.innerHTML = "🤝 Tanış";
          alert("Talep iletilirken bir hata oluştu: " + err.message);
        }
      });
    });
    
  } catch (err) {
    console.error("Eşleşmeler yüklenemedi:", err);
    container.innerHTML = `
      <div class="error-matches">
        <p>⚠️ Eşleşmeler yüklenirken bir hata oluştu: ${err.message}</p>
      </div>
    `;
  }
}

/**
 * Toast Notification Utility
 */
function showNotification(msg) {
  const toastId = "matching-toast";
  let toast = document.getElementById(toastId);
  if (!toast) {
    toast = document.createElement("div");
    toast.id = toastId;
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.className = "matching-toast show";
  setTimeout(() => {
    toast.className = "matching-toast";
  }, 4000);
}

/**
 * Dynamic Style Injection for Premium Matching UI
 */
function injectStyles() {
  const styleId = "matching-styles";
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .matching-container-inner {
      width: 100%;
      animation: fadeIn 0.4s ease-out;
    }
    
    .matching-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .matching-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    
    .matching-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      width: 100%;
    }
    
    .matching-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .matching-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      opacity: 0.8;
      transition: opacity 0.3s;
    }
    
    .matching-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
      border-color: rgba(79, 140, 255, 0.4);
    }
    
    .matching-card:hover::before {
      opacity: 1;
    }
    
    .matching-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .matching-avatar-wrapper {
      position: relative;
    }
    
    .matching-card-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 4px 8px rgba(79, 140, 255, 0.25);
    }
    
    .matching-card-info {
      flex: 1;
      min-width: 0;
    }
    
    .student-name {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 2px 0;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .student-school {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .matching-card-score {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .score-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(79, 140, 255, 0.08);
      border: 2px solid rgba(79, 140, 255, 0.25);
      position: relative;
    }
    
    .score-percent {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
    }
    
    .matching-card-body {
      flex: 1;
      margin-bottom: 20px;
    }
    
    .common-interests-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    
    .interest-tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .interest-tag {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    
    .interest-tag:hover {
      transform: scale(1.05);
    }
    
    .no-common-tags {
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
    }
    
    .matching-card-footer {
      margin-top: auto;
    }
    
    .tanis-btn {
      width: 100%;
      padding: 10px 16px;
      border-radius: 8px;
      background: var(--primary);
      border: none;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease-out;
    }
    
    .tanis-btn:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }
    
    .tanis-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .tanis-btn:disabled {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-muted);
      cursor: not-allowed;
    }
    
    .tanis-btn.sent {
      background: #22C55E !important;
      color: white !important;
      border: none !important;
      cursor: default;
    }
    
    /* Loading state */
    .loading-matches {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text-muted);
      text-align: center;
    }
    
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(79, 140, 255, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s infinite linear;
      margin-bottom: 12px;
    }
    
    .no-matches, .error-matches {
      padding: 30px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text-muted);
      text-align: center;
      font-size: 13px;
    }
    
    .error-matches {
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    
    /* Toast Notification */
    .matching-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #181b22;
      border: 1px solid #22c55e;
      border-left: 4px solid #22c55e;
      color: #e6e8ee;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      font-size: 13px;
      font-weight: 500;
      z-index: 10000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
    }
    
    .matching-toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
