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
    const nameInput = document.getElementById('name');
    const messageInput = document.getElementById('message');
    const nameCounter = document.getElementById('name-counter');
    const messageCounter = document.getElementById('message-counter');
    const nameErrorEl = document.getElementById('name-error');
    const messageErrorEl = document.getElementById('message-error');
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

    // --- Form-Utilities ---
    const NAME_MAX = 32;
    const MSG_MAX = 280;

    function setCounter(el, current, max) {
        if (el) el.textContent = `${current}/${max}`;
    }

    function setFieldInvalid(input, errEl, msg) {
        if (input) input.setAttribute('aria-invalid', 'true');
        if (errEl) errEl.textContent = msg || '';
    }

    function clearFieldError(input, errEl) {
        if (input) input.removeAttribute('aria-invalid');
        if (errEl) errEl.textContent = '';
    }

    function validateName() {
        const val = nameInput?.value.trim() || '';
        if (!val) { setFieldInvalid(nameInput, nameErrorEl, 'Name ist erforderlich'); return false; }
        if (val.length > NAME_MAX) { setFieldInvalid(nameInput, nameErrorEl, `Max. ${NAME_MAX} Zeichen`); return false; }
        clearFieldError(nameInput, nameErrorEl);
        return true;
    }

    function validateMessage() {
        const val = messageInput?.value.trim() || '';
        if (!val) { setFieldInvalid(messageInput, messageErrorEl, 'Nachricht ist erforderlich'); return false; }
        if (val.length > MSG_MAX) { setFieldInvalid(messageInput, messageErrorEl, `Max. ${MSG_MAX} Zeichen`); return false; }
        clearFieldError(messageInput, messageErrorEl);
        return true;
    }

    function setSubmitting(isLoading) {
        if (!submitBtn) return;
        submitBtn.disabled = !!isLoading;
        if (isLoading) submitBtn.classList.add('is-loading');
        else submitBtn.classList.remove('is-loading');
    }

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
    // Skeletons anzeigen, bis der Snapshot kommt
    function renderSkeletons(count = 3) {
        if (!commentList) return;
        commentList.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const li = document.createElement('li');
            li.className = 'comment-skeleton';
            li.innerHTML = `
                <div class="skeleton-line skeleton-small"></div>
                <div class="skeleton-line skeleton-large"></div>
                <div class="skeleton-line skeleton-medium"></div>
            `;
            commentList.appendChild(li);
        }
    }
    renderSkeletons(3);
    onSnapshot(q, (snapshot) => {
        if (!commentList) return;
        commentList.innerHTML = '';
        if (snapshot.empty) {
            commentList.innerHTML = '<li class="comment comment-empty"><div class="comment-header"><div class="comment-meta">Noch keine Einträge</div></div><div class="comment-message">✨ Sei der Erste und hinterlasse eine Nachricht!</div></li>';
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
                        showToast('Eintrag gelöscht!', 'success');
                    } catch (e) {
                        logError('Löschen', e);
                        showToast('Fehler beim Löschen!', 'error');
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
        loadingIndicator.style.display = 'none';
    });

    // --- Formular-Submit: Kommentar speichern ---
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = nameInput?.value.trim();
        const message = messageInput?.value.trim();
        // Inline-Validierung
        const nameOk = validateName();
        const msgOk = validateMessage();
        if (!nameOk || !msgOk) {
            showToast('Bitte Eingaben korrigieren.', 'error');
            (nameOk ? messageInput : nameInput)?.focus();
            return;
        }
        loadingIndicator.style.display = 'block';
        setSubmitting(true);
        try {
            await addDoc(collection(db, "comments"), {
                name: escapeHTML(name),
                message: escapeHTML(message),
                timestamp: serverTimestamp()
            });
            form.reset();
            showToast('Danke für deinen Eintrag!', 'success');
            setTimeout(() => {
                const first = commentList?.querySelector('.comment');
                if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
            nameInput?.focus();
        } catch (err) {
            logError('Speichern', err);
            showToast('Fehler beim Speichern! Prüfe deine Internetverbindung.', 'error');
        } finally {
            loadingIndicator.style.display = 'none';
            setTimeout(() => { setSubmitting(false); }, 800);
        }
    });

    // Live-Char-Counter & Inline-Validierung während der Eingabe
    nameInput?.addEventListener('input', () => {
        setCounter(nameCounter, (nameInput.value || '').length, NAME_MAX);
        if (nameInput.hasAttribute('aria-invalid')) validateName();
    });
    messageInput?.addEventListener('input', () => {
        setCounter(messageCounter, (messageInput.value || '').length, MSG_MAX);
        if (messageInput.hasAttribute('aria-invalid')) validateMessage();
    });

    // Tastaturkürzel: Cmd/Ctrl + Enter zum Senden
    form?.addEventListener('keydown', (ev) => {
        if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
            ev.preventDefault();
            form.requestSubmit();
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
    function showToast(msg, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'status');
        toast.innerText = msg;
        toastContainer.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    // Initiale Counter setzen
    setCounter(nameCounter, (nameInput?.value || '').length, NAME_MAX);
    setCounter(messageCounter, (messageInput?.value || '').length, MSG_MAX);
});

