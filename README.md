# Road to Beijing 27 – Auslaufen Podcast

Wöchentlich aktualisierte Seite unter **quali.auslaufen-podcast.de**: deutsche Läufer:innen (800 m bis Marathon) auf der offiziellen Quali-Liste für die WM Peking 2027.

## Datenquelle

Einzige Quelle für die Quali ist die offizielle Liste **Road to Beijing 27** von World Athletics
(https://worldathletics.org/stats-zone/road-to/7216591). Sie enthält für jede Disziplin, wer aktuell
qualifiziert ist (Norm, World Ranking, Wildcard), die Nachrückerliste und das Nationen-Limit.
Nationale Nominierungskriterien sind bewusst nicht eingerechnet, sie stehen nur als Info auf der Seite.

Abgerufen wird über einen echten Browser (Playwright), der die öffentlichen Seiten öffnet, so wie
man sie selbst ansieht. Es gibt keinen direkten Zugriff auf interne Schnittstellen.

## Was hier drin ist

| Datei | Zweck |
|---|---|
| `fetch_roadto.py` | Öffnet die zwölf Road-to-Seiten, speichert die Listen nach `data/raw/`, prüft auf Plausibilität |
| `fetch_worldranking.py` | Zusatzhinweis: Deutsche im World Ranking, die noch nicht auf der Liste stehen (zählt nicht für die Quali) |
| `build_data.py` | Übersetzt die Listen in den Datensatz für Seite und Carousel (`data/roadto.json`, Verlauf in `data/history/`) |
| `web/` | Die Seite (React, Tailwind, shadcn/ui), gebaut zu einer einzigen HTML-Datei mit `pnpm run bundle` |
| `nations.json` | Nominierungsregeln der Verbände (von Hand gepflegt) |
| `shopify/road-to-beijing-embed.liquid` | Baustein für die Einbettung in den Shop |
| `shopify/brand-layer.css` | Futura PT als Haus-Schrift für den ganzen Shop |
| `gen_carousel.py`, `carousel/` | Carousel-Slides aus denselben Daten |
| `.github/workflows/rankings.yml` | Automatik: prüft täglich, baut nur bei geänderter Liste |
| `legacy/`, `data/legacy_worldranking/` | Alte Näherung über das World Ranking, nur noch als Archiv |

## Einrichtung (einmalig, ca. 20 Minuten)

### 1. GitHub
1. Neues **öffentliches** Repository anlegen, z. B. `road-to-beijing`, und alle Dateien hochladen.
2. *Settings → Pages → Build and deployment → Source:* **GitHub Actions**.
3. *Settings → Actions → General → Workflow permissions:* **Read and write permissions**.
4. *Actions → „Road to Beijing – Quali-Liste“ → Run workflow.* Nach ca. 2 Minuten ist die Seite unter `https://<benutzername>.github.io/road-to-beijing/` erreichbar.

### 2. Domain bei IONOS
1. *Domains & SSL → auslaufen-podcast.de → DNS → Record hinzufügen → CNAME*
   - Hostname: `quali`
   - Zeigt auf: `<benutzername>.github.io`
   - Falls IONOS es verlangt, vorher die Subdomain `quali` anlegen.
2. In GitHub: *Settings → Pages → Custom domain:* `quali.auslaufen-podcast.de` → Save. Wenn der Haken grün ist: **Enforce HTTPS** aktivieren (kann bis zu 24 h dauern).
3. Schutz vor Übernahme der Subdomain: *GitHub-Profil → Settings → Pages → Add a domain* `auslaufen-podcast.de` und den angezeigten TXT-Eintrag bei IONOS anlegen.

### 3. Shopify (Theme „Studio“)
1. *Onlineshop → Seiten → Seite hinzufügen:* Titel „Road to Beijing“, Inhalt leer lassen. Rechts unter *Theme-Vorlage* später `road-to-beijing` wählen. Speichern.
2. *Onlineshop → Themes → Anpassen.* Oben in der Seitenauswahl *Seiten → Neue Vorlage erstellen*, Name `road-to-beijing`, basierend auf „Standardseite“.
3. In der neuen Vorlage den Abschnitt *Seite* (Titel und Inhalt) ausblenden oder entfernen. *Abschnitt hinzufügen → Benutzerdefiniertes Liquid* und den Inhalt von `shopify/road-to-beijing-embed.liquid` einfügen. Oben und unten Abstand auf 0 setzen. Speichern.
4. Zurück zur Seite „Road to Beijing“ und dort die Vorlage `road-to-beijing` zuweisen.
5. *Onlineshop → Navigation → Hauptmenü → Menüpunkt hinzufügen:* Name „Road to Beijing“, Link: die Seite „Road to Beijing“.

Ergebnis: Die Seite läuft unter `auslaufen-podcast.de/pages/road-to-beijing` mit Shop-Kopf und -Fuß. Direktlinks funktionieren, z. B. `/pages/road-to-beijing#marathon-maenner`. Eingebettet ist die Seite immer hell und passt ihre Höhe selbst an.

### 4. Futura PT (Adobe Fonts) für Seite und Shop
Futura ist eine kommerzielle Schrift. Über das Creative-Cloud-Abo ist **Futura PT** bei Adobe Fonts für Websites nutzbar, aber nur über den Einbettungscode von Adobe. Herunterladen und selbst hosten ist nicht erlaubt.
1. fonts.adobe.com → „Futura PT“ → **</> Zum Webprojekt hinzufügen** → neues Projekt „Auslaufen Web“. Schnitte: Book (400), Medium (500), Demi (600), Bold (700), Extra Bold (800), Extra Bold Oblique. Speichern.
2. Unter *Webprojekte* die **Projekt-ID** kopieren (sieben Zeichen, steht im Code `https://use.typekit.net/<ID>.css`). Falls Adobe nach Domains fragt: `auslaufen-podcast.de`, `quali.auslaufen-podcast.de` und eure `…myshopify.com`-Adresse eintragen.
3. **Seite:** In GitHub *Settings → Secrets and variables → Actions → Variables → New repository variable*, Name `TYPEKIT_ID`, Wert = Projekt-ID. Danach *Actions → Run workflow*. Ohne Variable nutzt die Seite die Ersatzschrift Jost.
4. **Shop:** *Onlineshop → Themes → … → Code bearbeiten → layout/theme.liquid*. Direkt vor `</head>` einfügen:
   - `<link rel="stylesheet" href="https://use.typekit.net/<ID>.css">`
   - `<style>` + Inhalt von `shopify/brand-layer.css` + `</style>`
   Vorher das Theme duplizieren (Sicherung). Bei einem Theme-Update prüfen, ob der Block noch drin ist.

### 5. Datenschutzerklärung
Die Subdomain wird über GitHub Pages (GitHub Inc., USA) ausgeliefert, dabei fallen Server-Logs mit IP-Adressen an. Das gehört als Abschnitt in die Datenschutzerklärung (GitHub ist unter dem EU-US Data Privacy Framework zertifiziert). Die Seite setzt keine Cookies und speichert nichts im Browser. Mit Futura PT lädt sie die Schrift von Adobe Fonts (Adobe, USA, ebenfalls unter dem EU-US Data Privacy Framework). Das gilt auch für den Shop, sobald der Adobe-Link dort eingebaut ist. Beides gehört in die Datenschutzerklärung.

## Betrieb

- **Automatisch:** Die Action läuft täglich um 07:00 Uhr (Sommerzeit). World Athletics nennt kein Aktualisierungsdatum, deshalb vergleicht der Build den Inhalt der Listen. Nur bei Änderungen wird neu gebaut, das Carousel erzeugt und der Stand in `data/history/` gesichert.
- **Wenn etwas kaputt ist:** Lädt eine Liste nicht oder sieht sie unplausibel aus (falsche Disziplin, falsche Feldgröße, zu wenige Einträge), bricht der Lauf ab und die alte Seite bleibt online. GitHub schickt eine E-Mail.
- **Von Hand pflegen:** `nations.json`, sobald Verbände ihre Regeln für 2027 veröffentlichen.
- **Lokal testen:** `python fetch_roadto.py && python build_data.py && python gen_carousel.py`, dann in `web/`: `pnpm install && pnpm run bundle`.

## Bekannte Grenzen

- Die Liste ist ein Zwischenstand. Endgültig ist der Stand vom 25.08.2027 (Marathon 05.05.2027).
- Gezählt werden nur Leistungen im Quali-Zeitraum. Für 800 m bis 5000 m und Hindernis begann er am 23.08.2026, deshalb sind diese Listen im Herbst noch dünn.
- Für Deutsche gilt zusätzlich die DLV-Norm. „Qualifiziert“ heißt: von World Athletics aus startberechtigt, nicht nominiert.
- „Nachrücker:in“ bedeutet hier: unter den ersten zehn der offiziellen Nachrückerliste. Die Grenze ist eine redaktionelle Festlegung.
- Daten: World Athletics. Mit Quellenangabe und eigener Einordnung veröffentlichen, Nutzungsbedingungen vor dem Bewerben prüfen.
