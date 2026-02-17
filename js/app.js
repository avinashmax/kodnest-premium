/**
 * Job Notification Tracker - Premium App Logic
 * Version 2.0 (With Data & Interactions)
 */

// State
let savedJobIds = JSON.parse(localStorage.getItem('savedJobs')) || [];
let activeFilters = { keyword: '', location: 'All', mode: 'All', experience: 'All' };

const appContainer = document.getElementById('app');
const menuOverlay = document.getElementById('mobileMenu');
const modalOverlay = document.getElementById('jobModal');
const modalBody = document.getElementById('modalBody');

// --- ROUTER ---
const routes = {
    '/': 'Landing',
    '/dashboard': 'Dashboard',
    '/saved': 'Saved Jobs',
    '/digest': 'Daily Digest',
    '/settings': 'Settings',
    '/proof': 'Proof of Work'
};

function renderView(path) {
    // Normalize path
    if (path === '' || path === '/') {
        renderLanding();
        return;
    }
    document.body.classList.remove('is-landing');

    switch (path) {
        case '/dashboard':
            renderDashboard();
            break;
        case '/saved':
            renderSavedJobs();
            break;
        case '/settings':
            appContainer.innerHTML = renderSettingsForm();
            break;
        case '/digest':
            appContainer.innerHTML = renderEmptyState("Daily Digest", "Your 9AM daily summary will appear here.");
            break;
        case '/proof':
            appContainer.innerHTML = renderEmptyState("Proof of Work", "Artifact collection placeholder.");
            break;
        default:
            appContainer.innerHTML = `<div class="hero-section"><h1>404</h1></div>`;
    }
}

// --- RENDERERS ---

function renderLanding() {
    document.body.classList.add('is-landing');
    appContainer.innerHTML = `
        <div class="hero-section">
            <h1 class="hero-headline">Stop Missing The Right Jobs.</h1>
            <p class="hero-subtext">Precision-matched job discovery delivered daily at 9AM.</p>
            <a href="#/dashboard" class="btn btn-primary" style="font-size: 18px; padding: 16px 32px;">Explore Jobs</a>
        </div>
    `;
}

function renderSettingsForm() {
    return `
        <div class="settings-container">
            <h2 class="section-title">Preferences</h2>
            <div class="form-group"><label class="form-label">Role Keywords</label><input type="text" class="form-input" placeholder="e.g. Frontend Engineer"></div>
            <div class="form-group"><label class="form-label">Preferred Locations</label><input type="text" class="form-input" placeholder="e.g. Bangalore"></div>
            <div style="text-align: right;"><button class="btn btn-primary">Save Preferences</button></div>
        </div>
    `;
}

function renderEmptyState(title, message) {
    return `<div class="empty-state"><h2 class="section-title">${title}</h2><p class="empty-state-text">${message}</p></div>`;
}

function renderDashboard() {
    // 1. Filter Data (Using extendedJobData from data.js)
    const filteredJobs = extendedJobData.filter(job => {
        const matchesKeyword = (job.title + job.company).toLowerCase().includes(activeFilters.keyword.toLowerCase());
        const matchesLocation = activeFilters.location === 'All' || job.location.includes(activeFilters.location);
        const matchesMode = activeFilters.mode === 'All' || job.mode === activeFilters.mode;
        const matchesExp = activeFilters.experience === 'All' || job.experience === activeFilters.experience;
        return matchesKeyword && matchesLocation && matchesMode && matchesExp;
    });

    // 2. Generate Grid
    const cardsHtml = filteredJobs.length > 0
        ? filteredJobs.map(job => createJobCard(job)).join('')
        : renderEmptyState("No Jobs Found", "Try adjusting your filters.").replace('empty-state', 'empty-state-inline');

    // 3. Render Full Page
    appContainer.innerHTML = `
        ${createFilterBar()}
        <div class="job-grid">
            ${cardsHtml}
        </div>
    `;

    // 4. Attach Event Listeners to inputs
    attachFilterListeners();
}

function renderSavedJobs() {
    const savedJobs = extendedJobData.filter(job => savedJobIds.includes(job.id));

    if (savedJobs.length === 0) {
        appContainer.innerHTML = renderEmptyState("Saved Jobs", "You haven't saved any jobs yet.");
        return;
    }

    const cardsHtml = savedJobs.map(job => createJobCard(job, true)).join('');

    appContainer.innerHTML = `
        <h2 class="section-title" style="margin-bottom: var(--space-3);">Saved Opportunities (${savedJobs.length})</h2>
        <div class="job-grid">
            ${cardsHtml}
        </div>
    `;
}

// --- COMPONENTS ---

