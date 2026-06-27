// Inject component styles for meetings lists, cards, and glassmorphic toast notifications
const style = document.createElement('style');
style.textContent = `
  .meetings-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin-top: 15px;
  }
  
  .meeting-card {
    background: var(--surface-2, #1f232c);
    border: 1px solid var(--border, #2a2f3a);
    border-radius: var(--radius, 10px);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .meeting-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-color: rgba(79, 140, 255, 0.4);
  }
  
  .meeting-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .meeting-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary, #4f8cff), var(--accent, #ff6b9a));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .meeting-info {
    display: flex;
    flex-direction: column;
  }
  
  .meeting-sender-name {
    font-weight: 600;
    font-size: 15px;
    color: var(--text, #e6e8ee);
  }
  
  .meeting-subtext {
    font-size: 12px;
    color: var(--text-muted, #9aa1ad);
    margin-top: 2px;
  }
  
  .meeting-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }
  
  .btn-meeting {
    flex: 1;
    border: none;
    border-radius: 6px;
    padding: 9px 12px;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-meeting-accept {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #10b981;
  }
  
  .btn-meeting-accept:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.3);
    border-color: #10b981;
  }
  
  .btn-meeting-reject {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
  
  .btn-meeting-reject:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25);
    border-color: #ef4444;
  }
  
  .btn-meeting:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .no-meetings-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 30px;
    text-align: center;
    background: var(--surface-2, #1f232c);
    border: 1px dashed var(--border, #2a2f3a);
    border-radius: var(--radius, 10px);
    margin-top: 15px;
  }
  
  .no-meetings-text {
    color: var(--text-muted, #9aa1ad);
    font-size: 14px;
  }
  
  /* Toast Notification Container */
  #tetz-notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 380px;
    width: calc(100% - 40px);
  }
  
  .tetz-toast {
    padding: 14px 20px;
    border-radius: var(--radius, 8px);
    color: #ffffff;
    font-weight: 500;
    font-size: 14px;
    font-family: var(--font, sans-serif);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform: translateX(120%);
    opacity: 0;
  }
  
  .tetz-toast.show {
    transform: translateX(0);
    opacity: 1;
  }
  
  .tetz-toast-success {
    background: rgba(16, 185, 129, 0.85); /* Emerald Green */
    border-left: 4px solid #10b981;
  }
  
  .tetz-toast-error {
    background: rgba(239, 68, 68, 0.85); /* Rose Red */
    border-left: 4px solid #ef4444;
  }
  
  .tetz-toast-info {
    background: rgba(79, 140, 255, 0.85); /* Primary Blue */
    border-left: 4px solid #4f8cff;
  }
`;
document.head.appendChild(style);

