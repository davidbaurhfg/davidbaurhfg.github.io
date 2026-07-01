/* =====================================================================
   TREFF. — phasen.js  (Scrollytelling)
   • Baut die SVG-Verbindungslinie zwischen den Phasen (zwei 90°-Knicke
     je Segment, mittig zwischen den Pillen).
   • Linie „zeichnet" sich beim Scrollen (stroke-dashoffset, Bewegung).
   • Aktive Phase voll farbig, andere zurückgenommen (Farbe statt Opacity).
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
    let path = svg.querySelector("path");
    if (!path) { path = document.createElementNS(SVGNS, "path"); svg.appendChild(path); }

    function build() {
      const wrapRect = wrap.getBoundingClientRect();
      const W = wrap.clientWidth, H = wrap.clientHeight;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const nodes = phases.map((p) => {
        const pille = p.querySelector(".phase__pille");
        const r = pille.getBoundingClientRect();
        return {
          cx: r.left + r.width / 2 - wrapRect.left,
          top: r.top - wrapRect.top,
          bottom: r.bottom - wrapRect.top,
        };
      });
      let endNode = null;
      if (end) {
        const r = end.getBoundingClientRect();
        endNode = { cx: r.left + r.width / 2 - wrapRect.left, top: r.top - wrapRect.top };
      }

      let d = "";
      const seg = (a, bx, btop, abottom) => {
        const midY = (abottom + btop) / 2;
        d += `M ${a.cx} ${abottom} L ${a.cx} ${midY} L ${bx} ${midY} L ${bx} ${btop} `;
      };
      for (let i = 0; i < nodes.length - 1; i++) {
        seg(nodes[i], nodes[i + 1].cx, nodes[i + 1].top, nodes[i].bottom);
      }
      if (endNode) {
        const a = nodes[nodes.length - 1];
        seg(a, endNode.cx, endNode.top, a.bottom);
      }
      path.setAttribute("d", d);
    }

    build();

    const gsapOK = window.gsap && window.ScrollTrigger && !TREFF.reduced;
    if (gsapOK) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      gsap.to(path, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: wrap, start: "top 65%", end: "bottom 75%", scrub: true },
      });

      phases.forEach((p) => p.classList.add("is-dim"));
      ScrollTrigger.create({
        trigger: wrap, start: "top center", end: "bottom center",
        onUpdate: () => {
          const mid = window.innerHeight / 2;
          let best = null, bestD = Infinity;
          phases.forEach((p) => {
            const r = p.getBoundingClientRect();
            const c = r.top + r.height / 2;
            const dd = Math.abs(c - mid);
            if (dd < bestD) { bestD = dd; best = p; }
          });
          phases.forEach((p) => {
            const on = p === best;
            p.classList.toggle("is-active", on);
            p.classList.toggle("is-dim", !on);
          });
        },
      });
    }

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        build();
        if (gsapOK) {
          const len = path.getTotalLength();
          path.style.strokeDasharray = len;
          window.ScrollTrigger && ScrollTrigger.refresh();
        }
      }, 200);
    });
  };
})();
