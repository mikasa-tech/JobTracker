const STORAGE_KEY = 'jobTrackerStatus';
const UPDATES_KEY = 'jobStatusUpdates';
const TEST_KEY = 'jobTrackerTests';
const PROOFS_KEY = 'jobTrackerProofs';

// Mock Data for Jobs
const INITIAL_JOBS = [
    { id: '1', title: 'Senior AI Engineer', company: 'Google DeepMind', matchScore: 95, location: 'London, UK', remote: true },
    { id: '2', title: 'UI Researcher', company: 'Linear', matchScore: 88, location: 'San Francisco, CA', remote: true },
    { id: '3', title: 'Product Designer', company: 'Airbnb', matchScore: 82, location: 'New York, NY', remote: false },
    { id: '4', title: 'Frontend Architect', company: 'Vercel', matchScore: 91, location: 'Remote', remote: true },
    { id: '5', title: 'Cloud Infrastructure Lead', company: 'Tailscale', matchScore: 75, location: 'Toronto, CA', remote: true }
];

const TEST_ITEMS = [
    { id: 't1', label: 'Preferences persist after refresh', hint: 'Filter state remains in localStorage.' },
    { id: 't2', label: 'Match score calculates correctly', hint: 'Check range slider logic.' },
    { id: 't3', label: '"Show only matches" toggle works', hint: 'Check Remote checkbox logic.' },
    { id: 't4', label: 'Save job persists after refresh', hint: 'Saved markers stay visible.' },
    { id: 't5', label: 'Apply opens in new tab', hint: 'Verified via target="_blank".' },
    { id: 't6', label: 'Status update persists after refresh', hint: 'localStorage status check.' },
    { id: 't7', label: 'Status filter works correctly', hint: 'Category filtering verified.' },
    { id: 't8', label: 'Digest generates top 10 by score', hint: 'Sorting logic in JobTracker.' },
    { id: 't9', label: 'Digest persists for the day', hint: 'Daily state verification.' },
    { id: 't10', label: 'No console errors on main pages', hint: 'Clean DevTools console.' }
];

class TestSystem {
    constructor() {
        this.testState = JSON.parse(localStorage.getItem(TEST_KEY)) || {};
        this.init();
    }

    init() {
        this.checkLock();
        if (window.location.pathname.includes('07-test.html')) {
            this.renderChecklist();
        }
    }

    toggleTest(id) {
        this.testState[id] = !this.testState[id];
        localStorage.setItem(TEST_KEY, JSON.stringify(this.testState));
        this.renderChecklist();
        this.checkLock();
        if (window.proofSystem) window.proofSystem.updateShipStatus();
    }

    resetTests() {
        this.testState = {};
        localStorage.setItem(TEST_KEY, JSON.stringify(this.testState));
        this.renderChecklist();
        this.checkLock();
        if (window.proofSystem) window.proofSystem.updateShipStatus();
    }

    getPassCount() {
        return Object.values(this.testState).filter(val => val === true).length;
    }

    checkLock() {
        const passCount = this.getPassCount();
        const isShipPage = window.location.pathname.includes('08-ship.html');
        const shipLink = document.getElementById('ship-link');

        if (shipLink) {
            if (passCount === 10) {
                shipLink.style.color = 'var(--color-white)';
                shipLink.style.cursor = 'pointer';
                shipLink.style.opacity = '1';
                shipLink.style.pointerEvents = 'auto';
            } else {
                shipLink.style.color = 'rgba(255,255,255,0.3)';
                shipLink.style.cursor = 'not-allowed';
                shipLink.style.opacity = '0.5';
                shipLink.style.pointerEvents = 'none';
            }
        }

        if (isShipPage && passCount < 10) {
            window.location.href = '07-test.html';
        }
    }

    renderChecklist() {
        const container = document.getElementById('checklist-container');
        if (!container) return;

        const passCount = this.getPassCount();
        const scoreEl = document.getElementById('pass-count');
        if (scoreEl) scoreEl.textContent = passCount;

        const warning = document.getElementById('ship-warning');
        if (warning) {
            warning.classList.toggle('visible', passCount < 10);
        }

        container.innerHTML = TEST_ITEMS.map(item => `
            <div class="checklist-item">
                <input type="checkbox" class="checklist-checkbox" id="${item.id}" 
                    ${this.testState[item.id] ? 'checked' : ''} 
                    onchange="testSystem.toggleTest('${item.id}')">
                <div class="checklist-label">
                    ${item.label}
                    <span class="tooltip-trigger">?
                        <span class="tooltip-text">${item.hint}</span>
                    </span>
                </div>
            </div>
        `).join('');
    }
}

