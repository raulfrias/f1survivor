import { leagueStorageManager } from './league-storage-manager.js';
import { getCurrentSeason } from './storage-utils.js';

export class LeagueManager {
  constructor() {
    this.storageManager = leagueStorageManager;
    this.currentUserId = this.storageManager.getCurrentUserId();
    this.activeLeagueId = this.storageManager.getActiveLeagueId();
  }

  // Core league operations
  async createLeague(leagueName, settings = {}) {
    // Validate league name
    if (!leagueName || leagueName.trim().length === 0) {
      throw new Error('League name cannot be empty');
    }

    if (leagueName.trim().length > 50) {
      throw new Error('League name cannot exceed 50 characters');
    }

    const leagueId = this.generateLeagueId();
    const inviteCode = this.generateInviteCode();

    const league = {
      leagueId,
      leagueName: leagueName.trim(),
      ownerId: this.currentUserId,
      inviteCode,
      season: getCurrentSeason(),
      createdAt: new Date().toISOString(),
      members: [{
        userId: this.currentUserId,
        username: this.storageManager.getCurrentUsername(),
        joinedAt: new Date().toISOString(),
        status: "ACTIVE",
        isOwner: true
      }],
      picks: {},
      settings: {
        maxMembers: 20,
        isPrivate: true,
        autoPickEnabled: true,
        ...settings
      }
    };

    // Save league to storage
    if (!this.storageManager.saveLeague(league)) {
      throw new Error('Failed to save league');
    }

    // Add user to league
    this.storageManager.addUserToLeague(leagueId, true);

    return league;
  }

  async joinLeague(inviteCode) {
    if (!inviteCode || inviteCode.trim().length === 0) {
      throw new Error('Invalid invite code');
    }

    const league = this.storageManager.findLeagueByInviteCode(inviteCode.trim());
    if (!league) {
      throw new Error('Invalid invite code');
    }

    // Check if league is from current season
    if (league.season !== getCurrentSeason()) {
      throw new Error('This league is from a different season');
    }

    // Check if already a member
    if (league.members.some(m => m.userId === this.currentUserId)) {
      throw new Error('Already a member of this league');
    }

    // Check if league is full
    if (league.members.length >= league.settings.maxMembers) {
      throw new Error('League is full');
    }

    // Add new member
    const newMember = {
      userId: this.currentUserId,
      username: this.storageManager.getCurrentUsername(),
      joinedAt: new Date().toISOString(),
      status: "ACTIVE",
      isOwner: false
    };

    league.members.push(newMember);
    
    // Initialize empty picks array for new member
    if (!league.picks) {
      league.picks = {};
    }
    league.picks[this.currentUserId] = [];

    // Save updated league
    if (!this.storageManager.saveLeague(league)) {
      throw new Error('Failed to join league');
    }

    // Add user to league membership
    this.storageManager.addUserToLeague(league.leagueId, false);

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

  // Get current active league
  getActiveLeague() {
    return this.storageManager.getActiveLeague();
  }

  // Set active league
  setActiveLeague(leagueId) {
    this.storageManager.setActiveLeagueId(leagueId);
    this.activeLeagueId = leagueId;
  }

  // Get user's leagues
  getUserLeagues() {
    return this.storageManager.getUserLeagues();
  }

  // Check if user owns a league
  isLeagueOwner(leagueId) {
    const league = this.storageManager.getLeague(leagueId);
    return league && league.ownerId === this.currentUserId;
  }

  // Get league by ID
  getLeague(leagueId) {
    return this.storageManager.getLeague(leagueId);
  }

  // Preview league by invite code
  previewLeague(inviteCode) {
    const league = this.storageManager.findLeagueByInviteCode(inviteCode.trim());
    if (!league) {
      return null;
    }

    // Return limited info for preview
    return {
      leagueName: league.leagueName,
      memberCount: league.members.length,
      maxMembers: league.settings.maxMembers,
      season: league.season,
      createdAt: league.createdAt
    };
  }
}

// Export singleton instance
export const leagueManager = new LeagueManager(); 