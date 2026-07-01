/* =====================================================================
   TREFF. — parallax.js
   Spezial-Parallax für die „Bildgalerie Seitlich" (Unterseiten):
   die Illustration bewegt sich beim Scrollen deutlich anders als das
   nebenstehende Bild -> klarer Tiefen-/Versatz-Effekt.
   Markup: <div data-illu-parallax> mit .bg-illu (Illustration).
   Auf Mobile abgeschwächt; bei prefers-reduced-motion aus.
   ===================================================================== */
(function () {
  "use strict";
  const TREFF = (window.TREFF = window.TREFF || {});

  TREFF.initParallaxExtra = function () {
    if (!window.gsap || !window.ScrollTrigger || TREFF.reduced) return;
    const factor = TREFF.isTouch ? 0.5 : 1;

    document.querySelectorAll("[data-illu-parallax]").forEach((scope) => {
      const illu = scope.querySelector(".bg-illu");
      const img = scope.querySelector(".img-slot");
      if (illu) {
        gsap.fromTo(illu, { yPercent: 22 * factor }, {
          yPercent: -22 * factor, ease: "none",
          scrollTrigger: { trigger: scope, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
      if (img) {
        gsap.fromTo(img, { yPercent: -6 * factor }, {
          yPercent: 6 * factor, ease: "none",
          scrollTrigger: { trigger: scope, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    });
  };
})();
