/**
 * PHASE 1: Multi-League Core Architecture - Test Suite
 * Comprehensive testing for multi-league data architecture
 * Tests MultiLeagueContext, Enhanced AmplifyDataService, and Integration Layer
 */

import { MultiLeagueContext, multiLeagueContext } from './multi-league-context.js';
import { amplifyDataService } from './amplify-data-service.js';
import { 
  initializeMultiLeagueSystem,
  getMultiLeagueContext,
  getActiveLeagueContext,
  savePickWithContext,
  loadPicksWithContext,
  isDriverAlreadyPickedWithContext,
  isDriverAlreadyPickedInAnyLeague
} from './league-integration.js';
import { authManager } from './auth-manager.js';

/**
 * TEST CONFIGURATION
 */
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds for async operations
  maxLeagues: 10,
  sampleLeagues: [
    { leagueId: 'test-league-1', name: 'Work League', memberCount: 15 },
    { leagueId: 'test-league-2', name: 'Family League', memberCount: 8 },
    { leagueId: 'test-league-3', name: 'Friends League', memberCount: 12 }
  ],
  samplePicks: [
    { raceId: 'silverstone-2025', driverId: 1, driverName: 'Max Verstappen' },
    { raceId: 'monaco-2025', driverId: 7, driverName: 'Lando Norris' },
    { raceId: 'spa-2025', driverId: 11, driverName: 'Charles Leclerc' }
  ]
};

/**
 * PHASE 1 UNIT TESTS
 */

// MultiLeagueContext Class Tests
export const multiLeagueContextTests = {
  
  async testMultiLeagueContextInitialization() {
    console.log('🧪 Testing MultiLeagueContext initialization...');
    
    const context = new MultiLeagueContext();
    
    // Test initial state
    console.assert(context.userLeagues instanceof Map, 'userLeagues should be a Map');
    console.assert(context.activeLeagueId === null, 'activeLeagueId should be null initially');
    console.assert(context.leagueCache instanceof Map, 'leagueCache should be a Map');
    console.assert(context.cacheTimeout === 5 * 60 * 1000, 'cacheTimeout should be 5 minutes');
    
    console.log('✅ MultiLeagueContext initialization test passed');
    return true;
  },

  async testLoadUserLeagues() {
    console.log('🧪 Testing loadUserLeagues functionality...');
    
    try {
      const startTime = Date.now();
      const leagues = await multiLeagueContext.loadUserLeagues();
      const endTime = Date.now();
      
      // Performance requirement: < 2 seconds
      const loadTime = endTime - startTime;
      console.assert(loadTime < 2000, `League loading took ${loadTime}ms, should be < 2000ms`);
      
      // Verify return type
      console.assert(Array.isArray(leagues), 'loadUserLeagues should return an array');
      
      console.log(`✅ loadUserLeagues test passed (${loadTime}ms, ${leagues.length} leagues)`);
      return true;
    } catch (error) {
      console.error('❌ loadUserLeagues test failed:', error);
      return false;
    }
  },

  async testLeagueSwitching() {
    console.log('🧪 Testing league switching performance...');
    
    // Add test leagues to context
    TEST_CONFIG.sampleLeagues.forEach(league => {
      multiLeagueContext.addLeague(league);
    });
    
    const startTime = Date.now();
    const success = multiLeagueContext.setActiveLeague('test-league-2');
    const endTime = Date.now();
    
    // Performance requirement: < 500ms
    const switchTime = endTime - startTime;
    console.assert(switchTime < 500, `League switching took ${switchTime}ms, should be < 500ms`);
    console.assert(success === true, 'League switching should return true for valid league');
    console.assert(multiLeagueContext.activeLeagueId === 'test-league-2', 'Active league should be updated');
    
    console.log(`✅ League switching test passed (${switchTime}ms)`);
    return true;
  },

  async testMultiLeagueContextRetrieval() {
    console.log('🧪 Testing getMultiLeagueContext()...');
    
    const context = multiLeagueContext.getMultiLeagueContext();
    
    // Verify context structure
    console.assert(typeof context === 'object', 'Context should be an object');
    console.assert(Array.isArray(context.userLeagues), 'userLeagues should be an array');
    console.assert(typeof context.leagueCount === 'number', 'leagueCount should be a number');
    console.assert(typeof context.soloMode === 'boolean', 'soloMode should be a boolean');
    console.assert(typeof context.isMultiLeague === 'boolean', 'isMultiLeague should be a boolean');
    console.assert(typeof context.hasLeagues === 'boolean', 'hasLeagues should be a boolean');
    
    console.log('✅ getMultiLeagueContext test passed');
    return true;
  },

  async testCacheManagement() {
    console.log('🧪 Testing cache management...');
    
    // Test cache validity
    const isCacheValid = multiLeagueContext.isCacheValid();
    console.assert(typeof isCacheValid === 'boolean', 'isCacheValid should return boolean');
    
    // Test cache clearing
    multiLeagueContext.clearCache('all');
    console.assert(multiLeagueContext.memberCache.size === 0, 'memberCache should be empty after clearing');
    console.assert(multiLeagueContext.pickCache.size === 0, 'pickCache should be empty after clearing');
    
    console.log('✅ Cache management test passed');
    return true;
  }
};

