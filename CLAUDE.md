# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TREFF. — Website (Bachelor-Projekt)

Statische, animationsreiche Website für **TREFF.** (Container-Jugendräume, Claim „Jugendräume. Schnell. Günstig. Einfach.") — umgesetzt aus Figma. Reines **HTML/CSS/JS, kein Build-Schritt, keine Dependencies außer lokalen Libs**.

## Vorschau / starten

```bash
# Empfohlen: direkt in Chrome öffnen (alle Libs/Fonts lokal)
open index.html

# Alternativ: lokaler Server (für Fonts/CORS-Sonderfälle)
python3 -m http.server 8000        # http://localhost:8000
python3 serve.py                   # Port 8754 (Default; respektiert sonst $PORT)

# Animationen deaktivieren (Reduced-Motion-Test):
# ?still=1 an URL anhängen
```

Der Ordner liegt **lokal** (`~/CLAUDE/9_VIBE`, nicht mehr im Google Drive). `serve.py` liefert sein eigenes Verzeichnis aus (`os.path.dirname(__file__)`) — robust gegen Verschieben — und liest den Port aus `$PORT` (Default 8754).

**Claude-Code-Preview:** `.claude/launch.json` definiert den Server `"treff"` (→ `serve.py`) mit `"autoPort": true`. Damit weicht `preview_start` auf einen freien Port aus, falls 8754 belegt ist (z.B. durch einen parallelen Chat). Den `serverId`/`port` aus der `preview_start`-Antwort verwenden.

## Seiten

| Datei | Inhalt | Erreichbar über |
|---|---|---|
| `index.html` | Landingpage (14 Content-`<section>` + Header/Footer) | — |
| `modell-4c.html` | Modell 4C (klein) | Modelle-Karte „Mehr Anzeigen" |
| `modell-7c.html` | Modell 7C (groß) | Modelle-Karte „Mehr Anzeigen" |
| `projekte.html` | Projekte Schwäbisch Gmünd | Karussell „Zum Projekt" |
| `kontakt.html` | Projekt anfragen | Nav-Button „Projekt anfragen" |

## Designsystem (`css/style.css :root`)

Farben: `--lila-traube #9696FF`, `--wilde-malve #E5B3FF`, `--flammen-orange #FF4C02`, `--schulbus-gelb #FFC800`, `--helle-fichte #00812B`, `--dunkle-fichte #004F1A`, `--kieselstein #696969`, `--carbon-schwarz #1A1A1A`, `--schnee-weiss #FFFFFF`, `--graue-strasse #E5E6E6`.

Schriften: **Chunko Bold** (Headlines, Logo), **Inter Tight Regular/Medium** (Body, UI). Hintergrund immer `--schnee-weiss`. **Chunko ist sehr breit** (~10× Fontgröße pro Zeichen): fluide Display-Headlines auf randlosen Bannern (`.stoerer h2` → `font-size: clamp(1.5rem, 8vw, 11rem)`, `overflow-x:clip`, `hyphens:auto`) müssen mit der Viewport-Breite skalieren, damit auch das längste Wort („Planungsaufwand") auf Mobile/kleinen Laptops in die Zeile passt statt rechts abgeschnitten zu werden. **Nie** eine fixe/zu große Größe (`--fs-display`) auf `.stoerer h2` legen.

Spacing: 4/8-Raster (`--space-1` … `--space-10`). Type-Scale fluid (`clamp()`). Radien: `--r-pill: 9999px`, `--r-lg: 28px`, `--r-md: 18px`.

## JavaScript-Architektur

### Ladereihenfolge (am Ende von `<body>`)
```
js/lib/gsap.min.js → ScrollTrigger → Draggable → js/lib/lenis.min.js → app.js → parallax.js → phasen.js → carousel.js → faq.js
```
In allen 5 HTML-Dateien identisch — **Ausnahme:** `index.html` lädt danach zusätzlich `js/video.js` (Explosion-Video) **und `js/intro.js`** (Sweep-Starter, s.u.). Alle Libs liegen in `js/lib/` (lokal, kein CDN). `app.js` hängt sein `boot()` an `DOMContentLoaded` (bzw. ruft sofort, falls DOM schon geladen). Die Feature-Module (`parallax/phasen/carousel/faq`) registrieren beim Parsen nur ihre `TREFF.init*`-Funktionen; aufgerufen werden sie zentral aus `boot()`. **Nur `index.html` hat wieder ein Intro** (Sweep-Starter, s. [`js/intro.js`](#jsintrojs--sweep-starter-intro)); die anderen Seiten öffnen direkt auf dem Header.

### `js/app.js` — Motion-Core
`boot()` ruft in dieser Reihenfolge auf (Quelle der Wahrheit, nicht die Definitionsreihenfolge im File):
`initImageSlots()` → `initDropdown()` → `initSmoothScroll()` (Lenis ↔ GSAP-Ticker) → `initAnchorScroll()` → `initNav()` → **nur `hasGSAP && !REDUCED`:** `initReveals()` + `initParallax()` → **nur `hasGSAP`:** `initFloating()` + `initBounce()` → Feature-Module in fester Reihenfolge `["initPhasen","initParallaxExtra","initCarousel","initFAQ"]` (jeweils nur falls als `TREFF.*` registriert, `try/catch`-umschlossen) → `ScrollTrigger.refresh()`.

**`initReveals()`**: Setzt `autoAlpha:0` auf alle `[data-reveal]`-Elemente beim Start. Elemente ohne `data-reveal`-Attribut werden **nie** von `initReveals` ausgeblendet. Header-Logo (`.header__logo`) und Header-Illustration (`.header__illu`) haben bewusst **kein** `data-reveal`. **Aber:** auf `index.html` blendet der Sweep-Starter ([`js/intro.js`](#jsintrojs--sweep-starter-intro)) sie beim Laden über die `html.intro-active`-Klasse zunächst aus und animiert sie rein; bei Reduced Motion / `?still=1` (keine `intro-active`-Klasse) sind sie ab dem ersten Frame sichtbar.

**`initBounce()`**: Alle `.js-bounce`-Elemente skalieren auf hover auf `1.06` (GSAP), außer `.nav__pill--cta` → `1.03` (explizite Ausnahme in app.js).

**`initNav()`**: Nur `is-scrolled`-Klasse per Scroll-Position, **kein** Auto-Hide beim Runterscrollen.

### `js/intro.js` — Sweep-Starter (Intro)
**Nur `index.html`**, läuft **bei jedem Laden** (~2,1 s). Selbst-initialisierendes IIFE, geladen **nach** `js/video.js`. Editorial-Intro aus dem Zusammenspiel von Logo + Illustration:
1. Ein oranger Balken (`.intro-sweep`, per JS in `.header__logo` erzeugt) wischt links→rechts; **synchron** wird das „TREFF."-Logo per `clip-path: inset(0 100%→0% 0 0)` „gemalt".
2. Die gelbe Frau (`.header__illu img`) steigt mit `back.out`-Überschwung auf (`yPercent/scale/autoAlpha`).
3. Winziger Logo-Settle-Puls; die **Nav** blendet ein — **nur `autoAlpha`, NIE Transform** (sonst bricht `translateX(-50%)`).

- **Kein-Flackern-Start:** Ein **Inline-Script im `<head>`** setzt `html.intro-active` **vor dem ersten Paint** — aber nur, wenn Animation gewünscht (nicht bei `?still=1` / `prefers-reduced-motion`). CSS (`html.intro-active ...`) hält Logo (geclippt), Frau & Nav zunächst unsichtbar. `intro.js` animiert daraus rein.
- **Robustheit:** Ein **einmaliges `finish()`** (aus `onComplete` **oder** 4-s-Failsafe-Timeout) killt die Timeline, entfernt `intro-active` + den Sweep-Balken, `clearProps` und gibt Lenis frei. Dadurch kann der Header **nie hängenbleiben** und die Timeline sich nach einem Hintergrund-Tab (rAF pausiert) **nicht nachträglich** über bereits gezeigten Inhalt legen.
- **Scroll-Lock:** `TREFF.lenis.stop()` beim Start, `.start()` in `finish()`.
- **Reduced Motion / kein GSAP:** kein Intro, Header sofort sichtbar (Guard ganz oben).
- **Tuning:** `CONFIG`-Block oben in `js/intro.js` (Dauern, Ease, Balkenfarbe via `.intro-sweep` in CSS). Es werden **nur** Element-Eigenschaften animiert (kein SVG-Inlining) — Logo & Frau bleiben `<img src="…svg">`.

**Historie:** Ein früherer Loader (`js/loader.js`) wurde 2026-06-29 entfernt; dieser Sweep-Starter ist ein **Neuaufbau** (nicht aus alten Ständen zurückgeholt).

### `js/phasen.js` — Scrollytelling
Zickzack-Ablauf der 6 Bau-Phasen (nur `index.html`). Markup-Hook: `data-phasen` (Section) → `data-phasen-wrap` (Position-Parent) → `data-phasen-lines` (leeres `<svg>`, JS befüllt es) → je Phase `data-phase` mit `.phase--right`/`.phase--left` → `data-phase-end` (TREFF.-Badge). **Ungerade Phasen (1/3/5) = Box rechts (`.phase--right`), gerade (2/4/6) = Box links (`.phase--left`)** — falls das je gedreht werden soll, im HTML nur die `--right`/`--left`-Klassen tauschen (Figma + Referenz-Screenshot haben Phase 1 rechts).

- **Pro Übergang ein eigenes `<path>`** (nicht mehr eine durchgehende Linie): `build()` liest die Box-Mitten (`.phase__pille`-Rects relativ zum Wrap) und erzeugt je Segment einen 2×90°-Knick-Pfad von Box-Unterkante-Mitte → `midY` → nächste Box-Oberkante-Mitte, plus ein Schluss-Segment in `data-phase-end`. viewBox = `0 0 clientWidth clientHeight`, `preserveAspectRatio="none"` (viewBox == Pixelgröße → keine Verzerrung).
- **Jedes Segment „fließt" in SEINE Zielphase** per eigenem `ScrollTrigger` (`trigger: zielphase, start "top 92%", end "top 55%", scrub: 0.6`) → `strokeDashoffset len→0`. Dadurch animiert **jede** Phase gleich (früher zog eine einzige `scrub`-Linie über die ganze Section → nur die erste Phase lief sauber). Die Zielphase blendet **synchron** im selben Timeline (`autoAlpha 0→1` + `y 24→0`, `ease:"none"`) ein. Phase 1 hat kein eingehendes Segment → eigener Reveal-Trigger.
- **`scrub: 0.6`** glättet den Verlauf (flüssiges Mitfließen). **Kein** `is-active`/`is-dim`-Dimming mehr — der Reveal (`autoAlpha`) *ist* der „Phase für Phase"-Effekt; Phasen bleiben nach dem Einblenden sichtbar.
- **Resize:** `setup()` (debounced 200ms) = `killTriggers()` → `build()` neu → Trigger neu + `ScrollTrigger.refresh()`. **Reduced Motion / kein GSAP:** alle Segmente sofort `strokeDashoffset:0`, Phasen bleiben CSS-sichtbar (kein `autoAlpha:0` gesetzt).
- **Layout (CSS):** Section ist full-bleed bis **60px Rand** (`.phasen > .container` überschreibt `.container`). Jede `.phase` ist eine 100%-breite Flex-Reihe; `.phase--left` nutzt `flex-direction: row-reverse` **+ `justify-content: flex-end`** (nicht `flex-start` — in row-reverse packt `flex-start` nach *rechts*, das war der alte „alles rechtsbündig"-Bug). Box `width: min(1040px, 60%)` → linke/rechte Boxen bündig am 60px-Rand, in der Mitte überlappend (Zentren ~32%/68%) = Zickzack. Box-Innen: Titel + Beschreibung **nebeneinander** (`space-between`, ab ≥1500px), 16px-Verbindungspunkte via `::before/::after`. Responsive: ≤1499px Text gestapelt, ≤680px kein Stagger (alles linksbündig, gerade vertikale Linie).

### `js/parallax.js`
Eigenständiges Modul. Hook: `data-illu-parallax`.

### `js/video.js` — Videos (Explosion Ping-Pong + Tagesablauf Loop)
**Nur auf `index.html`** (Script-Tag nur dort, nach `faq.js`). Selbst-initialisierendes IIFE (kein `boot()`-Hook). Zwei Hooks: `[data-video-pingpong]` (Explosion, unten) und `[data-video-loop]` (Tagesablauf, oben). Gemeinsame `VIEW_RATIO = 0.35` (IntersectionObserver-Schwelle).

**`[data-video-loop]` — Tagesablauf** (`assets/videos/Tagesablauf.mp4`, obere `.video-sec`): **nahtloser Dauer-Loop** über natives `loop` (Browser-Neustart → kein Cut/Ruckler am Übergang), **Autoplay nur im View** (IntersectionObserver), **Pause beim Verlassen** (läuft nicht im Hintergrund weiter). Markup ohne `controls` + `disablepictureinpicture` + `tabindex="-1"` → keine Player-UI, keine Interaktion; `muted` (Autoplay-Pflicht), `preload="auto"`. Video ist 1920×1080 = exakt 16:9 → füllt den 16/9-Frame via `object-fit: cover` randabfallend ohne Balken. Reduced Motion / kein IO → statisch beim ersten Frame. **Kein** `autoplay`-Attribut (sonst liefe es out-of-view) — Start kommt aus `setupLoop()`.

**`[data-video-pingpong]` — Explosion** (`assets/videos/Explosion.mp4`, **untere** `.video-sec`). Verhalten:
- **Autoplay per IntersectionObserver** (ab ~35% im View), pausiert wieder beim Verlassen (spart CPU beim Rückwärts-Seeking). Video ist `muted` (Pflicht für Autoplay), **`controls` entfernt** (keine Player-UI), `preload="auto"` (voll gepuffert → Rückwärts-Seeking).
- **Ping-Pong-Loop:** vorwärts (normale Geschwindigkeit) → **5s Halt am letzten Frame** → rückwärts → **5s Halt am ersten Frame** → wiederholen. Halt via `setTimeout(5000)`.
- **Rückwärts wird manuell per rAF getrieben** (`backT -= dt` → `video.currentTime = backT`), weil Browser **negative `playbackRate` ignorieren**. Glätte hängt komplett an der **Keyframe-Dichte** des Encodes (Seek springt auf den vorherigen Keyframe). Deshalb ist `Explosion.mp4` bewusst **neu kodiert**: 4K-Original (`Explosion-original.mp4.bak`, 24fps, nur ~2 Keyframes) → **1600×906, Keyframe alle 6 Frames** (`ffmpeg -vf scale=1600:-2 -g 6 -keyint_min 6 -sc_threshold 0 -crf 20 -an`). Rückwärts-Seeks dadurch von ~50–110ms auf **~0–1ms** → flüssig. **Nicht** wieder auf einen Encode mit sparse Keyframes zurück, sonst hakt der Rückwärtslauf.
- **`loop` MUSS aus sein** (sonst feuert `ended` nie → kein Ping-Pong). Reduced Motion / kein IO → statisch beim ersten Frame, kein Loop/Autoplay.
- **Video-Legende** (`.video-legend`, direkt in `.video-sec` unter dem Video, aus Figma 2842:20891): zentrierte Flex-Row aus 5 `.video-legend__item` (16px-`__swatch` + Inter-Tight-Label). Reihenfolge/Farben (Swatch-Farbe inline): Außen Hülle `--graue-strasse`, Dämmung `--wilde-malve`, Verlattung `--kieselstein`, Innenwand `#2A2A2A`, Holzboden `#7C4F2A` (die letzten beiden ohne Token). `col-gap: clamp(1.5rem, 7.5vw, 7rem)` (bis 112px wie Figma), bricht auf schmalen Screens um.

### `js/faq.js` — Akkordeon (native `<details>` + GSAP)
Hook: `data-faq`. Nur ein Eintrag gleichzeitig offen; `summary`-Klick `preventDefault` + manuelles Toggle. Höhe **und** Eck-Radius morphen GSAP-synchron (`fromTo height 0↔scrollHeight` + `borderRadius` halbe-Höhe↔40px), Inhalt blendet per `autoAlpha`+`y` ein. Reduced-Motion/kein-GSAP → sofort auf/zu.

**Kritische Zustands-Trennung** (sonst keine Zuklapp-Animation):
- **`.is-open`** (Klasse) = **visueller** Zustand → BG, Icon-Rotation (`::before/::after`), Radius-Ziel. Wird beim Öffnen UND Schließen **sofort** umgeschaltet → BG/Icon morphen weich per CSS-Transition (`.5s var(--ease-out)`).
- **`[open]`** (Attribut) = hält den Body im DOM sichtbar. Öffnen: sofort setzen. Schließen: **erst im `onComplete`** entfernen — sonst blendet `<details>` den Body sofort aus und die Zuklapp-Animation fällt weg.
- CSS: `.faq-item` eingeklappt `border-radius: var(--r-pill)` (volle Pille), `.faq-item.is-open` → `40px`. Der Radius wird **per GSAP** getrieben (nicht CSS-Transition), weil `--r-pill` sonst auf die halbe Höhe clampt und beim Höhenwechsel „aufpoppt".
- **Padding-Floor-Falle (Ursache des „hakelnden" Schließens):** Der höhen-animierte `.faq-item__body` hat **kein** Padding. `box-sizing: border-box` lässt die Höhe sonst **nicht unter `padding-bottom`** schrumpfen → die Schließ-Animation friert bei ~`padding-bottom` ein und springt am Ende per `display:none` hart auf 0 (beim Öffnen durch den Fade kaschiert). Deshalb sitzt das Padding auf **`.faq-item__inner`**, der Body hat nur `overflow:hidden` und kann sauber auf echte `0` animieren. **Nie wieder Padding/Border auf ein höhen-animiertes Element legen.**

### `js/carousel.js` — Projekte-Slider
Läuft für **alle** `[data-carousel]` (Hooks: `data-carousel-track`, `data-carousel-dots`). Aktuell nur der **Projekte-Slider** (`.carousel__track` auf `index.html`): Maus-Drag + Klick-Unterdrückung nach echtem Drag, Smooth-Scroll-Engine + Cluster-Indicators. Volle Details unter [Karussell / Slider](#karussell--slider). **Die USP-Vorteile sind kein Slider mehr** — sie nutzen die statische `.card-grid`/`.card-pill`-Komponente (siehe [Karten-Raster (USP + Specs)](#karten-raster-usp--specs)).

### `window.TREFF` — globaler Namespace
`app.js` schreibt vor DOMContentLoaded:
- `TREFF.reduced` — `true` bei `prefers-reduced-motion` oder `?still=1`
- `TREFF.isTouch` — `true` bei Touch/Coarse-Pointer
- `TREFF.lenis` — Lenis-Instanz (nach Init)
- `TREFF.initPhasen` / `TREFF.initParallaxExtra` / `TREFF.initCarousel` / `TREFF.initFAQ` — von den jeweiligen Modulen registriert (exakte Namen, `FAQ` groß!), von `boot()` in genau dieser Reihenfolge aufgerufen

Alle Feature-Module greifen über `window.TREFF` auf diese Werte zu — kein direktes globales `gsap`/`lenis` außerhalb der Libs selbst.

## Wichtige CSS-Komponenten

### Nav (`.nav`)
Fixed, **unten mittig** (`bottom: 24px; left: 50%; transform: translateX(-50%)`). Liquid-Glass-Pille. Hover-Farben: Home→Lila, Text→Dunkle-Fichte, CTA→Schulbus-Gelb.

Die Nav ist ab dem ersten Frame sichtbar (außer auf `index.html`, wo der Sweep-Starter sie am Ende per **`autoAlpha`** einblendet). **Niemals GSAP auf die Nav-Transform anwenden** — würde die `translateX(-50%)`-Zentrierung zerstören (der Intro fadet deshalb nur `autoAlpha`, nicht `transform`).

Desktop-only (≤600px ausgeblendet, Prio 2).

### Generator-CTA (`.cta`)
Pille + oranger Kreis, Pfeil **immer 8×8 px**. Werte exakt aus Figma (Frame 232×72 am Max):
Pille Border **1px** `--carbon-schwarz`, Schrift **Inter Tight Regular (400)**, Padding 32/24 px,
Radius `--r-pill`. Kreis 56 px, BG `--flammen-orange`. Custom-Props: `--cta-gap .5rem` (8px Lücke),
`--cta-move 1rem` (16px Kreis-Shift im Hover), `--cta-inset: calc((var(--cta-h) - var(--cta-circle)) / 2)`
(= 8px am Max; hält den weißen Ring **bei jeder Breite** konzentrisch um den Kreis).

**Hover-Animation (kein Layout-Reflow, geschlossene Kontur in jedem Zustand):**
- `.cta__pill` hat immer volle Merge-Breite (`padding-right: cta-pad + cta-grow`, statisch), selbst **transparent & rahmenlos** — nur Text-Träger.
- Rahmen **+** weiße Füllung liegen auf **`.cta__pill::before`** (`position:absolute; inset 0; border 1px; border-radius --r-pill`). Die rechte Kante wird per **`right: var(--cta-grow)`** (unhovered) → **`right: 0`** (Hover) eingezogen/aufgezogen. Weil `::before` eine echte bordierte Box ist, ist die Outline im Unhovered-Mode eine **rundum geschlossene Pille** (kein abgeschnittener rechter Bogen).
- `.cta__circle` hat `margin-left: cta-gap - cta-grow` (negativ, kompensiert Extra-Breite); Hover: `translateX(-cta-move)`.
- Animiert werden nur `right` (auf der absolut positionierten `::before` → **kein** Reflow von Flex/Grid-Eltern) und `transform` (Kreis, GPU).
- Timing: Kontur (`::before right`) flüssig (`.5s` in / `.45s` out, `--ease-out`, **kein** Overshoot); Kreis leicht bouncy (`.55s` `--ease-bounce` in, `.45s` `--ease-out` out → ruhiger Rückweg).

**Historie:** Früher per `clip-path: inset(... round)` auf der bordierten Pille — das clippte den Rahmen an der Schnittkante hart weg (rechter Bogen „offen"). Ersetzt durch die `::before`-Right-Inset-Lösung.

**Nie wieder `padding-right`/`margin-right` auf `.cta__pill` (in-flow) animieren** — das löst Layout-Reflow in Flex/Grid-Eltern aus (Karussell-Bar, Modell-Bar, Kontakt-Grid) und erzeugt vertikale Sprünge. Das `right` auf der **absoluten `::before`** ist davon nicht betroffen.

### Karussell / Slider
Betrifft **nur den Projekte-Slider** auf `index.html` (`.carousel` → `.carousel__track` mit 9 `.proj-card`). Die USP-Vorteile sind kein Slider mehr (statisches Grid, siehe [Karten-Raster (USP + Specs)](#karten-raster-usp--specs)).

**Card-Maße:** `.proj-card { flex: 0 0 584px }`, Bild `figure.img-slot.proj-card__img` mit Inline `style="--ar: 584/617"` → Zielgröße **584×617**. (≤760px: `flex-basis: 80%`.)

**Slider-Insets** (Override-Block `.carousel__track`, schlägt die geteilte `padding-inline: var(--gutter)`-Regel):
`margin-left: 32px` (feste linke **Abschneidekante** — `overflow-x:auto` clippt Cards links davon) · `padding-left: 180px` (→ **212px** Startabstand der ersten Card) · `padding-right: 212px` (Endabstand) · `scroll-padding-left: 180px` (Snap-/Klick-Ziel = 212px). CSS-Default `scroll-snap-type: x proximity`.

**Smooth-Scroll-Engine** (`carousel.js`, nur wenn `!TREFF.reduced && track.classList.contains("carousel__track")`):
- Hält ein `target` und gleitet `scrollLeft` per **Frame-Lerp** (`EASE 0.135`) dorthin; setzt dabei `track.style.scrollSnapType = "none"` → **JS besitzt das Snapping** (kein CSS-Snap-Ruckeln).
- Maus-Drag geglättet (`smooth.drag`), beim Loslassen **Momentum** aus der Zeiger-Geschwindigkeit (`MOMENTUM 240`, auf `±1.4·clientWidth` gedeckelt), danach sanftes **Snap** auf nächste Card-Position (Kandidaten inkl. `0` und `maxScroll` → Anfang/Ende sind gültige Ruhepunkte).
- **Trackpad-Horizontal-Wheel** (`deltaX` dominant) geglättet; vertikales Wheel scrollt die Seite (kein Hijacking). Dot-Klick → `smooth.to(target, snap=true)`.
- **Fallback:** Reduced-Motion und **Touch** (`pointerType !== "mouse"`) nutzen nativen Scroll + CSS-`proximity`-Snap (Engine wird nicht erzeugt). Tuning über `EASE`/`MOMENTUM` oben in `carousel.js`.
- **Invariante:** Solange die Engine aktiv ist, **nie** CSS-`scroll-snap` auf `.carousel__track` reaktivieren — die Engine treibt `scrollLeft` selbst pro Frame.
- **Invariante (Klick-Navigation):** Der Drag hört während eines aktiven Zeigers auf **`window`** (`pointermove`/`pointerup`), **niemals** `track.setPointerCapture()` benutzen. Pointer-Capture leitet `pointerdown`+`pointerup` auf den Track um → das daraus synthetisierte `click` landet auf dem Track statt auf dem `<a>` darin, und CTA-Links (`.cta` → `projekte.html`) navigieren per **Linksklick gar nicht** (Hover/Rechtsklick funktionieren weiter, weil sie kein synthetisches `click` brauchen). Klick-Unterdrückung nach echtem Drag passiert separat über den Capture-`click`-Handler, gated auf `moved` (Schwelle **>10px**, damit Mini-Jitter den Klick nicht schluckt).

**Cluster-Indicators** (`.carousel__dots`, in JS generiert): `GROUP = 3` → **3 Balken** (1 je 3 Cards). Inaktiv **20×5** `--graue-strasse`, aktiv **80×5** (`width .55s`-Übergang). Die Orange ist eine eigene `.fill`-Ebene (`scaleX(0)` → bei `.is-active` `scaleX(1)`), die sich **richtungsabhängig einwischt**: der Scroll-Handler setzt `--fill-origin` auf `.carousel__dots` (vorwärts `left`, rückwärts `right`), `transform-origin` der Füllung folgt. Aktiver Cluster = Gruppe der Card, die der Snap-Linie (212px) am nächsten ist; Update läuft am `scroll`-Event.

> **Verifikation im Preview:** `serve.py` cached `js/*.js` hart → nach JS-Edit am `<script>`-Tag temporär `?v=N` anhängen, testen, zurücksetzen. Headless-Preview feuert **kein** `requestAnimationFrame` und kein `scroll`-Event bei programmatischem `scrollLeft`; rAF-/scroll-getriebene Logik per `requestAnimationFrame`-Override (setTimeout) bzw. `dispatchEvent(new Event("scroll"))` prüfen.

### Karten-Raster (USP + Specs)
Gemeinsame Komponente für die **USP-Vorteile** (`index.html`) und die **Modell-Specs** (`modell-4c/7c.html`). Eine Karte ist **immer exakt 280×168** (`.card-pill`: feste `width`/`height`, `box-sizing: border-box`, 1px `--carbon-schwarz`, `border-radius: 40px`, weiß, `display:flex; flex-direction:column; justify-content:space-between`). Hover (beide gleich): `translateY(-8px)` + `--shadow-card`.

**Raster** (`.card-grid`): `grid-template-columns: repeat(N, 280px)`, `gap: 16px`, **strikt 4 pro Reihe** ab `min-width: 1320px` (wo 4×280 + 3×16 = 1168px in den Container passen), darunter `2` (≥620px) bzw. `1` Spalte — die **Kartengröße bleibt immer 280×168**. Default linksbündig (`justify-content: start`); `.card-grid--end` schiebt den Rasterblock **rechtsbündig** (Specs).

- **USP** (`.card-grid.usp__grid` mit `.card-pill.usp-card`): Icon oben, 2-zeiliger Text unten (`space-between`). Icon nie verzerrt → `.usp-card__icon { width:36px; height:36px; object-fit:contain }` (feste ~36×36-Box, Original-Proportionen via `contain`). Kopf (`.usp__head`) linksbündig, Grid linksbündig.
- **Specs** (`.card-grid.card-grid--end.specs__grid` mit `.card-pill.spec`): **kein Icon**. `.spec` überschreibt `justify-content: flex-end` (Label + Wert als Paar unten linksbündig, `gap:.4rem`). Kopf (`.specs__head`, statt `stack-center`) **linksbündig** (`.section-title` → `text-align:left`), Grid **rechtsbündig**. Beide via zwei `.container` getrennt (Abstand aus `.section > .container + .container`).

### Kontaktformular & Custom-Dropdown
Das Formular (`.form-card`) ist eine **geteilte Komponente** — es steht ganz unten auf allen vier Inhaltsseiten (`index/modell-4c/modell-7c/projekte`) **und** ist der Hauptinhalt von `kontakt.html`. Änderungen am Formular immer in **allen fünf** Dateien spiegeln.

`initDropdown()` (in `app.js`) ist **generisch für alle `[data-dropdown]`** und bedient zwei Felder: die **Modell-Auswahl** und die **Ländervorwahl** (`.dropdown--code`). Mechanik: `.dropdown__toggle`-Klick toggelt `.is-open` (→ zeigt `.dropdown__menu`), Option-Klick schreibt deren `data-value` in `.dropdown__value`, Außenklick + Escape schließen alle.

**Ländervorwahl** (`.dropdown--code`, 10 EU-Länder mit Flaggen-Emoji, identisch in allen 5 Dateien): liegt in der schmalen `.field--code`-Pille, deshalb Menü `min-width: max-content` + `right:auto` (wächst nach rechts statt die Pille zu sprengen). Das `<ul class="dropdown__menu">` ist **scrollbar** (`max-height` + `overflow-y:auto`) und trägt **`data-lenis-prevent`** — sonst kapert Lenis das Mausrad und scrollt die Seite statt des Menüs.

### Section-Insets & Full-Bleed
Sektionen sind standardmäßig per innerem `.container` (`max-width: var(--content-max)` + `padding-inline: var(--gutter)`) eingerückt. Abweichungen (Stand zuletzt aus Figma):
- **`.video-sec > .container`**: full-bleed (`max-width: none; padding-inline: 0`).
- **`.galerie-gross > .container`**: `max-width: none; padding-inline: 32px` (32px Rand); `.galerie-gross__grid { gap: 16px }` + Inline-`margin-top: 16px` als 16px-Gaps zwischen den Bildframes.
- **`.phasen > .container`**: `max-width: none; padding-inline: 60px` (60px Rand) — der Phasen-Zickzack füllt die Breite bis auf 60px links/rechts; ≤680px auf 20px reduziert (siehe [`js/phasen.js`](#jsphasenjs--scrollytelling)).
- **`.header__hero` / `.subhead__hero`** brechen aus dem zentrierten `.header`/`.subhead` (flex-column, `align-items:center`, `padding-inline: var(--gutter)`) auf **exakt 32px Viewport-Rand** aus — per `width: calc(100% + 2*var(--gutter) - 64px); margin-inline: calc(32px - var(--gutter)); max-width: none`. **Wichtig:** der Selektor muss `.header > .header__hero` bzw. `.subhead > .subhead__hero` sein (Spezifität), sonst gewinnt `.header > * / .subhead > * { max-width: 100% }` aus dem Responsive-Block und klemmt die Breite. `.subhead__title` (Chunko) ist fix `280px` (Mobile-Override bei ≤600px bleibt).

### Bachelor-Credits (`.bachelor`)
**Nur `index.html`**, steht als `<section>` **bewusst UNTER `</footer>`** (außerhalb `<main>`) — nicht „reparieren" durch Verschieben nach innen. Dunkler Full-Width-Block (`--carbon-schwarz`), zentriert; „■ Bachelorarbeit" (16px `--flammen-orange`-Quadrat + Text), zwei Namen nebeneinander (Name 42px / Rolle 24px), großer Abstand, unten Hochschule/Semester in `rgba(230,230,230,.5)`. 1:1 aus Figma `2626:10928` (pt 220 / pb 80 / gap 320 → als fluide `clamp()` umgesetzt).

### Container-Badge (`.container-badge`)
Schwarzer Kasten mit TREFF.-Wortmarke am Ende des Phasen-Zickzacks (`data-phase-end`, nur `index.html`). `background: --carbon-schwarz`, **`border-radius: 0`** (eckig, bewusst — nicht wieder abrunden), `--shadow-card`. Logo per `filter: invert(1) brightness(2)` weiß.

### Animations-Hooks (Markup → JS)
| Attribut | Effekt |
|---|---|
| `data-reveal[="up\|left\|right\|scale"]` | Einblend-Animation (ScrollTrigger) |
| `data-parallax="0.2"` | Parallax-Faktor |
| `data-float` | Schwebeanimation |
| `.js-bounce` | Hover-Scale (GSAP) |
| `data-illu-parallax` | Illustration-Parallax |
| `data-phasen` | Phasen-Scrollytelling |
| `data-carousel` / `data-carousel-track` | Karussell |
| `data-faq` | FAQ-Akkordeon |
| `data-dropdown` | Custom-Dropdown (Modell-Auswahl + Ländervorwahl) |
| `data-lenis-prevent` | Element scrollt nativ (Lenis kapert das Rad nicht) — z.B. Vorwahl-Menü |
| `data-video-pingpong` | Video: Autoplay im View, keine UI, Vor-/Rückwärts-Loop mit 5s-Halt (`js/video.js`, nur index) |
| `data-video-loop` | Video: Autoplay im View, keine UI, nahtloser Dauer-Loop, Pause außerhalb (`js/video.js`, nur index, Tagesablauf) |

## Inhalte & Assets

- **Texte:** direkt im HTML, Sektions-Kommentare als Marker (`<!-- ===== SPECS 4C ===== -->`)
- **Bilder:** Platzhalter (dunkle Slots). Echtes Bild mit Name aus `references/bildplan.md` in `assets/images/` ablegen → erscheint automatisch
- **Illustrationen:** `assets/illustrations/` — gleicher Dateiname ersetzt die SVG
- **Videos:** `assets/videos/` — Platzhalter-Slots, analog zu Bildern einpflegen. **Ausnahmen (`index.html`):** die **obere** `.video-sec` bindet `Tagesablauf.mp4` als nahtlosen Dauer-Loop (`data-video-loop`), die **untere** `Explosion.mp4` mit Ping-Pong-Autoplay (`data-video-pingpong`) ein — beide via [`js/video.js`](#jsvideojs--videos-explosion-ping-pong--tagesablauf-loop). **Dateiname case-sensitiv** (GitHub Pages!): `Tagesablauf.mp4` (großes T).
- **Fonts:** `fonts/` — Chunko Bold (`.otf/.ttf/.woff2`) + Inter Tight Regular/Medium (`.ttf/.woff2`); alle lokal, kein CDN

## Bekannte Einschränkungen

- **Mobile/Tablet:** Nav auf ≤600px ausgeblendet (Prio 2, noch nicht umgesetzt)
- **Bilder/Videos:** Platzhalter-Slots; echte Assets über `references/bildplan.md` einpflegen
