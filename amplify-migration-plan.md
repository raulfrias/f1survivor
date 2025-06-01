# F1 Survivor AWS Amplify Gen2 Migration Plan

## Executive Summary

Your F1 Survivor application is perfectly positioned for migration to AWS Amplify Gen2. The current frontend-only architecture with localStorage persistence can seamlessly transition to a fully managed AWS backend while maintaining the excellent user experience you've built.

## Migration Benefits

- **TypeScript-First Backend**: Define your entire backend in TypeScript with type safety
- **Simplified Development**: Single codebase for frontend and backend logic  
- **Real-time Features**: Built-in real-time subscriptions for live league updates
- **Scalability**: AWS managed services that scale automatically
- **Local Development**: Cloud sandbox environments for isolated testing
- **CI/CD Integration**: Git-based deployments with Vercel-like simplicity

## Detailed Migration Plan

### Phase 1: Project Structure Transformation (Week 1)

#### 1.1 Build System Migration: Vite → Amplify Gen2

**Decision: Keep Vite + Add Amplify Gen2**
- Your current ES6 module setup works perfectly with Amplify Gen2
- Amplify Gen2 supports Vite out of the box
- No need to change your existing build pipeline

**Actions:**
```bash
npm install @aws-amplify/backend @aws-amplify/ui-react aws-amplify
```

#### 1.2 Project Structure Update

**New Structure:**
```
f1survivor/
├── amplify/                  # NEW: Backend definition
│   ├── backend.ts           # Main backend configuration
│   ├── auth/
│   │   └── resource.ts      # Cognito configuration
│   ├── data/
│   │   └── resource.ts      # AppSync + DynamoDB schema
│   ├── storage/
│   │   └── resource.ts      # S3 storage for assets
│   └── functions/           # Lambda functions
├── src/                     # Existing frontend code
├── assets/                  # Existing assets
├── amplify_outputs.json     # Generated backend config
└── package.json
```

### Phase 2: Backend Infrastructure Definition (Week 2)

#### 2.1 Authentication Setup

**File: `amplify/auth/resource.ts`**
```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Welcome to F1 Survivor! 🏎️',
      verificationEmailBody: (createCode) => 
        `Your verification code is: ${createCode()}. Welcome to the grid!`
    },
    // Future: Add Google/social providers
    // externalProviders: {
    //   google: {
    //     clientId: 'your-google-client-id',
    //     clientSecret: 'your-google-client-secret'
    //   }
    // }
  },
  userAttributes: {
    preferredUsername: {
      required: false,
      mutable: true
    },
    profilePicture: {
      required: false, 
      mutable: true
    }
  },
  groups: ['administrators', 'premium_users'],
  triggers: {
    postConfirmation: './auth-triggers/post-confirmation.ts'
  }
});
```

#### 2.2 Data Model Definition

