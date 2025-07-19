// ES6 imports for module environment (real app)
import { leagueStorageManager } from '@/services/league/LeagueStorageManager.js';
import { leagueManager } from '@/services/league/LeagueManager.js';
import { refreshLeagueData } from '@/services/league/LeagueIntegration.js';

export class LeagueModalManager {
  constructor() {
    this.activeModal = null;
    // In ES6 module environment, leagueManager is available via import
    // In test environment, use lazy initialization with fallback
    try {
      this.leagueManager = leagueManager;
    } catch (error) {
      this.leagueManager = this.createMockLeagueManager();
    }
  }

  // Create mock league manager for test environment
  createMockLeagueManager() {
    console.warn('leagueManager not available - using mock');
    return {
      createLeague: () => Promise.resolve({ success: false, error: 'Mock leagueManager' }),
      joinLeague: () => Promise.resolve({ leagueName: 'Mock League' }),
      getUserLeagues: () => [],
      getLeague: () => null,
      isLeagueOwner: () => false,
      previewLeague: () => Promise.resolve(null),
      setActiveLeague: () => {},
      currentUserId: 'mock_user'
    };
  }

  // Helper method to get refreshLeagueData function safely
  getRefreshLeagueData() {
    try {
      return refreshLeagueData;
    } catch (error) {
      console.warn('refreshLeagueData not available - using mock');
      return () => Promise.resolve();
    }
  }

  // Show create league modal
  showCreateLeagueModal() {
    this.closeActiveModal();

    const modalHTML = `
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content">
          <button class="close-btn">&times;</button>
          <h3>Create New League</h3>
          
          <form id="create-league-form">
            <div class="form-group">
              <label for="league-name">League Name</label>
              <input type="text" id="league-name" maxlength="50" required>
              <small>Choose a memorable name for your league</small>
            </div>
            
            <div class="form-group">
              <label for="max-members">Max Members</label>
              <select id="max-members">
                <option value="10">10 Players</option>
                <option value="15">15 Players</option>
                <option value="20" selected>20 Players</option>
                <option value="30">30 Players</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="auto-pick-enabled" checked>
                Enable auto-pick for missed deadlines
              </label>
            </div>
            
            <!-- REMOVED: Lives Configuration - Simplified to single elimination -->
            
            <div class="form-actions">
              <button type="button" id="cancel-create">Cancel</button>
              <button type="submit" id="create-league-btn">Create League</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModal = document.getElementById('league-modal');
    this.attachCreateLeagueEvents();
  }

  // Show join league modal
  showJoinLeagueModal() {
    this.closeActiveModal();

    const modalHTML = `
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content">
          <button class="close-btn">&times;</button>
          <h3>Join League</h3>
          
          <form id="join-league-form">
            <div class="form-group">
              <label for="invite-code">Invite Code</label>
              <input type="text" id="invite-code" placeholder="Enter 8-character code" maxlength="8" required>
              <small>Ask your league organizer for the invite code</small>
            </div>
            
            <div id="league-preview" class="league-preview" style="display: none;">
              <h4>League Preview</h4>
              <div class="preview-info">
                <p><strong>Name:</strong> <span id="preview-name"></span></p>
                <p><strong>Members:</strong> <span id="preview-members"></span></p>
                <p><strong>Season:</strong> <span id="preview-season"></span></p>
              </div>
            </div>
            
            <div id="join-error" class="error-message" style="display: none;"></div>
            
            <div class="form-actions">
              <button type="button" id="cancel-join">Cancel</button>
              <button type="submit" id="join-league-btn">Join League</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModal = document.getElementById('league-modal');
    this.attachJoinLeagueEvents();
  }

