import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ফায়ারবেস কনফিগ (আপনার দেওয়া)
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

// --- ১. লগইন বাটন ক্লিক লজিক ---
const loginBtn = document.getElementById("googleLogin");
if (loginBtn) {
    loginBtn.onclick = async () => {
        console.log("Login বাটন ক্লিক হয়েছে...");
        try {
            await signInWithPopup(auth, provider);
            console.log("লগইন সফল!");
        } catch (error) {
            console.error("Login Error:", error.code);
            if (error.code === "auth/popup-blocked") {
                alert("আপনার ব্রাউজারের Pop-up ব্লক করা। দয়া করে সেটি এলাউ করুন।");
            } else if (error.code === "auth/operation-not-allowed") {
                alert("Firebase-এ Google Login এনাবল করা নেই।");
            } else {
                alert("লগইন সমস্যা: " + error.message);
            }
        }
    };
}

// --- ২. ইউজার অটো-চেক (লগইন করা আছে কি না) ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("ইউজার ইমেইল:", user.email);
        const userRef = doc(db, "users", user.uid);
        
        try {
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
                const p = prompt("প্রথমবারের জন্য একটি ৪-সংখ্যার PIN সেট করুন:");
                if(p) await setDoc(userRef, { pin: p, setup: true });
            }
            showPage("unlock-page");
        } catch (e) {
            console.error("Firestore Rules সমস্যা অথবা ডাটাবেস এরর:", e);
            alert("ডাটাবেস এক্সেস করা যাচ্ছে না। Firestore Rules চেক করুন।");
        }
    } else {
        showPage("login-page");
    }
});

// --- ৩. পিন দিয়ে আনলক লজিক ---
document.getElementById("unlockBtn").onclick = async () => {
    const pinInput = document.getElementById("pinInput").value;
    try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.data().pin === pinInput) {
            showPage("main-app");
            loadData();
        } else {
            alert("ভুল PIN! আবার চেষ্টা করুন।");
        }
    } catch (err) {
        alert("PIN চেক করতে সমস্যা হচ্ছে।");
    }
};

// --- ৪. ডাটা সেভ এবং লোড (Dashboard) ---
window.saveData = async (type) => {
    const amt = document.getElementById("amt").value;
    const note = document.getElementById("note").value;
    
    if(!amt || !note) return alert("সবগুলো ঘর পূরণ করুন");

    try {
        await addDoc(collection(db, "users", auth.currentUser.uid, "transactions"), {
            amt: Number(amt),
            note: note,
            type: type,
            date: serverTimestamp()
        });
        document.getElementById("amt").value = "";
        document.getElementById("note").value = "";
        loadData();
    } catch (e) {
        alert("ডাটা সেভ করতে সমস্যা হয়েছে।");
    }
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

// --- হেল্পার ফাংশন ---
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const target = document.getElementById(id);
    if(target) target.style.display = "block";
}

document.getElementById("logoutBtn").onclick = () => signOut(auth).then(() => location.reload());
