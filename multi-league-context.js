import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';

/**
 * Multi-League Context Manager
 * Manages multiple leagues for a user, replaces single-league limitations
 * with comprehensive multi-league support
 */
export class MultiLeagueContext {
  constructor() {
    this.userLeagues = new Map(); // leagueId -> league data
    this.activeLeagueId = null;
    this.leagueCache = new Map(); // Performance optimization cache
    this.lastCacheUpdate = new Map(); // Track cache timestamps
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
    this.eventListeners = new Set(); // Event listeners for league changes
  }

  /**
   * Initialize the multi-league system
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.loadUserLeagues();
      this.setupActiveLeague();
      console.log(`Multi-league system initialized with ${this.userLeagues.size} leagues`);
    } catch (error) {
      console.error('Failed to initialize multi-league system:', error);
      throw error;
    }
  }

  /**
   * Load all user leagues from AWS backend
   * @returns {Promise<void>}
   */
  async loadUserLeagues() {
    const user = await authManager.getCurrentUser();
    if (!user) {
      console.log('No authenticated user, skipping league loading');
      return;
    }

    try {
      // Get leagues from AWS backend
      const leagues = await amplifyDataService.getUserLeagues();
      
      // Clear existing leagues
      this.userLeagues.clear();
      
      // Populate league map with enhanced data
      for (const league of leagues) {
        const enhancedLeague = await this.enhanceLeagueData(league);
        this.userLeagues.set(league.leagueId, enhancedLeague);
        
        // Cache the league data
        this.leagueCache.set(league.leagueId, enhancedLeague);
        this.lastCacheUpdate.set(league.leagueId, Date.now());
      }

      console.log(`Loaded ${leagues.length} leagues for user`);
    } catch (error) {
      console.error('Failed to load user leagues:', error);
      throw error;
    }
  }

  /**
   * Enhance league data with additional information
   * @param {Object} league - Base league data
   * @returns {Promise<Object>} Enhanced league data
   */
  async enhanceLeagueData(league) {
    try {
      // Get league members
      const members = await amplifyDataService.getLeagueMembers(league.leagueId);
      
      // Get recent picks for league context
      const recentPicks = await amplifyDataService.getUserPicks(null, league.leagueId);
      
      return {
        ...league,
        memberCount: members.length,
        members: members,
        recentPickCount: recentPicks.length,
        lastActivity: this.calculateLastActivity(members, recentPicks),
        isOwner: this.isLeagueOwner(league),
        canManage: this.canManageLeague(league)
      };
    } catch (error) {
      console.warn(`Failed to enhance league data for ${league.leagueId}:`, error);
      return {
        ...league,
        memberCount: 0,
        members: [],
        recentPickCount: 0,
        lastActivity: null,
        isOwner: false,
        canManage: false
      };
    }
  }

  /**
   * Calculate last activity timestamp for a league
   * @param {Array} members - League members
   * @param {Array} picks - Recent picks
   * @returns {string|null} Last activity timestamp
   */
  calculateLastActivity(members, picks) {
    const memberTimes = members.map(m => m.joinedAt || m.lastActiveAt).filter(Boolean);
    const pickTimes = picks.map(p => p.submittedAt || p.timestamp).filter(Boolean);
    
    const allTimes = [...memberTimes, ...pickTimes];
    if (allTimes.length === 0) return null;
    
    return allTimes.sort().reverse()[0]; // Most recent timestamp
  }

  /**
   * Check if current user is owner of the league
   * @param {Object} league - League data
   * @returns {boolean}
   */
  isLeagueOwner(league) {
    const user = authManager.getCurrentUserSync();
    return user && (user.userId === league.ownerId || user.username === league.ownerId);
  }

  /**
   * Check if current user can manage the league
   * @param {Object} league - League data
   * @returns {boolean}
   */
  canManageLeague(league) {
    return this.isLeagueOwner(league); // Currently only owners can manage
  }

  /**
   * Setup active league based on stored preferences or defaults
   */
  setupActiveLeague() {
    // Try to restore active league from localStorage
    const storedActiveLeague = localStorage.getItem('activeLeagueId');
    
    if (storedActiveLeague && this.userLeagues.has(storedActiveLeague)) {
      this.activeLeagueId = storedActiveLeague;
    } else if (this.userLeagues.size > 0) {
      // Default to first league if no stored preference
      this.activeLeagueId = Array.from(this.userLeagues.keys())[0];
      this.persistActiveLeague();
    } else {
      this.activeLeagueId = null;
    }
  }

