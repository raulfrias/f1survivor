// ES6 imports for module environment (real app)
import { generateClient } from 'aws-amplify/data';
import { authManager } from './auth-manager.js';

export class AmplifyDataService {
  constructor() {
    // Handle case where dependencies might not be available (testing environment)
    try {
      this.client = generateClient();
    } catch (error) {
      console.warn('AWS Amplify generateClient not available - using mock client');
      this.client = this.createMockClient(); // Enhanced mock client for testing
    }
    this.currentSeason = "season_2025"; // Use proper ID format
  }

  // Helper function to safely parse league settings from JSON string
  parseLeagueSettings(league) {
    if (!league || !league.settings) return {};
    
    try {
      // If settings is already an object, return it
      if (typeof league.settings === 'object') {
        return league.settings;
      }
      // If settings is a JSON string, parse it
      return JSON.parse(league.settings);
    } catch (error) {
      console.warn('Failed to parse league settings JSON:', error);
      return {};
    }
  }

  // Create enhanced mock client for testing
  createMockClient() {
    const mockResponse = { data: [], errors: [] };
    const mockModel = {
      create: () => Promise.resolve({ data: { id: 'mock_id', leagueId: 'mock_league_' + Date.now() } }),
      list: () => Promise.resolve(mockResponse),
      update: () => Promise.resolve({ data: { id: 'mock_id' } }),
      delete: () => Promise.resolve({ data: { id: 'mock_id' } })
    };

    return {
      models: {
        League: mockModel,
        LeagueMember: mockModel,
        DriverPick: mockModel,
        LifeEvent: mockModel,
        UserProfile: mockModel
      }
    };
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
      
      // Check for duplicate league names for this user
      const existingLeagues = await this.getUserLeagues();
      const duplicateName = existingLeagues.find(league => 
        league.name.toLowerCase().trim() === leagueData.name.toLowerCase().trim()
      );
      
      if (duplicateName) {
        return {
          success: false,
          error: `You already have a league named "${leagueData.name}". Please choose a different name.`
        };
      }
      
      // Generate unique league ID
      const leagueId = `league_${userId}_${Date.now()}`;
    
    // Prepare league settings with lives configuration
    const leagueSettings = {
      maxMembers: leagueData.maxMembers || 50,
      autoPickEnabled: leagueData.autoPickEnabled !== false,
      isPrivate: leagueData.isPrivate !== false,
      // Lives system configuration
      livesEnabled: leagueData.livesEnabled || false,
      maxLives: leagueData.maxLives || 1,
      livesLockDate: leagueData.livesLockDate || null,
      customRules: leagueData.customRules || ''
    };

    const league = await this.client.models.League.create({
        leagueId: leagueId,
      name: leagueData.name,
      inviteCode: leagueData.inviteCode,
      ownerId: userId,
      maxMembers: leagueSettings.maxMembers,
      season: this.currentSeason,
      autoPickEnabled: leagueSettings.autoPickEnabled,
      isPrivate: leagueSettings.isPrivate,
      status: 'ACTIVE',
      settings: JSON.stringify(leagueSettings), // Convert to JSON string for AWSJSON type
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    }, {
      authMode: 'userPool'
    });

    // Log the actual response structure for debugging
    console.log('League creation response:', league);
    console.log('League response type:', typeof league);
    console.log('League response keys:', league ? Object.keys(league) : 'null');

    // Validate league creation response - be more flexible with response structure
    if (!league) {
      throw new Error('League creation failed - no response from AWS');
    }

    // Handle different possible response structures
    let createdLeague;
    if (league.data) {
      createdLeague = league.data;
    } else if (league.leagueId || league.id) {
      createdLeague = league;
    } else {
      console.error('Unexpected league response structure:', league);
      throw new Error('League creation failed - unexpected response structure');
    }

    console.log('League created successfully:', createdLeague);

    // Add owner as member with lives initialization
    try {
      await this.client.models.LeagueMember.create({
        leagueId: createdLeague.leagueId || leagueId,
        userId: userId,
        joinedAt: new Date().toISOString(),
        status: 'ACTIVE',
        isOwner: true,
        survivedRaces: 0,
        totalPicks: 0,
        autoPickCount: 0,
        // Initialize lives from league settings
        remainingLives: leagueSettings.maxLives,
        livesUsed: 0,
        maxLives: leagueSettings.maxLives
        // Note: Removed eliminationHistory as it's causing GraphQL validation error
        // It will be null initially and can be updated later when needed
      }, {
        authMode: 'userPool'
      });
      
      console.log('League member created successfully for owner');
    } catch (memberError) {
      console.error('Failed to create league member:', memberError);
      // Clean up the league if member creation fails
      try {
        await this.client.models.League.delete({
          id: createdLeague.id
        }, {
          authMode: 'userPool'
        });
        console.log('Cleaned up league after member creation failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup league:', cleanupError);
      }
      
      throw new Error('Failed to create league membership - league creation aborted');
    }

      // Return formatted data for UI compatibility
      return {
        success: true,
        leagueId: createdLeague.leagueId || leagueId,
        leagueName: createdLeague.name || leagueData.name,
        inviteCode: createdLeague.inviteCode || leagueData.inviteCode,
        settings: leagueSettings,
        ...createdLeague
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

    // Get league lives configuration for member initialization
    const leagueSettings = this.parseLeagueSettings(league);
    const maxLives = leagueSettings.maxLives || 1;

    // Add as member with lives initialization
    await this.client.models.LeagueMember.create({
      leagueId: league.leagueId,
      userId: userId,
      joinedAt: new Date().toISOString(),
      status: 'ACTIVE',
      isOwner: false,
      survivedRaces: 0,
      totalPicks: 0,
      autoPickCount: 0,
      // Initialize lives from league settings
      remainingLives: maxLives,
      livesUsed: 0,
      maxLives: maxLives
      // Note: Removed eliminationHistory as it's causing GraphQL validation error
      // It will be null initially and can be updated later when needed
    }, {
      authMode: 'userPool'
    });

    return league;
  }

  async getLeagueByInviteCode(inviteCode) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    // Find league by invite code (for preview functionality)
    const leagueResult = await this.client.models.League.list({
      filter: {
        inviteCode: { eq: inviteCode },
        status: { eq: 'ACTIVE' }
      },
      authMode: 'userPool'
    });

    if (!leagueResult.data || leagueResult.data.length === 0) {
      return null; // League not found - return null instead of throwing error for preview
    }

    const league = leagueResult.data[0];

    // Get member count for the league
    const memberCount = await this.getLeagueMembers(league.leagueId);
    
    return {
      ...league,
      memberCount: memberCount.length,
      season: '2025' // Add current season for preview
    };
  }

