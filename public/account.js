import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZ9RpsmhIb6wMXCmysScNqfGY4K0Y3GvQ",
  authDomain: "s0lace.firebaseapp.com",
  projectId: "s0lace",
  storageBucket: "s0lace.firebasestorage.app",
  messagingSenderId: "987787551956",
  appId: "1:987787551956:web:ffc45e1cc11b0bee34c741",
  measurementId: "G-W79F0ZGEPN",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* DOM ELEMENTS */
const authSection = document.getElementById("auth-section");
const loggedSection = document.getElementById("loggedin-section");
const userEmail = document.getElementById("user-email");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const loginErr = document.getElementById("login-error");
const signupErr = document.getElementById("signup-error");

const saveBtn = document.getElementById("save-settings");
const syncBtn = document.getElementById("sync-settings");
const logoutBtn = document.getElementById("logout-btn");
const syncStatus = document.getElementById("sync-status");

/* SHOW / HIDE SECTIONS BASED ON LOGIN */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.style.display = "none";
    loggedSection.style.display = "block";
    userEmail.textContent = user.email;

    autoSyncSettings(user.uid);
  } else {
    authSection.style.display = "block";
    loggedSection.style.display = "none";
  }
});

/* -------- LOGIN ---------- */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErr.textContent = "";

  try {
    await signInWithEmailAndPassword(
      auth,
      loginForm["login-email"].value,
      loginForm["login-pass"].value
    );
  } catch (err) {
    loginErr.textContent = err.message;
  }
});

/* -------- SIGNUP ---------- */
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupErr.textContent = "";

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      signupForm["signup-email"].value,
      signupForm["signup-pass"].value
    );

    // Create blank profile entry
    await setDoc(doc(db, "users", cred.user.uid), {
      settings: {},
      games: {},
    });
  } catch (err) {
    signupErr.textContent = err.message;
  }
});

/* -------- SYNC + SAVE LOGIC ---------- */

async function autoSyncSettings(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    if (data.settings) {
      Object.entries(data.settings).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
    }
    syncStatus.textContent = "Auto-sync complete.";
  }
}

saveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const allLocal = Object.keys(localStorage).reduce((o, k) => {
    if (k.startsWith("s0lace")) o[k] = localStorage.getItem(k);
    return o;
  }, {});

  await setDoc(doc(db, "users", user.uid), { settings: allLocal }, { merge: true });

  syncStatus.textContent = "Settings saved.";
});

syncBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  await autoSyncSettings(user.uid);
  syncStatus.textContent = "Synced with cloud.";
});

/* LOG OUT */
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});
