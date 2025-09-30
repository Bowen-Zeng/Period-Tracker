class PeriodTracker {
    constructor() {
        this.periods = this.loadPeriods();
        this.initializeEventListeners();
        this.updateDisplay();
    }

    // Load periods from localStorage
    loadPeriods() {
        const saved = localStorage.getItem('periodTracker');
        return saved ? JSON.parse(saved) : [];
    }

    // Save periods to localStorage
    savePeriods() {
        localStorage.setItem('periodTracker', JSON.stringify(this.periods));
    }

    // Initialize event listeners
    initializeEventListeners() {
        const addButton = document.getElementById('add-period');
        const dateInput = document.getElementById('period-date');

        addButton.addEventListener('click', () => this.addPeriod());
        dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPeriod();
            }
        });

        // Set max date to today
        dateInput.max = new Date().toISOString().split('T')[0];
    }

    // Add a new period
    addPeriod() {
        const dateInput = document.getElementById('period-date');
        const date = dateInput.value;

        if (!date) {
            alert('Please select a date');
            return;
        }

        const periodDate = new Date(date);
        const today = new Date();
        
        if (periodDate > today) {
            alert('Period date cannot be in the future');
            return;
        }

        // Check if this date already exists
        if (this.periods.some(p => p.date === date)) {
            alert('This date is already recorded');
            return;
        }

        this.periods.push({ date, timestamp: periodDate.getTime() });
        this.periods.sort((a, b) => b.timestamp - a.timestamp); // Sort newest first
        this.savePeriods();
        this.updateDisplay();
        dateInput.value = '';
    }

    // Delete a period
    deletePeriod(date) {
        if (confirm('Are you sure you want to delete this period entry?')) {
            this.periods = this.periods.filter(p => p.date !== date);
            this.savePeriods();
            this.updateDisplay();
        }
    }

    // Calculate average cycle length
    calculateAverageCycleLength() {
        if (this.periods.length < 2) return null;

        const sortedPeriods = this.periods.sort((a, b) => a.timestamp - b.timestamp);
        const cycles = [];

        for (let i = 1; i < sortedPeriods.length; i++) {
            const days = Math.round((sortedPeriods[i].timestamp - sortedPeriods[i-1].timestamp) / (1000 * 60 * 60 * 24));
            if (days > 15 && days < 50) { // Only include reasonable cycle lengths
                cycles.push(days);
            }
        }

        if (cycles.length === 0) return null;
        return Math.round(cycles.reduce((sum, cycle) => sum + cycle, 0) / cycles.length);
    }

    // Get current cycle day
    getCurrentCycleDay() {
        if (this.periods.length === 0) return null;

        const lastPeriod = new Date(this.periods[0].date);
        const today = new Date();
        const diffTime = today - lastPeriod;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return diffDays > 0 ? diffDays : null;
    }

    // Predict next period
    predictNextPeriod() {
        if (this.periods.length === 0) return null;

        const avgCycle = this.calculateAverageCycleLength();
        if (!avgCycle) return null;

        const lastPeriod = new Date(this.periods[0].date);
        const nextPeriod = new Date(lastPeriod);
        nextPeriod.setDate(lastPeriod.getDate() + avgCycle);

        return nextPeriod;
    }

    // Format date for display
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Update all displays
    updateDisplay() {
        this.updateCycleInfo();
        this.updatePeriodHistory();
    }

    // Update cycle information display
    updateCycleInfo() {
        const currentDay = this.getCurrentCycleDay();
        const avgCycle = this.calculateAverageCycleLength();
        const nextPeriod = this.predictNextPeriod();

        document.querySelector('#current-day span').textContent = 
            currentDay ? currentDay : '-';

        document.querySelector('#cycle-length span').textContent = 
            avgCycle ? avgCycle : '-';

        if (nextPeriod) {
            document.querySelector('#next-period span').textContent = 
                this.formatDate(nextPeriod);

            const today = new Date();
            const daysUntil = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));
            
            let daysUntilText = '';
            if (daysUntil < 0) {
                daysUntilText = `${Math.abs(daysUntil)} days overdue`;
            } else if (daysUntil === 0) {
                daysUntilText = 'Today';
            } else {
                daysUntilText = `${daysUntil} days`;
            }
            
            document.querySelector('#days-until span').textContent = daysUntilText;
        } else {
            document.querySelector('#next-period span').textContent = '-';
            document.querySelector('#days-until span').textContent = '-';
        }
    }

    // Update period history display
    updatePeriodHistory() {
        const historyContainer = document.getElementById('period-history');
        
        if (this.periods.length === 0) {
            historyContainer.innerHTML = '<p class="no-data">No periods recorded yet. Add your first period date above!</p>';
            return;
        }

        let historyHTML = '';
        const sortedPeriods = this.periods.sort((a, b) => b.timestamp - a.timestamp);

        sortedPeriods.forEach((period, index) => {
            const periodDate = new Date(period.date);
            let cycleInfo = '';

            if (index < sortedPeriods.length - 1) {
                const prevPeriod = new Date(sortedPeriods[index + 1].date);
                const cycleLength = Math.round((periodDate - prevPeriod) / (1000 * 60 * 60 * 24));
                cycleInfo = `<span class="cycle-info-small">Cycle: ${cycleLength} days</span>`;
            } else {
                cycleInfo = '<span class="cycle-info-small">First entry</span>';
            }

            historyHTML += `
                <div class="period-entry">
                    <div>
                        <div class="period-date">${this.formatDate(periodDate)}</div>
                        ${cycleInfo}
                    </div>
                    <button class="delete-btn" onclick="tracker.deletePeriod('${period.date}')">Delete</button>
                </div>
            `;
        });

        historyContainer.innerHTML = historyHTML;
    }
}

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new PeriodTracker();
});