// Helper for displaying toast notifications with high quality visuals
function showNotification(message, type = 'info') {
  let container = document.getElementById('tetz-notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'tetz-notification-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `tetz-toast tetz-toast-${type}`;
  toast.innerText = message;
  
  container.appendChild(toast);
  
  // Force reflow and add class to trigger CSS transition
  toast.offsetHeight; 
  toast.classList.add('show');
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    // Remove from DOM after transition completes
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Student Name cache to minimize Firestore reads
const studentNameCache = {};

async function getStudentName(db, studentId) {
  if (studentNameCache[studentId]) {
    return studentNameCache[studentId];
  }
  
  try {
    const { doc, getDoc } = window.tetz.firestore;
    const docRef = doc(db, "students", studentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      let name = "";
      if (data.ad || data.soyad) {
        name = `${data.ad || ""} ${data.soyad || ""}`.trim();
      } else if (data.name) {
        name = data.name;
      } else if (data.fullName) {
        name = data.fullName;
      } else if (data.isim) {
        name = data.isim;
      } else {
        name = "Bilinmeyen Öğrenci";
      }
      studentNameCache[studentId] = name;
      return name;
    }
  } catch (error) {
    console.error(`Öğrenci adı çekilirken hata oluştu (${studentId}):`, error);
  }
  return "Bilinmeyen Öğrenci";
}

/**
 * 1) initMeetingSystem(gonderenId)
 * Listens for the 'tanisIstegi' event on window and triggers talepGonder.
 */
export function initMeetingSystem(gonderenId) {
  window.addEventListener('tanisIstegi', (event) => {
    const aliciId = event.detail;
    if (aliciId) {
      talepGonder(gonderenId, aliciId);
    } else {
      console.warn("tanisIstegi eventi alındı fakat aliciId (event.detail) boş.");
    }
  });
}

/**
 * 2) talepGonder(gonderenId, aliciId)
 * Sends a meeting request from gonderenId to aliciId if no pending request already exists.
 */
export async function talepGonder(gonderenId, aliciId) {
  try {
    if (!window.tetz) {
      console.error("window.tetz hazır değil.");
      return;
    }
    
    const { db, firestore } = window.tetz;
    const { collection, query, where, getDocs, addDoc, serverTimestamp } = firestore;

    if (gonderenId === aliciId) {
      showNotification("Kendinize buluşma talebi gönderemezsiniz.", "error");
      return;
    }

    const meetingsRef = collection(db, "meetings");

    // Check if there is already an existing pending request between these two (any direction)
    const q1 = query(
      meetingsRef,
      where("gonderenId", "==", gonderenId),
      where("aliciId", "==", aliciId),
      where("durum", "==", "bekliyor")
    );
    
    const q2 = query(
      meetingsRef,
      where("gonderenId", "==", aliciId),
      where("aliciId", "==", gonderenId),
      where("durum", "==", "bekliyor")
    );

    const [snap1, snap2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    if (!snap1.empty || !snap2.empty) {
      showNotification("Zaten bir talebiniz var", "error");
      return;
    }

    // No pending request found, create one
    await addDoc(meetingsRef, {
      gonderenId,
      aliciId,
      durum: "bekliyor",
      tarih: serverTimestamp()
    });

    showNotification("Buluşma talebiniz gönderildi", "success");
  } catch (error) {
    console.error("Buluşma talebi gönderilirken hata oluştu:", error);
    showNotification("Buluşma talebi gönderilemedi.", "error");
  }
}

/**
 * 3) renderGelenTalepler(containerId, aliciId)
 * Listens for pending incoming requests for aliciId and renders them in the container.
 */
export async function renderGelenTalepler(containerId, aliciId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container elemanı bulunamadı: ${containerId}`);
    return;
  }

  try {
    if (!window.tetz) {
      console.error("window.tetz hazır değil.");
      return;
    }

    const { db, firestore } = window.tetz;
    const { collection, query, where, onSnapshot } = firestore;

    // Unsubscribe from previous meeting snapshot listener if any
    if (window.tetz.meetingUnsubscribe) {
      window.tetz.meetingUnsubscribe();
    }

    const q = query(
      collection(db, "meetings"),
      where("aliciId", "==", aliciId),
      where("durum", "==", "bekliyor")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = `
          <div class="no-meetings-container">
            <p class="no-meetings-text">Gelen buluşma talebiniz bulunmuyor.</p>
          </div>
        `;
        return;
      }

      const talepler = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch all sender names
      const namePromises = talepler.map(t => getStudentName(db, t.gonderenId));
      const senderNames = await Promise.all(namePromises);

      // Render the requests list
      container.innerHTML = "";
      
      const listWrapper = document.createElement("div");
      listWrapper.className = "meetings-list";

      talepler.forEach((talep, idx) => {
        const name = senderNames[idx];
        
        const card = document.createElement("div");
        card.className = "meeting-card";
        
        // Header (Avatar + Sender details)
        const header = document.createElement("div");
        header.className = "meeting-card-header";
        
        const avatar = document.createElement("div");
        avatar.className = "meeting-avatar";
        avatar.innerText = name.charAt(0).toUpperCase();
        
        const info = document.createElement("div");
        info.className = "meeting-info";
        
        const senderNameEl = document.createElement("span");
        senderNameEl.className = "meeting-sender-name";
        senderNameEl.innerText = name;
        
        const subtextEl = document.createElement("span");
        subtextEl.className = "meeting-subtext";
        subtextEl.innerText = "Seninle tanışmak istiyor";
        
        info.appendChild(senderNameEl);
        info.appendChild(subtextEl);
        header.appendChild(avatar);
        header.appendChild(info);
        card.appendChild(header);
        
        // Actions (Kabul / Ret buttons)
        const actions = document.createElement("div");
        actions.className = "meeting-actions";
        
        const acceptBtn = document.createElement("button");
        acceptBtn.className = "btn-meeting btn-meeting-accept";
        acceptBtn.innerText = "Kabul Et";
        acceptBtn.onclick = async () => {
          acceptBtn.disabled = true;
          rejectBtn.disabled = true;
          acceptBtn.innerText = "Kabul ediliyor...";
          await talepYanitla(talep.id, "kabul");
        };
        
        const rejectBtn = document.createElement("button");
        rejectBtn.className = "btn-meeting btn-meeting-reject";
        rejectBtn.innerText = "Reddet";
        rejectBtn.onclick = async () => {
          acceptBtn.disabled = true;
          rejectBtn.disabled = true;
          rejectBtn.innerText = "Reddediliyor...";
          await talepYanitla(talep.id, "ret");
        };
        
        actions.appendChild(acceptBtn);
        actions.appendChild(rejectBtn);
        card.appendChild(actions);
        listWrapper.appendChild(card);
      });

      container.appendChild(listWrapper);
    });

    window.tetz.meetingUnsubscribe = unsubscribe;
  } catch (error) {
    console.error("Gelen talepler yüklenirken hata oluştu:", error);
    container.innerHTML = `<div class="no-meetings-container"><p class="no-meetings-text" style="color:#ef4444;">Talepler yüklenemedi.</p></div>`;
  }
}

/**
 * 4) talepYanitla(meetingId, karar)
 * Updates the meeting request document's status to 'kabul' or 'ret'.
 */
export async function talepYanitla(meetingId, karar) {
  try {
    if (!window.tetz) {
      console.error("window.tetz hazır değil.");
      return;
    }

    const { db, firestore } = window.tetz;
    const { doc, updateDoc } = firestore;

    const meetingRef = doc(db, "meetings", meetingId);
    await updateDoc(meetingRef, {
      durum: karar
    });

    if (karar === "kabul") {
      showNotification("Buluşma onaylandı!", "success");
    } else if (karar === "ret") {
      showNotification("Buluşma talebi reddedildi.", "info");
    }
  } catch (error) {
    console.error("Talep yanıtlanırken hata oluştu:", error);
    showNotification("İşlem gerçekleştirilemedi.", "error");
  }
}