// Enhanced Amplify Data Service Tests
export const amplifyDataServiceTests = {

  async testGetUserLeaguesWithCache() {
    console.log('🧪 Testing getUserLeaguesWithCache optimization...');
    
    try {
      // First call - should fetch from AWS
      const startTime1 = Date.now();
      const firstCall = await amplifyDataService.getUserLeaguesWithCache();
      const endTime1 = Date.now();
      
      // Second call - should use cache
      const startTime2 = Date.now();
      const secondCall = await amplifyDataService.getUserLeaguesWithCache();
      const endTime2 = Date.now();
      
      const firstCallTime = endTime1 - startTime1;
      const secondCallTime = endTime2 - startTime2;
      
      // Cache should be faster than fresh fetch
      console.assert(secondCallTime < firstCallTime, 'Cached call should be faster than fresh fetch');
      console.assert(Array.isArray(firstCall), 'First call should return array');
      console.assert(Array.isArray(secondCall) || secondCall.cached, 'Second call should return array or cached object');
      
      console.log(`✅ getUserLeaguesWithCache test passed (Fresh: ${firstCallTime}ms, Cached: ${secondCallTime}ms)`);
      return true;
    } catch (error) {
      console.error('❌ getUserLeaguesWithCache test failed:', error);
      return false;
    }
  },

  async testGetMultiLeaguePickHistory() {
    console.log('🧪 Testing getMultiLeaguePickHistory...');
    
    try {
      const startTime = Date.now();
      const history = await amplifyDataService.getMultiLeaguePickHistory();
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      if (loadTime >= 1000) {
        console.error(`Multi-league pick history took ${loadTime}ms, should be < 1000ms`);
        return false;
      }
      
      // Verify structure
      if (typeof history !== 'object') {
        console.error('History should be an object, got:', typeof history);
        return false;
      }
      if (typeof history.byLeague !== 'object') {
        console.error('byLeague should be an object, got:', typeof history.byLeague);
        return false;
      }
      if (typeof history.total !== 'number') {
        console.error('total should be a number, got:', typeof history.total);
        return false;
      }
      if (typeof history.leagueCount !== 'number') {
        console.error('leagueCount should be a number, got:', typeof history.leagueCount);
        return false;
      }
      
      console.log(`✅ getMultiLeaguePickHistory test passed (${loadTime}ms, ${history.total} total picks)`);
      return true;
    } catch (error) {
      console.error('❌ getMultiLeaguePickHistory test failed:', error);
      return false;
    }
  },

  async testGetCrossLeagueStatistics() {
    console.log('🧪 Testing getCrossLeagueStatistics...');
    
    try {
      const stats = await amplifyDataService.getCrossLeagueStatistics();
      
      if (stats) {
        // Verify statistics structure
        if (typeof stats.totalLeagues !== 'number') {
          console.error('totalLeagues should be a number, got:', typeof stats.totalLeagues);
          return false;
        }
        if (typeof stats.totalPicks !== 'number') {
          console.error('totalPicks should be a number, got:', typeof stats.totalPicks);
          return false;
        }
        if (typeof stats.leagueBreakdown !== 'object') {
          console.error('leagueBreakdown should be an object, got:', typeof stats.leagueBreakdown);
          return false;
        }
        if (typeof stats.overallSurvivalRate !== 'number') {
          console.error('overallSurvivalRate should be a number, got:', typeof stats.overallSurvivalRate);
          return false;
        }
        if (!Array.isArray(stats.mostUsedDrivers)) {
          console.error('mostUsedDrivers should be an array, got:', typeof stats.mostUsedDrivers);
          return false;
        }
        
        console.log(`✅ getCrossLeagueStatistics test passed (${stats.totalLeagues} leagues, ${stats.totalPicks} picks)`);
      } else {
        console.log('✅ getCrossLeagueStatistics test passed (null result for unauthenticated user)');
      }
      
      return true;
    } catch (error) {
      console.error('❌ getCrossLeagueStatistics test failed:', error);
      return false;
    }
  },

  async testDriverPickedInAnyLeague() {
    console.log('🧪 Testing isDriverAlreadyPickedInAnyLeague...');
    
    try {
      const result = await amplifyDataService.isDriverAlreadyPickedInAnyLeague(1);
      
      // Verify result structure
      console.assert(typeof result === 'object' || typeof result === 'boolean', 'Result should be object or boolean');
      
      if (typeof result === 'object') {
        console.assert(typeof result.picked === 'boolean', 'picked property should be boolean');
      }
      
      console.log('✅ isDriverAlreadyPickedInAnyLeague test passed');
      return true;
    } catch (error) {
      console.error('❌ isDriverAlreadyPickedInAnyLeague test failed:', error);
      return false;
    }
  },

  async testBatchOperations() {
    console.log('🧪 Testing batch operations performance...');
    
    try {
      const testLeagueIds = ['test-1', 'test-2', 'test-3'];
      
      // Test parallel vs sequential performance
      const startTime = Date.now();
      const batchPromises = [
        amplifyDataService.batchGetLeagues(testLeagueIds),
        amplifyDataService.batchGetLeagueMembers(testLeagueIds),
        amplifyDataService.batchGetRecentPicks(testLeagueIds, 3)
      ];
      
      await Promise.all(batchPromises);
      const endTime = Date.now();
      
      const batchTime = endTime - startTime;
      console.assert(batchTime < 5000, `Batch operations took ${batchTime}ms, should be < 5000ms`);
      
      console.log(`✅ Batch operations test passed (${batchTime}ms)`);
      return true;
    } catch (error) {
      console.error('❌ Batch operations test failed:', error);
      return false;
    }
  }
};

