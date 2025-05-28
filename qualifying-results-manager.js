import { Logger } from './logger-config.js';

export class QualifyingResultsManager {
    constructor() {
        this.logger = new Logger('QualifyingResultsManager');
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
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

    async fetchWithRetry(url, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    return await response.json();
                }
                
                // Check specific error codes
                if (response.status === 404) {
                    this.logger.log('info', 'Qualifying data not yet available (404)');
                    return null; // Don't retry on 404
                }
                
                throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                this.logger.log('warn', `Attempt ${i + 1} failed:`, error);
                
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    throw error;
                }
            }
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
            this.log('debug', `Using fallback for future race: ${date}`);
            this.qualifyingResults = this.getFallbackDriver();
            return this.qualifyingResults;
        }

        this.log('debug', `Fetching qualifying results for date: ${date === null ? 'latest' : date}`);

        const apiUrl = date === null || date === 'latest' ? '/api/qualifying' : `/api/qualifying?date=${date}`;

        try {
            const cachedResults = localStorage.getItem('qualifyingResults');
            
            if (cachedResults) {
                const parsedResults = JSON.parse(cachedResults);
                this.log('debug', 'Found cached qualifying results');

                if (this.raceData && parsedResults.raceId === this.raceData.raceId) {
                    this.log('debug', 'Using cached qualifying results');
                    this.qualifyingResults = parsedResults.results;
                    return this.qualifyingResults;
                }
            }

            // Only attempt API call for past races
            if (requestDate <= now) {
                this.log('debug', 'Fetching from API:', apiUrl);
                const data = await this.fetchWithRetry(apiUrl);
                
                if (data === null) {
                    this.log('debug', 'No data available, using intelligent fallback');
                    return this.getIntelligentFallback();
                }
                
                return this._processResults(data, this.raceData ? this.raceData.raceId : 'unknown_race');
            } else {
                this.log('debug', 'Using fallback for future race');
                return this.getFallbackDriver();
            }
        } catch (error) {
            if (error.message?.includes('404')) {
                this.log('debug', 'API returned 404, using fallback driver');
            } else {
                this.log('error', 'Error fetching qualifying results', error);
            }
            return this.getFallbackDriver();
        }
    }

    getFallbackDriver() {
        // Update fallback drivers for 2025 season - Ordered by priority
        const fallbackDrivers = [
            { driverId: 27, driverName: "Nico Hulkenberg", position: 15, teamName: "Kick Sauber" },
            { driverId: 31, driverName: "Esteban Ocon", position: 15, teamName: "Haas F1 Team" },
            { driverId: 5, driverName: "Gabriel Bortoleto", position: 15, teamName: "Kick Sauber" },
            { driverId: 87, driverName: "Oliver Bearman", position: 15, teamName: "Haas F1 Team" }
        ];

        // For 2025 season, always return Hulkenberg as primary fallback
        if (this.raceData?.qualifyingDate?.startsWith('2025')) {
            this.log('info', 'Using primary fallback driver (Hulkenberg) for 2025 season', fallbackDrivers[0]);
            return [fallbackDrivers[0]];
        }

        // For other cases, use deterministic selection based on race identifier
        const raceIdHash = this.raceData?.raceId ? 
            this.raceData.raceId.split('-')[0].length : 0;
        const index = raceIdHash % fallbackDrivers.length;
        
        this.log('info', 'Using fallback driver for future or unavailable qualifying data', fallbackDrivers[index]);
        return [fallbackDrivers[index]];
    }

    getIntelligentFallback() {
        // Instead of hardcoded drivers, use current grid standings
        // or historical P15 data for the circuit
        const circuitP15History = {
            'Monaco': [27, 20, 31], // Typical P15 drivers at Monaco
            'Silverstone': [23, 77, 18],
            // ... etc
        };
        
        const circuit = this.raceData?.raceCircuit;
        const candidates = circuitP15History[circuit] || [20, 31, 27, 18];
        
        // Pick first non-selected candidate
        for (const driverId of candidates) {
            if (!this.isDriverPicked(driverId)) {
                const driver = this.getDriverInfo(driverId);
                return [{
                    driverId,
                    driverName: driver?.name || `Driver ${driverId}`,
                    position: 15,
                    teamName: driver?.team || 'Unknown Team'
                }];
            }
        }
        
        return this.getFallbackDriver(); // Ultimate fallback
    }

    isDriverPicked(driverId) {
        const data = localStorage.getItem('f1survivor_user_picks');
        if (!data) return false;
        
        const userData = JSON.parse(data);
        return (userData.picks || []).some(pick => pick.driverId === driverId);
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
            // Use getFallbackDriver instead of hardcoded fallback
            return this.getFallbackDriver()[0];
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