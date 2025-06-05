/**
 * Core Data Schema CRUD Validation Test
 * Tests basic operations on F1 Survivor GraphQL schema
 */

import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplify_outputs.json' with { type: 'json' };

// Configure Amplify
Amplify.configure(amplifyconfig);

// Create data client with API key for guest access testing
const client = generateClient({
  authMode: 'apiKey'
});

/**
 * Test F1 Reference Data (Guest Access)
 */
async function testGuestAccess() {
  console.log('\n🔍 Testing Guest Access (API Key) - F1 Reference Data');
  console.log('=' .repeat(60));

  try {
    // Test Season read access
    console.log('📅 Testing Season access...');
    const seasons = await client.models.Season.list();
    console.log(`✅ Seasons query successful. Found: ${seasons.data.length} seasons`);

    // Test Race read access  
    console.log('🏁 Testing Race access...');
    const races = await client.models.Race.list();
    console.log(`✅ Races query successful. Found: ${races.data.length} races`);

    // Test Driver read access
    console.log('🏎️  Testing Driver access...');
    const drivers = await client.models.Driver.list();
    console.log(`✅ Drivers query successful. Found: ${drivers.data.length} drivers`);

    // Test RaceResult read access
    console.log('🏆 Testing RaceResult access...');
    const results = await client.models.RaceResult.list();
    console.log(`✅ Race results query successful. Found: ${results.data.length} results`);

    // Test QualifyingResult read access
    console.log('⏱️  Testing QualifyingResult access...');
    const qualifying = await client.models.QualifyingResult.list();
    console.log(`✅ Qualifying results query successful. Found: ${qualifying.data.length} results`);

  } catch (error) {
    console.error('❌ Guest access test failed:', error.message);
    return false;
  }

  return true;
}

/**
 * Test Authentication Required Models
 */
async function testAuthenticationRequired() {
  console.log('\n🔒 Testing Authentication Required Models');
  console.log('=' .repeat(60));

  try {
    // These should fail with API key (require user pool authentication)
    console.log('👤 Testing UserProfile access (should fail)...');
    await client.models.UserProfile.list();
    console.log('❌ UNEXPECTED: UserProfile accessible with API key');
    return false;

  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('GraphQL error')) {
      console.log('✅ UserProfile correctly blocked for guest access');
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }

  try {
    console.log('🏆 Testing League access (should fail)...');
    await client.models.League.list();
    console.log('❌ UNEXPECTED: League accessible with API key');
    return false;

  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('GraphQL error')) {
      console.log('✅ League correctly blocked for guest access');
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }

  try {
    console.log('🎯 Testing DriverPick access (should fail)...');
    await client.models.DriverPick.list();
    console.log('❌ UNEXPECTED: DriverPick accessible with API key');
    return false;

  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('GraphQL error')) {
      console.log('✅ DriverPick correctly blocked for guest access');
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }

  return true;
}

/**
 * Test Basic Model Creation (Admin operations)
 */
async function testBasicCRUD() {
  console.log('\n🔧 Testing Basic CRUD Operations');
  console.log('=' .repeat(60));

  try {
    // Test Season creation
    console.log('📅 Creating test season...');
    const seasonData = {
      year: "2025",
      name: "Formula 1 2025 Season",
      isActive: true,
      startDate: "2025-03-01",
      endDate: "2025-12-31",
      totalRaces: 24,
      currentRound: 0
    };

    const season = await client.models.Season.create(seasonData);
    console.log(`✅ Season created successfully. ID: ${season.data.id}`);

    // Test Driver creation
    console.log('🏎️  Creating test driver...');
    const driverData = {
      driverId: "test-verstappen-1",
      seasonId: season.data.id,
      name: "Max Verstappen",
      firstName: "Max",
      lastName: "Verstappen",
      nationality: "Dutch",
      team: "Red Bull Racing",
      teamColor: "#3671C6",
      number: 1,
      isActive: true,
      imageUrl: "assets/images/drivers/verstappen.png"
    };

    const driver = await client.models.Driver.create(driverData);
    console.log(`✅ Driver created successfully. ID: ${driver.data.id}`);

    // Test Race creation
    console.log('🏁 Creating test race...');
    const raceData = {
      raceId: "test-monaco-2025",
      seasonId: season.data.id,
      name: "Monaco GP",
      location: "Monaco",
      country: "Monaco",
      circuit: "Circuit de Monaco",
      round: 8,
      raceDate: "2025-05-25T13:00:00Z",
      pickDeadline: "2025-05-25T11:00:00Z",
      timeLocal: "15:00",
      timeGMT: "13:00",
      timeZone: "Europe/Monaco"
    };

    const race = await client.models.Race.create(raceData);
    console.log(`✅ Race created successfully. ID: ${race.data.id}`);

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await client.models.Driver.delete({ id: driver.data.id });
    await client.models.Race.delete({ id: race.data.id });
    await client.models.Season.delete({ id: season.data.id });
    console.log('✅ Test data cleaned up successfully');

    return true;

  } catch (error) {
    console.error('❌ CRUD test failed:', error.message);
    return false;
  }
}

/**
 * Main test execution
 */
async function runSchemaValidation() {
  console.log('🚀 F1 Survivor Core Data Schema Validation');
  console.log('Testing Phase 1: Core Schema Setup Results');
  console.log('=' .repeat(80));

  let allTestsPassed = true;

  // Test 1: Guest access to public F1 data
  const guestAccessTest = await testGuestAccess();
  allTestsPassed = allTestsPassed && guestAccessTest;

  // Test 2: Authentication requirements
  const authTest = await testAuthenticationRequired();
  allTestsPassed = allTestsPassed && authTest;

  // Test 3: Basic CRUD operations
  const crudTest = await testBasicCRUD();
  allTestsPassed = allTestsPassed && crudTest;

  // Summary
  console.log('\n' + '=' .repeat(80));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Core Data Schema is working correctly.');
    console.log('✅ Phase 1: Core Schema Setup - COMPLETED');
    console.log('\nNext Steps:');
    console.log('  • Phase 2: User and League Models (Authentication Integration)');
    console.log('  • Phase 3: F1 Data Seeding');
    console.log('  • Phase 4: Advanced Query Optimization');
  } else {
    console.log('❌ SOME TESTS FAILED. Please review the errors above.');
  }
  console.log('=' .repeat(80));
}

// Run the validation
runSchemaValidation().catch(console.error); 