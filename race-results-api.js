// Race Results API - JavaScript wrapper for get_race_results.py

/**
 * Fetch race results for a specific session
 * @param {string} sessionKey - The session key for the race
 * @returns {Promise<Object|null>} Race results or null if failed
 */
async function fetchRaceResults(sessionKey) {
  try {
    console.log(`Fetching race results for session: ${sessionKey}`);
    
    // For now, we'll simulate the race results since we can't directly execute Python in browser
    // In a real implementation, this would call a backend API that executes the Python script
    
    // Check if we have cached results first
    const cachedResults = getCachedRaceResults(sessionKey);
    if (cachedResults) {
      console.log('Using cached race results');
      return cachedResults;
    }
    
    // Simulate API call to backend that would execute get_race_results.py
    // For demo purposes, return mock data for known races
    const mockResults = getMockRaceResults(sessionKey);
    
    if (mockResults) {
      // Cache the results
      cacheRaceResults(sessionKey, mockResults);
      return mockResults;
    }
    
    console.warn(`No race results available for session: ${sessionKey}`);
    return null;
    
  } catch (error) {
    console.error('Failed to fetch race results:', error);
    return null;
  }
}

/**
 * Get cached race results from localStorage
 * @param {string} sessionKey - The session key
 * @returns {Object|null} Cached results or null
 */
