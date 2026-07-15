const OWNER = "l299l";
const REPO = "Portfolio";
const BRANCH = "master";
const FILE_PATH = "src/l299l/portfolio/data/projects.json";
const TOKEN_STORAGE_KEY = "portfolio_admin_token";

const gateSection    = document.getElementById("gate");
const gateForm       = document.getElementById("gate-form");
const tokenInput     = document.getElementById("token-input");
const tokenToggle    = document.getElementById("token-toggle");
const gateFeedback   = document.getElementById("gate-feedback");
const gateSubmit     = document.getElementById("gate-submit");
const gateBtnLabel   = document.getElementById("gate-btn-label");

const editorSection  = document.getElementById("editor");
const logoutBtn      = document.getElementById("logout-btn");
const projectsListEl = document.getElementById("projects-list");
const addProjectBtn  = document.getElementById("add-project-btn");
const saveBtn        = document.getElementById("save-btn");
const saveBtnLabel   = document.getElementById("save-btn-label");
const saveFeedback   = document.getElementById("save-feedback");

let githubToken = null;
let projects = [];
let fileSha = null;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

function encodeBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16))));
}

function decodeBase64(str) {
    return decodeURIComponent(atob(str).split("").map((c) =>
        "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
}

function showFeedback(el, text, type) {
    el.textContent = text;
    el.className = `cf-feedback ${type}`;
}

function emptyProject() {
    return { icon: "bi-code-slash", title: "New project", legacy: false, description: "", tags: [], links: [] };
}

function emptyLink() {
    return { label: "Link", icon: "bi-box-arrow-up-right", url: "" };
}

function swapProjects(i, j) {
    [projects[i], projects[j]] = [projects[j], projects[i]];
}

function githubHeaders() {
    return {
        "Authorization": `Bearer ${githubToken}`,
        "Accept": "application/vnd.github+json",
    };
}

async function fetchProjectsFile() {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const res = await fetch(url, { headers: githubHeaders() });

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            throw new Error("Token was rejected or doesn't have access to this repo.");
        }
        throw new Error(`GitHub error ${res.status}`);
    }

    const data = await res.json();
    fileSha = data.sha;
    return JSON.parse(decodeBase64(data.content.replace(/\n/g, "")));
}

