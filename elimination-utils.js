// Elimination utilities for league competition calculations

/**
 * Calculate danger level based on user position in league
 * @param {Object} userStatus - User's current league status
 * @returns {Object} Danger level with styling and messaging
 */
export function calculateDangerLevel(userStatus) {
  const { percentile, remainingDrivers, currentRank, activePlayers } = userStatus;
  const topDriversLeft = remainingDrivers?.filter(d => d.avgPosition <= 5).length || 0;
  
  if (percentile <= 33) {
    return { 
      level: 'SAFE', 
      class: 'ez-safe',
      message: 'Comfortable position',
      color: '#4caf50',
      icon: '✅'
    };
  } else if (percentile <= 66) {
    return { 
      level: 'CAUTION', 
      class: 'ez-caution',
      message: 'Mid-pack pressure',
      color: '#ff9800',
      icon: '⚠️'
    };
  } else if (percentile <= 80) {
    return { 
      level: 'DANGER', 
      class: 'ez-danger',
      message: 'Elimination risk high',
      color: '#f44336',
      icon: '🔥'
    };
  } else {
    return { 
      level: 'CRITICAL', 
      class: 'ez-critical',
      message: 'Next elimination likely',
      color: '#d32f2f',
      icon: '💀',
      pulse: true
    };
  }
}

/**
 * Calculate survival probability based on multiple factors
 * @param {Object} userStatus - User's current status
 * @param {Object} leagueData - League information
 * @returns {number} Survival probability (0-1)
 */
export function calculateSurvivalProbability(userStatus, leagueData) {
  const { remainingDrivers, currentRank, safePicks, totalPicks } = userStatus;
  const { activePlayers, totalRaces, eliminatedPlayers } = leagueData;
  
  if (!remainingDrivers || remainingDrivers.length === 0) return 0.05;
  
  // Calculate average quality of remaining drivers (lower avg position = better)
  const avgDriverQuality = remainingDrivers.reduce((sum, d) => 
    sum + (11 - Math.min(d.avgPosition, 10)), 0) / remainingDrivers.length;
  
  // Position factor (higher rank = better survival chance)
  const positionFactor = (activePlayers - currentRank + 1) / activePlayers;
  
  // Performance factor (higher success rate = better chance)
  const performanceFactor = totalPicks > 0 ? safePicks / totalPicks : 0.5;
  
  // Remaining races factor (more races = more risk)
  const completedRaces = totalPicks;
  const racesLeft = Math.max(totalRaces - completedRaces, 1);
  const racesFactor = Math.max(0.3, 1 - (racesLeft / totalRaces) * 0.3);
  
  // League competition factor (fewer players = higher individual survival chance)
  const competitionFactor = Math.min(1, 20 / activePlayers);
  
  // Weighted calculation
  const probability = (
    (avgDriverQuality / 10) * 0.35 +
    positionFactor * 0.25 +
    performanceFactor * 0.25 +
    racesFactor * 0.10 +
    competitionFactor * 0.05
  );
  
  return Math.min(Math.max(probability, 0.05), 0.95); // Cap between 5-95%
}

/**
 * Format elimination data for display
 * @param {Array} eliminations - Array of elimination objects
 * @param {string} currentUserId - Current user's ID for highlighting
 * @returns {Array} Formatted elimination data
 */
export function formatEliminations(eliminations, currentUserId) {
  return eliminations.map(e => ({
    username: e.username,
    driverName: e.pick.driverName,
    position: e.pick.finalPosition === 'DNF' ? 'DNF' : `P${e.pick.finalPosition}`,
    team: e.pick.team,
    isYou: e.userId === currentUserId,
    pickRisk: e.pick.finalPosition > 15 ? 'HIGH' : e.pick.finalPosition > 10 ? 'MEDIUM' : 'LOW'
  }));
}

/**
 * Get elimination forecast for upcoming race
 * @param {Object} leagueData - League information
 * @param {Object} upcomingRace - Next race data
 * @returns {Object} Elimination forecast
 */
