/**
 * Core Logic for Job Notification Tracker
 */

const STORAGE_KEY = 'jobTrackerStatus';
const UPDATES_KEY = 'jobStatusUpdates';

// Mock Data for Jobs
const INITIAL_JOBS = [
    { id: '1', title: 'Senior AI Engineer', company: 'Google DeepMind', matchScore: 95, location: 'London, UK', remote: true },
    { id: '2', title: 'UI Researcher', company: 'Linear', matchScore: 88, location: 'San Francisco, CA', remote: true },
    { id: '3', title: 'Product Designer', company: 'Airbnb', matchScore: 82, location: 'New York, NY', remote: false },
    { id: '4', title: 'Frontend Architect', company: 'Vercel', matchScore: 91, location: 'Remote', remote: true },
    { id: '5', title: 'Cloud Infrastructure Lead', company: 'Tailscale', matchScore: 75, location: 'Toronto, CA', remote: true }
];

class JobTracker {
    constructor() {
        this.jobs = INITIAL_JOBS;
        this.statusMap = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        this.statusUpdates = JSON.parse(localStorage.getItem(UPDATES_KEY)) || [];
        this.init();
    }

    init() {
        // Initialize listeners for all possible filters
        const filterIds = ['status-filter', 'location-filter', 'remote-filter', 'score-filter'];
        filterIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const event = el.type === 'checkbox' ? 'change' : 'input';
                el.addEventListener(event, () => {
                    if (id === 'score-filter') {
                        document.getElementById('score-value').textContent = `${el.value}%+`;
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
        // Edge Case: If no status exists, assume "Not Applied". Robust vs empty localStorage.
        return this.statusMap[jobId] || 'Not Applied';
    }

    updateStatus(jobId, status) {
        const oldStatus = this.getStatus(jobId);
        if (oldStatus === status) return;

        this.statusMap[jobId] = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.statusMap));

        // Add to audit trail for /digest
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
        document.getElementById('status-filter').value = 'All';
        const loc = document.getElementById('location-filter');
        if (loc) loc.value = '';
        const rem = document.getElementById('remote-filter');
        if (rem) rem.checked = false;
        const score = document.getElementById('score-filter');
        if (score) {
            score.value = '0';
            document.getElementById('score-value').textContent = '0%+';
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

        // Multi-criteria AND logic
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

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.tracker = new JobTracker();
});
