import { amplifyDataService } from './amplify-data-service.js';

/**
 * Lives-Based Elimination Engine
 * Handles the processing of race results and life management for leagues with multiple lives system
 */
export class LivesEliminationEngine {
  constructor() {
    this.amplifyDataService = amplifyDataService;
  }

  /**
   * Process race results for all active leagues with lives enabled
   * @param {string} raceId - The ID of the race that was completed
   * @param {Array} raceResults - Array of race results with driver positions
   */
  async processRaceResults(raceId, raceResults) {
    try {
      console.log(`🏁 Processing race results for ${raceId} with lives system...`);
      
      // Get all active leagues with lives enabled
      const activeLeagues = await this.getActiveLeaguesWithLives();
      
      if (activeLeagues.length === 0) {
        console.log('No active leagues with lives system found');
        return { processed: 0, eliminations: 0 };
      }

      let totalProcessed = 0;
      let totalEliminations = 0;

      // Process each league separately
      for (const league of activeLeagues) {
        const result = await this.processLeagueEliminations(league.leagueId, raceId, raceResults);
        totalProcessed += result.processed;
        totalEliminations += result.eliminations;
      }

      console.log(`✅ Race results processed: ${totalProcessed} picks processed, ${totalEliminations} eliminations`);
      return { processed: totalProcessed, eliminations: totalEliminations };

    } catch (error) {
      console.error('Failed to process race results with lives system:', error);
      throw error;
    }
  }

  /**
   * Process eliminations for a specific league
   * @param {string} leagueId - The league to process
   * @param {string} raceId - The race ID
   * @param {Array} raceResults - Race results data
   */
  async processLeagueEliminations(leagueId, raceId, raceResults) {
    try {
      console.log(`Processing eliminations for league ${leagueId}, race ${raceId}`);
      
      // Get all picks for this race in this league
      const leaguePicks = await this.getLeaguePicksForRace(leagueId, raceId);
      
      if (leaguePicks.length === 0) {
        console.log(`No picks found for league ${leagueId}, race ${raceId}`);
        return { processed: 0, eliminations: 0 };
      }

      let processed = 0;
      let eliminations = 0;

      // Process each pick against race results
      for (const pick of leaguePicks) {
        const driverResult = raceResults.find(r => r.driverId === pick.driverId);
        
        if (driverResult) {
          // Check if driver finished outside top 10 (elimination condition)
          if (driverResult.finalPosition > 10) {
            await this.processLifeLoss(pick.userId, leagueId, raceId, pick, driverResult);
            eliminations++;
          }
          processed++;
        } else {
          console.warn(`No race result found for driver ${pick.driverId} in pick ${pick.id}`);
        }
      }

      console.log(`League ${leagueId}: ${processed} picks processed, ${eliminations} life losses`);
      return { processed, eliminations };

    } catch (error) {
      console.error(`Failed to process league eliminations for ${leagueId}:`, error);
      throw error;
    }
  }

