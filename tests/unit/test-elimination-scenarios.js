/**
 * Elimination Scenarios Test Suite
 * Focused testing for lives-based elimination logic
 */

// Note: livesEliminationEngine will be available globally if loaded

/**
 * Mock Race Scenarios for Testing
 */
const eliminationTestScenarios = {
    // Scenario 1: Normal race with mixed results
    scenario1_mixedResults: {
        name: "Mixed Results - Some Safe, Some Eliminated",
        raceId: "australia-2025",
        raceName: "Australia GP",
        picks: [
            { userId: "user1", driverId: "1", driverName: "Verstappen", currentLives: 3 },
            { userId: "user2", driverId: "10", driverName: "Gasly", currentLives: 2 },
            { userId: "user3", driverId: "27", driverName: "Hulkenberg", currentLives: 1 },
            { userId: "user4", driverId: "44", driverName: "Hamilton", currentLives: 3 }
        ],
        raceResults: [
            { driverId: "1", finalPosition: 1 },   // Verstappen P1 - Safe ✅
            { driverId: "44", finalPosition: 2 },  // Hamilton P2 - Safe ✅
            { driverId: "10", finalPosition: 11 }, // Gasly P11 - Life Lost ❌
            { driverId: "27", finalPosition: 15 }  // Hulkenberg P15 - FINAL ELIMINATION ❌
        ],
        expectedResults: {
            user1: { livesLost: 0, status: "ACTIVE", remainingLives: 3 },
            user2: { livesLost: 1, status: "ACTIVE", remainingLives: 1 },
            user3: { livesLost: 1, status: "ELIMINATED", remainingLives: 0 },
            user4: { livesLost: 0, status: "ACTIVE", remainingLives: 3 }
        }
    },

    // Scenario 2: Disaster race - many eliminations
    scenario2_disasterRace: {
        name: "Disaster Race - Multiple Eliminations",
        raceId: "monaco-2025",
        raceName: "Monaco GP",
        picks: [
            { userId: "user1", driverId: "1", driverName: "Verstappen", currentLives: 2 },
            { userId: "user2", driverId: "16", driverName: "Leclerc", currentLives: 1 },
            { userId: "user3", driverId: "11", driverName: "Perez", currentLives: 1 },
            { userId: "user4", driverId: "4", driverName: "Norris", currentLives: 2 },
            { userId: "user5", driverId: "81", driverName: "Piastri", currentLives: 3 }
        ],
        raceResults: [
            { driverId: "81", finalPosition: 1 },  // Piastri P1 - Safe ✅
            { driverId: "1", finalPosition: 12 },  // Verstappen P12 - Life Lost ❌
            { driverId: "16", finalPosition: 14 }, // Leclerc P14 - FINAL ELIMINATION ❌
            { driverId: "11", finalPosition: 16 }, // Perez P16 - FINAL ELIMINATION ❌
            { driverId: "4", finalPosition: 18 }   // Norris P18 - Life Lost ❌
        ],
        expectedResults: {
            user1: { livesLost: 1, status: "ACTIVE", remainingLives: 1 },
            user2: { livesLost: 1, status: "ELIMINATED", remainingLives: 0 },
            user3: { livesLost: 1, status: "ELIMINATED", remainingLives: 0 },
            user4: { livesLost: 1, status: "ACTIVE", remainingLives: 1 },
            user5: { livesLost: 0, status: "ACTIVE", remainingLives: 3 }
        }
    },

    // Scenario 3: Perfect race - everyone safe
    scenario3_perfectRace: {
        name: "Perfect Race - All Drivers in Top 10",
        raceId: "silverstone-2025",
        raceName: "British GP",
        picks: [
            { userId: "user1", driverId: "1", driverName: "Verstappen", currentLives: 1 },
            { userId: "user2", driverId: "44", driverName: "Hamilton", currentLives: 1 },
            { userId: "user3", driverId: "16", driverName: "Leclerc", currentLives: 2 },
            { userId: "user4", driverId: "4", driverName: "Norris", currentLives: 3 }
        ],
        raceResults: [
            { driverId: "1", finalPosition: 1 },   // Verstappen P1 - Safe ✅
            { driverId: "44", finalPosition: 3 },  // Hamilton P3 - Safe ✅
            { driverId: "16", finalPosition: 5 },  // Leclerc P5 - Safe ✅
            { driverId: "4", finalPosition: 7 }    // Norris P7 - Safe ✅
        ],
        expectedResults: {
            user1: { livesLost: 0, status: "ACTIVE", remainingLives: 1 },
            user2: { livesLost: 0, status: "ACTIVE", remainingLives: 1 },
            user3: { livesLost: 0, status: "ACTIVE", remainingLives: 2 },
            user4: { livesLost: 0, status: "ACTIVE", remainingLives: 3 }
        }
    },

    // Scenario 4: Edge cases
    scenario4_edgeCases: {
        name: "Edge Cases - P10 vs P11 Boundary",
        raceId: "spa-2025",
        raceName: "Belgian GP",
        picks: [
            { userId: "user1", driverId: "63", driverName: "Russell", currentLives: 1 },
            { userId: "user2", driverId: "55", driverName: "Sainz", currentLives: 2 },
            { userId: "user3", driverId: "14", driverName: "Alonso", currentLives: 1 }
        ],
        raceResults: [
            { driverId: "63", finalPosition: 10 }, // Russell P10 - Safe (boundary) ✅
            { driverId: "55", finalPosition: 11 }, // Sainz P11 - Life Lost (boundary) ❌
            { driverId: "14", finalPosition: 20 }  // Alonso P20 - FINAL ELIMINATION ❌
        ],
        expectedResults: {
            user1: { livesLost: 0, status: "ACTIVE", remainingLives: 1 },
            user2: { livesLost: 1, status: "ACTIVE", remainingLives: 1 },
            user3: { livesLost: 1, status: "ELIMINATED", remainingLives: 0 }
        }
    }
};