  /**
   * Get comprehensive multi-league context
   * @returns {Object} Multi-league context information
   */
  getMultiLeagueContext() {
    const userLeagueIds = Array.from(this.userLeagues.keys());
    const activeLeague = this.activeLeagueId ? this.userLeagues.get(this.activeLeagueId) : null;
    
    return {
      userLeagues: userLeagueIds,
      activeLeague: this.activeLeagueId,
      activeLeagueData: activeLeague,
      leagueCount: this.userLeagues.size,
      soloMode: this.userLeagues.size === 0,
      leagues: Array.from(this.userLeagues.values()),
      hasMultipleLeagues: this.userLeagues.size > 1,
      canCreateLeagues: true // Always allow league creation
    };
  }

  /**
   * Get context for currently active league
   * @returns {Object|null} Active league context
   */
  getActiveLeagueContext() {
    if (!this.activeLeagueId || !this.userLeagues.has(this.activeLeagueId)) {
      return null;
    }

    const league = this.userLeagues.get(this.activeLeagueId);
    return {
      isLeagueMode: true,
      leagueId: this.activeLeagueId,
      league: league,
      canManage: league.canManage,
      isOwner: league.isOwner
    };
  }

  /**
   * Get context for all user leagues
   * @returns {Array} Array of all league contexts
   */
  getAllLeaguesContext() {
    return Array.from(this.userLeagues.entries()).map(([leagueId, league]) => ({
      leagueId,
      league,
      isActive: leagueId === this.activeLeagueId,
      canManage: league.canManage,
      isOwner: league.isOwner
    }));
  }

  /**
   * Switch active league
   * @param {string} leagueId - League ID to switch to
   * @returns {boolean} Success status
   */
  setActiveLeague(leagueId) {
    if (!leagueId) {
      this.activeLeagueId = null;
      this.persistActiveLeague();
      this.notifyLeagueChange(null);
      return true;
    }

    if (this.userLeagues.has(leagueId)) {
      const previousLeagueId = this.activeLeagueId;
      this.activeLeagueId = leagueId;
      this.persistActiveLeague();
      this.notifyLeagueChange(leagueId, previousLeagueId);
      console.log(`Switched to league: ${this.userLeagues.get(leagueId).name}`);
      return true;
    } else {
      console.error(`League ${leagueId} not found in user leagues`);
      return false;
    }
  }

  /**
   * Add a new league to user's collection
   * @param {Object} league - League data
   */
  async addLeague(league) {
    const enhancedLeague = await this.enhanceLeagueData(league);
    this.userLeagues.set(league.leagueId, enhancedLeague);
    
    // Cache the new league
    this.leagueCache.set(league.leagueId, enhancedLeague);
    this.lastCacheUpdate.set(league.leagueId, Date.now());
    
    // If this is the first league, make it active
    if (this.userLeagues.size === 1) {
      this.setActiveLeague(league.leagueId);
    }
    
    this.notifyLeagueListChange();
  }

  /**
   * Remove a league from user's collection
   * @param {string} leagueId - League ID to remove
   */
  removeLeague(leagueId) {
    if (this.userLeagues.has(leagueId)) {
      this.userLeagues.delete(leagueId);
      this.leagueCache.delete(leagueId);
      this.lastCacheUpdate.delete(leagueId);
      
      // If this was the active league, switch to another
      if (this.activeLeagueId === leagueId) {
        const remainingLeagues = Array.from(this.userLeagues.keys());
        this.setActiveLeague(remainingLeagues.length > 0 ? remainingLeagues[0] : null);
      }
      
      this.notifyLeagueListChange();
    }
  }

  /**
   * Refresh league data from backend
   * @param {string} leagueId - Specific league to refresh, or null for all
   */
  async refreshLeagueData(leagueId = null) {
    if (leagueId) {
      // Refresh specific league
      if (this.userLeagues.has(leagueId)) {
        try {
          const league = await amplifyDataService.getLeague(leagueId);
          const enhancedLeague = await this.enhanceLeagueData(league);
          this.userLeagues.set(leagueId, enhancedLeague);
          this.leagueCache.set(leagueId, enhancedLeague);
          this.lastCacheUpdate.set(leagueId, Date.now());
        } catch (error) {
          console.error(`Failed to refresh league ${leagueId}:`, error);
        }
      }
    } else {
      // Refresh all leagues
      await this.loadUserLeagues();
    }
    
    this.notifyLeagueListChange();
  }

