console.log('app.js loaded - start');

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
    name: "Monaco Grand Prix",
    deadline: "2024-05-26 14:00 UTC"
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
        isAlreadyPicked: true
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

async function renderDriverGrid() {
    try {
        showLoading();
        hideError();
        
        // BACKEND_INTEGRATION: Replace with API call
        // const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVERS}`);
        // if (!response.ok) throw new Error('Failed to fetch drivers');
        // const drivers = await response.json();
        
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
            
            driverGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error rendering driver grid:', error);
        showError('Failed to load drivers. Please try again.');
    } finally {
        hideLoading();
    }
}

// Update the driver selection initialization
const initializeDriverSelection = () => {
    console.log('Initializing driver selection...');
    
    // Get UI elements
    const makePickBtn = document.getElementById('make-pick-btn');
    const driverSelectionScreen = document.getElementById('driver-selection-screen');
    const closeSelectionBtn = document.getElementById('close-selection-btn');
    confirmPickBtn = document.getElementById('confirm-pick-btn');
    loadingOverlay = document.getElementById('loading-overlay');
    errorMessage = document.getElementById('error-message');
    driverGrid = document.getElementById('driver-grid');

    if (!makePickBtn || !driverSelectionScreen || !closeSelectionBtn || !confirmPickBtn || !loadingOverlay || !errorMessage || !driverGrid) {
        console.error('Some elements not found');
        return;
    }

    // Update GP info
    document.getElementById('current-gp-name').textContent = currentGP.name;
    document.getElementById('selection-deadline').textContent = currentGP.deadline;

    // Open modal and render grid
    makePickBtn.addEventListener('click', () => {
        console.log('Make pick button clicked');
        selectedDriverId = null;
        driverSelectionScreen.style.display = 'flex';
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
        if (!card || card.classList.contains('picked') || card.classList.contains('skeleton')) return;

        const driverId = parseInt(card.dataset.driverId);
        const driver = mockDrivers.find(d => d.id === driverId);
        
        if (!driver || driver.isAlreadyPicked) return;

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

        if (userPicks.includes(selectedDriverId)) {
            showError('You have already picked this driver in a previous race!');
            return;
        }

        try {
            showLoading();
            hideError();
            
            // BACKEND_INTEGRATION: Submit pick to server
            // const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_PICKS}`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${getUserToken()}`
            //     },
            //     body: JSON.stringify({
            //         driverId: selectedDriverId,
            //         raceId: currentGP.id
            //     })
            // });
            // 
            // if (!response.ok) throw new Error('Failed to submit pick');
            // const result = await response.json();
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Add to user picks and mark as picked
            userPicks.push(selectedDriverId);
            
            alert(`You picked ${selectedDriver.name}!`);
            makePickBtn.textContent = `PICKED: ${selectedDriver.name.split(' ')[1].toUpperCase()}`;
            driverSelectionScreen.style.display = 'none';
        } catch (error) {
            console.error('Failed to submit pick:', error);
            showError('Failed to submit your pick. Please try again.');
        } finally {
            hideLoading();
        }
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

// Initialize driver selection immediately
initializeDriverSelection();

// Add tooltip positioning logic
function updateTooltipPosition(card) {
    const tooltip = card.querySelector('.tooltip');
    if (!tooltip) return;

    const cardRect = card.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Position tooltip above the card
    const top = cardRect.top - tooltipRect.height - 10;
    const left = cardRect.left + (cardRect.width - tooltipRect.width) / 2;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

// Add event listeners for tooltip positioning
document.querySelectorAll('.driver-card.picked').forEach(card => {
    card.addEventListener('mouseenter', () => updateTooltipPosition(card));
    card.addEventListener('mousemove', () => updateTooltipPosition(card));
});

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

console.log('app.js loaded - end');