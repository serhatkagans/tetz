const { db, firestore } = window.tetz;
const { collection, addDoc, serverTimestamp } = firestore;

async function loadCategories() {
  const res = await fetch("../data/categories.json");
  if (!res.ok) {
    const local = await fetch("data/categories.json").catch(() => null);
    if (local && local.ok) return local.json();
    throw new Error("categories.json yüklenemedi");
  }
  return res.json();
}

function injectStyles() {
  if (document.getElementById("register-form-styles")) return;

  const style = document.createElement("style");
  style.id = "register-form-styles";
  style.textContent = `
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .register-form h2 {
      font-size: 18px;
      margin-bottom: 4px;
    }

    .register-form .register-desc {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 4px;
    }

    .register-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .register-field label {
      font-size: 13px;
      font-weight: 500;
    }

    .register-field .required {
      color: var(--accent);
    }

    .register-error {
      color: #f87171;
      font-size: 13px;
      min-height: 18px;
    }

    .register-categories {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
      max-height: 220px;
      overflow-y: auto;
      padding: 4px;
    }

    .register-category {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      transition: border-color 0.15s;
    }

    .register-category:has(input:checked) {
      border-color: var(--primary);
      background: rgba(79, 140, 255, 0.08);
    }

    .register-category input {
      width: auto;
      flex-shrink: 0;
      accent-color: var(--primary);
    }

    .register-category-icon {
      font-size: 16px;
      line-height: 1;
    }

    .register-checkbox-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .register-checkbox-row input {
      width: auto;
      margin-top: 3px;
      accent-color: var(--primary);
    }

    .register-submit {
      width: 100%;
      padding: 10px 16px;
      font-size: 15px;
      margin-top: 4px;
    }

    .register-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .register-success {
      text-align: center;
      padding: 32px 16px;
    }

    .register-success-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    .register-success h2 {
      font-size: 20px;
      margin-bottom: 8px;
      color: #4ade80;
    }

    .register-success p {
      color: var(--text-muted);
      font-size: 14px;
    }

    @media (max-width: 480px) {
      .register-categories {
        grid-template-columns: 1fr 1fr;
        max-height: 280px;
      }
    }
  `;
  document.head.appendChild(style);
}

function renderCategoryCheckboxes(categories) {
  return categories
    .map(
      cat => `
        <label class="register-category" style="--cat-color: ${cat.color}">
          <input type="checkbox" name="ilgiAlani" value="${cat.id}" />
          <span class="register-category-icon">${cat.icon}</span>
          <span>${cat.name}</span>
        </label>
      `
    )
    .join("");
}

function showSuccess(container) {
  container.innerHTML = `
    <section class="register-success">
      <div class="register-success-icon">✓</div>
      <h2>Kaydınız alındı</h2>
      <p>Başvurunuz incelendikten sonra eşleştirme sürecine dahil edileceksiniz.</p>
    </section>
  `;
}

function showError(el, message) {
  if (el) el.textContent = message;
}

export function renderRegisterForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`register.js: "${containerId}" bulunamadı`);
    return;
  }

  injectStyles();
  container.innerHTML = `<p class="register-desc">Kategoriler yükleniyor…</p>`;

  loadCategories()
    .then(categories => {
      container.innerHTML = `
        <form class="register-form" id="register-form" novalidate>
          <h2>Öğrenci Kaydı</h2>
          <p class="register-desc">İlgi alanlarını seç, seni benzer öğrencilerle eşleştirelim.</p>

          <div class="register-field">
            <label for="register-ad">Ad Soyad <span class="required">*</span></label>
            <input type="text" id="register-ad" name="ad" required autocomplete="name"
              placeholder="Adınız ve soyadınız" />
            <span class="register-error" data-error="ad"></span>
          </div>

          <div class="register-field">
            <label for="register-okul">Okul <span class="required">*</span></label>
            <input type="text" id="register-okul" name="okul" required
              placeholder="Okul adınız" />
            <span class="register-error" data-error="okul"></span>
          </div>

          <div class="register-field">
            <label for="register-sinif">Sınıf <span class="required">*</span></label>
            <select id="register-sinif" name="sinif" required>
              <option value="">Sınıf seçin</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
            <span class="register-error" data-error="sinif"></span>
          </div>

          <div class="register-field">
            <label>İlgi Alanları <span class="required">*</span></label>
            <p class="register-desc">En az bir alan seçin.</p>
            <div class="register-categories">
              ${renderCategoryCheckboxes(categories)}
            </div>
            <span class="register-error" data-error="ilgiAlanlari"></span>
          </div>

          <label class="register-checkbox-row">
            <input type="checkbox" id="register-bulusma" name="bulusmaKabul" required />
            <span>Beni eşleştir — buluşmalara katılmayı kabul ediyorum <span class="required">*</span></span>
          </label>
          <span class="register-error" data-error="bulusmaKabul"></span>

          <button type="submit" class="register-submit">Kayıt Ol</button>
          <span class="register-error" data-error="form"></span>
        </form>
      `;

      const form = container.querySelector("#register-form");
      form.addEventListener("submit", async e => {
        e.preventDefault();

        container.querySelectorAll(".register-error").forEach(el => {
          el.textContent = "";
        });

        const ad = form.ad.value.trim();
        const okul = form.okul.value.trim();
        const sinif = form.sinif.value;
        const ilgiAlanlari = [...form.querySelectorAll('input[name="ilgiAlani"]:checked')].map(
          cb => cb.value
        );
        const bulusmaKabul = form.bulusmaKabul.checked;

        let valid = true;

        if (!ad) {
          showError(container.querySelector('[data-error="ad"]'), "Ad soyad zorunludur.");
          valid = false;
        }
        if (!okul) {
          showError(container.querySelector('[data-error="okul"]'), "Okul zorunludur.");
          valid = false;
        }
        if (!sinif) {
          showError(container.querySelector('[data-error="sinif"]'), "Sınıf seçimi zorunludur.");
          valid = false;
        }
        if (ilgiAlanlari.length === 0) {
          showError(
            container.querySelector('[data-error="ilgiAlanlari"]'),
            "En az bir ilgi alanı seçmelisiniz."
          );
          valid = false;
        }
        if (!bulusmaKabul) {
          showError(
            container.querySelector('[data-error="bulusmaKabul"]'),
            "Eşleştirme için onay vermeniz gerekiyor."
          );
          valid = false;
        }

        if (!valid) return;

        const submitBtn = form.querySelector(".register-submit");
        submitBtn.disabled = true;
        submitBtn.textContent = "Kaydediliyor…";

        try {
          await addDoc(collection(db, "students"), {
            ad,
            okul,
            sinif,
            ilgiAlanlari,
            bulusmaKabul: true,
            onaylandi: false,
            kayitTarihi: serverTimestamp()
          });
          showSuccess(container);
        } catch (err) {
          console.error("Kayıt hatası:", err);
          showError(
            container.querySelector('[data-error="form"]'),
            "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin."
          );
          submitBtn.disabled = false;
          submitBtn.textContent = "Kayıt Ol";
        }
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `
        <section class="register-form">
          <h2>Öğrenci Kaydı</h2>
          <p class="register-error">Kategoriler yüklenemedi. Sayfayı yenileyip tekrar deneyin.</p>
        </section>
      `;
    });
}
