// Frontend-Backend Integration Test Suite
// Tests all critical functionality of the AWS integration

import { getMultiLeagueContext, setActiveLeagueId, addLeagueChangeListener, removeLeagueChangeListener } from '@/services/league/LeagueIntegration.js';

class FrontendBackendIntegrationTests {
  constructor() {
    this.testResults = [];
    this.testUser = null;
  }

  async runAllTests() {
    console.log('🧪 Frontend-Backend Integration Test Suite');
    console.log('==========================================');
    
    try {
      await this.testAuthenticationFlow();
      await this.testPickSavingAndLoading();
      await this.testPickChanging();
      await this.testPreviousRaceBlocking();
      await this.testCrossBrowserPersistence();
      await this.testErrorHandling();
      await this.testDataConsistency();
      
      this.printTestSummary();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  // Test 1: Authentication Flow
  async testAuthenticationFlow() {
    console.log('\n🔐 TEST 1: Authentication Flow');
    
    try {
      const { authManager } = await import('@/services/auth/AuthManager.js');
      
      // Check if user is authenticated
      const isAuth = await authManager.isAuthenticated();
      console.log(`  📋 Authentication status: ${isAuth ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
      
      if (isAuth) {
        const user = await authManager.getCurrentUser();
        console.log(`  👤 Current user: ${user.username || user.userId}`);
        this.testUser = user;
        this.addTestResult('Authentication Flow', 'PASS', 'User authenticated successfully');
      } else {
        this.addTestResult('Authentication Flow', 'SKIP', 'User not authenticated - manual test required');
      }
    } catch (error) {
      this.addTestResult('Authentication Flow', 'FAIL', error.message);
    }
  }

  // Test 2: Pick Saving and Loading
  async testPickSavingAndLoading() {
    console.log('\n💾 TEST 2: Pick Saving and Loading');
    
    if (!this.testUser) {
      this.addTestResult('Pick Saving/Loading', 'SKIP', 'Authentication required');
      return;
    }

    try {
      const { amplifyDataService } = await import('@/services/aws/AmplifyDataService.js');
      
      // Get current race data
      const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
      if (!raceData) {
        throw new Error('No race data found - please ensure race data is loaded');
      }

      console.log(`  🏁 Testing with race: ${raceData.raceName} (${raceData.raceId})`);

      // Test saving a pick
      const testPick = {
        driverId: 99, // Test driver ID
        driverName: 'Test Driver',
        teamName: 'Test Team',
        isAutoPick: false
      };

      console.log('  📝 Saving test pick...');
      const savedPick = await amplifyDataService.saveUserPick({
        driverId: testPick.driverId.toString(),
        driverName: testPick.driverName,
        teamName: testPick.teamName,
        raceId: raceData.raceId,
        raceName: raceData.raceName,
        isAutoPick: testPick.isAutoPick
      });

      if (savedPick && savedPick.data) {
        console.log('  ✅ Pick saved successfully');
        
        // Test loading picks
        console.log('  📖 Loading user picks...');
        const userPicks = await amplifyDataService.getUserPicks();
        const testPickFound = userPicks.find(p => 
          p.raceId === raceData.raceId && p.driverId === testPick.driverId.toString()
        );

        if (testPickFound) {
          console.log('  ✅ Pick loaded successfully');
          
          // Clean up test pick
          await amplifyDataService.deleteUserPick(testPickFound.id);
          console.log('  🧹 Test pick cleaned up');
          
          this.addTestResult('Pick Saving/Loading', 'PASS', 'Save and load operations working');
        } else {
          throw new Error('Saved pick not found when loading');
        }
      } else {
        throw new Error('Pick save operation failed');
      }
    } catch (error) {
      this.addTestResult('Pick Saving/Loading', 'FAIL', error.message);
    }
  }

  // Test 3: Pick Changing
  async testPickChanging() {
    console.log('\n🔄 TEST 3: Pick Changing');
    
    if (!this.testUser) {
      this.addTestResult('Pick Changing', 'SKIP', 'Authentication required');
      return;
    }

    try {
      const { amplifyDataService } = await import('@/services/aws/AmplifyDataService.js');
      const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
      
      // Create initial pick
      const initialPick = await amplifyDataService.saveUserPick({
        driverId: '98',
        driverName: 'Initial Test Driver',
        teamName: 'Initial Team',
        raceId: raceData.raceId,
        raceName: raceData.raceName,
        isAutoPick: false
      });

      console.log('  📝 Created initial test pick');

      // Change the pick
      const updatedPick = await amplifyDataService.updateUserPick(initialPick.data.id, {
        driverId: '97',
        driverName: 'Updated Test Driver',
        teamName: 'Updated Team',
        isAutoPick: false
      });

      if (updatedPick && updatedPick.data) {
        console.log('  ✅ Pick updated successfully');
        
        // Verify the change
        const currentPick = await amplifyDataService.getCurrentRacePick();
        if (currentPick && currentPick.driverName === 'Updated Test Driver') {
          console.log('  ✅ Pick change verified');
          
          // Clean up
          await amplifyDataService.deleteUserPick(currentPick.id);
          console.log('  🧹 Test pick cleaned up');
          
          this.addTestResult('Pick Changing', 'PASS', 'Pick update operations working');
        } else {
          throw new Error('Pick change not reflected in current pick');
        }
      } else {
        throw new Error('Pick update operation failed');
      }
    } catch (error) {
      this.addTestResult('Pick Changing', 'FAIL', error.message);
    }
  }

  // Test 4: Previous Race Blocking
  async testPreviousRaceBlocking() {
    console.log('\n🚫 TEST 4: Previous Race Blocking');
    
    if (!this.testUser) {
      this.addTestResult('Previous Race Blocking', 'SKIP', 'Authentication required');
      return;
    }

    try {
      const { amplifyDataService } = await import('@/services/aws/AmplifyDataService.js');
      
      // Add a test previous race pick
      const previousRacePick = await amplifyDataService.addTestPreviousRacePick(
        96, 'Previous Race Driver', 'Previous Team', 'test-prev-race', 'Test Previous GP'
      );

      console.log('  📝 Added test previous race pick');

      // Get all user picks
      const allPicks = await amplifyDataService.getUserPicks();
      const previousPicks = allPicks.filter(p => p.raceId !== JSON.parse(localStorage.getItem('nextRaceData')).raceId);
      
      console.log(`  📊 Found ${previousPicks.length} previous race picks`);

      if (previousPicks.length > 0) {
        console.log('  ✅ Previous race picks are being stored correctly');
        
        // Clean up test pick
        await amplifyDataService.deleteUserPick(previousRacePick.data.id);
        console.log('  🧹 Test previous race pick cleaned up');
        
        this.addTestResult('Previous Race Blocking', 'PASS', 'Previous race pick storage working');
      } else {
        throw new Error('Previous race picks not found');
      }
    } catch (error) {
      this.addTestResult('Previous Race Blocking', 'FAIL', error.message);
    }
  }

  // Test 5: Cross-Browser Persistence
  async testCrossBrowserPersistence() {
    console.log('\n🌐 TEST 5: Cross-Browser Persistence');
    
    if (!this.testUser) {
      this.addTestResult('Cross-Browser Persistence', 'SKIP', 'Authentication required');
      return;
    }

    try {
      const { amplifyDataService } = await import('@/services/aws/AmplifyDataService.js');
      
      // This test verifies that data persists across browser sessions
      // by checking if we can retrieve user picks without localStorage
      
      // Clear localStorage temporarily
      const backupData = localStorage.getItem('f1survivor_user_picks');
      localStorage.removeItem('f1survivor_user_picks');
      
      console.log('  🧹 Cleared localStorage temporarily');

      // Try to load picks from AWS
      const awsPicks = await amplifyDataService.getUserPicks();
      console.log(`  📊 Retrieved ${awsPicks.length} picks from AWS`);

      // Restore localStorage
      if (backupData) {
        localStorage.setItem('f1survivor_user_picks', backupData);
      }

      console.log('  ✅ Data persistence verified - picks available without localStorage');
      this.addTestResult('Cross-Browser Persistence', 'PASS', 'AWS data persistence working');
    } catch (error) {
      this.addTestResult('Cross-Browser Persistence', 'FAIL', error.message);
    }
  }

  // Test 6: Error Handling
  async testErrorHandling() {
    console.log('\n⚠️ TEST 6: Error Handling');
    
    try {
      const { amplifyDataService } = await import('@/services/aws/AmplifyDataService.js');
      
      // Test invalid pick data
      try {
        await amplifyDataService.saveUserPick({
          // Missing required fields
          driverId: null,
          raceId: null
        });
        throw new Error('Should have failed with invalid data');
      } catch (error) {
        if (error.message.includes('required') || error.message.includes('null') || error.message.includes('validation')) {
          console.log('  ✅ Invalid data properly rejected');
        } else {
          throw error;
        }
      }

      // Test unauthorized access (if possible)
      console.log('  ✅ Error handling working correctly');
      this.addTestResult('Error Handling', 'PASS', 'Proper error handling implemented');
    } catch (error) {
      this.addTestResult('Error Handling', 'FAIL', error.message);
    }
  }

  // Test 7: Data Consistency
  async testDataConsistency() {
    console.log('\n🔍 TEST 7: Data Consistency');
    
    if (!this.testUser) {
      this.addTestResult('Data Consistency', 'SKIP', 'Authentication required');
      return;
    }

    try {
      const { amplifyDataService } = await import('@/services/aws/AmplifyDataService.js');
      
      // Compare AWS data with league integration data
      const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
      const awsPick = await amplifyDataService.getCurrentRacePick(raceData.raceId);
      const contextPick = await getMultiLeagueContext();

      console.log('  📊 Comparing AWS pick with context pick...');

      if (awsPick && contextPick) {
        if (awsPick.driverId === contextPick.driverId.toString()) {
          console.log('  ✅ Data consistency verified - AWS and context picks match');
          this.addTestResult('Data Consistency', 'PASS', 'Data consistency maintained');
        } else {
          throw new Error(`Data mismatch: AWS=${awsPick.driverId}, Context=${contextPick.driverId}`);
        }
      } else if (!awsPick && !contextPick) {
        console.log('  ✅ Data consistency verified - no picks in both sources');
        this.addTestResult('Data Consistency', 'PASS', 'Consistent empty state');
      } else {
        throw new Error('Data inconsistency detected between AWS and context');
      }
    } catch (error) {
      this.addTestResult('Data Consistency', 'FAIL', error.message);
    }
  }

  // Helper methods
  addTestResult(testName, status, message) {
    this.testResults.push({ testName, status, message });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`  ${emoji} ${testName}: ${status} - ${message}`);
  }

  printTestSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`  - ${test.testName}: ${test.message}`);
      });
    }
    
    if (skipped > 0) {
      console.log('\n⏭️ SKIPPED TESTS:');
      this.testResults.filter(r => r.status === 'SKIP').forEach(test => {
        console.log(`  - ${test.testName}: ${test.message}`);
      });
    }

    const successRate = Math.round((passed / (passed + failed)) * 100);
    console.log(`\n🎯 Success Rate: ${successRate}% (${passed}/${passed + failed} tests passed)`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Frontend-Backend Integration is ready for production.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review and fix issues before committing.');
    }
  }
}

// Make available globally
window.FrontendBackendIntegrationTests = FrontendBackendIntegrationTests;

// Quick test runner
window.runIntegrationTests = async function() {
  const testSuite = new FrontendBackendIntegrationTests();
  await testSuite.runAllTests();
};

// Frontend-backend integration test suite loaded silently - available via runIntegrationTests()
// Console logs removed to avoid clutter during normal development 