// Pick Deadline Manager
// Handles the logic for enforcing driver selection deadlines

export class PickDeadlineManager {
    constructor(options = {}) {
        this.raceData = null;
        this.deadlineInterval = null;
        this.onDeadlineApproaching = null;
        this.onDeadlinePassed = null;
        this.debug = options.debug || false;
    }

    log(level, message, data = {}) {
        // Only log if it's an error or if debug mode is on
        if (level === 'error' || (this.debug && ['debug', 'info'].includes(level))) {
            console.log({
                component: "PickDeadlineManager",
                timestamp: new Date().toISOString(),
                level,
                message,
                data
            });
        }
    }

    setDebug(enabled) {
        this.debug = enabled;
    }

    initialize(callbacks = {}) {
        this.log('debug', 'PickDeadlineManager initializing...');
        if (this.deadlineInterval) {
            this.log('debug', 'Clearing existing deadlineInterval.', { intervalId: this.deadlineInterval });
            clearInterval(this.deadlineInterval);
            this.deadlineInterval = null;
        }
        this.callbacks = callbacks;
        this.loadRaceData();

        if (!this.raceData || !this.raceData.pickDeadline) {
            this.log('warn', 'No race data or pick deadline available for PickDeadlineManager.');
            return false;
        }

        this.onDeadlineApproaching = callbacks.onDeadlineApproaching;
        this.onDeadlinePassed = callbacks.onDeadlinePassed;
        
        // Check immediately and set up interval
        return this.checkDeadline();
    }

    loadRaceData() {
        try {
            const storedData = localStorage.getItem('nextRaceData');
            if (!storedData) {
                this.log('debug', 'No race data found');
                return;
            }

            const parsedData = JSON.parse(storedData);
            if (!parsedData.pickDeadline) {
                this.log('debug', 'No deadline configured');
                return;
            }

            this.raceData = parsedData;
            this.log('debug', 'Race data loaded', { raceId: this.raceData.raceId });
        } catch (error) {
            this.log('error', 'Failed to load race data', { error: error.message });
        }
    }

    checkDeadline() {
        if (!this.raceData || !this.raceData.pickDeadline) {
            this.log('debug', 'Cannot check deadline without race data or pick deadline.');
            return false;
        }

        const now = new Date();
        const deadline = new Date(this.raceData.pickDeadline);
        const timeRemainingMs = deadline - now;

        if (timeRemainingMs <= 0) {
            this.log('info', 'Pick deadline has passed.', { deadline: this.raceData.pickDeadline });
            if (this.onDeadlinePassed) {
                this.onDeadlinePassed();
            }
            if (this.deadlineInterval) {
                clearInterval(this.deadlineInterval);
                this.deadlineInterval = null;
            }
            return true;
        }

        // If deadline hasn't passed, set up or ensure the interval is running
        if (!this.deadlineInterval) {
            this.deadlineInterval = setInterval(() => this.checkDeadline(), 1000);
            this.log('debug', 'Deadline check interval started.', { intervalId: this.deadlineInterval });
        }

        // Deadline approaching logic (e.g., within 1 hour)
        if (timeRemainingMs < 3600000 && this.onDeadlineApproaching) {
            const hours = Math.floor(timeRemainingMs / 3600000);
            const minutes = Math.floor((timeRemainingMs % 3600000) / 60000);
            const seconds = Math.floor((timeRemainingMs % 60000) / 1000);
            this.onDeadlineApproaching({ hours, minutes, seconds });
        }
        return false;
    }

    isDeadlinePassed() {
        if (!this.raceData || !this.raceData.pickDeadline) {
            console.log('Cannot check deadline without race data or pick deadline');
            return false;
        }

        const now = new Date();
        const deadline = new Date(this.raceData.pickDeadline);
        return now >= deadline;
    }
}

// Make available for testing
if (typeof window !== 'undefined') {
    window.PickDeadlineManager = PickDeadlineManager;
} 