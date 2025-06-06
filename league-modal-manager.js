import { leagueManager } from './league-manager.js';

export class LeagueModalManager {
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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const leagueName = document.getElementById('league-name').value;
      const maxMembers = parseInt(document.getElementById('max-members').value);
      const autoPickEnabled = document.getElementById('auto-pick-enabled').checked;

      try {
        const league = await this.leagueManager.createLeague(leagueName, {
          maxMembers,
          autoPickEnabled
        });

        // Show success message with invite code
        this.showSuccessModal('League Created!', 
          `Your league "${league.leagueName}" has been created successfully.<br>
          <strong>Invite Code: ${league.inviteCode}</strong><br>
          Share this code with friends to invite them to your league.`
        );

        // Set as active league
        this.leagueManager.setActiveLeague(league.leagueId);

        // Refresh the page or update UI
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } catch (error) {
        this.showError(error.message);
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
        previewTimeout = setTimeout(() => {
          const preview = this.leagueManager.previewLeague(code);
          if (preview) {
            modal.querySelector('#preview-name').textContent = preview.leagueName;
            modal.querySelector('#preview-members').textContent = `${preview.memberCount}/${preview.maxMembers}`;
            modal.querySelector('#preview-season').textContent = preview.season;
            previewDiv.style.display = 'block';
            errorDiv.style.display = 'none';
          } else {
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

        // Refresh the page or update UI
        setTimeout(() => {
          window.location.reload();
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

      try {
        await this.leagueManager.updateLeagueSettings(leagueId, {
          maxMembers,
          autoPickEnabled
        });

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

// Export singleton instance
export const leagueModalManager = new LeagueModalManager(); 