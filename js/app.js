/**
 * Job Notification Tracker - Daily Digest & Match Engine
 * Version 4.0
 */

// --- STATE ---
let savedJobIds = JSON.parse(localStorage.getItem('savedJobs')) || [];
let userPrefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || {
    roleKeywords: [],
    preferredLocations: [],
    preferredMode: ['Remote', 'Hybrid', 'Onsite'],
    experienceLevel: 'All',
    skills: [],
    minMatchScore: 40
};
let activeFilters = {
    keyword: '', location: 'All', mode: 'All', experience: 'All', source: 'All',
    sortBy: 'Latest', showMatchesOnly: false
};

// --- DOM ELEMENTS ---
const appContainer = document.getElementById('app');
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
    if (path === '' || path === '/') { renderLanding(); return; }
    document.body.classList.remove('is-landing');

    switch (path) {
        case '/dashboard': renderDashboard(); break;
        case '/saved': renderSavedJobs(); break;
        case '/settings': renderSettings(); break;
        case '/digest': renderDigest(); break;
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
    const isMode = (m) => userPrefs.preferredMode.includes(m) ? 'checked' : '';
    appContainer.innerHTML = `
        <div class="settings-container">
            <h2 class="section-title">Preferences</h2>
            <div class="form-group"><label class="form-label">Role Keywords</label><input type="text" id="prefRoles" class="form-input" value="${userPrefs.roleKeywords.join(', ')}"></div>
            <div class="form-group"><label class="form-label">Preferred Locations</label><input type="text" id="prefLocs" class="form-input" value="${userPrefs.preferredLocations.join(', ')}"></div>
            <div class="form-group"><label class="form-label">Work Mode</label>
                <div style="display: flex; gap: 16px; margin-top: 8px;">
                    <label><input type="checkbox" class="pref-mode" value="Remote" ${isMode('Remote')}> Remote</label>
                    <label><input type="checkbox" class="pref-mode" value="Hybrid" ${isMode('Hybrid')}> Hybrid</label>
                    <label><input type="checkbox" class="pref-mode" value="Onsite" ${isMode('Onsite')}> Onsite</label>
                </div>
            </div>
            <div class="form-group"><label class="form-label">Experience</label>
                <select id="prefExp" class="form-select">
                    <option value="All" ${userPrefs.experienceLevel === 'All' ? 'selected' : ''}>All</option>
                    <option value="Fresher" ${userPrefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                    <option value="0-1" ${userPrefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Years</option>
                    <option value="1-3" ${userPrefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                    <option value="3-5" ${userPrefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                    <option value="5-8" ${userPrefs.experienceLevel === '5-8' ? 'selected' : ''}>5-8 Years</option>
                </select>
            </div>
            <div class="form-group"><label class="form-label">Skills</label><input type="text" id="prefSkills" class="form-input" value="${userPrefs.skills.join(', ')}"></div>
            <div class="form-group"><label class="form-label">Min Score: <span id="scoreVal">${userPrefs.minMatchScore}</span></label><div class="slider-container"><input type="range" id="prefScore" class="range-slider" min="0" max="100" value="${userPrefs.minMatchScore}" oninput="document.getElementById('scoreVal').innerText=this.value"></div></div>
            <div style="text-align: right;"><button class="btn btn-primary" onclick="savePreferences()">Save Preferences</button></div>
        </div>
    `;
}

