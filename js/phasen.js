/* =====================================================================
   TREFF. — phasen.js  (Scrollytelling)
   • Baut je Segment eine eigene SVG-Verbindungslinie zwischen zwei Phasen
     (zwei 90°-Knicke, mittig zwischen den Boxen), dazu ein Schluss-Segment
     in das TREFF.-Badge.
   • Jedes Segment „fließt" beim Scrollen nach unten in die nächste Phase
     (stroke-dashoffset, per ScrollTrigger-scrub) — funktioniert dadurch für
     JEDE Phase gleich, nicht nur für die erste.
   • Gleichzeitig blendet die Zielphase weich ein (autoAlpha + y).
   • Reduced Motion / kein GSAP: alles statisch sichtbar, Linie voll gezeichnet.
   ===================================================================== */
(function () {
  "use strict";
  const TREFF = (window.TREFF = window.TREFF || {});

  TREFF.initPhasen = function () {
    const section = document.querySelector("[data-phasen]");
    if (!section) return;
    const wrap = section.querySelector("[data-phasen-wrap]");
    const svg = section.querySelector("[data-phasen-lines]");
    const phases = Array.from(section.querySelectorAll("[data-phase]"));
    const end = section.querySelector("[data-phase-end]");
    if (!wrap || !svg || phases.length < 2) return;

    const SVGNS = "http://www.w3.org/2000/svg";
    const gsapOK = window.gsap && window.ScrollTrigger && !TREFF.reduced;

    let segs = [];        // { path, target } je Segment
    let triggers = [];    // ScrollTrigger-Instanzen zum Aufräumen

    function clearSVG() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      segs = [];
    }

    function centerNode(el) {
      const wr = wrap.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2 - wr.left,
        top: r.top - wr.top,
        bottom: r.bottom - wr.top,
      };
    }

    // Pfad: von Box A (unten, Mitte) mit zwei rechten Winkeln zu Box B (oben, Mitte)
    function segPath(a, bCx, bTop) {
      const midY = (a.bottom + bTop) / 2;
      return `M ${a.cx} ${a.bottom} L ${a.cx} ${midY} L ${bCx} ${midY} L ${bCx} ${bTop}`;
    }

    function build() {
      clearSVG();
      const W = wrap.clientWidth, H = wrap.clientHeight;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const nodes = phases.map((p) => centerNode(p.querySelector(".phase__pille")));

      const specs = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        specs.push({ d: segPath(nodes[i], nodes[i + 1].cx, nodes[i + 1].top), target: phases[i + 1] });
      }
      if (end) {
        const e = centerNode(end);
        specs.push({ d: segPath(nodes[nodes.length - 1], e.cx, e.top), target: end });
      }

      specs.forEach((s) => {
        const path = document.createElementNS(SVGNS, "path");
        path.setAttribute("d", s.d);
        path.setAttribute("fill", "none");
        svg.appendChild(path);
        segs.push({ path, target: s.target });
      });
    }

    function killTriggers() {
      triggers.forEach((t) => t && t.kill && t.kill());
      triggers = [];
    }

    function setup() {
      killTriggers();
      build();

      if (!gsapOK) {
        // Statisch: Linien voll sichtbar, Phasen sichtbar lassen
        segs.forEach((s) => { s.path.style.strokeDasharray = "none"; s.path.style.strokeDashoffset = 0; });
        return;
      }

      // Phase 1 blendet beim Eintritt ein (hat kein eingehendes Segment)
      gsap.set(phases[0], { autoAlpha: 0, y: 24 });
      const r0 = gsap.fromTo(phases[0],
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, ease: "none",
          scrollTrigger: { trigger: phases[0], start: "top 88%", end: "top 60%", scrub: 0.6 } });
      triggers.push(r0.scrollTrigger);

      // Jedes Segment zeichnet sich beim Scrollen in seine Zielphase; die Phase
      // blendet synchron ein. Der scrub lässt die Linie flüssig „mitfließen".
      segs.forEach((s) => {
        const len = s.path.getTotalLength();
        s.path.style.strokeDasharray = len;
        s.path.style.strokeDashoffset = len;

        const tl = gsap.timeline({
          scrollTrigger: { trigger: s.target, start: "top 92%", end: "top 55%", scrub: 0.6 },
        });
        tl.to(s.path, { strokeDashoffset: 0, ease: "none" }, 0);
        if (s.target !== end) {
          gsap.set(s.target, { autoAlpha: 0, y: 24 });
          tl.fromTo(s.target, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: "none" }, 0);
        }
        triggers.push(tl.scrollTrigger);
      });

      ScrollTrigger.refresh();
    }

    setup();

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(setup, 200);
    });
  };
})();