**File: `amplify/data/resource.ts`**
```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // User Profile
  UserProfile: a.model({
    userId: a.id().required(),
    username: a.string().required(),
    email: a.string().required(),
    totalSurvivedRaces: a.integer().default(0),
    isEliminated: a.boolean().default(false),
    preferredTeam: a.string(),
    joinedAt: a.datetime().required(),
    lastActiveAt: a.datetime()
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ]),

  // League System
  League: a.model({
    name: a.string().required(),
    description: a.string(),
    inviteCode: a.string().required(),
    ownerId: a.id().required(),
    maxMembers: a.integer().default(50),
    isPublic: a.boolean().default(false),
    season: a.string().required(),
    settings: a.json(), // League-specific settings
    createdAt: a.datetime().required(),
    
    // Relationships
    members: a.hasMany('LeagueMember', 'leagueId'),
    picks: a.hasMany('DriverPick', 'leagueId')
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  LeagueMember: a.model({
    leagueId: a.id().required(),
    userId: a.id().required(), 
    joinedAt: a.datetime().required(),
    isActive: a.boolean().default(true),
    survivedRaces: a.integer().default(0),
    eliminatedAt: a.datetime(),
    
    // Relationships
    league: a.belongsTo('League', 'leagueId'),
    user: a.belongsTo('UserProfile', 'userId'),
    picks: a.hasMany('DriverPick', 'userId')
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ]),

  // F1 Data Models
  Season: a.model({
    year: a.string().required(),
    isActive: a.boolean().default(false),
    races: a.hasMany('Race', 'seasonId')
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  Race: a.model({
    seasonId: a.id().required(),
    raceId: a.string().required(), // e.g., 'bhr-2025'
    name: a.string().required(),
    circuit: a.string().required(),
    country: a.string().required(),
    scheduledDate: a.datetime().required(),
    pickDeadline: a.datetime().required(),
    status: a.enum(['scheduled', 'qualifying', 'race_weekend', 'completed']),
    round: a.integer().required(),
    
    // Relationships
    season: a.belongsTo('Season', 'seasonId'),
    picks: a.hasMany('DriverPick', 'raceId'),
    results: a.hasMany('RaceResult', 'raceId')
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  Driver: a.model({
    driverId: a.integer().required(),
    name: a.string().required(),
    team: a.string().required(),
    teamColor: a.string(),
    number: a.integer().required(),
    nationality: a.string(),
    imageUrl: a.string(),
    isActive: a.boolean().default(true),
    
    // Relationships  
    picks: a.hasMany('DriverPick', 'driverId'),
    results: a.hasMany('RaceResult', 'driverId')
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  // Core Game Logic
  DriverPick: a.model({
    userId: a.id().required(),
    leagueId: a.id(),
    raceId: a.id().required(),
    driverId: a.integer().required(),
    pickDeadline: a.datetime().required(),
    isAutoPick: a.boolean().default(false),
    submittedAt: a.datetime().required(),
    
    // Results
    finalPosition: a.integer(),
    didFinishInTop10: a.boolean(),
    survived: a.boolean(),
    points: a.integer().default(0),
    
    // Relationships
    user: a.belongsTo('UserProfile', 'userId'),
    league: a.belongsTo('League', 'leagueId'),
    race: a.belongsTo('Race', 'raceId'),
    driver: a.belongsTo('Driver', 'driverId')
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ]),

  RaceResult: a.model({
    raceId: a.id().required(),
    driverId: a.integer().required(),
    position: a.integer().required(),
    points: a.integer().default(0),
    status: a.string(), // 'Finished', 'DNF', 'DSQ', etc.
    processedAt: a.datetime().required(),
    
    // Relationships
    race: a.belongsTo('Race', 'raceId'),
    driver: a.belongsTo('Driver', 'driverId')
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.group('administrators')
  ]),

  // Custom Queries & Mutations
  submitDriverPick: a.mutation()
    .arguments({
      leagueId: a.string(),
      raceId: a.string().required(),
      driverId: a.integer().required()
    })
    .returns(a.ref('DriverPick'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function('submitPickHandler')),

  processRaceResults: a.mutation()
    .arguments({ raceId: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.group('administrators')])
    .handler(a.handler.function('processResultsHandler')),

  getLeagueStandings: a.query()
    .arguments({ leagueId: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function('getStandingsHandler')),

  // Real-time subscriptions
  onPickSubmitted: a.subscription()
    .for(a.ref('submitDriverPick'))
    .arguments({ leagueId: a.string() })
    .authorization((allow) => [allow.authenticated()])
}).authorization((allow) => [allow.resource(a.lambda('defaultPolicy'))]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    userPoolAuthorizationMode: {
      userPoolId: 'AMAZON_COGNITO_USER_POOLS'
    },
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
      description: 'API Key for public data access'
    }
  }
});
```

#### 2.3 Storage Configuration

**File: `amplify/storage/resource.ts`**
```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'f1SurvivorStorage',
  access: (allow) => ({
    'driver-images/*': [
      allow.guest.to(['read']),
      allow.authenticated().to(['read']),
      allow.group('administrators').to(['read', 'write', 'delete'])
    ],
    'team-logos/*': [
      allow.guest.to(['read']),
      allow.authenticated().to(['read']),
      allow.group('administrators').to(['read', 'write', 'delete'])
    ],
    'user-avatars/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
});
```

