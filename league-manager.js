import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';
import { setActiveLeagueId } from './league-integration.js';

// Helper function for getting active league ID from local storage (UI state only)
function getActiveLeagueIdFromStorage() {
  try {
    return localStorage.getItem('activeLeagueId');
  } catch (error) {
    console.error('Error getting active league ID:', error);
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
    const league = this.storageManager.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // Check if user is a member
    const memberIndex = league.members.findIndex(m => m.userId === this.currentUserId);
    if (memberIndex === -1) {
      throw new Error('Not a member of this league');
    }

    // Prevent owner from leaving (they should delete the league instead)
    if (league.ownerId === this.currentUserId) {
      throw new Error('League owner cannot leave. Delete the league instead.');
    }

    // Remove member from league
    league.members.splice(memberIndex, 1);

    // Remove user's picks
    if (league.picks && league.picks[this.currentUserId]) {
      delete league.picks[this.currentUserId];
    }

    // Save updated league
    if (!this.storageManager.saveLeague(league)) {
      throw new Error('Failed to leave league');
    }

    // Remove user from league membership
    this.storageManager.removeUserFromLeague(leagueId);

    return true;
  }

  async deleteLeague(leagueId) {
    const league = this.storageManager.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // Only owner can delete
    if (league.ownerId !== this.currentUserId) {
      throw new Error('Only the league owner can delete the league');
    }

    // Remove all members from league
    league.members.forEach(member => {
      if (member.userId !== this.currentUserId) {
        // In a real implementation, we'd need to update other users' data
        // For now, we'll just handle the current user
      }
    });

    // Remove league from storage
    const allLeagues = this.storageManager.getAllLeagues();
    delete allLeagues[leagueId];
    localStorage.setItem('f1survivor_league_data', JSON.stringify(allLeagues));

    // Remove user from league membership
    this.storageManager.removeUserFromLeague(leagueId);

    return true;
  }

  // League member management (for owners)
  async kickMember(leagueId, userId) {
    const league = this.storageManager.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // Only owner can kick members
    if (league.ownerId !== this.currentUserId) {
      throw new Error('Only the league owner can kick members');
    }

    // Cannot kick yourself
    if (userId === this.currentUserId) {
      throw new Error('Cannot kick yourself from the league');
    }

    // Find and remove member
    const memberIndex = league.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) {
      throw new Error('Member not found in league');
    }

    league.members.splice(memberIndex, 1);

    // Remove member's picks
    if (league.picks && league.picks[userId]) {
      delete league.picks[userId];
    }

    // Save updated league
    if (!this.storageManager.saveLeague(league)) {
      throw new Error('Failed to kick member');
    }

    return true;
  }

  // League settings management
  async updateLeagueSettings(leagueId, newSettings) {
    const league = this.storageManager.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // Only owner can update settings
    if (league.ownerId !== this.currentUserId) {
      throw new Error('Only the league owner can update settings');
    }

    // Validate new settings
    if (newSettings.maxMembers && newSettings.maxMembers < league.members.length) {
      throw new Error('Cannot set max members below current member count');
    }

    // Update settings
    league.settings = {
      ...league.settings,
      ...newSettings
    };

    // Save updated league
    if (!this.storageManager.saveLeague(league)) {
      throw new Error('Failed to update league settings');
    }

    return league;
  }

  // Get league standings
  getLeagueStandings(leagueId) {
    const league = this.storageManager.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // Calculate standings based on picks and eliminations
    const standings = league.members.map(member => {
      const memberPicks = league.picks[member.userId] || [];
      
      // Count survived races (picks that haven't been eliminated)
      // In the prototype, we'll use a simple count
      const survivedRaces = memberPicks.length;
      
      return {
        userId: member.userId,
        username: member.username,
        survivedRaces,
        totalPicks: memberPicks.length,
        lastPick: memberPicks[memberPicks.length - 1] || null,
        isEliminated: false, // Will be determined by race results
        isOwner: member.isOwner
      };
    });

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
    const activeLeagueId = getActiveLeagueIdFromStorage();
    if (!activeLeagueId) return null;
    
    try {
      return await amplifyDataService.getLeague(activeLeagueId);
    } catch (error) {
      console.error('Error getting active league:', error);
      return null;
    }
  }

  // Set active league
  setActiveLeague(leagueId) {
    setActiveLeagueId(leagueId);
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
      return league && league.ownerId === user.userId;
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