  async getLeague(leagueId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    // Fix: Use list with filter instead of get, since leagueId is a custom field not the DynamoDB primary key
    // Amplify auto-generates an 'id' field as the primary key, but we use 'leagueId' as our business logic key
    const result = await this.client.models.League.list({
      filter: {
        leagueId: { eq: leagueId }
      }
    }, {
      authMode: 'userPool'
    });

    // Return the first match (should be unique)
    return result.data && result.data.length > 0 ? result.data[0] : null;
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

    // Get league details for each membership with member counts
    const leagues = [];
    for (const membership of memberResult.data) {
      const league = await this.getLeague(membership.leagueId);
      if (league) {
        // Get member count for this league
        const members = await this.getLeagueMembers(membership.leagueId);
        
        leagues.push({
          ...league,
          membershipData: membership,
          members: members, // Include full members array for compatibility
          memberCount: members.length // Include convenient member count property
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

      // Get all league details with member counts in parallel
      const leaguePromises = memberResult.data.map(async membership => {
        const league = await this.getLeague(membership.leagueId);
        if (league) {
          const members = await this.getLeagueMembers(membership.leagueId);
          return {
            ...league,
            membershipData: membership,
            members: members, // Include full members array for compatibility
            memberCount: members.length // Include convenient member count property
          };
        }
        return null;
      });

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

  // LEAGUE DELETION: Complete league removal
  async deleteLeague(leagueId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      console.log(`🗑️ Starting complete deletion of league: ${leagueId}`);

      // 1. Verify ownership
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const currentUserId = user.userId || user.username;
      if (league.ownerId !== currentUserId) {
        throw new Error('Only the league owner can delete the league');
      }

      // 2. Get all league members
      const members = await this.getLeagueMembers(leagueId);
      console.log(`📋 Found ${members.length} members to remove`);

      // 3. Delete all league members
      const memberDeletions = members.map(member => 
        this.client.models.LeagueMember.delete({
          id: member.id
        }, {
          authMode: 'userPool'
        })
      );

      await Promise.all(memberDeletions);
      console.log(`✅ Removed ${members.length} league members`);

      // 4. Delete all picks associated with this league
      const leaguePicksResult = await this.client.models.DriverPick.list({
        filter: {
          leagueId: { eq: leagueId }
        }
      }, {
        authMode: 'userPool'
      });

      if (leaguePicksResult.data && leaguePicksResult.data.length > 0) {
        const pickDeletions = leaguePicksResult.data.map(pick =>
          this.client.models.DriverPick.delete({
            id: pick.id
          }, {
            authMode: 'userPool'
          })
        );

        await Promise.all(pickDeletions);
        console.log(`✅ Removed ${leaguePicksResult.data.length} league picks`);
      }

      // 5. Delete all life events associated with this league
      const lifeEventsResult = await this.client.models.LifeEvent.list({
        filter: {
          leagueId: { eq: leagueId }
        }
      }, {
        authMode: 'userPool'
      });

      if (lifeEventsResult.data && lifeEventsResult.data.length > 0) {
        const lifeEventDeletions = lifeEventsResult.data.map(event =>
          this.client.models.LifeEvent.delete({
            id: event.id
          }, {
            authMode: 'userPool'
          })
        );

        await Promise.all(lifeEventDeletions);
        console.log(`✅ Removed ${lifeEventsResult.data.length} life events`);
      }

      // 6. Finally, delete the league itself
      await this.client.models.League.delete({
        id: league.id
      }, {
        authMode: 'userPool'
      });

      console.log(`✅ League ${leagueId} completely deleted from AWS`);

      // 7. Clear any caches
      this._clearCache('userLeagues');

      return {
        success: true,
        message: `League "${league.name}" has been completely deleted`,
        deletedItems: {
          members: members.length,
          picks: leaguePicksResult.data?.length || 0,
          lifeEvents: lifeEventsResult.data?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Failed to delete league:', error);
      throw new Error(`Failed to delete league: ${error.message}`);
    }
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

  // ADVANCED LEAGUE CUSTOMIZATION: Lives System Management
  
  // Lives configuration management
  async updateLeagueLivesSettings(leagueId, livesSettings) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      // Get league to check ownership
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const currentUserId = user.userId || user.username;
      if (league.ownerId !== currentUserId) {
        throw new Error('Only league owners can update lives settings');
      }

      // Validate lives settings
      const { maxLives, livesEnabled, livesLockDate } = livesSettings;
      
      if (maxLives && (maxLives < 1 || maxLives > 5)) {
        throw new Error('Lives per player must be between 1 and 5');
      }

      // Check if lives are locked (season has started)
      if (livesLockDate && new Date() > new Date(livesLockDate)) {
        throw new Error('Lives configuration cannot be changed after the lock date');
      }

      // Get current settings and merge with new ones
      const currentSettings = this.parseLeagueSettings(league);
      const updatedSettings = {
        ...currentSettings,
        maxLives: maxLives || currentSettings.maxLives || 1,
        livesEnabled: livesEnabled !== undefined ? livesEnabled : currentSettings.livesEnabled || false,
        livesLockDate: livesLockDate || currentSettings.livesLockDate,
        autoPickEnabled: currentSettings.autoPickEnabled !== undefined ? currentSettings.autoPickEnabled : true,
        isPrivate: currentSettings.isPrivate !== undefined ? currentSettings.isPrivate : true
      };

      // Update league settings
      const result = await this.updateLeagueSettings(leagueId, { settings: updatedSettings });
      
      // If maxLives changed, update all active members' maxLives
      if (maxLives && maxLives !== currentSettings.maxLives) {
        await this.updateAllMemberMaxLives(leagueId, maxLives);
      }

      console.log(`League ${leagueId} lives settings updated successfully`);
      return { success: true, settings: updatedSettings };
    } catch (error) {
      console.error('Failed to update league lives settings:', error);
      throw error;
    }
  }

  async getLeagueLivesConfiguration(leagueId) {
    try {
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const settings = this.parseLeagueSettings(league);
      const livesConfig = {
        maxLives: settings.maxLives || 1,
        livesEnabled: settings.livesEnabled || false,
        livesLockDate: settings.livesLockDate,
        isLocked: settings.livesLockDate ? new Date() > new Date(settings.livesLockDate) : false,
        customRules: settings.customRules || ''
      };

      return livesConfig;
    } catch (error) {
      console.error('Failed to get league lives configuration:', error);
      throw error;
    }
  }

  // Member lives management
  async updateMemberLives(leagueId, userId, livesOperation) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      // Get league to check ownership (admin-only operation)
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const currentUserId = user.userId || user.username;
      if (league.ownerId !== currentUserId) {
        throw new Error('Only league owners can manage member lives');
      }

      // Get current member data
      const memberResult = await this.client.models.LeagueMember.list({
        filter: {
          leagueId: { eq: leagueId },
          userId: { eq: userId }
        },
        authMode: 'userPool'
      });

      if (!memberResult.data || memberResult.data.length === 0) {
        throw new Error('Member not found in league');
      }

      const member = memberResult.data[0];
      const { operation, value, reason } = livesOperation;
      
      let newRemainingLives = member.remainingLives;
      
      switch (operation) {
        case 'SET':
          newRemainingLives = Math.max(0, Math.min(value, member.maxLives));
          break;
        case 'ADD':
          newRemainingLives = Math.min(member.remainingLives + value, member.maxLives);
          break;
        case 'SUBTRACT':
          newRemainingLives = Math.max(0, member.remainingLives - value);
          break;
        default:
          throw new Error('Invalid lives operation');
      }

      // Update member lives
      await this.client.models.LeagueMember.update({
        id: member.id,
        remainingLives: newRemainingLives,
        livesUsed: member.maxLives - newRemainingLives,
        status: newRemainingLives === 0 ? 'ELIMINATED' : 'ACTIVE'
      }, {
        authMode: 'userPool'
      });

      // Create life event record for audit trail
      await this.createLifeEvent(userId, leagueId, 'current', 
        newRemainingLives === 0 ? 'FINAL_ELIMINATION' : 'LIFE_RESTORED', 
        newRemainingLives, {
          adminUserId: currentUserId,
          adminReason: reason || 'Admin adjustment'
        });

      console.log(`Member ${userId} lives updated: ${member.remainingLives} → ${newRemainingLives}`);
      return { success: true, remainingLives: newRemainingLives };
    } catch (error) {
      console.error('Failed to update member lives:', error);
      throw error;
    }
  }

  async getMemberLivesStatus(leagueId, userId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      const targetUserId = userId || user.userId || user.username;
      
      const memberResult = await this.client.models.LeagueMember.list({
        filter: {
          leagueId: { eq: leagueId },
          userId: { eq: targetUserId }
        },
        authMode: 'userPool'
      });

      if (!memberResult.data || memberResult.data.length === 0) {
        return null;
      }

      const member = memberResult.data[0];
      return {
        userId: member.userId,
        remainingLives: member.remainingLives,
        livesUsed: member.livesUsed,
        maxLives: member.maxLives,
        eliminationHistory: member.eliminationHistory || [],
        status: member.status
      };
    } catch (error) {
      console.error('Failed to get member lives status:', error);
      throw error;
    }
  }

  // Helper method to update all members' maxLives when league setting changes
  async updateAllMemberMaxLives(leagueId, newMaxLives) {
    try {
      const members = await this.getLeagueMembers(leagueId);
      
      const updatePromises = members.map(member => 
        this.client.models.LeagueMember.update({
          id: member.id,
          maxLives: newMaxLives,
          // Adjust remaining lives if current is higher than new max
          remainingLives: Math.min(member.remainingLives, newMaxLives)
        }, {
          authMode: 'userPool'
        })
      );

      await Promise.all(updatePromises);
      console.log(`Updated maxLives to ${newMaxLives} for ${members.length} members in league ${leagueId}`);
    } catch (error) {
      console.error('Failed to update member max lives:', error);
      throw error;
    }
  }

  // Create life event for audit trail
  async createLifeEvent(userId, leagueId, raceId, eventType, livesRemaining, eventData = {}) {
    try {
      const lifeEvent = {
        userId,
        leagueId,
        raceId,
        eventType,
        livesRemaining,
        eventDate: new Date().toISOString(),
        ...eventData
      };

      await this.client.models.LifeEvent.create(lifeEvent, {
        authMode: 'userPool'
      });

      console.log(`Life event created: ${eventType} for user ${userId} in league ${leagueId}`);
    } catch (error) {
      console.error('Failed to create life event:', error);
      // Don't throw here - life events are audit trail, not critical for functionality
    }
  }

  // PHASE 2: League Operations Backend Integration - Missing AWS Operations

  // Active League Management - Store in UserProfile for persistence
  async setActiveLeague(leagueId, options = {}) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    // Validate league exists and user is a member (with retry for new leagues)
    if (leagueId) {
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      // For newly created leagues, use retry logic to handle DynamoDB eventual consistency
      const userId = user.userId || user.username;
      const isNewLeague = options.isNewLeague || false;
      
      if (isNewLeague) {
        // Retry membership validation for new leagues
        await this.validateMembershipWithRetry(leagueId, userId, 3);
      } else {
        // Standard validation for existing leagues
        const members = await this.getLeagueMembers(leagueId);
        const isMember = members.some(member => member.userId === userId);
        
        if (!isMember) {
          throw new Error('You are not a member of this league');
        }
      }
    }

    try {
      // Ensure UserProfile exists before updating
      await this.ensureUserProfile(user.userId || user.username);
      
      // Update UserProfile with active league
      await this.client.models.UserProfile.update({
        userId: user.userId || user.username,
        activeLeagueId: leagueId
      }, {
        authMode: 'userPool'
      });

      // Clear cache to force refresh
      this._clearCache('userLeagues');
      
      console.log(`Active league set to: ${leagueId || 'None (Solo Mode)'}`);
      return { success: true, activeLeagueId: leagueId };
    } catch (error) {
      console.error('Failed to set active league:', error);
      throw new Error('Failed to update active league setting');
    }
  }

  // Helper method to validate membership with retry logic for new leagues
  async validateMembershipWithRetry(leagueId, userId, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const members = await this.getLeagueMembers(leagueId);
        const isMember = members.some(member => member.userId === userId);
        
        if (isMember) {
          console.log(`Membership validated for user ${userId} in league ${leagueId} on attempt ${attempt}`);
          return true;
        }
        
        if (attempt < maxRetries) {
          // Wait with exponential backoff before retry
          const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
          console.log(`Membership not found on attempt ${attempt}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.warn(`Membership validation attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('You are not a member of this league');
  }

  // Helper method to ensure UserProfile exists
  async ensureUserProfile(userId) {
    try {
      const existingProfile = await this.client.models.UserProfile.list({
        filter: {
          userId: { eq: userId }
        },
        authMode: 'userPool'
      });

      if (!existingProfile.data || existingProfile.data.length === 0) {
        // Create UserProfile if it doesn't exist
        await this.client.models.UserProfile.create({
          userId: userId,
          activeLeagueId: null,
          createdAt: new Date().toISOString()
        }, {
          authMode: 'userPool'
        });
        console.log(`Created UserProfile for user ${userId}`);
      }
    } catch (error) {
      console.warn('Failed to ensure UserProfile exists:', error);
      // Don't throw here - we'll try the update anyway
    }
  }

  async getActiveLeague() {
    const user = await authManager.getCurrentUser();
    if (!user) return null;

    try {
      // Get user profile with active league
      const userProfile = await this.client.models.UserProfile.list({
        filter: {
          userId: { eq: user.userId || user.username }
        },
        authMode: 'userPool'
      });

      if (!userProfile.data || userProfile.data.length === 0) {
        console.log('No user profile found, returning null active league');
        return null;
      }

      const activeLeagueId = userProfile.data[0].activeLeagueId;
      if (!activeLeagueId) return null;

      // Return the full league data
      return await this.getLeague(activeLeagueId);
    } catch (error) {
      console.error('Failed to get active league:', error);
      return null;
    }
  }

  async getActiveLeagueId() {
    const user = await authManager.getCurrentUser();
    if (!user) return null;

    try {
      const userProfile = await this.client.models.UserProfile.list({
        filter: {
          userId: { eq: user.userId || user.username }
        },
        authMode: 'userPool'
      });

      if (!userProfile.data || userProfile.data.length === 0) {
        return null;
      }

      return userProfile.data[0].activeLeagueId || null;
    } catch (error) {
      console.error('Failed to get active league ID:', error);
      return null;
    }
  }

  // League Member Removal
  async removeUserFromLeague(leagueId, userId = null) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const currentUserId = user.userId || user.username;
    const targetUserId = userId || currentUserId;

    try {
      // Get league to check permissions
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      // Only league owner can remove other users, users can remove themselves
      if (targetUserId !== currentUserId && league.ownerId !== currentUserId) {
        throw new Error('Only league owners can remove other members');
      }

      // Find and remove league membership
      const memberResult = await this.client.models.LeagueMember.list({
        filter: {
          leagueId: { eq: leagueId },
          userId: { eq: targetUserId }
        },
        authMode: 'userPool'
      });

      if (!memberResult.data || memberResult.data.length === 0) {
        throw new Error('User is not a member of this league');
      }

      // Delete the membership record
      await this.client.models.LeagueMember.delete({
        id: memberResult.data[0].id
      }, {
        authMode: 'userPool'
      });

      // If user is removing themselves and this was their active league, clear it
      if (targetUserId === currentUserId) {
        const activeLeagueId = await this.getActiveLeagueId();
        if (activeLeagueId === leagueId) {
          await this.setActiveLeague(null);
        }
      }

      // Clear relevant caches
      this._clearCache('userLeagues');
      
      console.log(`User ${targetUserId} removed from league ${leagueId}`);
      return { success: true, removedUserId: targetUserId, leagueId };
    } catch (error) {
      console.error('Failed to remove user from league:', error);
      throw error;
    }
  }

  // League Settings Update
  async updateLeagueSettings(leagueId, settings) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      // Get league to check ownership
      const league = await this.getLeague(leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      const currentUserId = user.userId || user.username;
      if (league.ownerId !== currentUserId) {
        throw new Error('Only league owners can update league settings');
      }

      // Validate settings
      const validSettings = {};
      if (settings.name !== undefined) validSettings.name = settings.name;
      if (settings.maxMembers !== undefined) validSettings.maxMembers = parseInt(settings.maxMembers);
      if (settings.autoPickEnabled !== undefined) validSettings.autoPickEnabled = settings.autoPickEnabled;
      if (settings.isPrivate !== undefined) validSettings.isPrivate = settings.isPrivate;
      if (settings.settings !== undefined) validSettings.settings = JSON.stringify(settings.settings); // Convert settings object to JSON string

      // Update league via list/filter since leagueId is not the primary key
      const leagueResult = await this.client.models.League.list({
        filter: {
          leagueId: { eq: leagueId }
        }
      }, {
        authMode: 'userPool'
      });

      if (!leagueResult.data || leagueResult.data.length === 0) {
        throw new Error('League not found for update');
      }

      // Update the league using the DynamoDB primary key (id)
      const updateResult = await this.client.models.League.update({
        id: leagueResult.data[0].id,
        ...validSettings,
        lastActiveAt: new Date().toISOString()
      }, {
        authMode: 'userPool'
      });

      console.log(`League ${leagueId} settings updated successfully`);
      return { success: true, league: updateResult.data };
    } catch (error) {
      console.error('Failed to update league settings:', error);
      throw error;
    }
  }

  // Data Consistency Validation
  async validateLeagueDataConsistency(leagueId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      const issues = [];
      
      // 1. Check league exists
      const league = await this.getLeague(leagueId);
      if (!league) {
        issues.push('League not found in database');
        return { isConsistent: false, issues };
      }

      // 2. Check league members exist and are valid
      const members = await this.getLeagueMembers(leagueId);
      if (members.length === 0) {
        issues.push('League has no members');
      }

      // 3. Check owner is a member
      const ownerIsMember = members.some(member => 
        member.userId === league.ownerId && member.isOwner === true
      );
      if (!ownerIsMember) {
        issues.push('League owner is not listed as a member');
      }

      // 4. Check for orphaned picks (picks without valid race data)
      const currentUserId = user.userId || user.username;
      const userPicks = await this.getUserPicks(currentUserId, leagueId);
      
      const raceData = JSON.parse(localStorage.getItem('nextRaceData') || '{}');
      const currentRaceId = raceData.raceId;
      
      if (userPicks.length > 0 && !currentRaceId) {
        issues.push('User has picks but no current race data available');
      }

      // 5. Check for duplicate picks in same race
      const raceGroups = {};
      userPicks.forEach(pick => {
        if (!raceGroups[pick.raceId]) {
          raceGroups[pick.raceId] = [];
        }
        raceGroups[pick.raceId].push(pick);
      });

      Object.entries(raceGroups).forEach(([raceId, picks]) => {
        if (picks.length > 1) {
          issues.push(`Multiple picks found for race ${raceId}: ${picks.length} picks`);
        }
      });

      const isConsistent = issues.length === 0;
      
      console.log(`League ${leagueId} consistency check: ${isConsistent ? 'PASS' : 'ISSUES FOUND'}`);
      if (!isConsistent) {
        console.warn('Consistency issues:', issues);
      }

      return {
        isConsistent,
        issues,
        league,
        memberCount: members.length,
        userPickCount: userPicks.length,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to validate league data consistency:', error);
      return {
        isConsistent: false,
        issues: [`Validation failed: ${error.message}`],
        checkedAt: new Date().toISOString()
      };
    }
  }

  // Force refresh league data from AWS (no cache)
  async syncLeagueData(leagueId) {
    const user = await authManager.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    try {
      // Clear all relevant caches
      this._clearCache('userLeagues');
      this._clearCache(`league_${leagueId}`);
      this._clearCache(`members_${leagueId}`);

      // Fetch fresh data
      const league = await this.getLeague(leagueId);
      const members = await this.getLeagueMembers(leagueId);
      const currentUserId = user.userId || user.username;
      const userPicks = await this.getUserPicks(currentUserId, leagueId);

      console.log(`League ${leagueId} data synced successfully`);
      return {
        success: true,
        league,
        memberCount: members.length,
        userPickCount: userPicks.length,
        syncedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to sync league data:', error);
      throw error;
    }
  }
}

// Export for ES6 modules (real app)
export const amplifyDataService = new AmplifyDataService();

// Also create global instance for browser script loading (test environment)
if (typeof window !== 'undefined') {
  window.AmplifyDataService = AmplifyDataService;
  window.amplifyDataService = amplifyDataService;
} 