  /**
   * Process life loss for a specific user pick
   * @param {string} userId - User who loses a life
   * @param {string} leagueId - League ID
   * @param {string} raceId - Race ID
   * @param {Object} pick - The pick that resulted in life loss
   * @param {Object} result - Race result for the picked driver
   */
  async processLifeLoss(userId, leagueId, raceId, pick, result) {
    try {
      // Get current member data
      const member = await this.getLeagueMember(leagueId, userId);
      
      if (!member) {
        console.error(`Member ${userId} not found in league ${leagueId}`);
        return;
      }

      if (member.remainingLives <= 0) {
        console.log(`User ${userId} already eliminated, skipping life loss`);
        return;
      }

      const newRemainingLives = member.remainingLives - 1;
      const livesUsed = member.livesUsed + 1;
      
      // Create elimination history entry
      const eliminationEvent = {
        raceId: raceId,
        raceName: result.raceName || `Race ${raceId}`,
        driverPicked: pick.driverName,
        finalPosition: result.finalPosition,
        eliminatedAt: new Date().toISOString(),
        livesLostCount: 1
      };

      const updatedEliminationHistory = [
        ...(member.eliminationHistory || []),
        eliminationEvent
      ];

      // Update member lives
      await this.amplifyDataService.client.models.LeagueMember.update({
        id: member.id,
        remainingLives: newRemainingLives,
        livesUsed: livesUsed,
        eliminationHistory: updatedEliminationHistory,
        status: newRemainingLives === 0 ? 'ELIMINATED' : 'ACTIVE',
        eliminatedAt: newRemainingLives === 0 ? new Date().toISOString() : member.eliminatedAt
      }, {
        authMode: 'userPool'
      });

      // Create life event record for audit trail
      await this.amplifyDataService.createLifeEvent(
        userId, 
        leagueId, 
        raceId, 
        newRemainingLives === 0 ? 'FINAL_ELIMINATION' : 'LIFE_LOST', 
        newRemainingLives, 
        {
          driverPicked: pick.driverName,
          finalPosition: result.finalPosition
        }
      );

      // Check for final elimination
      if (newRemainingLives === 0) {
        await this.processFinalElimination(userId, leagueId, raceId, pick, result);
      }

      console.log(`Life loss processed: User ${userId} now has ${newRemainingLives} lives remaining`);

    } catch (error) {
      console.error(`Failed to process life loss for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process final elimination when user loses all lives
   * @param {string} userId - User being eliminated
   * @param {string} leagueId - League ID
   * @param {string} raceId - Race ID where elimination occurred
   * @param {Object} pick - The final pick that caused elimination
   * @param {Object} result - Race result
   */
  async processFinalElimination(userId, leagueId, raceId, pick, result) {
    try {
      console.log(`🚫 Final elimination: User ${userId} eliminated from league ${leagueId}`);
      
      // Send elimination notification (placeholder for future implementation)
      await this.sendEliminationNotification(userId, leagueId, raceId, pick, result);
      
      // Update league statistics (could trigger league completion check)
      await this.updateLeagueStatistics(leagueId);

    } catch (error) {
      console.error(`Failed to process final elimination for user ${userId}:`, error);
      // Don't throw here - the core elimination was already processed
    }
  }

  /**
   * Get all active leagues that have lives system enabled
   */
  async getActiveLeaguesWithLives() {
    try {
      // This would need to be implemented in the data service
      // For now, we'll use a workaround to get all leagues and filter
      const allLeagues = await this.getAllActiveLeagues();
      
      return allLeagues.filter(league => {
        const settings = league.settings || {};
        return settings.livesEnabled === true && settings.maxLives > 1;
      });

    } catch (error) {
      console.error('Failed to get active leagues with lives:', error);
      return [];
    }
  }

  /**
   * Get all active leagues (helper method)
   */
  async getAllActiveLeagues() {
    try {
      // This is a simplified implementation - in production you'd want proper filtering
      const result = await this.amplifyDataService.client.models.League.list({
        filter: {
          status: { eq: 'ACTIVE' }
        },
        authMode: 'userPool'
      });

      return result.data || [];
    } catch (error) {
      console.error('Failed to get all active leagues:', error);
      return [];
    }
  }

  /**
   * Get all picks for a specific race in a league
   */
  async getLeaguePicksForRace(leagueId, raceId) {
    try {
      const result = await this.amplifyDataService.client.models.DriverPick.list({
        filter: {
          leagueId: { eq: leagueId },
          raceId: { eq: raceId }
        },
        authMode: 'userPool'
      });

      return result.data || [];
    } catch (error) {
      console.error(`Failed to get picks for league ${leagueId}, race ${raceId}:`, error);
      return [];
    }
  }

  /**
   * Get league member by user ID and league ID
   */
  async getLeagueMember(leagueId, userId) {
    try {
      const result = await this.amplifyDataService.client.models.LeagueMember.list({
        filter: {
          leagueId: { eq: leagueId },
          userId: { eq: userId }
        },
        authMode: 'userPool'
      });

      return result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error(`Failed to get league member ${userId} in league ${leagueId}:`, error);
      return null;
    }
  }

  /**
   * Send elimination notification (placeholder for future implementation)
   */
  async sendEliminationNotification(userId, leagueId, raceId, pick, result) {
    try {
      console.log(`📧 Elimination notification: User ${userId} eliminated in league ${leagueId}`);
      
      // Placeholder for notification system
      // Could send email, push notification, etc.
      
    } catch (error) {
      console.error('Failed to send elimination notification:', error);
      // Don't throw - notifications are not critical
    }
  }

  /**
   * Update league statistics after eliminations
   */
  async updateLeagueStatistics(leagueId) {
    try {
      console.log(`📊 Updating statistics for league ${leagueId}`);
      
      // Get current active members
      const members = await this.amplifyDataService.getLeagueMembers(leagueId);
      const activeMembers = members.filter(m => m.status === 'ACTIVE');
      
      console.log(`League ${leagueId}: ${activeMembers.length} active members remaining`);
      
      // Check if league is completed (only 1 or 0 active members)
      if (activeMembers.length <= 1) {
        console.log(`🏆 League ${leagueId} completed! Winner: ${activeMembers[0]?.userId || 'None'}`);
        // Could update league status to COMPLETED here
      }

    } catch (error) {
      console.error(`Failed to update league statistics for ${leagueId}:`, error);
      // Don't throw - statistics are not critical
    }
  }

  /**
   * Manual life restoration (for admin use)
   * @param {string} userId - User to restore life to
   * @param {string} leagueId - League ID
   * @param {string} adminUserId - Admin performing the action
   * @param {string} reason - Reason for restoration
   */
  async restoreLife(userId, leagueId, adminUserId, reason) {
    try {
      console.log(`🔄 Manual life restoration: User ${userId} in league ${leagueId} by admin ${adminUserId}`);
      
      const member = await this.getLeagueMember(leagueId, userId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      const newRemainingLives = Math.min(member.remainingLives + 1, member.maxLives);
      const livesUsed = member.maxLives - newRemainingLives;

      // Update member lives
      await this.amplifyDataService.client.models.LeagueMember.update({
        id: member.id,
        remainingLives: newRemainingLives,
        livesUsed: livesUsed,
        status: 'ACTIVE' // Restore to active if they were eliminated
      }, {
        authMode: 'userPool'
      });

      // Create life event record
      await this.amplifyDataService.createLifeEvent(
        userId, 
        leagueId, 
        'admin_action',
        'LIFE_RESTORED',
        newRemainingLives,
        {
          adminUserId,
          adminReason: reason
        }
      );

      console.log(`Life restored: User ${userId} now has ${newRemainingLives} lives`);
      return { success: true, remainingLives: newRemainingLives };

    } catch (error) {
      console.error(`Failed to restore life for user ${userId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const livesEliminationEngine = new LivesEliminationEngine(); 