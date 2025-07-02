import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ========================================
  // USER MANAGEMENT
  // ========================================
  
  UserProfile: a.model({
    // Primary identification
    userId: a.id().required(),
    username: a.string().required(),
    email: a.string().required(),
    
    // Owner field (required for owner-based authorization)
    owner: a.string(),
    
    // Personal information (for Google OAuth)
    displayName: a.string(),
    firstName: a.string(),
    lastName: a.string(),
    profilePicture: a.string(), // URL to profile picture
    googleId: a.string(), // Google user ID for OAuth users
    
    // Game statistics
    currentSeason: a.string().required().default("2025"),
    totalSurvivedRaces: a.integer().default(0),
    isEliminated: a.boolean().default(false),
    eliminatedAt: a.datetime(),
    
    // User preferences
    preferredTeam: a.string(),
    timeZone: a.string(),
    notificationsEnabled: a.boolean().default(true),
    
    // Metadata
    joinedAt: a.datetime().required(),
    lastActiveAt: a.datetime(),
    
    // Relationships
    picks: a.hasMany('DriverPick', 'userId'),
    leagueMemberships: a.hasMany('LeagueMember', 'userId'),
    ownedLeagues: a.hasMany('League', 'ownerId')
  }).authorization((allow) => [
    allow.owner().identityClaim("sub"),
    allow.authenticated().to(["read"])
  ]),

  // ========================================
  // LEAGUE SYSTEM
  // ========================================
  
  League: a.model({
    // Core identification
    leagueId: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    inviteCode: a.string().required(),
    
    // Ownership and management
    ownerId: a.id().required(),
    season: a.string().required(),
    
    // League configuration
    maxMembers: a.integer().default(20),
    isPrivate: a.boolean().default(true),
    autoPickEnabled: a.boolean().default(true),
    
    // Status and metadata
    status: a.enum(['ACTIVE', 'COMPLETED', 'PAUSED']),
    createdAt: a.datetime().required(),
    lastActiveAt: a.datetime(),
    
    // Enhanced settings with lives configuration
    settings: a.json(),
    /*
    {
      maxLives: 1-5,           // Default: 1 (backward compatible)
      livesEnabled: boolean,   // Default: false (single life)
      autoPickEnabled: boolean,
      isPrivate: boolean,
      livesLockDate: string,   // ISO date when lives can no longer be changed
      customRules: string      // Optional additional rules text
    }
    */
    
    // Relationships
    owner: a.belongsTo('UserProfile', 'ownerId'),
    members: a.hasMany('LeagueMember', 'leagueId'),
    picks: a.hasMany('DriverPick', 'leagueId')
  })
  .secondaryIndexes((index) => [
    index('ownerId').name('byOwner'),
    index('inviteCode').name('byInviteCode'),
    // Add a composite index for owner + name to help enforce uniqueness
    index('ownerId').sortKeys(['name']).name('byOwnerAndName')
  ])
  .authorization((allow) => [
    allow.ownerDefinedIn('ownerId'),
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  LeagueMember: a.model({
    // Composite key relationship
    leagueId: a.id().required(),
    userId: a.id().required(),
    
    // Member status
    status: a.enum(['ACTIVE', 'ELIMINATED', 'LEFT']),
    joinedAt: a.datetime().required(),
    eliminatedAt: a.datetime(),
    leftAt: a.datetime(),
    
    // Game statistics
    survivedRaces: a.integer().default(0),
    totalPicks: a.integer().default(0),
    autoPickCount: a.integer().default(0),
    
    // Lives tracking fields (NEW)
    remainingLives: a.integer().default(1),
    livesUsed: a.integer().default(0),
    maxLives: a.integer().default(1), // Copy from league settings at join time
    
    // Enhanced elimination tracking (NEW)
    eliminationHistory: a.json(), // Array of elimination events
    /*
    [
      {
        raceId: string,
        raceName: string,
        driverPicked: string,
        finalPosition: number,
        eliminatedAt: string,
        livesLostCount: number
      }
    ]
    */
    
    // Member role
    isOwner: a.boolean().default(false),
    isModerator: a.boolean().default(false),
    
    // Relationships
    league: a.belongsTo('League', 'leagueId'),
    user: a.belongsTo('UserProfile', 'userId')
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ]),

  // ========================================
  // LIFE EVENTS TRACKING (NEW)
  // ========================================
  
  LifeEvent: a.model({
    userId: a.id().required(),
    leagueId: a.id().required(),
    raceId: a.string().required(),
    
    eventType: a.enum(['LIFE_LOST', 'LIFE_RESTORED', 'FINAL_ELIMINATION']),
    livesRemaining: a.integer().required(),
    
    // Event details
    driverPicked: a.string(),
    finalPosition: a.integer(),
    eventDate: a.datetime().required(),
    
    // Admin action tracking
    adminUserId: a.id(), // If life restored by admin
    adminReason: a.string(),
    
    // Relationships
    user: a.belongsTo('UserProfile', 'userId'),
    league: a.belongsTo('League', 'leagueId')
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.ownerDefinedIn('userId'),
    allow.ownerDefinedIn('adminUserId')
  ]),

  // ========================================
  // F1 REFERENCE DATA
  // ========================================
  
  Season: a.model({
    year: a.string().required(),
    name: a.string().required(), // "Formula 1 2025 Season"
    isActive: a.boolean().default(false),
    startDate: a.date().required(),
    endDate: a.date().required(),
    
    // Metadata
    totalRaces: a.integer().required(),
    currentRound: a.integer().default(0),
    
    // Relationships
    races: a.hasMany('Race', 'seasonId'),
    drivers: a.hasMany('Driver', 'seasonId'),
    picks: a.hasMany('DriverPick', 'seasonId')
  }).authorization((allow) => [
    allow.publicApiKey().to(['read']), // Guests can view season info
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  Race: a.model({
    // Primary identification
    raceId: a.string().required(), // "mon-2025"
    seasonId: a.id().required(),
    
    // Race information
    name: a.string().required(), // "Monaco GP"
    location: a.string().required(), // "Monaco"
    country: a.string().required(), // "Monaco"
    circuit: a.string().required(), // "Circuit de Monaco"
    
    // Scheduling
    round: a.integer().required(),
    raceDate: a.datetime().required(),
    qualifyingDate: a.datetime(),
    pickDeadline: a.datetime().required(),
    
    // Race status
    status: a.enum(['SCHEDULED', 'QUALIFYING', 'RACE_WEEKEND', 'COMPLETED']),
    
    // Timing information
    timeLocal: a.string(), // "15:00"
    timeGMT: a.string(),   // "13:00"
    timeZone: a.string(),  // "Europe/Monaco"
    
    // Metadata
    weather: a.json(), // Weather conditions
    
    // Relationships
    season: a.belongsTo('Season', 'seasonId'),
    picks: a.hasMany('DriverPick', 'raceId'),
    results: a.hasMany('RaceResult', 'raceId'),
    qualifyingResults: a.hasMany('QualifyingResult', 'raceId')
  }).authorization((allow) => [
    allow.publicApiKey().to(['read']), // Guests can view race calendar
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  Driver: a.model({
    // Driver identification
    driverId: a.string().required(), // Changed to string for consistency
    seasonId: a.id().required(),
    
    // Driver information
    name: a.string().required(),
    firstName: a.string(),
    lastName: a.string(),
    nationality: a.string(),
    
    // Team information
    team: a.string().required(),
    teamColor: a.string(), // Hex color code
    number: a.integer().required(),
    
    // Status
    isActive: a.boolean().default(true),
    
    // Media
    imageUrl: a.string(),
    profileUrl: a.string(),
    
    // Relationships
    season: a.belongsTo('Season', 'seasonId'),
    picks: a.hasMany('DriverPick', 'driverId'),
    results: a.hasMany('RaceResult', 'driverId'),
    qualifyingResults: a.hasMany('QualifyingResult', 'driverId')
  }).authorization((allow) => [
    allow.publicApiKey().to(['read']), // Guests can view driver info
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  // ========================================
  // GAME LOGIC & PICKS
  // ========================================
  
  DriverPick: a.model({
    // Primary identification
    pickId: a.id().required(),
    userId: a.id().required(),
    
    // Context
    seasonId: a.id().required(),
    raceId: a.string().required(),
    leagueId: a.id(), // Null for solo play
    
    // Pick details
    driverId: a.string().required(),
    
    // Cached driver/race info for performance
    driverName: a.string().required(),
    teamName: a.string().required(),
    raceName: a.string().required(),
    
    // Pick metadata
    submittedAt: a.datetime().required(),
    pickDeadline: a.datetime().required(),
    isAutoPick: a.boolean().default(false),
    autoPickReason: a.string(), // "P15_FALLBACK", "DEADLINE_MISSED"
    
    // Results (populated after race)
    finalPosition: a.integer(),
    didFinishInTop10: a.boolean(),
    survived: a.boolean(),
    points: a.integer().default(0),
    eliminatedAt: a.datetime(),
    
    // Validation flags
    isValid: a.boolean().default(true),
    validationErrors: a.json(),
    
    // Relationships
    user: a.belongsTo('UserProfile', 'userId'),
    league: a.belongsTo('League', 'leagueId'),
    race: a.belongsTo('Race', 'raceId'),
    driver: a.belongsTo('Driver', 'driverId'),
    season: a.belongsTo('Season', 'seasonId')
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ]),

  // ========================================
  // RACE RESULTS & PERFORMANCE
  // ========================================
  
  RaceResult: a.model({
    // Primary identification
    resultId: a.id().required(),
    raceId: a.string().required(),
    driverId: a.string().required(),
    
    // Race results
    finalPosition: a.integer().required(),
    gridPosition: a.integer(),
    fastestLap: a.boolean().default(false),
    didFinish: a.boolean().default(true),
    dnfReason: a.string(),
    
    // Timing
    raceTime: a.string(), // "1:32:15.123"
    gapToWinner: a.string(), // "+5.234s"
    
    // Points and performance
    points: a.integer().default(0),
    
    // Metadata
    processedAt: a.datetime().required(),
    
    // Relationships
    race: a.belongsTo('Race', 'raceId'),
    driver: a.belongsTo('Driver', 'driverId')
  }).authorization((allow) => [
    allow.publicApiKey().to(['read']), // Guests can view race results
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  // ========================================
  // QUALIFYING RESULTS (for auto-pick)
  // ========================================
  
  QualifyingResult: a.model({
    // Primary identification
    qualifyingId: a.id().required(),
    raceId: a.string().required(),
    driverId: a.string().required(),
    
    // Qualifying results
    position: a.integer().required(),
    q1Time: a.string(),
    q2Time: a.string(),
    q3Time: a.string(),
    
    // Best lap
    bestLapTime: a.string(),
    
    // Metadata
    processedAt: a.datetime().required(),
    
    // Relationships
    race: a.belongsTo('Race', 'raceId'),
    driver: a.belongsTo('Driver', 'driverId')
  }).authorization((allow) => [
    allow.publicApiKey().to(['read']), // Guests can view qualifying results
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // User Pool for authenticated users (picks, dashboard, leagues)
    defaultAuthorizationMode: 'userPool',
    
    // API Key for guest access (race info, drivers, results)
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
      description: 'Public API access for guest users viewing F1 data'
    }
  }
});