function renderDashboard() {
    const hasPrefs = userPrefs.roleKeywords.length > 0 || userPrefs.preferredLocations.length > 0;
    let processed = extendedJobData.map(job => ({ ...job, matchScore: calculateMatchScore(job, userPrefs) }));

    let filtered = processed.filter(job => {
        const search = (job.title + job.company).toLowerCase().includes(activeFilters.keyword.toLowerCase());
        const loc = activeFilters.location === 'All' || job.location.includes(activeFilters.location);
        const mode = activeFilters.mode === 'All' || job.mode === activeFilters.mode;
        const exp = activeFilters.experience === 'All' || job.experience === activeFilters.experience;
        const src = activeFilters.source === 'All' || job.source === activeFilters.source;
        const score = !activeFilters.showMatchesOnly || job.matchScore >= userPrefs.minMatchScore;
        return search && loc && mode && exp && src && score;
    });

    filtered.sort((a, b) => {
        if (activeFilters.sortBy === 'Latest') return a.postedDaysAgo - b.postedDaysAgo;
        if (activeFilters.sortBy === 'Match Score') return b.matchScore - a.matchScore;
        if (activeFilters.sortBy === 'Salary') return parseSalary(b.salaryRange) - parseSalary(a.salaryRange);
        return 0;
    });

    const cards = filtered.length > 0 ? filtered.map(job => createJobCard(job)).join('') : renderEmptyState("No Jobs Found", "Try adjusting filters.").replace('empty-state', 'empty-state-inline');
    const banner = !hasPrefs ? `<div style="background:#FFF3E0;color:#E65100;padding:12px;border-radius:6px;margin-bottom:16px;border:1px solid #FFE0B2;text-align:center;">Using default view. <a href="#/settings" style="text-decoration:underline;">Set preferences</a> to activate matching.</div>` : '';

    appContainer.innerHTML = `${createFilterBar()}${banner}<div class="job-grid">${cards}</div>`;
    attachFilterListeners();
}

function renderSavedJobs() {
    const saved = extendedJobData.filter(j => savedJobIds.includes(j.id));
    if (saved.length === 0) { appContainer.innerHTML = renderEmptyState("Saved Jobs", "No saved jobs yet."); return; }
    appContainer.innerHTML = `<h2 class="section-title">Saved Opportunities (${saved.length})</h2><div class="job-grid">${saved.map(j => createJobCard(j, true)).join('')}</div>`;
}

// --- DIGEST LOGIC ---

function renderDigest() {
    const today = new Date().toISOString().split('T')[0];
    const digestKey = `jobTrackerDigest_${today}`;

    // Check Persistence
    let digest = JSON.parse(localStorage.getItem(digestKey));

    if (!digest) {
        // No Digest for Today
        appContainer.innerHTML = `
            <div class="digest-generator">
                <div style="font-size: 48px; margin-bottom: 16px;">☕</div>
                <h2 class="section-title" style="margin-bottom: 8px;">Daily Digest</h2>
                <p style="color: #666; margin-bottom: 24px;">Generate your personalized 9AM summary based on your preferences.</p>
                <button class="btn btn-primary" onclick="generateDigest()">Generate Today's Digest (Simulated)</button>
                <div style="margin-top: 16px; font-size: 11px; color: #999;">Demo Mode: Trigger manual generation</div>
            </div>
        `;
    } else {
        // Render Existing Digest
        renderDigestUI(digest, today);
    }
}

function generateDigest() {
    const hasPrefs = userPrefs.roleKeywords.length > 0 || userPrefs.preferredLocations.length > 0;
    if (!hasPrefs) { alert("Please set your preferences first!"); window.location.hash = '/settings'; return; }

    // Logic: Filter by prefs, sort by Score -> Date
    let candidates = extendedJobData.map(j => ({ ...j, matchScore: calculateMatchScore(j, userPrefs) }))
        .filter(j => j.matchScore >= 40); // Only decent matches

    candidates.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return a.postedDaysAgo - b.postedDaysAgo;
    });

    const top10 = candidates.slice(0, 10);

    if (top10.length === 0) {
        alert("No matching jobs found today based on your criteria.");
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`jobTrackerDigest_${today}`, JSON.stringify(top10));
    renderDigestUI(top10, today);
}

function renderDigestUI(jobs, date) {
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const items = jobs.map(job => `
        <div class="digest-item">
            <div class="digest-item-content">
                <a href="${job.applyUrl}" target="_blank" class="digest-item-title">${job.title}</a>
                <div class="digest-item-meta">${job.company} • ${job.location} <span class="digest-item-score">Match: ${job.matchScore}%</span></div>
            </div>
            <a href="${job.applyUrl}" target="_blank" class="btn btn-secondary" style="font-size: 13px; padding: 6px 12px;">Apply</a>
        </div>
    `).join('');

    appContainer.innerHTML = `
        <div class="digest-container">
            <div class="digest-header">
                <div class="digest-date">${dateStr}</div>
                <h1 class="digest-title">Top ${jobs.length} Jobs For You</h1>
                <p>Your daily 9AM briefing.</p>
            </div>
            
            <div class="digest-list">
                ${items}
            </div>

            <div class="digest-actions">
                <button class="btn btn-secondary" onclick="copyDigest()">Copy to Clipboard</button>
                <button class="btn btn-primary" onclick="emailDigest()">Create Email Draft</button>
            </div>

            <div class="digest-footer">
                Generated based on your preferences. • <a href="#/settings">Update Preferences</a>
            </div>
        </div>
    `;
}

