// Pick Change Utility Functions (MVP)
import { loadUserPicks, getCurrentRacePick } from './storage-utils.js';
import { PickDeadlineManager } from './pick-deadline-manager.js';

export const PickChangeUtils = {
  // Check if user can change their pick (deadline not passed)
  canChangePick(raceId) {
    try {
      const deadlineManager = new PickDeadlineManager();
      deadlineManager.loadRaceData(); // Load race data first
      const isDeadlinePassed = deadlineManager.initialize(); // Then initialize
      return !isDeadlinePassed;
    } catch (error) {
      console.error('Error checking if pick can be changed:', error);
      return false; // Default to not allowing changes if there's an error
    }
  },
  
  // Update button text based on pick state
  updateMakePickButtonText(currentPick, canChange) {
    try {
      const makePickBtn = document.getElementById('make-pick-btn');
      if (!makePickBtn) {
        console.warn('Make pick button not found in DOM');
        return;
      }
      
      if (!currentPick) {
        makePickBtn.textContent = 'MAKE YOUR PICK';
      } else if (canChange) {
        const driverName = currentPick.driverName || 'Unknown Driver';
        const lastName = driverName.split(' ').pop();
        makePickBtn.textContent = `PICKED: ${lastName.toUpperCase()} (CHANGE)`;
      } else {
        const driverName = currentPick.driverName || 'Unknown Driver';
        const lastName = driverName.split(' ').pop();
        makePickBtn.textContent = `PICKED: ${lastName.toUpperCase()}`;
      }
    } catch (error) {
      console.error('Error updating make pick button text:', error);
    }
  },
  
  // Show current pick info in modal
  showCurrentPickInModal(currentPick) {
    try {
      const display = document.getElementById('current-pick-display');
      const nameElement = document.getElementById('current-pick-name');
      const modalTitle = document.querySelector('#driver-selection-screen h2');
      
      if (!display || !nameElement) {
        console.warn('Current pick display elements not found in DOM');
        return;
      }
      
      if (currentPick) {
        display.style.display = 'block';
        nameElement.textContent = currentPick.driverName || 'Unknown Driver';
        if (modalTitle) {
          const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
          const raceName = raceData?.raceName || 'Next Race';
          modalTitle.textContent = `Change Your Pick for ${raceName}`;
        }
      } else {
        display.style.display = 'none';
        if (modalTitle) {
          const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
          const raceName = raceData?.raceName || 'Next Race';
          modalTitle.textContent = `Pick Your Driver for ${raceName}`;
        }
      }
    } catch (error) {
      console.error('Error showing current pick in modal:', error);
    }
  },
  
  // Highlight current pick in driver grid
  highlightCurrentPickInGrid(currentPick) {
    try {
      if (!currentPick) return;
      
      // Remove any existing current-pick class
      const existingHighlight = document.querySelector('.driver-card.current-pick');
      if (existingHighlight) {
        existingHighlight.classList.remove('current-pick');
      }
      
      // Add current-pick class to the current driver
      const currentCard = document.querySelector(`[data-driver-id="${currentPick.driverId}"]`);
      if (currentCard) {
        currentCard.classList.add('current-pick');
      }
    } catch (error) {
      console.error('Error highlighting current pick in grid:', error);
    }
  },
  
  // Update confirmation button for change mode
  updateConfirmButton(isChanging) {
    try {
      const confirmBtn = document.getElementById('confirm-pick-btn');
      if (!confirmBtn) {
        console.warn('Confirm button not found in DOM');
        return;
      }
      
      if (isChanging) {
        confirmBtn.textContent = 'Confirm Change';
        confirmBtn.classList.add('change-mode');
      } else {
        confirmBtn.textContent = 'Confirm Pick';
        confirmBtn.classList.remove('change-mode');
      }
    } catch (error) {
      console.error('Error updating confirm button:', error);
    }
  }
}; 