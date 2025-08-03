// guestbook-firebase.js
// Firebase Gästebuch – Modular v9 API, optimiert und kommentiert

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/**
 * Initialisiert das Gästebuch nach DOM-Load
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Utility: Logging ---
    function logError(context, err) {
        console.error(`[Gästebuch][${context}]`, err);
    }
    // --- Firebase Konfiguration ---
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

    // --- DOM-Elemente ---
    const form = document.getElementById('guestbook-form');
    const commentList = document.getElementById('comment-list');
    const submitBtn = form?.querySelector('.guestbook-btn');
    // ARIA für Barrierefreiheit
    if (form) form.setAttribute('aria-label', 'Gästebuch-Formular');
    if (commentList) commentList.setAttribute('aria-live', 'polite');

    // Ladeindikator einfügen
    let loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.setAttribute('aria-live', 'assertive');
    loadingIndicator.innerHTML = '<span class="spinner"></span> <span class="loading-text">Lade...</span>';
    form?.parentNode?.insertBefore(loadingIndicator, form.nextSibling);
    loadingIndicator.style.display = 'none';

    /**
     * Wandelt potentiell unsicheren Text in HTML-sichere Zeichen um
     * @param {string} str
     * @returns {string}
     */
    function escapeHTML(str) {
        return str.replace(/[&<>"'`=\/]/g, tag => ({
            '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;', '`':'&#96;', '=':'&#61;', '/':'&#47;'
        }[tag]));
    }

    // --- Kommentare laden und live updaten ---
    const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
    loadingIndicator.style.display = 'block';
    onSnapshot(q, (snapshot) => {
        if (!commentList) return;
        commentList.innerHTML = '';
        if (snapshot.empty) {
            commentList.innerHTML = '<li class="comment comment-empty">Noch keine Einträge vorhanden.</li>';
        }
        snapshot.forEach(docSnap => {
            const comment = docSnap.data();
            const li = document.createElement('li');
            li.className = 'comment';
            li.innerHTML = `
                <div class="comment-header">
                    <div class="comment-meta">${escapeHTML(comment.name)} | ${comment.timestamp?.toDate().toLocaleString() || ''}</div>
                    <button class="delete-btn" title="Eintrag löschen" aria-label="Eintrag löschen">🗑️</button>
                </div>
                <div class="comment-message">${escapeHTML(comment.message)}</div>
            `;
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn?.addEventListener('click', async () => {
                if (confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
                    loadingIndicator.style.display = 'block';
                    try {
                        await deleteDoc(doc(db, "comments", docSnap.id));
                        showToast('Eintrag gelöscht!');
                    } catch (e) {
                        logError('Löschen', e);
                        showToast('Fehler beim Löschen!');
                    } finally {
                        loadingIndicator.style.display = 'none';
                    }
                }
            });
            commentList.appendChild(li);
        });
        loadingIndicator.style.display = 'none';
    }, err => {
        logError('Snapshot', err);
        showToast('Fehler beim Laden der Kommentare!');
        loadingIndicator.style.display = 'none';
    });

    // --- Formular-Submit: Kommentar speichern ---
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const nameInput = document.getElementById('name');
        const messageInput = document.getElementById('message');
        const name = nameInput?.value.trim();
        const message = messageInput?.value.trim();
        // Input-Validierung
        if (!name || !message) {
            showToast('Bitte Name und Nachricht ausfüllen!');
            return;
        }
        if (name.length > 32 || message.length > 500) {
            showToast('Name oder Nachricht zu lang!');
            return;
        }
        loadingIndicator.style.display = 'block';
        submitBtn.disabled = true;
        try {
            await addDoc(collection(db, "comments"), {
                name: escapeHTML(name),
                message: escapeHTML(message),
                timestamp: serverTimestamp()
            });
            form.reset();
            showToast('Danke für deinen Eintrag!');
            setTimeout(() => {
                const first = commentList?.querySelector('.comment');
                if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
            nameInput?.focus();
        } catch (err) {
            logError('Speichern', err);
            showToast('Fehler beim Speichern! Prüfe deine Internetverbindung.');
        } finally {
            loadingIndicator.style.display = 'none';
            setTimeout(() => { submitBtn.disabled = false; }, 800);
        }
    });

    // --- Scroll-to-top Button ---
    const scrollBtn = document.getElementById('scrollToTopBtn');
    window.addEventListener('scroll', () => {
        if (scrollBtn) scrollBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
    scrollBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        scrollBtn.blur();
    });

    /**
     * Zeigt eine Toast-Nachricht an
     * @param {string} msg
     */
    function showToast(msg) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        toastContainer.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    }
});

