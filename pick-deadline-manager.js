// Pick Deadline Manager
// Handles the logic for enforcing driver selection deadlines

export class PickDeadlineManager {
    constructor() {
        this.raceData = null;
        this.deadlineCheckInterval = null;
        this.onDeadlineApproaching = null;
        this.onDeadlinePassed = null;
    }

    initialize(callbacks = {}) {
        console.log('Initializing PickDeadlineManager');
        this.onDeadlineApproaching = callbacks.onDeadlineApproaching;
        this.onDeadlinePassed = callbacks.onDeadlinePassed;
        
        this.loadRaceData();
        
        // Check immediately
        const initialCheck = this.checkDeadlineStatus();
        if (initialCheck.passed) {
            console.log('Deadline already passed during initialization');
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
                console.warn('No race data found in localStorage');
                return;
            }

            const parsedData = JSON.parse(storedData);
            if (!parsedData.pickDeadline) {
                console.warn('Invalid race data - missing pickDeadline');
                return;
            }

            this.raceData = parsedData;
            console.log('Successfully loaded race data:', this.raceData);
        } catch (error) {
            console.error('Error loading race data:', error);
        }
    }

    checkDeadlineStatus() {
        console.log('Checking deadline status');
        if (!this.raceData?.pickDeadline) {
            console.warn('No deadline data available');
            return { passed: false };
        }

        const now = new Date();
        const deadline = new Date(this.raceData.pickDeadline);
        const isPassed = now >= deadline;

        console.log('Deadline check:', {
            now: now.toISOString(),
            deadline: deadline.toISOString(),
            isPassed
        });

        if (isPassed) {
            console.log('Deadline has passed');
            // Clear interval if it exists
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

        console.log('Time until deadline:', timeRemaining);

        // Check if approaching deadline (less than 1 hour)
        if (timeRemaining.total <= 3600000) {
            console.log('Deadline approaching, triggering callback');
            this.onDeadlineApproaching?.(timeRemaining);
        }

        return timeRemaining;
    }

    startDeadlineMonitoring() {
        console.log('Starting deadline monitoring');
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