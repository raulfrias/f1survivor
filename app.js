// Import storage utilities
import { saveUserPicks, loadUserPicks, isDriverAlreadyPicked, clearPickData, getCurrentSeason, getCurrentRacePick, addTestPreviousRacePicks } from './storage-utils.js';
import RaceCountdown from './race-countdown.js';
import { PickDeadlineManager } from './pick-deadline-manager.js';
import { AutoPickManager } from './auto-pick-manager.js';
import { PickChangeUtils } from './pick-change-utils.js';

console.log('app.js loaded - start');

// Check localStorage availability
let localStorageAvailable = true;
try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
} catch (e) {
    localStorageAvailable = false;
    console.warn('localStorage is not available. User picks will not be saved between sessions.');
}

// Constants
const GRID_SIZE = 20; // Move to top level

// BACKEND_INTEGRATION: Replace with API endpoint configuration
// const API_CONFIG = {
//     BASE_URL: '/api/v1',
//     ENDPOINTS: {
//         DRIVERS: '/drivers',
//         USER_PICKS: '/picks',
//         RACE_INFO: '/races/current'
//     }
// };

// Current GP information
// BACKEND_INTEGRATION: Replace with API call to get current race information
const currentGP = {
    name: "Monaco GP",
    deadline: "2025-05-25 12:00 UTC"
};

// Mock data for testing
// BACKEND_INTEGRATION: Replace with API call to get driver data
const mockDrivers = [
    // Red Bull Racing
    {
        id: 1,
        number: 1,
        name: "Max Verstappen",
        team: "Red Bull Racing",
        teamColor: "#3671C6",
        imageUrl: "assets/images/drivers/verstappen.png",
        isAlreadyPicked: false
    },
    {
        id: 2,
        number: 22,
        name: "Yuki Tsunoda",
        team: "Red Bull Racing",
        teamColor: "#3671C6",
        imageUrl: "assets/images/drivers/tsunoda.png",
        isAlreadyPicked: false
    },
    // Ferrari
    {
        id: 3,
        number: 16,
        name: "Charles Leclerc",
        team: "Ferrari",
        teamColor: "#E80020",
        imageUrl: "assets/images/drivers/leclerc.png",
        isAlreadyPicked: false
    },
    {
        id: 4,
        number: 44,
        name: "Lewis Hamilton",
        team: "Ferrari",
        teamColor: "#E80020",
        imageUrl: "assets/images/drivers/hamilton.png",
        isAlreadyPicked: false
    },
    // Mercedes
    {
        id: 5,
        number: 63,
        name: "George Russell",
        team: "Mercedes",
        teamColor: "#27F4D2",
        imageUrl: "assets/images/drivers/russell.png",
        isAlreadyPicked: false
    },
    {
        id: 6,
        number: 12,
        name: "Kimi Antonelli",
        team: "Mercedes",
        teamColor: "#27F4D2",
        imageUrl: "assets/images/drivers/antonelli.png",
        isAlreadyPicked: false
    },
    // McLaren
    {
        id: 7,
        number: 4,
        name: "Lando Norris",
        team: "McLaren",
        teamColor: "#FF8000",
        imageUrl: "assets/images/drivers/norris.png",
        isAlreadyPicked: false
    },
    {
        id: 8,
        number: 81,
        name: "Oscar Piastri",
        team: "McLaren",
        teamColor: "#FF8000",
        imageUrl: "assets/images/drivers/piastri.png",
        isAlreadyPicked: false
    },
    // Aston Martin
    {
        id: 9,
        number: 14,
        name: "Fernando Alonso",
        team: "Aston Martin",
        teamColor: "#229971",
        imageUrl: "assets/images/drivers/alonso.png",
        isAlreadyPicked: false
    },
    {
        id: 10,
        number: 18,
        name: "Lance Stroll",
        team: "Aston Martin",
        teamColor: "#229971",
        imageUrl: "assets/images/drivers/stroll.png",
        isAlreadyPicked: false
    },
    // Alpine
    {
        id: 11,
        number: 10,
        name: "Pierre Gasly",
        team: "Alpine",
        teamColor: "#0093CC",
        imageUrl: "assets/images/drivers/gasly.png",
        isAlreadyPicked: false
    },
    {
        id: 12,
        number: 43,
        name: "Franco Colapinto",
        team: "Alpine",
        teamColor: "#0093CC",
        imageUrl: "assets/images/drivers/colapinto.png",
        isAlreadyPicked: false
    },
    // Williams
    {
        id: 13,
        number: 23,
        name: "Alexander Albon",
        team: "Williams",
        teamColor: "#64C4FF",
        imageUrl: "assets/images/drivers/albon.png",
        isAlreadyPicked: false
    },
    {
        id: 14,
        number: 55,
        name: "Carlos Sainz",
        team: "Williams",
        teamColor: "#64C4FF",
        imageUrl: "assets/images/drivers/sainz.png",
        isAlreadyPicked: false
    },
    // Racing Bulls
    {
        id: 15,
        number: 6,
        name: "Isack Hadjar",
        team: "Racing Bulls",
        teamColor: "#6692FF",
        imageUrl: "assets/images/drivers/hadjar.png",
        isAlreadyPicked: false
    },
    {
        id: 16,
        number: 30,
        name: "Liam Lawson",
        team: "Racing Bulls",
        teamColor: "#6692FF",
        imageUrl: "assets/images/drivers/lawson.png",
        isAlreadyPicked: false
    },
    // Kick Sauber
    {
        id: 17,
        number: 27,
        name: "Nico Hulkenberg",
        team: "Kick Sauber",
        teamColor: "#52E252",
        imageUrl: "assets/images/drivers/hulkenberg.png",
        isAlreadyPicked: false
    },
    {
        id: 18,
        number: 5,
        name: "Gabriel Bortoleto",
        team: "Kick Sauber",
        teamColor: "#52E252",
        imageUrl: "assets/images/drivers/bortoleto.png",
        isAlreadyPicked: false
    },
    // Haas F1 Team
    {
        id: 19,
        number: 31,
        name: "Esteban Ocon",
        team: "Haas F1 Team",
        teamColor: "#B6BABD",
        imageUrl: "assets/images/drivers/ocon.png",
        isAlreadyPicked: false
    },
    {
        id: 20,
        number: 87,
        name: "Oliver Bearman",
        team: "Haas F1 Team",
        teamColor: "#B6BABD",
        imageUrl: "assets/images/drivers/bearman.png",
        isAlreadyPicked: false
    }
];

