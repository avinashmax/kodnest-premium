/**
 * Job Notification Tracker - COMPLETE APP LOGIC
 * Version 8.0 | High Fidelity Restoration
 */

// --- STATE ---
let savedJobIds = JSON.parse(localStorage.getItem('savedJobs')) || [];
let jobStatus = JSON.parse(localStorage.getItem('jobTrackerStatus')) || {};
let activityLog = JSON.parse(localStorage.getItem('jobTrackerActivity')) || [];
let testState = JSON.parse(localStorage.getItem('jobTrackerTests')) || {};
let submissionLinks = JSON.parse(localStorage.getItem('jobTrackerLinks')) || { lovable: '', github: '', deploy: '' };

let userPrefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || {
    roleKeywords: [], preferredLocations: [], preferredMode: ['Remote', 'Hybrid', 'Onsite'], experienceLevel: 'All', skills: [], minMatchScore: 40
};
let activeFilters = {
    keyword: '', location: 'All', mode: 'All', experience: 'All', source: 'All', status: 'All',
    sortBy: 'Latest', showMatchesOnly: false
};

// --- CONSTANTS ---
const milestones = [
    { title: 'Project Initialization', check: () => true },
    { title: 'Design System Foundation', check: () => true },
    { title: 'Global Layout & Router', check: () => true },
    { title: 'Job Dashboard Implementation', check: () => true },
    { title: 'Match Engine & Logic', check: () => true },
    { title: 'Status Tracking & Storage', check: () => true },
    { title: 'Daily Digest Engine', check: () => true },
    { title: 'Manual Quality Checklist', check: () => Object.keys(testState).filter(k => testState[k]).length === 10 }
];

const testItems = [
    { id: 't1', label: 'Preferences persist after refresh', hint: 'Set a keyword, refresh, and check Settings again.' },
    { id: 't2', label: 'Match score calculates correctly', hint: 'Verify score matches your criteria on Dashboard.' },
    { id: 't3', label: '"Show only matches" toggle works', hint: 'Toggle it and verify low-score jobs disappear.' },
    { id: 't4', label: 'Save job persists after refresh', hint: 'Save a job, refresh, and check Saved tab.' },
    { id: 't5', label: 'Apply opens in new tab', hint: 'Click Apply and check if a new tab opens.' },
    { id: 't6', label: 'Status update persists after refresh', hint: 'Change status to Applied, refresh, verify status.' },
    { id: 't7', label: 'Status filter works correctly', hint: 'Filter by "Applied" and verify results.' },
    { id: 't8', label: 'Digest generates top 10 by score', hint: 'Generate digest and check if they are the best matches.' },
    { id: 't9', label: 'Digest persists for the day', hint: 'Refresh Digest page to verify content stays same for today.' },
    { id: 't10', label: 'No console errors on main pages', hint: 'Open DevTools (F12) and check for red error logs.' }
];

// --- DOM ELEMENTS ---
const appContainer = document.getElementById('app');
const modalOverlay = document.getElementById('jobModal');
const modalBody = document.getElementById('modalBody');

