import { QualifyingResultsManager } from './qualifying-results-manager.js';

class AutoPickManager {
    constructor() {
        this.qualifyingManager = new QualifyingResultsManager();
        this.raceData = null;
        this.debug = true;
    }

    log(level, message, data = null) {
        if (!this.debug && level === 'debug') return;
        
        const logMessage = {
            component: 'AutoPickManager',
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(data && { data })
        };

        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'debug':
                console.debug(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    }

    async initialize() {
        // Register event listener first to catch early events
        window.addEventListener('triggerAutoPick', this.handleAutoPickTrigger.bind(this));
        this.log('debug', 'AutoPickManager event listener for triggerAutoPick registered.');

        // Load race data immediately for the manager's context
        const storedRaceData = localStorage.getItem('nextRaceData');
        if (storedRaceData) {
            this.currentRaceData = JSON.parse(storedRaceData);
            this.log('debug', 'AutoPickManager context: Race data loaded from localStorage', this.currentRaceData);
        } else {
            this.log('warn', 'AutoPickManager context: No nextRaceData found in localStorage during initialization.');
            // AutoPickManager might not function correctly without current race context for its triggers.
        }

        // Initialize QualifyingResultsManager if it hasn't been already
        if (!this.qualifyingManager.isInitialized()) { 
            await this.qualifyingManager.initialize(); 
        }
        
        // this.log('debug', 'AutoPickManager fully initialized.'); // Optional: log if needed after QRM init
    }

    loadRaceData() {
        const storedData = localStorage.getItem('nextRaceData');
        if (storedData) {
            this.raceData = JSON.parse(storedData);
            this.log('debug', 'Race data loaded', this.raceData);
        } else {
            this.log('warn', 'No race data available');
        }
    }

    async handleAutoPickTrigger(event) {
        const raceId = event.detail.raceId;
        this.log('debug', 'handleAutoPickTrigger called for raceId:', raceId);

        const raceData = this.getNextRaceData(); // Get current race context
        if (!raceData) {
            this.log('error', 'No raceData found for auto-pick trigger. Ensure nextRaceData is in localStorage.');
            return;
        }
        // Ensure the event is for the current race defined by getNextRaceData if that's the design
        // Or, if raceId from event is king, use that.
        // For now, let's assume the event.detail.raceId is the one we must act upon.
        const raceNameToUse = raceData.raceId === raceId ? raceData.raceName : "Selected Race"; // Get a name

        const userPicks = this.loadUserPicks();
        const existingPick = userPicks.find(pick => pick.raceId === raceId);

        if (existingPick) {
            this.log('debug', 'User already has a pick for this race, no auto-pick needed.', existingPick);
            return; 
        }

        this.log('info', `No pick found for race ${raceId}. Proceeding with auto-pick.`);
        // Proceed with auto-pick, applyAutoPick handles fetching and saving.
        await this.applyAutoPick(raceId, raceNameToUse);
    }

    async applyAutoPick(raceId, raceName) {
        this.log('debug', 'Applying auto-pick logic for race:', { raceId, raceName });

        // Ensure we have the absolute latest qualifying results for the auto-pick decision
        this.log('debug', 'Forcing refresh of qualifying results to get latest completed session for auto-pick.');
        try {
            // Use the actual qualifying date from race data instead of null
            const raceData = this.getNextRaceData();
            const qualifyingDate = raceData?.qualifyingDate;
            if (qualifyingDate) {
                await this.qualifyingManager.fetchQualifyingResults(qualifyingDate);
            } else {
                this.log('warn', 'No qualifying date available for auto-pick, using existing data');
            }
        } catch (error) {
            this.log('error', 'Failed to fetch latest qualifying results for auto-pick.', error);
            // Optionally, notify user of failure to auto-pick due to data issues
            this.showAutopickNotification({ error: "Could not fetch latest qualifying data to perform auto-pick." });
            return; // Stop if data cannot be fetched
        }

        const autoPickedDriver = this.qualifyingManager.getAutoPick(); // Now uses freshly fetched data

        if (autoPickedDriver && autoPickedDriver.driverId) {
            const autoPick = {
                driverId: autoPickedDriver.driverId,
                raceId: raceId,
                raceName: raceName,
                driverName: autoPickedDriver.driverName,
                position: autoPickedDriver.position,
                teamName: autoPickedDriver.teamName,
                timestamp: new Date().toISOString(),
                isAutoPick: true
            };

            let userData = JSON.parse(localStorage.getItem('f1survivor_user_picks') || '{"userId":"local-user","currentSeason":"2025","picks":[]}');
            // Remove any existing pick for this race if one somehow existed
            userData.picks = (userData.picks || []).filter(p => p.raceId !== raceId);
            userData.picks.push(autoPick);
            localStorage.setItem('f1survivor_user_picks', JSON.stringify(userData));
            this.log('debug', 'Auto-pick saved', autoPick);

            this.showAutopickNotification(autoPick);
            this.updateDriverSelectionUI(autoPick);
        } else {
            this.log('warn', 'Could not determine a driver for auto-pick.', { raceId });
            // Optionally, notify user that auto-pick failed to find a driver
            this.showAutopickNotification({ error: "Could not determine a suitable driver for auto-pick.", raceName: raceName });
        }
    }

    showAutopickNotification(driver) {
        const notification = document.createElement('div');
        notification.classList.add('auto-pick-notification');
        notification.innerHTML = `
            <div class="auto-pick-header">
                <h3>Auto-Pick Applied</h3>
                <button id="dismiss-autopick" class="close-btn">×</button>
            </div>
            <div class="auto-pick-content">
                <p>You didn't select a driver before the deadline. The P${driver.position} qualifier has been automatically selected for you:</p>
                <div class="auto-pick-driver">
                    <span class="position">P${driver.position}</span>
                    <strong>${driver.driverName}</strong>
                    <span class="team">${driver.teamName}</span>
                </div>
                ${driver.position !== 15 ? `
                    <div class="auto-pick-note">
                        <small>Note: P15 was already selected, so P${driver.position} was chosen instead.</small>
                    </div>
                ` : ''}
            </div>
            <div class="auto-pick-footer">
                <button id="confirm-autopick" class="confirm-btn">OK</button>
            </div>
        `;
        
        // Add to DOM and handle dismissal
        document.body.appendChild(notification);
        
        // Add event listeners for dismissal
        document.getElementById('dismiss-autopick').addEventListener('click', () => {
            notification.remove();
        });
        
        document.getElementById('confirm-autopick').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 10000);
    }

