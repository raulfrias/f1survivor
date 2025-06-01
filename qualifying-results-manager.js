import { Logger } from './logger-config.js';

export class QualifyingResultsManager {
    constructor() {
        this.logger = new Logger('QualifyingResultsManager');
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        this.qualifyingResults = null;
        this.raceData = null;
        this.debug = true; // Enable debug by default to see what's happening
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
                // Configure fetch for external APIs
                const fetchOptions = {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                };

                // Don't modify OpenF1 API URLs - use them as-is
                // Only add cache-busting for other external APIs
                const cacheBustUrl = url.includes('api.openf1.org') ? 
                    url : 
                    (url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`);

                this.log('debug', `Fetching URL: ${cacheBustUrl}`);

                const response = await fetch(cacheBustUrl, fetchOptions);
                
                if (response.ok) {
                    const data = await response.json();
                    return data;
                }
                
                // For 404s, just return null without logging an error
                if (response.status === 404) {
                    return null;
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            } catch (error) {
                this.log('warn', `Attempt ${i + 1} failed for ${url}:`, error.message);
                
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
            this.log('debug', 'fetchQualifyingResults called with undefined date. Using fallback.');
            this.qualifyingResults = this.getFallbackDriver(); 
            return this.qualifyingResults; 
        }

        // Check if this is a future date
        const requestDate = new Date(date);
        const now = new Date();
        this.log('debug', `Date comparison: requestDate=${requestDate.toISOString()}, now=${now.toISOString()}, isFuture=${requestDate > now}`);
        
        if (requestDate > now) {
            this.log('debug', `Race date ${date} is in the future (${requestDate.toISOString()} > ${now.toISOString()}). Using fallback instead of fetching from OpenF1 API.`);
            this.qualifyingResults = this.getFallbackDriver();
            return this.qualifyingResults;
        }

        try {
            const cachedResults = localStorage.getItem('qualifyingResults');
            
            if (cachedResults) {
                const parsedResults = JSON.parse(cachedResults);
                if (this.raceData && parsedResults.raceId === this.raceData.raceId) {
                    // Check if cached data is stale (older than 1 hour) for recent races
                    const cacheAge = Date.now() - new Date(parsedResults.timestamp).getTime();
                    const isStale = cacheAge > (60 * 60 * 1000); // 1 hour
                    
                    if (isStale && requestDate <= now) {
                        this.log('debug', 'Cached qualifying data is stale, fetching fresh data');
                        localStorage.removeItem('qualifyingResults'); // Clear stale cache
                    } else {
                        this.log('debug', 'Using cached qualifying results');
                        this.qualifyingResults = parsedResults.results;
                        return this.qualifyingResults;
                    }
                } else {
                    this.log('debug', 'Cache race ID mismatch, clearing cache');
                    localStorage.removeItem('qualifyingResults');
                }
            }

            // Only attempt API call for past races
            if (requestDate <= now) {
                // Call OpenF1 API directly instead of local endpoint
                const qualifying = await this.fetchFromOpenF1API(date);
                
                if (!qualifying || qualifying.length === 0) {
                    this.log('debug', 'Using fallback driver (no data available)');
                    return this.getFallbackDriver();
                }
                
                return this._processResults(qualifying, this.raceData ? this.raceData.raceId : 'unknown_race');
            } else {
                this.log('debug', 'Using fallback for future race');
                return this.getFallbackDriver();
            }
        } catch (error) {
            this.log('error', 'Error fetching qualifying results', error);
            return this.getFallbackDriver();
        }
    }

    async fetchFromOpenF1API(date) {
        try {
            const year = date.split('-')[0];
            this.log('debug', `Fetching qualifying data from OpenF1 API for date: ${date}, year: ${year}`);
            
            // First try: Search for all recent qualifying sessions (like Python script does)
            this.log('debug', 'Searching for recent qualifying sessions...');
            const allQualifyingUrl = `https://api.openf1.org/v1/sessions?session_name=Qualifying`;
            const allSessions = await this.fetchWithRetry(allQualifyingUrl);
            
            this.log('debug', `API response for all qualifying sessions:`, { 
                isArray: Array.isArray(allSessions), 
                length: allSessions ? allSessions.length : 'null/undefined',
                type: typeof allSessions,
                firstFewChars: allSessions ? JSON.stringify(allSessions).substring(0, 200) : 'null',
                actualValue: allSessions
            });
            
            if (allSessions && allSessions.length > 0) {
                this.log('debug', `Found ${allSessions.length} total qualifying sessions`);
                
                // Debug: Show last few sessions to see if our target is there
                const recentSessions = allSessions.slice(-5);
                this.log('debug', 'Recent qualifying sessions:', recentSessions.map(s => ({
                    session_key: s.session_key,
                    location: s.location,
                    date_start: s.date_start,
                    year: s.year
                })));
                
                // Find session that starts on our target date
                const targetSession = allSessions.find(session => 
                    session.date_start && session.date_start.startsWith(date)
                );

                if (targetSession) {
                    this.log('debug', `Found qualifying session: ${targetSession.session_key} at ${targetSession.location}`);
                    
                    // Get drivers and laps for this session
                    const qualifying = await this.fetchSessionData(targetSession.session_key);
                    if (qualifying && qualifying.length > 0) {
                        return qualifying;
                    } else {
                        this.log('debug', `Session ${targetSession.session_key} found but no qualifying data returned`);
                    }
                } else {
                    this.log('debug', `No session found with date_start starting with: ${date}`);
                    // Debug: Show what dates we actually have for 2025
                    const sessions2025 = allSessions.filter(s => s.year === 2025);
                    this.log('debug', `Found ${sessions2025.length} sessions for 2025:`, sessions2025.map(s => ({
                        session_key: s.session_key,
                        location: s.location,
                        date_start: s.date_start
                    })));
                }
            } else {
                this.log('debug', 'allSessions is empty or null/undefined');
            }
            
            // Fallback: Try year-based search
            this.log('debug', `No session found for ${date}, trying year-based search...`);
            const sessionsUrl = `https://api.openf1.org/v1/sessions?year=${year}&session_name=Qualifying`;
            const sessionsResponse = await this.fetchWithRetry(sessionsUrl);
            
            this.log('debug', `Year-based API response:`, { 
                isArray: Array.isArray(sessionsResponse), 
                length: sessionsResponse ? sessionsResponse.length : 'null/undefined',
                type: typeof sessionsResponse,
                actualValue: sessionsResponse
            });
            
            if (!sessionsResponse || sessionsResponse.length === 0) {
                this.log('debug', 'No qualifying sessions found for year', year);
                return [];
            }

            // Find session that starts on the given date
            const targetSession = sessionsResponse.find(session => 
                session.date_start && session.date_start.startsWith(date)
            );

            if (!targetSession) {
                this.log('debug', `No qualifying session found starting on ${date}`);
                return [];
            }

            this.log('debug', `Found qualifying session: ${targetSession.session_key} at ${targetSession.location}`);
            
            return await this.fetchSessionData(targetSession.session_key);

        } catch (error) {
            this.log('error', 'Error fetching from OpenF1 API', error);
            return [];
        }
    }

