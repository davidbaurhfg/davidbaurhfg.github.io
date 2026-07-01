# TREFF. — Website (Bachelor-Projekt)

Statische, animationsreiche Website für **TREFF.** (Container-Jugendräume, Claim „Jugendräume.
Schnell. Günstig. Einfach.") — umgesetzt aus Figma. Reines **HTML/CSS/JS, kein Build-Schritt**.

## Vorschau / starten
- **Empfohlen:** `index.html` einfach in **Google Chrome** öffnen (Doppelklick). Funktioniert für
  Ansicht inkl. Animationen, da alle Libs/Fonts lokal liegen.
- Falls Fonts/Effekte lokal zicken: lokalen Server nutzen → im Ordner `python3 -m http.server 8000`,
  dann `http://localhost:8000`. (`serve.py` startet denselben Server auf Port 8754.)
- `?still=1` an die URL hängen = Vorschau **ohne** Animationen (auch Reduced-Motion-Test).
- **Wichtig (Google Drive):** Der Ordner liegt im Google-Drive-CloudStorage. Das ist für das Öffnen
  in Chrome ok, aber die In-App-/Sandbox-Vorschau funktioniert dort NICHT. Für die reibungsloseste
  Arbeit kann der Ordner später nach `/Users/davidbaur/…` (lokal) verschoben werden — **erst nach
  Rücksprache** (Pfade in `serve.py`/`.claude/launch.json` müssen dann angepasst, Claude Code im
  neuen Ordner neu geöffnet werden).

## Seiten & Navigation
| Datei | Inhalt | Erreichbar über |
|---|---|---|
| `index.html` | Landingpage (17 Sektionen) | — |
| `modell-4c.html` | Modell 4C (klein) | Modelle-Karte „CTA 4C" |
| `modell-7c.html` | Modell 7C (groß) | Modelle-Karte „CTA 7C" |
| `projekte.html` | Projekte Schwäbisch Gmünd | Projekte-Karussell „Zum Projekt" |
| `kontakt.html` | Projekt anfragen | Nav-Button „Projekt anfragen" (einziger Weg) |

Nav-Links: Home→`index.html`, Projekte→`index.html#projekte`, Konzept→`#konzept`, Modelle→`#modelle`.

## Ordnerstruktur
```
index.html, modell-4c.html, modell-7c.html, projekte.html, kontakt.html
css/style.css        Alles-in-einem-Stylesheet (Tokens, Komponenten, Responsive). Mobile-first, clamp(), Grid/Flexbox.
js/
  app.js             Motion-Core: Lenis+GSAP-Init, Reveals, Parallax, Float, Button-Bounce, Nav, Bild-Slots, Dropdown
  loader.js          Lade-/Cursor-Animation (TREFF.-Logo füllt sich, folgt der Maus, fliegt in den Header) – 1×/Session
  phasen.js          Phasen-Scrollytelling (SVG-Linie mit 2×90°-Knicken, aktive/abgedimmte Phase)
  parallax.js        Parallax der „Bildgalerie Seitlich" (Illustration ≠ Bild-Tempo)
  carousel.js        Projekte-Karussell (Drag/Swipe + Dots)
  faq.js             FAQ-Akkordeon
  lib/               gsap, ScrollTrigger, Draggable, lenis (lokal)
fonts/               Chunko Bold (Display) + Inter Tight Regular/Medium (Body) als WOFF2+TTF
assets/illustrations/  alle SVGs aus Figma (Figuren, Icons, Logos)
assets/images/         BILD-SLOTS (leer) – hier echte Bilder ablegen, siehe references/bildplan.md
assets/videos/         Video-Slots (tagesablauf.mp4 …)
references/bildplan.md Anleitung: welcher Dateiname → welche Stelle
```

## Inhalte pflegen
- **Texte:** stehen direkt im HTML (Sektions-Kommentare wie `<!-- ===== SPECS 4C ===== -->`). Einfach
  ändern, keine Programmierkenntnisse nötig.
- **Bilder:** dunkle Platzhalter (`Carbon Schwarz 80%`). Echtes Bild mit dem in `references/bildplan.md`
  genannten Dateinamen in `assets/images/` legen → erscheint automatisch (kein Code).
- **Illustrationen:** SVGs in `assets/illustrations/` (gleicher Name = ersetzt).

## Designsystem (in `css/style.css :root`)
Farben als CSS-Variablen mit euren Namen: `--lila-traube #9696FF`, `--wilde-malve #E5B3FF`,
`--flammen-orange #FF4C02`, `--schulbus-gelb #FFC800`, `--helle-fichte #00812B`,
`--dunkle-fichte #004F1A`, `--kieselstein #696969`, `--carbon-schwarz #1A1A1A`,
`--carbon-schwarz-80`, `--schnee-weiss #FFFFFF`, `--graue-strasse #E5E6E6`, `--heller-stein-15/50`.
Hintergrund immer Schnee Weiss. Schriften: Chunko (Headlines/Logo), Inter Tight (Text/UI).

## Wichtige Komponenten / Konventionen
- **Nav** = Liquid-Glass-Pille (fixed, oben mittig). Hover-Farben pro Button. **Desktop-only**
  (auf Mobile ≤600px aktuell ausgeblendet – Prio 2, Lösung folgt).
- **Generator-CTA** (`.cta`): Pille + oranger Kreis. Hover = Kreis rutscht in die Pille, Pille
  umfließt ihn (bouncy). Pfeil immer 8×8 px. Genutzt für „Zum Projekt", „Mehr Anzeigen", „Weiter".
- **Animations-Hooks im Markup:** `data-reveal[="up|left|right|scale"]`, `data-parallax="0.2"`,
  `data-float`, `.js-bounce`, `data-illu-parallax`, `data-phasen`, `data-carousel`, `data-faq`, `data-dropdown`.
- **Kontakt-Dropdown** (`data-dropdown`): Auswahl Modell 4C / 7C / Unentschlossen / Unabhängige Frage;
  schließt bei Auswahl, gewählter Wert steht in der Pille (Logik in `app.js → initDropdown`).
- Bewegungs-first (kaum Opacity). `prefers-reduced-motion` & `?still=1` schalten Effekte ab.

## Status (Stand jetzt)
Fertig: alle 5 Seiten (Desktop verifiziert), Loader, Nav, Phasen-Scrollytelling, Karussell, FAQ,
Parallax, Merge-CTA, Footer (Logo unverzerrt 432:257), Bildplan, Custom-Dropdown.
**Priorität Desktop.** Offen / Prio 2: Mobile/Tablet-Feinschliff (Nav auf Mobile vorerst aus;
Header-Logo/Headings dort begrenzt). Reale Bilder/Videos werden vom Nutzer über den Bildplan ergänzt.
Plan-Datei: `~/.claude/plans/hey-setze-die-links-quirky-parnas.md`.