export function getEliminationForecast(leagueData, upcomingRace) {
  const { activePlayers, eliminatedPlayers, totalPlayers } = leagueData;
  const completedRaces = eliminatedPlayers > 0 ? Math.ceil(eliminatedPlayers / 2) : 1; // Rough estimate
  
  if (completedRaces === 0) {
    return {
      min: 1,
      max: 3,
      likely: 2,
      message: "First race eliminations typically moderate"
    };
  }
  
  const historicalRate = eliminatedPlayers / completedRaces;
  
  // Increase elimination rate as season progresses (more pressure)
  const seasonProgress = completedRaces / 24; // Assuming 24 race season
  const progressionFactor = 1 + (seasonProgress * 0.5);
  
  // Adjust for remaining player count (fewer players = fewer eliminations)
  const playerFactor = Math.min(1, activePlayers / 15);
  
  const estimatedEliminations = Math.round(
    historicalRate * progressionFactor * playerFactor
  );
  
  const forecast = {
    min: Math.max(0, estimatedEliminations - 1),
    max: estimatedEliminations + 2,
    likely: Math.max(1, estimatedEliminations)
  };
  
  // Add contextual message
  if (forecast.likely >= activePlayers * 0.3) {
    forecast.message = "High elimination race expected";
  } else if (forecast.likely >= activePlayers * 0.15) {
    forecast.message = "Moderate eliminations likely";
  } else {
    forecast.message = "Few eliminations expected";
  }
  
  return forecast;
}

/**
 * Calculate league standings with additional metrics
 * @param {Array} players - Array of player objects
 * @param {string} currentUserId - Current user's ID
 * @returns {Array} Enhanced standings data
 */
export function calculateLeagueStandings(players, currentUserId) {
  // Sort by survival status, then by performance metrics
  const standings = players
    .map(player => ({
      ...player,
      isCurrentUser: player.userId === currentUserId,
      survivalRate: player.totalPicks > 0 ? player.safePicks / player.totalPicks : 0,
      avgPosition: player.avgFinishPosition || 8.5,
      riskLevel: calculatePlayerRiskLevel(player)
    }))
    .sort((a, b) => {
      // First sort by elimination status
      if (a.status !== b.status) {
        return a.status === 'ACTIVE' ? -1 : 1;
      }
      
      // Then by survival rate
      if (Math.abs(a.survivalRate - b.survivalRate) > 0.1) {
        return b.survivalRate - a.survivalRate;
      }
      
      // Then by average position
      return a.avgPosition - b.avgPosition;
    })
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  
  return standings;
}

/**
 * Calculate risk level for a player
 * @param {Object} player - Player object
 * @returns {string} Risk level
 */