async function saveProjectsFile() {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
    const body = {
        message: "Update projects via admin panel",
        content: encodeBase64(JSON.stringify(projects, null, 2)),
        sha: fileSha,
        branch: BRANCH,
    };

    const res = await fetch(url, {
        method: "PUT",
        headers: { ...githubHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub error ${res.status}`);
    }

    const data = await res.json();
    fileSha = data.content.sha;
}

function linkRowHtml(link, lIdx) {
    return `
        <div class="link-row" data-lidx="${lIdx}">
            <input type="text" class="form-input" data-link-field="label" value="${escapeHtml(link.label)}" placeholder="Label">
            <input type="text" class="form-input" data-link-field="icon" value="${escapeHtml(link.icon)}" placeholder="bi-github">
            <input type="url" class="form-input" data-link-field="url" value="${escapeHtml(link.url)}" placeholder="https://…">
            <button type="button" class="icon-btn danger" data-action="delete-link" title="Remove link"><i class="bi bi-x-lg"></i></button>
        </div>`;
}

function projectCardHtml(project, idx, total) {
    const linksHtml = project.links.map((link, lIdx) => linkRowHtml(link, lIdx)).join("");

    return `
        <div class="edit-card" data-idx="${idx}">
            <div class="edit-card-header">
                <div class="edit-card-title">
                    <span class="edit-card-icon-preview"><i class="bi ${escapeHtml(project.icon)}"></i></span>
                    <span class="edit-card-title-text">${escapeHtml(project.title) || "Untitled project"}</span>
                </div>
                <div class="edit-card-actions">
                    <button type="button" class="icon-btn" data-action="move-up" title="Move up" ${idx === 0 ? "disabled" : ""}><i class="bi bi-arrow-up"></i></button>
                    <button type="button" class="icon-btn" data-action="move-down" title="Move down" ${idx === total - 1 ? "disabled" : ""}><i class="bi bi-arrow-down"></i></button>
                    <button type="button" class="icon-btn danger" data-action="delete-project" title="Delete project"><i class="bi bi-trash3"></i></button>
                </div>
            </div>

            <div class="edit-grid">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <input type="text" class="form-input" data-field="title" value="${escapeHtml(project.title)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon (Bootstrap Icons class)</label>
                    <input type="text" class="form-input" data-field="icon" value="${escapeHtml(project.icon)}" placeholder="bi-code-slash">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input form-textarea" data-field="description" rows="3">${escapeHtml(project.description)}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Tags (comma-separated)</label>
                <input type="text" class="form-input" data-field="tags" value="${escapeHtml(project.tags.join(", "))}" placeholder="Java, Paper, MySQL">
            </div>

            <label class="checkbox-row">
                <input type="checkbox" data-field="legacy" ${project.legacy ? "checked" : ""}>
                Mark as legacy / unmaintained
            </label>

            <div class="links-section">
                <label class="form-label">Links</label>
                ${linksHtml}
                <button type="button" class="form-submit btn-sm add-link-btn" data-action="add-link">
                    <i class="bi bi-plus-lg"></i><span>Add link</span>
                </button>
            </div>
        </div>`;
}

function renderEditor() {
    projectsListEl.innerHTML = projects.map((p, idx) => projectCardHtml(p, idx, projects.length)).join("");
}

function showEditor() {
    gateSection.classList.add("hidden");
    editorSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    renderEditor();
}

projectsListEl.addEventListener("click", (e) => {
    const actionBtn = e.target.closest("[data-action]");
    if (!actionBtn) return;

    const card = actionBtn.closest(".edit-card");
    const idx = Number(card.dataset.idx);
    const action = actionBtn.dataset.action;

    if (action === "delete-project") {
        if (confirm(`Delete "${projects[idx].title}"?`)) {
            projects.splice(idx, 1);
            renderEditor();
        }
    } else if (action === "move-up" && idx > 0) {
        swapProjects(idx, idx - 1);
        renderEditor();
    } else if (action === "move-down" && idx < projects.length - 1) {
        swapProjects(idx, idx + 1);
        renderEditor();
    } else if (action === "add-link") {
        projects[idx].links.push(emptyLink());
        renderEditor();
    } else if (action === "delete-link") {
        const lIdx = Number(actionBtn.closest(".link-row").dataset.lidx);
        projects[idx].links.splice(lIdx, 1);
        renderEditor();
    }
});

projectsListEl.addEventListener("input", (e) => {
    const card = e.target.closest(".edit-card");
    if (!card) return;
    const idx = Number(card.dataset.idx);
    const field = e.target.dataset.field;
    const linkField = e.target.dataset.linkField;

    if (field === "title") {
        projects[idx].title = e.target.value;
        card.querySelector(".edit-card-title-text").textContent = e.target.value || "Untitled project";
    } else if (field === "icon") {
        projects[idx].icon = e.target.value;
        card.querySelector(".edit-card-icon-preview i").className = `bi ${e.target.value}`;
    } else if (field === "description") {
        projects[idx].description = e.target.value;
    } else if (field === "tags") {
        projects[idx].tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
    } else if (field === "legacy") {
        projects[idx].legacy = e.target.checked;
    } else if (linkField) {
        const lIdx = Number(e.target.closest(".link-row").dataset.lidx);
        projects[idx].links[lIdx][linkField] = e.target.value;
    }
});

addProjectBtn.addEventListener("click", () => {
    projects.push(emptyProject());
    renderEditor();
});

function setSaveBusy(busy) {
    saveBtn.disabled = busy;
    saveBtnLabel.textContent = busy ? "Saving…" : "Save & deploy";
}

saveBtn.addEventListener("click", async () => {
    setSaveBusy(true);
    showFeedback(saveFeedback, "", "");

    try {
        await saveProjectsFile();
        showFeedback(saveFeedback, "✓ Saved — your live site will update in a minute or two.", "success");
    } catch (err) {
        showFeedback(saveFeedback, `✗ ${err.message}`, "error");
    } finally {
        setSaveBusy(false);
    }
});

function setGateBusy(busy) {
    gateSubmit.disabled = busy;
    gateBtnLabel.textContent = busy ? "Connecting…" : "Connect";
}

async function connect(token) {
    setGateBusy(true);
    showFeedback(gateFeedback, "", "");
    githubToken = token;

    try {
        projects = await fetchProjectsFile();
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        showEditor();
    } catch (err) {
        githubToken = null;
        showFeedback(gateFeedback, `✗ ${err.message}`, "error");
    } finally {
        setGateBusy(false);
    }
}

tokenToggle.addEventListener("click", () => {
    const showing = tokenInput.type === "text";
    tokenInput.type = showing ? "password" : "text";
    tokenToggle.querySelector("i").className = showing ? "bi bi-eye" : "bi bi-eye-slash";
});

gateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const token = tokenInput.value.trim();
    if (token) connect(token);
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    githubToken = null;
    projects = [];
    fileSha = null;
    tokenInput.value = "";

    editorSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    gateSection.classList.remove("hidden");
});

(function init() {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
        tokenInput.value = savedToken;
        connect(savedToken);
    }
})();
