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
    if (window.innerWidth > 900) setMenu(false);
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
})();
