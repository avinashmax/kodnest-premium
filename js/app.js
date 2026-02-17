/**
 * Job Notification Tracker - App Logic
 * Premium Skeleton Version
 */

const routes = {
    '/': 'Landing',
    '/dashboard': 'Dashboard',
    '/saved': 'Saved Jobs',
    '/digest': 'Daily Digest',
    '/settings': 'Settings',
    '/proof': 'Proof of Work'
};

const appContainer = document.getElementById('app');
const menuOverlay = document.getElementById('mobileMenu');

/**
 * Renders the view content based on the current path.
 */
function renderView(path) {
    let html = '';

    // Normalize path
    if (path === '' || path === '/') {
        renderLanding();
        return;
    }

    // Remove landing class if present
    document.body.classList.remove('is-landing');

    switch (path) {
        case '/dashboard':
            html = renderDashboardEmpty();
            break;
        case '/settings':
            html = renderSettings();
            break;
        case '/saved':
            html = renderEmptyState("Saved Jobs", "Your shortlisted opportunities will appear here.");
            break;
        case '/digest':
            html = renderEmptyState("Daily Digest", "Your 9AM daily summary will appear here.");
            break;
        case '/proof':
            html = renderEmptyState("Proof of Work", "Artifact collection placeholder.");
            break;
        default:
            html = render404();
    }

    appContainer.innerHTML = html;
}

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
    return `
        <div class="settings-container">
            <h2 class="section-title">Preferences</h2>
            
            <div class="form-group">
                <label class="form-label">Role Keywords</label>
                <input type="text" class="form-input" placeholder="e.g. Frontend Engineer, Product Designer">
                <p class="form-hint">Separate multiple keywords with commas.</p>
            </div>

            <div class="form-group">
                <label class="form-label">Preferred Locations</label>
                <input type="text" class="form-input" placeholder="e.g. San Francisco, Remote, London">
            </div>

            <div class="form-group">
                <label class="form-label">Work Mode</label>
                <select class="form-select">
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>On-site</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Experience Level</label>
                <select class="form-select">
                    <option>Mid-Level (2-5 years)</option>
                    <option>Senior (5-8 years)</option>
                    <option>Staff/Principal (8+ years)</option>
                </select>
            </div>

            <div style="text-align: right; margin-top: var(--space-4);">
                <button class="btn btn-primary">Save Preferences</button>
            </div>
        </div>
    `;
}

function renderDashboardEmpty() {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p class="empty-state-text">No jobs yet. In the next step, you will load a realistic dataset.</p>
        </div>
    `;
}

function renderEmptyState(title, message) {
    return `
        <div class="empty-state">
            <h2 class="section-title" style="margin-bottom: var(--space-2);">${title}</h2>
            <p class="empty-state-text">${message}</p>
        </div>
    `;
}

function render404() {
    return `<div class="hero-section"><h1>404</h1><p>Page not found.</p></div>`;
}

/**
 * Handles navigation updates (Active link highlighting).
 */
function updateNavigation(path) {
    // Top Nav visibility logic could go here if needed
    // Highlight active link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkPath = link.getAttribute('data-path');
        if (linkPath === path) {
            link.classList.add('active');
        }
    });
}

/**
 * Router function called on hashchange or load.
 */
function router() {
    // Get the current hash (remove the #)
    let path = window.location.hash.slice(1) || '/';

    // Render the view
    renderView(path);

    // Update Navigation UI
    updateNavigation(path);
}

// Mobile Menu Logic
function toggleMobileMenu() {
    menuOverlay.classList.toggle('open');
}

function closeMobileMenu() {
    menuOverlay.classList.remove('open');
}

// Event Listeners
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Initialize
router();
