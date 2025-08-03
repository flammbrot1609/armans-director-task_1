# Arman's Gästebuch Website

Eine moderne, minimalistische Gästebuch-Seite – inspiriert von thomann.io, mit Firebase-Backend, Neon-Farbschema und klarer Struktur.

**Live:** [https://arman-director-task.netlify.app](https://arman-director-task.netlify.app)
**GitHub:** [https://github.com/flammbrot1609/armans-director-task_1](https://github.com/flammbrot1609/armans-director-task_1)

## Features

- **Gästebuch:** Besucher können Einträge hinterlassen, die live angezeigt werden
- **Firebase Firestore Backend:** Alle Einträge werden dauerhaft in Firestore gespeichert
- **Neon Color Palette:** #000000 (schwarz), #FD01A6 (pink), #2BFD63 (giftgrün), #8E52F5 (lila)
- **Minimalistisches Design:** Navigation ohne Logo/Links, Fokus auf Gästebuch
- **Responsive:** Sieht auf Desktop und Mobile top aus
- **Sichere Eingaben:** HTML-Escaping gegen XSS
- **Netlify Deployment**: Einfaches Hosting & Continuous Deployment

## Projektstruktur

```
/public/
  index.html               # Hauptseite
  /css/
    styles.css             # Hauptstyles
  /js/
    guestbook-firebase.js  # Gästebuch + Firestore Integration
    theme-switcher.js      # Dark/Light-Mode
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

3. **Deployment (Netlify):**
   - Das Projekt ist bereits mit Netlify verbunden
   - Für eigene Deployments: `netlify deploy --prod`

## Firestore Hinweise
- Kommentare werden in der Collection `comments` gespeichert
- Prüfe Firestore-Regeln, falls keine Kommentare angezeigt werden
- Kommentare bleiben erhalten, solange die Datenbank nicht manuell geleert wird

## Troubleshooting
- **Kommentare fehlen:** Prüfe Firestore-Konfiguration und Collection-Namen
- **Deployment-Fehler:** Stelle sicher, dass Netlify CLI installiert und das Projekt verlinkt ist
- **Fragen?** Issues im [GitHub Repo](https://github.com/flammbrot1609/armans-director-task_1/issues) eröffnen

---

© Arman Savuk, 2025

   - Firestore aktivieren (Start in Test Mode)
   - Collection `comments` anlegen (Felder: name, message, timestamp)
   - Konfigurationsdaten in `/js/guestbook-firebase.js` eintragen (bereits erledigt)
3. **Lokal testen:**
   ```bash
   python3 -m http.server 8000
   # oder
   npx live-server
   ```
4. **Deployment:**
   - Bereits für Netlify vorbereitet, einfach deployen
   - Live unter: https://armans-director-task.windsurf.build

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

Currently using Arial font family. You can easily change this in the CSS:
```css
body {
    font-family: 'Your Font', sans-serif;
}
```

### Sections
Add new sections by following the existing pattern:
```html
<section id="your-section" class="section">
    <div class="container">
        <!-- Your content here -->
    </div>
</section>
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This template is free to use for personal and commercial projects.

## Contributing

Feel free to submit issues and enhancement requests!

---

**Happy coding!** 🚀