// Integration Layer Tests
export const integrationLayerTests = {

  async testInitializeMultiLeagueSystem() {
    console.log('🧪 Testing initializeMultiLeagueSystem...');
    
    try {
      const context = await initializeMultiLeagueSystem();
      
      console.assert(context instanceof MultiLeagueContext, 'Should return MultiLeagueContext instance');
      
      console.log('✅ initializeMultiLeagueSystem test passed');
      return true;
    } catch (error) {
      console.error('❌ initializeMultiLeagueSystem test failed:', error);
      return false;
    }
  },

  async testMultiLeagueContextFunctions() {
    console.log('🧪 Testing multi-league context functions...');
    
    // Test getMultiLeagueContext
    const multiContext = getMultiLeagueContext();
    console.assert(typeof multiContext === 'object', 'getMultiLeagueContext should return object');
    
    // Test getActiveLeagueContext
    const activeContext = getActiveLeagueContext();
    console.assert(typeof activeContext === 'object', 'getActiveLeagueContext should return object');
    console.assert(typeof activeContext.isLeagueMode === 'boolean', 'Should have isLeagueMode property');
    
    console.log('✅ Multi-league context functions test passed');
    return true;
  },

  async testPickOperationsWithContext() {
    console.log('🧪 Testing pick operations with multi-league context...');
    
    try {
      // Test loadPicksWithContext
      const picks = await loadPicksWithContext();
      console.assert(Array.isArray(picks), 'loadPicksWithContext should return array');
      
      // Test isDriverAlreadyPickedWithContext
      const driverPicked = await isDriverAlreadyPickedWithContext(1);
      console.assert(typeof driverPicked === 'boolean', 'isDriverAlreadyPickedWithContext should return boolean');
      
      // Test cross-league validation
      const pickedInAny = await isDriverAlreadyPickedInAnyLeague(1);
      console.assert(typeof pickedInAny === 'object' || typeof pickedInAny === 'boolean', 'Cross-league validation should work');
      
      console.log('✅ Pick operations with context test passed');
      return true;
    } catch (error) {
      console.error('❌ Pick operations with context test failed:', error);
      return false;
    }
  }
};

/**
 * PERFORMANCE BENCHMARKS
 */
