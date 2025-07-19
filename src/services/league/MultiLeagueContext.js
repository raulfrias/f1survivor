import { amplifyDataService } from '@/services/aws/AmplifyDataService.js';
import { authManager } from '@/services/auth/AuthManager.js';
import { leagueManager } from '@/services/league/LeagueManager.js';
import { leagueStorageManager } from '@/services/league/LeagueStorageManager.js';

/**
 * Multi-League Context Manager
 * Manages multiple leagues, caching, and context switching for optimal performance
 * Part of Phase 1: Multi-League Data Architecture
 */
export class MultiLeagueContext {
  constructor() {
    this.userLeagues = new Map(); // leagueId -> league data
    this.activeLeagueId = null;
    this.leagueCache = new Map(); // Performance optimization
    this.memberCache = new Map(); // Cache for league members
    this.pickCache = new Map(); // Cache for league picks
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastLoadTime = 0;
    this.loadingPromise = null; // Prevent concurrent loading
    this.eventListeners = new Set(); // For league change notifications
  }

  // Load all user leagues from AWS
  async loadUserLeagues(forceRefresh = false) {
    // Prevent concurrent loading
    if (this.loadingPromise && !forceRefresh) {
      return this.loadingPromise;
    }

    // Check cache validity
    if (!forceRefresh && this.isCacheValid()) {
      console.log('Using cached league data');
      return Array.from(this.userLeagues.values());
    }

    console.log('Loading user leagues from AWS...');
    this.loadingPromise = this._performLeagueLoad();
    
    try {
      const result = await this.loadingPromise;
      this.lastLoadTime = Date.now();
      return result;
    } finally {
      this.loadingPromise = null;
    }
  }

  async _performLeagueLoad() {
    const user = await authManager.getCurrentUser();
    if (!user) {
      console.log('No authenticated user, clearing league context');
      this.clearContext();
      return [];
    }

    try {
      const leagues = await amplifyDataService.getUserLeagues();
      
      // Store current state before clearing
      const currentLeagues = new Map(this.userLeagues);
      const currentCount = this.userLeagues.size;
      
      console.log(`Loaded ${leagues.length} leagues for user (previously had ${currentCount})`);
      
      // Only clear and repopulate if we got a reasonable result
      if (leagues.length > 0 || currentCount === 0) {
        // Clear existing data
        this.userLeagues.clear();
        
        // Populate leagues map
        for (const league of leagues) {
          this.userLeagues.set(league.leagueId, {
            ...league,
            lastAccessed: Date.now(),
            memberCount: league.memberCount || 0 // Use actual member count from AWS
          });
        }
        
        // Set default active league if none set
        if (!this.activeLeagueId && leagues.length > 0) {
          this.setActiveLeague(leagues[0].leagueId);
        }
      } else {
        // AWS returned 0 leagues but we had leagues before - likely consistency issue
        console.warn('AWS returned 0 leagues but we had leagues before. Keeping current context due to likely eventual consistency delay.');
        return Array.from(currentLeagues.values());
      }

      return leagues;
    } catch (error) {
      console.error('Failed to load user leagues:', error);
      // Don't clear context on AWS errors - preserve local state
      console.warn('Preserving local league context due to AWS error');
      return Array.from(this.userLeagues.values());
    }
  }

  // Check if cache is valid
  isCacheValid() {
    return (
      this.userLeagues.size > 0 &&
      this.lastLoadTime > 0 &&
      (Date.now() - this.lastLoadTime) < this.cacheTimeout
    );
  }

  // Get context for all leagues
  getMultiLeagueContext() {
    const userLeagueIds = Array.from(this.userLeagues.keys());
    const activeLeague = this.activeLeagueId ? this.userLeagues.get(this.activeLeagueId) : null;
    
    return {
      userLeagues: userLeagueIds,
      activeLeague: this.activeLeagueId,
      activeLeagueData: activeLeague,
      leagueCount: this.userLeagues.size,
      soloMode: this.userLeagues.size === 0,
      isMultiLeague: this.userLeagues.size > 1,
      hasLeagues: this.userLeagues.size > 0
    };
  }

  // Get context for currently active league
  getActiveLeagueContext() {
    if (!this.activeLeagueId) {
      return {
        isLeagueMode: false,
        leagueId: null,
        league: null,
        soloMode: true
      };
    }

    const league = this.userLeagues.get(this.activeLeagueId);
    return {
      isLeagueMode: true,
      leagueId: this.activeLeagueId,
      league: league,
      soloMode: false
    };
  }

  // Get all leagues context (for dashboard/UI)
  getAllLeaguesContext() {
    const leagues = Array.from(this.userLeagues.values());
    return {
      leagues: leagues,
      count: leagues.length,
      activeLeagueId: this.activeLeagueId
    };
  }

  // Switch active league
  setActiveLeague(leagueId) {
    if (!leagueId) {
      this.activeLeagueId = null;
      this.notifyLeagueChange(null);
      return;
    }

    if (this.userLeagues.has(leagueId)) {
      const previousLeagueId = this.activeLeagueId;
      this.activeLeagueId = leagueId;
      
      // Update last accessed time
      const league = this.userLeagues.get(leagueId);
      if (league) {
        league.lastAccessed = Date.now();
      }
      
      console.log(`Switched to league: ${leagueId}`);
      this.notifyLeagueChange(leagueId, previousLeagueId);
      return true;
    } else {
      console.warn(`⚠️ League ${leagueId} not found in user leagues (Available leagues: ${Array.from(this.userLeagues.keys()).join(', ') || 'none'})`);
      return false;
    }
  }

