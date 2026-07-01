/* =====================================================================
   TREFF. — carousel.js
   Premium-Karussell für [data-carousel] (Projekte-Slider auf index.html).
   • Smooth-Scroll-Engine: lerp-geglätteter Drag mit Trägheit + sanftes
     JS-Snap — kein hartes 1:1-Scrollen, kein ruckelndes CSS-Snap.
     Trackpad-Horizontal-Wheel weich; vertikales Wheel scrollt die Seite.
   • Cluster-Indicators: richtungsabhängige Füllung, frame-genau an Scroll gekoppelt.
   • Reduced-Motion / Touch: nativer Scroll (kein Override).
   Hinweis: Die USP-Vorteile sind seit dem Grid-Umbau KEIN Slider mehr — sie
   nutzen die statische .card-grid/.card-pill-Komponente in css/style.css.
   ===================================================================== */
(function () {
  "use strict";
  const TREFF = (window.TREFF = window.TREFF || {});

  TREFF.initCarousel = function () {
    document.querySelectorAll("[data-carousel]").forEach(setup);
  };

  function setup(root) {
    const track = root.querySelector("[data-carousel-track]");
    if (!track) return;
    const cards = Array.from(track.children);
    const padLeft = () => parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;

    /* ---------------------------------------------------------------
       Smooth-Scroll-Engine — nur für den Projekte-Slider & wenn Motion
       erlaubt. Hält ein Ziel und gleitet scrollLeft per Frame-Lerp dorthin;
       nach dem Ausrollen sanftes Snap auf die nächste Card-Position.
       --------------------------------------------------------------- */
    const EASE = 0.135;        // Lerp pro Frame – kleiner = weicher/träger
    const MOMENTUM = 240;      // ms-Faktor für Wurf-Trägheit nach dem Loslassen
    const isMain = track.classList.contains("carousel__track");
    const smooth = (!TREFF.reduced && isMain) ? createSmooth() : null;

    function createSmooth() {
      track.style.scrollSnapType = "none";   // JS übernimmt das Snapping (kein CSS-Ruckeln)
      let target = track.scrollLeft;
      let raf = null;
      let dragging = false;
      let settling = false;                   // true: Ziel ist bereits eine Ruheposition
      const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
      const clamp = (v) => Math.max(0, Math.min(maxScroll(), v));

      const snapTarget = (pos) => {
        const tLeft = track.getBoundingClientRect().left;
        const pad = padLeft();
        const sl = track.scrollLeft;
        const cands = [0, maxScroll()];        // Anfang & Ende sind gültige Ruhepunkte
        cards.forEach((c) => cands.push(c.getBoundingClientRect().left - tLeft + sl - pad));
        let best = pos, bestD = Infinity;
        cands.forEach((p) => { const cp = clamp(p), d = Math.abs(cp - pos); if (d < bestD) { bestD = d; best = cp; } });
        return best;
      };

      const tick = () => {
        const cur = track.scrollLeft;
        let diff = target - cur;
        if (!dragging && !settling && Math.abs(diff) < 8) {  // ausgerollt → sanft snappen
          target = snapTarget(cur); settling = true; diff = target - cur;
        }
        if (Math.abs(diff) < 0.25) { track.scrollLeft = target; raf = null; return; }
        track.scrollLeft = cur + diff * EASE;
        raf = requestAnimationFrame(tick);
      };
      const ensure = () => { if (raf == null) raf = requestAnimationFrame(tick); };

      return {
        to(v, snap) { target = clamp(v); settling = !!snap; ensure(); },
        nudge(d) { target = clamp(target + d); settling = false; ensure(); },
        beginDrag() { dragging = true; settling = true; target = track.scrollLeft; },
        drag(v) { dragging = true; settling = true; target = clamp(v); ensure(); },
        endDrag(momentum) { dragging = false; settling = false; target = clamp(target + momentum); ensure(); }
      };
    }

    /* ---- Drag-to-scroll (Maus geglättet; Touch → nativer System-Scroll) ----
       WICHTIG: KEIN track.setPointerCapture(). Pointer-Capture leitet pointerdown
       UND pointerup auf den Track um; das daraus synthetisierte `click` landet dann
       als gemeinsamer Vorfahr auf dem Track statt auf dem <a> darin → ein CTA-Link
       („Zum Projekt" → projekte.html) würde per normalem Linksklick NIE navigieren
       (Hover/Rechtsklick gingen weiter, weil die kein synthetisches click brauchen).
       Stattdessen lauschen wir während eines aktiven Drags auf window — so läuft das
       Ziehen auch außerhalb des Tracks weiter, das `click` feuert aber auf dem echten
       Ziel (dem <a>) und navigiert sauber. */
    let down = false, startX = 0, startScroll = 0, moved = false;
    let lastX = 0, lastT = 0, vel = 0;
    const now = () => (window.performance && performance.now) ? performance.now() : +new Date();

    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      // Klick-Toleranz: erst ab >10px gilt es als echtes Ziehen. Darunter bleibt es ein
      // Klick → CTA-Links wie „Zum Projekt" (→ projekte.html) navigieren trotz Mini-Jitter.
      if (Math.abs(dx) > 10) moved = true;
      const t = now(), dt = t - lastT;
      if (dt > 0) { vel = (lastX - e.clientX) / dt; lastX = e.clientX; lastT = t; }  // px/ms in Scrollrichtung
      if (smooth) smooth.drag(startScroll - dx);
      else track.scrollLeft = startScroll - dx;
    };
    const release = () => {
      if (!down) return;
      down = false; track.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      if (smooth) {
        const cap = track.clientWidth * 1.4;
        const m = Math.max(-cap, Math.min(cap, vel * MOMENTUM));   // gedeckelte Wurf-Trägheit
        smooth.endDrag(m);
      }
    };

    track.addEventListener("pointerdown", (e) => {
      if (smooth && e.pointerType !== "mouse") return;   // Touch: nativer Scroll + System-Momentum
      down = true; moved = false;
      startX = e.clientX; startScroll = track.scrollLeft;
      lastX = e.clientX; lastT = now(); vel = 0;
      track.classList.add("is-dragging");
      if (smooth) smooth.beginDrag();
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    });
    track.addEventListener("dragstart", (e) => e.preventDefault());
    // Klick nach echtem Drag unterdrücken (sonst springt der CTA-Link)
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    /* ---- Trackpad-Horizontal-Wheel weich; vertikal scrollt die Seite ---- */
    if (smooth) {
      track.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;   // vertikale Absicht → Seite scrollen lassen
        e.preventDefault();
        smooth.nudge(e.deltaX);
      }, { passive: false });
    }

    /* ---- Cluster-Indicators: 1 Indicator je GROUP Cards (z.B. 9 Cards → 3) ---- */
    const dotsWrap = root.querySelector("[data-carousel-dots]");
    if (!dotsWrap || !cards.length) return;
    const GROUP = 3;
    const groupCount = Math.ceil(cards.length / GROUP);
    for (let g = 0; g < groupCount; g++) {
      const firstCard = cards[g * GROUP];
      const from = g * GROUP + 1, to = Math.min((g + 1) * GROUP, cards.length);
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Projekte " + from + "–" + to);
      const fill = document.createElement("span");   // orange, gerichtete Füllung
      fill.className = "fill";
      b.appendChild(fill);
      b.addEventListener("click", () => {
        const left = firstCard.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - padLeft();
        if (smooth) smooth.to(Math.max(0, left), true);
        else track.scrollTo({ left: Math.max(0, left), behavior: TREFF.reduced ? "auto" : "smooth" });
      });
      dotsWrap.appendChild(b);
    }
    const dots = Array.from(dotsWrap.children);

    /* ---- Aktiver Balken + richtungsabhängige Füllung (an Scroll gekoppelt) ----
       Aktiver Cluster = Balken, dessen Start-Card der Snap-Linie am nächsten ist.
       Beim Wechsel wischt die orange Füllung in Scrollrichtung ein
       (vorwärts von links, rückwärts von rechts) → kein harter Farbsprung. */
    let activeGroup = -1;
    let lastScroll = track.scrollLeft;
    const update = () => {
      const sl = track.scrollLeft;
      if (sl > lastScroll + 0.5) { dotsWrap.style.setProperty("--fill-origin", "left"); lastScroll = sl; }
      else if (sl < lastScroll - 0.5) { dotsWrap.style.setProperty("--fill-origin", "right"); lastScroll = sl; }
      const snapLine = track.getBoundingClientRect().left + padLeft();
      let idx = 0, min = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - snapLine);
        if (d < min) { min = d; idx = i; }
      });
      const ag = Math.min(groupCount - 1, Math.floor(idx / GROUP));
      if (ag !== activeGroup) {
        activeGroup = ag;
        dots.forEach((d, i) => d.classList.toggle("is-active", i === ag));
      }
    };
    track.addEventListener("scroll", update, { passive: true });
    update();
  }
})();
