// guestbook-firebase.js
// Firebase Gästebuch – Modular v9 API, optimiert und kommentiert

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/**
 * Initialisiert das Gästebuch nach DOM-Load
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Utility: Logging ---
    function logError(context, err) {
        console.error(`[Gästebuch][${context}]`, err);
    }

    function showAuthError(e) {
        const code = e?.code || 'unknown';
        // Freundliche, kontextsensitive Meldungen
        const map = {
            'auth/operation-not-allowed': 'Google-Login ist in Firebase nicht aktiviert.',
            'auth/unauthorized-domain': 'Domain nicht in Firebase Authentication autorisiert.',
            'auth/popup-blocked': 'Popup wurde vom Browser blockiert. Versuche es erneut oder erlaube Popups.',
            'auth/popup-closed-by-user': 'Popup geschlossen. Bitte erneut versuchen.',
            'auth/cancelled-popup-request': 'Popup abgebrochen. Bitte erneut versuchen.'
        };
        const msg = (map[code] || 'Anmeldung fehlgeschlagen.') + ` (${code})`;
        showToast(msg, 'error');
        logError('Auth', e);
    }

    async function signInFlow() {
        try {
            await signInWithPopup(auth, provider);
            showToast('Erfolgreich angemeldet.', 'success');
        } catch (e) {
            if (e?.code === 'auth/popup-blocked') {
                try {
                    await signInWithRedirect(auth, provider);
                    return; // Ergebnis wird nach Redirect verarbeitet
                } catch (e2) {
                    showAuthError(e2);
                }
            } else {
                showAuthError(e);
            }
        }
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
    // Auth initialisieren
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

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
    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    const authMessage = document.getElementById('auth-message');
    const signInInline = document.getElementById('sign-in-inline');
    // User Menu DOM
    const userMenu = document.getElementById('user-menu');
    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userLabel = document.getElementById('user-label');
    const menuList = document.getElementById('user-menu-list');
    const menuSignout = document.getElementById('menu-signout');
    const menuUserName = document.getElementById('menu-user-name');
    const menuUserEmail = document.getElementById('menu-user-email');
    // Privacy DOM
    const privacyBanner = document.getElementById('privacy-banner');
    const privacyDetails = document.getElementById('privacy-details');
    const privacyAccept = document.getElementById('privacy-accept');
    const privacyModal = document.getElementById('privacy-modal');
    const privacyClose = document.getElementById('privacy-close');
    let privacyAccepted = false;
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

    function setFormEnabled(enabled) {
        const controls = [nameInput, messageInput, submitBtn];
        controls.forEach(el => { if (el) el.disabled = !enabled; });
        if (!enabled) {
            if (authMessage) authMessage.hidden = false;
        }
    }

    function updateAuthUI(user) {
        const isLoggedIn = !!user;
        const display = isLoggedIn ? (user.displayName || user.email || 'Angemeldet') : '';
        if (userInfo) {
            if (isLoggedIn) {
                userInfo.textContent = '';
                userInfo.hidden = true;
            } else {
                userInfo.hidden = false;
                userInfo.textContent = '';
            }
        }
        if (authBtn) {
            // Bei Login zeigen wir das User-Menü; der Anmeldebutton wird versteckt
            authBtn.textContent = isLoggedIn ? 'Abmelden' : 'Anmelden';
            authBtn.setAttribute('aria-label', isLoggedIn ? 'Abmelden' : 'Anmelden');
            authBtn.title = isLoggedIn ? 'Abmelden' : 'Anmelden';
            authBtn.hidden = !!isLoggedIn;
        }
        if (userMenu) userMenu.hidden = !isLoggedIn;
        if (userLabel) userLabel.textContent = display || 'User';
        if (menuUserName) menuUserName.textContent = user?.displayName || '–';
        if (menuUserEmail) menuUserEmail.textContent = user?.email || '';
        if (authMessage) authMessage.hidden = isLoggedIn; // Hinweis nur anzeigen, wenn ausgeloggt
        if (signInInline) signInInline.hidden = isLoggedIn;
        setFormEnabled(isLoggedIn);

        // Name-Feld vorbelegen, wenn leer oder zuvor auto-gefüllt
        if (isLoggedIn && user?.displayName && nameInput) {
            const wasAutofilled = nameInput.dataset.autofilled === 'true';
            if (!nameInput.value || wasAutofilled) {
                nameInput.value = user.displayName;
                nameInput.dataset.autofilled = 'true';
                setCounter(nameCounter, (nameInput.value || '').length, NAME_MAX);
                clearFieldError(nameInput, nameErrorEl);
            }
        }
    }

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
            const isOwner = auth?.currentUser && comment?.uid === auth.currentUser.uid;
            const deleteBtnHtml = isOwner ? `<button class="delete-btn" title="Eintrag löschen" aria-label="Eintrag löschen">🗑️</button>` : '';
            li.innerHTML = `
                <div class="comment-header">
                    <div class="comment-meta">${escapeHTML(comment.name)} | ${comment.timestamp?.toDate().toLocaleString() || ''}</div>
                    ${deleteBtnHtml}
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
        if (!auth.currentUser) {
            showToast('Bitte melde dich zuerst an.', 'error');
            return;
        }
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
                timestamp: serverTimestamp(),
                uid: auth.currentUser?.uid || null
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
        // Nutzer hat den Namen aktiv bearbeitet, künftig nicht auto-überschreiben
        if (nameInput.dataset) nameInput.dataset.autofilled = 'false';
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

    // --- Auth Events ---
    authBtn?.addEventListener('click', async () => {
        try {
            if (auth.currentUser) {
                await signOut(auth);
                showToast('Abgemeldet.', 'success');
            } else {
                await signInFlow();
            }
        } catch (e) {
            showAuthError(e);
        }
    });
    signInInline?.addEventListener('click', async () => {
        try {
            await signInFlow();
        } catch (e) {
            showAuthError(e);
        }
    });
    onAuthStateChanged(auth, (user) => {
        updateAuthUI(user);
    });

    // Redirect-Ergebnis verarbeiten (falls Popup blockiert war)
    getRedirectResult(auth).then((result) => {
        if (result?.user) {
            showToast('Erfolgreich angemeldet.', 'success');
        }
    }).catch(showAuthError);

    // Startzustand: bis Auth geklärt ist, deaktiviert
    setFormEnabled(false);

    // --- User Menu Interaktionen ---
    function closeUserMenu() {
        if (!menuList || !userMenuToggle) return;
        menuList.classList.remove('open');
        userMenuToggle.setAttribute('aria-expanded', 'false');
        menuList.hidden = true;
    }
    function openUserMenu() {
        if (!menuList || !userMenuToggle) return;
        menuList.hidden = false;
        // kleine Verzögerung, um CSS-Animationen zu erlauben
        requestAnimationFrame(() => menuList.classList.add('open'));
        userMenuToggle.setAttribute('aria-expanded', 'true');
    }
    userMenuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuList && menuList.classList.contains('open');
        if (isOpen) closeUserMenu(); else openUserMenu();
    });
    document.addEventListener('click', (e) => {
        if (!menuList || !userMenu) return;
        if (!userMenu.contains(e.target)) closeUserMenu();
    }, { capture: true });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeUserMenu();
    });
    menuSignout?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showToast('Abgemeldet.', 'success');
            closeUserMenu();
        } catch (e) { showAuthError(e); }
    });

    // --- Datenschutz: Banner & Modal ---
    function showPrivacyBannerIfNeeded() {
        try {
            const accepted = localStorage.getItem('privacyAccepted');
            privacyAccepted = accepted === 'true';
            if (!privacyAccepted && privacyBanner) privacyBanner.hidden = false;
        } catch (_) {}
    }
    function openPrivacyModal() {
        if (!privacyModal) return;
        // Banner ausblenden, solange Modal offen ist
        if (privacyBanner && !privacyBanner.hidden) {
            privacyModal.dataset.bannerWasVisible = 'true';
            privacyBanner.hidden = true;
        } else {
            privacyModal.dataset.bannerWasVisible = 'false';
        }
        privacyModal.hidden = false;
        document.body.style.overflow = 'hidden';
        const focusEl = privacyModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusEl) focusEl.focus();
    }
    function closePrivacyModal() {
        if (!privacyModal) return;
        privacyModal.hidden = true;
        document.body.style.overflow = '';
        // Banner wieder anzeigen, falls vorher sichtbar und noch nicht akzeptiert
        if (!privacyAccepted && privacyModal.dataset.bannerWasVisible === 'true' && privacyBanner) {
            privacyBanner.hidden = false;
        }
        // Fokus zurück auf ein sichtbares Steuerelement setzen
        if (!privacyAccepted && !privacyBanner?.hidden) {
            privacyDetails?.focus();
        } else if (userMenuToggle && !userMenu?.hidden) {
            userMenuToggle.focus();
        } else if (authBtn && !authBtn.hidden) {
            authBtn.focus();
        }
    }
    function acceptPrivacy() {
        try { localStorage.setItem('privacyAccepted', 'true'); } catch (_) {}
        privacyAccepted = true;
        if (privacyBanner) privacyBanner.hidden = true;
        closePrivacyModal();
    }
    privacyDetails?.addEventListener('click', (e) => { e.preventDefault(); openPrivacyModal(); });
    privacyClose?.addEventListener('click', () => acceptPrivacy());
    privacyAccept?.addEventListener('click', () => acceptPrivacy());
    privacyModal?.addEventListener('click', (e) => { if (e.target === privacyModal) closePrivacyModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !privacyModal?.hidden) closePrivacyModal(); });
    showPrivacyBannerIfNeeded();

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

