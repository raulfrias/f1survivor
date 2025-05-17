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
const gridSize = 20;

for (let i = 0; i < gridSize * gridSize; i++) {
    const dot = document.createElement('div');
    dot.className = 'grid-dot';
    dot.style.width = '2px';
    dot.style.height = '2px';
    dot.style.background = 'var(--grid-color)';
    dot.style.borderRadius = '50%';
    gridBackground.appendChild(dot);
}

// Animate text elements
const textElements = document.querySelectorAll('.animate-text');
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

// Cursor follower animation
const cursor = document.querySelector('.cursor-follower');
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Show cursor on first move
    if (cursor.style.opacity === '0') {
        cursor.style.opacity = '1';
    }
});

// Smooth cursor animation
function animateCursor() {
    const dx = mouseX - cursorX;
    const dy = mouseY - cursorY;
    
    cursorX += dx * 0.1;
    cursorY += dy * 0.1;
    
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(animateCursor);
}

animateCursor();

// Grid animation on hover
let gridAnimation = null;
document.addEventListener('mousemove', (e) => {
    const rect = gridBackground.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (gridAnimation) gridAnimation.pause();
    
    gridAnimation = anime({
        targets: '.grid-dot',
        scale: [
            { value: 1 },
            { value: 1.5 },
            { value: 1 }
        ],
        duration: 900,
        easing: 'easeOutElastic(1, .5)',
        delay: anime.stagger(100, {
            grid: [gridSize, gridSize],
            from: Math.floor(y / (rect.height / gridSize)) * gridSize + Math.floor(x / (rect.width / gridSize))
        })
    });
});

// Button hover animation
const button = document.querySelector('.cta-button');
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

// Track motion path animation
const path = document.querySelector('.motion-path');
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
const carAnimation = anime({
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