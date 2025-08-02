// Firebase v9 modular import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCF4gZ0ipzgg-GiUQXLc7lwpVzsStJbID4",
  authDomain: "arman-s-director-task.firebaseapp.com",
  projectId: "arman-s-director-task",
  storageBucket: "arman-s-director-task.firebasestorage.app",
  messagingSenderId: "255547071517",
  appId: "1:255547071517:web:f6f8a5b86e162e278b7af4",
  measurementId: "G-6E88558N8L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('guestbook-form');
const commentList = document.getElementById('comment-list');

// Ladeindikator
let loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.style.display = 'none';
loadingIndicator.style.textAlign = 'center';
loadingIndicator.style.margin = '8px 0 8px 0';
loadingIndicator.innerHTML = '<span class="spinner" style="display:inline-block;width:22px;height:22px;border:3px solid #8E52F5;border-top:3px solid #FD01A6;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;"></span> <span style="font-size:1rem;color:#8E52F5;vertical-align:middle;">Wird gespeichert...</span>';
form.parentNode.insertBefore(loadingIndicator, form.nextSibling);

// Spinner Animation
const style = document.createElement('style');
style.textContent = `@keyframes spin { 0% { transform: rotate(0deg);} 100% {transform: rotate(360deg);} }`;
document.head.appendChild(style);

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[tag]));
}

// Load comments and listen for changes
const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    commentList.innerHTML = '';
    snapshot.forEach(docSnap => {
        const comment = docSnap.data();
        const li = document.createElement('li');
        li.className = 'comment';
        li.innerHTML = `
            <div class="comment-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div class="comment-meta">${escapeHTML(comment.name)} | ${comment.timestamp?.toDate().toLocaleString() || ''}</div>
                <button class="delete-btn" title="Eintrag löschen">🗑️</button>
            </div>
            <div class="comment-message">${escapeHTML(comment.message)}</div>
        `;
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async () => {
            if(confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
                loadingIndicator.style.display = 'block';
                try {
                    await deleteDoc(doc(db, "comments", docSnap.id));
                    showToast('Eintrag gelöscht!');
                } catch (e) {
                    showToast('Fehler beim Löschen!');
                } finally {
                    loadingIndicator.style.display = 'none';
                }
            }
        });
        commentList.appendChild(li);
    });
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();
    if (!name || !message) return;
    loadingIndicator.style.display = 'block';
    try {
        await addDoc(collection(db, "comments"), {
            name,
            message,
            timestamp: serverTimestamp()
        });
        form.reset();
        showToast('Danke für deinen Eintrag!');
        setTimeout(() => {
            const first = commentList.querySelector('.comment');
            if(first) first.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 300);
    } catch (err) {
        showToast('Fehler beim Speichern!');
    } finally {
        loadingIndicator.style.display = 'none';
    }
});

// Toast-Message
function showToast(msg) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Scroll-to-top Button
const scrollBtn = document.getElementById('scrollToTopBtn');
window.addEventListener('scroll', () => {
    if(window.scrollY > 300) {
        scrollBtn.style.display = 'block';
    } else {
        scrollBtn.style.display = 'none';
    }
});
scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCF4gZ0ipzgg-GiUQXLc7lwpVzsStJbID4",
  authDomain: "arman-s-director-task.firebaseapp.com",
  projectId: "arman-s-director-task",
  storageBucket: "arman-s-director-task.firebasestorage.app",
  messagingSenderId: "255547071517",
  appId: "1:255547071517:web:f6f8a5b86e162e278b7af4",
  measurementId: "G-6E88558N8L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('guestbook-form');
const commentList = document.getElementById('comment-list');

// Ladeindikator
let loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.style.display = 'none';
loadingIndicator.style.textAlign = 'center';
loadingIndicator.style.margin = '8px 0 8px 0';
loadingIndicator.innerHTML = '<span class="spinner" style="display:inline-block;width:22px;height:22px;border:3px solid #8E52F5;border-top:3px solid #FD01A6;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;"></span> <span style="font-size:1rem;color:#8E52F5;vertical-align:middle;">Wird gespeichert...</span>';
form.parentNode.insertBefore(loadingIndicator, form.nextSibling);

// Spinner Animation
const style = document.createElement('style');
style.textContent = `@keyframes spin { 0% { transform: rotate(0deg);} 100% {transform: rotate(360deg);} }`;
document.head.appendChild(style);

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[tag]));
}

// Load comments and listen for changes
const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    commentList.innerHTML = '';
    snapshot.forEach(docSnap => {
        const comment = docSnap.data();
        const li = document.createElement('li');
        li.className = 'comment';
        li.innerHTML = `
            <div class="comment-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div class="comment-meta">${escapeHTML(comment.name)} | ${comment.timestamp?.toDate().toLocaleString() || ''}</div>
                <button class="delete-btn" title="Eintrag löschen">🗑️</button>
            </div>
            <div class="comment-message">${escapeHTML(comment.message)}</div>
        `;
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async () => {
            if(confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
                loadingIndicator.style.display = 'block';
                try {
                    await deleteDoc(doc(db, "comments", docSnap.id));
                    showToast('Eintrag gelöscht!');
                } catch (e) {
                    showToast('Fehler beim Löschen!');
                } finally {
                    loadingIndicator.style.display = 'none';
                }
            }
        });
        commentList.appendChild(li);
    });
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();
    if (!name || !message) return;
    loadingIndicator.style.display = 'block';
    try {
        await addDoc(collection(db, "comments"), {
            name,
            message,
            timestamp: serverTimestamp()
        });
        form.reset();
        showToast('Danke für deinen Eintrag!');
        setTimeout(() => {
            const first = commentList.querySelector('.comment');
            if(first) first.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 300);
    } catch (err) {
        showToast('Fehler beim Speichern!');
    } finally {
        loadingIndicator.style.display = 'none';
    }
});

// Toast-Message
function showToast(msg) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Scroll-to-top Button
const scrollBtn = document.getElementById('scrollToTopBtn');
window.addEventListener('scroll', () => {
    if(window.scrollY > 300) {
        scrollBtn.style.display = 'block';
    } else {
        scrollBtn.style.display = 'none';
    }
});
scrollBtn.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
    scrollBtn.blur();
});
