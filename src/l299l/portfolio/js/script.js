const coverImages = ["img/cover1.gif", "img/cover2.gif"];
document.getElementById("home").style.backgroundImage =
    "url(" + coverImages[Math.floor(Math.random() * coverImages.length)] + ")";

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

function projectCardHtml(project, index) {
    const legacyBadge = project.legacy
        ? ' <span class="text-xs text-[#3d5560] font-normal tracking-normal ml-1">[legacy]</span>'
        : "";

    const tags = project.tags
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");

    const links = project.links
        .map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="project-link"><i class="bi ${escapeHtml(link.icon)}"></i> ${escapeHtml(link.label)}</a>`)
        .join("");

    return `
        <div class="project-card reveal" style="--delay:${index * 120}ms">
            <div class="project-icon"><i class="bi ${escapeHtml(project.icon)}"></i></div>
            <h3 class="project-title font-dosis">${escapeHtml(project.title)}${legacyBadge}</h3>
            <p class="project-desc font-dosis">${escapeHtml(project.description)}</p>
            <div class="project-tags">${tags}</div>
            <div class="project-links">${links}</div>
        </div>`;
}

async function renderProjects() {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;

    try {
        const res = await fetch("data/projects.json");
        if (!res.ok) throw new Error(res.status);

        const projects = await res.json();
        grid.innerHTML = projects.map(projectCardHtml).join("");
    } catch (err) {
        console.error("[projects]", err);
        grid.innerHTML = '<p class="text-[#7a9aaa] font-dosis col-span-full text-center">Couldn\'t load projects right now.</p>';
    }
}

function initRevealObserver() {
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
}

function initNavObserver() {
    const sections = document.querySelectorAll("section[id], div[id]");
    const navLinks = document.querySelectorAll(".nav-link");

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
}

(async function () {
    await renderProjects();
    initRevealObserver();
    initNavObserver();
})();

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
