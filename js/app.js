/**
 * Core Logic for Job Notification Tracker
 */

const STORAGE_KEY = 'jobTrackerStatus';
const UPDATES_KEY = 'jobStatusUpdates';

// Mock Data for Jobs
const INITIAL_JOBS = [
    { id: '1', title: 'Senior AI Engineer', company: 'Google DeepMind', matchScore: 95 },
    { id: '2', title: 'UI Researcher', company: 'Linear', matchScore: 88 },
    { id: '3', title: 'Product Designer', company: 'Airbnb', matchScore: 82 },
    { id: '4', title: 'Frontend Architect', company: 'Vercel', matchScore: 91 },
    { id: '5', title: 'Cloud Infrastructure Lead', company: 'Tailscale', matchScore: 75 }
];

class JobTracker {
    constructor() {
        this.jobs = INITIAL_JOBS;
        this.statusMap = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        this.statusUpdates = JSON.parse(localStorage.getItem(UPDATES_KEY)) || [];
        this.render();
    }

    getStatus(jobId) {
        return this.statusMap[jobId] || 'Not Applied';
    }

    updateStatus(jobId, status) {
        const oldStatus = this.getStatus(jobId);
        if (oldStatus === status) return;

        this.statusMap[jobId] = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.statusMap));

        // Add to audit trail
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

        const filterStatus = document.getElementById('status-filter')?.value || 'All';

        let filteredJobs = this.jobs.map(job => ({
            ...job,
            status: this.getStatus(job.id)
        }));

        if (filterStatus !== 'All') {
            filteredJobs = filteredJobs.filter(j => j.status === filterStatus);
        }

        container.innerHTML = filteredJobs.map(job => `
            <div class="card job-card" data-id="${job.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="job-meta">
                            <span>${job.company}</span>
                            <span>•</span>
                            <span>Match: ${job.matchScore}%</span>
                        </div>
                        <h3>${job.title}</h3>
                    </div>
                    <span class="badge ${this.getBadgeClass(job.status)}">${job.status}</span>
                </div>
                
                <div class="status-group">
                    <button class="status-btn ${job.status === 'Applied' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Applied')">Applied</button>
                    <button class="status-btn ${job.status === 'Rejected' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Rejected')">Rejected</button>
                    <button class="status-btn ${job.status === 'Selected' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Selected')">Selected</button>
                    <button class="status-btn ${job.status === 'Not Applied' ? 'active' : ''}" onclick="tracker.updateStatus('${job.id}', 'Not Applied')">Clear</button>
                </div>
            </div>
        `).join('');
    }

    renderUpdates() {
        const container = document.getElementById('recent-updates');
        if (!container) return;

        container.innerHTML = this.statusUpdates.map(update => `
            <div class="card" style="padding: var(--space-2); margin-bottom: var(--space-1);">
                <div class="flex justify-between items-center">
                    <div>
                        <strong>${update.jobTitle}</strong> at ${update.company}
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

    const filter = document.getElementById('status-filter');
    if (filter) {
        filter.addEventListener('change', () => tracker.render());
    }

    if (window.location.pathname.includes('digest')) {
        tracker.renderUpdates();
    }
});
