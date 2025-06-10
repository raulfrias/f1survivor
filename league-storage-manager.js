import { 
  STORAGE_KEYS as BASE_STORAGE_KEYS,
  getCurrentSeason,
  loadUserPicks,
  saveUserPicks 
} from './storage-utils.js';

// Extended storage keys for league system
const LEAGUE_STORAGE_KEYS = {
  ...BASE_STORAGE_KEYS,
  USER_LEAGUES: 'f1survivor_user_leagues',
  LEAGUE_DATA: 'f1survivor_league_data',
  ACTIVE_LEAGUE: 'f1survivor_active_league',
  USER_ID: 'f1survivor_user_id',
  USER_NAME: 'f1survivor_user_name'
};

export class LeagueStorageManager {
  constructor() {
    this.STORAGE_KEYS = LEAGUE_STORAGE_KEYS;
    this.currentUserId = this.getCurrentUserId();
  }

  // User management
  getCurrentUserId() {
    let userId = localStorage.getItem(this.STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  }

  getCurrentUsername() {
    let username = localStorage.getItem(this.STORAGE_KEYS.USER_NAME);
    if (!username) {
      username = `Player${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem(this.STORAGE_KEYS.USER_NAME, username);
    }
    return username;
  }

  setUsername(username) {
    localStorage.setItem(this.STORAGE_KEYS.USER_NAME, username);
  }

  // League data management
  getAllLeagues() {
    try {
      const leaguesData = localStorage.getItem(this.STORAGE_KEYS.LEAGUE_DATA);
      return leaguesData ? JSON.parse(leaguesData) : {};
    } catch (error) {
      console.error('Failed to load leagues:', error);
      return {};
    }
  }

  getLeague(leagueId) {
    const leagues = this.getAllLeagues();
    return leagues[leagueId] || null;
  }

  saveLeague(league) {
    try {
      const leagues = this.getAllLeagues();
      leagues[league.leagueId] = league;
      localStorage.setItem(this.STORAGE_KEYS.LEAGUE_DATA, JSON.stringify(leagues));
      return true;
    } catch (error) {
      console.error('Failed to save league:', error);
      return false;
    }
  }

  // User league membership
  getUserLeagueData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.USER_LEAGUES);
      if (!data) {
        return {
          userId: this.currentUserId,
          currentSeason: getCurrentSeason(),
          activeLeagueId: null,
          leagues: [],
          createdLeagues: []
        };
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load user league data:', error);
      return {
        userId: this.currentUserId,
        currentSeason: getCurrentSeason(),
        activeLeagueId: null,
        leagues: [],
        createdLeagues: []
      };
    }
  }

  saveUserLeagueData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER_LEAGUES, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save user league data:', error);
      return false;
    }
  }

  addUserToLeague(leagueId, isOwner = false) {
    const userLeagueData = this.getUserLeagueData();
    
    if (!userLeagueData.leagues.includes(leagueId)) {
      userLeagueData.leagues.push(leagueId);
    }
    
    if (isOwner && !userLeagueData.createdLeagues.includes(leagueId)) {
      userLeagueData.createdLeagues.push(leagueId);
    }
    
    this.saveUserLeagueData(userLeagueData);
  }

  removeUserFromLeague(leagueId) {
    const userLeagueData = this.getUserLeagueData();
    
    userLeagueData.leagues = userLeagueData.leagues.filter(id => id !== leagueId);
    userLeagueData.createdLeagues = userLeagueData.createdLeagues.filter(id => id !== leagueId);
    
    if (userLeagueData.activeLeagueId === leagueId) {
      userLeagueData.activeLeagueId = null;
    }
    
    this.saveUserLeagueData(userLeagueData);
  }

  // Active league management
  getActiveLeagueId() {
    const userLeagueData = this.getUserLeagueData();
    return userLeagueData.activeLeagueId;
  }

  setActiveLeagueId(leagueId) {
    const userLeagueData = this.getUserLeagueData();
    userLeagueData.activeLeagueId = leagueId;
    this.saveUserLeagueData(userLeagueData);
  }

  getActiveLeague() {
    const activeLeagueId = this.getActiveLeagueId();
    return activeLeagueId ? this.getLeague(activeLeagueId) : null;
  }

  // Enhanced pick saving with league context
  saveUserPicksWithLeague(driverId, driverInfo, leagueId = null) {
    if (leagueId) {
      return this.saveLeaguePick(leagueId, driverId, driverInfo);
    } else {
      return saveUserPicks(driverId, driverInfo);
    }
  }

  saveLeaguePick(leagueId, driverId, driverInfo) {
    const league = this.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    const userId = this.getCurrentUserId();
    const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
    
    if (!raceData || !raceData.raceId) {
      throw new Error('No valid race data found. Cannot save pick.');
    }

    const newPick = {
      driverId: parseInt(driverId),
      timestamp: new Date().toISOString(),
      raceId: raceData.raceId,
      driverName: driverInfo?.driverName || null,
      teamName: driverInfo?.teamName || null,
      isAutoPick: driverInfo?.isAutoPick || false
    };

    // Initialize user picks array if needed
    if (!league.picks) {
      league.picks = {};
    }
    if (!league.picks[userId]) {
      league.picks[userId] = [];
    }

    // Update or add pick
    const existingPickIndex = league.picks[userId].findIndex(p => p.raceId === raceData.raceId);
    if (existingPickIndex !== -1) {
      league.picks[userId][existingPickIndex] = newPick;
    } else {
      league.picks[userId].push(newPick);
    }

    this.saveLeague(league);
    return newPick;
  }

  // Load picks with league context
  loadUserPicksWithLeague(leagueId = null) {
    if (leagueId) {
      return this.loadLeaguePicks(leagueId);
    } else {
      return loadUserPicks();
    }
  }

  loadLeaguePicks(leagueId, userId = null) {
    const league = this.getLeague(leagueId);
    if (!league) return [];

    const targetUserId = userId || this.getCurrentUserId();
    return league.picks && league.picks[targetUserId] ? league.picks[targetUserId] : [];
  }

  // Check if driver is already picked in league context
  isDriverAlreadyPickedInLeague(driverId, leagueId) {
    const picks = this.loadLeaguePicks(leagueId);
    return picks.some(pick => pick.driverId === parseInt(driverId));
  }

  // Get current race pick for league
  getCurrentRacePickForLeague(leagueId) {
    try {
      const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
      if (!raceData) {
        return null;
      }
      
      const picks = this.loadLeaguePicks(leagueId);
      return picks.find(pick => pick.raceId === raceData.raceId) || null;
    } catch (error) {
      console.error('Failed to get current race pick for league:', error);
      return null;
    }
  }

  // Get user's leagues
  getUserLeagues() {
    const userLeagueData = this.getUserLeagueData();
    const allLeagues = this.getAllLeagues();
    
    return userLeagueData.leagues
      .map(leagueId => allLeagues[leagueId])
      .filter(league => league !== null)
      .map(league => ({
        ...league,
        isOwner: league.ownerId === this.currentUserId
      }));
  }

  // Find league by invite code
  findLeagueByInviteCode(inviteCode) {
    const leagues = this.getAllLeagues();
    return Object.values(leagues).find(league => 
      league.inviteCode === inviteCode.toUpperCase()
    ) || null;
  }
}

// Export a singleton instance
export const leagueStorageManager = new LeagueStorageManager(); 