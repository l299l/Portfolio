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

// ── Contact form → Discord webhook ────────
const DISCORD_WEBHOOK_URL = "__DISCORD_WEBHOOK_URL__";

(function () {
    const form     = document.getElementById("contact-form");
    const submit   = document.getElementById("cf-submit");
    const btnLabel = document.getElementById("cf-btn-label");
    const feedback = document.getElementById("cf-feedback");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name    = document.getElementById("cf-name").value.trim();
        const contact = document.getElementById("cf-contact").value.trim();
        const type    = document.getElementById("cf-type").value;
        const message = document.getElementById("cf-message").value.trim();

        if (!name || !contact || !type || !message) {
            showFeedback("Please fill in all fields.", "error");
            return;
        }

        submit.disabled = true;
        btnLabel.textContent = "Sending…";
        feedback.className = "cf-feedback";

        const payload = {
            embeds: [{
                title: "📬 New Contact Request",
                color: 0x009a22,
                fields: [
                    { name: "👤 Name",          value: name,    inline: true },
                    { name: "📧 Contact",        value: contact, inline: true },
                    { name: "🔨 Project Type",   value: type,    inline: true },
                    { name: "📝 Message",        value: message }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: "Leon's Portfolio · Contact Form" }
            }]
        };

        if (!DISCORD_WEBHOOK_URL || !DISCORD_WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/")) {
            showFeedback("✗ Webhook not configured.", "error");
            submit.disabled = false;
            btnLabel.textContent = "Send Message";
            return;
        }

        try {
            const res = await fetch(DISCORD_WEBHOOK_URL + "?wait=true", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showFeedback("✓ Message sent! I'll get back to you soon.", "success");
                form.reset();
            } else {
                throw new Error(res.status);
            }
        } catch (err) {
            console.error("[contact form]", err);
            showFeedback("✗ Couldn't send. Try reaching me directly on Discord.", "error");
        }

        submit.disabled = false;
        btnLabel.textContent = "Send Message";
    });

    function showFeedback(text, type) {
        feedback.textContent = text;
        feedback.className = "cf-feedback " + type;
    }
})();
