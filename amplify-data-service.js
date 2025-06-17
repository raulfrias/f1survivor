import { generateClient } from 'aws-amplify/data';
import { authManager } from './auth-manager.js';

export class AmplifyDataService {
  constructor() {
    this.client = generateClient();
    this.currentSeason = "season_2025"; // Use proper ID format
  }

  // Replace storage-utils.js - AUTH REQUIRED
  async getUserPicks(userId = null, leagueId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    // Use provided userId or current user's ID
    const targetUserId = userId || user.userId || user.username;

    const filter = {
      userId: { eq: targetUserId },
      seasonId: { eq: this.currentSeason }
    };
    
    if (leagueId) filter.leagueId = { eq: leagueId };

    const result = await this.client.models.DriverPick.list({
      filter,
      authMode: 'userPool'
    });
    
    return result.data || [];
  }

  // Save user pick with upsert logic (update if exists, create if not) - AUTH REQUIRED
  async saveUserPick(pickData) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const userId = user.userId || user.username;

    // Check if a pick already exists for this race
    const existingPick = await this.getCurrentRacePick(pickData.leagueId);
    
    if (existingPick) {
      // Update existing pick instead of creating duplicate
      console.log(`Updating existing pick for race ${pickData.raceId}: ${existingPick.driverName} → ${pickData.driverName}`);
      
      const updateData = {
        driverId: pickData.driverId.toString(),
        driverName: pickData.driverName,
        teamName: pickData.teamName,
        raceName: pickData.raceName || 'Unknown Race',
        submittedAt: new Date().toISOString(),
        isAutoPick: pickData.isAutoPick || false
      };

      // Use the existing pick's ID for the update
      return await this.client.models.DriverPick.update({
        id: existingPick.id,
        ...updateData
      }, {
        authMode: 'userPool'
      });
    } else {
      // Create new pick - no existing pick found
      console.log(`Creating new pick for race ${pickData.raceId}: ${pickData.driverName}`);
      
      // Generate unique pickId
      const pickId = `pick_${userId}_${pickData.raceId}_${Date.now()}`;

      // Prepare pick data - conditionally include leagueId for GSI compatibility
      const pickPayload = {
        pickId: pickId,
        userId: userId,
        seasonId: this.currentSeason,
        raceId: pickData.raceId,
        driverId: pickData.driverId.toString(),
        driverName: pickData.driverName,
        teamName: pickData.teamName,
        raceName: pickData.raceName || 'Unknown Race',
        submittedAt: new Date().toISOString(),
        pickDeadline: pickData.pickDeadline || new Date().toISOString(),
        isAutoPick: pickData.isAutoPick || false
      };

      // Only include leagueId if it's provided (GSI requires non-null values)
      if (pickData.leagueId) {
        pickPayload.leagueId = pickData.leagueId;
      }

      // Create pick directly in DynamoDB
      // Note: 'owner' field is automatically added by Amplify auth system
      return await this.client.models.DriverPick.create(pickPayload, {
        authMode: 'userPool'
      });
    }
  }

  // Check if driver is already picked - AUTH REQUIRED
  // Only checks PREVIOUS races, not current race (current race picks can be changed)
  async isDriverAlreadyPicked(driverId, leagueId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) return false; // Unauthenticated users have no picks

    const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
    const currentRaceId = raceData?.raceId;

    const picks = await this.getUserPicks(null, leagueId); // Use current user
    
    // Only check picks from PREVIOUS races, not current race
    const previousRacePicks = picks.filter(pick => pick.raceId !== currentRaceId);
    
    return previousRacePicks.some(pick => pick.driverId === driverId.toString());
  }

  // Get current race pick - AUTH REQUIRED
  async getCurrentRacePick(leagueId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) return null; // Unauthenticated users have no picks

    const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
    if (!raceData?.raceId) return null;

    const picks = await this.getUserPicks(null, leagueId); // Use current user
    const racePicks = picks.filter(pick => pick.raceId === raceData.raceId);
    
    if (racePicks.length === 0) return null;
    
    // If multiple picks for same race, clean them up automatically
    if (racePicks.length > 1) {
      console.warn(`Found ${racePicks.length} picks for race ${raceData.raceId}, cleaning up duplicates...`);
      const cleanupResult = await this.cleanupDuplicatePicksForRace(raceData.raceId);
      return cleanupResult.mostRecentPick;
    }
    
    return racePicks[0];
  }

  // Update an existing pick (for pick changes before deadline)
  async updateUserPick(pickId, updateData) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    return await this.client.models.DriverPick.update({
      id: pickId, // Use 'id' field for updates, not 'pickId'
      ...updateData,
      submittedAt: new Date().toISOString() // Update submission time
    }, {
      authMode: 'userPool'
    });
  }

  // Delete a pick (for cleanup)
  async deleteUserPick(pickId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    return await this.client.models.DriverPick.delete({
      id: pickId
    }, {
      authMode: 'userPool'
    });
  }

  // League operations - AUTH REQUIRED
  async createLeague(leagueData) {
    try {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const userId = user.userId || user.username;
      
      // Generate unique league ID
      const leagueId = `league_${userId}_${Date.now()}`;
    
    const league = await this.client.models.League.create({
        leagueId: leagueId,
      name: leagueData.name,
      inviteCode: leagueData.inviteCode,
      ownerId: userId,
      maxMembers: leagueData.maxMembers || 50,
      season: this.currentSeason,
      autoPickEnabled: leagueData.autoPickEnabled || true,
      isPrivate: leagueData.isPrivate || true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    }, {
      authMode: 'userPool'
    });

    // Add owner as member
    await this.client.models.LeagueMember.create({
      leagueId: league.data.leagueId,
      userId: userId,
      joinedAt: new Date().toISOString(),
      status: 'ACTIVE',
      isOwner: true,
      survivedRaces: 0,
      totalPicks: 0,
      autoPickCount: 0
    }, {
      authMode: 'userPool'
    });

      // Return formatted data for UI compatibility
      return {
        success: true,
        leagueId: league.data.leagueId,
        leagueName: league.data.name,
        inviteCode: league.data.inviteCode,
        ...league.data
      };
    } catch (error) {
      console.error('Create league error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create league'
      };
    }
  }

  async joinLeague(inviteCode) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    // Find league by invite code
    const leagueResult = await this.client.models.League.list({
      filter: {
        inviteCode: { eq: inviteCode },
        status: { eq: 'ACTIVE' }
      },
      authMode: 'userPool'
    });

    if (!leagueResult.data || leagueResult.data.length === 0) {
      throw new Error('League not found with this invite code');
    }

    const league = leagueResult.data[0];

    const userId = user.userId || user.username;

    // Check if user is already a member
    const memberResult = await this.client.models.LeagueMember.list({
      filter: {
        leagueId: { eq: league.leagueId },
        userId: { eq: userId }
      },
      authMode: 'userPool'
    });

    if (memberResult.data && memberResult.data.length > 0) {
      throw new Error('You are already a member of this league');
    }

    // Add as member
    await this.client.models.LeagueMember.create({
      leagueId: league.leagueId,
      userId: userId,
      joinedAt: new Date().toISOString(),
      status: 'ACTIVE',
      isOwner: false,
      survivedRaces: 0,
      totalPicks: 0,
      autoPickCount: 0
    }, {
      authMode: 'userPool'
    });

    return league;
  }

  async getLeague(leagueId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const result = await this.client.models.League.get({
      leagueId
    }, {
      authMode: 'userPool'
    });

    return result.data;
  }

  async getLeagueMembers(leagueId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const result = await this.client.models.LeagueMember.list({
      filter: {
        leagueId: { eq: leagueId }
      },
      authMode: 'userPool'
    });

    return result.data || [];
  }

  async getUserLeagues() {
    const user = await authManager.getCurrentUser();
    if (!user) return [];

    const userId = user.userId || user.username;

    const memberResult = await this.client.models.LeagueMember.list({
      filter: {
        userId: { eq: userId },
        status: { eq: 'ACTIVE' }
      },
      authMode: 'userPool'
    });

    if (!memberResult.data) return [];

    // Get league details for each membership
    const leagues = [];
    for (const membership of memberResult.data) {
      const league = await this.getLeague(membership.leagueId);
      if (league) {
        leagues.push({
          ...league,
          membershipData: membership
        });
      }
    }

    return leagues;
  }

  // Transform pick data to match expected format for existing components
  transformPickForUI(pick) {
    return {
      driverId: parseInt(pick.driverId),
      raceId: pick.raceId,
      timestamp: pick.submittedAt,
      driverName: pick.driverName,
      teamName: pick.teamName,
      isAutoPick: pick.isAutoPick || false,
      pickId: pick.id // Use 'id' field for updates (DynamoDB primary key)
    };
  }

  // Transform multiple picks for UI
  transformPicksForUI(picks) {
    return picks.map(pick => this.transformPickForUI(pick));
  }

  // TEST HELPER: Add a pick for a previous race (for testing previous race blocking)
  async addTestPreviousRacePick(driverId, driverName, teamName, raceId, raceName) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const pickId = `pick_${user.userId || user.username}_${raceId}_${Date.now()}`;

    const pickPayload = {
      pickId: pickId,
      userId: user.userId || user.username,
      seasonId: this.currentSeason,
      raceId: raceId,
      driverId: driverId.toString(),
      driverName: driverName,
      teamName: teamName,
      raceName: raceName,
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      pickDeadline: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      isAutoPick: false
    };

    return await this.client.models.DriverPick.create(pickPayload, {
      authMode: 'userPool'
    });
  }

  // Delete a user pick (for cleanup)
  async deleteUserPick(pickId) {
    return await this.client.models.DriverPick.delete({
      id: pickId
    }, {
      authMode: 'userPool'
    });
  }

  // Clean up duplicate picks for a race (keep only the most recent one)
  async cleanupDuplicatePicksForRace(raceId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const picks = await this.getUserPicks();
    const racePicks = picks.filter(pick => pick.raceId === raceId);
    
    if (racePicks.length <= 1) {
      console.log(`No duplicate picks found for race ${raceId}`);
      return { duplicatesRemoved: 0 };
    }

    // Sort by submission time (most recent first)
    racePicks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    // Keep the most recent pick, delete the rest
    const picksToDelete = racePicks.slice(1); // Skip the first (most recent) pick
    
    console.log(`Found ${racePicks.length} picks for race ${raceId}, keeping most recent, deleting ${picksToDelete.length} duplicates`);
    
    const deletionPromises = picksToDelete.map(pick => 
      this.client.models.DriverPick.delete({
        id: pick.id
      }, {
        authMode: 'userPool'
      })
    );

    await Promise.all(deletionPromises);
    
    console.log(`Successfully cleaned up ${picksToDelete.length} duplicate picks for race ${raceId}`);
    return { duplicatesRemoved: picksToDelete.length, mostRecentPick: racePicks[0] };
  }

  // Clean up all duplicate picks for the authenticated user (utility function)
  async cleanupAllDuplicatePicks() {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    console.log('🧹 Starting cleanup of all duplicate picks...');
    
    const picks = await this.getUserPicks();
    const raceGroups = {};
    
    // Group picks by race ID
    picks.forEach(pick => {
      if (!raceGroups[pick.raceId]) {
        raceGroups[pick.raceId] = [];
      }
      raceGroups[pick.raceId].push(pick);
    });

    let totalDuplicatesRemoved = 0;
    const cleanupResults = [];

    // Clean up each race that has duplicates
    for (const [raceId, racePicks] of Object.entries(raceGroups)) {
      if (racePicks.length > 1) {
        const result = await this.cleanupDuplicatePicksForRace(raceId);
        cleanupResults.push({ raceId, ...result });
        totalDuplicatesRemoved += result.duplicatesRemoved;
      }
    }

    console.log(`✅ Cleanup complete! Removed ${totalDuplicatesRemoved} duplicate picks across ${cleanupResults.length} races`);
    return {
      totalDuplicatesRemoved,
      racesWithDuplicates: cleanupResults.length,
      details: cleanupResults
    };
  }

  // PHASE 1: Multi-League Data Architecture - Enhanced Methods

  // Get user leagues with optimized caching
  async getUserLeaguesWithCache() {
    const user = await authManager.getCurrentUser();
    if (!user) return [];

    // Check if we have cached data that's less than 5 minutes old
    const cacheKey = 'userLeagues';
    const cached = this._getFromCache(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      console.log('Using cached user leagues');
      // Return the actual data array, not the cached object wrapper
      return Array.isArray(cached.data) ? cached.data : [];
    }

    const userId = user.userId || user.username;

    try {
      // Batch operation: Get memberships and league details in parallel
      const memberResult = await this.client.models.LeagueMember.list({
        filter: {
          userId: { eq: userId },
          status: { eq: 'ACTIVE' }
        },
        authMode: 'userPool'
      });

      if (!memberResult.data || memberResult.data.length === 0) {
        this._setCache(cacheKey, []);
        return [];
      }

      // Get all league details in parallel
      const leaguePromises = memberResult.data.map(membership => 
        this.getLeague(membership.leagueId).then(league => ({
          ...league,
          membershipData: membership
        }))
      );

      const leagues = await Promise.all(leaguePromises);
      const validLeagues = leagues.filter(league => league !== null);

      // Cache the result
      this._setCache(cacheKey, validLeagues);
      
      console.log(`Loaded ${validLeagues.length} leagues with cache optimization`);
      return validLeagues;
    } catch (error) {
      console.error('Failed to load user leagues with cache:', error);
      return [];
    }
  }

  // Get pick history across ALL user leagues
  async getMultiLeaguePickHistory(userId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) return { byLeague: {}, total: 0 };

    const targetUserId = userId || user.userId || user.username;

    try {
      // Get all user leagues first
      const leagues = await this.getUserLeaguesWithCache();
      
      // Ensure leagues is an array
      if (!Array.isArray(leagues)) {
        console.warn('getUserLeaguesWithCache did not return an array:', leagues);
        return { byLeague: {}, total: 0, soloMode: true, leagueCount: 0 };
      }
      
      if (leagues.length === 0) {
        return { byLeague: {}, total: 0, soloMode: true, leagueCount: 0 };
      }

      // Get picks for each league in parallel
      const pickPromises = leagues.map(league => 
        this.getUserPicks(targetUserId, league.leagueId).then(picks => ({
          leagueId: league.leagueId,
          leagueName: league.name,
          picks: picks
        }))
      );

      // Also get solo picks (picks without leagueId)
      const soloPicksPromise = this.getUserPicks(targetUserId, null);

      const [leaguePickResults, soloPicks] = await Promise.all([
        Promise.all(pickPromises),
        soloPicksPromise
      ]);

      // Organize results
      const byLeague = {};
      let totalPicks = 0;

      // Process league picks
      for (const result of leaguePickResults) {
        byLeague[result.leagueId] = {
          leagueName: result.leagueName,
          picks: result.picks,
          count: result.picks.length
        };
        totalPicks += result.picks.length;
      }

      // Add solo picks if any
      if (soloPicks.length > 0) {
        byLeague['solo'] = {
          leagueName: 'Solo Mode',
          picks: soloPicks,
          count: soloPicks.length
        };
        totalPicks += soloPicks.length;
      }

      console.log(`Retrieved ${totalPicks} picks across ${Object.keys(byLeague).length} contexts`);

      return {
        byLeague,
        total: totalPicks,
        leagueCount: leagues.length,
        hasMultipleContexts: Object.keys(byLeague).length > 1
      };
    } catch (error) {
      console.error('Failed to get multi-league pick history:', error);
      return { byLeague: {}, total: 0, leagueCount: 0, error: error.message };
    }
  }

  // Calculate cross-league statistics for user performance
  async getCrossLeagueStatistics(userId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) return null;

    const targetUserId = userId || user.userId || user.username;

    try {
      const pickHistory = await this.getMultiLeaguePickHistory(targetUserId);
      const leagues = await this.getUserLeaguesWithCache();

      const stats = {
        totalLeagues: leagues.length,
        totalPicks: pickHistory.total,
        leagueBreakdown: {},
        overallSurvivalRate: 0,
        bestLeaguePerformance: null,
        recentActivity: [],
        driverUsage: new Map()
      };

      // Calculate per-league statistics
      for (const [leagueId, leagueData] of Object.entries(pickHistory.byLeague)) {
        const picks = leagueData.picks;
        const raceCount = new Set(picks.map(p => p.raceId)).size;
        
        stats.leagueBreakdown[leagueId] = {
          leagueName: leagueData.leagueName,
          totalPicks: picks.length,
          raceCount: raceCount,
          autoPickCount: picks.filter(p => p.isAutoPick).length,
          recentPicks: picks
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .slice(0, 3)
        };

        // Track driver usage across leagues
        for (const pick of picks) {
          const count = stats.driverUsage.get(pick.driverName) || 0;
          stats.driverUsage.set(pick.driverName, count + 1);
        }
      }

      // Convert driver usage map to sorted array
      stats.mostUsedDrivers = Array.from(stats.driverUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([driver, count]) => ({ driver, count }));

      // Find best league performance (most races completed)
      const leaguePerformances = Object.values(stats.leagueBreakdown);
      if (leaguePerformances.length > 0) {
        stats.bestLeaguePerformance = leaguePerformances.reduce((best, current) => 
          current.raceCount > best.raceCount ? current : best
        );
      }

      // Calculate overall survival rate (simplified)
      if (stats.totalPicks > 0) {
        stats.overallSurvivalRate = Math.round(
          (stats.totalPicks / Math.max(leagues.length * 10, 1)) * 100
        ); // Rough estimate assuming ~10 races per season
      }

      console.log(`Calculated cross-league statistics for ${stats.totalLeagues} leagues, ${stats.totalPicks} total picks`);
      return stats;
    } catch (error) {
      console.error('Failed to calculate cross-league statistics:', error);
      return null;
    }
  }

  // Enhanced driver already picked check for multi-league context
  async isDriverAlreadyPickedInAnyLeague(driverId) {
    const user = await authManager.getCurrentUser();
    if (!user) return false;

    try {
      const leagues = await this.getUserLeaguesWithCache();
      
      // Ensure leagues is an array
      if (!Array.isArray(leagues)) {
        console.warn('getUserLeaguesWithCache did not return an array:', leagues);
        // Still check solo picks
        const pickedInSolo = await this.isDriverAlreadyPicked(driverId);
        if (pickedInSolo) {
          console.log(`Driver ${driverId} already picked in solo mode`);
          return { picked: true, leagueId: null, leagueName: 'Solo Mode' };
        }
        return { picked: false };
      }
      
      // Check driver usage across all user leagues
      for (const league of leagues) {
        const picked = await this.isDriverAlreadyPicked(driverId, league.leagueId);
        if (picked) {
          console.log(`Driver ${driverId} already picked in league: ${league.name}`);
          return { picked: true, leagueId: league.leagueId, leagueName: league.name };
        }
      }

      // Also check solo picks
      const pickedInSolo = await this.isDriverAlreadyPicked(driverId);
      if (pickedInSolo) {
        console.log(`Driver ${driverId} already picked in solo mode`);
        return { picked: true, leagueId: null, leagueName: 'Solo Mode' };
      }

      return { picked: false };
    } catch (error) {
      console.error('Failed to check driver across leagues:', error);
      return false;
    }
  }

  // Batch operations for better performance
  async batchGetLeagues(leagueIds) {
    const promises = leagueIds.map(id => this.getLeague(id));
    return Promise.all(promises);
  }

  async batchGetLeagueMembers(leagueIds) {
    const promises = leagueIds.map(id => this.getLeagueMembers(id));
    const results = await Promise.all(promises);
    
    // Return as map for easy lookup
    const memberMap = {};
    leagueIds.forEach((id, index) => {
      memberMap[id] = results[index];
    });
    return memberMap;
  }

  async batchGetRecentPicks(leagueIds, limit = 5) {
    const user = await authManager.getCurrentUser();
    if (!user) return {};

    const userId = user.userId || user.username;
    const promises = leagueIds.map(leagueId => 
      this.getUserPicks(userId, leagueId).then(picks => ({
        leagueId,
        picks: picks
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .slice(0, limit)
      }))
    );

    const results = await Promise.all(promises);
    
    // Return as map for easy lookup
    const pickMap = {};
    results.forEach(result => {
      pickMap[result.leagueId] = result.picks;
    });
    return pickMap;
  }

  // Cache management utilities
  _getFromCache(key) {
    const cached = localStorage.getItem(`amplify_cache_${key}`);
    return cached ? JSON.parse(cached) : null;
  }

  _setCache(key, data) {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`amplify_cache_${key}`, JSON.stringify(cacheData));
  }

  _clearCache(key = null) {
    if (key) {
      localStorage.removeItem(`amplify_cache_${key}`);
    } else {
      // Clear all amplify caches
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith('amplify_cache_')) {
          localStorage.removeItem(storageKey);
        }
      }
    }
  }
}

export const amplifyDataService = new AmplifyDataService(); 