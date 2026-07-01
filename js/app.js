/* =====================================================================
   TREFF. — app.js  (Motion-Core)
   Lädt nach js/lib/*.  Initialisiert Lenis (Smooth Scroll) + GSAP,
   und stellt wiederverwendbare Bewegungs-Helfer bereit:
     • Reveal beim Scrollen            [data-reveal]
     • Parallax (Tiefe)                [data-parallax="0.2"]
     • Schwebende Deko-Elemente        [data-float]
     • Button-/Pillen-Bounce on hover  .js-bounce
     • Sticky-Nav-Verhalten
   Bewegungs-first: Effekte nutzen transform (GPU), kaum Opacity.
   ===================================================================== */
(function () {
  "use strict";

  // ?still=1 -> Vorschau ohne Bewegung (auch nützlich als Reduced-Motion-Preview)
  const STILL = new URLSearchParams(location.search).get("still") === "1";
  const REDUCED = STILL || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const IS_TOUCH = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  // Globaler Namespace, damit Feature-Module (phasen/carousel/faq) andocken können
  const TREFF = (window.TREFF = window.TREFF || {});
  TREFF.reduced = REDUCED;
  TREFF.isTouch = IS_TOUCH;

  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Draggable) gsap.registerPlugin(Draggable);
  }

  /* ------------------------------------------------------------------
     1) Lenis Smooth-Scroll  ↔  GSAP ScrollTrigger
  ------------------------------------------------------------------ */
  let lenis = null;
  function initSmoothScroll() {
    if (REDUCED || typeof window.Lenis === "undefined") return;
    lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      // Auf Touch lieber natives Scrollen (Performance/Feel)
      smoothTouch: false,
      touchMultiplier: 1.6,
    });
    TREFF.lenis = lenis;
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // Anker-Links (#…) sanft über Lenis scrollen
  function initAnchorScroll() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -120, duration: 1.1 });
      else target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
    });
  }

  /* ------------------------------------------------------------------
     2) Reveal beim Scrollen  —  Bewegung (y/scale), minimal Opacity
        <h2 data-reveal>…</h2>   <div data-reveal="left">…</div>
  ------------------------------------------------------------------ */
  function initReveals() {
    const items = gsap.utils.toArray("[data-reveal]");
    items.forEach((el) => {
      const dir = el.dataset.reveal || "up";
      const from = { autoAlpha: 0.001 };
      if (dir === "up") from.y = 48;
      else if (dir === "down") from.y = -48;
      else if (dir === "left") from.x = 56;
      else if (dir === "right") from.x = -56;
      else if (dir === "scale") { from.scale = 0.9; from.transformOrigin = "50% 60%"; }
      gsap.from(el, {
        ...from,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
    });
  }

  /* ------------------------------------------------------------------
     3) Parallax-Engine  (siehe auch parallax.js für Spezialfälle)
        <img data-parallax="0.25">  -> bewegt sich relativ zum Scroll
  ------------------------------------------------------------------ */
  function initParallax() {
    const speedMobile = IS_TOUCH ? 0.45 : 1; // auf Mobile abgeschwächt
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const speed = parseFloat(el.dataset.parallax || "0.2") * speedMobile;
      const dist = (el.dataset.parallaxDist ? parseFloat(el.dataset.parallaxDist) : 120) * speed;
      gsap.fromTo(
        el,
        { yPercent: -dist / 8 },
        {
          yPercent: dist / 8,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("[data-parallax-scope]") || el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
  }

  /* ------------------------------------------------------------------
     4) Schwebende Deko-Elemente (Idle-Float, Endlosschleife)
        <img class="deco" data-float>  optional data-float-x / -rot
  ------------------------------------------------------------------ */
  function initFloating() {
    if (REDUCED) return;
    gsap.utils.toArray("[data-float]").forEach((el, i) => {
      const amp = parseFloat(el.dataset.float) || 14;
      const rot = parseFloat(el.dataset.floatRot || "4");
      gsap.to(el, {
        y: amp, rotation: rot,
        duration: 2.4 + (i % 4) * 0.4,
        ease: "sine.inOut",
        yoyo: true, repeat: -1,
        delay: (i % 5) * 0.25,
      });
    });
  }

  /* ------------------------------------------------------------------
     5) Hover-Bounce für Pillen/Buttons (Nav + CTAs)
        Skaliert kurz hoch und federt zurück. Kein Klick-Effekt.
  ------------------------------------------------------------------ */
  function initBounce() {
    if (REDUCED) return;
    document.querySelectorAll(".js-bounce").forEach((el) => {
      const s = el.classList.contains("nav__pill--cta") ? 1.03 : 1.06;
      let tween;
      el.addEventListener("mouseenter", () => {
        if (tween) tween.kill();
        tween = gsap.to(el, { scale: s, duration: 0.42, ease: "back.out(3)" });
      });
      el.addEventListener("mouseleave", () => {
        if (tween) tween.kill();
        tween = gsap.to(el, { scale: 1, duration: 0.3, ease: "power2.out" });
      });
    });
  }

  /* ------------------------------------------------------------------
     6) Sticky-Nav: Pille beim Scrollen kompakt/sichtbar halten
  ------------------------------------------------------------------ */
  function initNav() {
    const nav = document.querySelector("[data-nav]");
    if (!nav) return;
    let lastY = 0;
    const update = (y) => {
      nav.classList.toggle("is-scrolled", y > 80);
      lastY = y;
    };
    if (lenis) lenis.on("scroll", ({ scroll }) => update(scroll));
    else window.addEventListener("scroll", () => update(window.scrollY), { passive: true });
  }

  /* ------------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  // Fehlende Bild-Slots sauber als dunklen Kasten zeigen (kein Broken-Icon)
  function initImageSlots() {
    document.querySelectorAll(".img-slot > img").forEach((img) => {
      const hide = () => { img.style.visibility = "hidden"; };
      const show = () => { if (img.naturalWidth > 0) img.style.visibility = "visible"; };
      if (img.complete) { img.naturalWidth === 0 ? hide() : show(); }
      img.addEventListener("error", hide);
      img.addEventListener("load", show);
    });
  }

  // Custom-Dropdown (generisch für alle [data-dropdown]: Kontakt „Modell" + Ländervorwahl):
  // wählt aus, schließt, zeigt `data-value` der Option in der Pille; Außenklick & Escape schließen.
  function initDropdown() {
    const dropdowns = document.querySelectorAll("[data-dropdown]");
    if (!dropdowns.length) return;
    dropdowns.forEach((dd) => {
      const toggle = dd.querySelector(".dropdown__toggle");
      const valueEl = dd.querySelector("[data-dropdown-value]");
      const options = dd.querySelectorAll(".dropdown__option");
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = dd.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      options.forEach((opt) => {
        opt.addEventListener("click", () => {
          valueEl.textContent = opt.dataset.value;
          valueEl.classList.remove("is-placeholder");
          options.forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
          dd.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    });
    const closeAll = () => document.querySelectorAll("[data-dropdown].is-open").forEach((d) => {
      d.classList.remove("is-open");
      d.querySelector(".dropdown__toggle")?.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("click", closeAll);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  }

  function boot() {
    initImageSlots();
    initDropdown();
    initSmoothScroll();
    initAnchorScroll();
    initNav();
    if (hasGSAP && !REDUCED) {
      initReveals();
      initParallax();
    }
    if (hasGSAP) {
      initFloating();
      initBounce();
    }
    // Feature-Module starten, falls vorhanden & passende Elemente da sind
    ["initPhasen", "initParallaxExtra", "initCarousel", "initFAQ"].forEach((fn) => {
      if (typeof TREFF[fn] === "function") {
        try { TREFF[fn](); } catch (err) { console.warn("[TREFF]", fn, err); }
      }
    });
    if (hasGSAP) ScrollTrigger.refresh();
  }

  TREFF.boot = boot;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
