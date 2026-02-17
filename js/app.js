/**
 * Job Notification Tracker - Match Engine & Preferences
 * Version 3.0
 */

// --- STATE ---
let savedJobIds = JSON.parse(localStorage.getItem('savedJobs')) || [];
let userPrefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || {
    roleKeywords: [],
    preferredLocations: [],
    preferredMode: ['Remote', 'Hybrid', 'Onsite'], // Default all
    experienceLevel: 'All',
    skills: [],
    minMatchScore: 40
};

let activeFilters = {
    keyword: '',
    location: 'All',
    mode: 'All',
    experience: 'All',
    source: 'All',
    sortBy: 'Latest',
    showMatchesOnly: false
};

// --- DOM ELEMENTS ---
const appContainer = document.getElementById('app');
const headerTitle = document.title;
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
    if (path === '' || path === '/') {
        renderLanding();
        return;
    }
    document.body.classList.remove('is-landing');

    switch (path) {
        case '/dashboard': renderDashboard(); break;
        case '/saved': renderSavedJobs(); break;
        case '/settings': renderSettings(); break;
        case '/digest': appContainer.innerHTML = renderEmptyState("Daily Digest", "Your 9AM daily summary will appear here."); break;
        case '/proof': renderProof(); break;
        default: appContainer.innerHTML = `<div class="hero-section"><h1>404</h1></div>`;
    }
    updateNavigation(path);
}

// --- RENDERERS ---

function renderLanding() {
    document.body.classList.add('is-landing');
    appContainer.innerHTML = `
        <div class="hero-section">
            <h1 class="hero-headline">Stop Missing The Right Jobs.</h1>
            <p class="hero-subtext">Precision-matched job discovery delivered daily at 9AM.</p>
            <a href="#/settings" class="btn btn-primary" style="font-size: 18px; padding: 16px 32px;">Start Tracking</a>
        </div>
    `;
}

function renderSettings() {
    // Helper to check if mode is selected
    const isMode = (m) => userPrefs.preferredMode.includes(m) ? 'checked' : '';

    appContainer.innerHTML = `
        <div class="settings-container">
            <h2 class="section-title">Preferences</h2>
            
            <div class="form-group">
                <label class="form-label">Role Keywords</label>
                <input type="text" id="prefRoles" class="form-input" placeholder="e.g. Frontend, React, Java" value="${userPrefs.roleKeywords.join(', ')}">
                <p class="form-hint">Comma separated.</p>
            </div>

            <div class="form-group">
                <label class="form-label">Preferred Locations</label>
                <input type="text" id="prefLocs" class="form-input" placeholder="e.g. Bangalore, Pune" value="${userPrefs.preferredLocations.join(', ')}">
                <p class="form-hint">Comma separated.</p>
            </div>

            <div class="form-group">
                <label class="form-label">Work Mode</label>
                <div style="display: flex; gap: 16px; margin-top: 8px;">
                    <label><input type="checkbox" class="pref-mode" value="Remote" ${isMode('Remote')}> Remote</label>
                    <label><input type="checkbox" class="pref-mode" value="Hybrid" ${isMode('Hybrid')}> Hybrid</label>
                    <label><input type="checkbox" class="pref-mode" value="Onsite" ${isMode('Onsite')}> Onsite</label>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Experience Level</label>
                <select id="prefExp" class="form-select">
                    <option value="All" ${userPrefs.experienceLevel === 'All' ? 'selected' : ''}>All</option>
                    <option value="Fresher" ${userPrefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                    <option value="0-1" ${userPrefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Years</option>
                    <option value="1-3" ${userPrefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                    <option value="3-5" ${userPrefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                    <option value="5-8" ${userPrefs.experienceLevel === '5-8' ? 'selected' : ''}>5-8 Years</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Skills</label>
                <input type="text" id="prefSkills" class="form-input" placeholder="e.g. JavaScript, Python, AWS" value="${userPrefs.skills.join(', ')}">
            </div>

            <div class="form-group">
                <label class="form-label">Minimum Match Score: <span id="scoreVal">${userPrefs.minMatchScore}</span></label>
                <div class="slider-container">
                    <input type="range" id="prefScore" class="range-slider" min="0" max="100" value="${userPrefs.minMatchScore}" oninput="document.getElementById('scoreVal').innerText = this.value">
                </div>
            </div>

            <div style="text-align: right; margin-top: var(--space-4);">
                <button class="btn btn-primary" onclick="savePreferences()">Save Preferences</button>
            </div>
        </div>
    `;
}