// --- ROUTER ---
function renderView(path) {
    console.log("Routing to:", path); // Debugging 404

    // Navigation Protection (Final Submission Lock)
    if (path === '/jt/08-ship') {
        const testsPassed = testItems.filter(item => testState[item.id]).length === 10;
        const linksProvided = submissionLinks.lovable && submissionLinks.github && submissionLinks.deploy;
        if (!testsPassed || !linksProvided) {
            window.location.hash = '/jt/proof';
            showToast("Required: Complete all tests and provide all project links.");
            return;
        }
    }

    if (path === '' || path === '/') { renderLanding(); return; }
    document.body.classList.remove('is-landing');

    switch (path) {
        case '/dashboard': renderDashboard(); break;
        case '/saved': renderSavedJobs(); break;
        case '/settings': renderSettings(); break;
        case '/digest': renderDigest(); break;
        case '/jt/07-test': renderTestChecklist(); break;
        case '/jt/proof': renderProofPage(); break;
        case '/jt/08-ship': renderShipPage(); break;
        default:
            console.error("404 Case for path:", path);
            appContainer.innerHTML = `<div class="placeholder-content"><h1 class="placeholder-title">404</h1><p class="placeholder-subtitle">Path: ${path} not found. <a href="#/">Go Home</a></p></div>`;
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
            <div style="display:flex; gap:16px; justify-content:center; margin-top: 32px;">
                <a href="#/jt/07-test" class="btn btn-secondary">Test Module</a>
                <a href="#/jt/proof" class="btn btn-primary" style="background: var(--color-accent); color: white;">Submit Project</a>
            </div>
        </div>
    `;
}

function renderDashboard() {
    const hasPrefs = userPrefs.roleKeywords.length > 0 || userPrefs.preferredLocations.length > 0;

    let processed = extendedJobData.map(job => ({
        ...job,
        matchScore: calculateMatchScore(job, userPrefs)
    }));

    let filtered = processed.filter(job => {
        const search = (job.title + job.company).toLowerCase().includes(activeFilters.keyword.toLowerCase());
        const loc = activeFilters.location === 'All' || job.location.includes(activeFilters.location);
        const mode = activeFilters.mode === 'All' || job.mode === activeFilters.mode;
        const exp = activeFilters.experience === 'All' || job.experience === activeFilters.experience;
        const src = activeFilters.source === 'All' || job.source === activeFilters.source;
        const score = !activeFilters.showMatchesOnly || job.matchScore >= userPrefs.minMatchScore;
        const curStat = jobStatus[job.id] || 'Not Applied';
        const statM = activeFilters.status === 'All' || curStat === activeFilters.status;
        return search && loc && mode && exp && src && score && statM;
    });

    filtered.sort((a, b) => {
        if (activeFilters.sortBy === 'Latest') return a.postedDaysAgo - b.postedDaysAgo;
        if (activeFilters.sortBy === 'Match Score') return b.matchScore - a.matchScore;
        return 0;
    });

    const cards = filtered.map(job => createJobCard(job)).join('') || `<div class="empty-state-inline" style="text-align:center; padding: 60px;">No jobs found. Try adjusting filters.</div>`;

    appContainer.innerHTML = `
        ${createFilterBar()}
        ${!hasPrefs ? `<div style="background:#FFF3E0;color:#E65100;padding:12px;border-radius:6px;margin:0 16px 16px 16px;border:1px solid #FFE0B2;text-align:center;">Using default view. <a href="#/settings" style="text-decoration:underline;">Set preferences</a> to activate matching.</div>` : ''}
        <div class="job-grid">${cards}</div>
    `;
    attachFilterListeners();
}

function renderSettings() {
    const isMode = (m) => userPrefs.preferredMode.includes(m) ? 'checked' : '';
    appContainer.innerHTML = `
        <div class="settings-container">
            <h2 class="section-title">Preferences</h2>
            <div class="form-group">
                <label class="form-label">Role Keywords</label>
                <input type="text" id="prefRoles" class="form-input" value="${userPrefs.roleKeywords.join(', ')}" placeholder="e.g. SDE, Frontend, React">
            </div>
            <div class="form-group">
                <label class="form-label">Preferred Locations</label>
                <input type="text" id="prefLocs" class="form-input" value="${userPrefs.preferredLocations.join(', ')}" placeholder="e.g. Bangalore, Remote">
            </div>
            <div class="form-group">
                <label class="form-label">Work Mode</label>
                <div style="display:flex;gap:16px;margin-top:8px;">
                    <label><input type="checkbox" class="pref-mode" value="Remote" ${isMode('Remote')}> Remote</label>
                    <label><input type="checkbox" class="pref-mode" value="Hybrid" ${isMode('Hybrid')}> Hybrid</label>
                    <label><input type="checkbox" class="pref-mode" value="Onsite" ${isMode('Onsite')}> Onsite</label>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Experience</label>
                <select id="prefExp" class="form-select">
                    <option value="All" ${userPrefs.experienceLevel === 'All' ? 'selected' : ''}>All</option>
                    <option value="Fresher" ${userPrefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                    <option value="0-1" ${userPrefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Years</option>
                    <option value="1-3" ${userPrefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                    <option value="3-5" ${userPrefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Skills</label>
                <input type="text" id="prefSkills" class="form-input" value="${userPrefs.skills.join(', ')}" placeholder="e.g. React, Java, SQL">
            </div>
            <div class="form-group">
                <label class="form-label">Min Match Score: <span id="scoreVal">${userPrefs.minMatchScore}</span>%</label>
                <div class="slider-container">
                    <input type="range" id="prefScore" class="range-slider" min="0" max="100" value="${userPrefs.minMatchScore}" oninput="document.getElementById('scoreVal').innerText=this.value">
                </div>
            </div>
            <div style="text-align: right; margin-top: 32px;">
                <button class="btn btn-primary" onclick="savePreferences()">Save Preferences</button>
            </div>
        </div>`;
}

function renderSavedJobs() {
    const saved = extendedJobData.filter(j => savedJobIds.includes(j.id));
    if (saved.length === 0) {
        appContainer.innerHTML = `<div class="empty-state"><h2>No saved jobs yet.</h2><p>Heart your favorite jobs to see them here.</p></div>`;
        return;
    }
    appContainer.innerHTML = `
        <h2 class="section-title" style="padding: 16px 0;">Saved Opportunities (${saved.length})</h2>
        <div class="job-grid">${saved.map(j => createJobCard(j, true)).join('')}</div>
    `;
}

function renderDigest() {
    const today = new Date().toISOString().split('T')[0];
    const digestKey = `jobTrackerDigest_${today}`;
    let digest = JSON.parse(localStorage.getItem(digestKey));

    if (!digest) {
        appContainer.innerHTML = `
            <div class="digest-generator">
                <div style="font-size: 48px; margin-bottom: 16px;">☕</div>
                <h2 class="section-title">Daily Digest</h2>
                <p style="color: #666; margin-bottom: 24px;">Generate your personalized summary for ${today}.</p>
                <button class="btn btn-primary" onclick="generateDigest()">Generate Today's Digest</button>
            </div>`;
    } else {
        renderDigestUI(digest, today);
    }
}

function generateDigest() {
    const hasPrefs = userPrefs.roleKeywords.length > 0 || userPrefs.preferredLocations.length > 0;
    if (!hasPrefs) { alert("Please set your preferences first!"); window.location.hash = '/settings'; return; }

    let candidates = extendedJobData.map(j => ({ ...j, matchScore: calculateMatchScore(j, userPrefs) })).filter(j => j.matchScore >= 40);
    candidates.sort((a, b) => b.matchScore - a.matchScore);
    const top10 = candidates.slice(0, 10);

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`jobTrackerDigest_${today}`, JSON.stringify(top10));
    renderDigestUI(top10, today);
}

function renderDigestUI(jobs, date) {
    const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const items = jobs.map(job => `
        <div class="digest-item">
            <div class="digest-item-content">
                <a href="${job.applyUrl}" target="_blank" class="digest-item-title">${job.title}</a>
                <div class="digest-item-meta">${job.company} • ${job.location} <span class="digest-item-score">Match: ${job.matchScore}%</span></div>
            </div>
            <button class="btn btn-secondary" style="font-size: 13px; padding: 6px 12px;" onclick="handleApply(${job.id}, '${job.applyUrl}', '${job.title}', '${job.company}')">Apply</button>
        </div>`).join('');

    const recentActivity = activityLog.slice(0, 5).map(log => {
        const statusClass = `status-${log.status.toLowerCase().replace(' ', '-')}`;
        return `<div style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; display: flex; justify-content: space-between;"><span><strong>${log.title}</strong></span><span class="status-select ${statusClass}" style="font-size: 10px; padding: 2px 8px;">${log.status}</span></div>`;
    }).join('');

    appContainer.innerHTML = `
        <div class="digest-container">
            <div class="digest-header">
                <div class="digest-date">${dateStr}</div>
                <h1 class="digest-title">Personalized Job Briefing</h1>
            </div>
            <div class="digest-list">${items}</div>
            ${recentActivity ? `<div style="margin-top: 32px; padding: 24px; background: #fafafa; border-radius: 8px; border: 1px solid #eee;"><h3 style="font-size: 16px; margin-bottom: 16px;">Recent Status Updates</h3>${recentActivity}</div>` : ''}
            <div class="digest-actions">
                <button class="btn btn-secondary" onclick="copyDigest()">Copy to Clipboard</button>
                <button class="btn btn-primary" onclick="emailDigest()">Draft Email</button>
            </div>
        </div>`;
}

// --- LOGIC ---

function calculateMatchScore(job, prefs) {
    if (prefs.roleKeywords.length === 0 && prefs.preferredLocations.length === 0) return 0;
    let score = 0;
    if (prefs.roleKeywords.some(kw => job.title.toLowerCase().includes(kw.toLowerCase().trim()))) score += 30;
    if (prefs.roleKeywords.some(kw => job.description.toLowerCase().includes(kw.toLowerCase().trim()))) score += 10;
    if (prefs.preferredLocations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase().trim()))) score += 20;
    if (prefs.preferredMode.includes(job.mode)) score += 10;
    if (prefs.experienceLevel !== 'All' && job.experience === prefs.experienceLevel) score += 10;
    if (job.skills.some(js => prefs.skills.some(ps => js.toLowerCase().includes(ps.toLowerCase().trim())))) score += 15;
    if (job.postedDaysAgo <= 2) score += 5;
    return Math.min(score, 100);
}

function savePreferences() {
    userPrefs = {
        roleKeywords: document.getElementById('prefRoles').value.split(',').map(x => x.trim()).filter(x => x),
        preferredLocations: document.getElementById('prefLocs').value.split(',').map(x => x.trim()).filter(x => x),
        skills: document.getElementById('prefSkills').value.split(',').map(x => x.trim()).filter(x => x),
        experienceLevel: document.getElementById('prefExp').value,
        minMatchScore: parseInt(document.getElementById('prefScore').value),
        preferredMode: []
    };
    document.querySelectorAll('.pref-mode:checked').forEach(cb => userPrefs.preferredMode.push(cb.value));
    localStorage.setItem('jobTrackerPreferences', JSON.stringify(userPrefs));
    showToast('Preferences Saved!');
    renderDashboard();
}

function createFilterBar() {
    return `
        <div class="filter-bar">
            <div class="filter-group">
                <input type="text" id="filterKeyword" class="filter-input" placeholder="Search..." value="${activeFilters.keyword}">
                <label class="toggle-wrapper">
                    <input type="checkbox" id="toggleMatch" class="toggle-checkbox" ${activeFilters.showMatchesOnly ? 'checked' : ''}>
                    <div class="toggle-switch"></div>
                    <span>Matches Only</span>
                </label>
            </div>
            <div class="filter-group">
                <select id="filterStatus" class="filter-select">
                    <option value="All" ${activeFilters.status === 'All' ? 'selected' : ''}>Status: All</option>
                    <option value="Not Applied" ${activeFilters.status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
                    <option value="Applied" ${activeFilters.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Rejected" ${activeFilters.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
                <select id="filterSort" class="filter-select">
                    <option value="Latest" ${activeFilters.sortBy === 'Latest' ? 'selected' : ''}>Sort: Latest</option>
                    <option value="Match Score" ${activeFilters.sortBy === 'Match Score' ? 'selected' : ''}>Sort: Match Score</option>
                </select>
            </div>
        </div>`;
}

function createJobCard(job, isSavedView = false) {
    const isSaved = savedJobIds.includes(job.id);
    const curStat = jobStatus[job.id] || 'Not Applied';
    const statusClass = `status-${curStat.toLowerCase().replace(' ', '-')}`;

    return `
        <div class="job-card">
            <div class="card-header">
                <div style="flex:1;">
                    <div class="card-title">${job.title}</div>
                    <div class="card-company">${job.company}</div>
                </div>
                <div style="text-align:right;">
                    <span class="match-score ${job.matchScore >= 80 ? 'score-high' : job.matchScore >= 40 ? 'score-mid' : 'score-neutral'}">⚡ ${job.matchScore}%</span>
                    <br><span class="badge-source badge-${job.source.toLowerCase()}" style="margin-top:4px; display:inline-block;">${job.source}</span>
                </div>
            </div>
            <div class="card-meta">
                <span class="meta-tag">📍 ${job.location}</span>
                <span class="meta-tag">💼 ${job.experience}</span>
                <span class="meta-tag">🏠 ${job.mode}</span>
            </div>
            <div style="margin-bottom: 20px;">
                <select class="status-select ${statusClass}" onchange="updateJobStatus(${job.id}, this.value, '${job.title}', '${job.company}')">
                    <option value="Not Applied" ${curStat === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
                    <option value="Applied" ${curStat === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Rejected" ${curStat === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="Selected" ${curStat === 'Selected' ? 'selected' : ''}>Selected</option>
                </select>
            </div>
            <div class="card-footer">
                <button class="btn-icon ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">${isSaved ? '♥' : '♡'}</button>
                <div class="card-actions">
                    <button class="btn btn-secondary" onclick="openModal(${job.id})">View</button>
                    <button class="btn btn-primary" onclick="handleApply(${job.id}, '${job.applyUrl}', '${job.title}', '${job.company}')">Apply</button>
                </div>
            </div>
        </div>`;
}

function handleApply(id, url, title, company) {
    updateJobStatus(id, 'Applied', title, company);
    window.open(url, '_blank');
}

function updateJobStatus(id, newStatus, title, company) {
    jobStatus[id] = newStatus;
    localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatus));
    activityLog.unshift({ id, status: newStatus, date: new Date().toISOString(), title, company });
    localStorage.setItem('jobTrackerActivity', JSON.stringify(activityLog.slice(0, 50)));
    showToast(`Status: ${newStatus}`);
    if (window.location.hash.includes('dashboard')) renderDashboard();
    else if (window.location.hash.includes('digest')) renderDigest();
}