  // Show manage leagues modal
  async showManageLeaguesModal() {
    this.closeActiveModal();

    const userLeagues = await this.leagueManager.getUserLeagues();

    const modalHTML = `
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content large">
          <button class="close-btn">&times;</button>
          <h3>Manage Leagues</h3>
          
          <div class="league-actions">
            <button id="create-league-action" class="action-btn create">
              <span class="icon">+</span>
              Create New League
            </button>
            <button id="join-league-action" class="action-btn join">
              <span class="icon">🔗</span>
              Join League
            </button>
          </div>
          
          <div class="user-leagues">
            <h4>Your Leagues</h4>
            <div class="leagues-list">
              ${userLeagues.length === 0 ? 
                '<p class="no-leagues">You haven\'t joined any leagues yet.</p>' :
                userLeagues.map(league => `
                  <div class="league-item" data-league-id="${league.leagueId}">
                    <div class="league-info">
                      <h5>${this.escapeHtml(league.name)}</h5>
                      <p>${league.members ? league.members.length : 0} members • ${league.membershipData?.isOwner || league.ownerId === (window.authManager?.currentUser?.userId || window.authManager?.currentUser?.username) ? 'Owner' : 'Member'}</p>
                      ${(league.membershipData?.isOwner || league.ownerId === (window.authManager?.currentUser?.userId || window.authManager?.currentUser?.username)) ? `<p class="invite-code">Invite Code: <strong>${league.inviteCode}</strong></p>` : ''}
                    </div>
                    <div class="league-actions-item">
                      <button class="select-league" data-league-id="${league.leagueId}">Select</button>
                      ${(league.membershipData?.isOwner || league.ownerId === (window.authManager?.currentUser?.userId || window.authManager?.currentUser?.username)) ? `<button class="manage-league" data-league-id="${league.leagueId}">Settings</button>` : ''}
                      <button class="leave-league" data-league-id="${league.leagueId}">${(league.membershipData?.isOwner || league.ownerId === (window.authManager?.currentUser?.userId || window.authManager?.currentUser?.username)) ? 'Delete' : 'Leave'}</button>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModal = document.getElementById('league-modal');
    this.attachManageLeaguesEvents();
  }

