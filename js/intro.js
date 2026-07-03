/* =====================================================================
   TREFF. — intro.js  (Sweep-Starter, NUR index.html)
   Editorial-Intro bei jedem Laden:
   1) oranger Balken wischt über das "TREFF."-Logo, in seiner Spur wird das
      Logo per clip-path von links nach rechts sichtbar ("gemalt"),
   2) die gelbe Frau steigt mit leichtem Überschwung von unten auf,
   3) das Logo macht einen winzigen Settle-Puls, die Nav blendet ein.

   • Kein SVG-Inlining: animiert nur Element-Eigenschaften (clip-path / transform /
     autoAlpha) auf den vorhandenen <img>/Elementen.
   • Reduced Motion (prefers-reduced-motion oder ?still=1) ODER kein GSAP →
     keine Animation, Header sofort sichtbar (Klasse `intro-active` wird bereits
     im <head> nur gesetzt, wenn Animation gewünscht ist).
   • Scroll wird via Lenis gesperrt und am Ende freigegeben.
   • `finish()` läuft GARANTIERT genau einmal (aus onComplete ODER Failsafe-
     Timeout): killt die Timeline, räumt auf, gibt den Header frei. Dadurch kann
     der Header nie hängenbleiben und die Timeline sich nach einem Hintergrund-
     Tab (rAF pausiert) nicht nachträglich über bereits gezeigten Inhalt legen.
   • Nav: NUR autoAlpha (niemals Transform — würde die translateX(-50%)-
     Zentrierung zerstören).

   Tuning: die CONFIG-Werte unten (Dauern/Ease/Positionen).
   ===================================================================== */
(function () {
  "use strict";
  var TREFF = (window.TREFF = window.TREFF || {});
  var docEl = document.documentElement;

  var CONFIG = {
    sweep: 0.9,          // Dauer Logo-Wisch + Balken
    sweepOut: 0.3,       // Balken läuft rechts raus
    illu: 0.9,           // Aufstieg der Frau
    illuAt: 0.45,        // Startzeit Frau (überlappt den Wisch)
    illuEase: "back.out(1.4)",
    pulseAt: 1.2,        // Logo-Settle-Puls (quittiert die Landung)
    navAt: 1.5,          // Nav-Fade
    nav: 0.5,
    ease: "power3.inOut",
    failsafeMs: 4000,    // Header spätestens nach dieser Zeit garantiert sichtbar
  };

  function showHeader() { docEl.classList.remove("intro-active"); }

  function init() {
    // Kein Intro bei Reduced Motion / fehlendem GSAP → Header normal anzeigen.
    if (TREFF.reduced || !window.gsap) {
      showHeader();
      if (TREFF.lenis) TREFF.lenis.start();
      return;
    }

    var logoBox = document.querySelector(".header__logo");
    var logoImg = logoBox && logoBox.querySelector("img");
    var illuImg = document.querySelector(".header__illu img");
    var nav = document.querySelector(".nav");

    if (!logoBox || !logoImg || !illuImg) {
      showHeader();
      if (TREFF.lenis) TREFF.lenis.start();
      return;
    }

    // Scroll sperren und oben starten.
    if (TREFF.lenis) TREFF.lenis.stop();
    window.scrollTo(0, 0);

    // Sweep-Balken (per JS, wird in finish() entfernt).
    var sweep = document.createElement("div");
    sweep.className = "intro-sweep";
    logoBox.appendChild(sweep);
    var w = logoBox.clientWidth;

    var done = false;
    var failsafe;
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(failsafe);
      if (tl) tl.kill();
      showHeader();
      if (sweep.parentNode) sweep.parentNode.removeChild(sweep);
      gsap.set([logoImg, illuImg], { clearProps: "all" });
      if (nav) gsap.set(nav, { clearProps: "opacity,visibility" });
      if (TREFF.lenis) TREFF.lenis.start();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    var tl = gsap.timeline({ defaults: { ease: CONFIG.ease }, onComplete: finish });

    // 1) Logo-Wisch (clip-path links→rechts) + Balken laufen synchron.
    tl.fromTo(logoImg,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: CONFIG.sweep }, 0)
      .fromTo(sweep,
        { x: 0, autoAlpha: 1 },
        { x: w, duration: CONFIG.sweep }, 0)
      .to(sweep,
        { x: w + 40, autoAlpha: 0, duration: CONFIG.sweepOut, ease: "power2.in" }, CONFIG.sweep)
      // 2) Frau steigt mit leichtem Überschwung auf.
      .fromTo(illuImg,
        { yPercent: 14, scale: 0.96, autoAlpha: 0 },
        { yPercent: 0, scale: 1, autoAlpha: 1, duration: CONFIG.illu, ease: CONFIG.illuEase }, CONFIG.illuAt)
      // 3) Logo-Settle-Puls.
      .to(logoImg,
        { scale: 1.02, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.inOut" }, CONFIG.pulseAt);

    // Nav sanft einblenden (NUR autoAlpha).
    if (nav) {
      tl.fromTo(nav, { autoAlpha: 0 }, { autoAlpha: 1, duration: CONFIG.nav }, CONFIG.navAt);
    }

    // Failsafe: finish() greift garantiert (auch wenn rAF im Hintergrund-Tab pausiert).
    failsafe = setTimeout(finish, CONFIG.failsafeMs);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
