// ── Hero background (random GIF) ──────────────────────
const coverImages = ["img/cover1.gif", "img/cover2.gif"];
document.getElementById("home").style.backgroundImage =
    "url(" + coverImages[Math.floor(Math.random() * coverImages.length)] + ")";

// ── Scroll-reveal (IntersectionObserver) ──────────────
const revealEls = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

revealEls.forEach((el) => revealObserver.observe(el));

// ── Active nav link on scroll ─────────────────────────
const sections  = document.querySelectorAll("section[id], div[id]");
const navLinks  = document.querySelectorAll(".nav-link");

const navObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navLinks.forEach((link) => {
                    link.classList.toggle("active", link.getAttribute("href") === "#" + id);
                });
            }
        });
    },
    { threshold: 0.45 }
);

sections.forEach((s) => navObserver.observe(s));
