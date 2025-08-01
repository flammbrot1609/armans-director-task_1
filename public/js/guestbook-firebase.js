// Firebase v9 modular import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[tag]));
}

// Load comments and listen for changes
const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    commentList.innerHTML = '';
    snapshot.forEach(doc => {
        const comment = doc.data();
        const li = document.createElement('li');
        li.className = 'comment';
        li.innerHTML = `
            <div class="comment-meta">${escapeHTML(comment.name)} | ${comment.timestamp?.toDate().toLocaleString() || ''}</div>
            <div class="comment-message">${escapeHTML(comment.message)}</div>
        `;
        commentList.appendChild(li);
    });
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();
    if (!name || !message) return;
    await addDoc(collection(db, "comments"), {
        name,
        message,
        timestamp: serverTimestamp()
    });
    form.reset();
});
