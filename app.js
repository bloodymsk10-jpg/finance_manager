import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// আপনার কনফিগ
const firebaseConfig = {
  apiKey: "AIzaSyDOJs4b_RHaMoa3jThKClD9iX_D2MXcRJ0",
  authDomain: "my-finance-app-10a12.firebaseapp.com",
  projectId: "my-finance-app-10a12",
  storageBucket: "my-finance-app-10a12.firebasestorage.app",
  messagingSenderId: "498227535942",
  appId: "1:498227535942:web:9fc66a6973acbe0dd4aa47",
  measurementId: "G-BCKF9HH4P4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ১. লগইন বাটন ক্লিক চেক
const loginBtn = document.getElementById("googleLogin");
if (loginBtn) {
    loginBtn.onclick = async () => {
        console.log("Login button clicked...");
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Login error:", err);
            alert("Login failed! Check console for details.");
        }
    };
}

// ২. অটো-লগইন চেক
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User detected:", user.email);
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
            const p = prompt("Set a 4-digit PIN for security:");
            if(p) await setDoc(userRef, { pin: p, setup: true });
        }
        showPage("unlock-page");
    } else {
        showPage("login-page");
    }
});

// ৩. আনলক ফাংশন
document.getElementById("unlockBtn").onclick = async () => {
    const pin = document.getElementById("pinInput").value;
    const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (snap.data().pin === pin) {
        showPage("main-app");
        loadData();
    } else { alert("Wrong PIN!"); }
};

// --- হেল্পার ফাংশনস ---
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const target = document.getElementById(id);
    if(target) target.style.display = "block";
}

// ডাটা লোড ও সেভ আগের মতোই থাকবে...
window.saveData = async (type) => {
    const amt = document.getElementById("amt").value;
    const note = document.getElementById("note").value;
    if(!amt || !note) return alert("Fill all fields");
    await addDoc(collection(db, "users", auth.currentUser.uid, "transactions"), {
        amt: Number(amt), note: note, type: type, date: serverTimestamp()
    });
    loadData();
};

async function loadData() {
    const q = query(collection(db, "users", auth.currentUser.uid, "transactions"), orderBy("date", "desc"));
    const snap = await getDocs(q);
    let inc = 0, exp = 0;
    const list = document.getElementById("historyList");
    list.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        if(data.type === "income") inc += data.amt; else exp += data.amt;
        list.innerHTML += `<li>${data.note}: ৳${data.amt} (${data.type})</li>`;
    });
    document.getElementById("incTotal").innerText = inc;
    document.getElementById("expTotal").innerText = exp;
    document.getElementById("balanceText").innerText = inc - exp;
}

document.getElementById("logoutBtn").onclick = () => signOut(auth).then(() => location.reload());