function calculatePlayerRiskLevel(player) {
  const { remainingDrivers, currentRank, activePlayers } = player;
  
  if (!remainingDrivers) return 'UNKNOWN';
  
  const topDriversLeft = remainingDrivers.filter(d => d.avgPosition <= 5).length;
  const percentile = (currentRank / activePlayers) * 100;
  
  if (percentile <= 33 && topDriversLeft >= 3) return 'LOW';
  if (percentile <= 66 && topDriversLeft >= 2) return 'MEDIUM';
  if (percentile <= 80) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Generate strategic recommendations based on user status
 * @param {Object} userStatus - User's current status
 * @param {Object} leagueData - League information
 * @returns {Array} Array of recommendation strings
 */
export function generateStrategicRecommendations(userStatus, leagueData) {
  const { remainingDrivers, currentRank, activePlayers, percentile } = userStatus;
  const recommendations = [];
  
  const topDriversLeft = remainingDrivers?.filter(d => d.avgPosition <= 5).length || 0;
  const midDriversLeft = remainingDrivers?.filter(d => d.avgPosition > 5 && d.avgPosition <= 8).length || 0;
  
  // Position-based recommendations
  if (percentile > 80) {
    recommendations.push("🚨 URGENT: Consider using your best remaining driver");
    if (topDriversLeft > 0) {
      recommendations.push("💎 You still have top-tier drivers available");
    }
  } else if (percentile > 66) {
    recommendations.push("⚠️ Play it safe: Avoid risky driver choices");
    recommendations.push("📊 Monitor other players' remaining drivers");
  } else {
    recommendations.push("✅ Good position: You can afford calculated risks");
  }
  
  // Driver portfolio recommendations
  if (topDriversLeft === 0) {
    recommendations.push("🎯 Focus on consistent mid-field drivers");
  } else if (topDriversLeft === 1) {
    recommendations.push("💰 Save your last top driver for crucial moments");
  } else if (topDriversLeft >= 3) {
    recommendations.push("🏆 Strong driver portfolio - use strategically");
  }
  
  // League-specific recommendations
  if (activePlayers <= 5) {
    recommendations.push("🏁 Final stages: Every pick is critical");
  } else if (activePlayers <= 10) {
    recommendations.push("🔥 Heating up: Competition intensifying");
  }
  
  return recommendations.slice(0, 3); // Limit to top 3 recommendations
}

/**
 * Create mock league data for testing/demo purposes
 * @param {string} userId - Current user's ID
 * @returns {Object} Mock league data
 */
export function createMockLeagueData(userId = 'user123') {
  return {
    leagueData: {
      leagueId: "league-demo",
      leagueName: "Speed Demons",
      season: "2025",
      totalPlayers: 18,
      activePlayers: 15,
      eliminatedPlayers: 3,
      lastProcessedRace: {
        raceId: "sau-2025",
        raceName: "Saudi Arabian GP",
        processedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: "FINAL"
      }
    },
    userStatus: {
      userId: userId,
      username: "YOU",
      leagueId: "league-demo",
      status: "ACTIVE",
      currentRank: 11,
      percentile: 73,
      totalPicks: 2,
      safePicks: 1,
      riskyPicks: 1,
      eliminationRace: null,
      remainingDrivers: [
        { driverId: 14, name: "Alonso", avgPosition: 8.5 },
        { driverId: 63, name: "Russell", avgPosition: 5.2 },
        { driverId: 44, name: "Hamilton", avgPosition: 4.8 },
        { driverId: 16, name: "Leclerc", avgPosition: 6.1 },
        { driverId: 55, name: "Sainz", avgPosition: 7.3 },
        { driverId: 81, name: "Piastri", avgPosition: 8.9 },
        { driverId: 18, name: "Stroll", avgPosition: 11.2 },
        { driverId: 27, name: "Hulkenberg", avgPosition: 12.1 },
        { driverId: 20, name: "Magnussen", avgPosition: 13.4 },
        { driverId: 2, name: "Sargeant", avgPosition: 16.8 },
        { driverId: 77, name: "Bottas", avgPosition: 14.2 },
        { driverId: 24, name: "Zhou", avgPosition: 15.1 }
      ],
      survivalProbability: 0.72
    },
    eliminations: [
      {
        userId: "user456",
        username: "TurboTom",
        pick: {
          driverId: 20,
          driverName: "Kevin Magnussen",
          finalPosition: 14,
          team: "Haas"
        }
      },
      {
        userId: "user789",
        username: "RacerSarah",
        pick: {
          driverId: 2,
          driverName: "Logan Sargeant",
          finalPosition: 16,
          team: "Williams"
        }
      },
      {
        userId: "user101",
        username: "GridMaster",
        pick: {
          driverId: 24,
          driverName: "Zhou Guanyu",
          finalPosition: "DNF",
          team: "Kick Sauber"
        }
      }
    ],
    standings: [
      { userId: "user999", username: "AlphaDriver", rank: 1, safePicks: 2, totalPicks: 2, status: "ACTIVE" },
      { userId: "user888", username: "F1Prophet", rank: 2, safePicks: 2, totalPicks: 2, status: "ACTIVE" },
      { userId: "user777", username: "GridWarrior", rank: 3, safePicks: 2, totalPicks: 2, status: "ACTIVE" },
      { userId: "user666", username: "SpeedKing", rank: 4, safePicks: 1, totalPicks: 2, status: "ACTIVE" },
      { userId: "user555", username: "RaceAce", rank: 5, safePicks: 1, totalPicks: 2, status: "ACTIVE" },
      { userId: userId, username: "YOU", rank: 11, safePicks: 1, totalPicks: 2, status: "ACTIVE" }
    ]
  };
} 