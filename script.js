(function () {
  document.documentElement.classList.remove("no-js");
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav__toggle");
  var mobile = document.getElementById("mobile-menu");

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });
  mobile.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1180) setMenu(false);
  });

  // Scroll reveal
  var items = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // Lightbox: reuses the image already in the page, so nothing loads at run time
  var box = document.getElementById("lightbox");
  var boxInner = box.querySelector(".lightbox__inner");
  var boxCap = box.querySelector(".lightbox__cap");
  var closeBtn = box.querySelector(".lightbox__close");
  var lastFocus = null;
  var current = null;

  function openBox(btn) {
    var img = btn.querySelector("img");
    current = img.cloneNode(true);
    current.removeAttribute("class");
    current.removeAttribute("loading");
    boxInner.insertBefore(current, boxCap);
    boxCap.textContent = btn.getAttribute("data-caption") || img.alt;
    lastFocus = btn;
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function closeBox() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (current) { current.remove(); current = null; }
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll(".paper__open").forEach(function (btn) {
    btn.addEventListener("click", function () { openBox(btn); });
  });
  closeBtn.addEventListener("click", closeBox);
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target === boxInner) closeBox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (box.classList.contains("is-open")) closeBox();
      else if (nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    }
    if (e.key === "Tab" && box.classList.contains("is-open")) { e.preventDefault(); closeBtn.focus(); }
  });

  // Partner margin calculator
  var calc = document.getElementById("calc");
  if (calc) {
    var cur = document.getElementById("calc-cur");
    var price = document.getElementById("calc-price");
    var vol = document.getElementById("calc-vol");
    var volOut = document.getElementById("calc-vol-out");
    var hours = document.getElementById("calc-hours");
    var oursEl = document.getElementById("calc-ours");
    var outMargin = document.getElementById("out-margin");
    var outHours = document.getElementById("out-hours");
    var outRate = document.getElementById("out-rate");
    var outDisc = document.getElementById("out-discount");
    var shown = { margin: 880, hours: 20, rate: 44 };
    var sym = "£";

    function num(el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; }
    function money(v, dec) {
      var s = Math.abs(v).toLocaleString("en-GB", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
      return (v < 0 ? "−" : "") + sym + s;
    }
    function each(v) { return money(v, v % 1 ? 2 : 0); }
    function fmtHours(v) { return (Math.round(v * 10) / 10).toLocaleString("en-GB") + " hrs"; }

    var fmt = {
      margin: function (v) { return money(Math.round(v)); },
      hours: fmtHours,
      rate: function (v, empty) { return empty ? "—" : money(Math.round(v)) + "/hr"; }
    };
    var els = { margin: outMargin, hours: outHours, rate: outRate };
    var raf = {};

    function animate(key, to, empty) {
      var from = shown[key];
      if (raf[key]) cancelAnimationFrame(raf[key]);
      if (reduce || empty || from === to) { shown[key] = to; els[key].textContent = fmt[key](to, empty); return; }
      var start = null, dur = 550;
      function tick(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        var v = from + (to - from) * e;
        shown[key] = v;
        els[key].textContent = fmt[key](v);
        if (p < 1) raf[key] = requestAnimationFrame(tick);
      }
      raf[key] = requestAnimationFrame(tick);
    }

    function update() {
      var opt = cur.options[cur.selectedIndex];
      sym = opt.getAttribute("data-sym");
      var ours = parseFloat(opt.getAttribute("data-ours"));
      var n = parseInt(vol.value, 10) || 1;
      var h = num(hours);
      var p = num(price);
      var disc = n >= 25 ? 0.15 : n >= 10 ? 0.1 : 0;
      var net = Math.round(ours * (1 - disc) * 100) / 100;
      var margin = (p - net) * n;
      var freed = h * n;
      var rate = freed > 0 ? margin / freed : 0;

      volOut.textContent = n;
      oursEl.textContent = each(ours);
      outDisc.textContent = disc
        ? Math.round(disc * 100) + "% volume discount applied at " + (disc === 0.15 ? "25+" : "10+") + " a month: " + each(net) + " each."
        : "No volume discount below 10 a month: " + each(ours) + " each.";
      animate("margin", margin);
      animate("hours", freed);
      animate("rate", rate, freed === 0);
    }

    calc.addEventListener("submit", function (e) { e.preventDefault(); });
    [cur, price, vol, hours].forEach(function (el) {
      el.addEventListener("input", update);
      el.addEventListener("change", update);
    });
    update();
  }

  // Currency toggle: switches every price marked with data-p (GBP,EUR,USD,AUD,NZD)
  var CURS = ["GBP", "EUR", "USD", "AUD", "NZD"];
  var SYMS = { GBP: "£", EUR: "€", USD: "US$", AUD: "A$", NZD: "NZ$" };
  var curBtns = document.querySelectorAll(".cur__btn");
  var calcCur = document.getElementById("calc-cur");
  function setCurrency(code, fromCalc) {
    var i = CURS.indexOf(code);
    if (i < 0) return;
    document.querySelectorAll("[data-p]").forEach(function (el) {
      var v = el.getAttribute("data-p").split(",")[i];
      el.textContent = SYMS[code] + v;
    });
    curBtns.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-cur") === code ? "true" : "false");
    });
    document.querySelectorAll(".prices li[data-cur]").forEach(function (li) {
      li.classList.toggle("is-active", li.getAttribute("data-cur") === code);
    });
    if (calcCur && !fromCalc && calcCur.value !== code) {
      calcCur.value = code;
      calcCur.dispatchEvent(new Event("change"));
    }
  }
  curBtns.forEach(function (b) {
    b.addEventListener("click", function () { setCurrency(b.getAttribute("data-cur")); });
  });
  if (calcCur) calcCur.addEventListener("change", function () { setCurrency(calcCur.value, true); });

  // Mobile sticky CTA: shows after the hero, hides once the closing CTA is reached
  var mbar = document.getElementById("mbar");
  var hero = document.querySelector(".hero") || document.querySelector(".page-hero");
  var cta = document.querySelector(".cta");
  if (mbar && hero && cta) {
    var mbarLink = mbar.querySelector("a");
    var mbarOn = false;
    function checkBar() {
      var on = hero.getBoundingClientRect().bottom < 0 && cta.getBoundingClientRect().top > window.innerHeight;
      if (on === mbarOn) return;
      mbarOn = on;
      mbar.classList.toggle("is-shown", on);
      mbar.setAttribute("aria-hidden", on ? "false" : "true");
      mbarLink.setAttribute("tabindex", on ? "0" : "-1");
    }
    checkBar();
    window.addEventListener("scroll", checkBar, { passive: true });
    window.addEventListener("resize", checkBar);
  }
})();
