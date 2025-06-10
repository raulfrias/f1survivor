// Dashboard utilities for data processing and calculations

import { loadUserPicks, getCurrentSeason } from './storage-utils.js';
import { getPicksWithResults, isPlayerAlive, calculateSurvivalRate } from './race-results-api.js';

/**
 * Get all dashboard data
 * @returns {Promise<Object>} Complete dashboard data
 */
async function getDashboardData() {
  try {
    console.log('Loading dashboard data...');
    
    // Load user picks
    const userPicks = loadUserPicks();
    console.log('User picks loaded:', userPicks);
    
    // Get picks with race results and survival status
    const picksWithResults = await getPicksWithResults(userPicks);
    console.log('Picks with results:', picksWithResults);
    
    // Calculate dashboard statistics
    const stats = calculateDashboardStats(picksWithResults);
    
    // Get available drivers
    const availableDrivers = getAvailableDrivers(userPicks);
    
    // Get upcoming races
    const upcomingRaces = getUpcomingRaces();
    
    return {
      userPicks: picksWithResults,
      stats: stats,
      availableDrivers: availableDrivers,
      upcomingRaces: upcomingRaces
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
}

/**
 * Calculate dashboard statistics
 * @param {Array} picksWithResults - Array of picks with survival status
 * @returns {Object} Dashboard statistics
 */
function calculateDashboardStats(picksWithResults) {
  const totalDrivers = 20; // F1 grid size
  const totalRaces = 24; // 2025 season races
  
  const picksUsed = picksWithResults.length;
  const remainingDrivers = totalDrivers - picksUsed;
  
  const completedRaces = picksWithResults.filter(pick => 
    pick.survivalStatus && pick.survivalStatus.status !== 'PENDING'
  ).length;
  
  const playerAlive = isPlayerAlive(picksWithResults);
  const survivalRate = calculateSurvivalRate(picksWithResults);
  
  // Calculate season progress
  const seasonProgress = Math.round((completedRaces / totalRaces) * 100);
  
  return {
    picksUsed: picksUsed,
    totalDrivers: totalDrivers,
    remainingDrivers: remainingDrivers,
    racesCompleted: completedRaces,
    totalRaces: totalRaces,
    seasonProgress: seasonProgress,
    playerAlive: playerAlive,
    survivalRate: survivalRate,
    playerStatus: playerAlive ? 'ALIVE' : 'ELIMINATED'
  };
}

/**
 * Get available drivers (not yet picked)
 * @param {Array} userPicks - Array of user picks
 * @returns {Array} Array of available drivers
 */
function getAvailableDrivers(userPicks) {
  // F1 2025 driver lineup
  const allDrivers = [
    { driverId: 1, driverName: "Max Verstappen", teamName: "Red Bull Racing", number: 1 },
    { driverId: 11, driverName: "Sergio Perez", teamName: "Red Bull Racing", number: 11 },
    { driverId: 44, driverName: "Lewis Hamilton", teamName: "Mercedes", number: 44 },
    { driverId: 63, driverName: "George Russell", teamName: "Mercedes", number: 63 },
    { driverId: 16, driverName: "Charles Leclerc", teamName: "Ferrari", number: 16 },
    { driverId: 55, driverName: "Carlos Sainz", teamName: "Ferrari", number: 55 },
    { driverId: 4, driverName: "Lando Norris", teamName: "McLaren", number: 4 },
    { driverId: 81, driverName: "Oscar Piastri", teamName: "McLaren", number: 81 },
    { driverId: 14, driverName: "Fernando Alonso", teamName: "Aston Martin", number: 14 },
    { driverId: 18, driverName: "Lance Stroll", teamName: "Aston Martin", number: 18 },
    { driverId: 10, driverName: "Pierre Gasly", teamName: "Alpine", number: 10 },
    { driverId: 31, driverName: "Esteban Ocon", teamName: "Alpine", number: 31 },
    { driverId: 23, driverName: "Alexander Albon", teamName: "Williams", number: 23 },
    { driverId: 2, driverName: "Logan Sargeant", teamName: "Williams", number: 2 },
    { driverId: 27, driverName: "Nico Hulkenberg", teamName: "Haas", number: 27 },
    { driverId: 20, driverName: "Kevin Magnussen", teamName: "Haas", number: 20 },
    { driverId: 77, driverName: "Valtteri Bottas", teamName: "Kick Sauber", number: 77 },
    { driverId: 24, driverName: "Zhou Guanyu", teamName: "Kick Sauber", number: 24 },
    { driverId: 22, driverName: "Yuki Tsunoda", teamName: "RB", number: 22 },
    { driverId: 3, driverName: "Daniel Ricciardo", teamName: "RB", number: 3 }
  ];
  
  // Filter out already picked drivers
  const pickedDriverIds = userPicks.map(pick => pick.driverId);
  const availableDrivers = allDrivers.filter(driver => 
    !pickedDriverIds.includes(driver.driverId)
  );
  
  return availableDrivers;
}

/**
 * Get upcoming races
 * @returns {Array} Array of upcoming races
 */
function getUpcomingRaces() {
  // This would typically come from race-calendar-2025.js
  // For now, return a simplified list of upcoming races
  const currentDate = new Date();
  
  const upcomingRaces = [
    {
      raceId: 'aus-2025',
      raceName: 'Australian GP',
      location: 'Melbourne',
      date: '2025-03-16',
      raceDate: new Date('2025-03-16T05:00:00Z')
    },
    {
      raceId: 'jpn-2025',
      raceName: 'Japanese GP',
      location: 'Suzuka',
      date: '2025-04-06',
      raceDate: new Date('2025-04-06T05:00:00Z')
    },
    {
      raceId: 'chn-2025',
      raceName: 'Chinese GP',
      location: 'Shanghai',
      date: '2025-04-20',
      raceDate: new Date('2025-04-20T07:00:00Z')
    },
    {
      raceId: 'mia-2025',
      raceName: 'Miami GP',
      location: 'Miami',
      date: '2025-05-04',
      raceDate: new Date('2025-05-04T19:30:00Z')
    },
    {
      raceId: 'imo-2025',
      raceName: 'Emilia Romagna GP',
      location: 'Imola',
      date: '2025-05-18',
      raceDate: new Date('2025-05-18T13:00:00Z')
    }
  ];
  
  // Filter to only future races and add countdown
  return upcomingRaces
    .filter(race => race.raceDate > currentDate)
    .slice(0, 5) // Show next 5 races
    .map(race => ({
      ...race,
      countdown: calculateCountdown(race.raceDate)
    }));
}

/**
 * Calculate countdown to race
 * @param {Date} raceDate - The race date
 * @returns {string} Countdown string
 */
function calculateCountdown(raceDate) {
  const now = new Date();
  const timeDiff = raceDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return 'Race started';
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Get race name from race ID
 * @param {string} raceId - The race ID
 * @returns {string} Race name
 */
function getRaceName(raceId) {
  const raceNames = {
    'bhr-2025': 'Bahrain GP',
    'sau-2025': 'Saudi Arabian GP',
    'aus-2025': 'Australian GP',
    'jpn-2025': 'Japanese GP',
    'chn-2025': 'Chinese GP',
    'mia-2025': 'Miami GP',
    'imo-2025': 'Emilia Romagna GP',
    'mon-2025': 'Monaco GP',
    'esp-2025': 'Spanish GP',
    'can-2025': 'Canadian GP',
    'aut-2025': 'Austrian GP',
    'gbr-2025': 'British GP',
    'hun-2025': 'Hungarian GP',
    'bel-2025': 'Belgian GP',
    'ned-2025': 'Dutch GP',
    'ita-2025': 'Italian GP',
    'aze-2025': 'Azerbaijan GP',
    'sgp-2025': 'Singapore GP',
    'usa-2025': 'United States GP',
    'mex-2025': 'Mexican GP',
    'bra-2025': 'Brazilian GP',
    'las-2025': 'Las Vegas GP',
    'qat-2025': 'Qatar GP',
    'abu-2025': 'Abu Dhabi GP'
  };
  
  return raceNames[raceId] || raceId;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Add test data for dashboard demonstration
 */
function addTestDashboardData() {
  try {
    // Load existing picks
    const existingData = localStorage.getItem('f1survivor_user_picks');
    const userData = existingData ? JSON.parse(existingData) : {
      userId: 'local-user',
      currentSeason: '2025',
      picks: []
    };

    // Add simulated picks for previous races if none exist
    if (userData.picks.length === 0) {
      const testPicks = [
        {
          raceId: 'bhr-2025',
          driverId: 1,
          driverName: 'Max Verstappen',
          teamName: 'Red Bull Racing',
          timestamp: '2025-03-02T12:00:00.000Z',
          isAutoPick: false
        },
        {
          raceId: 'sau-2025',
          driverId: 4,
          driverName: 'Lando Norris',
          teamName: 'McLaren',
          timestamp: '2025-03-09T12:00:00.000Z',
          isAutoPick: false
        }
      ];

      userData.picks = testPicks;
      localStorage.setItem('f1survivor_user_picks', JSON.stringify(userData));
      console.log('Test dashboard data added successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to add test dashboard data:', error);
    return false;
  }
}

export {
  getDashboardData,
  calculateDashboardStats,
  getAvailableDrivers,
  getUpcomingRaces,
  getRaceName,
  formatDate,
  addTestDashboardData
}; 