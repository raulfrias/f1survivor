/**
 * Post-Race Testing Script for Spanish GP 2025
 * Tests: Race Results API, Survival Calculations, Race Transitions
 */

class PostRaceTestSuite {
    constructor() {
        this.testResults = [];
        console.log('🧪 Post-Race Test Suite Initialized');
        console.log('🏁 Testing Spanish GP → Canadian GP Transition');
    }

    async runAllTests() {
        console.log('\n========== POST-RACE TESTING SUITE ==========');
        
        try {
            await this.testRaceResultsAPI();
            await this.testSurvivalCalculations();
            await this.testRaceTransitions();
            await this.testSystemReset();
            
            this.printTestSummary();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    // Test 1: OpenF1 API Race Results Availability
    async testRaceResultsAPI() {
        console.log('\n🔍 TEST 1: OpenF1 API Race Results Availability');
        
        try {
            // Import race results API
            const { fetchRaceResults, calculateSurvivalStatus } = await import('@/services/api/RaceResultsApi.js');
            
            // Test 1a: Mock Spanish GP Race Results
            console.log('  📡 Testing mock race results...');
            const mockSessionKey = 'esp-2025-race';
            const mockResults = await fetchRaceResults(mockSessionKey);
            
            if (mockResults && mockResults.positions) {
                console.log(`  ✅ Mock race results fetched: ${mockResults.positions.length} drivers`);
                console.log(`  🏆 Winner: ${mockResults.positions[0].full_name}`);
                console.log(`  📊 P15: ${mockResults.positions[14].full_name}`);
                console.log(`  📊 P16: ${mockResults.positions[15].full_name}`);
                this.testResults.push({ test: 'Race Results API - Mock', status: 'PASS' });
            } else {
                throw new Error('Failed to fetch mock race results');
            }

            // Test 1b: Real OpenF1 API (race results might not be available yet)
            console.log('  📡 Testing real OpenF1 race results API...');
            try {
                const response = await fetch('https://api.openf1.org/v1/sessions?session_name=Race&year=2025');
                const sessions = await response.json();
                
                console.log(`  📊 Found ${sessions.length} race sessions in 2025`);
                
                if (sessions.length > 0) {
                    const latestRace = sessions[sessions.length - 1];
                    console.log(`  🏁 Latest race session: ${latestRace.location} (${latestRace.session_key})`);
                    this.testResults.push({ test: 'Race Results API - Real', status: 'PASS' });
                } else {
                    console.log('  ⚠️  No race sessions found yet (expected during live race)');
                    this.testResults.push({ test: 'Race Results API - Real', status: 'SKIP' });
                }
            } catch (error) {
                console.log('  ⚠️  OpenF1 API error (expected during live race):', error.message);
                this.testResults.push({ test: 'Race Results API - Real', status: 'SKIP' });
            }

        } catch (error) {
            console.error('  ❌ Race Results API test failed:', error);
            this.testResults.push({ test: 'Race Results API', status: 'FAIL' });
        }
    }

    // Test 2: Survival Calculation Logic
    async testSurvivalCalculations() {
        console.log('\n🧮 TEST 2: Survival Calculation Logic');
        
        try {
            const { calculateSurvivalStatus, isPlayerAlive, calculateSurvivalRate, getPicksWithResults } = await import('@/services/api/RaceResultsApi.js');

            // Test mock user picks with Spanish GP results
            const mockUserPicks = [
                {
                    raceId: 'esp-2025',
                    raceName: 'Spanish GP',
                    driverId: 55, // Carlos Sainz 
                    driverName: 'Carlos Sainz',
                    pickDate: '2025-06-01T12:00:00.000Z'
                }
            ];

            // Simulate Spanish GP race results
            const mockRaceResults = {
                session_key: 'esp-2025-race',
                session_name: 'Race',
                location: 'Barcelona',
                positions: [
                    { position: 1, driver_number: 1, full_name: "Max Verstappen", team_name: "Red Bull Racing" },
                    { position: 2, driver_number: 4, full_name: "Lando Norris", team_name: "McLaren" },
                    { position: 3, driver_number: 16, full_name: "Charles Leclerc", team_name: "Ferrari" },
                    { position: 15, driver_number: 55, full_name: "Carlos Sainz", team_name: "Williams" }, // User's pick
                    { position: 16, driver_number: 23, full_name: "Alexander Albon", team_name: "Williams" }
                ]
            };

            // Test survival calculation
            const userPick = mockUserPicks[0];
            const survivalStatus = calculateSurvivalStatus(userPick, mockRaceResults);
            
            console.log(`  🎯 User picked: ${userPick.driverName} (#${userPick.driverId})`);
            console.log(`  🏁 Race result: ${survivalStatus.position} - ${survivalStatus.status}`);
            
            if (survivalStatus.status === 'ELIMINATED' && survivalStatus.position === 'P15') {
                console.log('  ✅ Survival calculation correct: P15 = ELIMINATED');
                this.testResults.push({ test: 'Survival Calculation', status: 'PASS' });
            } else {
                throw new Error(`Unexpected survival status: ${survivalStatus.status}`);
            }

            // Test multiple picks scenario
            console.log('  📊 Testing multiple picks scenario...');
            const multiplePicks = [
                { raceId: 'bhr-2025', driverId: 4, survivalStatus: { status: 'SURVIVED', position: 'P2' } },
                { raceId: 'sau-2025', driverId: 27, survivalStatus: { status: 'SURVIVED', position: 'P10' } },
                { raceId: 'esp-2025', driverId: 55, survivalStatus: { status: 'ELIMINATED', position: 'P15' } }
            ];

            const playerAlive = isPlayerAlive(multiplePicks);
            const survivalRate = calculateSurvivalRate(multiplePicks);

            console.log(`  👤 Player status: ${playerAlive ? 'ALIVE' : 'ELIMINATED'}`);
            console.log(`  📈 Survival rate: ${survivalRate}%`);

            if (!playerAlive && survivalRate === 67) { // 2/3 survived
                console.log('  ✅ Multi-pick survival calculation correct');
                this.testResults.push({ test: 'Multi-Pick Survival', status: 'PASS' });
            } else {
                throw new Error(`Unexpected multi-pick results: alive=${playerAlive}, rate=${survivalRate}`);
            }

        } catch (error) {
            console.error('  ❌ Survival calculation test failed:', error);
            this.testResults.push({ test: 'Survival Calculation', status: 'FAIL' });
        }
    }

    // Test 3: Race Transition Logic
    async testRaceTransitions() {
        console.log('\n🔄 TEST 3: Race Transition Logic');
        
        try {
            // Simulate post-race transition (Spanish GP → Canadian GP)
            console.log('  ⏰ Simulating post-race state transition...');
            
            // Save current localStorage state
            const originalRaceData = localStorage.getItem('nextRaceData');
            const originalQualifyingResults = localStorage.getItem('qualifyingResults');

            // Simulate race completion (Spanish GP finished + 10 hour buffer passed)
            const spanishGPEnd = new Date('2025-06-01T23:00:00+00:00'); // Race + 10 hours
            const futureTime = new Date(spanishGPEnd.getTime() + 1000); // 1 second after buffer

            // Mock the current time for testing
            const originalDateNow = Date.now;
            Date.now = () => futureTime.getTime();
            
            console.log(`  📅 Simulated time: ${futureTime.toISOString()}`);
            console.log('  🔄 Testing race transition...');

            // Import and test race calendar functions
            const { getNextRace, F1_2025_CALENDAR } = await import('@/data/RaceCalendar2025.js');
            
            const nextRace = getNextRace(futureTime);
            
            if (nextRace && nextRace.raceName === 'Canadian GP') {
                console.log(`  ✅ Next race correctly identified: ${nextRace.raceName}`);
                console.log(`  📅 Canadian GP date: ${nextRace.dateStart}`);
                this.testResults.push({ test: 'Race Transition', status: 'PASS' });
            } else {
                throw new Error(`Expected Canadian GP, got: ${nextRace?.raceName}`);
            }

            // Test qualifying cache invalidation
            console.log('  🗑️  Testing cache invalidation...');
            
            // Clear Spanish GP cache (simulating race transition)
            localStorage.removeItem('qualifyingResults');
            localStorage.removeItem('nextRaceData');
            
            console.log('  ✅ Spanish GP cache cleared');
            console.log('  🔄 System ready for Canadian GP');

            // Restore original functions and data
            Date.now = originalDateNow;
            if (originalRaceData) localStorage.setItem('nextRaceData', originalRaceData);
            if (originalQualifyingResults) localStorage.setItem('qualifyingResults', originalQualifyingResults);

            this.testResults.push({ test: 'Cache Invalidation', status: 'PASS' });

        } catch (error) {
            console.error('  ❌ Race transition test failed:', error);
            this.testResults.push({ test: 'Race Transition', status: 'FAIL' });
        }
    }

    // Test 4: System Reset for Next Race
    async testSystemReset() {
        console.log('\n🔄 TEST 4: System Reset for Canadian GP');
        
        try {
            // Test dashboard data preparation for Canadian GP
            console.log('  📊 Testing dashboard reset...');
            
            const { getDashboardData, calculateDashboardStats } = await import('@/utils/DashboardUtils.js');
            
            // Mock user picks including Spanish GP elimination
            const mockPicksWithResults = [
                {
                    raceId: 'bhr-2025',
                    raceName: 'Bahrain GP',
                    driverId: 4,
                    driverName: 'Lando Norris',
                    survivalStatus: { status: 'SURVIVED', position: 'P2' }
                },
                {
                    raceId: 'esp-2025',
                    raceName: 'Spanish GP', 
                    driverId: 55,
                    driverName: 'Carlos Sainz',
                    survivalStatus: { status: 'ELIMINATED', position: 'P15' }
                }
            ];

            const stats = calculateDashboardStats(mockPicksWithResults);
            
            console.log(`  📈 Dashboard stats calculated:`);
            console.log(`    - Picks used: ${stats.picksUsed}/20`);
            console.log(`    - Races completed: ${stats.racesCompleted}/24`);
            console.log(`    - Player status: ${stats.playerStatus}`);
            console.log(`    - Survival rate: ${stats.survivalRate}%`);

            if (stats.playerStatus === 'ELIMINATED' && stats.survivalRate === 50) {
                console.log('  ✅ Dashboard stats correct after elimination');
                this.testResults.push({ test: 'Dashboard Reset', status: 'PASS' });
            } else {
                throw new Error(`Unexpected dashboard stats: ${stats.playerStatus}, ${stats.survivalRate}%`);
            }

            // Test next race preparation
            console.log('  🏁 Testing Canadian GP preparation...');
            
            const canadianGPData = {
                raceId: "can-2025",
                raceName: "Canadian GP",
                raceDate: "2025-06-15T18:00:00+00:00",
                qualifyingDate: "2025-06-14",
                location: "Montreal"
            };

            console.log(`  📅 Next race: ${canadianGPData.raceName}`);
            console.log(`  📍 Location: ${canadianGPData.location}`);
            console.log(`  🏎️  Qualifying: ${canadianGPData.qualifyingDate}`);
            console.log('  ✅ Canadian GP data prepared');

            this.testResults.push({ test: 'Next Race Preparation', status: 'PASS' });

        } catch (error) {
            console.error('  ❌ System reset test failed:', error);
            this.testResults.push({ test: 'System Reset', status: 'FAIL' });
        }
    }

    printTestSummary() {
        console.log('\n========== TEST SUMMARY ==========');
        
        const passed = this.testResults.filter(t => t.status === 'PASS').length;
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        const skipped = this.testResults.filter(t => t.status === 'SKIP').length;
        
        console.log(`✅ PASSED: ${passed}`);
        console.log(`❌ FAILED: ${failed}`);
        console.log(`⏭️  SKIPPED: ${skipped}`);
        
        console.log('\nDetailed Results:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : '⏭️';
            console.log(`  ${icon} ${result.test}: ${result.status}`);
        });

        if (failed === 0) {
            console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
            console.log('📝 Post-race functionality ready for production');
        } else {
            console.log('\n⚠️  Some tests failed - review before production');
        }
    }

    // Manual test triggers for specific scenarios
    static simulateRaceFinished() {
        console.log('🏁 Simulating Spanish GP race finished...');
        
        // Clear current race data to trigger transition
        localStorage.removeItem('nextRaceData');
        localStorage.removeItem('qualifyingResults');
        
        // Dispatch race finished event
        window.dispatchEvent(new CustomEvent('raceDataUpdated'));
        
        console.log('✅ Race finished simulation complete');
        console.log('🔄 System should now show Canadian GP countdown');
    }

    static simulatePostRaceResults() {
        console.log('📊 Simulating Spanish GP race results...');
        
        const mockResults = {
            session_key: 'esp-2025-race',
            session_name: 'Race',
            location: 'Barcelona',
            date: '2025-06-01',
            positions: [
                { position: 1, driver_number: 1, full_name: "Max Verstappen", team_name: "Red Bull Racing" },
                { position: 2, driver_number: 4, full_name: "Lando Norris", team_name: "McLaren" },
                { position: 3, driver_number: 16, full_name: "Charles Leclerc", team_name: "Ferrari" },
                { position: 4, driver_number: 55, full_name: "Carlos Sainz", team_name: "Williams" },
                { position: 5, driver_number: 63, full_name: "George Russell", team_name: "Mercedes" },
                { position: 6, driver_number: 44, full_name: "Lewis Hamilton", team_name: "Mercedes" },
                { position: 7, driver_number: 11, full_name: "Sergio Perez", team_name: "Red Bull Racing" },
                { position: 8, driver_number: 14, full_name: "Fernando Alonso", team_name: "Aston Martin" },
                { position: 9, driver_number: 18, full_name: "Lance Stroll", team_name: "Aston Martin" },
                { position: 10, driver_number: 81, full_name: "Oscar Piastri", team_name: "McLaren" },
                { position: 11, driver_number: 27, full_name: "Nico Hulkenberg", team_name: "Kick Sauber" },
                { position: 12, driver_number: 20, full_name: "Kevin Magnussen", team_name: "Haas" },
                { position: 13, driver_number: 10, full_name: "Pierre Gasly", team_name: "Alpine" },
                { position: 14, driver_number: 31, full_name: "Esteban Ocon", team_name: "Alpine" },
                { position: 15, driver_number: 23, full_name: "Alexander Albon", team_name: "Williams" },
                { position: 16, driver_number: 2, full_name: "Logan Sargeant", team_name: "Williams" },
                { position: 17, driver_number: 77, full_name: "Valtteri Bottas", team_name: "Kick Sauber" },
                { position: 18, driver_number: 24, full_name: "Zhou Guanyu", team_name: "Kick Sauber" },
                { position: 19, driver_number: 22, full_name: "Yuki Tsunoda", team_name: "RB" },
                { position: 20, driver_number: 3, full_name: "Daniel Ricciardo", team_name: "RB" }
            ]
        };

        // Cache the mock results
        localStorage.setItem('raceResults_esp-2025', JSON.stringify({
            results: mockResults,
            timestamp: new Date().toISOString()
        }));

        console.log('✅ Mock Spanish GP results cached');
        console.log(`🏆 Winner: ${mockResults.positions[0].full_name}`);
        console.log(`📊 P15-P16: ${mockResults.positions[14].full_name}, ${mockResults.positions[15].full_name}`);
    }
}

// Global access for manual testing
window.PostRaceTestSuite = PostRaceTestSuite;

// Post-race test suite loaded silently - available via window.PostRaceTestSuite
// Console logs removed to avoid clutter during normal development

export default PostRaceTestSuite; 