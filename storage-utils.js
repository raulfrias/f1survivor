const STORAGE_KEYS = {
  USER_PICKS: 'f1survivor_user_picks',
  CURRENT_SEASON: 'f1survivor_season',
  USER_SETTINGS: 'f1survivor_settings'
};

// Save user picks to localStorage
function saveUserPicks(driverId) {
  try {
    // Load existing picks first
    const existingPicks = loadUserPicks();
    
    // Create new pick object
    const newPick = {
      driverId: driverId,
      timestamp: new Date().toISOString()
    };
    
    // Add new pick to existing picks
    existingPicks.push(newPick);
    
    const userPicksData = {
      userId: "local-user",
      currentSeason: getCurrentSeason(),
      picks: existingPicks
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_PICKS, JSON.stringify(userPicksData));
    console.log('Saved picks:', userPicksData);
    return true;
  } catch (error) {
    console.error('Failed to save picks to localStorage:', error);
    return false;
  }
}

// Load user picks from localStorage
function loadUserPicks() {
  try {
    const picksData = localStorage.getItem(STORAGE_KEYS.USER_PICKS);
    console.log('Raw picks data from localStorage:', picksData);
    
    if (!picksData) {
      console.log('No picks data found in localStorage');
      return [];
    }
    
    const userData = JSON.parse(picksData);
    console.log('Parsed user data:', userData);
    
    // Ensure we're only loading picks from the current season
    if (userData.currentSeason !== getCurrentSeason()) {
      console.log('Picks are from a different season, returning empty array');
      return [];
    }
    
    // Ensure picks is an array
    if (!userData.picks) {
      console.log('No picks array in user data, returning empty array');
      return [];
    }
    
    if (!Array.isArray(userData.picks)) {
      console.log('Picks is not an array, converting to array:', userData.picks);
      return [userData.picks];
    }
    
    console.log('Returning picks array:', userData.picks);
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

export {
  saveUserPicks,
  loadUserPicks,
  isDriverAlreadyPicked,
  clearPickData,
  getCurrentSeason
}; 