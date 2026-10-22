(() => {
  /* ------------------------------------------------------------------
     EDITABLE SETTINGS
     - eventDate: ISO date/time of the party. Add an offset (e.g. "+03:00")
       so every guest counts down to the same moment wherever they are.
     - mapsUrl: link opened by the "موقع الحفل" button.
     - basmalaImage: optional path to a transparent calligraphy SVG/PNG
       (e.g. "assets/basmala.svg"). Leave empty to use the Amiri Quran font.
     ------------------------------------------------------------------ */
  const CONFIG = {
    eventDate: "2026-10-30T16:00:00+02:00",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("قاعة الاحتفالات"),
    basmalaImage: "",
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const envelope = document.getElementById("envelope");
  const seal = document.getElementById("seal");
  const invitation = document.getElementById("invitation");
  const coupleTitle = document.getElementById("couple-title");
  const reveals = document.querySelectorAll("[data-reveal]");
  const canReveal = !reduceMotion && "IntersectionObserver" in window;
  if (canReveal) reveals.forEach((node) => node.classList.add("is-reveal-pending"));
  const units = {
    days: document.querySelector('[data-unit="days"]'),
    hours: document.querySelector('[data-unit="hours"]'),
    minutes: document.querySelector('[data-unit="minutes"]'),
  };

  let opened = false;

  /* ---------------- Content configuration ---------------- */

  document.querySelectorAll("[data-map-link]").forEach((link) => {
    link.href = CONFIG.mapsUrl;
  });

  if (CONFIG.basmalaImage) {
    const basmala = document.getElementById("basmala");
    const img = new Image();
    img.src = CONFIG.basmalaImage;
    img.alt = "بسم الله الرحمن الرحيم";
    img.decoding = "async";
    img.className = "basmala__image";
    img.addEventListener("load", () => {
      basmala.textContent = "";
      basmala.appendChild(img);
    });
  }

  /* ---------------- Opening sequence ---------------- */

  // Only this local recording is used. A missing/blocked recording leaves the opening silent.
  const heaven = new Audio();
  heaven.preload = "none";
  let audioFrame = 0;

  const playHeaven = () => {
    heaven.src = "assets/audio/heaven.mp3";
    heaven.volume = 0;
    // Keep play() inside the click handler to preserve browser user activation.
    const playback = heaven.play();
    if (!playback) return;
    playback.then(() => {
      const startedAt = performance.now();
      const fadeIn = (now) => {
        const progress = Math.min((now - startedAt) / 900, 1);
        heaven.volume = .24 * progress;
        if (progress < 1 && !heaven.paused) audioFrame = requestAnimationFrame(fadeIn);
      };
      audioFrame = requestAnimationFrame(fadeIn);
    }).catch(() => {
      cancelAnimationFrame(audioFrame);
      // No replacement sound and no interruption to the animation.
    });
  };

  const unlockPage = () => {
    envelope.hidden = true;
    invitation.removeAttribute("inert");
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    coupleTitle.focus({ preventScroll: true });
  };

  const openInvitation = (instant = false) => {
    if (opened) return;
    opened = true;
    seal.disabled = true;
    if (!instant) playHeaven();
    envelope.classList.add("is-opening");

    // The invitation remains inert until the overlay has completely finished.
    window.setTimeout(() => {
      document.body.classList.add("is-revealed");
      startReveals();
    }, instant ? 0 : reduceMotion ? 0 : 700);

    window.setTimeout(unlockPage, instant ? 0 : reduceMotion ? 450 : 3000);
  };

  /* ---------------- Scroll reveals ---------------- */

  let revealsStarted = false;
  const startReveals = () => {
    if (revealsStarted) return;
    revealsStarted = true;
    if (!canReveal) {
      reveals.forEach((node) => {
        node.classList.remove("is-reveal-pending");
        node.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        visible.forEach((entry, index) => {
          entry.target.style.transitionDelay = `${index * 120}ms`;
          entry.target.classList.remove("is-reveal-pending");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.12 }
    );

    reveals.forEach((node) => observer.observe(node));
  };

  /* ---------------- Countdown ---------------- */

  const eventTime = new Date(CONFIG.eventDate).getTime();
  const countdownDigits = new Intl.NumberFormat("en-US", { minimumIntegerDigits: 2, useGrouping: false });
  let countdownTimer = 0;

  const renderCountdown = () => {
    const diff = Math.max(0, eventTime - Date.now());
    const totalMinutes = Math.floor(diff / 60000);

    units.days.textContent = countdownDigits.format(Math.floor(totalMinutes / 1440));
    units.hours.textContent = countdownDigits.format(Math.floor((totalMinutes % 1440) / 60));
    units.minutes.textContent = countdownDigits.format(totalMinutes % 60);

    if (diff === 0) window.clearInterval(countdownTimer);
  };

  /* ---------------- Init ---------------- */

  seal.addEventListener("click", () => openInvitation());

  renderCountdown();
  if (Date.now() < eventTime) countdownTimer = window.setInterval(renderCountdown, 1000);

  // Direct link to the opened card, e.g. index.html#invitation
  if (location.hash === "#invitation") {
    envelope.classList.add("is-instant");
    openInvitation(true);
  }
})();
