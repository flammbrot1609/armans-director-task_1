# Arman's Gästebuch Website

Eine moderne, minimalistische Gästebuch-Seite – inspiriert von thomann.io, mit Firebase-Backend, Neon-Farbschema und klarer Struktur.

**Live:** [https://arman-director-task.netlify.app](https://arman-director-task.netlify.app)
**GitHub:** [https://github.com/flammbrot1609/armans-director-task_1](https://github.com/flammbrot1609/armans-director-task_1)

## Features

- **Gästebuch:** Besucher können Einträge hinterlassen, die live angezeigt werden
- **Anmeldung nur im Gästebuch:** Header-Login wurde entfernt; Sign-in ausschließlich im Gästebuch-Bereich
- **Löschen/Bearbeiten:** Löschen für alle eingeloggten Nutzer; Bearbeiten nur durch den Owner
- **Likes & Teilen:** Gefällt-mir-Reaktionen und Link-Kopieren für Einträge
- **Dark/Light Mode:** Dark Mode standard, FOUC-frei via `public/js/theme-init.js`
- **Firebase Firestore Backend:** Alle Einträge werden dauerhaft in Firestore gespeichert
- **CSP konfiguriert:** `public/_headers` erlaubt Firebase Auth IFrames (frame-src)
- **Responsive:** Sieht auf Desktop und Mobile top aus
- **Sichere Eingaben:** HTML-Escaping gegen XSS
- **Netlify Deployment**: Automatische Deployments auf https://arman-director-task.netlify.app

## Projektstruktur

```
/public/
  index.html               # Hauptseite
  privacy.html             # Datenschutzerklärung
  impressum.html           # Impressum/Kontakt
  _headers                 # Netlify Header (CSP für Firebase Auth)
  /css/
    styles.css             # Hauptstyles
  /js/
    guestbook-firebase.js  # Gästebuch + Firestore Integration
    theme-switcher.js      # Dark/Light-Mode
    theme-init.js          # Setzt Theme sehr früh (FOUC vermeiden)
  /assets/
    logo.png               # Logo (optional)
README.md                  # Diese Datei
netlify.toml               # Netlify Deployment Config
```

## Getting Started

1. **Projekt klonen:**
   ```bash
   git clone https://github.com/flammbrot1609/armans-director-task_1.git
   cd armans-director-task_1
   ```
2. **Firebase einrichten:**
   - Gehe zu https://console.firebase.google.com/
   - Neues Projekt anlegen (z.B. "arman-s-director-task")
   - Firestore aktivieren
   - Die Konfiguration findest du in `/public/js/guestbook-firebase.js`
   - Erstelle eine Collection `comments` mit Feldern: `name`, `message`, `timestamp`

## Firestore Hinweise
- Kommentare werden in der Collection `comments` gespeichert
- Prüfe Firestore-Regeln, wenn Aktionen fehlschlagen (z. B. Löschen, Like)
- Beispiel-Regeln passend zur aktuellen App (Löschen für alle Auth-User, Edit nur Owner, Like-Ausnahmen):

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null; // jeder eingeloggte User darf löschen
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.uid ||
        request.resource.data.diff(resource.data).changedKeys().hasOnly(["likedBy"]) // Likes erlauben
      );
    }
  }
}
```

## Troubleshooting
- **Kommentare fehlen:** Prüfe Firestore-Konfiguration und Collection-Namen
- **Deployment-Fehler:** Stelle sicher, dass Netlify CLI installiert und das Projekt verlinkt ist
- **Fragen?** Issues im [GitHub Repo](https://github.com/flammbrot1609/armans-director-task_1/issues) eröffnen

## Gästebuch Backend (Firebase)
- **Speichert alle Einträge in Firestore**
- Echtzeit-Updates durch onSnapshot
- Felder: name (string), message (string), timestamp (timestamp)

## Farbschema
- **Schwarz:** #000000
- **Pink:** #FD01A6
- **Giftgrün:** #2BFD63
- **Lila:** #8E52F5

## Hinweise
- Keine Navigation/Logo gewünscht (kann bei Bedarf ergänzt werden)
- Alle Gästebucheinträge sind öffentlich sichtbar
- Bei Fragen zu Moderation, Export, oder weiteren Features → siehe `guestbook-firebase.js`

---

**Viel Spaß mit deinem Gästebuch!**

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License. Siehe `package.json`.

## Contributing

Feel free to submit issues and enhancement requests!

---

**Happy coding!** 🚀
