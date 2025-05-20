console.log('app.js loaded - start');

// Constants
const GRID_SIZE = 20; // Move to top level

// Driver Selection Modal Functionality - Move this to the top
const initializeDriverSelection = () => {
    console.log('Initializing driver selection...');
    
    const makePickBtn = document.getElementById('make-pick-btn');
    const driverSelectionScreen = document.getElementById('driver-selection-screen');
    const closeSelectionBtn = document.getElementById('close-selection-btn');
    const driverGrid = document.getElementById('driver-grid');
    const confirmPickBtn = document.getElementById('confirm-pick-btn');

    if (!makePickBtn || !driverSelectionScreen || !closeSelectionBtn || !driverGrid || !confirmPickBtn) {
        console.error('Some elements not found:', {
            makePickBtn: !!makePickBtn,
            driverSelectionScreen: !!driverSelectionScreen,
            closeSelectionBtn: !!closeSelectionBtn,
            driverGrid: !!driverGrid,
            confirmPickBtn: !!confirmPickBtn
        });
        return;
    }

    console.log('All elements found, setting up event listeners...');

    // Mock data for testing
    const currentGP = {
        name: "Monaco Grand Prix",
        deadline: "2024-05-26 14:00 UTC"
    };

    // Update GP info
    document.getElementById('current-gp-name').textContent = currentGP.name;
    document.getElementById('selection-deadline').textContent = currentGP.deadline;

    // Open modal
    makePickBtn.addEventListener('click', () => {
        console.log('Make pick button clicked');
        driverSelectionScreen.style.display = 'flex';
    });

    // Close modal
    closeSelectionBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        driverSelectionScreen.style.display = 'none';
    });

    // Handle driver selection
    let selectedDriver = null;
    driverGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.driver-card');
        if (!card || card.classList.contains('picked')) return;

        console.log('Driver card clicked:', card);

        // Remove previous selection
        const previouslySelected = driverGrid.querySelector('.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        // Add new selection
        card.classList.add('selected');
        selectedDriver = card;
    });

    // Handle confirm pick
    confirmPickBtn.addEventListener('click', () => {
        if (!selectedDriver) {
            alert('Please select a driver first!');
            return;
        }
        const driverName = selectedDriver.querySelector('.driver-name').textContent;
        alert(`You picked ${driverName}!`);
        driverSelectionScreen.style.display = 'none';
        makePickBtn.textContent = `PICKED: ${driverName.split(' ')[1].toUpperCase()}`;
    });

    console.log('Driver selection initialized successfully');
};

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