    async fetchSessionData(sessionKey) {
        try {
            // Get drivers for this session
            const driversUrl = `https://api.openf1.org/v1/drivers?session_key=${sessionKey}`;
            const drivers = await this.fetchWithRetry(driversUrl);

            if (!drivers || drivers.length === 0) {
                this.log('debug', 'No drivers found for session', sessionKey);
                return [];
            }

            // Get laps for this session to determine qualifying order
            const lapsUrl = `https://api.openf1.org/v1/laps?session_key=${sessionKey}`;
            const laps = await this.fetchWithRetry(lapsUrl);

            if (!laps || laps.length === 0) {
                this.log('debug', 'No lap data found for session', sessionKey);
                return [];
            }

            // Calculate best lap times and create qualifying order
            const qualifying = this.calculateQualifyingOrder(drivers, laps);
            this.log('debug', `Processed ${qualifying.length} drivers from OpenF1 API for session ${sessionKey}`);

            return qualifying;

        } catch (error) {
            this.log('error', 'Error fetching session data', error);
            return [];
        }
    }

    calculateQualifyingOrder(drivers, laps) {
        // Create a map of best lap times for each driver
        const bestLaps = {};
        
        laps.forEach(lap => {
            if (lap.lap_duration && lap.driver_number) {
                const currentBest = bestLaps[lap.driver_number];
                if (!currentBest || lap.lap_duration < currentBest.lap_duration) {
                    bestLaps[lap.driver_number] = lap;
                }
            }
        });

        // Create qualifying results by combining driver info with best lap times
        const qualifyingResults = drivers.map(driver => {
            const bestLap = bestLaps[driver.driver_number];
            return {
                driver_number: driver.driver_number,
                full_name: driver.full_name,
                team_name: driver.team_name,
                lap_duration: bestLap ? bestLap.lap_duration : null
            };
        });

        // Sort by lap time (null times go to the end)
        qualifyingResults.sort((a, b) => {
            if (a.lap_duration === null && b.lap_duration === null) return 0;
            if (a.lap_duration === null) return 1;
            if (b.lap_duration === null) return -1;
            return a.lap_duration - b.lap_duration;
        });

        // Add position numbers
        qualifyingResults.forEach((result, index) => {
            result.position = index + 1;
        });

        return qualifyingResults;
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
            this.log('debug', 'Using Hulkenberg as fallback for 2025 season');
            return [fallbackDrivers[0]];
        }

        // For other cases, use deterministic selection based on race identifier
        const raceIdHash = this.raceData?.raceId ? 
            this.raceData.raceId.split('-')[0].length : 0;
        const index = raceIdHash % fallbackDrivers.length;
        
        this.log('debug', 'Using fallback driver');
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