// User's previous picks (for demonstration)
// BACKEND_INTEGRATION: Replace with API call to get user's pick history
let userPicks = [];

// Currently selected driver
let selectedDriverId = null;

// UI Elements
let loadingOverlay, errorMessage, driverGrid, confirmPickBtn;
let makePickBtn, driverSelectionScreen;

function showLoading() {
    loadingOverlay.classList.add('active');
    confirmPickBtn.disabled = true;
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
    confirmPickBtn.disabled = false;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
}

function hideError() {
    errorMessage.classList.remove('active');
}

// Modal elements
let confirmationModal, confirmationDriverImage, confirmationDriverName, 
    confirmationDriverTeam, confirmationDriverNumber, finalConfirmBtn, cancelPickBtn;

// Show confirmation modal with driver details
function showConfirmationModal(driver) {
    console.log('Showing confirmation modal for driver:', driver);
    if (!confirmationModal) {
        console.error('Confirmation modal element not found!');
        return;
    }
    
    // Check if this is a change
    const currentPick = getCurrentRacePick();
    const isChanging = !!currentPick;
    
    // Set driver details
    confirmationDriverImage.src = driver.imageUrl;
    confirmationDriverImage.alt = driver.name;
    confirmationDriverName.textContent = driver.name;
    confirmationDriverTeam.textContent = driver.team;
    confirmationDriverTeam.style.color = driver.teamColor;
    confirmationDriverNumber.textContent = driver.number;
    
    // Update modal title and warning based on whether it's a change
    const modalTitle = confirmationModal.querySelector('h3');
    const warningText = confirmationModal.querySelector('.confirmation-warning p');
    
    if (isChanging && modalTitle) {
        modalTitle.textContent = 'Confirm Pick Change';
    } else if (modalTitle) {
        modalTitle.textContent = 'Confirm Your Pick';
    }
    
    if (isChanging && warningText && currentPick) {
        warningText.innerHTML = `<strong>Note:</strong> You are changing from ${currentPick.driverName} to ${driver.name}. You can continue to change your pick until 1 hour before the race.`;
    } else if (warningText) {
        warningText.innerHTML = '<strong>Remember:</strong> Once confirmed, you cannot pick this driver again this season.';
    }
    
    // Apply team color to some elements
    confirmationModal.style.setProperty('--accent-color', driver.teamColor);
    
    // Show modal
    confirmationModal.classList.add('active');
    console.log('Added active class to modal');
    
    // Add escape key listener
    document.addEventListener('keydown', handleConfirmationEscapeKey);
    
    // Add animations using Anime.js
    anime({
        targets: '.confirmation-modal-content',
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
    });
    
    anime({
        targets: '#confirmation-driver-image',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: 200,
        duration: 500,
        easing: 'easeOutQuad'
    });
}

