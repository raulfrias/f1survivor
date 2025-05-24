export class QualifyingResultsManager {
    constructor() {
        this.qualifyingResults = null;
        this.raceData = null;
        this.debug = false;
        this._isInitialized = false;
    }

    log(level, message, data = null) {
        if (!this.debug && level === 'debug') return;
        
        const logMessage = {
            component: 'QualifyingResultsManager',
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
        this.loadRaceData();
        if (!this.raceData || !this.raceData.qualifyingDate) {
            this.log('warn', 'Cannot initialize QRM fully: raceData or raceData.qualifyingDate is missing. Will rely on explicit fetch for auto-pick or other direct calls.');
            this._isInitialized = false; // Mark as not fully initialized if essential date is missing
            return; // Important to return here if qualifyingDate is missing for the initial fetch
        }
        // Only fetch if qualifyingDate is valid
        await this.fetchQualifyingResults(this.raceData.qualifyingDate);
        this._isInitialized = true;
        this.log('debug', 'QualifyingResultsManager initialized.');
    }

    isInitialized() {
        return this._isInitialized;
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

    _processResults(apiResponseResults, raceIdForCaching) {
        if (apiResponseResults && Array.isArray(apiResponseResults) && apiResponseResults.length > 0) {
            this.qualifyingResults = apiResponseResults.map(driver => ({
                ...driver,
                driverId: parseInt(driver.driver_number) // Ensure driverId is an int, matching mockDrivers
            }));

            localStorage.setItem('qualifyingResults', JSON.stringify({
                raceId: raceIdForCaching,
                results: this.qualifyingResults,
                timestamp: new Date().toISOString()
            }));
            this.log('debug', 'Qualifying results processed and cached', { raceId: raceIdForCaching, count: this.qualifyingResults.length });
            return this.qualifyingResults;
        } else {
            this.log('warn', 'No results to process or results are not an array', apiResponseResults);
            this.qualifyingResults = []; // Ensure it's an empty array if processing fails
            return [];
        }
    }

    async fetchQualifyingResults(date) {
        if (date === undefined) {
            this.log('warn', 'fetchQualifyingResults called with undefined date. Using fallback.');
            this.qualifyingResults = this.getFallbackDriver(); 
            return this.qualifyingResults; 
        }

        // Check if this is a future date
        const requestDate = new Date(date);
        const now = new Date();
        if (requestDate > now) {
            this.log('info', `Qualifying results requested for future date (${date}). Using fallback.`);
            this.qualifyingResults = this.getFallbackDriver();
            return this.qualifyingResults;
        }

        this.log('debug', `Fetching qualifying results for date: ${date === null ? 'latest' : date}`);
        this.log('debug', 'Current this.raceData at start of fetchQualifyingResults:', this.raceData);

        const apiUrl = date === null || date === 'latest' ? '/api/qualifying' : `/api/qualifying?date=${date}`;

        try {
            const cachedResults = localStorage.getItem('qualifyingResults');
            
            if (cachedResults) {
                this.log('debug', 'Cached qualifyingResults found in localStorage.', { rawCache: cachedResults.substring(0, 100) + '...' });
                const parsedResults = JSON.parse(cachedResults);
                this.log('debug', 'Parsed cached results:', { raceId: parsedResults.raceId, resultsLength: parsedResults.results ? parsedResults.results.length : 0 });

                if (this.raceData && parsedResults.raceId === this.raceData.raceId) {
                    this.log('info', 'Using cached qualifying results as raceId matches.', { cachedRaceId: parsedResults.raceId });
                    this.qualifyingResults = parsedResults.results;
                    return this.qualifyingResults;
                } else {
                    this.log('info', 'Cached results NOT used. Reason:', {
                        raceDataExists: !!this.raceData,
                        raceDataRaceId: this.raceData ? this.raceData.raceId : 'N/A',
                        cachedRaceId: parsedResults.raceId,
                        match: this.raceData ? parsedResults.raceId === this.raceData.raceId : false
                    });
                }
            } else {
                this.log('debug', 'No cached qualifyingResults found in localStorage.');
            }

            this.log('info', 'Proceeding to fetch qualifying results from API:', apiUrl);
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); // Data will now be an array of drivers

            // Use the new _processResults method for real API data too
            return this._processResults(data, this.raceData ? this.raceData.raceId : 'unknown_race');

        } catch (error) {
            // Check if this is a 500 error from the qualifying script
            if (error.message && error.message.includes('500')) {
                this.log('info', 'Qualifying data not available yet. Using fallback driver.');
            } else {
                this.log('error', 'Failed to fetch qualifying results', error);
            }
            this.qualifyingResults = []; // Explicitly clear on error before fallback
            return this.getFallbackDriver();
        }
    }

    getFallbackDriver() {
        // Update fallback drivers for 2025 season
        const fallbackDrivers = [
            { driverId: 31, driverName: "Esteban Ocon", position: 15, teamName: "Haas F1 Team" },
            { driverId: 87, driverName: "Oliver Bearman", position: 15, teamName: "Haas F1 Team" },
            { driverId: 27, driverName: "Nico Hulkenberg", position: 15, teamName: "Kick Sauber" },
            { driverId: 5, driverName: "Gabriel Bortoleto", position: 15, teamName: "Kick Sauber" }
        ];

        // Deterministic selection based on race identifier
        const raceIdHash = this.raceData?.raceId ? 
            this.raceData.raceId.split('-')[0].length : 0;
        const index = raceIdHash % fallbackDrivers.length;
        
        this.log('info', 'Using fallback driver for future or unavailable qualifying data', fallbackDrivers[index]);
        return [fallbackDrivers[index]];
    }

    isDriverPicked(driverId) {
        const userPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
        return userPicks.some(pick => pick.driverId === driverId);
    }

    getNextAvailablePosition(startPosition = 15) {
        if (!this.qualifyingResults || !Array.isArray(this.qualifyingResults) || this.qualifyingResults.length === 0) {
             this.log('warn', 'Qualifying results not available or not an array for getNextAvailablePosition');
            return null; // Or handle appropriately
        }

        // First try positions after P15 (P16-P20)
        for (let pos = startPosition + 1; pos <= 20; pos++) {
            // Find driver by position in the array.
            // The array elements should have a 'position' property.
            const driver = this.qualifyingResults.find(d => d.position === pos);
            if (driver && !this.isDriverPicked(driver.driverId)) {
                return {
                    driverId: driver.driverId,
                    driverName: driver.full_name,
                    position: pos,
                    teamName: driver.team_name
                };
            }
        }

        // If no positions after P15 are available, try positions before (P14-P1)
        for (let pos = startPosition - 1; pos >= 1; pos--) {
            const driver = this.qualifyingResults.find(d => d.position === pos);
            if (driver && !this.isDriverPicked(driver.driverId)) {
                return {
                    driverId: driver.driverId,
                    driverName: driver.full_name,
                    position: pos,
                    teamName: driver.team_name
                };
            }
        }

        return null;  // No available positions found
    }

    getAutoPick() {
        if (!this.qualifyingResults || !Array.isArray(this.qualifyingResults) || this.qualifyingResults.length === 0) {
            this.log('warn', 'Qualifying results not available or not an array for getAutoPick');
            // Potentially use a very basic fallback if no qualifying results at all
            const fallbackP15 = { driverId: 20, driverName: "Kevin Magnussen (Fallback)", position: 15, teamName: "Haas F1 Team" };
            if (!this.isDriverPicked(fallbackP15.driverId)) return fallbackP15;
            return null; // Or try getNextAvailablePosition with a dummy full list if truly desperate
        }

        // Try P15 first
        const p15DriverResult = this.qualifyingResults.find(d => d.position === 15);
        if (p15DriverResult && !this.isDriverPicked(p15DriverResult.driverId)) {
            // Ensure consistent object structure is returned
            return {
                driverId: p15DriverResult.driverId,
                driverName: p15DriverResult.full_name, // Map to driverName
                teamName: p15DriverResult.team_name,   // Map to teamName
                position: p15DriverResult.position
            };
        }

        // If P15 is taken or not found, get next available position
        return this.getNextAvailablePosition(15);
    }
} 