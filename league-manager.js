import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';
import { setActiveLeagueId } from './league-integration.js';

// PHASE 3: League Operations Backend Integration
// Helper function now uses AWS backend instead of localStorage
async function getActiveLeagueIdFromAWS() {
  try {
    return await amplifyDataService.getActiveLeagueId();
  } catch (error) {
    console.error('Error getting active league ID from AWS:', error);
    return null;
  }
}

export class LeagueManager {
  constructor() {
    this.currentSeason = "2025";
  }

  // Get current user (requires authentication)
  async getCurrentUser() {
    const user = await authManager.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required for league operations');
    }
    return user;
  }

  // Core league operations - AWS BACKEND ONLY
  async createLeague(leagueName, settings = {}) {
    // Validate league name
    if (!leagueName || leagueName.trim().length === 0) {
      throw new Error('League name cannot be empty');
    }

    if (leagueName.trim().length > 50) {
      throw new Error('League name cannot exceed 50 characters');
    }

    const user = await this.getCurrentUser();
    const inviteCode = this.generateInviteCode();

    const leagueData = {
      name: leagueName.trim(),
      inviteCode,
      maxMembers: settings.maxMembers || 20,
      isPrivate: settings.isPrivate !== false, // Default to private
      autoPickEnabled: settings.autoPickEnabled !== false // Default to enabled
    };

    // Create league using AWS backend
    const league = await amplifyDataService.createLeague(leagueData);
    
    return league;
  }

  async joinLeague(inviteCode) {
    if (!inviteCode || inviteCode.trim().length === 0) {
      throw new Error('Invalid invite code');
    }

    const user = await this.getCurrentUser();
    
    // Join league using AWS backend
    const league = await amplifyDataService.joinLeague(inviteCode.trim());
    
    return league;
  }

  async leaveLeague(leagueId) {
    try {
      await amplifyDataService.removeUserFromLeague(leagueId);
      return true;
    } catch (error) {
      console.error('Failed to leave league:', error);
      throw error;
    }
  }

  async deleteLeague(leagueId) {
    const user = await this.getCurrentUser();
    const league = await amplifyDataService.getLeague(leagueId);
    
    if (!league) {
      throw new Error('League not found');
    }

    // Only owner can delete
    if (league.ownerId !== (user.userId || user.username)) {
      throw new Error('Only the league owner can delete the league');
    }

    // AWS backend handles league deletion and member cleanup
    // For now, remove user from league (delete functionality needs to be implemented in AWS)
    await amplifyDataService.removeUserFromLeague(leagueId);
    
    console.warn('Full league deletion not yet implemented in AWS backend');
    return true;
  }

  // League member management - AWS BACKEND
  async kickMember(leagueId, userId) {
    const user = await this.getCurrentUser();
    const league = await amplifyDataService.getLeague(leagueId);
    
    if (!league) {
      throw new Error('League not found');
    }

    // Only owner can kick members
    const currentUserId = user.userId || user.username;
    if (league.ownerId !== currentUserId) {
      throw new Error('Only the league owner can kick members');
    }

    // Cannot kick yourself
    if (userId === currentUserId) {
      throw new Error('Cannot kick yourself from the league');
    }

    // Use AWS backend to remove member
    try {
      await amplifyDataService.removeUserFromLeague(leagueId, userId);
      return true;
    } catch (error) {
      console.error('Failed to kick member:', error);
      throw error;
    }
  }

  // League settings management - AWS BACKEND
  async updateLeagueSettings(leagueId, newSettings) {
    const user = await this.getCurrentUser();
    const league = await amplifyDataService.getLeague(leagueId);
    
    if (!league) {
      throw new Error('League not found');
    }

    // Only owner can update settings
    const currentUserId = user.userId || user.username;
    if (league.ownerId !== currentUserId) {
      throw new Error('Only the league owner can update settings');
    }

    // Get current members to validate maxMembers
    const members = await amplifyDataService.getLeagueMembers(leagueId);
    
    // Validate new settings
    if (newSettings.maxMembers && newSettings.maxMembers < members.length) {
      throw new Error('Cannot set max members below current member count');
    }

    // Enhanced validation for lives settings
    if (newSettings.livesEnabled !== undefined || newSettings.maxLives !== undefined) {
      // Validate lives count
      if (newSettings.maxLives && (newSettings.maxLives < 1 || newSettings.maxLives > 5)) {
        throw new Error('Lives per player must be between 1 and 5');
      }

      // Check if lives are being enabled/changed after season start
      const currentSettings = league.settings || {};
      const isLivesLocked = currentSettings.livesLockDate && new Date() > new Date(currentSettings.livesLockDate);
      
      if (isLivesLocked) {
        throw new Error('Lives configuration cannot be changed after the season has started');
      }

      // If lives settings are changing, use the enhanced lives settings update method
      if (newSettings.livesEnabled !== undefined || newSettings.maxLives !== undefined) {
        const livesSettings = {
          livesEnabled: newSettings.livesEnabled,
          maxLives: newSettings.maxLives,
          livesLockDate: newSettings.livesLockDate
        };
        
        const result = await amplifyDataService.updateLeagueLivesSettings(leagueId, livesSettings);
        
        // Update other settings separately if needed
        const otherSettings = { ...newSettings };
        delete otherSettings.livesEnabled;
        delete otherSettings.maxLives;
        delete otherSettings.livesLockDate;
        
        if (Object.keys(otherSettings).length > 0) {
          await amplifyDataService.updateLeagueSettings(leagueId, otherSettings);
        }
        
        return result;
      }
    }

    // Use AWS backend to update settings (non-lives settings)
    const result = await amplifyDataService.updateLeagueSettings(leagueId, newSettings);
    return result.league;
  }

  // Get league standings - AWS BACKEND
  async getLeagueStandings(leagueId) {
    const league = await amplifyDataService.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    const members = await amplifyDataService.getLeagueMembers(leagueId);
    
    // Calculate standings based on picks and eliminations
    const standings = await Promise.all(members.map(async (member) => {
      const memberPicks = await amplifyDataService.getUserPicks(member.userId, leagueId);
      
      // Count survived races (picks that haven't been eliminated)
      const survivedRaces = memberPicks.length;
      
      return {
        userId: member.userId,
        username: member.userId, // TODO: Get actual username from UserProfile
        survivedRaces,
        totalPicks: memberPicks.length,
        lastPick: memberPicks[memberPicks.length - 1] || null,
        isEliminated: false, // Will be determined by race results
        isOwner: member.isOwner
      };
    }));

    // Sort by survived races (descending)
    standings.sort((a, b) => b.survivedRaces - a.survivedRaces);

    return standings;
  }

  // Utility methods
  generateLeagueId() {
    return `league_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Get current active league - AWS BACKEND
  async getActiveLeague() {
    const activeLeagueId = await getActiveLeagueIdFromAWS();
    if (!activeLeagueId) return null;
    
    try {
      return await amplifyDataService.getLeague(activeLeagueId);
    } catch (error) {
      console.error('Error getting active league:', error);
      return null;
    }
  }

  // Set active league - AWS BACKEND
  async setActiveLeague(leagueId) {
    try {
      await amplifyDataService.setActiveLeague(leagueId);
      // Also update UI state for immediate feedback
      setActiveLeagueId(leagueId);
      return true;
    } catch (error) {
      console.error('Error setting active league:', error);
      return false;
    }
  }

  // Get user's leagues - AWS BACKEND
  async getUserLeagues() {
    try {
      return await amplifyDataService.getUserLeagues();
    } catch (error) {
      console.error('Error getting user leagues:', error);
      return [];
    }
  }

  // Check if user owns a league - AWS BACKEND
  async isLeagueOwner(leagueId) {
    try {
      const user = await this.getCurrentUser();
      const league = await amplifyDataService.getLeague(leagueId);
      return league && league.ownerId === (user.userId || user.username);
    } catch (error) {
      console.error('Error checking league ownership:', error);
      return false;
    }
  }

  // Get league by ID - AWS BACKEND
  async getLeague(leagueId) {
    try {
      return await amplifyDataService.getLeague(leagueId);
    } catch (error) {
      console.error('Error getting league:', error);
      return null;
    }
  }

  // Preview league by invite code - AWS BACKEND
  async previewLeague(inviteCode) {
    try {
      if (!inviteCode || inviteCode.trim().length === 0) {
        return null;
      }

      // Use AWS backend to find league by invite code
      const league = await amplifyDataService.getLeagueByInviteCode(inviteCode.trim());
      
      if (!league) {
        return null;
      }

      // Return limited info for preview
      return {
        leagueName: league.name,
        memberCount: league.memberCount || 0,
        maxMembers: league.maxMembers || 20,
        season: league.season || '2025',
        createdAt: league.createdAt
      };
    } catch (error) {
      console.error('Error previewing league:', error);
      return null;
    }
  }
}

// Export singleton instance
export const leagueManager = new LeagueManager(); 