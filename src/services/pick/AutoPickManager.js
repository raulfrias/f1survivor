import { QualifyingResultsManager } from '@/services/race/QualifyingResultsManager.js';
import { loadPicksWithContext, savePickWithContext } from '@/services/league/LeagueIntegration.js';
import { authManager } from '@/services/auth/AuthManager.js';

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

        // Check if user is authenticated - auto-pick requires authentication
        const isAuthenticated = await authManager.isAuthenticated();
        if (!isAuthenticated) {
            this.log('warn', 'User not authenticated, skipping auto-pick');
            return;
        }

        const raceData = this.getNextRaceData(); // Get current race context
        if (!raceData) {
            this.log('error', 'No raceData found for auto-pick trigger. Ensure nextRaceData is in localStorage.');
            return;
        }
        
        const raceNameToUse = raceData.raceId === raceId ? raceData.raceName : "Selected Race"; // Get a name

        // Load picks from AWS backend
        const userPicks = await this.loadUserPicks();
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
            const driverInfo = {
                driverName: autoPickedDriver.driverName,
                teamName: autoPickedDriver.teamName,
                isAutoPick: true,
                position: autoPickedDriver.position
            };

            try {
                // Save auto-pick to AWS backend
                const savedPick = await savePickWithContext(autoPickedDriver.driverId, driverInfo);
                this.log('debug', 'Auto-pick saved to AWS backend', savedPick);

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

                this.showAutopickNotification(autoPick);
                this.updateDriverSelectionUI(autoPick);
            } catch (error) {
                this.log('error', 'Failed to save auto-pick to AWS backend', error);
                this.showAutopickNotification({ 
                    error: "Failed to save auto-pick. Please try making a manual pick.", 
                    raceName: raceName 
                });
            }
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

    async loadUserPicks() {
        try {
            return await loadPicksWithContext();
        } catch (error) {
            this.log('error', 'Failed to load picks from AWS backend', error);
            return [];
        }
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