  /**
   * Check if league data needs refresh based on cache timeout
   * @param {string} leagueId - League ID to check
   * @returns {boolean} True if refresh needed
   */
  needsRefresh(leagueId) {
    const lastUpdate = this.lastCacheUpdate.get(leagueId);
    return !lastUpdate || (Date.now() - lastUpdate) > this.cacheTimeout;
  }

  /**
   * Get league data with automatic cache refresh
   * @param {string} leagueId - League ID
   * @param {boolean} forceRefresh - Force refresh regardless of cache
   * @returns {Promise<Object|null>} League data
   */
  async getLeagueData(leagueId, forceRefresh = false) {
    if (!this.userLeagues.has(leagueId)) {
      return null;
    }

    if (forceRefresh || this.needsRefresh(leagueId)) {
      await this.refreshLeagueData(leagueId);
    }

    return this.userLeagues.get(leagueId);
  }

  /**
   * Persist active league to localStorage
   */
  persistActiveLeague() {
    if (this.activeLeagueId) {
      localStorage.setItem('activeLeagueId', this.activeLeagueId);
    } else {
      localStorage.removeItem('activeLeagueId');
    }
  }

  /**
   * Add event listener for league changes
   * @param {Function} listener - Event listener function
   */
  addEventListener(listener) {
    this.eventListeners.add(listener);
  }

  /**
   * Remove event listener
   * @param {Function} listener - Event listener function
   */
  removeEventListener(listener) {
    this.eventListeners.delete(listener);
  }

  /**
   * Notify listeners of league change
   * @param {string|null} newLeagueId - New active league ID
   * @param {string|null} previousLeagueId - Previous active league ID
   */
  notifyLeagueChange(newLeagueId, previousLeagueId = null) {
    const context = this.getActiveLeagueContext();
    this.eventListeners.forEach(listener => {
      try {
        listener('league-change', {
          newLeagueId,
          previousLeagueId,
          context,
          multiLeagueContext: this.getMultiLeagueContext()
        });
      } catch (error) {
        console.error('Error in league change listener:', error);
      }
    });
  }

  /**
   * Notify listeners of league list changes
   */
  notifyLeagueListChange() {
    const context = this.getMultiLeagueContext();
    this.eventListeners.forEach(listener => {
      try {
        listener('league-list-change', {
          context,
          leagueCount: this.userLeagues.size
        });
      } catch (error) {
        console.error('Error in league list change listener:', error);
      }
    });
  }

  /**
   * Get leagues by activity (most recently active first)
   * @returns {Array} Sorted leagues
   */
  getLeaguesByActivity() {
    return Array.from(this.userLeagues.values())
      .sort((a, b) => {
        const aTime = new Date(a.lastActivity || a.createdAt || 0);
        const bTime = new Date(b.lastActivity || b.createdAt || 0);
        return bTime - aTime; // Most recent first
      });
  }

  /**
   * Get leagues owned by current user
   * @returns {Array} Owned leagues
   */
  getOwnedLeagues() {
    return Array.from(this.userLeagues.values()).filter(league => league.isOwner);
  }

  /**
   * Get league statistics for dashboard
   * @returns {Object} League statistics
   */
  getLeagueStatistics() {
    const leagues = Array.from(this.userLeagues.values());
    
    return {
      totalLeagues: leagues.length,
      ownedLeagues: leagues.filter(l => l.isOwner).length,
      activeMemberships: leagues.filter(l => !l.isOwner).length,
      totalMembers: leagues.reduce((sum, l) => sum + l.memberCount, 0),
      averageMembersPerLeague: leagues.length > 0 ? Math.round(leagues.reduce((sum, l) => sum + l.memberCount, 0) / leagues.length) : 0,
      newestLeague: leagues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null,
      mostActiveLeague: leagues.sort((a, b) => (b.recentPickCount || 0) - (a.recentPickCount || 0))[0] || null
    };
  }
}

// Global instance
export const multiLeagueContext = new MultiLeagueContext();

// Export convenience functions for compatibility
export async function initializeMultiLeagueSystem() {
  await multiLeagueContext.initialize();
  return multiLeagueContext;
}

export function getMultiLeagueContext() {
  return multiLeagueContext.getMultiLeagueContext();
}

export function getActiveLeagueContext() {
  return multiLeagueContext.getActiveLeagueContext();
}

export function getAllLeaguesContext() {
  return multiLeagueContext.getAllLeaguesContext();
}

export function setActiveLeague(leagueId) {
  return multiLeagueContext.setActiveLeague(leagueId);
} 