function toggleSave(id) {
    if (savedJobIds.includes(id)) savedJobIds = savedJobIds.filter(sid => sid !== id);
    else savedJobIds.push(id);
    localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));
    const path = window.location.hash.slice(1);
    if (path === '/saved') renderSavedJobs();
    else renderDashboard();
}

function openModal(id) {
    const job = extendedJobData.find(j => j.id === id);
    modalBody.innerHTML = `
        <h2 style="font-family:var(--font-serif); font-size:24px; margin-bottom:8px;">${job.title}</h2>
        <p style="margin-bottom:16px; color:#666;">${job.company} • ${job.location} • ${job.mode}</p>
        <p style="line-height:1.6; margin-bottom:24px;">${job.description}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:32px;">
            ${job.skills.map(s => `<span class="meta-tag">${s}</span>`).join('')}
        </div>
        <button onclick="handleApply(${job.id}, '${job.applyUrl}', '${job.title}', '${job.company}')" class="btn btn-primary" style="width:100%; padding: 16px;">Apply Now</button>
    `;
    modalOverlay.classList.add('open');
}

function closeModal() { modalOverlay.classList.remove('open'); }

// --- TEST UI ---

function renderTestChecklist() {
    const passedCount = testItems.filter(item => testState[item.id]).length;
    const isReady = passedCount === 10;
    appContainer.innerHTML = `
        <div class="test-container">
            <h2 class="section-title">Quality Verification</h2>
            <div class="test-status-banner ${isReady ? 'status-passed' : 'status-warning'}">
                <span>Tests Passed: ${passedCount}/10</span>
                <span>${isReady ? '✅ Production Ready' : '⚠️ Testing Phase'}</span>
            </div>
            <div class="checklist">
                ${testItems.map(item => `
                    <div class="checklist-item">
                        <input type="checkbox" id="${item.id}" ${testState[item.id] ? 'checked' : ''} onchange="toggleTest('${item.id}')">
                        <div class="checklist-content">
                            <label class="checklist-label" for="${item.id}">${item.label}</label>
                            <span class="checklist-hint">${item.hint}</span>
                        </div>
                    </div>`).join('')}
            </div>
            <div style="margin-top:32px; display:flex; justify-content:space-between; align-items:center;">
                <button class="btn btn-secondary" onclick="resetTests()">Reset</button>
                <a href="#/jt/proof" class="btn btn-primary">Proceed to Proof</a>
            </div>
        </div>`;
}