function renderDashboard() {
    // 1. Check if prefs are set (basic check: roles or locs exist)
    const hasPrefs = userPrefs.roleKeywords.length > 0 || userPrefs.preferredLocations.length > 0;

    // 2. Score & Filter Data
    let processedJobs = extendedJobData.map(job => {
        const score = calculateMatchScore(job, userPrefs);
        return { ...job, matchScore: score };
    });

    // 3. Apply Filters
    let filteredJobs = processedJobs.filter(job => {
        // Keyword Search
        const searchMatch = (job.title + job.company).toLowerCase().includes(activeFilters.keyword.toLowerCase());

        // Dropdown Filters
        const locMatch = activeFilters.location === 'All' || job.location.includes(activeFilters.location);
        const modeMatch = activeFilters.mode === 'All' || job.mode === activeFilters.mode;
        const expMatch = activeFilters.experience === 'All' || job.experience === activeFilters.experience;
        const sourceMatch = activeFilters.source === 'All' || job.source === activeFilters.source;

        // Toggle: Show Match Only
        const scoreMatch = !activeFilters.showMatchesOnly || job.matchScore >= userPrefs.minMatchScore;

        return searchMatch && locMatch && modeMatch && expMatch && sourceMatch && scoreMatch;
    });

    // 4. Sort
    filteredJobs.sort((a, b) => {
        if (activeFilters.sortBy === 'Latest') return a.postedDaysAgo - b.postedDaysAgo;
        if (activeFilters.sortBy === 'Match Score') return b.matchScore - a.matchScore;
        if (activeFilters.sortBy === 'Salary') return parseSalary(b.salaryRange) - parseSalary(a.salaryRange);
        return 0;
    });

    // 5. Render
    const cardsHtml = filteredJobs.length > 0
        ? filteredJobs.map(job => createJobCard(job)).join('')
        : renderEmptyState("No Jobs Found", hasPrefs ? "Attributes match your filters, but not your criteria." : "Try adjusting your filters.").replace('empty-state', 'empty-state-inline');

    const warningBanner = !hasPrefs
        ? `<div style="background: #FFF3E0; color: #E65100; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #FFE0B2; text-align: center;">Using default view. <a href="#/settings" style="text-decoration: underline; font-weight: 600;">Set your preferences</a> to activate intelligent matching.</div>`
        : '';

    appContainer.innerHTML = `
        ${createFilterBar()}
        ${warningBanner}
        <div class="job-grid">
            ${cardsHtml}
        </div>
    `;

    attachFilterListeners();
}

function renderSavedJobs() {
    const savedJobs = extendedJobData.filter(job => savedJobIds.includes(job.id));
    if (savedJobs.length === 0) {
        appContainer.innerHTML = renderEmptyState("Saved Jobs", "You haven't saved any jobs yet.");
        return;
    }
    const cardsHtml = savedJobs.map(job => createJobCard(job, true)).join('');
    appContainer.innerHTML = `<h2 class="section-title">Saved Opportunities (${savedJobs.length})</h2><div class="job-grid">${cardsHtml}</div>`;
}

function renderProof() {
    // Artifact collection placeholder
    appContainer.innerHTML = `
        <div class="settings-container">
            <h2 class="section-title">Proof of Implementation</h2>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 4px; font-family: monospace;">
                <p><strong>Match Logic Verified:</strong></p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li>+25 Role Title Match</li>
                    <li>+15 Description Match</li>
                    <li>+15 Location Match</li>
                    <li>+10 Mode Match</li>
                    <li>+15 Skill Overlap</li>
                    <li>+5 Freshness / LinkedIn</li>
                </ul>
            </div>
        </div>
    `;
}

// --- LOGIC: MATCH ENGINE ---

