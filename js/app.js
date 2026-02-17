/**
 * Job Notification Tracker - Test & Ship System
 * Version 6.0
 */

// --- STATE ---
let savedJobIds = JSON.parse(localStorage.getItem('savedJobs')) || [];
let jobStatus = JSON.parse(localStorage.getItem('jobTrackerStatus')) || {};
let activityLog = JSON.parse(localStorage.getItem('jobTrackerActivity')) || [];
let testState = JSON.parse(localStorage.getItem('jobTrackerTests')) || {};

let userPrefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || {
    roleKeywords: [], preferredLocations: [], preferredMode: ['Remote', 'Hybrid', 'Onsite'], experienceLevel: 'All', skills: [], minMatchScore: 40
};
let activeFilters = {
    keyword: '', location: 'All', mode: 'All', experience: 'All', source: 'All', status: 'All',
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
    '/proof': 'Proof of Work',
    '/jt/07-test': 'Test Checklist',
    '/jt/08-ship': 'Shipping'
};

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

function renderView(path) {
    // Navigation Protection (Ship Lock)
    if (path === '/jt/08-ship') {
        const passedCount = testItems.filter(item => testState[item.id]).length;
        if (passedCount < 10) {
            window.location.hash = '/jt/07-test';
            showToast("Tests Incomplete. Redirecting to Checklist.");
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
        case '/proof': renderProof(); break;
        case '/jt/07-test': renderTestChecklist(); break;
        case '/jt/08-ship': renderShipPage(); break;
        default: appContainer.innerHTML = `<div class="hero-section"><h1>404</h1></div>`;
    }
    updateNavigation(path);
}

// --- RENDERERS ---

function renderTestChecklist() {
    const passedCount = testItems.filter(item => testState[item.id]).length;
    const isReady = passedCount === 10;

    appContainer.innerHTML = `
        <div class="test-container">
            <div class="test-header">
                <h2 class="section-title">Manual Quality Checklist</h2>
                <p style="color: #666;">Verify core functionality before final shipment.</p>
            </div>

            <div class="test-status-banner ${isReady ? 'status-passed' : 'status-warning'}">
                <span>Tests Passed: ${passedCount} / 10</span>
                <span>${isReady ? '✅ Ready to Ship' : '⚠️ Issues Pending'}</span>
            </div>

            ${!isReady ? `<p style="font-size: 13px; color: #E65100; margin-bottom: 24px;">Note: Resolve all issues before shipping.</p>` : ''}

            <div class="checklist">
                ${testItems.map(item => `
                    <div class="checklist-item">
                        <input type="checkbox" id="${item.id}" ${testState[item.id] ? 'checked' : ''} onchange="toggleTest('${item.id}')">
                        <div class="checklist-content">
                            <label class="checklist-label" for="${item.id}">${item.label}</label>
                            <span class="checklist-hint">${item.hint}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top: 32px; display: flex; justify-content: space-between; align-items: center;">
                <button class="btn btn-secondary" onclick="resetTests()">Reset Test Status</button>
                <a href="#/jt/08-ship" class="btn btn-primary" ${!isReady ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>Proceed to Ship</a>
            </div>
        </div>
    `;
}

function toggleTest(id) {
    testState[id] = !testState[id];
    localStorage.setItem('jobTrackerTests', JSON.stringify(testState));
    renderTestChecklist();
}

function resetTests() {
    if (confirm("Clear all test results?")) {
        testState = {};
        localStorage.removeItem('jobTrackerTests');
        renderTestChecklist();
    }
}

function renderShipPage() {
    appContainer.innerHTML = `
        <div class="test-container" style="text-align: center;">
            <div class="lock-icon">🚀</div>
            <h1 class="section-title" style="font-size: 32px; margin-bottom: 16px;">Application Shipped</h1>
            <p style="color: #666; margin-bottom: 32px;">Internal verification complete. Quality standards met.</p>
            <div style="background: #fdfdfd; padding: 24px; border: 1px dashed #ddd; border-radius: 8px;">
                <code style="color: var(--color-accent); font-weight: 700;">STATUS: PRODUCTION_READY_V1.0</code>
            </div>
            <div style="margin-top: 40px;">
                <a href="#/dashboard" class="btn btn-secondary">Back to Dashboard</a>
            </div>
        </div>
    `;
}

function renderLanding() {
    document.body.classList.add('is-landing');
    appContainer.innerHTML = `<div class="hero-section"><h1 class="hero-headline">Stop Missing The Right Jobs.</h1><p class="hero-subtext">Precision-matched job discovery delivered daily at 9AM.</p><a href="#/jt/07-test" class="btn btn-primary" style="font-size: 18px; padding: 16px 32px;">Verify & Ship</a></div>`;
}

function renderSettings() {
    const isMode = (m) => userPrefs.preferredMode.includes(m) ? 'checked' : '';
    appContainer.innerHTML = `
        <div class="settings-container"><h2 class="section-title">Preferences</h2>
            <div class="form-group"><label class="form-label">Role Keywords</label><input type="text" id="prefRoles" class="form-input" value="${userPrefs.roleKeywords.join(', ')}"></div>
            <div class="form-group"><label class="form-label">Preferred Locations</label><input type="text" id="prefLocs" class="form-input" value="${userPrefs.preferredLocations.join(', ')}"></div>
            <div class="form-group"><label class="form-label">Work Mode</label><div style="display:flex;gap:16px;margin-top:8px;"><label><input type="checkbox" class="pref-mode" value="Remote" ${isMode('Remote')}> Remote</label><label><input type="checkbox" class="pref-mode" value="Hybrid" ${isMode('Hybrid')}> Hybrid</label><label><input type="checkbox" class="pref-mode" value="Onsite" ${isMode('Onsite')}> Onsite</label></div></div>
            <div class="form-group"><label class="form-label">Experience</label><select id="prefExp" class="form-select"><option value="All" ${userPrefs.experienceLevel === 'All' ? 'selected' : ''}>All</option><option value="Fresher" ${userPrefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option><option value="0-1" ${userPrefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Years</option><option value="1-3" ${userPrefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option><option value="3-5" ${userPrefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option><option value="5-8" ${userPrefs.experienceLevel === '5-8' ? 'selected' : ''}>5-8 Years</option></select></div>
            <div class="form-group"><label class="form-label">Skills</label><input type="text" id="prefSkills" class="form-input" value="${userPrefs.skills.join(', ')}"></div>
            <div class="form-group"><label class="form-label">Min Score: <span id="scoreVal">${userPrefs.minMatchScore}</span></label><div class="slider-container"><input type="range" id="prefScore" class="range-slider" min="0" max="100" value="${userPrefs.minMatchScore}" oninput="document.getElementById('scoreVal').innerText=this.value"></div></div>
            <div style="text-align: right;"><button class="btn btn-primary" onclick="savePreferences()">Save Preferences</button></div>
        </div>`;
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
        const curStat = jobStatus[job.id] || 'Not Applied';
        const statusMatch = activeFilters.status === 'All' || curStat === activeFilters.status;
        return search && loc && mode && exp && src && score && statusMatch;
    });
    filtered.sort((a, b) => {
        if (activeFilters.sortBy === 'Latest') return a.postedDaysAgo - b.postedDaysAgo;
        if (activeFilters.sortBy === 'Match Score') return b.matchScore - a.matchScore;
        if (activeFilters.sortBy === 'Salary') return parseSalary(b.salaryRange) - parseSalary(a.salaryRange);
        return 0;
    });
    const cards = filtered.map(job => createJobCard(job)).join('') || renderEmptyState("No Jobs Found", "Try adjusting filters.").replace('empty-state', 'empty-state-inline');
    appContainer.innerHTML = `${createFilterBar()}${!hasPrefs ? `<div style="background:#FFF3E0;color:#E65100;padding:12px;border-radius:6px;margin:0 16px 16px 16px;border:1px solid #FFE0B2;text-align:center;">Using default view. <a href="#/settings" style="text-decoration:underline;">Set preferences</a> to activate matching.</div>` : ''}<div class="job-grid">${cards}</div>`;
    attachFilterListeners();
}

function renderSavedJobs() {
    const saved = extendedJobData.filter(j => savedJobIds.includes(j.id));
    if (saved.length === 0) { appContainer.innerHTML = renderEmptyState("Saved Jobs", "No saved jobs yet."); return; }
    appContainer.innerHTML = `<h2 class="section-title" style="padding: 16px 0;">Saved Opportunities (${saved.length})</h2><div class="job-grid">${saved.map(j => createJobCard(j, true)).join('')}</div>`;
}

function renderDigest() {
    const today = new Date().toISOString().split('T')[0];
    const digestKey = `jobTrackerDigest_${today}`;
    let digest = JSON.parse(localStorage.getItem(digestKey));
    if (!digest) {
        appContainer.innerHTML = `<div class="digest-generator"><div style="font-size: 48px; margin-bottom: 16px;">☕</div><h2 class="section-title" style="margin-bottom: 8px;">Daily Digest</h2><p style="color: #666; margin-bottom: 24px;">Generate your personalized 9AM summary.</p><button class="btn btn-primary" onclick="generateDigest()">Generate Today's Digest (Simulated)</button></div>`;
    } else {
        renderDigestUI(digest, today);
    }
}

function generateDigest() {
    const hasPrefs = userPrefs.roleKeywords.length > 0 || userPrefs.preferredLocations.length > 0;
    if (!hasPrefs) { alert("Please set your preferences first!"); window.location.hash = '/settings'; return; }
    let candidates = extendedJobData.map(j => ({ ...j, matchScore: calculateMatchScore(j, userPrefs) })).filter(j => j.matchScore >= 40);
    candidates.sort((a, b) => b.matchScore !== a.matchScore ? b.matchScore - a.matchScore : a.postedDaysAgo - b.postedDaysAgo);
    const top10 = candidates.slice(0, 10);
    if (top10.length === 0) { alert("No matching jobs found today."); return; }
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`jobTrackerDigest_${today}`, JSON.stringify(top10));
    renderDigestUI(top10, today);
}

function renderDigestUI(jobs, date) {
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const items = jobs.map(job => `<div class="digest-item"><div class="digest-item-content"><a href="${job.applyUrl}" target="_blank" class="digest-item-title">${job.title}</a><div class="digest-item-meta">${job.company} • ${job.location} <span class="digest-item-score">Match: ${job.matchScore}%</span></div></div><a href="${job.applyUrl}" target="_blank" class="btn btn-secondary" style="font-size: 13px; padding: 6px 12px;">Apply</a></div>`).join('');
    const recentActivity = activityLog.slice(0, 5).map(log => {
        const statusClass = `status-${log.status.toLowerCase().replace(' ', '-')}`;
        return `<div style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; display: flex; justify-content: space-between;"><span><strong>${log.title}</strong> (${log.company})</span><span class="status-select ${statusClass}" style="font-size: 10px;">${log.status}</span></div>`;
    }).join('');
    const activitySection = recentActivity ? `<div style="margin-top: 32px; background: white; padding: 24px; border: 1px solid #eee; border-radius: 8px;"><h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; font-family: var(--font-serif);">Recent Status Updates</h3>${recentActivity}</div>` : '';
    appContainer.innerHTML = `<div class="digest-container"><div class="digest-header"><div class="digest-date">${dateStr}</div><h1 class="digest-title">Top ${jobs.length} Jobs For You</h1><p>Your daily 9AM briefing.</p></div><div class="digest-list">${items}</div>${activitySection}<div class="digest-actions"><button class="btn btn-secondary" onclick="copyDigest()">Copy to Clipboard</button><button class="btn btn-primary" onclick="emailDigest()">Create Email Draft</button></div><div class="digest-footer">Generated based on your preferences.</div></div>`;
}

function copyDigest() { navigator.clipboard.writeText("Digest Content Copied!").then(() => alert("Digest copied to clipboard!")); }
function emailDigest() { window.open(`mailto:?subject=My 9AM Job Digest&body=See attachment`); }
function renderProof() { appContainer.innerHTML = `<div class="settings-container"><h2 class="section-title">Proof of Implementation</h2><p class="form-hint">Test Verification Engine Active.</p></div>`; }

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
function parseSalary(s) { if (!s) return 0; if (s.toLowerCase().includes('lpa')) { const n = s.match(/(\d+)/g); if (n) return (n.reduce((a, b) => parseInt(a) + parseInt(b), 0) / n.length) * 100000; } return 0; }
function savePreferences() {
    userPrefs = { roleKeywords: document.getElementById('prefRoles').value.split(',').filter(x => x.trim()), preferredLocations: document.getElementById('prefLocs').value.split(',').filter(x => x.trim()), skills: document.getElementById('prefSkills').value.split(',').filter(x => x.trim()), experienceLevel: document.getElementById('prefExp').value, minMatchScore: parseInt(document.getElementById('prefScore').value), preferredMode: [] };
    document.querySelectorAll('.pref-mode:checked').forEach(cb => userPrefs.preferredMode.push(cb.value));
    localStorage.setItem('jobTrackerPreferences', JSON.stringify(userPrefs));
    alert('Preferences Saved!');
}
function createFilterBar() {
    return `<div class="filter-bar"><div class="filter-group"><input type="text" id="filterKeyword" class="filter-input" placeholder="Search..." value="${activeFilters.keyword}"><label class="toggle-wrapper"><input type="checkbox" id="toggleMatch" class="toggle-checkbox" ${activeFilters.showMatchesOnly ? 'checked' : ''}><div class="toggle-switch"></div><span>Matches Only</span></label></div><div class="filter-group"><select id="filterStatus" class="filter-select"><option value="All">Status: All</option><option value="Not Applied">Not Applied</option><option value="Applied">Applied</option><option value="Rejected">Rejected</option><option value="Selected">Selected</option></select><select id="filterLoc" class="filter-select"><option value="All">Location: All</option><option value="Bangalore">Bangalore</option><option value="Remote">Remote</option></select><select id="filterSort" class="filter-select"><option value="Latest">Sort: Latest</option><option value="Match Score">Sort: Match Score</option></select></div></div>`;
}
function createJobCard(job) {
    const isSaved = savedJobIds.includes(job.id);
    const curStat = jobStatus[job.id] || 'Not Applied';
    const statusClass = `status-${curStat.toLowerCase().replace(' ', '-')}`;
    return `<div class="job-card"><div class="card-header"><div><div class="card-title">${job.title}</div><div class="card-company">${job.company}</div></div><div style="text-align:right;"><span class="match-score ${job.matchScore >= 80 ? 'score-high' : job.matchScore >= 60 ? 'score-mid' : 'score-neutral'}">⚡ ${job.matchScore}%</span><br><span class="badge-source badge-${job.source.toLowerCase()}">${job.source}</span></div></div><div class="card-meta"><span class="meta-tag">📍 ${job.location}</span><span class="meta-tag">💼 ${job.experience}</span><span class="meta-tag salary">💰 ${job.salaryRange}</span></div><div style="margin-bottom: 16px;"><select class="status-select ${statusClass}" onchange="updateJobStatus(${job.id}, this.value, '${job.title}', '${job.company}')"><option value="Not Applied" ${curStat === 'Not Applied' ? 'selected' : ''}>Not Applied</option><option value="Applied" ${curStat === 'Applied' ? 'selected' : ''}>Applied</option><option value="Rejected" ${curStat === 'Rejected' ? 'selected' : ''}>Rejected</option><option value="Selected" ${curStat === 'Selected' ? 'selected' : ''}>Selected</option></select></div><div class="card-footer"><button class="btn-icon ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">${isSaved ? '♥' : '♡'}</button><div class="card-actions"><button class="btn btn-secondary" onclick="openModal(${job.id})">View</button><button class="btn btn-primary" onclick="handleApply(${job.id}, '${job.applyUrl}', '${job.title}', '${job.company}')">Apply</button></div></div></div>`;
}
function handleApply(id, url, title, company) {
    updateJobStatus(id, 'Applied', title, company);
    window.open(url, '_blank');
}
function updateJobStatus(id, newStatus, title, company) {
    jobStatus[id] = newStatus;
    localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatus));
    activityLog.unshift({ id, status: newStatus, date: new Date().toISOString(), title, company });
    localStorage.setItem('jobTrackerActivity', JSON.stringify(activityLog));
    renderDashboard();
    showToast(`Status updated: ${newStatus}`);
}
function showToast(msg) {
    let container = document.getElementById('toastContainer') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'toastContainer', className: 'toast-container' }));
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function renderEmptyState(t, m) { return `<div class="empty-state"><h2 class="section-title">${t}</h2><p class="empty-state-text">${m}</p></div>`; }
function attachFilterListeners() {
    document.getElementById('filterKeyword').addEventListener('input', (e) => { activeFilters.keyword = e.target.value; renderDashboard(); document.getElementById('filterKeyword').focus(); });
    document.getElementById('toggleMatch').addEventListener('change', (e) => { activeFilters.showMatchesOnly = e.target.checked; renderDashboard(); });
    ['Status', 'Loc', 'Sort'].forEach(f => document.getElementById(`filter${f}`).addEventListener('change', (e) => { activeFilters[f.toLowerCase()] = e.target.value; renderDashboard(); }));
}
function toggleSave(id) { savedJobIds = savedJobIds.includes(id) ? savedJobIds.filter(sid => sid !== id) : [...savedJobIds, id]; localStorage.setItem('savedJobs', JSON.stringify(savedJobIds)); const h = window.location.hash.slice(1); if (h === '/saved') renderSavedJobs(); else if (h === '/dashboard') renderDashboard(); }
function openModal(id) { const job = extendedJobData.find(j => j.id === id); modalBody.innerHTML = `<h2 style="font-family:var(--font-serif);font-size:24px;margin-bottom:8px;">${job.title}</h2><p style="margin-bottom:16px;">${job.company} • ${job.location}</p><p style="line-height:1.6;margin-bottom:24px;">${job.description}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;">${job.skills.map(s => `<span class="meta-tag">${s}</span>`).join('')}</div><button onclick="handleApply(${job.id}, '${job.applyUrl}', '${job.title}', '${job.company}')" class="btn btn-primary w-full" style="display:block;text-align:center;width:100%;">Apply Now</button>`; modalOverlay.classList.add('open'); }
function closeModal() { modalOverlay.classList.remove('open'); }
function router() { renderView(window.location.hash.slice(1) || '/'); }
function updateNavigation(path) { document.querySelectorAll('.nav-link').forEach(l => { l.classList.remove('active'); if (l.getAttribute('data-path') === path) l.classList.add('active'); }); }
window.addEventListener('hashchange', router); window.addEventListener('load', router); router();
