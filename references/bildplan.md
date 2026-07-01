# 📸 Bildplan — so tauschst du die Platzhalter gegen echte Bilder

**Prinzip:** Jeder graue Platzhalter (`Carbon Schwarz 80 %`) ist ein `<img>` mit festem,
sprechendem Dateinamen. Du legst dein fertiges Bild **mit exakt diesem Namen** in den Ordner
`assets/images/` (Videos in `assets/videos/`). **Mehr nicht** — kein Code anfassen, die Seite
zeigt das Bild dann automatisch. Du kannst Bilder **einzeln und jederzeit** ersetzen.

**Tipps**
- **Dateiname muss exakt passen** (Kleinschreibung, Bindestriche, Endung `.jpg`).
- Bilder werden mit `object-fit: cover` eingepasst → das angegebene **Seitenverhältnis** ist nur
  eine Empfehlung; andere Formate werden sauber beschnitten (nicht verzerrt).
- Empfohlene Breite: Hero/„Groß" ca. **1600–1920 px**, kleinere Bilder ca. **800–1000 px**.
- Format `.jpg` empfohlen (klein & schnell). Willst du `.png`/`.webp`, sag Bescheid – dann passe
  ich die Dateiendung im Code an.
- Solange keine Datei vorhanden ist, bleibt der dunkle Platzhalter sichtbar.

---

## 🏠 index.html — Landingpage
| Datei (`assets/images/…`) | Stelle | Seitenverhältnis |
|---|---|---|
| `landing-hero.jpg` | Header – großes Hero-Bild | 16:9 |
| `projekt-uebersicht-01.jpg` | Projekte-Karussell, Karte 1 | 4:3 |
| `projekt-uebersicht-02.jpg` | Projekte-Karussell, Karte 2 | 4:3 |
| `projekt-uebersicht-03.jpg` | Projekte-Karussell, Karte 3 | 4:3 |
| `modell-4c-cover.jpg` | Sektion „Modelle", Karte 4C | 1:1 |
| `modell-7c-cover.jpg` | Sektion „Modelle", Karte 7C | 1:1 |

**Videos** (Ordner `assets/videos/`, plus optionales Poster-Bild in `assets/images/`)
| Datei | Stelle |
|---|---|
| `assets/videos/tagesablauf.mp4` + `assets/images/video-tagesablauf-poster.jpg` | Video „Tagesablauf" (oben) |
| `assets/videos/tagesablauf-2.mp4` + `assets/images/video-tagesablauf-2-poster.jpg` | Video „Tagesablauf" (unten) |

> Tipp: Sind die Videos noch nicht fertig, kannst du auch nur das Poster-Bild einlegen.

---

## 🟧 modell-4c.html
| Datei (`assets/images/…`) | Stelle | Seitenverhältnis |
|---|---|---|
| `modell-4c-hero.jpg` | Header – Hero | 16:9 |
| `modell-4c-galerie-01.jpg` | Bildgalerie Groß 1 – großes Bild | 16:8 |
| `modell-4c-galerie-02.jpg` | Bildgalerie Groß 1 – links | 4:3 |
| `modell-4c-galerie-03.jpg` | Bildgalerie Groß 1 – rechts | 4:3 |
| `modell-4c-seitlich-01.jpg` | Bildgalerie Seitlich 1 (Illustration rechts) | 16:10 |
| `modell-4c-seitlich-02.jpg` | Bildgalerie Seitlich 2 (Illustration links) | 16:10 |
| `modell-4c-galerie-04.jpg` | Bildgalerie Groß 2 – großes Bild | 16:8 |
| `modell-4c-galerie-05.jpg` | Bildgalerie Groß 2 – links | 4:3 |
| `modell-4c-galerie-06.jpg` | Bildgalerie Groß 2 – rechts | 4:3 |

---

## 🟪 modell-7c.html
| Datei (`assets/images/…`) | Stelle | Seitenverhältnis |
|---|---|---|
| `modell-7c-hero.jpg` | Header – Hero | 16:9 |
| `modell-7c-galerie-01.jpg` | Bildgalerie Groß 1 – großes Bild | 16:8 |
| `modell-7c-galerie-02.jpg` | Bildgalerie Groß 1 – links | 4:3 |
| `modell-7c-galerie-03.jpg` | Bildgalerie Groß 1 – rechts | 4:3 |
| `modell-7c-seitlich-01.jpg` | Bildgalerie Seitlich 1 (Illustration rechts) | 16:10 |
| `modell-7c-seitlich-02.jpg` | Bildgalerie Seitlich 2 (Illustration links) | 16:10 |
| `modell-7c-galerie-04.jpg` | Bildgalerie Groß 2 – großes Bild | 16:8 |
| `modell-7c-galerie-05.jpg` | Bildgalerie Groß 2 – links | 4:3 |
| `modell-7c-galerie-06.jpg` | Bildgalerie Groß 2 – rechts | 4:3 |

---

## 🟩 projekte.html
| Datei (`assets/images/…`) | Stelle | Seitenverhältnis |
|---|---|---|
| `projekte-hero.jpg` | Header – Hero | 16:9 |
| `projekte-galerie-01.jpg` | Bildgalerie Groß 1 | 16:8 |
| `projekte-seitlich-01.jpg` | Bildgalerie Seitlich 1 (Illustration rechts) | 16:10 |
| `projekte-seitlich-02.jpg` | Bildgalerie Seitlich 2 (Illustration links) | 16:10 |
| `projekte-galerie-02.jpg` | Bildgalerie Groß 2 – großes Bild | 16:8 |
| `projekte-galerie-03.jpg` | Bildgalerie Groß 2 – links | 4:3 |
| `projekte-galerie-04.jpg` | Bildgalerie Groß 2 – rechts | 4:3 |

---

## ✏️ Texte ändern
Alle Texte stehen direkt und klar lesbar in den jeweiligen `.html`-Dateien (mit Kommentaren wie
`<!-- ===================== SPECS 4C ===================== -->`). Einfach den Text zwischen den
Tags anpassen — keine Programmierkenntnisse nötig.

## 🎨 Illustrationen
Liegen als SVG in `assets/illustrations/` (aus Figma). Möchtest du eine austauschen, lege das neue
SVG mit gleichem Dateinamen ab.