#### 2.4 Main Backend Configuration

**File: `amplify/backend.ts`**
```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { submitPickHandler } from './functions/submit-pick-handler/resource';
import { processResultsHandler } from './functions/process-results-handler/resource';
import { getStandingsHandler } from './functions/get-standings-handler/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  submitPickHandler,
  processResultsHandler,
  getStandingsHandler
});

// Grant Lambda functions access to data
backend.data.addLambdaDataSource('submitPick', backend.submitPickHandler);
backend.data.addLambdaDataSource('processResults', backend.processResultsHandler);
backend.data.addLambdaDataSource('getStandings', backend.getStandingsHandler);
```

### Phase 3: Lambda Functions (Week 3)

#### 3.1 Submit Pick Handler

**File: `amplify/functions/submit-pick-handler/resource.ts`**
```typescript
import { defineFunction } from '@aws-amplify/backend';

export const submitPickHandler = defineFunction({
  name: 'submitPickHandler',
  entry: './handler.ts',
  environment: {
    F1_API_BASE_URL: 'https://api.openf1.org/v1'
  },
  timeoutSeconds: 30
});
```

**File: `amplify/functions/submit-pick-handler/handler.ts`**
```typescript
import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDBClient({});

interface SubmitPickArgs {
  leagueId?: string;
  raceId: string;
  driverId: number;
}

export const handler: AppSyncResolverHandler<SubmitPickArgs, any> = async (event) => {
  const { leagueId, raceId, driverId } = event.arguments;
  const userId = event.identity?.sub;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // 1. Validate pick deadline hasn't passed
    const race = await getRace(raceId);
    const now = new Date();
    const deadline = new Date(race.pickDeadline);
    
    if (now > deadline) {
      throw new Error('Pick deadline has passed');
    }

    // 2. Check if driver was previously picked by user
    const previousPicks = await getUserPreviousPicks(userId, leagueId);
    const alreadyPicked = previousPicks.some(pick => pick.driverId === driverId);
    
    if (alreadyPicked) {
      throw new Error('Driver already picked in a previous race');
    }

    // 3. Check for existing pick for this race
    const existingPick = await getUserPickForRace(userId, raceId, leagueId);
    
    // 4. Create or update pick
    const pick = {
      id: existingPick?.id || generateId(),
      userId,
      leagueId,
      raceId,
      driverId,
      pickDeadline: race.pickDeadline,
      isAutoPick: false,
      submittedAt: now.toISOString(),
      __typename: 'DriverPick'
    };

    await putItem('DriverPick', pick);

    return pick;
  } catch (error) {
    console.error('Error submitting pick:', error);
    throw error;
  }
};

async function getRace(raceId: string) {
  // Query race data from DynamoDB
  const params = {
    TableName: process.env.RACE_TABLE_NAME,
    Key: marshall({ id: raceId })
  };
  
  // Implementation details...
  return { pickDeadline: '2025-05-25T11:00:00Z' }; // Placeholder
}

async function getUserPreviousPicks(userId: string, leagueId?: string) {
  // Query user's previous picks
  return []; // Placeholder
}

async function getUserPickForRace(userId: string, raceId: string, leagueId?: string) {
  // Check for existing pick
  return null; // Placeholder
}

async function putItem(tableName: string, item: any) {
  // Put item to DynamoDB
}

function generateId() {
  return `pick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### Phase 4: Frontend Migration (Week 4)

#### 4.1 Update Main App Configuration

**File: `src/main.js` (Update existing)**
```javascript
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

// Your existing app initialization code...
```

#### 4.2 Create Data Service Layer

