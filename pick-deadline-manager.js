// Pick Deadline Manager
// Handles the logic for enforcing driver selection deadlines

export class PickDeadlineManager {
    constructor(options = {}) {
        this.raceData = null;
        this.deadlineCheckInterval = null;
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
        this.log('debug', 'Initializing deadline manager');
        this.onDeadlineApproaching = callbacks.onDeadlineApproaching;
        this.onDeadlinePassed = callbacks.onDeadlinePassed;
        
        this.loadRaceData();
        
        // Check immediately
        const initialCheck = this.checkDeadlineStatus();
        if (initialCheck.passed) {
            this.log('info', 'Deadline already passed on initialization');
            this.onDeadlinePassed?.();
        }
        
        // Start monitoring only if deadline hasn't passed
        if (!initialCheck.passed) {
            this.startDeadlineMonitoring();
        }
        
        return initialCheck.passed;
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

    checkDeadlineStatus() {
        if (!this.raceData?.pickDeadline) {
            return { passed: false };
        }

        const now = new Date();
        const deadline = new Date(this.raceData.pickDeadline);
        const isPassed = now >= deadline;

        this.log('debug', 'Checking deadline status', {
            now: now.toISOString(),
            deadline: deadline.toISOString(),
            isPassed
        });

        if (isPassed) {
            if (this.deadlineCheckInterval) {
                clearInterval(this.deadlineCheckInterval);
                this.deadlineCheckInterval = null;
            }
            this.onDeadlinePassed?.();
            return { passed: true };
        }

        // Calculate time remaining
        const timeRemaining = {
            passed: false,
            total: deadline - now,
            hours: Math.floor((deadline - now) / (1000 * 60 * 60)),
            minutes: Math.floor(((deadline - now) % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor(((deadline - now) % (1000 * 60)) / 1000)
        };

        // Check if approaching deadline (less than 1 hour)
        if (timeRemaining.total <= 3600000) {
            this.log('info', 'Deadline approaching', { timeRemaining });
            this.onDeadlineApproaching?.(timeRemaining);
        }

        return timeRemaining;
    }

    startDeadlineMonitoring() {
        this.log('debug', 'Starting deadline monitor');
        // Clear any existing interval
        if (this.deadlineCheckInterval) {
            clearInterval(this.deadlineCheckInterval);
        }

        // Check every second
        this.deadlineCheckInterval = setInterval(() => {
            const status = this.checkDeadlineStatus();
            if (status.passed) {
                clearInterval(this.deadlineCheckInterval);
                this.deadlineCheckInterval = null;
            }
        }, 1000);
    }
}

// Make available for testing
if (typeof window !== 'undefined') {
    window.PickDeadlineManager = PickDeadlineManager;
} 