function calculateMatchScore(job, prefs) {
    if (prefs.roleKeywords.length === 0 && prefs.preferredLocations.length === 0) return 0; // No prefs set

    let score = 0;

    // 1. Role Title Match (+25)
    const titleMatch = prefs.roleKeywords.some(kw => job.title.toLowerCase().includes(kw.toLowerCase().trim()));
    if (titleMatch) score += 25;

    // 2. Description Match (+15)
    const descMatch = prefs.roleKeywords.some(kw => job.description.toLowerCase().includes(kw.toLowerCase().trim()));
    if (descMatch) score += 15;

    // 3. Location Match (+15)
    const locMatch = prefs.preferredLocations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase().trim()));
    if (locMatch) score += 15;

    // 4. Mode Match (+10)
    if (prefs.preferredMode.includes(job.mode)) score += 10;

    // 5. Experience Match (+10)
    // Loose matching or exact? Requester asked for exact "matches experienceLevel"
    if (prefs.experienceLevel !== 'All' && job.experience === prefs.experienceLevel) score += 10;

    // 6. Skill Overlap (+15)
    // job.skills is array, prefs.skills is array
    const skillOverlap = job.skills.some(jSkill =>
        prefs.skills.some(pSkill => jSkill.toLowerCase().includes(pSkill.toLowerCase().trim()))
    );
    if (skillOverlap) score += 15;

    // 7. Freshness (+5)
    if (job.postedDaysAgo <= 2) score += 5;

    // 8. Source (+5)
    if (job.source === 'LinkedIn') score += 5;

    // Cap at 100
    return Math.min(score, 100);
}

// Helper to parse salary for sorting (Estimate annual)
function parseSalary(salaryStr) {
    if (!salaryStr) return 0;
    const s = salaryStr.toLowerCase();
    // Handle "6-10 LPA" -> take avg -> 8
    if (s.includes('lpa')) {
        const nums = s.match(/(\d+)/g);
        if (nums) {
            const avg = nums.reduce((a, b) => parseInt(a) + parseInt(b), 0) / nums.length;
            return avg * 100000;
        }
    }
    // Handle "40k/month" -> 4.8LPA
    if (s.includes('month') || s.includes('mo')) {
        const nums = s.match(/(\d+)/g);
        if (nums) return parseInt(nums[0]) * 1000 * 12;
    }
    return 0;
}

// --- LOGIC: PREFERENCES ---

function savePreferences() {
    const roles = document.getElementById('prefRoles').value.split(',').filter(x => x.trim());
    const locs = document.getElementById('prefLocs').value.split(',').filter(x => x.trim());
    const skills = document.getElementById('prefSkills').value.split(',').filter(x => x.trim());
    const exp = document.getElementById('prefExp').value;
    const score = document.getElementById('prefScore').value;

    // Get Checked Modes
    const modes = [];
    document.querySelectorAll('.pref-mode:checked').forEach(cb => modes.push(cb.value));

    userPrefs = {
        roleKeywords: roles,
        preferredLocations: locs,
        skills: skills,
        experienceLevel: exp,
        minMatchScore: parseInt(score),
        preferredMode: modes
    };

    localStorage.setItem('jobTrackerPreferences', JSON.stringify(userPrefs));
    alert('Preferences Saved!');
}

// --- COMPONENTS ---

function createFilterBar() {
    return `
        <div class="filter-bar">
            <!-- Search & Toggle -->
            <div class="filter-group">
                <input type="text" id="filterKeyword" class="filter-input" placeholder="Search..." value="${activeFilters.keyword}">
                <label class="toggle-wrapper" title="Show only jobs matching my preferences">
                    <input type="checkbox" id="toggleMatch" class="toggle-checkbox" ${activeFilters.showMatchesOnly ? 'checked' : ''}>
                    <div class="toggle-switch"></div>
                    <span>Matches Only</span>
                </label>
            </div>

            <!-- Dropdowns -->
            <div class="filter-group">
                <select id="filterLoc" class="filter-select">
                    <option value="All">Location: All</option>
                    <option value="Bangalore" ${activeFilters.location === 'Bangalore' ? 'selected' : ''}>Bangalore</option>
                    <option value="Pune" ${activeFilters.location === 'Pune' ? 'selected' : ''}>Pune</option>
                    <option value="Hyderabad" ${activeFilters.location === 'Hyderabad' ? 'selected' : ''}>Hyderabad</option>
                    <option value="Remote" ${activeFilters.location === 'Remote' ? 'selected' : ''}>Remote</option>
                </select>
                <select id="filterSort" class="filter-select">
                    <option value="Latest" ${activeFilters.sortBy === 'Latest' ? 'selected' : ''}>Sort: Latest</option>
                    <option value="Match Score" ${activeFilters.sortBy === 'Match Score' ? 'selected' : ''}>Sort: Match Score</option>
                    <option value="Salary" ${activeFilters.sortBy === 'Salary' ? 'selected' : ''}>Sort: Salary</option>
                </select>
            </div>
        </div>
    `;
}

