const STORAGE_KEYS = {
  USER_PICKS: 'f1survivor_user_picks',
  CURRENT_SEASON: 'f1survivor_season',
  USER_SETTINGS: 'f1survivor_settings'
};

// Save user picks to localStorage (enhanced for pick changes)
function saveUserPicks(driverId, driverInfo = null) {
  try {
    // Load existing picks first
    let existingPicks = loadUserPicks();
    console.log('Existing picks before save:', existingPicks);
    
    // Ensure existingPicks is an array
    if (!Array.isArray(existingPicks)) {
      console.log('Converting existing picks to array');
      existingPicks = [];
    }
    
    // Get race data for raceId
    const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
    if (!raceData || !raceData.raceId) {
      throw new Error('No valid race data found. Cannot save pick.');
    }
    
    // Create new pick object with enhanced data
    const newPick = {
      driverId: parseInt(driverId), // Ensure driverId is a number
      timestamp: new Date().toISOString(),
      raceId: raceData.raceId,
      driverName: driverInfo?.driverName || null,
      teamName: driverInfo?.teamName || null,
      isAutoPick: driverInfo?.isAutoPick || false
    };
    
    // Check if pick already exists for this race
    const existingPickIndex = existingPicks.findIndex(p => p.raceId === raceData.raceId);
    
    if (existingPickIndex !== -1) {
      // Update existing pick (change scenario)
      existingPicks[existingPickIndex] = newPick;
      console.log('Updated existing pick for race:', raceData.raceId);
    } else {
      // Add new pick
      existingPicks.push(newPick);
      console.log('Added new pick for race:', raceData.raceId);
    }
    
    const userPicksData = {
      userId: "local-user",
      currentSeason: getCurrentSeason(),
      picks: existingPicks
    };
    
    console.log('Saving picks data:', userPicksData);
    localStorage.setItem(STORAGE_KEYS.USER_PICKS, JSON.stringify(userPicksData));
    
    // Return the saved pick for confirmation
    return newPick;
  } catch (error) {
    console.error('Failed to save picks to localStorage:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Load user picks from localStorage
function loadUserPicks() {
  try {
    const picksData = localStorage.getItem(STORAGE_KEYS.USER_PICKS);
    
    if (!picksData) {
      return [];
    }
    
    const userData = JSON.parse(picksData);
    
    // Ensure we're only loading picks from the current season
    if (userData.currentSeason !== getCurrentSeason()) {
      return [];
    }
    
    // Ensure picks is an array
    if (!userData.picks) {
      return [];
    }
    
    if (!Array.isArray(userData.picks)) {
      // If picks is a single pick object, wrap it in an array
      if (typeof userData.picks === 'object' && userData.picks.driverId) {
        return [userData.picks];
      }
      // If picks is a single number (driverId), convert to pick object
      if (typeof userData.picks === 'number') {
        return [{
          driverId: userData.picks,
          timestamp: new Date().toISOString()
        }];
      }
      return [];
    }
    
    return userData.picks;
  } catch (error) {
    console.error('Failed to load picks from localStorage:', error);
    return [];
  }
}

// Get current F1 season (hardcoded to 2025 as per requirements)
function getCurrentSeason() {
  return "2025"; // Current season as per requirements (May 2025)
}

// Check if a driver has already been picked
function isDriverAlreadyPicked(driverId) {
  try {
    const picks = loadUserPicks();
    if (!Array.isArray(picks)) {
      console.error('Picks is not an array:', picks);
      return false;
    }
    const isPicked = picks.some(pick => pick.driverId === driverId);
    console.log(`Checking if driver ${driverId} is picked:`, isPicked);
    return isPicked;
  } catch (error) {
    console.error('Error checking if driver is picked:', error);
    return false;
  }
}

// Clear all pick data (e.g., for a new season)
function clearPickData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PICKS);
    return true;
  } catch (error) {
    console.error('Failed to clear pick data:', error);
    return false;
  }
}

// Get current race pick
function getCurrentRacePick() {
  try {
    const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
    if (!raceData) {
      return null;
    }
    
    const picks = loadUserPicks();
    return picks.find(pick => pick.raceId === raceData.raceId) || null;
  } catch (error) {
    console.error('Failed to get current race pick:', error);
    return null;
  }
}

// Add test data function
export function addTestPreviousRacePicks() {
    try {
        // Load existing picks
        const existingData = localStorage.getItem('f1survivor_user_picks');
        const userData = existingData ? JSON.parse(existingData) : {
            userId: 'local-user',
            currentSeason: '2025',
            picks: []
        };

        // Add simulated picks for previous races
        const previousPicks = [
            {
                raceId: 'bhr-2025',  // Bahrain
                driverId: 1,         // Max Verstappen
                driverName: 'Max Verstappen',
                teamName: 'Red Bull Racing',
                timestamp: '2025-03-02T12:00:00.000Z',
                isAutoPick: false
            },
            {
                raceId: 'sau-2025',  // Saudi Arabia
                driverId: 7,         // Lando Norris
                driverName: 'Lando Norris',
                teamName: 'McLaren',
                timestamp: '2025-03-09T12:00:00.000Z',
                isAutoPick: false
            }
        ];

        // Add the previous picks to the picks array
        userData.picks = [...previousPicks, ...userData.picks];

        // Save back to localStorage
        localStorage.setItem('f1survivor_user_picks', JSON.stringify(userData));
        console.log('Test previous race picks added successfully');
        return true;
    } catch (error) {
        console.error('Failed to add test previous race picks:', error);
        return false;
    }
}

export {
  STORAGE_KEYS,
  saveUserPicks,
  loadUserPicks,
  isDriverAlreadyPicked,
  clearPickData,
  getCurrentSeason,
  getCurrentRacePick
}; 