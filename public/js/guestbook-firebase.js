// guestbook-firebase.js
// Firebase Gästebuch – Modular v9 API, optimiert und kommentiert

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/**
 * Initialisiert das Gästebuch nach DOM-Load
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Utility: Logging ---
    function logError(context, err) {
        console.error(`[Gästebuch][${context}]`, err);
    }

    // Hinweis: Löschen ist für alle eingeloggten Nutzer erlaubt (Edit bleibt Owner-only)

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
    // Firebase wird erst nach ausdrücklicher Einwilligung initialisiert
    let app = null, db = null, auth = null, provider = null;
    let firebaseStarted = false;
    let unsubscribeSnapshot = null;
    let unsubscribeAuth = null;

    function initFirebaseOnce() {
        if (firebaseStarted) return;
        firebaseStarted = true;
        try {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            startDataListeners();
        } catch (e) {
            logError('FirebaseInit', e);
        }
    }

    function startDataListeners() {
        // --- Kommentare laden und live updaten (erst nach Einwilligung) ---
        const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
        renderSkeletons(3);
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            if (!commentList) return;
            // Skeletons entfernen
            commentList.querySelectorAll('.comment-skeleton').forEach(el => el.remove());
            // Leere-State: entfernen, wird ggf. neu gesetzt
            commentList.querySelectorAll('.comment-empty').forEach(el => el.remove());

            // Wenn komplett leer
            if (snapshot.size === 0) {
                const empty = document.createElement('li');
                empty.className = 'comment comment-empty';
                empty.innerHTML = '<div class="comment-header"><div class="comment-meta">Noch keine Einträge</div></div><div class="comment-message">✨ Sei der Erste und hinterlasse eine Nachricht!</div>';
                commentList.appendChild(empty);
            }

            snapshot.docChanges().forEach(change => {
                const docSnap = change.doc;
                const id = docSnap.id;
                if (change.type === 'added') {
                    const li = renderCommentLI(docSnap);
                    insertAtIndex(li, change.newIndex);
                } else if (change.type === 'modified') {
                    const li = document.getElementById(`c-${id}`);
                    if (li) updateCommentLI(li, docSnap.data(), id);
                    // ggf. Position anpassen
                    if (change.oldIndex !== change.newIndex) {
                        const el = document.getElementById(`c-${id}`);
                        if (el) insertAtIndex(el, change.newIndex);
                    }
                } else if (change.type === 'removed') {
                    const li = document.getElementById(`c-${id}`);
                    li?.remove();
                }
            });

            // Suche anwenden, falls aktiv
            if (searchInput && searchInput.value) filterList(searchInput.value);
            // Deep-Link zu Kommentar (#c-<id>)
            handleHash();
            // Delete-Buttons gemäß Berechtigung aktualisieren
            refreshDeleteButtons();
            loadingIndicator.classList.add('is-hidden');
            if (commentList) commentList.setAttribute('aria-busy', 'false');
        }, err => {
            logError('Snapshot', err);
            loadingIndicator.classList.add('is-hidden');
            if (commentList) commentList.setAttribute('aria-busy', 'false');
        });

        // --- Auth State Listener & Redirect Ergebnis ---
        unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            updateAuthUI(user);
            // Sichtbarkeit der Delete-Buttons nach Login/Logout aktualisieren
            refreshDeleteButtons();
        });
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                showToast('Erfolgreich angemeldet.', 'success');
            }
        }).catch(showAuthError);
    }

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
    const searchInput = document.getElementById('search-input');
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
    const privacyAccept = document.getElementById('privacy-accept'); // banner OK
    const privacyModal = document.getElementById('privacy-modal');
    const privacyClose = document.getElementById('privacy-close'); // modal close (no consent)
    const privacyAgree = document.getElementById('privacy-agree'); // modal explicit consent
    const privacySettingsBtn = document.getElementById('privacy-settings'); // footer settings link
    let privacyAccepted = false;
    // Elemente außerhalb des Modals, die währenddessen deaktiviert werden sollen
    const pageRegions = [document.querySelector('header'), document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
    let modalTrapHandler = null; // Keydown-Handler für Fokusfalle
    // ARIA für Barrierefreiheit
    if (form) form.setAttribute('aria-label', 'Gästebuch-Formular');
    if (commentList) commentList.setAttribute('aria-live', 'polite');

    // Ladeindikator einfügen
    let loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.setAttribute('aria-live', 'assertive');
    loadingIndicator.innerHTML = '<span class="spinner"></span> <span class="loading-text">Lade...</span>';
    form?.parentNode?.insertBefore(loadingIndicator, form.nextSibling);
    loadingIndicator.classList.add('is-hidden');
    if (commentList) commentList.setAttribute('aria-busy', 'true');

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

    // --- Helper für inkrementelles Rendering ---
    function buildCommentHTML(comment, docId) {
        const isOwner = auth?.currentUser && comment?.uid === auth.currentUser.uid;
        const canDelete = !!auth?.currentUser;
        const likedBy = Array.isArray(comment?.likedBy) ? comment.likedBy : [];
        const likesCount = likedBy.length;
        const likedByMe = !!(auth?.currentUser && likedBy.includes(auth.currentUser.uid));
        const editBtnHtml = isOwner ? `<button class="action-btn edit-btn" aria-label="Eintrag bearbeiten" title="Bearbeiten">✏️</button>` : '';
        const deleteBtnHtml = canDelete ? `<button class="action-btn delete-btn" title="Eintrag löschen" aria-label="Eintrag löschen">🗑️</button>` : '';
        const likeBtnHtml = `<button class="action-btn like-btn${likedByMe ? ' active' : ''}" aria-label="Gefällt mir"><span class="like-heart">❤️</span> <span class="like-count">${likesCount}</span></button>`;
        const shareBtnHtml = `<button class="action-btn share-btn" aria-label="Eintrag teilen" title="Link kopieren">🔗</button>`;
        const ts = comment.timestamp?.toDate ? comment.timestamp.toDate() : null;
        const tsText = ts ? ts.toLocaleString() : '';
        return `
            <div class="comment-header">
                <div class="comment-meta">${escapeHTML(comment.name || '')} | ${tsText}</div>
                <div class="comment-actions">${likeBtnHtml} ${shareBtnHtml} ${editBtnHtml} ${deleteBtnHtml}</div>
            </div>
            <div class="comment-message">${escapeHTML(comment.message || '')}</div>
        `;
    }
    function renderCommentLI(docSnap) {
        const data = docSnap.data();
        const li = document.createElement('li');
        li.className = 'comment';
        li.id = `c-${docSnap.id}`;
        li.dataset.name = data?.name || '';
        li.dataset.message = data?.message || '';
        li.dataset.uid = data?.uid || '';
        li.innerHTML = buildCommentHTML(data, docSnap.id);
        return li;
    }
    function updateCommentLI(li, data, docId) {
        if (!li) return;
        li.dataset.name = data?.name || '';
        li.dataset.message = data?.message || '';
        li.dataset.uid = data?.uid || '';
        li.innerHTML = buildCommentHTML(data, docId);
    }
    function getCommentEls() {
        return Array.from(commentList?.querySelectorAll('li.comment') || []);
    }
    function insertAtIndex(li, index) {
        const comments = getCommentEls();
        const refEl = comments[index] || null;
        if (refEl) commentList.insertBefore(li, refEl);
        else commentList.appendChild(li);
    }

    // Aktualisiert Delete-Buttons je nach Berechtigung
    function refreshDeleteButtons() {
        const items = getCommentEls();
        items.forEach(li => {
            const userUid = auth?.currentUser?.uid || '';
            const canDelete = (!!userUid);
            const actions = li.querySelector('.comment-actions');
            if (!actions) return;
            const delBtn = actions.querySelector('.delete-btn');
            if (canDelete && !delBtn) {
                const btn = document.createElement('button');
                btn.className = 'action-btn delete-btn';
                btn.setAttribute('aria-label', 'Eintrag löschen');
                btn.title = 'Eintrag löschen';
                btn.textContent = '🗑️';
                actions.appendChild(btn);
            } else if (!canDelete && delBtn) {
                delBtn.remove();
            }
        });
    }

    // Skeletons anzeigen (nur UI)
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
    // Kommentare-Listener werden nach Einwilligung initialisiert (siehe initFirebaseOnce)

    // Clientseitiges Filtern
    function filterList(query) {
        const q = (query || '').toLowerCase();
        const items = commentList?.querySelectorAll('li.comment');
        if (!items) return;
        items.forEach(li => {
            const hay = `${li.dataset.name || ''} ${li.dataset.message || ''}`.toLowerCase();
            li.hidden = q && !hay.includes(q);
        });
    }
    // Debounce-Helfer
    function debounce(fn, wait = 200) {
        let t = null;
        return function(...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }
    const debouncedFilter = debounce((val) => filterList(val), 200);
    searchInput?.addEventListener('input', (e) => {
        debouncedFilter(e.target.value);
    });

    // Event Delegation für Kommentaraktionen
    if (commentList && !commentList.dataset.delegated) {
        commentList.addEventListener('click', async (e) => {
            const target = e.target instanceof Element ? e.target : null;
            if (!target) return;
            const li = target.closest('li.comment');
            if (!li) return;
            const id = li.id?.startsWith('c-') ? li.id.slice(2) : null;
            if (!id) return;

            // DELETE
            if (target.closest('.delete-btn')) {
                // Stelle sicher, dass Einwilligung/Firebase-Init erfolgt ist und der User eingeloggt ist
                if (!privacyAccepted) { openPrivacyModal(); return; }
                if (!firebaseStarted) initFirebaseOnce();
                if (!auth?.currentUser) { showToast('Bitte melde dich zuerst an.', 'error'); return; }
                if (!confirm('Möchtest du diesen Eintrag wirklich löschen?')) return;
                loadingIndicator.classList.remove('is-hidden');
                try {
                    await deleteDoc(doc(db, 'comments', id));
                    showToast('Eintrag gelöscht!', 'success');
                } catch (err) {
                    logError('Löschen', err);
                    const code = err?.code || 'unknown';
                    let msg = 'Fehler beim Löschen!';
                    if (code === 'permission-denied') {
                        msg = 'Keine Berechtigung zum Löschen (Firestore-Regeln).';
                    } else if (code === 'not-found') {
                        msg = 'Dieser Eintrag existiert nicht mehr.';
                    } else if (code === 'unavailable' || code === 'failed-precondition') {
                        msg = 'Netzwerk-/Serverproblem. Bitte später erneut versuchen.';
                    }
                    showToast(msg, 'error');
                } finally {
                    loadingIndicator.classList.add('is-hidden');
                }
                return;
            }

            // LIKE
            const likeBtn = target.closest('.like-btn');
            if (likeBtn) {
                // Stelle sicher, dass Einwilligung/Firebase-Init erfolgt ist
                if (!privacyAccepted) { openPrivacyModal(); return; }
                if (!firebaseStarted) initFirebaseOnce();
                if (!auth.currentUser) { showToast('Bitte melde dich zuerst an.', 'error'); return; }
                try {
                    likeBtn.disabled = true;
                    const ref = doc(db, 'comments', id);
                    const uid = auth.currentUser.uid;
                    const isActive = likeBtn.classList.contains('active');
                    if (isActive) {
                        await updateDoc(ref, { likedBy: arrayRemove(uid) });
                    } else {
                        await updateDoc(ref, { likedBy: arrayUnion(uid) });
                    }
                } catch (err) {
                    logError('Like', err);
                    const code = err?.code || 'unknown';
                    let msg = 'Konnte Reaktion nicht speichern.';
                    if (code === 'permission-denied') {
                        msg = 'Keine Berechtigung für diese Reaktion (Firestore-Regeln).';
                    } else if (code === 'not-found') {
                        msg = 'Dieser Eintrag existiert nicht mehr.';
                    } else if (code === 'unavailable' || code === 'failed-precondition') {
                        msg = 'Netzwerk-/Serverproblem. Bitte später erneut versuchen.';
                    }
                    showToast(msg, 'error');
                } finally {
                    likeBtn.disabled = false;
                }
                return;
            }

            // SHARE
            if (target.closest('.share-btn')) {
                const url = `${location.origin}${location.pathname}#c-${id}`;
                try {
                    await navigator.clipboard?.writeText(url);
                    showToast('Link kopiert!', 'success');
                } catch (_) {
                    prompt('Link zum Kopieren:', url);
                }
                return;
            }

            // EDIT
            if (target.closest('.edit-btn')) {
                const msgEl = li.querySelector('.comment-message');
                if (!msgEl) return;
                const original = msgEl.textContent || '';
                const editor = document.createElement('div');
                editor.className = 'edit-editor';
                editor.innerHTML = `
                    <textarea class="edit-textarea" rows="3" aria-label="Nachricht bearbeiten"></textarea>
                    <div class="edit-actions">
                        <button class="action-btn save-edit" aria-label="Speichern">Speichern</button>
                        <button class="action-btn cancel-edit" aria-label="Abbrechen">Abbrechen</button>
                    </div>
                `;
                // Setze Text sicher
                const textarea = editor.querySelector('.edit-textarea');
                if (textarea) textarea.value = original;
                msgEl.replaceWith(editor);
                textarea?.focus();
                return;
            }

            // SAVE EDIT
            if (target.closest('.save-edit')) {
                const editor = target.closest('.edit-editor');
                const textarea = editor?.querySelector('.edit-textarea');
                const newMsg = (textarea?.value || '').trim();
                if (!newMsg) { showToast('Nachricht darf nicht leer sein.', 'error'); return; }
                if (newMsg.length > MSG_MAX) { showToast(`Max. ${MSG_MAX} Zeichen.`, 'error'); return; }
                loadingIndicator.classList.remove('is-hidden');
                try {
                    await updateDoc(doc(db, 'comments', id), { message: newMsg, editedAt: serverTimestamp() });
                    showToast('Eintrag aktualisiert!', 'success');
                } catch (err) {
                    logError('Edit', err);
                    showToast('Konnte Eintrag nicht speichern.', 'error');
                } finally {
                    loadingIndicator.classList.add('is-hidden');
                }
                return;
            }

            // CANCEL EDIT
            if (target.closest('.cancel-edit')) {
                const editor = target.closest('.edit-editor');
                if (!editor) return;
                // Alte Nachricht wiederherstellen aus Dataset
                const msgText = li.dataset.message || '';
                const msgEl = document.createElement('div');
                msgEl.className = 'comment-message';
                msgEl.textContent = msgText;
                editor.replaceWith(msgEl);
            }
        });
        commentList.dataset.delegated = 'true';
    }

    // Highlight für #c-<id>
    function handleHash() {
        const id = location.hash?.slice(1);
        if (!id) return;
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('comment--highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => el.classList.remove('comment--highlight'), 2000);
        }
    }
    window.addEventListener('hashchange', handleHash);

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
        loadingIndicator.classList.remove('is-hidden');
        setSubmitting(true);
        try {
            await addDoc(collection(db, "comments"), {
                name,
                message,
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
            loadingIndicator.classList.add('is-hidden');
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

    // --- Auth Events (nur nach Einwilligung) ---
    authBtn?.addEventListener('click', async () => {
        if (!privacyAccepted) { openPrivacyModal(); return; }
        if (!firebaseStarted) initFirebaseOnce();
        try {
            if (auth?.currentUser) {
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
        if (!privacyAccepted) { openPrivacyModal(); return; }
        if (!firebaseStarted) initFirebaseOnce();
        try {
            await signInFlow();
        } catch (e) {
            showAuthError(e);
        }
    });

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
    // Tastaturnavigation im User-Menü (generisches Dropdown)
    if (menuList) {
        menuList.addEventListener('keydown', (e) => {
            const items = Array.from(menuList.querySelectorAll('.menu-item'));
            if (items.length === 0) return;
            const currentIndex = items.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = items[(currentIndex + 1 + items.length) % items.length];
                next?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = items[(currentIndex - 1 + items.length) % items.length];
                prev?.focus();
            } else if (e.key === 'Home') {
                e.preventDefault(); items[0]?.focus();
            } else if (e.key === 'End') {
                e.preventDefault(); items[items.length - 1]?.focus();
            }
        });
    }
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
    // Falls bereits zugestimmt wurde, sofort initialisieren
    if (localStorage.getItem('privacyAccepted') === 'true') {
        privacyAccepted = true;
        initFirebaseOnce();
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
        document.body.classList.add('modal-open');
        // Hintergrund inaktiv setzen
        pageRegions.forEach(el => {
            if (el && !privacyModal.contains(el)) {
                try { el.inert = true; } catch (_) {}
                el.setAttribute('aria-hidden', 'true');
            }
        });
        // Fokusfalle einrichten
        const focusables = privacyModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const focusArr = Array.from(focusables);
        const first = focusArr[0];
        const last = focusArr[focusArr.length - 1];
        first?.focus();
        modalTrapHandler = (e) => {
            if (e.key !== 'Tab') return;
            if (focusArr.length === 0) return;
            const active = document.activeElement;
            if (e.shiftKey) {
                if (active === first || !privacyModal.contains(active)) {
                    e.preventDefault(); last?.focus();
                }
            } else {
                if (active === last || !privacyModal.contains(active)) {
                    e.preventDefault(); first?.focus();
                }
            }
        };
        document.addEventListener('keydown', modalTrapHandler, true);
        console.log('[privacy] modal opened');
    }
    function closePrivacyModal() {
        if (!privacyModal) return;
        privacyModal.hidden = true;
        document.body.classList.remove('modal-open');
        // Hintergrund wieder aktivieren
        pageRegions.forEach(el => {
            if (el) {
                try { el.inert = false; } catch (_) {}
                el.removeAttribute('aria-hidden');
            }
        });
        if (modalTrapHandler) {
            document.removeEventListener('keydown', modalTrapHandler, true);
            modalTrapHandler = null;
        }
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
        console.log('[privacy] modal closed (accepted:', privacyAccepted, ')');
    }
    function acceptPrivacy() {
        console.log('[privacy] accept triggered');
        try { localStorage.setItem('privacyAccepted', 'true'); } catch (e) { console.warn('[privacy] localStorage failed', e); }
        privacyAccepted = true;
        if (privacyBanner) privacyBanner.hidden = true;
        closePrivacyModal();
        // Jetzt erst Firebase initialisieren und Listener starten
        initFirebaseOnce();
    }
    privacyDetails?.addEventListener('click', (e) => { e.preventDefault(); openPrivacyModal(); });
    privacySettingsBtn?.addEventListener('click', (e) => { e.preventDefault(); openPrivacyModal(); });
    privacyClose?.addEventListener('click', () => { console.log('[privacy] close button click'); closePrivacyModal(); });
    // IMPORTANT: Banner "OK" must NOT grant consent. It should only open the detailed modal.
    privacyAccept?.addEventListener('click', () => { console.log('[privacy] banner OK click -> open modal'); openPrivacyModal(); });
    // Only explicit modal agree grants consent.
    privacyAgree?.addEventListener('click', () => { console.log('[privacy] modal agree click'); acceptPrivacy(); });
    // Klicks auf den Overlay-Bereich schließen nur, Klicks innerhalb verändern nichts
    privacyModal?.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            console.log('[privacy] overlay click close');
            closePrivacyModal();
        }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !privacyModal?.hidden) closePrivacyModal(); });
    showPrivacyBannerIfNeeded();
    // Allow opening privacy settings via URL: ?privacy=open or #privacy
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('privacy') === 'open' || window.location.hash === '#privacy') {
            openPrivacyModal();
        }
    } catch (_) {}

    // --- Scroll-to-top Button ---
    const scrollBtn = document.getElementById('scrollToTopBtn');
    function updateScrollBtnVisibility() {
        if (!scrollBtn) return;
        scrollBtn.classList.toggle('is-hidden', window.scrollY <= 300);
    }
    updateScrollBtnVisibility();
    window.addEventListener('scroll', updateScrollBtnVisibility, { passive: true });
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

