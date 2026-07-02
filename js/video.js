/* =====================================================================
   TREFF. — video.js
   Explosion-Video (video-sec auf index.html). Hook: [data-video-pingpong].

   • Autoplay erst, wenn der Videoframe in den Viewport scrollt (IntersectionObserver);
     pausiert wieder, sobald er den View verlässt (spart CPU beim Rückwärts-Seeking).
   • Keine Player-UI (kein `controls` im Markup).
   • Normale Geschwindigkeit. Ping-Pong-Loop:
       vorwärts → 5s am LETZTEN Frame halten → rückwärts → 5s am ERSTEN Frame halten → …
   • Rückwärts wird manuell per rAF getrieben (currentTime dekrementieren), weil Browser
     negative playbackRate ignorieren. Reduced Motion / kein IO → nur erstes Frame, kein Loop.

   Hinweis: Die Glätte des Rückwärtslaufs hängt von der Keyframe-Dichte des Encodes ab
   (Seek springt auf den nächsten vorherigen Keyframe). Bei sichtbarem Ruckeln das Video
   mit dichteren Keyframes neu kodieren (z.B. ffmpeg `-g 10`), Datei bleibt sonst unverändert.
   ===================================================================== */
(function () {
  "use strict";
  var TREFF = (window.TREFF = window.TREFF || {});
  var HOLD_MS = 5000;          // Halt an beiden Enden
  var VIEW_RATIO = 0.35;       // ab ~35% sichtbar gilt der Frame als "im View"

  function init() {
    var vids = document.querySelectorAll("[data-video-pingpong]");
    Array.prototype.forEach.call(vids, setup);
  }

  function setup(video) {
    video.playbackRate = 1;
    video.loop = false;                 // sonst feuert `ended` nie / kein Ping-Pong
    try { video.controls = false; } catch (e) {}

    // Reduced Motion oder kein IntersectionObserver: statisch beim ersten Frame lassen.
    if (TREFF.reduced || typeof IntersectionObserver === "undefined") {
      try { video.pause(); } catch (e) {}
      return;
    }

    var phase = "idle";   // idle | forward | holdEnd | backward | holdStart
    var inView = false;
    var raf = null;
    var hold = null;
    var lastTs = 0;
    var backT = 0;        // expliziter Rückwärts-Zeitstand (unabhängig vom async Seek → exakt Echtzeit)

    var now = function () {
      return (window.performance && performance.now) ? performance.now() : Date.now();
    };
    var clearHold = function () { if (hold != null) { clearTimeout(hold); hold = null; } };
    var clearRaf = function () { if (raf != null) { cancelAnimationFrame(raf); raf = null; } };

    // friert die laufende Bewegung ein, OHNE die Phase zu verändern (für Sichtbarkeits-Pause)
    function freeze() {
      clearRaf();
      clearHold();
      try { video.pause(); } catch (e) {}
    }

    function playForward() {
      phase = "forward";
      var p = video.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }

    function onEnded() {
      if (phase !== "forward" || !inView) return;
      try { video.pause(); } catch (e) {}   // exakt auf dem letzten Frame stehen bleiben
      enterHold("holdEnd");
    }

    // 5s am aktuellen Frame halten, dann in die Gegenrichtung
    function enterHold(which) {
      phase = which;
      clearHold();
      hold = setTimeout(function () {
        hold = null;
        if (!inView) return;
        if (which === "holdEnd") startBackward();
        else playForward();
      }, HOLD_MS);
    }

    function startBackward() {
      phase = "backward";
      try { video.pause(); } catch (e) {}
      backT = video.currentTime;          // vom letzten Frame aus rückwärts
      lastTs = now();
      clearRaf();
      raf = requestAnimationFrame(stepBackward);
    }

    function stepBackward(ts) {
      raf = null;
      if (phase !== "backward" || !inView) return;
      var dt = (ts - lastTs) / 1000;      // echte Zeit → normale Geschwindigkeit
      lastTs = ts;
      backT -= dt;                        // Zielzeit selbst führen (nicht video.currentTime lesen)
      if (backT <= 0 || isNaN(backT)) {
        try { video.currentTime = 0; } catch (e) {}
        enterHold("holdStart");           // 5s am ersten Frame halten
        return;
      }
      try { video.currentTime = backT; } catch (e) {}
      raf = requestAnimationFrame(stepBackward);
    }

    // nach Wieder-Sichtbarkeit die aktuelle Phase fortsetzen
    function resume() {
      switch (phase) {
        case "idle":     try { video.currentTime = 0; } catch (e) {} playForward(); break;
        case "forward":  playForward(); break;
        case "backward": backT = video.currentTime; lastTs = now(); clearRaf(); raf = requestAnimationFrame(stepBackward); break;
        case "holdEnd":  enterHold("holdEnd"); break;    // frischer 5s-Halt
        case "holdStart":enterHold("holdStart"); break;
      }
    }

    video.addEventListener("ended", onEnded);

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var visible = entries[i].isIntersecting && entries[i].intersectionRatio >= VIEW_RATIO;
        if (visible && !inView) { inView = true; resume(); }
        else if (!visible && inView) { inView = false; freeze(); }
      }
    }, { threshold: [0, VIEW_RATIO, 0.75] });

    io.observe(video);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