function toggleTest(id) { testState[id] = !testState[id]; localStorage.setItem('jobTrackerTests', JSON.stringify(testState)); renderTestChecklist(); }
function resetTests() { if (confirm("Reset?")) { testState = {}; localStorage.removeItem('jobTrackerTests'); renderTestChecklist(); } }

// --- PROOF UI ---

function renderProofPage() {
    const passedCount = testItems.filter(item => testState[item.id]).length;
    const linksProvided = submissionLinks.lovable && submissionLinks.github && submissionLinks.deploy;
    const isShipped = passedCount === 10 && linksProvided;
    let shipStatus = isShipped ? 'Shipped' : (passedCount > 0 || Object.values(submissionLinks).some(v => v)) ? 'In Progress' : 'Not Started';
    let badgeClass = `badge-${shipStatus.toLowerCase().replace(' ', '-')}`;

    appContainer.innerHTML = `
        <div class="proof-container">
            <h2 class="section-title">Final Project Proof</h2>
            <div class="ship-badge ${badgeClass}">${shipStatus}</div>
            <div class="milestone-list">
                ${milestones.map(m => `
                    <div class="milestone-item">
                        <span>${m.title}</span>
                        <span class="milestone-status ${m.check() ? 'status-completed' : 'status-pending'}">${m.check() ? 'Completed' : 'Pending'}</span>
                    </div>`).join('')}
            </div>
            <div class="artifact-inputs">
                <input type="url" id="linkLovable" class="link-input" value="${submissionLinks.lovable}" placeholder="Lovable URL" oninput="updateLinks()">
                <input type="url" id="linkGithub" class="link-input" value="${submissionLinks.github}" placeholder="GitHub URL" oninput="updateLinks()">
                <input type="url" id="linkDeploy" class="link-input" value="${submissionLinks.deploy}" placeholder="Deployment URL" oninput="updateLinks()">
            </div>
            <div style="display:flex; gap:16px; margin-top:32px;">
                <button class="btn btn-secondary" onclick="copyFinalSubmission()">Copy Export</button>
                <a href="#/jt/08-ship" class="btn btn-primary" ${!isShipped ? 'style="opacity:0.5; pointer-events:none;"' : ''}>Ship Project</a>
            </div>
        </div>`;
}