  // Add a new league to context (when user joins)
  addLeague(league) {
    this.userLeagues.set(league.leagueId, {
      ...league,
      lastAccessed: Date.now(),
      memberCount: league.memberCount || 1 // Default to 1 (at least the joining user)
    });
    
    // Set as active if it's the first league
    if (this.userLeagues.size === 1) {
      this.setActiveLeague(league.leagueId);
    }
    
    console.log(`Added league to context: ${league.name}`);
  }

  // Remove a league from context (when user leaves)
  removeLeague(leagueId) {
    if (this.userLeagues.has(leagueId)) {
      this.userLeagues.delete(leagueId);
      
      // Clear caches for this league
      this.memberCache.delete(leagueId);
      this.pickCache.delete(leagueId);
      
      // If this was the active league, switch to another or go solo
      if (this.activeLeagueId === leagueId) {
        const remainingLeagues = Array.from(this.userLeagues.keys());
        if (remainingLeagues.length > 0) {
          this.setActiveLeague(remainingLeagues[0]);
        } else {
          this.setActiveLeague(null); // Solo mode
        }
      }
      
      console.log(`Removed league from context: ${leagueId}`);
    }
  }

  // Get cached league members (with cache management)
  async getLeagueMembers(leagueId, useCache = true) {
    const cacheKey = `members_${leagueId}`;
    
    if (useCache && this.memberCache.has(cacheKey)) {
      const cached = this.memberCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const members = await amplifyDataService.getLeagueMembers(leagueId);
      
      // Update cache
      this.memberCache.set(cacheKey, {
        data: members,
        timestamp: Date.now()
      });
      
      // Update member count in league data
      const league = this.userLeagues.get(leagueId);
      if (league) {
        league.memberCount = members.length;
      }
      
      return members;
    } catch (error) {
      console.error(`Failed to load members for league ${leagueId}:`, error);
      return [];
    }
  }

  // Get cached league picks (with cache management)
  async getLeaguePicks(leagueId, userId = null, useCache = true) {
    const cacheKey = `picks_${leagueId}_${userId || 'all'}`;
    
    if (useCache && this.pickCache.has(cacheKey)) {
      const cached = this.pickCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const picks = await amplifyDataService.getUserPicks(userId, leagueId);
      
      // Update cache
      this.pickCache.set(cacheKey, {
        data: picks,
        timestamp: Date.now()
      });
      
      return picks;
    } catch (error) {
      console.error(`Failed to load picks for league ${leagueId}:`, error);
      return [];
    }
  }

  // Clear specific cache entries
  clearCache(type = null, leagueId = null) {
    if (type === 'members' && leagueId) {
      this.memberCache.delete(`members_${leagueId}`);
    } else if (type === 'picks' && leagueId) {
      // Clear all pick caches for this league
      for (const key of this.pickCache.keys()) {
        if (key.startsWith(`picks_${leagueId}_`)) {
          this.pickCache.delete(key);
        }
      }
    } else if (type === 'all') {
      this.memberCache.clear();
      this.pickCache.clear();
      this.leagueCache.clear();
    } else {
      // Clear expired caches
      this.clearExpiredCaches();
    }
  }

  // Clear expired cache entries
  clearExpiredCaches() {
    const now = Date.now();
    
    // Clear expired member caches
    for (const [key, cached] of this.memberCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.memberCache.delete(key);
      }
    }
    
    // Clear expired pick caches
    for (const [key, cached] of this.pickCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.pickCache.delete(key);
      }
    }
  }

  // Clear all context data
  clearContext() {
    this.userLeagues.clear();
    this.activeLeagueId = null;
    this.clearCache('all');
    this.lastLoadTime = 0;
    console.log('League context cleared');
  }

  // Refresh league data
  async refreshLeagues() {
    console.log('Refreshing league data...');
    this.clearCache('all');
    return this.loadUserLeagues(true);
  }

  // Event system for league changes
  addLeagueChangeListener(callback) {
    this.eventListeners.add(callback);
  }

  removeLeagueChangeListener(callback) {
    this.eventListeners.delete(callback);
  }

  notifyLeagueChange(newLeagueId, previousLeagueId = null) {
    const context = this.getActiveLeagueContext();
    
    for (const callback of this.eventListeners) {
      try {
        callback({
          type: 'league-change',
          newLeagueId,
          previousLeagueId,
          context,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error in league change listener:', error);
      }
    }
  }

  // Get league by ID
  getLeague(leagueId) {
    return this.userLeagues.get(leagueId) || null;
  }

  // Check if user is in specific league
  isInLeague(leagueId) {
    return this.userLeagues.has(leagueId);
  }

  // Get league statistics
  getLeagueStats() {
    const leagues = Array.from(this.userLeagues.values());
    
    return {
      totalLeagues: leagues.length,
      activeLeague: this.activeLeagueId,
      recentlyAccessed: leagues
        .sort((a, b) => b.lastAccessed - a.lastAccessed)
        .slice(0, 3)
        .map(l => ({ leagueId: l.leagueId, name: l.name }))
    };
  }
}

// Create singleton instance
export const multiLeagueContext = new MultiLeagueContext(); 