// Hide confirmation modal
function hideConfirmationModal() {
    if (!confirmationModal) return;
    confirmationModal.classList.remove('active');
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleConfirmationEscapeKey);
}

// Handle escape key press
function handleConfirmationEscapeKey(e) {
    if (e.key === 'Escape') {
        hideConfirmationModal();
    }
}

// Initialize confirmation modal elements
function initializeConfirmationModal() {
    console.log('Initializing confirmation modal...');
    confirmationModal = document.getElementById('confirmation-modal');
    confirmationDriverImage = document.getElementById('confirmation-driver-image');
    confirmationDriverName = document.getElementById('confirmation-driver-name');
    confirmationDriverTeam = document.getElementById('confirmation-driver-team');
    confirmationDriverNumber = document.getElementById('confirmation-driver-number');
    finalConfirmBtn = document.getElementById('final-confirm-btn');
    cancelPickBtn = document.getElementById('cancel-pick-btn');
    const closeConfirmationModalBtn = document.getElementById('close-confirmation-modal-btn');
    
    // Log element existence
    console.log('Modal elements found:', {
        modal: !!confirmationModal,
        image: !!confirmationDriverImage,
        name: !!confirmationDriverName,
        team: !!confirmationDriverTeam,
        number: !!confirmationDriverNumber,
        confirmBtn: !!finalConfirmBtn,
        cancelBtn: !!cancelPickBtn,
        closeBtn: !!closeConfirmationModalBtn
    });
    
    if (!confirmationModal) {
        console.error('Confirmation modal not found in DOM');
        return;
    }
    
    // Add event listeners
    closeConfirmationModalBtn.addEventListener('click', hideConfirmationModal);
    cancelPickBtn.addEventListener('click', hideConfirmationModal);
    
    // Final confirmation button handling
    finalConfirmBtn.addEventListener('click', async () => {
        console.log('Final confirm button clicked');
        
        // Get the selected driver
        const selectedDriver = mockDrivers.find(d => d.id === selectedDriverId);
        if (!selectedDriver) {
            console.error('Selected driver not found');
            showError('Invalid driver selection. Please try again.');
            return;
        }
        
        try {
            hideConfirmationModal();
            showLoading();
            hideError();
            
            // Verify race data exists
            const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
            if (!raceData || !raceData.raceId) {
                throw new Error('Race data not initialized. Please refresh the page.');
            }
            
            // Add to user picks
            if (localStorageAvailable) {
                const driverInfo = {
                    driverName: selectedDriver.name,
                    teamName: selectedDriver.team,
                    isAutoPick: false
                };
                
                const savedPick = await saveUserPicks(selectedDriverId, driverInfo);
                if (!savedPick) {
                    throw new Error('Failed to save pick. Please try again.');
                }
                
                console.log('Successfully saved pick:', savedPick);
            }
            
            // Update UI with pick change capability check
            const deadlineManager = new PickDeadlineManager();
            const canChange = !deadlineManager.isDeadlinePassed();
            const currentPick = getCurrentRacePick();
            PickChangeUtils.updateMakePickButtonText(currentPick, canChange);
            driverSelectionScreen.style.display = 'none';
            
            // Add animation using Anime.js
            anime({
                targets: makePickBtn,
                scale: [1.1, 1],
                duration: 400,
                easing: 'easeOutElastic(1, .8)'
            });
        } catch (error) {
            console.error('Failed to submit pick:', error);
            showError(error.message || 'Failed to submit your pick. Please try again.');
            hideConfirmationModal();
        } finally {
            hideLoading();
        }
    });
    
    console.log('Confirmation modal initialized successfully');
}

