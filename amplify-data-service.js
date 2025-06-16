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
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const userId = user.userId || user.username;
    
    const league = await this.client.models.League.create({
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

    return league.data;
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

  // ============================================================================
  // MULTI-LEAGUE OPTIMIZATION METHODS
  // ============================================================================

  /**
   * Get leagues with cached data for better performance
   * @returns {Promise<Array>} User leagues with cached member and pick data
   */
  async getUserLeaguesWithCache() {
    const user = await authManager.getCurrentUser();
    if (!user) return [];

    try {
      // Get basic league memberships
      const leagues = await this.getUserLeagues();
      
      // Batch load additional data for all leagues
      const leagueIds = leagues.map(l => l.leagueId);
      const [memberData, pickData] = await Promise.all([
        this.batchGetLeagueMembers(leagueIds),
        this.batchGetLeaguePicks(leagueIds)
      ]);

      // Combine and enhance league data
      return leagues.map(league => ({
        ...league,
        members: memberData[league.leagueId] || [],
        memberCount: (memberData[league.leagueId] || []).length,
        recentPicks: pickData[league.leagueId] || [],
        lastActivity: this.calculateLeagueLastActivity(
          memberData[league.leagueId] || [],
          pickData[league.leagueId] || []
        )
      }));
    } catch (error) {
      console.error('Failed to load leagues with cache:', error);
      return [];
    }
  }

  /**
   * Get pick history across ALL user leagues
   * @param {string|null} userId - User ID (null for current user)
   * @returns {Promise<Object>} Picks grouped by league
   */
  async getMultiLeaguePickHistory(userId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const targetUserId = userId || user.userId || user.username;

    try {
      // Get all user leagues first
      const leagues = await this.getUserLeagues();
      const leagueIds = leagues.map(l => l.leagueId);

      // Get picks for all leagues plus solo picks
      const [leaguePicks, soloPicks] = await Promise.all([
        this.batchGetUserPicksForLeagues(targetUserId, leagueIds),
        this.getUserPicks(targetUserId, null) // Solo picks (no league)
      ]);

      return {
        leaguePicks,
        soloPicks: this.transformPicksForUI(soloPicks),
        totalPicks: Object.values(leaguePicks).reduce((sum, picks) => sum + picks.length, 0) + soloPicks.length,
        leagueCount: leagueIds.length
      };
    } catch (error) {
      console.error('Failed to get multi-league pick history:', error);
      return {
        leaguePicks: {},
        soloPicks: [],
        totalPicks: 0,
        leagueCount: 0
      };
    }
  }

  /**
   * Calculate cross-league statistics for a user
   * @param {string|null} userId - User ID (null for current user)
   * @returns {Promise<Object>} Cross-league statistics
   */
  async getCrossLeagueStatistics(userId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const targetUserId = userId || user.userId || user.username;

    try {
      const pickHistory = await this.getMultiLeaguePickHistory(targetUserId);
      const leagues = await this.getUserLeagues();

      // Calculate statistics
      const stats = {
        totalLeagues: leagues.length,
        totalPicks: pickHistory.totalPicks,
        leagueStats: {},
        overallStats: {
          averagePicksPerLeague: 0,
          mostActiveLeague: null,
          oldestMembership: null,
          newestMembership: null,
          ownedLeagues: 0
        }
      };

      // Calculate per-league statistics
      for (const league of leagues) {
        const leaguePicks = pickHistory.leaguePicks[league.leagueId] || [];
        const membership = league.membershipData;

        stats.leagueStats[league.leagueId] = {
          leagueName: league.name,
          pickCount: leaguePicks.length,
          isOwner: membership?.isOwner || false,
          joinedAt: membership?.joinedAt,
          survivedRaces: membership?.survivedRaces || 0,
          totalPicks: membership?.totalPicks || 0,
          autoPickCount: membership?.autoPickCount || 0,
          memberCount: league.memberCount || 0
        };

        // Track owned leagues
        if (membership?.isOwner) {
          stats.overallStats.ownedLeagues++;
        }

        // Track oldest/newest memberships
        if (membership?.joinedAt) {
          const joinDate = new Date(membership.joinedAt);
          if (!stats.overallStats.oldestMembership || joinDate < new Date(stats.overallStats.oldestMembership.joinedAt)) {
            stats.overallStats.oldestMembership = {
              leagueId: league.leagueId,
              leagueName: league.name,
              joinedAt: membership.joinedAt
            };
          }
          if (!stats.overallStats.newestMembership || joinDate > new Date(stats.overallStats.newestMembership.joinedAt)) {
            stats.overallStats.newestMembership = {
              leagueId: league.leagueId,
              leagueName: league.name,
              joinedAt: membership.joinedAt
            };
          }
        }
      }

      // Calculate average picks per league
      if (leagues.length > 0) {
        const totalLeaguePicks = Object.values(pickHistory.leaguePicks).reduce((sum, picks) => sum + picks.length, 0);
        stats.overallStats.averagePicksPerLeague = Math.round(totalLeaguePicks / leagues.length);
      }

      // Find most active league
      const leaguePickCounts = Object.entries(stats.leagueStats).map(([leagueId, data]) => ({
        leagueId,
        ...data
      }));
      if (leaguePickCounts.length > 0) {
        stats.overallStats.mostActiveLeague = leaguePickCounts.sort((a, b) => b.pickCount - a.pickCount)[0];
      }

      return stats;
    } catch (error) {
      console.error('Failed to calculate cross-league statistics:', error);
      return {
        totalLeagues: 0,
        totalPicks: 0,
        leagueStats: {},
        overallStats: {
          averagePicksPerLeague: 0,
          mostActiveLeague: null,
          oldestMembership: null,
          newestMembership: null,
          ownedLeagues: 0
        }
      };
    }
  }

  /**
   * Check if driver is picked in ANY user league
   * @param {number} driverId - Driver ID to check
   * @returns {Promise<boolean>} True if driver picked in any league
   */
  async isDriverAlreadyPickedInAnyLeague(driverId) {
    const user = await authManager.getCurrentUser();
    if (!user) return false;

    try {
      const leagues = await this.getUserLeagues();
      
      for (const league of leagues) {
        const isPicked = await this.isDriverAlreadyPicked(driverId, league.leagueId);
        if (isPicked) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to check driver across leagues:', error);
      return false;
    }
  }

  /**
   * Batch get league members for multiple leagues
   * @param {Array<string>} leagueIds - Array of league IDs
   * @returns {Promise<Object>} Members data keyed by league ID
   */
  async batchGetLeagueMembers(leagueIds) {
    const memberPromises = leagueIds.map(async (leagueId) => {
      try {
        const members = await this.getLeagueMembers(leagueId);
        return { leagueId, members };
      } catch (error) {
        console.warn(`Failed to get members for league ${leagueId}:`, error);
        return { leagueId, members: [] };
      }
    });

    const results = await Promise.all(memberPromises);
    const memberData = {};
    
    results.forEach(({ leagueId, members }) => {
      memberData[leagueId] = members;
    });

    return memberData;
  }

  /**
   * Batch get league picks for multiple leagues
   * @param {Array<string>} leagueIds - Array of league IDs
   * @returns {Promise<Object>} Picks data keyed by league ID
   */
  async batchGetLeaguePicks(leagueIds) {
    const pickPromises = leagueIds.map(async (leagueId) => {
      try {
        const picks = await this.getUserPicks(null, leagueId);
        return { leagueId, picks: this.transformPicksForUI(picks) };
      } catch (error) {
        console.warn(`Failed to get picks for league ${leagueId}:`, error);
        return { leagueId, picks: [] };
      }
    });

    const results = await Promise.all(pickPromises);
    const pickData = {};
    
    results.forEach(({ leagueId, picks }) => {
      pickData[leagueId] = picks;
    });

    return pickData;
  }

  /**
   * Batch get user picks for multiple leagues
   * @param {string} userId - User ID
   * @param {Array<string>} leagueIds - Array of league IDs
   * @returns {Promise<Object>} User picks keyed by league ID
   */
  async batchGetUserPicksForLeagues(userId, leagueIds) {
    const pickPromises = leagueIds.map(async (leagueId) => {
      try {
        const picks = await this.getUserPicks(userId, leagueId);
        return { leagueId, picks: this.transformPicksForUI(picks) };
      } catch (error) {
        console.warn(`Failed to get user picks for league ${leagueId}:`, error);
        return { leagueId, picks: [] };
      }
    });

    const results = await Promise.all(pickPromises);
    const pickData = {};
    
    results.forEach(({ leagueId, picks }) => {
      pickData[leagueId] = picks;
    });

    return pickData;
  }

  /**
   * Batch load league data efficiently
   * @param {Array<string>} leagueIds - Array of league IDs
   * @returns {Promise<Array>} Array of league data
   */
  async batchGetLeagues(leagueIds) {
    const leaguePromises = leagueIds.map(async (leagueId) => {
      try {
        return await this.getLeague(leagueId);
      } catch (error) {
        console.warn(`Failed to get league ${leagueId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(leaguePromises);
    return results.filter(league => league !== null);
  }

  /**
   * Calculate last activity for a league
   * @param {Array} members - League members
   * @param {Array} picks - Recent picks
   * @returns {string|null} Last activity timestamp
   */
  calculateLeagueLastActivity(members, picks) {
    const memberTimes = members.map(m => m.joinedAt || m.lastActiveAt).filter(Boolean);
    const pickTimes = picks.map(p => p.timestamp || p.submittedAt).filter(Boolean);
    
    const allTimes = [...memberTimes, ...pickTimes];
    if (allTimes.length === 0) return null;
    
    return allTimes.sort().reverse()[0]; // Most recent timestamp
  }

  /**
   * Optimize batch operations for multi-league data loading
   * @returns {Promise<Object>} Complete multi-league data package
   */
  async batchGetUserLeagueData() {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      // Step 1: Get basic league memberships
      const leagues = await this.getUserLeagues();
      const leagueIds = leagues.map(l => l.leagueId);

      if (leagueIds.length === 0) {
        return {
          leagues: [],
          memberData: {},
          pickData: {},
          crossLeagueStats: await this.getCrossLeagueStatistics()
        };
      }

      // Step 2: Parallel fetch all additional data
      const [memberData, pickData, crossLeagueStats] = await Promise.all([
        this.batchGetLeagueMembers(leagueIds),
        this.batchGetLeaguePicks(leagueIds),
        this.getCrossLeagueStatistics()
      ]);

      // Step 3: Combine league data with additional information
      const enhancedLeagues = leagues.map(league => ({
        ...league,
        members: memberData[league.leagueId] || [],
        memberCount: (memberData[league.leagueId] || []).length,
        recentPicks: pickData[league.leagueId] || [],
        lastActivity: this.calculateLeagueLastActivity(
          memberData[league.leagueId] || [],
          pickData[league.leagueId] || []
        )
      }));

      return {
        leagues: enhancedLeagues,
        memberData,
        pickData,
        crossLeagueStats
      };
    } catch (error) {
      console.error('Failed to batch get user league data:', error);
      throw error;
    }
  }
}

export const amplifyDataService = new AmplifyDataService(); 