// Note: Expects global variables: leagueManager, refreshLeagueData

class LeagueModalManager {
  constructor() {
    this.leagueManager = leagueManager;
    this.activeModal = null;
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
            
            <div class="form-group lives-configuration">
              <h4>Lives Configuration</h4>
              
              <div class="form-row">
                <label>
                  <input type="checkbox" id="lives-enabled" />
                  Enable Multiple Lives System
                </label>
              </div>
              
              <div id="lives-options" class="lives-options" style="display: none;">
                <div class="form-row">
                  <label for="max-lives">Lives per Player</label>
                  <select id="max-lives">
                    <option value="1">1 Life (Classic)</option>
                    <option value="2">2 Lives</option>
                    <option value="3" selected>3 Lives</option>
                    <option value="4">4 Lives</option>
                    <option value="5">5 Lives (Maximum)</option>
                  </select>
                </div>
                
                <div class="lives-explanation">
                  <p>Players will be eliminated when they lose all their lives. Lives are lost when picked drivers finish outside the top 10.</p>
                </div>
              </div>
            </div>
            
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
  showManageLeaguesModal() {
    this.closeActiveModal();

    const userLeagues = this.leagueManager.getUserLeagues();

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
                      <h5>${this.escapeHtml(league.leagueName)}</h5>
                      <p>${league.members.length} members • ${league.isOwner ? 'Owner' : 'Member'}</p>
                      ${league.isOwner ? `<p class="invite-code">Invite Code: <strong>${league.inviteCode}</strong></p>` : ''}
                    </div>
                    <div class="league-actions-item">
                      <button class="select-league" data-league-id="${league.leagueId}">Select</button>
                      ${league.isOwner ? `<button class="manage-league" data-league-id="${league.leagueId}">Settings</button>` : ''}
                      <button class="leave-league" data-league-id="${league.leagueId}">${league.isOwner ? 'Delete' : 'Leave'}</button>
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
  showLeagueSettingsModal(leagueId) {
    this.closeActiveModal();

    const league = this.leagueManager.getLeague(leagueId);
    if (!league || league.ownerId !== this.leagueManager.currentUserId) {
      return;
    }

    const modalHTML = `
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content">
          <button class="close-btn">&times;</button>
          <h3>League Settings: ${this.escapeHtml(league.leagueName)}</h3>
          
          <div class="league-info-section">
            <p><strong>Invite Code:</strong> <span class="invite-code-display">${league.inviteCode}</span></p>
            <button class="copy-invite-code" data-code="${league.inviteCode}">Copy Code</button>
          </div>
          
          <form id="league-settings-form">
            <div class="form-group">
              <label for="max-members-setting">Max Members</label>
              <select id="max-members-setting">
                <option value="10" ${league.settings.maxMembers === 10 ? 'selected' : ''}>10 Players</option>
                <option value="15" ${league.settings.maxMembers === 15 ? 'selected' : ''}>15 Players</option>
                <option value="20" ${league.settings.maxMembers === 20 ? 'selected' : ''}>20 Players</option>
                <option value="30" ${league.settings.maxMembers === 30 ? 'selected' : ''}>30 Players</option>
              </select>
              <small>Current members: ${league.members.length}</small>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="auto-pick-enabled-setting" ${league.settings.autoPickEnabled ? 'checked' : ''}>
                Enable auto-pick for missed deadlines
              </label>
            </div>
            
            <div class="form-group lives-settings">
              <h4>Lives System</h4>
              
              <div class="current-lives-status">
                <p><strong>Current Setting:</strong> <span id="current-lives-display">${league.settings?.maxLives || 1} Lives per Player</span></p>
                <p class="lives-lock-info" id="lives-lock-info">${league.settings?.livesLockDate ? 'Lives settings are locked for this season' : 'Lives can be configured until season starts'}</p>
              </div>
              
              <div id="lives-modification" class="lives-modification" ${league.settings?.livesLockDate && new Date() > new Date(league.settings.livesLockDate) ? 'style="display: none;"' : ''}>
                <div class="form-row">
                  <label>
                    <input type="checkbox" id="lives-enabled-setting" ${league.settings?.livesEnabled ? 'checked' : ''}>
                    Enable Multiple Lives System
                  </label>
                </div>
                
                <div id="lives-options-setting" class="lives-options" ${!league.settings?.livesEnabled ? 'style="display: none;"' : ''}>
                  <div class="form-row">
                    <label for="max-lives-setting">Lives per Player</label>
                    <select id="max-lives-setting">
                      <option value="1" ${league.settings?.maxLives === 1 ? 'selected' : ''}>1 Life (Classic)</option>
                      <option value="2" ${league.settings?.maxLives === 2 ? 'selected' : ''}>2 Lives</option>
                      <option value="3" ${league.settings?.maxLives === 3 ? 'selected' : ''}>3 Lives</option>
                      <option value="4" ${league.settings?.maxLives === 4 ? 'selected' : ''}>4 Lives</option>
                      <option value="5" ${league.settings?.maxLives === 5 ? 'selected' : ''}>5 Lives (Maximum)</option>
                    </select>
                    <small>Changes affect all current and future members</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" id="cancel-settings">Cancel</button>
              <button type="submit" id="save-settings-btn">Save Settings</button>
            </div>
          </form>
          
          <div class="members-section">
            <h4>Members</h4>
            <div class="members-list">
              ${league.members.map(member => `
                <div class="member-item">
                  <span class="member-name">${this.escapeHtml(member.username)} ${member.isOwner ? '(Owner)' : ''}</span>
                  ${!member.isOwner && member.userId !== this.leagueManager.currentUserId ? 
                    `<button class="kick-member" data-user-id="${member.userId}">Remove</button>` : ''}
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

    // Handle lives configuration toggle
    const livesEnabledCheckbox = modal.querySelector('#lives-enabled');
    const livesOptionsDiv = modal.querySelector('#lives-options');
    
    livesEnabledCheckbox.addEventListener('change', (e) => {
      livesOptionsDiv.style.display = e.target.checked ? 'block' : 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const leagueName = document.getElementById('league-name').value;
      const maxMembers = parseInt(document.getElementById('max-members').value);
      const autoPickEnabled = document.getElementById('auto-pick-enabled').checked;
      
      // Capture lives configuration
      const livesEnabled = document.getElementById('lives-enabled').checked;
      const maxLives = livesEnabled ? parseInt(document.getElementById('max-lives').value) : 1;
      
      // Get form submit button and show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating League...';
      submitBtn.style.opacity = '0.7';

      try {
        const league = await this.leagueManager.createLeague(leagueName, {
          maxMembers,
          autoPickEnabled,
          livesEnabled,
          maxLives
        });

        // Check if league creation was successful
        if (!league.success) {
          throw new Error(league.error || 'Failed to create league');
        }

        // Show enhanced success message with invite code and sharing options
        this.showLeagueCreatedSuccessModal(league.leagueName, league.inviteCode);

        // Add league directly to context first (immediate UI update)
        if (window.multiLeagueContext) {
          window.multiLeagueContext.addLeague({
            leagueId: league.leagueId,
            name: league.leagueName,
            inviteCode: league.inviteCode,
            memberCount: 1,
            isOwner: true,
            status: 'ACTIVE'
          });
        }

        // Set as active league
        this.leagueManager.setActiveLeague(league.leagueId);

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
              await refreshLeagueData();
              
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
              modal.querySelector('#preview-name').textContent = preview.leagueName;
              modal.querySelector('#preview-members').textContent = `${preview.memberCount}/${preview.maxMembers}`;
              modal.querySelector('#preview-season').textContent = preview.season;
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
          `You have successfully joined "${league.leagueName}".`
        );

        // Set as active league
        this.leagueManager.setActiveLeague(league.leagueId);

        // Refresh league data from AWS to pick up joined league
        await refreshLeagueData();

        // Refresh the league selector immediately
        if (window.leagueSelector && typeof window.leagueSelector.refreshAndRender === 'function') {
          await window.leagueSelector.refreshAndRender();
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
      btn.addEventListener('click', (e) => {
        const leagueId = e.target.dataset.leagueId;
        this.showLeagueSettingsModal(leagueId);
      });
    });

    modal.querySelectorAll('.leave-league').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const leagueId = e.target.dataset.leagueId;
        const league = this.leagueManager.getLeague(leagueId);
        const isOwner = this.leagueManager.isLeagueOwner(leagueId);

        const message = isOwner ? 
          `Are you sure you want to delete "${league.leagueName}"? This action cannot be undone.` :
          `Are you sure you want to leave "${league.leagueName}"?`;

        if (confirm(message)) {
          try {
            if (isOwner) {
              await this.leagueManager.deleteLeague(leagueId);
            } else {
              await this.leagueManager.leaveLeague(leagueId);
            }
            window.location.reload();
          } catch (error) {
            this.showError(error.message);
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

    // Handle lives configuration toggle in settings
    const livesEnabledSettingCheckbox = modal.querySelector('#lives-enabled-setting');
    const livesOptionsSettingDiv = modal.querySelector('#lives-options-setting');
    
    if (livesEnabledSettingCheckbox && livesOptionsSettingDiv) {
      livesEnabledSettingCheckbox.addEventListener('change', (e) => {
        livesOptionsSettingDiv.style.display = e.target.checked ? 'block' : 'none';
      });
    }

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
      
      // Capture lives configuration if available
      const livesEnabledSetting = document.getElementById('lives-enabled-setting');
      const maxLivesSetting = document.getElementById('max-lives-setting');
      
      const settings = {
        maxMembers,
        autoPickEnabled
      };
      
      // Add lives settings if the controls exist (not locked)
      if (livesEnabledSetting && maxLivesSetting) {
        settings.livesEnabled = livesEnabledSetting.checked;
        settings.maxLives = settings.livesEnabled ? parseInt(maxLivesSetting.value) : 1;
      }

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
        const league = this.leagueManager.getLeague(leagueId);
        const member = league.members.find(m => m.userId === userId);

        if (confirm(`Are you sure you want to remove ${member.username} from the league?`)) {
          try {
            await this.leagueManager.kickMember(leagueId, userId);
            this.showLeagueSettingsModal(leagueId);
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

  // Utility: Escape HTML
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Create global instance
window.LeagueModalManager = LeagueModalManager;
if (typeof window !== 'undefined') {
  window.leagueModalManager = new LeagueModalManager();
} 