function updateLinks() {
    submissionLinks = { lovable: document.getElementById('linkLovable').value.trim(), github: document.getElementById('linkGithub').value.trim(), deploy: document.getElementById('linkDeploy').value.trim() };
    localStorage.setItem('jobTrackerLinks', JSON.stringify(submissionLinks));
    const isReady = testItems.filter(item => testState[item.id]).length === 10 && submissionLinks.lovable && submissionLinks.github && submissionLinks.deploy;
    const btn = document.querySelector('a[href="#/jt/08-ship"]');
    if (btn) { btn.style.opacity = isReady ? '1' : '0.5'; btn.style.pointerEvents = isReady ? 'auto' : 'none'; }
}

function copyFinalSubmission() {
    const text = `Project: Job Notification Tracker\nLovable: ${submissionLinks.lovable}\nGitHub: ${submissionLinks.github}\nDeploy: ${submissionLinks.deploy}`;
    navigator.clipboard.writeText(text).then(() => showToast("Copied!"));
}

function renderShipPage() {
    appContainer.innerHTML = `
        <div class="test-container" style="text-align:center; padding: 100px 20px;">
            <div style="font-size: 80px; margin-bottom: 24px;">✅</div>
            <h1 class="section-title">Project 1 Shipped Successfully.</h1>
            <p>Verification complete. Quality standards met.</p>
            <a href="#/dashboard" class="btn btn-secondary" style="margin-top: 40px;">Return to Dashboard</a>
        </div>`;
}