    updateDriverSelectionUI(driver) {
        // Find the driver card that matches the auto-picked driver
        const driverCard = document.querySelector(`.driver-card[data-driver-id="${driver.driverId}"]`);
        
        if (driverCard) {
            // Remove any existing selections
            document.querySelectorAll('.driver-card.selected').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Add auto-picked class to highlight
            driverCard.classList.add('selected');
            driverCard.classList.add('auto-picked');
            
            // Add auto-pick badge
            let badge = driverCard.querySelector('.auto-pick-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.classList.add('auto-pick-badge');
                badge.textContent = 'AUTO';
                driverCard.appendChild(badge);
            }
            
            // Add tooltip with explanation
            driverCard.setAttribute('title', `This driver was automatically selected because you didn't make a pick before the deadline.`);
        }
        
        // Update selection status if it exists
        const statusElement = document.querySelector('.pick-status');
        if (statusElement) {
            statusElement.textContent = `Auto-pick applied: ${driver.driverName} (P${driver.position})`;
            statusElement.className = 'pick-status auto-pick-status';
        }
        
        // Update make pick button
        const makePickBtn = document.getElementById('make-pick-btn');
        if (makePickBtn) {
            makePickBtn.textContent = `AUTO-PICKED: ${driver.driverName.split(' ')[1].toUpperCase()}`;
            makePickBtn.style.backgroundColor = '#666';
            makePickBtn.disabled = true;
        }
    }

    loadUserPicks() {
        const data = localStorage.getItem('f1survivor_user_picks');
        if (!data) return [];
        
        const parsed = JSON.parse(data);
        return parsed.picks || [];
    }

    getNextRaceData() {
        // Prioritize currentRaceData loaded at init, then the raceData property if it was set by old loadRaceData()
        return this.currentRaceData || this.raceData;
    }

    logDebug(message, data = null) {
        this.log('debug', message, data);
    }

    logError(message, error) {
        this.log('error', message, error);
    }

    logWarn(message, data = null) {
        this.log('warn', message, data);
    }

    logInfo(message) {
        this.log('info', message);
    }
}

export { AutoPickManager }; 