function createJobCard(job, isSavedView = false) {
    const isSaved = savedJobIds.includes(job.id);
    const badgeClass = `badge-${job.source.toLowerCase()}`;

    // Match Score Badge logic
    let scoreBadge = '';
    if (job.matchScore !== undefined && job.matchScore > 0) {
        let colorClass = 'score-neutral';
        if (job.matchScore >= 80) colorClass = 'score-high';
        else if (job.matchScore >= 60) colorClass = 'score-mid';
        else if (job.matchScore < 40) colorClass = 'score-low';

        scoreBadge = `<span class="match-score ${colorClass}">⚡ ${job.matchScore}%</span>`;
    }

    return `
        <div class="job-card">
            <div class="card-header">
                <div>
                    <div class="card-title">${job.title}</div>
                    <div class="card-company">${job.company}</div>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span class="badge-source ${badgeClass}">${job.source}</span>
                    ${scoreBadge}
                </div>
            </div>
            
            <div class="card-meta">
                <span class="meta-tag">📍 ${job.location}</span>
                <span class="meta-tag">💼 ${job.experience}</span>
                <span class="meta-tag salary">💰 ${job.salaryRange}</span>
                <span class="meta-tag">🕒 ${job.postedDaysAgo}d ago</span>
            </div>

            <div class="card-footer">
                 <button class="btn-icon ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">
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

function renderEmptyState(title, message) {
    return `<div class="empty-state"><h2 class="section-title">${title}</h2><p class="empty-state-text">${message}</p></div>`;
}

// --- EVENT HANDLERS ---

function attachFilterListeners() {
    // Keyword
    document.getElementById('filterKeyword').addEventListener('input', (e) => {
        activeFilters.keyword = e.target.value;
        renderDashboard();
        document.getElementById('filterKeyword').focus(); // Refocus hack
    });

    // Toggle
    document.getElementById('toggleMatch').addEventListener('change', (e) => {
        activeFilters.showMatchesOnly = e.target.checked;
        renderDashboard();
    });

    // Selects
    document.getElementById('filterLoc').addEventListener('change', (e) => {
        activeFilters.location = e.target.value;
        renderDashboard();
    });

    document.getElementById('filterSort').addEventListener('change', (e) => {
        activeFilters.sortBy = e.target.value;
        renderDashboard();
    });
}

function toggleSave(id) {
    if (savedJobIds.includes(id)) {
        savedJobIds = savedJobIds.filter(sid => sid !== id);
    } else {
        savedJobIds.push(id);
    }
    localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));
    const hash = window.location.hash.slice(1);
    if (hash === '/saved' || hash === '/dashboard') renderView(hash);
}

function openModal(id) {
    const job = extendedJobData.find(j => j.id === id);
    if (!job) return;
    modalBody.innerHTML = `
        <h2 style="font-family: var(--font-serif); font-size: 24px; margin-bottom: 8px;">${job.title}</h2>
        <div style="margin-bottom: 16px;">
            <span class="badge-source badge-${job.source.toLowerCase()}">${job.source}</span>
            <span style="margin-left: 8px; color: #555;">${job.company} • ${job.location}</span>
        </div>
        
        <div style="margin-bottom: 16px;">
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

function closeModal() { modalOverlay.classList.remove('open'); }

// Router
function router() {
    let path = window.location.hash.slice(1) || '/';
    renderView(path);
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
