/* =====================================================================
   TREFF. — faq.js  (Akkordeon)
   Native <details>, aber mit hochwertigem Auf-/Zuklappen:
   Höhe + Eck-Radius (Pille ↔ Panel) morphen GSAP-synchron, der Inhalt
   blendet sanft ein. Akkordeon-Verhalten: nur ein Eintrag gleichzeitig offen.

   Zustands-Trennung (wichtig wegen nativem <details>):
   • `.is-open` (Klasse)  → VISUELLER Zustand: BG, Icon, Radius-Ziel.
     Wird beim Öffnen UND Schließen SOFORT umgeschaltet → BG/Icon morphen weich
     per CSS-Transition in beide Richtungen.
   • `[open]` (Attribut)  → hält den Body im DOM sichtbar. Wird beim Öffnen
     sofort gesetzt, beim Schließen aber erst NACH der Animation entfernt
     (sonst blendet der Browser den Body sofort aus → keine Zuklapp-Animation).

   Der Radius wird per GSAP getrieben (nicht CSS-Transition), weil `--r-pill`
   sonst auf die halbe Höhe clampt und beim Höhenwechsel „aufploppen" würde.
   Start-/Endwert = halbe eingeklappte Höhe (= volle Pille), Ziel offen = 40px.
   ===================================================================== */
(function () {
  "use strict";
  const TREFF = (window.TREFF = window.TREFF || {});

  const OPEN_RADIUS = 40;           // px – Panel-Rundung im offenen Zustand (= CSS .is-open)
  const DUR_OPEN = 0.55;            // s  – Aufklappen (ruhig, hochwertig)
  const DUR_CLOSE = 0.5;            // s  – Zuklappen: ruhig & weich
  const EASE_OPEN = "power3.out";   // Öffnen: kräftige, weiche Verzögerung
  // Schließen bewusst per ease-OUT (kein 1:1-Spiegel des Openings): sofortiger, sanfter Start
  // (kein „Hängen" am Anfang), gleichmäßig fallende Geschwindigkeit (kein Mid-Ruckeln) und
  // weiches Einsinken in den Endzustand statt eines harten Stopps.
  const EASE_CLOSE = "power2.out";

  TREFF.initFAQ = function () {
    document.querySelectorAll("[data-faq]").forEach((list) => {
      const items = Array.from(list.querySelectorAll(".faq-item"));
      items.forEach((item) => {
        const summary = item.querySelector("summary");
        summary.addEventListener("click", (e) => {
          e.preventDefault();
          const isOpen = item.classList.contains("is-open");
          items.forEach((o) => { if (o !== item && o.classList.contains("is-open")) collapse(o); });
          isOpen ? collapse(item) : expand(item);
        });
      });
    });

    const kidsOf = (body) => (body.children.length ? Array.from(body.children) : [body]);
    // Volle Pille = halbe eingeklappte Höhe (Summary + 1px Rahmen oben/unten).
    const pillRadius = (item) => item.querySelector("summary").offsetHeight / 2 + 1;

    function expand(item) {
      const body = item.querySelector(".faq-item__body");
      const pill = pillRadius(item);             // VOR dem Öffnen messen (Body noch ohne Höhe)
      item.classList.add("is-open");             // BG/Icon morphen sofort weich (CSS)
      item.setAttribute("open", "");             // Body im DOM sichtbar machen

      if (!window.gsap || TREFF.reduced) { body.style.height = "auto"; return; }
      const kids = kidsOf(body);
      const h = body.scrollHeight;
      gsap.killTweensOf([body, item, ...kids]);
      gsap.timeline({
        defaults: { ease: EASE_OPEN },
        onComplete: () => {
          body.style.height = "auto";
          gsap.set(item, { clearProps: "borderRadius" });          // → CSS .is-open (40px)
          gsap.set(kids, { clearProps: "opacity,visibility,transform" });
        }
      })
        .fromTo(body, { height: 0 }, { height: h, duration: DUR_OPEN }, 0)
        .fromTo(item, { borderRadius: pill }, { borderRadius: OPEN_RADIUS, duration: DUR_OPEN }, 0)
        .fromTo(kids, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: DUR_OPEN * 0.8, stagger: 0.05 }, 0.12);
    }

    function collapse(item) {
      const body = item.querySelector(".faq-item__body");
      const pill = pillRadius(item);
      item.classList.remove("is-open");          // BG/Icon morphen sofort zurück (CSS)

      const finish = () => { item.removeAttribute("open"); body.style.height = ""; };
      if (!window.gsap || TREFF.reduced) { finish(); return; }
      const kids = kidsOf(body);
      const from = body.getBoundingClientRect().height;   // exakte (fraktionale) Ist-Höhe → kein Frame-0-Sprung
      gsap.killTweensOf([body, item, ...kids]);
      gsap.timeline({
        defaults: { ease: EASE_CLOSE },
        onComplete: () => {
          finish();
          gsap.set(item, { clearProps: "borderRadius" });          // → CSS (var(--r-pill), volle Pille)
          gsap.set(kids, { clearProps: "opacity,visibility,transform" });
        }
      })
        // Höhe + Radius streng synchron (gleiche Dauer & Easing) → EIN ruhiger Formübergang.
        .fromTo(body, { height: from }, { height: 0, duration: DUR_CLOSE }, 0)
        .fromTo(item, { borderRadius: OPEN_RADIUS }, { borderRadius: pill, duration: DUR_CLOSE }, 0)
        // Inhalt NUR per Opacity ausblenden — kein y-Transform mehr (sonst Transform↔Höhen-Clip-
        // Kombination, die ruckelt). Kontinuierlich über den Großteil des Wegs, weich auslaufend,
        // damit kein leeres Kästchen als „harter Zwischenzustand" zurückbleibt.
        .to(kids, { opacity: 0, duration: DUR_CLOSE * 0.72, ease: "power1.out" }, 0);
    }
  };
})();