async function renderDriverGrid() {
    try {
        showLoading();
        hideError();
        
        driverGrid.innerHTML = ''; // Clear existing content
        
        // Show loading skeletons
        for (let i = 0; i < GRID_SIZE; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'driver-card skeleton';
            skeleton.innerHTML = `
                <div class="img"></div>
                <div class="driver-name"></div>
                <div class="driver-team"></div>
            `;
            driverGrid.appendChild(skeleton);
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        driverGrid.innerHTML = ''; // Clear skeletons
        
        // Reset all drivers' picked status
        mockDrivers.forEach(driver => {
            driver.isAlreadyPicked = false;
        });
        
        // Load user picks and update driver states
        if (localStorageAvailable) {
            try {
                const picks = loadUserPicks();
                console.log('Loaded picks for grid:', picks);
                
                if (Array.isArray(picks)) {
                    // Update each driver's picked status
                    mockDrivers.forEach(driver => {
                        const isPicked = picks.some(pick => {
                            const pickDriverId = typeof pick === 'object' ? pick.driverId : pick;
                            return pickDriverId === driver.id;
                        });
                        driver.isAlreadyPicked = isPicked;
                        console.log(`Driver ${driver.name} (${driver.id}) picked status:`, isPicked);
                    });
                } else {
                    console.error('Picks is not an array:', picks);
                }
            } catch (error) {
                console.error('Error loading picks:', error);
            }
        }
        
        // Debug: Log state before rendering
        console.log('Rendering grid with drivers:', mockDrivers.map(d => ({
            name: d.name,
            id: d.id,
            isAlreadyPicked: d.isAlreadyPicked
        })));
        
        mockDrivers.forEach(driver => {
            const card = document.createElement('div');
            card.className = `driver-card${driver.isAlreadyPicked ? ' picked' : ''}`;
            card.dataset.driverId = driver.id;
            
            // Convert hex color to RGB for alpha variations
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            };
            
            const rgb = hexToRgb(driver.teamColor);
            
            if (rgb) {
                card.style.setProperty('--team-color', driver.teamColor);
                card.style.setProperty('--team-color-alpha', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
            }
            
            card.innerHTML = `
                <img src="${driver.imageUrl}" alt="${driver.name}" onerror="this.src='assets/images/drivers/default.svg'">
                <div class="driver-name">${driver.name}</div>
                <div class="driver-team" style="color: ${driver.teamColor}">${driver.team}</div>
                ${driver.isAlreadyPicked ? '<div class="tooltip">Already picked in a previous race</div>' : ''}
            `;
            
            // Add tooltip positioning for picked drivers
            if (driver.isAlreadyPicked) {
                const tooltip = card.querySelector('.tooltip');
                if (tooltip) {
                    card.addEventListener('mouseenter', () => {
                        const cardRect = card.getBoundingClientRect();
                        const tooltipRect = tooltip.getBoundingClientRect();
                        
                        // Position tooltip above the card, centered
                        const top = cardRect.top - tooltipRect.height - 10;
                        const left = cardRect.left + (cardRect.width - tooltipRect.width) / 2;
                        
                        // Ensure tooltip doesn't go off screen
                        const windowWidth = window.innerWidth;
                        const adjustedLeft = Math.max(10, Math.min(left, windowWidth - tooltipRect.width - 10));
                        const adjustedTop = Math.max(10, top);
                        
                        tooltip.style.top = `${adjustedTop}px`;
                        tooltip.style.left = `${adjustedLeft}px`;
                    });
                }
            }
            
            driverGrid.appendChild(card);
        });
        
        // Highlight current pick in the grid
        const currentPick = getCurrentRacePick();
        PickChangeUtils.highlightCurrentPickInGrid(currentPick);
    } catch (error) {
        console.error('Error rendering driver grid:', error);
        showError('Failed to load drivers. Please try again.');
    } finally {
        hideLoading();
    }
}

// Initialize driver selection with deadline logic
const initializeDriverSelection = () => {
    console.log('Initializing driver selection...');
    
    // Get UI elements first
    makePickBtn = document.getElementById('make-pick-btn');
    driverSelectionScreen = document.getElementById('driver-selection-screen');
    const closeSelectionBtn = document.getElementById('close-selection-btn');
    confirmPickBtn = document.getElementById('confirm-pick-btn');
    loadingOverlay = document.getElementById('loading-overlay');
    errorMessage = document.getElementById('error-message');
    driverGrid = document.getElementById('driver-grid');

    // Check if all required elements are present
    const requiredElements = {
        makePickBtn,
        driverSelectionScreen,
        closeSelectionBtn,
        confirmPickBtn,
        loadingOverlay,
        errorMessage,
        driverGrid
    };
    
    const missingElements = Object.entries(requiredElements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);
    
    if (missingElements.length > 0) {
        throw new Error(`Missing required elements in initializeDriverSelection: ${missingElements.join(', ')}`);
    }

    // Initialize the confirmation modal
    initializeConfirmationModal();
    
    // Initialize auto-pick manager
    const autoPickManager = new AutoPickManager();
    autoPickManager.debug = false; // Set to false
    autoPickManager.qualifyingManager.debug = false; // Set to false
    autoPickManager.initialize();
    
    // Initialize deadline manager
    const deadlineManager = new PickDeadlineManager();
    const isDeadlinePassed = deadlineManager.initialize({
        onDeadlineApproaching: (timeRemaining) => {
            console.log('Deadline approaching callback triggered:', timeRemaining);
            
            // Update warning message
            const statusElement = document.createElement('div');
            statusElement.id = 'deadline-message';
            
            // Add urgent class if less than 30 minutes remaining
            const isUrgent = timeRemaining.hours === 0 && timeRemaining.minutes < 30;
            statusElement.className = `deadline-status deadline-warning${isUrgent ? ' urgent' : ''}`;
            statusElement.textContent = `Selection closes in: ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
            
            // Add pick change deadline warning
            const currentPick = getCurrentRacePick();
            if (currentPick && timeRemaining.totalMinutes < 60) {
                console.log('Warning user about pick change deadline approaching');
            }
            
            // Update or add the status element in the modal
            const existingStatus = document.getElementById('deadline-message');
            const driverSelectionContent = document.querySelector('.driver-selection-content');
            const driverGrid = document.querySelector('.driver-grid');
            
            if (existingStatus) {
                console.log('Replacing existing status element');
                existingStatus.replaceWith(statusElement);
            } else if (driverSelectionContent && driverGrid) {
                console.log('Inserting new status element');
                driverSelectionContent.insertBefore(statusElement, driverGrid);
            }
            
            // Update countdown container warning
            const countdownWarning = document.querySelector('.race-countdown-container .pick-status');
            if (countdownWarning) {
                countdownWarning.className = `pick-status${isUrgent ? ' urgent' : ''}`;
                countdownWarning.textContent = 'Pick deadline approaching!';
            }
        },
        onDeadlinePassed: () => {
            console.log('Deadline passed callback triggered');
            
            // Update the countdown container
            const countdownWarning = document.querySelector('.race-countdown-container .pick-status');
            if (countdownWarning) {
                countdownWarning.className = 'pick-status deadline-passed';
                countdownWarning.textContent = 'Selection locked: Deadline has passed';
            }
            
            // Disable the make pick button
            if (makePickBtn) {
                makePickBtn.disabled = true;
                makePickBtn.style.opacity = '0.5';
                makePickBtn.style.cursor = 'not-allowed';
                
                // Update button text to remove (CHANGE) if present
                const currentPick = getCurrentRacePick();
                if (currentPick) {
                    const lastName = currentPick.driverName.split(' ').pop();
                    makePickBtn.textContent = `PICKED: ${lastName.toUpperCase()}`;
                }
            }
            
            // Check if a pick was made
            const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
            const userPicks = loadUserPicks();
            console.log('Checking for existing pick:', { raceData, userPicks });
            
            const existingPick = userPicks.find(pick => pick.raceId === raceData?.raceId);
            console.log('Existing pick found:', existingPick);
            
            if (raceData && !existingPick) {
                console.log('No pick made before deadline, triggering auto-pick');
                // Trigger auto-pick event
                const autoPick = new CustomEvent('triggerAutoPick', {
                    detail: { 
                        raceId: raceData.raceId,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log('Dispatching auto-pick event:', autoPick);
                window.dispatchEvent(autoPick);
            } else {
                console.log('Pick already exists or no race data available');
            }
        }
    });

    // Update make pick button state immediately if deadline is passed
    if (isDeadlinePassed) {
        console.log('Deadline is passed, disabling button');
        makePickBtn.disabled = true;
        makePickBtn.style.opacity = '0.5';
        makePickBtn.style.cursor = 'not-allowed';
        
        // Update button text to remove (CHANGE) if present
        const currentPick = getCurrentRacePick();
        if (currentPick) {
            const lastName = currentPick.driverName.split(' ').pop();
            makePickBtn.textContent = `PICKED: ${lastName.toUpperCase()}`;
        }
        
        // Also update the countdown warning
        const countdownWarning = document.querySelector('.race-countdown-container .pick-status');
        if (countdownWarning) {
            countdownWarning.className = 'pick-status deadline-passed';
            countdownWarning.textContent = 'Selection locked: Deadline has passed';
        }
    }

    // Make variables available globally for debugging
    window.mockDrivers = mockDrivers;
    window.userPicks = userPicks;
    
    // Load user picks from localStorage if available
    if (localStorageAvailable) {
        try {
            const savedPicks = loadUserPicks();
            if (savedPicks && savedPicks.length > 0) {
                // Update the mockDrivers array with previously picked drivers
                savedPicks.forEach(pick => {
                    const driver = mockDrivers.find(d => d.id === pick.driverId);
                    if (driver) {
                        driver.isAlreadyPicked = true;
                    }
                });
                
                // Update the button text based on current race pick
                const currentRacePick = getCurrentRacePick();
                if (currentRacePick) {
                    const deadlineManager = new PickDeadlineManager();
                    const canChange = !deadlineManager.isDeadlinePassed();
                    PickChangeUtils.updateMakePickButtonText(currentRacePick, canChange);
                }
                
                console.log('Loaded user picks from localStorage:', savedPicks);
            }
        } catch (error) {
            console.error('Failed to load picks from localStorage:', error);
        }
    }

    // Open modal and render grid
    makePickBtn.addEventListener('click', () => {
        console.log('Make pick button clicked');
        
        // Check if button is disabled
        if (makePickBtn.disabled) {
            console.log('Button is disabled, ignoring click');
            return;
        }
        
        // Check if this is a change vs new pick
        const currentPick = getCurrentRacePick();
        const isChanging = !!currentPick;
        
        console.log('Current pick:', currentPick);
        console.log('Is changing:', isChanging);
        
        selectedDriverId = null;
        driverSelectionScreen.style.display = 'flex';
        
        // Show current pick info if changing
        PickChangeUtils.showCurrentPickInModal(currentPick);
        PickChangeUtils.updateConfirmButton(isChanging);
        
        renderDriverGrid();
    });

    // Close modal
    closeSelectionBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        driverSelectionScreen.style.display = 'none';
        hideError();
    });

    // Handle driver selection
    driverGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.driver-card');
        if (!card || card.classList.contains('skeleton')) return;

        const driverId = parseInt(card.dataset.driverId);
        const driver = mockDrivers.find(d => d.id === driverId);
        
        // Get current race pick
        const currentPick = getCurrentRacePick();
        
        // If this is the current pick for this race, allow selecting it again
        if (currentPick && currentPick.driverId === driverId) {
            card.classList.add('selected');
            selectedDriverId = driverId;
            hideError();
            return;
        }
        
        // Otherwise, check if it was picked in a previous race
        if (driver.isAlreadyPicked) {
            showError('You have already picked this driver in a previous race!');
            return;
        }

        const previouslySelected = document.querySelector('.driver-card.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        card.classList.add('selected');
        selectedDriverId = driverId;
        hideError();
    });

    // Handle confirm pick
    confirmPickBtn.addEventListener('click', async () => {
        if (!selectedDriverId) {
            showError('Please select a driver first!');
            return;
        }

        const selectedDriver = mockDrivers.find(d => d.id === selectedDriverId);
        if (!selectedDriver) {
            showError('Invalid driver selection!');
            return;
        }

        if (localStorageAvailable && isDriverAlreadyPicked(selectedDriverId)) {
            showError('You have already picked this driver in a previous race!');
            return;
        }

        // Instead of directly proceeding, show confirmation modal
        showConfirmationModal(selectedDriver);
    });

    console.log('Driver selection initialized successfully');
};

// BACKEND_INTEGRATION: Add authentication state management
// function isUserAuthenticated() {
//     const token = localStorage.getItem('userToken');
//     return token && !isTokenExpired(token);
// }

// BACKEND_INTEGRATION: Add token management
// function getUserToken() {
//     return localStorage.getItem('userToken');
// }

// Add utility function for formatting dates
function formatDeadlineForUser(utcDeadline) {
    const date = new Date(utcDeadline);
    return new Intl.DateTimeFormat(navigator.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short'
    }).format(date);
}

// Update GP info display
function updateGPInfo(raceData) {
    try {
        // Get deadline from race data
        if (raceData && raceData.pickDeadline) {
            const friendlyDeadline = formatDeadlineForUser(raceData.pickDeadline);
            
            // Update main page deadline
            const deadlineElement = document.getElementById('selection-deadline');
            if (deadlineElement) {
                deadlineElement.textContent = `Selection deadline: ${friendlyDeadline}`;
            }
            
            // Update modal deadline
            const modalDeadlineElement = document.querySelector('#driver-selection-screen .deadline');
            if (modalDeadlineElement) {
                modalDeadlineElement.textContent = `Selection deadline: ${friendlyDeadline}`;
            }
        }
        
        // Update GP name
        const gpNameElement = document.getElementById('current-gp-name');
        if (gpNameElement && raceData) {
            gpNameElement.textContent = raceData.raceName || currentGP.name;
        }
    } catch (error) {
        console.error('Error updating GP info:', error);
    }
}

// Initialize driver selection
async function initializeApp() {
    try {
        // Get UI elements first
        const countdownContainer = document.getElementById('race-countdown-container');
        const makePickBtn = document.getElementById('make-pick-btn');
        const driverSelectionScreen = document.getElementById('driver-selection-screen');
        const closeSelectionBtn = document.getElementById('close-selection-btn');
        const confirmPickBtn = document.getElementById('confirm-pick-btn');
        const loadingOverlay = document.getElementById('loading-overlay');
        const errorMessage = document.getElementById('error-message');
        const driverGrid = document.getElementById('driver-grid');
        
        // Check if all required elements are present
        const requiredElements = {
            countdownContainer,
            makePickBtn,
            driverSelectionScreen,
            closeSelectionBtn,
            confirmPickBtn,
            loadingOverlay,
            errorMessage,
            driverGrid
        };
        
        const missingElements = Object.entries(requiredElements)
            .filter(([_, element]) => !element)
            .map(([name]) => name);
        
        if (missingElements.length > 0) {
            throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }
        
        // Initialize Race Countdown Timer
        const raceCountdown = new RaceCountdown(countdownContainer);
        await raceCountdown.initialize();
        console.log('Race countdown timer initialized');
        
        // Get race data
        const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
        if (!raceData || !raceData.raceId) {
            throw new Error('Race data initialization failed');
        }
        
        // Update GP info with user-friendly deadline
        updateGPInfo(raceData);
        
        // Initialize driver selection
        initializeDriverSelection();
        
    } catch (error) {
        console.error('App initialization failed:', error);
        // Show error to user
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message active';
        errorContainer.textContent = 'Failed to initialize app. Please refresh the page.';
        document.body.prepend(errorContainer);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, starting app initialization');
    initializeApp().catch(error => {
        console.error('App initialization failed:', error);
        // Show error to user
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message active';
        errorContainer.textContent = 'Failed to initialize app. Please refresh the page.';
        document.body.prepend(errorContainer);
    });
});

// Debug/Testing Tools
function clearAllPicksData() {
    if (confirm('Are you sure you want to clear all your pick data? This cannot be undone.')) {
        if (localStorageAvailable) {
            clearPickData();
        }
        userPicks = [];
        mockDrivers.forEach(driver => {
            driver.isAlreadyPicked = false;
        });
        alert('All pick data has been cleared.');
        // Refresh the page to show changes
        window.location.reload();
    }
}

// Debug function to check driver state (keeping this as it's useful for troubleshooting)
function checkDriverState(driverName) {
    const driver = mockDrivers.find(d => d.name === driverName);
    if (driver) {
        console.log(`Driver state for ${driverName}:`, {
            id: driver.id,
            isAlreadyPicked: driver.isAlreadyPicked,
            team: driver.team,
            number: driver.number
        });
    } else {
        console.log(`Driver ${driverName} not found`);
    }
    return driver;
}

// Add test function for previous race picks
function simulatePreviousRacePicks() {
    if (confirm('Add test data for previous race picks?')) {
        if (addTestPreviousRacePicks()) {
            alert('Test data added. Max Verstappen and Lando Norris were picked in previous races.');
            // Refresh the page to show changes
            window.location.reload();
        } else {
            alert('Failed to add test data. Check console for errors.');
        }
    }
}

// Make debug functions available globally
window.clearAllPicksData = clearAllPicksData;
window.checkDriverState = checkDriverState;
window.simulatePreviousRacePicks = simulatePreviousRacePicks;

// Wrap all anime.js related code in try-catch
try {
    // F1 Starting Lights Sequence
    function startLightsSequence() {
        const row1Lights = Array.from(document.querySelector('.lights-row.row1').querySelectorAll('.light'));
        const row2Lights = Array.from(document.querySelector('.lights-row.row2').querySelectorAll('.light'));
        
        // Turn off all lights first
        const allLights = [...row1Lights, ...row2Lights];
        allLights.forEach(light => {
            light.classList.remove('on');
            anime.set(light, { scale: 1, opacity: 1 });
        });
        
        // Create the timeline
        const timeline = anime.timeline({
            easing: 'easeInOutQuad'
        });

        // Light up each column (left to right)
        for (let col = 0; col < 5; col++) {
            timeline.add({
                targets: [row1Lights[col], row2Lights[col]],
                scale: [
                    {value: 0.8, duration: 100},
                    {value: 1.2, duration: 300},
                    {value: 1, duration: 200}
                ],
                begin: function(anim) {
                    row1Lights[col].classList.add('on');
                    row2Lights[col].classList.add('on');
                }
            }, col * 800);
        }

        // Add lights-out animation
        timeline.add({
            targets: allLights,
            scale: [1, 0.8],
            opacity: 0.5,
            duration: 300,
            delay: anime.stagger(50),
            begin: function() {
                allLights.forEach(light => light.classList.remove('on'));
            }
        }, '+=2000');

        // Restart sequence
        timeline.finished.then(() => {
            setTimeout(startLightsSequence, 3000);
        });
    }

    // Start the sequence after initial delay
    setTimeout(startLightsSequence, 2000);

    // Create grid background
    const gridBackground = document.querySelector('.grid-background');
    if (gridBackground) {
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const dot = document.createElement('div');
            dot.className = 'grid-dot';
            dot.style.width = '2px';
            dot.style.height = '2px';
            dot.style.background = 'var(--grid-color)';
            dot.style.borderRadius = '50%';
            gridBackground.appendChild(dot);
        }

        // Grid animation on hover
        document.addEventListener('mousemove', (e) => {
            const rect = gridBackground.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            anime({
                targets: '.grid-dot',
                scale: [
                    { value: 1 },
                    { value: 1.5 },
                    { value: 1 }
                ],
                duration: 900,
                easing: 'easeOutElastic(1, .5)',
                delay: anime.stagger(100, {
                    grid: [GRID_SIZE, GRID_SIZE],
                    from: Math.floor(y / (rect.height / GRID_SIZE)) * GRID_SIZE + Math.floor(x / (rect.width / GRID_SIZE))
                })
            });
        });
    }

    // Animate text elements
    const textElements = document.querySelectorAll('.animate-text');
    if (textElements.length > 0) {
        anime.timeline({
            easing: 'easeOutExpo',
        })
        .add({
            targets: '.title span',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 1200,
            delay: anime.stagger(200),
        })
        .add({
            targets: '.description p',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            delay: anime.stagger(100),
        }, '-=800');
    }

    // Button hover animation
    const button = document.querySelector('.cta-button');
    if (button) {
        button.addEventListener('mouseenter', () => {
            anime({
                targets: button,
                scale: 1.05,
                duration: 300,
                easing: 'easeOutElastic(1, .5)'
            });
        });

        button.addEventListener('mouseleave', () => {
            anime({
                targets: button,
                scale: 1,
                duration: 300,
                easing: 'easeOutElastic(1, .5)'
            });
        });
    }

    // Track motion path animation
    const path = document.querySelector('.motion-path');
    if (path) {
        const pathLength = anime.setDashoffset(path);

        // Draw path animation (one time, no disappearing)
        anime({
            targets: '.motion-path',
            strokeDasharray: pathLength,
            strokeDashoffset: [pathLength, 0],
            duration: 3000,
            easing: 'easeInOutQuad',
            complete: function() {
                // Keep the path visible after animation
                path.style.strokeDasharray = 'none';
            }
        });

        // Car animation with path drawing effect
        const motionPath = anime.path('.motion-path');

        // Animate the car along the path
        anime({
            targets: '.car-dot',
            translateX: motionPath('x'),
            translateY: motionPath('y'),
            rotate: motionPath('angle'),
            easing: 'linear',
            duration: 8000,
            loop: true
        });

        // Line drawing animation following the motion path
        anime({
            targets: '.motion-path',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'linear',
            duration: 4000,
            loop: true,
            direction: 'alternate'
        });
    }

} catch (error) {
    console.error('Error in anime.js animations:', error);
}

// Add test function for deadline manager
window.testDeadlineManager = async () => {
    const manager = new PickDeadlineManager({ debug: false });
    
    // Test 1: Normal Initialization
    manager.initialize();
    
    // Test 2: Missing Race Data
    localStorage.removeItem('nextRaceData');
    manager.loadRaceData();
    
    // Test 3: Deadline Approaching
    const futureDate = new Date(Date.now() + 30000);
    localStorage.setItem('nextRaceData', JSON.stringify({
        raceId: 'test-race',
        pickDeadline: futureDate.toISOString()
    }));
    manager.initialize();
    
    // Test 4: Invalid Race Data
    localStorage.setItem('nextRaceData', JSON.stringify({
        raceId: 'test-race'
        // Missing pickDeadline
    }));
    manager.loadRaceData();
};

console.log('app.js loaded - end');