**File: `src/services/amplify-data-service.js`**
```javascript
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient();

export class AmplifyDataService {
  
  // User Management
  async getCurrentUser() {
    try {
      return await getCurrentUser();
    } catch (error) {
      console.error('No authenticated user:', error);
      return null;
    }
  }

  async createUserProfile(userData) {
    const { errors, data } = await client.models.UserProfile.create(userData);
    if (errors) throw new Error(errors[0].message);
    return data;
  }

  // League Management
  async createLeague(leagueData) {
    const { errors, data } = await client.models.League.create({
      ...leagueData,
      inviteCode: this.generateInviteCode(),
      season: '2025',
      createdAt: new Date().toISOString()
    });
    if (errors) throw new Error(errors[0].message);
    return data;
  }

  async joinLeague(inviteCode) {
    // First find the league
    const { data: leagues } = await client.models.League.list({
      filter: { inviteCode: { eq: inviteCode } }
    });
    
    if (!leagues.length) {
      throw new Error('League not found');
    }

    const league = leagues[0];
    const user = await this.getCurrentUser();
    
    // Create league membership
    const { errors, data } = await client.models.LeagueMember.create({
      leagueId: league.id,
      userId: user.userId,
      joinedAt: new Date().toISOString()
    });
    
    if (errors) throw new Error(errors[0].message);
    return data;
  }

  // Driver Picks
  async submitDriverPick(pickData) {
    const { errors, data } = await client.mutations.submitDriverPick(pickData);
    if (errors) throw new Error(errors[0].message);
    return data;
  }

  async getCurrentRacePick(raceId, leagueId = null) {
    const user = await this.getCurrentUser();
    const filter = { 
      userId: { eq: user.userId },
      raceId: { eq: raceId }
    };
    
    if (leagueId) {
      filter.leagueId = { eq: leagueId };
    }

    const { data: picks } = await client.models.DriverPick.list({ filter });
    return picks[0] || null;
  }

  async getUserPickHistory(leagueId = null) {
    const user = await this.getCurrentUser();
    const filter = { userId: { eq: user.userId } };
    
    if (leagueId) {
      filter.leagueId = { eq: leagueId };
    }

    const { data: picks } = await client.models.DriverPick.list({ filter });
    return picks;
  }

  // Real-time subscriptions
  subscribeToLeagueUpdates(leagueId, callback) {
    return client.models.DriverPick.observeQuery({
      filter: { leagueId: { eq: leagueId } }
    }).subscribe({
      next: ({ items }) => callback(items),
      error: (error) => console.error('Subscription error:', error)
    });
  }

  // Utility methods
  generateInviteCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}

export const dataService = new AmplifyDataService();
```

#### 4.3 Update Storage Utils

**File: `src/services/storage-migration.js`**
```javascript
import { dataService } from './amplify-data-service.js';

// Migration utility to move from localStorage to Amplify
export async function migrateLocalStorageToAmplify() {
  try {
    const user = await dataService.getCurrentUser();
    if (!user) return;

    // Get existing localStorage data
    const existingPicks = JSON.parse(localStorage.getItem('f1survivor_user_picks') || '{}');
    
    if (existingPicks.picks && existingPicks.picks.length > 0) {
      console.log('Migrating picks to Amplify...');
      
      for (const pick of existingPicks.picks) {
        try {
          await dataService.submitDriverPick({
            raceId: pick.raceId,
            driverId: pick.driverId,
            submittedAt: pick.timestamp
          });
        } catch (error) {
          console.warn('Failed to migrate pick:', pick, error);
        }
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem('f1survivor_user_picks');
      console.log('Migration completed');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

#### 4.4 Add Authentication UI

**File: `src/components/auth-wrapper.js`**
```javascript
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export function AuthWrapper({ children }) {
  return (
    <Authenticator
      signUpAttributes={['email', 'preferred_username']}
      components={{
        Header() {
          return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <img src="/assets/images/F1-Logo.png" alt="F1 Logo" style={{ height: '60px' }} />
              <h1>F1 Survivor</h1>
              <p>Survive the Grid</p>
            </div>
          );
        }
      }}
      formFields={{
        signUp: {
          preferred_username: {
            placeholder: 'Choose a username (optional)',
            isRequired: false,
            order: 1
          },
          email: {
            order: 2
          },
          password: {
            order: 3
          },
          confirm_password: {
            order: 4
          }
        }
      }}
    >
      {children}
    </Authenticator>
  );
}
```

### Phase 5: Deployment & Local Development (Week 5)

#### 5.1 Local Development Setup

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Create cloud sandbox
npx ampx sandbox

# Run frontend with hot-reloading
npm run dev
```