function getCachedRaceResults(sessionKey) {
  try {
    const cached = localStorage.getItem(`race_results_${sessionKey}`);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    
    // Check if cache is still valid (24 hours)
    const cacheAge = Date.now() - new Date(data.fetched_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (cacheAge > maxAge) {
      localStorage.removeItem(`race_results_${sessionKey}`);
      return null;
    }
    
    return data.results;
  } catch (error) {
    console.error('Error reading cached results:', error);
    return null;
  }
}

/**
 * Cache race results in localStorage
 * @param {string} sessionKey - The session key
 * @param {Object} results - The race results to cache
 */
function cacheRaceResults(sessionKey, results) {
  try {
    const cacheData = {
      results: results,
      fetched_at: new Date().toISOString()
    };
    
    localStorage.setItem(`race_results_${sessionKey}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching results:', error);
  }
}

/**
 * Get mock race results for demo purposes
 * @param {string} sessionKey - The session key
 * @returns {Object|null} Mock results or null
 */
function getMockRaceResults(sessionKey) {
  // Mock data based on real F1 2025 season structure
  const mockResults = {
    'bhr-2025-race': {
      session_key: sessionKey,
      session_name: 'Race',
      location: 'Bahrain',
      date: '2025-03-02',
      positions: [
        { position: 1, driver_number: 1, full_name: "Max Verstappen", team_name: "Red Bull Racing" },
        { position: 2, driver_number: 4, full_name: "Lando Norris", team_name: "McLaren" },
        { position: 3, driver_number: 16, full_name: "Charles Leclerc", team_name: "Ferrari" },
        { position: 4, driver_number: 55, full_name: "Carlos Sainz", team_name: "Ferrari" },
        { position: 5, driver_number: 63, full_name: "George Russell", team_name: "Mercedes" },
        { position: 6, driver_number: 44, full_name: "Lewis Hamilton", team_name: "Mercedes" },
        { position: 7, driver_number: 11, full_name: "Sergio Perez", team_name: "Red Bull Racing" },
        { position: 8, driver_number: 14, full_name: "Fernando Alonso", team_name: "Aston Martin" },
        { position: 9, driver_number: 18, full_name: "Lance Stroll", team_name: "Aston Martin" },
        { position: 10, driver_number: 81, full_name: "Oscar Piastri", team_name: "McLaren" },
        { position: 11, driver_number: 27, full_name: "Nico Hulkenberg", team_name: "Haas" },
        { position: 12, driver_number: 20, full_name: "Kevin Magnussen", team_name: "Haas" },
        { position: 13, driver_number: 10, full_name: "Pierre Gasly", team_name: "Alpine" },
        { position: 14, driver_number: 31, full_name: "Esteban Ocon", team_name: "Alpine" },
        { position: 15, driver_number: 23, full_name: "Alexander Albon", team_name: "Williams" },
        { position: 16, driver_number: 2, full_name: "Logan Sargeant", team_name: "Williams" },
        { position: 17, driver_number: 77, full_name: "Valtteri Bottas", team_name: "Kick Sauber" },
        { position: 18, driver_number: 24, full_name: "Zhou Guanyu", team_name: "Kick Sauber" },
        { position: 19, driver_number: 22, full_name: "Yuki Tsunoda", team_name: "RB" },
        { position: 20, driver_number: 3, full_name: "Daniel Ricciardo", team_name: "RB" }
      ]
    },
    'sau-2025-race': {
      session_key: sessionKey,
      session_name: 'Race',
      location: 'Saudi Arabia',
      date: '2025-03-09',
      positions: [
        { position: 1, driver_number: 16, full_name: "Charles Leclerc", team_name: "Ferrari" },
        { position: 2, driver_number: 1, full_name: "Max Verstappen", team_name: "Red Bull Racing" },
        { position: 3, driver_number: 4, full_name: "Lando Norris", team_name: "McLaren" },
        { position: 4, driver_number: 55, full_name: "Carlos Sainz", team_name: "Ferrari" },
        { position: 5, driver_number: 44, full_name: "Lewis Hamilton", team_name: "Mercedes" },
        { position: 6, driver_number: 63, full_name: "George Russell", team_name: "Mercedes" },
        { position: 7, driver_number: 81, full_name: "Oscar Piastri", team_name: "McLaren" },
        { position: 8, driver_number: 11, full_name: "Sergio Perez", team_name: "Red Bull Racing" },
        { position: 9, driver_number: 14, full_name: "Fernando Alonso", team_name: "Aston Martin" },
        { position: 10, driver_number: 18, full_name: "Lance Stroll", team_name: "Aston Martin" },
        { position: 11, driver_number: 27, full_name: "Nico Hulkenberg", team_name: "Haas" },
        { position: 12, driver_number: 20, full_name: "Kevin Magnussen", team_name: "Haas" },
        { position: 13, driver_number: 10, full_name: "Pierre Gasly", team_name: "Alpine" },
        { position: 14, driver_number: 31, full_name: "Esteban Ocon", team_name: "Alpine" },
        { position: 15, driver_number: 23, full_name: "Alexander Albon", team_name: "Williams" },
        { position: 16, driver_number: 2, full_name: "Logan Sargeant", team_name: "Williams" },
        { position: 17, driver_number: 77, full_name: "Valtteri Bottas", team_name: "Kick Sauber" },
        { position: 18, driver_number: 24, full_name: "Zhou Guanyu", team_name: "Kick Sauber" },
        { position: 19, driver_number: 22, full_name: "Yuki Tsunoda", team_name: "RB" },
        { position: 20, driver_number: 3, full_name: "Daniel Ricciardo", team_name: "RB" }
      ]
    },
    'esp-2025-race': {
      session_key: sessionKey,
      session_name: 'Race',
      location: 'Barcelona',
      date: '2025-06-01',
      positions: [
        { position: 1, driver_number: 1, full_name: "Max Verstappen", team_name: "Red Bull Racing" },
        { position: 2, driver_number: 4, full_name: "Lando Norris", team_name: "McLaren" },
        { position: 3, driver_number: 16, full_name: "Charles Leclerc", team_name: "Ferrari" },
        { position: 4, driver_number: 81, full_name: "Oscar Piastri", team_name: "McLaren" },
        { position: 5, driver_number: 63, full_name: "George Russell", team_name: "Mercedes" },
        { position: 6, driver_number: 44, full_name: "Lewis Hamilton", team_name: "Mercedes" },
        { position: 7, driver_number: 11, full_name: "Sergio Perez", team_name: "Red Bull Racing" },
        { position: 8, driver_number: 14, full_name: "Fernando Alonso", team_name: "Aston Martin" },
        { position: 9, driver_number: 18, full_name: "Lance Stroll", team_name: "Aston Martin" },
        { position: 10, driver_number: 27, full_name: "Nico Hulkenberg", team_name: "Kick Sauber" },
        { position: 11, driver_number: 20, full_name: "Kevin Magnussen", team_name: "Haas" },
        { position: 12, driver_number: 10, full_name: "Pierre Gasly", team_name: "Alpine" },
        { position: 13, driver_number: 31, full_name: "Esteban Ocon", team_name: "Alpine" },
        { position: 14, driver_number: 22, full_name: "Yuki Tsunoda", team_name: "RB" },
        { position: 15, driver_number: 55, full_name: "Carlos Sainz", team_name: "Williams" },
        { position: 16, driver_number: 23, full_name: "Alexander Albon", team_name: "Williams" },
        { position: 17, driver_number: 77, full_name: "Valtteri Bottas", team_name: "Kick Sauber" },
        { position: 18, driver_number: 24, full_name: "Zhou Guanyu", team_name: "Kick Sauber" },
        { position: 19, driver_number: 2, full_name: "Logan Sargeant", team_name: "Williams" },
        { position: 20, driver_number: 3, full_name: "Daniel Ricciardo", team_name: "RB" }
      ]
    }
  };
  
  return mockResults[sessionKey] || null;
}

/**
 * Calculate survival status based on user pick and race results
 * @param {Object} userPick - The user's pick object
 * @param {Object} raceResults - The race results object
 * @returns {Object} Survival status with position and status
 */
function calculateSurvivalStatus(userPick, raceResults) {
  if (!raceResults || !raceResults.positions) {
    return { status: 'PENDING', position: null };
  }
  
  // Find the driver's result by matching driver number
  const driverResult = raceResults.positions.find(
    p => p.driver_number === userPick.driverId
  );
  
  if (!driverResult) {
    return { status: 'DNF', position: 'DNF' };
  }
  
  const position = driverResult.position;
  const status = position <= 10 ? 'SURVIVED' : 'ELIMINATED';
  
  return {
    status: status,
    position: `P${position}`
  };
}

/**
 * Get race results for all user picks
 * @param {Array} userPicks - Array of user pick objects
 * @returns {Promise<Array>} Array of picks with survival status
 */
async function getPicksWithResults(userPicks) {
  const picksWithResults = [];
  
  for (const pick of userPicks) {
    try {
      // Convert raceId to session key format for race results
      const sessionKey = `${pick.raceId}-race`;
      const raceResults = await fetchRaceResults(sessionKey);
      
      const survivalStatus = calculateSurvivalStatus(pick, raceResults);
      
      picksWithResults.push({
        ...pick,
        raceResults: raceResults,
        survivalStatus: survivalStatus
      });
    } catch (error) {
      console.error(`Error processing pick for race ${pick.raceId}:`, error);
      picksWithResults.push({
        ...pick,
        raceResults: null,
        survivalStatus: { status: 'PENDING', position: null }
      });
    }
  }
  
  return picksWithResults;
}

/**
 * Check if player is still alive (no eliminations)
 * @param {Array} picksWithResults - Array of picks with survival status
 * @returns {boolean} True if player is still alive
 */
function isPlayerAlive(picksWithResults) {
  return !picksWithResults.some(pick => 
    pick.survivalStatus && pick.survivalStatus.status === 'ELIMINATED'
  );
}

/**
 * Calculate survival rate
 * @param {Array} picksWithResults - Array of picks with survival status
 * @returns {number} Survival rate as percentage
 */
function calculateSurvivalRate(picksWithResults) {
  const completedRaces = picksWithResults.filter(pick => 
    pick.survivalStatus && pick.survivalStatus.status !== 'PENDING'
  );
  
  if (completedRaces.length === 0) return 100;
  
  const survivedRaces = completedRaces.filter(pick => 
    pick.survivalStatus.status === 'SURVIVED'
  );
  
  return Math.round((survivedRaces.length / completedRaces.length) * 100);
}

export {
  fetchRaceResults,
  calculateSurvivalStatus,
  getPicksWithResults,
  isPlayerAlive,
  calculateSurvivalRate,
  getCachedRaceResults,
  cacheRaceResults
}; 