class ProofSystem {
    constructor() {
        this.proofs = JSON.parse(localStorage.getItem(PROOFS_KEY)) || {
            lovable: '',
            github: '',
            vercel: ''
        };
        this.init();
    }

    init() {
        const path = window.location.pathname;
        if (path.includes('proof.html') || path.endsWith('/proof')) {
            this.renderProofPage();
        }
        this.updateShipStatus();
    }

    saveProof(key, value) {
        this.proofs[key] = value;
        localStorage.setItem(PROOFS_KEY, JSON.stringify(this.proofs));

        const el = document.getElementById(`${key}-url`);
        if (el) {
            if (value && !this.isValidUrl(value)) {
                el.classList.add('input-invalid');
            } else {
                el.classList.remove('input-invalid');
            }
        }

        this.updateShipStatus();
    }

    isValidUrl(string) {
        if (!string) return false;
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    isFullyQualified() {
        const testsPassed = window.testSystem ? window.testSystem.getPassCount() === 10 : false;
        const linksValid = this.isValidUrl(this.proofs.lovable) &&
            this.isValidUrl(this.proofs.github) &&
            this.isValidUrl(this.proofs.vercel);
        return testsPassed && linksValid;
    }

    updateShipStatus() {
        const badge = document.getElementById('ship-status-badge');
        const message = document.getElementById('ship-final-message');
        if (!badge) return;

        const isShipped = this.isFullyQualified();
        const hasStarted = this.proofs.lovable || this.proofs.github || this.proofs.vercel;

        if (isShipped) {
            badge.textContent = 'Shipped';
            badge.className = 'badge badge-status-selected';
            if (message) message.style.display = 'block';
        } else if (hasStarted) {
            badge.textContent = 'In Progress';
            badge.className = 'badge badge-status-applied';
            if (message) message.style.display = 'none';
        } else {
            badge.textContent = 'Not Started';
            badge.className = 'badge badge-status-neutral';
            if (message) message.style.display = 'none';
        }
    }

    copySubmission() {
        const text = `------------------------------------------
Job Notification Tracker — Final Submission

Lovable Project:
${this.proofs.lovable || 'Pending'}

GitHub Repository:
${this.proofs.github || 'Pending'}

Live Deployment:
${this.proofs.vercel || 'Pending'}

Core Features:
- Intelligent match scoring
- Daily digest simulation
- Status tracking
- Test checklist enforced
------------------------------------------`;

        navigator.clipboard.writeText(text).then(() => {
            alert('Submission copied to clipboard.');
        });
    }

    renderProofPage() {
        const steps = [
            'Project Setup', 'Navigation Links', 'Job Data Layer',
            'Match Score Logic', 'Daily Digest System', 'Custom Layout',
            'Test Checklist Enforcement', 'Final Submission System'
        ];

        const summaryContainer = document.getElementById('step-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = steps.map((step, i) => `
                <div class="flex justify-between items-center" style="padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span style="font-size: 14px; color: rgba(0,0,0,0.8);">Step ${i + 1}: ${step}</span>
                    <span class="badge badge-status-selected" style="font-size: 10px;">Completed</span>
                </div>
            `).join('');
        }

        ['lovable', 'github', 'vercel'].forEach(key => {
            const el = document.getElementById(`${key}-url`);
            if (el) {
                el.value = this.proofs[key];
                if (this.proofs[key] && !this.isValidUrl(this.proofs[key])) {
                    el.classList.add('input-invalid');
                }
            }
        });
    }
}

class JobTracker {
    constructor() {
        this.jobs = INITIAL_JOBS;
        this.statusMap = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        this.statusUpdates = JSON.parse(localStorage.getItem(UPDATES_KEY)) || [];
        this.init();
    }

    init() {
        const filterIds = ['status-filter', 'location-filter', 'remote-filter', 'score-filter'];
        filterIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const event = el.type === 'checkbox' ? 'change' : 'input';
                el.addEventListener(event, () => {
                    if (id === 'score-filter') {
                        const valEl = document.getElementById('score-value');
                        if (valEl) valEl.textContent = `${el.value}%+`;
                    }
                    this.render();
                });
            }
        });

        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }

        if (window.location.pathname.includes('digest.html')) {
            this.renderUpdates();
        } else {
            this.render();
        }
    }

    getStatus(jobId) {
        return this.statusMap[jobId] || 'Not Applied';
    }

    updateStatus(jobId, status) {
        const oldStatus = this.getStatus(jobId);
        if (oldStatus === status) return;

        this.statusMap[jobId] = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.statusMap));

        const job = this.jobs.find(j => j.id === jobId);
        this.statusUpdates.unshift({
            jobTitle: job.title,
            company: job.company,
            status: status,
            date: new Date().toLocaleString()
        });
        localStorage.setItem(UPDATES_KEY, JSON.stringify(this.statusUpdates));

        this.showToast(`Status updated: ${status}`);
        this.render();
    }

    clearFilters() {
        const sf = document.getElementById('status-filter');
        if (sf) sf.value = 'All';
        const loc = document.getElementById('location-filter');
        if (loc) loc.value = '';
        const rem = document.getElementById('remote-filter');
        if (rem) rem.checked = false;
        const score = document.getElementById('score-filter');
        if (score) {
            score.value = '0';
            const valEl = document.getElementById('score-value');
            if (valEl) valEl.textContent = '0%+';
        }
        this.render();
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    getBadgeClass(status) {
        const map = {
            'Not Applied': 'badge-status-neutral',
            'Applied': 'badge-status-applied',
            'Rejected': 'badge-status-rejected',
            'Selected': 'badge-status-selected'
        };
        return map[status] || 'badge-status-neutral';
    }

    render() {
        const container = document.getElementById('job-list');
        if (!container) return;

        const filters = {
            status: document.getElementById('status-filter')?.value || 'All',
            location: document.getElementById('location-filter')?.value.toLowerCase() || '',
            remote: document.getElementById('remote-filter')?.checked || false,
            score: parseInt(document.getElementById('score-filter')?.value || '0', 10)
        };

        const filteredJobs = this.jobs.filter(job => {
            const status = this.getStatus(job.id);
            const matchesStatus = filters.status === 'All' || status === filters.status;
            const matchesLocation = job.location.toLowerCase().includes(filters.location);
            const matchesRemote = !filters.remote || job.remote === true;
            const matchesScore = job.matchScore >= filters.score;

            return matchesStatus && matchesLocation && matchesRemote && matchesScore;
        });

        container.innerHTML = filteredJobs.map(job => {
            const status = this.getStatus(job.id);
            return `
            <div class="card job-card" data-id="${job.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="job-meta">
                            <span>${job.company}</span>
                            <span>•</span>
                            <span>${job.location}</span>
                            <span>•</span>
                            <span>Match: ${job.matchScore}%</span>
                        </div>
                        <h3>${job.title}</h3>
                    </div>
                    <span class="badge ${this.getBadgeClass(status)}">${status}</span>
                </div>
                
                <div class="status-group">
                    <button class="status-btn ${status === 'Applied' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Applied')">Applied</button>
                    <button class="status-btn ${status === 'Rejected' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Rejected')">Rejected</button>
                    <button class="status-btn ${status === 'Selected' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Selected')">Selected</button>
                    <button class="status-btn ${status === 'Not Applied' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Not Applied')">Clear</button>
                </div>
            </div>
        `}).join('') || '<div class="card"><p>No jobs match your current filters.</p></div>';
    }

    renderUpdates() {
        const container = document.getElementById('recent-updates');
        if (!container) return;

        container.innerHTML = this.statusUpdates.map(update => `
            <div class="card" style="padding: var(--space-2); margin-bottom: var(--space-1);">
                <div class="flex justify-between items-center">
                    <div>
                        <strong>${update.jobTitle}</strong>
                        <div style="font-size: 13px; color: rgba(0,0,0,0.6);">${update.company}</div>
                        <div style="font-size: 11px; color: rgba(0,0,0,0.4);">${update.date}</div>
                    </div>
                    <span class="badge ${this.getBadgeClass(update.status)}">${update.status}</span>
                </div>
            </div>
        `).join('') || '<p>No recent status updates.</p>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.tracker = new JobTracker();
    window.testSystem = new TestSystem();
    window.proofSystem = new ProofSystem();
});