function createFilterBar() {
    return `
        <div class="filter-bar">
            <input type="text" id="filterKeyword" class="filter-input" placeholder="Search title or company..." value="${activeFilters.keyword}">
            <select id="filterLocation" class="filter-select">
                <option value="All">All Locations</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Pune">Pune</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Remote">Remote</option>
            </select>
            <select id="filterMode" class="filter-select">
                <option value="All">All Modes</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
            </select>
            <select id="filterExp" class="filter-select">
                <option value="All">All Experience</option>
                <option value="Fresher">Fresher</option>
                <option value="0-1">0-1 Years</option>
                <option value="1-3">1-3 Years</option>
                <option value="3-5">3-5 Years</option>
            </select>
            <span style="font-size: 14px; color: #777; margin-left: auto;">${extendedJobData.length} Jobs</span>
        </div>
    `;
}

function createJobCard(job, isSavedView = false) {
    const isSaved = savedJobIds.includes(job.id);
    const badgeClass = `badge-${job.source.toLowerCase()}`;

    return `
        <div class="job-card">
            <div class="card-header">
                <div>
                    <div class="card-title">${job.title}</div>
                    <div class="card-company">${job.company}</div>
                </div>
                <span class="badge-source ${badgeClass}">${job.source}</span>
            </div>
            
            <div class="card-meta">
                <span class="meta-tag">📍 ${job.location} (${job.mode})</span>
                <span class="meta-tag">💼 ${job.experience}</span>
                <span class="meta-tag salary">💰 ${job.salaryRange}</span>
                <span class="meta-tag">🕒 ${job.postedDaysAgo}d ago</span>
            </div>

            <div class="card-footer">
                 <button class="btn-icon ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})" title="${isSaved ? 'Unsave' : 'Save'}">
                    ${isSaved ? '♥' : '♡'}
                 </button>
                 <div class="card-actions">
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;" onclick="openModal(${job.id})">View</button>
                    <a href="${job.applyUrl}" target="_blank" class="btn btn-primary" style="padding: 6px 12px; font-size: 13px;">Apply</a>
                 </div>
            </div>
        </div>
    `;
}

// --- LOGIC ---

function attachFilterListeners() {
    document.getElementById('filterKeyword').addEventListener('input', (e) => {
        activeFilters.keyword = e.target.value;
        renderDashboard(); // Re-render (optimize in prod)
        // Ideally focus back on input, but full re-render kills focus.
        // For prototype, we settle. In React this is easy. 
        // Quick fix: refocus
        document.getElementById('filterKeyword').focus();
    });

    // Select listeners
    ['filterLocation', 'filterMode', 'filterExp'].forEach(id => {
        const el = document.getElementById(id);
        el.value = activeFilters[id.replace('filter', '').toLowerCase()] || activeFilters[id.replace('filter', '') === 'Exp' ? 'experience' : '']; // mapping hack
        if (id === 'filterExp') el.value = activeFilters.experience; // fix key
        if (id === 'filterLocation') el.value = activeFilters.location;
        if (id === 'filterMode') el.value = activeFilters.mode;

        el.addEventListener('change', (e) => {
            const key = id.replace('filter', '').toLowerCase();
            activeFilters[key === 'exp' ? 'experience' : key] = e.target.value;
            renderDashboard();
        });
    });
}

function toggleSave(id) {
    if (savedJobIds.includes(id)) {
        savedJobIds = savedJobIds.filter(sid => sid !== id);
    } else {
        savedJobIds.push(id);
    }
    localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));

    // Refresh current view safely
    const currentHash = window.location.hash.slice(1);
    if (currentHash === '/saved' || currentHash === '/dashboard') {
        renderView(currentHash);
    }
}

function openModal(id) {
    const job = extendedJobData.find(j => j.id === id);
    if (!job) return;

    modalBody.innerHTML = `
        <h2 style="font-family: var(--font-serif); font-size: 24px; margin-bottom: 8px;">${job.title}</h2>
        <p style="font-size: 16px; color: #555; margin-bottom: 16px;">${job.company} • ${job.location}</p>
        
        <div style="margin-bottom: 16px;">
            <h4 style="font-weight: 600; margin-bottom: 8px;">Description</h4>
            <p style="line-height: 1.6; color: #333;">${job.description}</p>
        </div>

        <div style="margin-bottom: 24px;">
            <h4 style="font-weight: 600; margin-bottom: 8px;">Skills</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${job.skills.map(skill => `<span class="meta-tag">${skill}</span>`).join('')}
            </div>
        </div>

        <a href="${job.applyUrl}" target="_blank" class="btn btn-primary w-full" style="display: block; text-align: center;">Apply Now</a>
    `;

    modalOverlay.classList.add('open');
}

function closeModal() {
    modalOverlay.classList.remove('open');
}

// Router Glue
function router() {
    let path = window.location.hash.slice(1) || '/';
    renderView(path);
    updateNavigation(path);
}

function updateNavigation(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-path') === path) link.classList.add('active');
    });
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router();