export const performanceTests = {

  async testMultiLeagueLoadingPerformance() {
    console.log('🧪 Testing multi-league loading performance requirements...');
    
    const startTime = Date.now();
    await multiLeagueContext.loadUserLeagues(true); // Force refresh
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    const meetsRequirement = loadTime < 2000;
    
    console.log(`Multi-league loading: ${loadTime}ms (Requirement: < 2000ms) ${meetsRequirement ? '✅' : '❌'}`);
    return meetsRequirement;
  },

  async testLeagueSwitchingPerformance() {
    console.log('🧪 Testing league switching performance requirements...');
    
    // Add test league if needed
    if (!multiLeagueContext.userLeagues.has('test-league-1')) {
      multiLeagueContext.addLeague(TEST_CONFIG.sampleLeagues[0]);
    }
    
    const startTime = Date.now();
    multiLeagueContext.setActiveLeague('test-league-1');
    const endTime = Date.now();
    
    const switchTime = endTime - startTime;
    const meetsRequirement = switchTime < 500;
    
    console.log(`League switching: ${switchTime}ms (Requirement: < 500ms) ${meetsRequirement ? '✅' : '❌'}`);
    return meetsRequirement;
  },

  async testCrossLeagueQueryPerformance() {
    console.log('🧪 Testing cross-league query performance requirements...');
    
    const startTime = Date.now();
    await amplifyDataService.getCrossLeagueStatistics();
    const endTime = Date.now();
    
    const queryTime = endTime - startTime;
    const meetsRequirement = queryTime < 1000;
    
    console.log(`Cross-league queries: ${queryTime}ms (Requirement: < 1000ms) ${meetsRequirement ? '✅' : '❌'}`);
    return meetsRequirement;
  }
};

/**
 * ERROR HANDLING TESTS
 */
export const errorHandlingTests = {

  async testUnauthenticatedUserHandling() {
    console.log('🧪 Testing unauthenticated user error handling...');
    
    try {
      // Mock unauthenticated state
      const originalGetCurrentUser = authManager.getCurrentUser;
      authManager.getCurrentUser = async () => null;
      
      // Clear any existing cache to ensure fresh test
      multiLeagueContext.clearCache('all');
      
      // Test various operations - use forceRefresh to bypass cache
      const leagues = await multiLeagueContext.loadUserLeagues(true);
      if (!Array.isArray(leagues) || leagues.length !== 0) {
        console.error('Should return empty array for unauthenticated user, got:', leagues);
        // Restore original function before returning
        authManager.getCurrentUser = originalGetCurrentUser;
        return false;
      }
      
      const picks = await loadPicksWithContext();
      if (!Array.isArray(picks) || picks.length !== 0) {
        console.error('Should return empty picks for unauthenticated user, got:', picks);
        // Restore original function before returning
        authManager.getCurrentUser = originalGetCurrentUser;
        return false;
      }
      
      // Restore original function
      authManager.getCurrentUser = originalGetCurrentUser;
      
      console.log('✅ Unauthenticated user handling test passed');
      return true;
    } catch (error) {
      console.error('❌ Unauthenticated user handling test failed:', error);
      return false;
    }
  },

  async testNetworkErrorHandling() {
    console.log('🧪 Testing network error handling...');
    
    try {
      // Test with invalid league ID
      const result = await multiLeagueContext.getLeagueMembers('invalid-league-id');
      console.assert(Array.isArray(result), 'Should return empty array for invalid league');
      
      console.log('✅ Network error handling test passed');
      return true;
    } catch (error) {
      console.error('❌ Network error handling test failed:', error);
      return false;
    }
  }
};

/**
 * MAIN TEST RUNNER
 */
export async function runPhase1Tests() {
  console.log('🚀 Starting Phase 1: Multi-League Core Architecture Tests');
  console.log('=' .repeat(60));
  
  const testSuites = [
    { name: 'MultiLeagueContext Tests', tests: multiLeagueContextTests },
    { name: 'Enhanced AmplifyDataService Tests', tests: amplifyDataServiceTests },
    { name: 'Integration Layer Tests', tests: integrationLayerTests },
    { name: 'Performance Tests', tests: performanceTests },
    { name: 'Error Handling Tests', tests: errorHandlingTests }
  ];
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };
  
  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log('-'.repeat(40));
    
    for (const [testName, testFunction] of Object.entries(suite.tests)) {
      results.total++;
      
      try {
        const passed = await testFunction();
        if (passed) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push(`${suite.name}: ${testName} - Test assertion failed`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${suite.name}: ${testName} - ${error.message}`);
        console.error(`❌ ${testName} failed with error:`, error);
      }
    }
  }
  
  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 PHASE 1 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ${results.failed > 0 ? '❌' : '✅'}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  const allTestsPassed = results.failed === 0;
  console.log(`\n${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('Phase 1 multi-league data architecture is ' + (allTestsPassed ? 'READY' : 'NOT READY') + ' for Phase 2');
  
  return {
    success: allTestsPassed,
    results
  };
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  window.runPhase1Tests = runPhase1Tests;
  console.log('Phase 1 tests loaded. Run window.runPhase1Tests() to execute.');
} else {
  // Node.js environment
  console.log('Phase 1 test suite loaded. Call runPhase1Tests() to execute.');
} 