  // Show league settings modal (for owners)
  async showLeagueSettingsModal(leagueId) {
    this.closeActiveModal();

    const league = await this.leagueManager.getLeague(leagueId);
    const user = await authManager.getCurrentUser();
    const currentUserId = user?.userId || user?.username;
    
    if (!league || league.ownerId !== currentUserId) {
      this.showError('You do not have permission to manage this league.');
      return;
    }

    // Get league members for member count and member management
    const members = await amplifyDataService.getLeagueMembers(leagueId);
    league.members = members; // Add members array to league object

    // Parse league settings safely for template use
    const settings = amplifyDataService.parseLeagueSettings(league);

    const modalHTML = `
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content">
          <button class="close-btn">&times;</button>
          <h3>League Settings: ${this.escapeHtml(league.name)}</h3>
          
          <div class="league-info-section">
            <p><strong>Invite Code:</strong> <span class="invite-code-display">${league.inviteCode}</span></p>
            <button class="copy-invite-code" data-code="${league.inviteCode}">Copy Code</button>
          </div>
          
          <form id="league-settings-form">
            <div class="form-group">
              <label for="max-members-setting">Max Members</label>
              <select id="max-members-setting">
                <option value="10" ${settings.maxMembers === 10 ? 'selected' : ''}>10 Players</option>
                <option value="15" ${settings.maxMembers === 15 ? 'selected' : ''}>15 Players</option>
                <option value="20" ${settings.maxMembers === 20 ? 'selected' : ''}>20 Players</option>
                <option value="30" ${settings.maxMembers === 30 ? 'selected' : ''}>30 Players</option>
              </select>
              <small>Current members: ${league.members.length}</small>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="auto-pick-enabled-setting" ${settings.autoPickEnabled ? 'checked' : ''}>
                Enable auto-pick for missed deadlines
              </label>
            </div>
            

            
            <div class="form-actions">
              <button type="button" id="cancel-settings">Cancel</button>
              <button type="submit" id="save-settings-btn">Save Settings</button>
            </div>
          </form>
          
          <div class="members-section">
            <h4>Member Management</h4>
            <div class="members-list enhanced">
              ${league.members.map(member => `
                <div class="member-item enhanced" data-user-id="${member.userId}">
                  <div class="member-info">
                    <span class="member-name">${this.escapeHtml(member.username)} ${member.isOwner ? '(Owner)' : ''}</span>
                    <div class="member-stats">
                      <span class="member-picks">${member.totalPicks || 0} picks</span>
                      <span class="member-status status-${member.status?.toLowerCase() || 'active'}">${member.status || 'Active'}</span>
                    </div>

                  </div>
                  <div class="member-actions">

                    ${!member.isOwner && member.userId !== this.leagueManager.currentUserId ? 
                      `<button class="kick-member" data-user-id="${member.userId}">Remove</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModal = document.getElementById('league-modal');
    this.attachLeagueSettingsEvents(leagueId);
  }

  // Attach event handlers for create league modal
  attachCreateLeagueEvents() {
    const modal = this.activeModal;
    const form = modal.querySelector('#create-league-form');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('#cancel-create');

    closeBtn.addEventListener('click', () => this.closeActiveModal());
    cancelBtn.addEventListener('click', () => this.closeActiveModal());

    // REMOVED: Lives configuration toggle - Simplified to single elimination

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const leagueName = document.getElementById('league-name').value;
      const maxMembers = parseInt(document.getElementById('max-members').value);
      const autoPickEnabled = document.getElementById('auto-pick-enabled').checked;
      
      // REMOVED: Lives configuration - Simplified to single elimination
      
      // Get form submit button and show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating League...';
      submitBtn.style.opacity = '0.7';

      try {
        const league = await this.leagueManager.createLeague(leagueName, {
          maxMembers,
          autoPickEnabled
        });

        // Check if league creation was successful
        if (!league.success) {
          throw new Error(league.error || 'Failed to create league');
        }

        // Show enhanced success message with invite code and sharing options
        this.showLeagueCreatedSuccessModal(league.name, league.inviteCode);

        // Add league directly to context first (immediate UI update)
        if (window.multiLeagueContext) {
          window.multiLeagueContext.addLeague({
            leagueId: league.leagueId,
            name: league.name,
            inviteCode: league.inviteCode,
            memberCount: 1, // Owner is the first member
            isOwner: true,
            status: 'ACTIVE',
            ownerId: league.ownerId,
            season: league.season,
            maxMembers: league.maxMembers,
            isPrivate: league.isPrivate,
            autoPickEnabled: league.autoPickEnabled
          });
        }

        // Set as active league (with new league flag for retry logic)
        this.leagueManager.setActiveLeague(league.leagueId, true);

        // Immediately refresh the league selector with new context
        if (window.leagueSelector && typeof window.leagueSelector.refreshAndRender === 'function') {
          await window.leagueSelector.refreshAndRender();
        }

        // Also refresh from AWS in background to sync any server-side data
        // But don't let it clear our local context if it fails
        setTimeout(async () => {
          try {
            const currentLeagueCount = window.multiLeagueContext ? window.multiLeagueContext.userLeagues.size : 0;
            
            // Only refresh if we expect leagues to be available
            if (currentLeagueCount > 0) {
              await this.getRefreshLeagueData()();
              
              // Only refresh UI if AWS returned valid data
              const newLeagueCount = window.multiLeagueContext ? window.multiLeagueContext.userLeagues.size : 0;
              if (newLeagueCount >= currentLeagueCount) {
                // Refresh the league selector with AWS updates
                if (window.leagueSelector && typeof window.leagueSelector.refreshAndRender === 'function') {
                  await window.leagueSelector.refreshAndRender();
                }
              } else {
                console.warn('AWS returned fewer leagues than expected, keeping local context');
              }
            }
          } catch (error) {
            console.warn('Failed to refresh league data from AWS:', error);
          }
        }, 3000); // Give DynamoDB more time to propagate

        // Modal will stay open for user to copy/share invite code
        // User can close it manually when ready

      } catch (error) {
        this.showError(error.message);
        
        // Reset button on error
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.style.opacity = '1';
      }
    });
  }

  // Attach event handlers for join league modal
  attachJoinLeagueEvents() {
    const modal = this.activeModal;
    const form = modal.querySelector('#join-league-form');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('#cancel-join');
    const inviteCodeInput = modal.querySelector('#invite-code');
    const previewDiv = modal.querySelector('#league-preview');
    const errorDiv = modal.querySelector('#join-error');

    closeBtn.addEventListener('click', () => this.closeActiveModal());
    cancelBtn.addEventListener('click', () => this.closeActiveModal());

    // Preview league on invite code input
    let previewTimeout;
    inviteCodeInput.addEventListener('input', (e) => {
      clearTimeout(previewTimeout);
      const code = e.target.value.trim();

      if (code.length === 8) {
        previewTimeout = setTimeout(async () => {
          try {
            const preview = await this.leagueManager.previewLeague(code);
            if (preview) {
              modal.querySelector('#preview-name').textContent = preview.name;
              modal.querySelector('#preview-members').textContent = `${preview.memberCount || 0}/${preview.maxMembers || 'N/A'}`;
              modal.querySelector('#preview-season').textContent = preview.season || '2025';
              previewDiv.style.display = 'block';
              errorDiv.style.display = 'none';
            } else {
              previewDiv.style.display = 'none';
            }
          } catch (error) {
            console.error('Error previewing league:', error);
            previewDiv.style.display = 'none';
          }
        }, 300);
      } else {
        previewDiv.style.display = 'none';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const inviteCode = inviteCodeInput.value.trim();

      try {
        const league = await this.leagueManager.joinLeague(inviteCode);

        // Show success message
        this.showSuccessModal('Joined League!', 
          `You have successfully joined "${league.name}".`
        );

        // IMMEDIATELY add league to local context to avoid timing issues
        if (window.multiLeagueContext && window.multiLeagueContext.addLeague) {
          console.log(`🔄 Adding joined league to local context: ${league.name}`);
          
          // Get current member count for the league if available
          let memberCount = 1; // Default to at least current user
          try {
            const members = await amplifyDataService.getLeagueMembers(league.leagueId);
            memberCount = members.length;
          } catch (error) {
            console.warn('Could not get member count for joined league, using default:', error);
          }
          
          window.multiLeagueContext.addLeague({
            leagueId: league.leagueId,
            name: league.name,
            inviteCode: league.inviteCode,
            memberCount: memberCount,
            isOwner: false,
            status: 'ACTIVE',
            ownerId: league.ownerId,
            season: league.season,
            maxMembers: league.maxMembers,
            isPrivate: league.isPrivate,
            autoPickEnabled: league.autoPickEnabled
          });
        }

        // Now set as active league (should work since we added it to context)
        const activeLeagueSet = this.leagueManager.setActiveLeague(league.leagueId);
        if (activeLeagueSet) {
          console.log(`✅ Successfully set joined league as active: ${league.name}`);
        } else {
          console.warn(`⚠️ Failed to set joined league as active, will retry after refresh`);
        }

        // Refresh league data from AWS to ensure full synchronization
        await this.getRefreshLeagueData()();

        // Refresh the league selector immediately
        if (window.leagueSelector && typeof window.leagueSelector.refreshAndRender === 'function') {
          await window.leagueSelector.refreshAndRender();
        }

        // Ensure the joined league is still active after refresh (fallback)
        if (!activeLeagueSet) {
          setTimeout(() => {
            this.leagueManager.setActiveLeague(league.leagueId);
          }, 500);
        }

        // Close modal after short delay
        setTimeout(() => {
          this.closeActiveModal();
        }, 2000);

      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  // Attach event handlers for manage leagues modal
  attachManageLeaguesEvents() {
    const modal = this.activeModal;
    const closeBtn = modal.querySelector('.close-btn');
    const createBtn = modal.querySelector('#create-league-action');
    const joinBtn = modal.querySelector('#join-league-action');

    closeBtn.addEventListener('click', () => this.closeActiveModal());
    createBtn.addEventListener('click', () => this.showCreateLeagueModal());
    joinBtn.addEventListener('click', () => this.showJoinLeagueModal());

    // League actions
    modal.querySelectorAll('.select-league').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leagueId = e.target.dataset.leagueId;
        this.leagueManager.setActiveLeague(leagueId);
        window.location.reload();
      });
    });

    modal.querySelectorAll('.manage-league').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const leagueId = e.target.dataset.leagueId;
        await this.showLeagueSettingsModal(leagueId);
      });
    });

    modal.querySelectorAll('.leave-league').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const leagueId = e.target.dataset.leagueId;
        const league = await this.leagueManager.getLeague(leagueId);
        const isOwner = this.leagueManager.isLeagueOwner ? await this.leagueManager.isLeagueOwner(leagueId) : (league && league.ownerId === (window.authManager?.currentUser?.userId || window.authManager?.currentUser?.username));

        const message = isOwner ? 
          `Are you sure you want to delete "${league.name}"? This action cannot be undone.` :
          `Are you sure you want to leave "${league.name}"?`;

        if (confirm(message)) {
          try {
            // Show loading state
            btn.disabled = true;
            btn.textContent = isOwner ? 'Deleting...' : 'Leaving...';
            
            let result;
            if (isOwner) {
              result = await this.leagueManager.deleteLeague(leagueId);
            } else {
              await this.leagueManager.leaveLeague(leagueId);
            }
            
            // Remove the league item from the modal immediately
            const leagueItem = modal.querySelector(`[data-league-id="${leagueId}"]`);
            if (leagueItem) {
              leagueItem.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
              leagueItem.style.opacity = '0';
              leagueItem.style.transform = 'translateX(-20px)';
              
              setTimeout(() => {
                leagueItem.remove();
                
                // Check if any leagues remain
                const remainingLeagues = modal.querySelectorAll('.league-item');
                if (remainingLeagues.length === 0) {
                  const leaguesList = modal.querySelector('.leagues-list');
                  if (leaguesList) {
                    leaguesList.innerHTML = '<p class="no-leagues">You haven\'t joined any leagues yet.</p>';
                  }
                }
              }, 300);
            }
            
            // Show enhanced success message with deletion details
            if (isOwner) {
              const deletionSummary = result.deletedItems ? 
                ` (${result.deletedItems.members} members, ${result.deletedItems.picks} picks removed)` : '';
              this.showQuickNotification(
                `League "${league.name}" completely deleted${deletionSummary}`,
                'success'
              );
            } else {
              this.showQuickNotification(
                `Left league "${league.name}" successfully`,
                'success'
              );
            }
            
            // Update league context in background
            if (window.multiLeagueContext && window.multiLeagueContext.removeLeague) {
              window.multiLeagueContext.removeLeague(leagueId);
            }
            
            // Refresh league selector in background
            if (window.leagueSelector && typeof window.leagueSelector.refreshAndRender === 'function') {
              setTimeout(async () => {
                try {
                  await window.leagueSelector.refreshAndRender();
                } catch (error) {
                  console.warn('Failed to refresh league selector:', error);
                }
              }, 500);
            }
            
            // If this was the active league, clear it
            const activeLeagueId = localStorage.getItem('activeLeagueId');
            if (activeLeagueId === leagueId) {
              localStorage.removeItem('activeLeagueId');
              // Set another league as active if available
              if (window.multiLeagueContext && window.multiLeagueContext.userLeagues.size > 0) {
                const firstLeague = Array.from(window.multiLeagueContext.userLeagues.values())[0];
                if (firstLeague && firstLeague.leagueId !== leagueId) {
                  this.leagueManager.setActiveLeague(firstLeague.leagueId);
                }
              }
            }
            
          } catch (error) {
            this.showError(error.message);
            // Reset button state on error
            btn.disabled = false;
            btn.textContent = isOwner ? 'Delete' : 'Leave';
          }
        }
      });
    });
  }

  // Attach event handlers for league settings modal
  attachLeagueSettingsEvents(leagueId) {
    const modal = this.activeModal;
    const form = modal.querySelector('#league-settings-form');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('#cancel-settings');
    const copyBtn = modal.querySelector('.copy-invite-code');

    closeBtn.addEventListener('click', () => this.closeActiveModal());
    cancelBtn.addEventListener('click', () => this.closeActiveModal());



    // Copy invite code
    copyBtn.addEventListener('click', (e) => {
      const code = e.target.dataset.code;
      navigator.clipboard.writeText(code).then(() => {
        e.target.textContent = 'Copied!';
        setTimeout(() => {
          e.target.textContent = 'Copy Code';
        }, 2000);
      });
    });

    // Save settings
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const maxMembers = parseInt(document.getElementById('max-members-setting').value);
      const autoPickEnabled = document.getElementById('auto-pick-enabled-setting').checked;
      
      const settings = {
        maxMembers,
        autoPickEnabled
      };

      try {
        await this.leagueManager.updateLeagueSettings(leagueId, settings);

        this.showSuccessModal('Settings Updated', 'League settings have been updated successfully.');
        setTimeout(() => {
          this.showManageLeaguesModal();
        }, 1500);

      } catch (error) {
        this.showError(error.message);
      }
    });





    // Kick members
    modal.querySelectorAll('.kick-member').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userId = e.target.dataset.userId;
        const league = await this.leagueManager.getLeague(leagueId);
        const members = await amplifyDataService.getLeagueMembers(leagueId);
        const member = members.find(m => m.userId === userId);

        if (confirm(`Are you sure you want to remove ${member.username || member.userId} from the league?`)) {
          try {
            await this.leagueManager.kickMember(leagueId, userId);
            await this.showLeagueSettingsModal(leagueId);
          } catch (error) {
            this.showError(error.message);
          }
        }
      });
    });
  }

  // Show enhanced success modal for league creation with sharing features
  showLeagueCreatedSuccessModal(leagueName, inviteCode) {
    this.closeActiveModal();

    const modalHTML = `
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content success">
          <button class="close-btn">&times;</button>
          <div class="success-header">
            <div class="success-icon">🎉</div>
            <h3>League Created Successfully!</h3>
          </div>
          
          <div class="league-created-info">
            <div class="league-name">
              <strong>${this.escapeHtml(leagueName)}</strong>
            </div>
            <p class="creation-message">Your F1 Survivor league is ready! Share the invite code below with friends and family.</p>
          </div>

          <div class="invite-code-section">
            <label class="invite-label">Invite Code</label>
            <div class="invite-code-container">
              <input type="text" id="invite-code-display" value="${inviteCode}" readonly class="invite-code-input">
              <button id="copy-invite-btn" class="copy-btn" data-code="${inviteCode}">
                <span class="copy-icon">📋</span>
                Copy
              </button>
            </div>
            <p class="invite-instructions">Anyone with this code can join your league</p>
          </div>

          <div class="sharing-options">
            <h4>Share Your League</h4>
            <div class="share-buttons">
              <button id="share-native-btn" class="share-btn native-share" style="display: none;">
                <span class="share-icon">📤</span>
                Share
              </button>
              <button id="share-link-btn" class="share-btn">
                <span class="share-icon">🔗</span>
                Copy Link
              </button>
            </div>
          </div>
          
          <div class="form-actions">
            <button class="cta-button" id="continue-btn">Continue</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModal = document.getElementById('league-modal');
    this.attachLeagueCreatedEvents(inviteCode);
  }

  // Show success modal
  showSuccessModal(title, message) {
    this.closeActiveModal();

    const modalHTML = `
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content small success">
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModal = document.getElementById('league-modal');

    // Auto close after 3 seconds
    setTimeout(() => {
      this.closeActiveModal();
    }, 3000);
  }

  // Show error message
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  // Attach event handlers for league created success modal
  attachLeagueCreatedEvents(inviteCode) {
    const modal = this.activeModal;
    const closeBtn = modal.querySelector('.close-btn');
    const continueBtn = modal.querySelector('#continue-btn');
    const copyBtn = modal.querySelector('#copy-invite-btn');
    const shareNativeBtn = modal.querySelector('#share-native-btn');
    const shareLinkBtn = modal.querySelector('#share-link-btn');

    // Close button
    closeBtn.addEventListener('click', () => this.closeActiveModal());
    continueBtn.addEventListener('click', () => this.closeActiveModal());

    // Copy invite code
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(inviteCode);
        copyBtn.innerHTML = '<span class="copy-icon">✅</span> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="copy-icon">📋</span> Copy';
        }, 2000);
      } catch (error) {
        // Fallback for older browsers
        this.fallbackCopyText(inviteCode);
        copyBtn.innerHTML = '<span class="copy-icon">✅</span> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="copy-icon">📋</span> Copy';
        }, 2000);
      }
    });

    // Native sharing (if supported)
    if (navigator.share) {
      shareNativeBtn.style.display = 'inline-flex';
      shareNativeBtn.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: 'Join my F1 Survivor League!',
            text: `You're invited to join my F1 Survivor league! Use invite code: ${inviteCode}`,
            url: window.location.origin
          });
        } catch (error) {
          console.log('Native sharing cancelled or failed');
        }
      });
    }

    // Copy shareable link
    shareLinkBtn.addEventListener('click', async () => {
      const shareText = `🏎️ Join my F1 Survivor league!
      
Use invite code: ${inviteCode}
      
Play at: ${window.location.origin}

Pick one driver each race, can't pick the same driver twice. Last player standing wins!`;

      try {
        await navigator.clipboard.writeText(shareText);
        shareLinkBtn.innerHTML = '<span class="share-icon">✅</span> Copied!';
        setTimeout(() => {
          shareLinkBtn.innerHTML = '<span class="share-icon">🔗</span> Copy Link';
        }, 2000);
      } catch (error) {
        this.fallbackCopyText(shareText);
        shareLinkBtn.innerHTML = '<span class="share-icon">✅</span> Copied!';
        setTimeout(() => {
          shareLinkBtn.innerHTML = '<span class="share-icon">🔗</span> Copy Link';
        }, 2000);
      }
    });

    // Select invite code on focus for easy manual copying
    const inviteInput = modal.querySelector('#invite-code-display');
    inviteInput.addEventListener('focus', () => {
      inviteInput.select();
    });
  }

  // Fallback copy method for older browsers
  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Fallback copy failed:', error);
    }
    document.body.removeChild(textArea);
  }

  // Close active modal
  closeActiveModal() {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
  }

  // REMOVED: Lives display generation - Simplified to single elimination

  // REMOVED: Lives adjustment methods - Simplified to single elimination

  // REMOVED: Audit trail methods - Simplified to single elimination

  // Show quick notification
  showQuickNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `quick-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Utility: Escape HTML
  escapeHtml(unsafe) {
    if (unsafe == null || unsafe === undefined) {
      return '';
    }
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Export for ES6 modules (real app)
export const leagueModalManager = new LeagueModalManager();

// Also create global instance for browser script loading (test environment)
if (typeof window !== 'undefined') {
  window.LeagueModalManager = LeagueModalManager;
  window.leagueModalManager = leagueModalManager;
} 