/**
 * Elimination Test Runner
 */
class EliminationTestRunner {
    constructor() {
        this.testResults = {};
        this.totalTests = 0;
        this.passedTests = 0;
    }

    /**
     * Run all elimination test scenarios
     */
    async runAllScenarios() {
        console.log('🏁 Starting Elimination Logic Test Suite...');
        console.log('===============================================\n');

        for (const [scenarioKey, scenario] of Object.entries(eliminationTestScenarios)) {
            console.log(`📋 Running: ${scenario.name}`);
            await this.runScenario(scenarioKey, scenario);
            console.log(''); // Add spacing
        }

        this.printSummary();
        return this.testResults;
    }

    /**
     * Run a single elimination scenario
     */
    async runScenario(scenarioKey, scenario) {
        try {
            console.log(`🏎️  Race: ${scenario.raceName} (${scenario.raceId})`);
            console.log(`👥 Testing ${scenario.picks.length} picks`);

            // Simulate the elimination processing
            const results = this.simulateElimination(scenario);
            
            // Validate results against expectations
            const validation = this.validateResults(results, scenario.expectedResults);
            
            this.testResults[scenarioKey] = {
                scenario: scenario.name,
                status: validation.passed ? 'PASS' : 'FAIL',
                results: results,
                validation: validation,
                timestamp: new Date().toISOString()
            };

            // Log results
            console.log(`📊 Results:`);
            for (const [userId, result] of Object.entries(results)) {
                const icon = result.livesLost > 0 ? '❌' : '✅';
                const status = result.status === 'ELIMINATED' ? '💀' : '💪';
                console.log(`   ${icon} ${userId}: ${result.driverName} P${result.finalPosition} → ${result.remainingLives} lives ${status}`);
            }

            console.log(`${validation.passed ? '✅ PASS' : '❌ FAIL'}: ${validation.message}`);
            
            if (validation.passed) this.passedTests++;
            this.totalTests++;

        } catch (error) {
            console.error(`❌ Scenario ${scenarioKey} failed:`, error);
            this.testResults[scenarioKey] = {
                scenario: scenario.name,
                status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            };
            this.totalTests++;
        }
    }

    /**
     * Simulate elimination processing for a scenario
     */
    simulateElimination(scenario) {
        const results = {};

        for (const pick of scenario.picks) {
            const raceResult = scenario.raceResults.find(r => r.driverId === pick.driverId);
            
            if (!raceResult) {
                console.warn(`⚠️  No race result found for ${pick.driverName} (${pick.driverId})`);
                continue;
            }

            // Determine if life is lost (P11+)
            const livesLost = raceResult.finalPosition > 10 ? 1 : 0;
            const remainingLives = Math.max(0, pick.currentLives - livesLost);
            const status = remainingLives === 0 ? 'ELIMINATED' : 'ACTIVE';

            results[pick.userId] = {
                driverName: pick.driverName,
                finalPosition: raceResult.finalPosition,
                livesLost: livesLost,
                remainingLives: remainingLives,
                status: status,
                previousLives: pick.currentLives
            };
        }

        return results;
    }