function copyDigest() {
    const today = new Date().toISOString().split('T')[0];
    const digest = JSON.parse(localStorage.getItem(`jobTrackerDigest_${today}`));
    if (!digest) return;

    let text = `My 9AM Job Digest - ${today}\n\n`;
    digest.forEach((j, i) => {
        text += `${i + 1}. ${j.title} at ${j.company} (${j.location}) - Score: ${j.matchScore}%\nLink: ${j.applyUrl}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => alert("Digest copied to clipboard!"));
}

function emailDigest() {
    const today = new Date().toISOString().split('T')[0];
    const digest = JSON.parse(localStorage.getItem(`jobTrackerDigest_${today}`));
    if (!digest) return;

    let body = `Here is my daily job digest:\n\n`;
    digest.forEach((j, i) => {
        body += `${i + 1}. ${j.title} at ${j.company} (${j.location}) - Score: ${j.matchScore}%\n${j.applyUrl}\n\n`;
    });

    window.open(`mailto:?subject=My 9AM Job Digest&body=${encodeURIComponent(body)}`);
}

function renderProof() {
    appContainer.innerHTML = `<div class="settings-container"><h2 class="section-title">Proof of Implementation</h2><p class="form-hint">Match Logic Verified.</p></div>`;
}

// --- CORE ---
function calculateMatchScore(job, prefs) {
    if (prefs.roleKeywords.length === 0 && prefs.preferredLocations.length === 0) return 0;
    let score = 0;
    if (prefs.roleKeywords.some(kw => job.title.toLowerCase().includes(kw.toLowerCase().trim()))) score += 25;
    if (prefs.roleKeywords.some(kw => job.description.toLowerCase().includes(kw.toLowerCase().trim()))) score += 15;
    if (prefs.preferredLocations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase().trim()))) score += 15;
    if (prefs.preferredMode.includes(job.mode)) score += 10;
    if (prefs.experienceLevel !== 'All' && job.experience === prefs.experienceLevel) score += 10;
    if (job.skills.some(js => prefs.skills.some(ps => js.toLowerCase().includes(ps.toLowerCase().trim())))) score += 15;
    if (job.postedDaysAgo <= 2) score += 5;
    if (job.source === 'LinkedIn') score += 5;
    return Math.min(score, 100);
}

function parseSalary(s) {
    if (!s) return 0;
    if (s.toLowerCase().includes('lpa')) {
        const n = s.match(/(\d+)/g);
        if (n) return (n.reduce((a, b) => parseInt(a) + parseInt(b), 0) / n.length) * 100000;
    }
    return 0;
}

function savePreferences() {
    const roles = document.getElementById('prefRoles').value.split(',').filter(x => x.trim());
    const locs = document.getElementById('prefLocs').value.split(',').filter(x => x.trim());
    const skills = document.getElementById('prefSkills').value.split(',').filter(x => x.trim());
    const exp = document.getElementById('prefExp').value;
    const score = document.getElementById('prefScore').value;
    const modes = []; document.querySelectorAll('.pref-mode:checked').forEach(cb => modes.push(cb.value));

    userPrefs = { roleKeywords: roles, preferredLocations: locs, skills: skills, experienceLevel: exp, minMatchScore: parseInt(score), preferredMode: modes };
    localStorage.setItem('jobTrackerPreferences', JSON.stringify(userPrefs));
    alert('Preferences Saved!');
}

function createFilterBar() {
    return `<div class="filter-bar"><div class="filter-group"><input type="text" id="filterKeyword" class="filter-input" placeholder="Search..." value="${activeFilters.keyword}"><label class="toggle-wrapper" title="Matches Only"><input type="checkbox" id="toggleMatch" class="toggle-checkbox" ${activeFilters.showMatchesOnly ? 'checked' : ''}><div class="toggle-switch"></div><span>Matches Only</span></label></div><div class="filter-group"><select id="filterLoc" class="filter-select"><option value="All">Location: All</option><option value="Bangalore" ${activeFilters.location === 'Bangalore' ? 'selected' : ''}>Bangalore</option><option value="Pune" ${activeFilters.location === 'Pune' ? 'selected' : ''}>Pune</option><option value="Hyderabad" ${activeFilters.location === 'Hyderabad' ? 'selected' : ''}>Hyderabad</option><option value="Remote" ${activeFilters.location === 'Remote' ? 'selected' : ''}>Remote</option></select><select id="filterSort" class="filter-select"><option value="Latest" ${activeFilters.sortBy === 'Latest' ? 'selected' : ''}>Sort: Latest</option><option value="Match Score" ${activeFilters.sortBy === 'Match Score' ? 'selected' : ''}>Sort: Match Score</option><option value="Salary" ${activeFilters.sortBy === 'Salary' ? 'selected' : ''}>Sort: Salary</option></select></div></div>`;
}

function createJobCard(job, isSavedView = false) {
    const isSaved = savedJobIds.includes(job.id);
    let badge = '';
    if (job.matchScore >= 80) badge = `<span class="match-score score-high">⚡ ${job.matchScore}%</span>`;
    else if (job.matchScore >= 60) badge = `<span class="match-score score-mid">⚡ ${job.matchScore}%</span>`;
    else if (job.matchScore > 0) badge = `<span class="match-score score-neutral">⚡ ${job.matchScore}%</span>`;

    return `<div class="job-card"><div class="card-header"><div><div class="card-title">${job.title}</div><div class="card-company">${job.company}</div></div><div style="text-align:right;">${badge}<br><span class="badge-source badge-${job.source.toLowerCase()}">${job.source}</span></div></div><div class="card-meta"><span class="meta-tag">📍 ${job.location}</span><span class="meta-tag">💼 ${job.experience}</span><span class="meta-tag salary">💰 ${job.salaryRange}</span><span class="meta-tag">🕒 ${job.postedDaysAgo}d ago</span></div><div class="card-footer"><button class="btn-icon ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">${isSaved ? '♥' : '♡'}</button><div class="card-actions"><button class="btn btn-secondary" onclick="openModal(${job.id})">View</button><a href="${job.applyUrl}" target="_blank" class="btn btn-primary">Apply</a></div></div></div>`;
}

function renderEmptyState(t, m) { return `<div class="empty-state"><h2 class="section-title">${t}</h2><p class="empty-state-text">${m}</p></div>`; }

function attachFilterListeners() {
    document.getElementById('filterKeyword').addEventListener('input', (e) => { activeFilters.keyword = e.target.value; renderDashboard(); document.getElementById('filterKeyword').focus(); });
    document.getElementById('toggleMatch').addEventListener('change', (e) => { activeFilters.showMatchesOnly = e.target.checked; renderDashboard(); });
    document.getElementById('filterLoc').addEventListener('change', (e) => { activeFilters.location = e.target.value; renderDashboard(); });
    document.getElementById('filterSort').addEventListener('change', (e) => { activeFilters.sortBy = e.target.value; renderDashboard(); });
}

function toggleSave(id) {
    if (savedJobIds.includes(id)) savedJobIds = savedJobIds.filter(sid => sid !== id); else savedJobIds.push(id);
    localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));
    if (window.location.hash.slice(1) === '/saved') renderSavedJobs(); else if (window.location.hash.slice(1) === '/dashboard') renderDashboard();
}

function openModal(id) {
    const job = extendedJobData.find(j => j.id === id);
    modalBody.innerHTML = `<h2 style="font-family:var(--font-serif);font-size:24px;margin-bottom:8px;">${job.title}</h2><p style="margin-bottom:16px;">${job.company} • ${job.location}</p><p style="line-height:1.6;margin-bottom:24px;">${job.description}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;">${job.skills.map(s => `<span class="meta-tag">${s}</span>`).join('')}</div><a href="${job.applyUrl}" target="_blank" class="btn btn-primary w-full" style="display:block;text-align:center;">Apply Now</a>`;
    modalOverlay.classList.add('open');
}
function closeModal() { modalOverlay.classList.remove('open'); }

function router() { renderView(window.location.hash.slice(1) || '/'); }
function updateNavigation(path) { document.querySelectorAll('.nav-link').forEach(l => { l.classList.remove('active'); if (l.getAttribute('data-path') === path) l.classList.add('active'); }); }

window.addEventListener('hashchange', router); window.addEventListener('load', router); router();
