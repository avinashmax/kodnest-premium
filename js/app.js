/**
 * Simple Hash-based Router for Job Notification Tracker
 */

const routes = {
    '/': 'Dashboard',
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
 * @param {string} title - The title of the page to render.
 */
function renderView(title) {
    let html = '';

    if (title === 'Dashboard') {
        html = renderDashboard();
    } else {
        // Placeholder for other views
        html = `
            <div class="placeholder-content">
                <h1 class="placeholder-title">${title}</h1>
                <p class="placeholder-subtitle">This section will be built in the next step.</p>
            </div>
        `;
    }

    appContainer.innerHTML = html;
}

function renderDashboard() {
    // Generate Stats HTML
    const statsHtml = `
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-label">Total Jobs Found</span>
                <span class="stat-value">${stats.total}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">New Alerts</span>
                <span class="stat-value" style="color: var(--color-accent);">${stats.new}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Applications Sent</span>
                <span class="stat-value">${stats.applied}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Saved for Later</span>
                <span class="stat-value">${stats.saved}</span>
            </div>
        </div>
    `;

    // Generate Job List HTML
    const jobsHtml = jobAlerts.map(job => `
        <div class="job-card">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <div class="job-company">${job.company} • ${job.location}</div>
                </div>
                <span class="job-status status-${job.status.toLowerCase()}">${job.status}</span>
            </div>
            
            <div class="job-details">
                <span class="job-detail-item">📅 ${job.posted}</span>
                <span class="job-detail-item">💰 ${job.salary}</span>
                <span class="job-detail-item">💼 ${job.type}</span>
            </div>

            <div class="job-actions">
                <button class="action-btn">Ignore</button>
                <button class="action-btn primary" onclick="alert('Applying to ${job.company}...')">Quick Apply</button>
            </div>
        </div>
    `).join('');

    return `
        <div class="dashboard-container">
            <h2 class="section-title">Overview</h2>
            ${statsHtml}
            
            <h2 class="section-title">Latest Alerts</h2>
            <div class="job-list">
                ${jobsHtml}
            </div>
        </div>
    `;
}

/**
 * Handles navigation updates (Active link highlighting).
 * @param {string} path - The current route path (e.g., '/dashboard').
 */
function updateNavigation(path) {
    // Normalize root path
    if (path === '' || path === '/') path = '/dashboard';

    // Desktop Links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-path') === path) {
            link.classList.add('active');
        }
    });

    // Mobile Links (if we want to highlight them too, optional)
}

/**
 * Router function called on hashchange or load.
 */
function router() {
    // Get the current hash (remove the #)
    let path = window.location.hash.slice(1) || '/';

    // Default to dashboard if root
    if (path === '/') path = '/dashboard';

    // Get the page title from the routes map
    const pageTitle = routes[path] || '404 Not Found';

    // Render the view
    renderView(pageTitle);

    // Update Navigation UI
    updateNavigation(path);
}

// Mobile Menu Logic
function toggleMobileMenu() {
    menuOverlay.classList.toggle('open');
    // Optional: Animate hamburger icon
}

function closeMobileMenu() {
    menuOverlay.classList.remove('open');
}

// Event Listeners
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Initialize
router();
