/* ============================================================
   BOOMINUM ⚡ - SCRIPT.JS (HOTFIX ESTÁVEL)
   - Firebase NÃO quebra o JS
   - Botão Gerar Roteiro FUNCIONA
   - Backend Render OK
============================================================ */

console.log("SCRIPT OK");

/* -------------------------
   Firebase SDK
------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* -------------------------
   Firebase Config
------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCiUU_rKTl0R59DOePgzIFymyCiT8-do-M",
  authDomain: "kinoia-de763.firebaseapp.com",
  projectId: "kinoia-de763",
  storageBucket: "kinoia-de763.firebasestorage.app",
  messagingSenderId: "215235666094",
  appId: "1:215235666094:web:357a492602f4897a36cd3f",
  measurementId: "G-7L92XP41L1"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

/* -------------------------
   HELPERS
------------------------- */
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

/* ============================================================
   🔥 STUB FUNCTIONS (EVITAM QUEBRA DO JS)
============================================================ */
function firebaseSignInWithGoogle() {
  alert("Login com Google será ativado em breve.");
}

function firebaseSignInWithEmail() {
  alert("Login por email será ativado em breve.");
}

function firebaseSignupWithEmail() {
  alert("Cadastro será ativado em breve.");
}

function firebaseLogout() {
  signOut(auth);
}

/* ============================================================
   PREFERÊNCIAS
============================================================ */
const PREF_KEY = "boominum_prefs_v1";

function getDefaultPrefs() {
  return {
    dark: false,
    fontsize: "normal",
    defaultModel: "llama-3.2-70b-text"
  };
}

function loadPreferences() {
  let prefs;
  try {
    prefs = JSON.parse(localStorage.getItem(PREF_KEY));
  } catch {
    prefs = null;
  }
  if (!prefs) prefs = getDefaultPrefs();

  qs("#setting-darkmode").checked = prefs.dark;
  qs("#setting-fontsize").value = prefs.fontsize;
  qs("#setting-default-model").value = prefs.defaultModel;

  applyPreferences(prefs);
}

function savePreferences() {
  const prefs = {
    dark: qs("#setting-darkmode").checked,
    fontsize: qs("#setting-fontsize").value,
    defaultModel: qs("#setting-default-model").value
  };
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  applyPreferences(prefs);
  closeModal("configModal");
}

function applyPreferences(p) {
  document.body.classList.toggle("dark", p.dark);
  document.body.classList.remove("font-small", "font-large");

  if (p.fontsize === "small") document.body.classList.add("font-small");
  if (p.fontsize === "large") document.body.classList.add("font-large");

  qs("#model-select").value = p.defaultModel;
}

/* ============================================================
   MODAIS
============================================================ */
function openModal(id) {
  const modal = qs(`#${id}`);
  if (!modal) return;
  qsa(".modal.active").forEach(m => m.id !== id && closeModal(m.id));
  modal.classList.add("active");
}

function closeModal(id) {
  const modal = qs(`#${id}`);
  if (!modal) return;
  modal.classList.remove("active");
}

/* ============================================================
   DOM READY
============================================================ */
document.addEventListener("DOMContentLoaded", () => {

  qs("#hamburgerBtn")?.addEventListener("click", () =>
    qs("#navMenu").classList.toggle("active")
  );

  qs("#link-config")?.addEventListener("click", e => {
    e.preventDefault();
    openModal("configModal");
  });

  qs("#closeConfig")?.addEventListener("click", () => closeModal("configModal"));
  qs("#saveSettings")?.addEventListener("click", savePreferences);

  qs("#link-account")?.addEventListener("click", e => {
    e.preventDefault();
    openModal("accountModal");
    activateTab("profile");
  });

  qs("#closeAccount")?.addEventListener("click", () => closeModal("accountModal"));

  qsa(".account-tabs .tab").forEach(btn =>
    btn.addEventListener("click", () => activateTab(btn.dataset.tab))
  );

  qs("#btn-google-login")?.addEventListener("click", firebaseSignInWithGoogle);
  qs("#btn-email-login")?.addEventListener("click", firebaseSignInWithEmail);
  qs("#btn-email-signup")?.addEventListener("click", firebaseSignupWithEmail);
  qs("#btn-firebase-logout")?.addEventListener("click", firebaseLogout);

  qs("#btn-create")?.addEventListener("click", generateScript);

  loadPreferences();
  initFirebaseObserver();
});

/* ============================================================
   TABS
============================================================ */
function activateTab(tab) {
  qsa(".tab-content").forEach(c => c.classList.add("hidden"));
  qsa(".account-tabs .tab").forEach(t => t.classList.remove("active"));

  qs(`#content-${tab}`)?.classList.remove("hidden");
  qs(`.account-tabs .tab[data-tab="${tab}"]`)?.classList.add("active");
}

/* ============================================================
   FIREBASE OBSERVER
============================================================ */
function initFirebaseObserver() {
  onAuthStateChanged(auth, user => {
    if (!qs("#account-name")) return;
    qs("#account-name").textContent = user ? (user.displayName || user.email) : "Convidado";
  });
}

/* ============================================================
   🚀 GERAÇÃO DE ROTEIRO (FUNCIONANDO)
============================================================ */
async function generateScript() {
  const prompt = qs("#prompt-input").value.trim();
  if (!prompt) return alert("Digite sua ideia!");

  const out = qs("#output");
  out.textContent = "Gerando roteiro...";

  const model = qs("#model-select").value;

  try {
    const response = await fetch("https://tiktok-ia.onrender.com/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model })
    });

    const data = await response.json();

    if (!response.ok) {
      out.textContent = data.error || "Erro ao gerar roteiro.";
      return;
    }

    out.textContent = data.result;

  } catch (err) {
    out.textContent = "Erro de conexão com o servidor.";
  }
}