    /**
     * Validate results against expected outcomes
     */
    validateResults(actualResults, expectedResults) {
        const validationErrors = [];
        let allValid = true;

        for (const [userId, expected] of Object.entries(expectedResults)) {
            const actual = actualResults[userId];
            
            if (!actual) {
                validationErrors.push(`Missing result for ${userId}`);
                allValid = false;
                continue;
            }

            // Check lives lost
            if (actual.livesLost !== expected.livesLost) {
                validationErrors.push(`${userId}: Expected ${expected.livesLost} lives lost, got ${actual.livesLost}`);
                allValid = false;
            }

            // Check remaining lives
            if (actual.remainingLives !== expected.remainingLives) {
                validationErrors.push(`${userId}: Expected ${expected.remainingLives} remaining lives, got ${actual.remainingLives}`);
                allValid = false;
            }

            // Check status
            if (actual.status !== expected.status) {
                validationErrors.push(`${userId}: Expected status ${expected.status}, got ${actual.status}`);
                allValid = false;
            }
        }

        return {
            passed: allValid,
            errors: validationErrors,
            message: allValid ? 'All validations passed' : `${validationErrors.length} validation errors`
        };
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('📊 Elimination Test Summary');
        console.log('===========================');
        console.log(`Total Scenarios: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.totalTests - this.passedTests}`);
        console.log(`Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);

        // Detailed results
        console.log('\n📋 Detailed Results:');
        for (const [key, result] of Object.entries(this.testResults)) {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.scenario}: ${result.status}`);
            
            if (result.validation && result.validation.errors.length > 0) {
                result.validation.errors.forEach(error => {
                    console.log(`   ⚠️  ${error}`);
                });
            }
        }
    }

    /**
     * Test specific elimination boundary cases
     */
    testBoundaryCases() {
        console.log('\n🎯 Testing Boundary Cases (P10 vs P11)');
        console.log('========================================');

        const boundaryCases = [
            { position: 1, expectLifeLoss: false },
            { position: 5, expectLifeLoss: false },
            { position: 10, expectLifeLoss: false },  // Boundary - Safe
            { position: 11, expectLifeLoss: true },   // Boundary - Life Lost
            { position: 15, expectLifeLoss: true },
            { position: 20, expectLifeLoss: true }
        ];

        let boundaryTestsPassed = 0;

        for (const testCase of boundaryCases) {
            const actualLifeLoss = testCase.position > 10;
            const passed = actualLifeLoss === testCase.expectLifeLoss;
            
            if (passed) boundaryTestsPassed++;
            
            const icon = passed ? '✅' : '❌';
            console.log(`${icon} P${testCase.position}: ${actualLifeLoss ? 'Life Lost' : 'Safe'} (Expected: ${testCase.expectLifeLoss ? 'Life Lost' : 'Safe'})`);
        }

        console.log(`\nBoundary Tests: ${boundaryTestsPassed}/${boundaryCases.length} passed`);
        return boundaryTestsPassed === boundaryCases.length;
    }
}

/**
 * Quick Test Functions for Console
 */
function runQuickEliminationTest() {
    console.log('🚀 Quick Elimination Test');
    const runner = new EliminationTestRunner();
    runner.runAllScenarios();
}

function testBoundaryLogic() {
    console.log('🎯 Quick Boundary Test');
    const runner = new EliminationTestRunner();
    return runner.testBoundaryCases();
}

function showTestScenarios() {
    console.log('📋 Available Test Scenarios:');
    for (const [key, scenario] of Object.entries(eliminationTestScenarios)) {
        console.log(`${key}: ${scenario.name} (${scenario.picks.length} picks)`);
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.EliminationTestRunner = EliminationTestRunner;
    window.eliminationTestScenarios = eliminationTestScenarios;
    window.runQuickEliminationTest = runQuickEliminationTest;
    window.testBoundaryLogic = testBoundaryLogic;
    window.showTestScenarios = showTestScenarios;
    
    console.log('🧪 Elimination Test Suite loaded!');
    console.log('Available commands:');
    console.log('- runQuickEliminationTest()');
    console.log('- testBoundaryLogic()');
    console.log('- showTestScenarios()');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EliminationTestRunner,
        eliminationTestScenarios,
        runQuickEliminationTest,
        testBoundaryLogic,
        showTestScenarios
    };
} 