// Monaco 2025 Test Scenarios
const mockMonacoData = {
    // Race Data
    nextRaceData: {
        raceId: "monaco-2025",
        raceName: "Monaco Grand Prix 2025",
        qualifyingDate: "2025-05-25",
        pickDeadline: "2025-05-26T12:00:00Z",
        raceCircuit: "Circuit de Monaco"
    },

    // Mock Qualifying Results (realistic Monaco order)
    qualifyingResults: {
        raceId: "monaco-2025",
        results: [
            { driverId: 1, full_name: "Max Verstappen", position: 1, team_name: "Red Bull Racing" },
            { driverId: 16, full_name: "Charles Leclerc", position: 2, team_name: "Ferrari" },
            { driverId: 55, full_name: "Carlos Sainz", position: 3, team_name: "Ferrari" },
            { driverId: 11, full_name: "Sergio Perez", position: 4, team_name: "Red Bull Racing" },
            { driverId: 44, full_name: "Lewis Hamilton", position: 5, team_name: "Mercedes" },
            { driverId: 63, full_name: "George Russell", position: 6, team_name: "Mercedes" },
            { driverId: 81, full_name: "Oscar Piastri", position: 7, team_name: "McLaren" },
            { driverId: 4, full_name: "Lando Norris", position: 8, team_name: "McLaren" },
            { driverId: 14, full_name: "Fernando Alonso", position: 9, team_name: "Aston Martin" },
            { driverId: 18, full_name: "Lance Stroll", position: 10, team_name: "Aston Martin" },
            { driverId: 23, full_name: "Alex Albon", position: 11, team_name: "Williams" },
            { driverId: 3, full_name: "Daniel Ricciardo", position: 12, team_name: "Racing Bulls" },
            { driverId: 22, full_name: "Yuki Tsunoda", position: 13, team_name: "Racing Bulls" },
            { driverId: 77, full_name: "Valtteri Bottas", position: 14, team_name: "Kick Sauber" },
            { driverId: 27, full_name: "Nico Hulkenberg", position: 15, team_name: "Kick Sauber" },
            { driverId: 31, full_name: "Esteban Ocon", position: 16, team_name: "Alpine" },
            { driverId: 10, full_name: "Pierre Gasly", position: 17, team_name: "Alpine" },
            { driverId: 2, full_name: "Logan Sargeant", position: 18, team_name: "Williams" },
            { driverId: 20, full_name: "Kevin Magnussen", position: 19, team_name: "Haas F1 Team" },
            { driverId: 24, full_name: "Zhou Guanyu", position: 20, team_name: "Haas F1 Team" }
        ],
        timestamp: new Date().toISOString()
    }
};

// Test Scenarios that work with the actual index.html interface
const TestScenarios = {
    // Simulate qualifying completion - Test Case 1
    simulateQualiDone() {
        localStorage.clear(); // Start fresh
        
        // Set qualifying time to 2 hours ago, deadline to 10 hours from now, race to 24 hours from now
        const now = new Date();
        const mockData = {
            ...mockMonacoData.nextRaceData,
            qualifyingDate: new Date(now.getTime() - (2 * 60 * 60 * 1000)).toISOString(), // 2 hours ago
            pickDeadline: new Date(now.getTime() + (10 * 60 * 60 * 1000)).toISOString(),  // 10 hours from now
            raceDate: new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString()       // Race tomorrow
        };
        
        localStorage.setItem('nextRaceData', JSON.stringify(mockData));
        localStorage.setItem('qualifyingResults', JSON.stringify(mockMonacoData.qualifyingResults));
        console.log('✓ Test Case 1: Post-Qualifying State (Pre-Deadline)');
        console.log('- Qualifying completed 2 hours ago');
        console.log('- Pick deadline is 10 hours from now');
        console.log('- Race starts in 24 hours');
        console.log('- P15 (Hulkenberg) should be available');
        console.log('- Pick button should be enabled');
        window.location.reload();
    },

    // Simulate some picks made - Test Case 2
    simulateSomePicks() {
        localStorage.clear(); // Start fresh
        
        // Set race to be in progress (started 30 minutes ago)
        const now = new Date();
        const mockData = {
            ...mockMonacoData.nextRaceData,
            raceName: "Monaco Grand Prix 2025",  // Remove the prefix, let the UI handle the state
            qualifyingDate: new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString(), // 24 hours ago
            pickDeadline: new Date(now.getTime() - (2 * 60 * 60 * 1000)).toISOString(),    // 2 hours ago
            raceDate: new Date(now.getTime() - (30 * 60 * 1000)).toISOString()             // Started 30 mins ago
        };

        localStorage.setItem('nextRaceData', JSON.stringify(mockData));
        localStorage.setItem('qualifyingResults', JSON.stringify(mockMonacoData.qualifyingResults));
        localStorage.setItem('f1survivor_user_picks', JSON.stringify({
            userId: 'test-user',
            currentSeason: '2025',
            picks: [
                { driverId: 27 }, // Hulkenberg (P15)
                { driverId: 31 }  // Ocon (P16)
            ]
        }));
        
        console.log('✓ Test Case 2: Race In Progress');
        console.log('- Race started 30 minutes ago');
        console.log('- Timer should show zeros');
        console.log('- Status should show "RACE IN PROGRESS"');
        console.log('- P15 (Hulkenberg) and P16 (Ocon) already picked');
        console.log('- Auto-picked P17 (Gasly)');
        console.log('- Pick button should be disabled');
        window.location.reload();
    },

    // Simulate deadline passed - Test Case 3
    simulateDeadlinePassed() {
        const nearRaceData = {
            ...mockMonacoData.nextRaceData,
            pickDeadline: new Date(Date.now() - 1000).toISOString() // 1 second ago
        };
        localStorage.clear(); // Start fresh
        localStorage.setItem('nextRaceData', JSON.stringify(nearRaceData));
        localStorage.setItem('qualifyingResults', JSON.stringify(mockMonacoData.qualifyingResults));
        console.log('✓ Test Case 3: Deadline Passed');
        console.log('- Pick deadline has passed');
        console.log('- Pick button should be disabled');
        console.log('- Should show deadline passed message');
        window.location.reload();
    },

    // Reset to default state
    reset() {
        localStorage.clear();
        console.log('✓ Reset: Cleared all test data');
        console.log('- App should return to default pre-qualifying state');
        window.location.reload();
    }
};

// Add minimal test controls to the page if in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        // DISABLED: Automatic test controls to prevent interference with normal app operation
        /*
        const testControls = document.createElement('div');
        testControls.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
            color: white;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
        `;
        
        testControls.innerHTML = `
            <div style="margin-bottom:5px">Monaco 2025 Test Cases</div>
            <button onclick="TestScenarios.simulateQualiDone()">1: Post-Quali</button>
            <button onclick="TestScenarios.simulateSomePicks()">2: Previous Picks</button>
            <button onclick="TestScenarios.simulateDeadlinePassed()">3: Deadline</button>
            <button onclick="TestScenarios.reset()">Reset</button>
        `;
        
        document.body.appendChild(testControls);
        */

        // Test scenarios are available silently in development via window.TestScenarios
        // Console logs removed to avoid clutter during normal development
    });
}

// Export for console access only in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.TestScenarios = TestScenarios;
    window.mockMonacoData = mockMonacoData; // Keep for reference
} 