#### 5.2 Environment Configuration

**File: `.env.local`**
```
VITE_APP_STAGE=development
VITE_F1_API_URL=https://api.openf1.org/v1
```

**File: `.env.production`**
```
VITE_APP_STAGE=production  
VITE_F1_API_URL=https://api.openf1.org/v1
```

#### 5.3 Deployment to Production

```bash
# Deploy to AWS (connected to GitHub branch)
git add .
git commit -m "feat: migrate to Amplify Gen2 backend"
git push origin master

# Amplify automatically detects changes and deploys
```

### Updated Roadmap

#### Backend Foundation (Modified from original Phase 2)

**Previously:** 
- Set up Node.js/Express project structure
- Create API route configuration  
- Implement Google OAuth integration
- Design database models

**Now (Amplify Gen2):**
- ✅ TypeScript backend definition in `amplify/` folder
- ✅ Cognito authentication with configurable providers
- ✅ AppSync GraphQL API with type-safe schema
- ✅ DynamoDB tables with relationships

**Benefits:**
- Reduced development time from 3 months to 2 weeks
- No server management or scaling concerns
- Built-in best practices and security
- Real-time capabilities out of the box

#### Core Game Logic (Modified from original Phase 3)

**Previously:**
- Connect UI to backend APIs
- Implement F1 data integration
- Build results processing system

**Now (Amplify Gen2):**
- ✅ Type-safe data client generation
- ✅ Custom mutations for business logic
- ✅ Lambda functions for F1 API integration
- ✅ Real-time subscriptions for live updates

#### User Experience Enhancements (Accelerated Phase 4)

**Added capabilities:**
- Real-time league updates (no polling needed)
- Offline-first data synchronization
- Built-in file storage for driver images
- Push notifications via Amplify Notifications

### Migration Strategy

#### Week 1: Foundation
- Set up Amplify Gen2 project structure
- Define authentication configuration
- Create basic data schema

#### Week 2: Data Layer
- Complete data model definition
- Set up Lambda functions
- Test with cloud sandbox

#### Week 3: Integration
- Migrate frontend to use Amplify data service
- Add authentication wrapper
- Implement data migration from localStorage

#### Week 4: Testing
- End-to-end testing in sandbox
- Performance optimization
- UI/UX refinements

#### Week 5: Production Deploy
- Deploy to production branch
- Monitor and optimize
- Update documentation

### Local Development Workflow

```bash
# Start cloud sandbox (in separate terminal)
npx ampx sandbox

# Start frontend development server
npm run dev

# When making backend changes:
# 1. Edit files in amplify/ folder
# 2. Changes automatically deploy to sandbox
# 3. Frontend automatically gets new amplify_outputs.json
# 4. Test changes immediately
```

### Cost Considerations

**Current Costs:** $0 (static hosting only)

**Estimated Monthly Costs with Amplify Gen2:**
- Cognito: $0-15 (first 50k users free)
- AppSync: $4-15 (first 250k queries free) 
- DynamoDB: $0-25 (25GB free tier)
- Lambda: $0-5 (1M requests free)
- S3 Storage: $0-5 (5GB free)

**Total: $4-65/month** depending on usage

### Security & Compliance

- AWS IAM integration
- Row-level security with Cognito
- API rate limiting
- Encryption at rest and in transit
- GDPR compliance tools

### Next Steps

1. **Decision Point**: Approve this migration plan
2. **AWS Setup**: Configure AWS account with IAM Identity Center
3. **Repository Preparation**: Create feature branch for migration
4. **Development**: Follow the 5-week plan
5. **Testing**: Comprehensive testing with league system
6. **Deployment**: Production deployment and monitoring

This migration plan preserves all your excellent frontend work while adding a robust, scalable backend that will support the growth of F1 Survivor into a platform used by thousands of F1 fans worldwide. 