// --- UTILS ---

function attachFilterListeners() {
    const k = document.getElementById('filterKeyword');
    if (k) k.addEventListener('input', (e) => { activeFilters.keyword = e.target.value; renderDashboard(); document.getElementById('filterKeyword').focus(); });
    const tm = document.getElementById('toggleMatch');
    if (tm) tm.addEventListener('change', (e) => { activeFilters.showMatchesOnly = e.target.checked; renderDashboard(); });
    ['Status', 'Sort'].forEach(f => {
        const el = document.getElementById(`filter${f}`);
        if (el) el.addEventListener('change', (e) => { activeFilters[f.toLowerCase()] = e.target.value; renderDashboard(); });
    });
}

function showToast(msg) {
    let c = document.getElementById('toastContainer') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'toastContainer', className: 'toast-container' }));
    const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg; c.appendChild(t); setTimeout(() => t.remove(), 3000);
}

function updateNavigation(path) {
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-path') === path) l.classList.add('active');
    });
}

function toggleMobileMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMobileMenu() { document.getElementById('mobileMenu').classList.remove('open'); }

// --- INIT ---

window.addEventListener('hashchange', () => renderView(window.location.hash.slice(1) || '/'));
window.addEventListener('load', () => renderView(window.location.hash.slice(1) || '/'));
renderView(window.location.hash.slice(1) || '/');
