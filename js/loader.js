/* =====================================================================
   TREFF. — js/loader.js  (Lade- & Cursor-Animation als State Machine)

   Phasen:
     1) intro-hidden-ui          weißer Screen, gesamte UI versteckt
     2) logo-loading-follow-cursor  Logo füllt sich (Wasserstand) + folgt Maus
     3) logo-transition-to-header   Logo fliegt direkt in die Header-Position
     4) header-active            nativer Cursor zurück, UI eingeblendet

   • Organische Wasserlinie: hohe, nahtlos loopende Sinus-SVG (GPU-Transforms).
   • Single-Node-Morph: dasselbe Logo füllt sich, folgt der Maus UND fliegt in
     den Header (kein DOM-Tausch -> kein Flackern, nie zwei Logos gleichzeitig).
   • Läuft 1×/Session (sessionStorage). Touch / Reduced-Motion: Kurzform.
   Lädt NACH gsap + app.js. Das weiße Overlay liegt bereits im HTML.
   ===================================================================== */
(function () {
  "use strict";

  var loader = document.querySelector("[data-loader]");
  if (!loader) return;

  /* ---------------- Guards (einmalig ausgewertet) ---------------- */
  var STILL    = new URLSearchParams(location.search).get("still") === "1";
  var REDUCED  = STILL || matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IS_TOUCH = matchMedia("(hover: none), (pointer: coarse)").matches;
  var SEEN     = sessionStorage.getItem("treff_loaded") === "1";
  var hasGSAP  = typeof window.gsap !== "undefined";
  var hasST    = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  var FAST     = SEEN || !hasGSAP || REDUCED;   // -> direkt in den Endzustand

  var logo       = loader.querySelector(".loader__logo");
  var fill       = loader.querySelector(".loader__fill");
  var headerLogo = document.querySelector(".header__logo");
  var headerImg  = headerLogo && headerLogo.querySelector("img");
  var nav        = document.querySelector("[data-nav]");

  var finished = false;   // header-active darf nur 1× laufen (idempotent)

  /* ---------------- geteilte Helfer ---------------- */
  function lockScroll(lock) {
    document.body.classList.toggle("is-loading", lock);
    var lenis = window.TREFF && window.TREFF.lenis;
    if (lenis) { lock ? lenis.stop() : lenis.start(); }
  }

  // Konkurrierenden header__logo-Reveal abschalten: sonst gäbe es nach der
  // Landung einen zweiten scale-Pop aus app.js initReveals(). loader.js läuft
  // beim Parsen (vor DOMContentLoaded/boot) -> removeAttribute verhindert, dass
  // der Trigger überhaupt entsteht; das Killen fängt evtl. schon Bestehende ab.
  function neutralizeHeaderReveal() {
    if (!headerLogo) return;
    headerLogo.removeAttribute("data-reveal");
    if (hasST) {
      ScrollTrigger.getAll().forEach(function (st) {
        if (st.trigger === headerLogo) st.kill();
      });
    }
    if (hasGSAP) gsap.set(headerLogo, { clearProps: "all" });
  }

  /* ============================================================
     Organic Liquid Waterline — baut die Wellen-SVG in .loader__fill.
     API: rise(dur) / startRipple() / stopRipple()
     ============================================================ */
  function buildWave(fillEl) {
    var NS = "http://www.w3.org/2000/svg";
    var PERIOD = 50, AMP = 5.5, BASE = 14;   // Wellen-Geometrie (viewBox-Einheiten)
    var W = 100, EXTRA = PERIOD, END = W + EXTRA;   // 150 = eine Periode breiter -> nahtloser Loop
    var N = 64;                                       // Sampling der Sinuskurve
    var yAt = function (x) { return BASE + AMP * Math.sin((2 * Math.PI * x) / PERIOD); };

    var d = "M 0 " + yAt(0).toFixed(2);
    for (var i = 1; i <= N; i++) {
      var x = (END * i) / N;
      d += " L " + x.toFixed(2) + " " + yAt(x).toFixed(2);
    }
    d += " L " + END + " 300 L 0 300 Z";   // tiefer Körper -> immer voll unter dem Kamm

    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "loader__wave");
    svg.setAttribute("viewBox", "0 0 " + END + " 300");
    svg.setAttribute("preserveAspectRatio", "none");

    var cs    = getComputedStyle(document.documentElement);
    var grey  = (cs.getPropertyValue("--kieselstein")    || "#696969").trim();
    var black = (cs.getPropertyValue("--carbon-schwarz") || "#1A1A1A").trim();

    var defs = document.createElementNS(NS, "defs");
    var grad = document.createElementNS(NS, "linearGradient");
    grad.setAttribute("id", "treffWaveGrad");
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "0"); grad.setAttribute("y2", "1");
    // Kamm grau, darunter durchgehend schwarz -> "voll" liest als reines Schwarz.
    [["0", grey], ["0.16", black], ["1", black]].forEach(function (sc) {
      var s = document.createElementNS(NS, "stop");
      s.setAttribute("offset", sc[0]); s.setAttribute("stop-color", sc[1]);
      grad.appendChild(s);
    });
    defs.appendChild(grad);

    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "url(#treffWaveGrad)");

    svg.appendChild(defs);
    svg.appendChild(path);

    fillEl.innerHTML = "";
    fillEl.appendChild(svg);
    gsap.set(fillEl, { yPercent: 101 });

    var rippleTween = null;
    return {
      rise: function (duration) {
        return gsap.fromTo(fillEl,
          { yPercent: 101 },
          { yPercent: 0, duration: duration || 1.9, ease: "power1.inOut" });
      },
      startRipple: function () {
        if (rippleTween) return;
        var shiftPct = -(PERIOD / END) * 100;   // exakt eine Periode = -33.333%
        rippleTween = gsap.fromTo(svg, { xPercent: 0 },
          { xPercent: shiftPct, duration: 2.6, ease: "none", repeat: -1 });
        gsap.fromTo(path, { yPercent: 0 },
          { yPercent: 1.2, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
      },
      stopRipple: function () {
        if (rippleTween) { rippleTween.kill(); rippleTween = null; }
        gsap.killTweensOf(path);
        gsap.set(svg, { xPercent: 0 });
        gsap.set(path, { yPercent: 0 });   // Kamm einfrieren -> solides Objekt im Flug
      }
    };
  }

  /* ============================================================
     STATE 4: header-active  (terminal, idempotent)
     ============================================================ */
  function enterHeaderActive() {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem("treff_loaded", "1"); } catch (e) {}

    // Reihenfolge: erst Header-Bild zeigen, dann Overlay weg (gleicher Tick,
    // kein Repaint dazwischen) -> garantiert kein 1-Frame-Loch beim Tausch.
    if (headerImg) headerImg.style.visibility = "visible";
    loader.classList.remove("is-cursor");          // nativer Cursor zurück
    loader.hidden = true;

    // Nav-Auftritt rein via CSS-Transition:
    //   1) is-hidden sicherstellen (hält nav unten, während is-intro fällt)
    //   2) is-intro entfernen  ->  body.is-intro .nav greift nicht mehr
    //   3) nach 200 ms Transition einschalten + is-hidden entfernen
    //      -> CSS animiert translateX(-50%) translateY(160%) -> translateX(-50%)
    //   Kein GSAP-Transform-Eingriff = keine Pixel-/Prozent-Mismatch, kein Links-Versatz.
    if (nav) {
      nav.classList.add("is-hidden");   // versteckt halten
      nav.style.transition = "none";    // Übergang kurz sperren
    }
    document.body.classList.remove("is-intro");    // Header-Chrome sichtbar
    lockScroll(false);

    if (nav) {
      setTimeout(function () {
        nav.style.transition = "";      // Transition wieder freigeben
        requestAnimationFrame(function () {
          nav.classList.remove("is-hidden");   // CSS animiert von unten rein, zentriert
        });
      }, 200);
    }

    if (hasST) ScrollTrigger.refresh();
    document.dispatchEvent(new CustomEvent("treff:loaded"));
  }

  /* ============================================================
     STATE 3: logo-transition-to-header  (Single-Node-Morph)
     Logo fliegt von der letzten Cursor-Position direkt in den Header.
     ============================================================ */
  function enterTransition() {
    if (!headerLogo) { enterHeaderActive(); return; }
    gsap.killTweensOf(logo);   // Cursor-Follow (quickTo) beenden -> sauberer Direktflug
    var from = logo.getBoundingClientRect();
    var to   = headerLogo.getBoundingClientRect();
    if (!to.width || !from.width) { enterHeaderActive(); return; }

    var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    var scale = to.width / from.width;
    var curX = gsap.getProperty(logo, "x");
    var curY = gsap.getProperty(logo, "y");
    var curS = gsap.getProperty(logo, "scale") || 1;

    // Direkter Flug in die Header-Position. Loader-Logo und Header-Bild sind am
    // Ziel deckungsgleich + identisch (gleiches Wordmark) -> der atomare Tausch
    // in enterHeaderActive ist nahtlos (kein Fade gegen das weiße Overlay nötig,
    // das ohnehin verdeckt -> sonst nur ein Aufblitzen ins Weiße).
    gsap.to(logo, {
      x: curX + dx, y: curY + dy, scale: curS * scale,
      duration: 0.9, ease: "power3.inOut",
      onComplete: enterHeaderActive
    });
  }

  /* ============================================================
     STATE 2: logo-loading-follow-cursor
     ============================================================ */
  function enterLoading() {
    var wave = buildWave(fill);
    wave.startRipple();

    var onMove = null;
    if (!IS_TOUCH) {
      loader.classList.add("is-cursor");
      var w = logo.offsetWidth, h = logo.offsetHeight;
      gsap.set(logo, { x: innerWidth / 2 - w / 2, y: innerHeight / 2 - h / 2 });
      var xTo = gsap.quickTo(logo, "x", { duration: 0.28, ease: "power3" });
      var yTo = gsap.quickTo(logo, "y", { duration: 0.28, ease: "power3" });
      onMove = function (e) { xTo(e.clientX - w / 2); yTo(e.clientY - h / 2); };
      addEventListener("mousemove", onMove);
    }

    var dur = IS_TOUCH ? 5.2 : 6;   // Ladeanimation ~6 s
    gsap.timeline()
      .add(wave.rise(dur))
      .add(function () {
        if (onMove) removeEventListener("mousemove", onMove);   // erst einfrieren
        wave.stopRipple();                                       // Kamm glätten
        enterTransition();                                       // dann fliegen
      });
  }

  /* ============================================================
     STATE 1: intro-hidden-ui  (Boot)
     ============================================================ */
  function enterIntro() {
    neutralizeHeaderReveal();
    if (headerImg) headerImg.style.visibility = "hidden";   // Box bleibt -> kein Shift

    if (FAST) {
      // Reduced / schon gesehen / kein GSAP: direkt in den Endzustand.
      if (fill && hasGSAP) gsap.set(fill, { yPercent: 0 });
      else if (fill) fill.style.transform = "translateY(0%)";
      enterHeaderActive();
      return;
    }

    document.body.classList.add("is-intro");                 // Chrome verstecken
    lockScroll(true);

    // Robust: bricht die Kette, landet die Seite trotzdem nutzbar im Endzustand.
    try { enterLoading(); }
    catch (err) {
      console.warn("[TREFF] Loader-Intro fehlgeschlagen, springe zum Header.", err);
      enterHeaderActive();
    }
  }

  enterIntro();
})();
