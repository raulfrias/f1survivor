# F1 Survivor Development Roadmap

This document outlines the development phases and tasks for the F1 Survivor game, organized into small, manageable features.

## Phase 1: User Flow Foundation ⚡

### Driver Selection Refinement ✅ (Completed May 2025)
- [x] Create interactive driver selection grid
- [x] Implement team-colored driver cards with images
- [x] Add selection and hover states for driver cards
- [x] Prevent selecting previously picked drivers
- [x] Add loading states and error handling
- [x] Implement local storage for saving user picks
- [x] Enhance pick confirmation with styled modal (replace current alert with detailed driver card)

### Race Countdown & Auto-Pick ✅ (Completed May 2025)
- [x] Create race countdown timer component
- [x] Implement pick deadline logic (lock selections)
- [x] Build P15 auto-pick fallback system (May 2025)
  - Users missing deadline are automatically assigned the P15 qualifier from the latest completed qualifying session.
  - System intelligently falls back to P16-P20, then P14-P1, if the P15 driver (or subsequent fallbacks) has been previously picked by the user in any race.
  - Ensures no repeat driver picks across races.
- [x] Add pick change functionality before deadline
  - Users can change picks until 1 hour before race
  - Clear user-friendly deadline display in local timezone
  - Proper validation and error handling
  - Fallback driver system for future races
- [x] Implement dynamic race state management
  - Accurate title changes ("Next Race" vs "Race in Progress")
  - Real-time race status indicators
  - Proper countdown behavior during live races
  - Clear status messages for all race states
- [x] Comprehensive test scenarios
  - Post-qualifying state with pick selection
  - Race in progress with auto-pick
  - Previous picks validation
  - Error handling and fallbacks

### User Dashboard Mockup ✅ (Completed May 2025)
- [x] Design player status dashboard wireframe
- [x] Create static league standings component
- [x] Build pick history visualization
- [x] Implement dashboard navigation structure
- [x] Build Elimination Zone component with league competition tracking
- [x] Implement responsive design for mobile/tablet/desktop
- [x] Add real-time survival calculations and status indicators
- [x] Create mock data integration for demonstration

### League System Prototype ✅ (Completed December 2024)
- [x] Create league creation form interface
  - Modal-based league creation with custom names
  - Configurable settings (max members, auto-pick)
  - Automatic invite code generation
- [x] Build league joining form with code entry
  - 8-character invite code system
  - Real-time league preview before joining
  - Membership validation and error handling
- [x] Implement local storage for league data
  - Comprehensive data persistence
  - User ID and league membership tracking
  - League-specific pick storage
- [x] Add league member list component
  - Member status display with owner badges
  - League standings with survival tracking
  - Member management for league owners
- [x] Additional features implemented:
  - League selector in dashboard for mode switching
  - Solo play vs league play modes
  - League-specific pick tracking
  - Multi-user simulation for testing
  - League settings management
  - Leave/delete league functionality

## Phase 2: AWS Amplify Gen2 Backend Foundation 🚀

### AWS Amplify Gen2 Project Setup ✅ (Completed June 2025)
- [x] Initialize Amplify Gen2 project structure
- [x] Configure build system integration (Vite + Amplify)
- [x] Set up cloud sandbox for development
- [x] Configure deployment pipeline (GitHub → Amplify)
- [x] Set up environment variables and configurations
- [x] **CRITICAL FIX:** Resolved OpenF1 API integration bug - cache-busting parameters were causing empty responses, now successfully fetching real qualifying data (Spanish GP 2025 verified with Carlos Sainz P15)

### Core Data Schema Definition
- [ ] Design GraphQL schema mapping current localStorage structures
- [ ] Define User, League, DriverPick, and Race models
- [ ] Set up model relationships and authorization rules
- [ ] Configure DynamoDB table structure
- [ ] Test schema with cloud sandbox

### Authentication Integration (Cognito Setup)
- [ ] Configure Cognito User Pool for F1 Survivor
- [ ] Set up authentication UI components (@aws-amplify/ui-react)
- [ ] Replace "Sign In" placeholder with functional auth
- [ ] Implement user session management
- [ ] Add user profile management (username, preferences)
- [ ] Test authentication flow and user experience

### Data Migration Service
- [ ] Create localStorage to Amplify data migration utility
- [ ] Build user pick history migration functions
- [ ] Implement league data migration system
- [ ] Add rollback mechanisms for failed migrations
- [ ] Test migration with existing user data

### Real-time League Updates (AppSync Subscriptions)
- [ ] Implement real-time pick submissions within leagues
- [ ] Add live league member status updates
- [ ] Create real-time elimination notifications
- [ ] Build live countdown synchronization across users
- [ ] Test multi-user real-time functionality

### Auto-Pick Lambda Function
- [ ] Convert current JavaScript auto-pick logic to Lambda
- [x] ✅ **COMPLETED:** Integrate with OpenF1 API for qualifying results (Fixed cache-busting bug, successfully fetching real data)
- [x] ✅ **COMPLETED:** Implement P15 fallback system in serverless environment (Tested with Spanish GP 2025: Carlos Sainz P15, Alexander Albon P16 fallback)
- [ ] Add error handling and retry mechanisms
- [ ] Test auto-pick triggers and notifications

### Pick Validation & Business Logic
- [ ] Server-side pick deadline enforcement
- [ ] Driver already-picked validation via GraphQL
- [ ] Race result processing automation
- [ ] Survival status calculation logic
- [ ] Comprehensive validation testing

## Phase 3: Enhanced Game Logic & F1 Integration 🏎️

### F1 Data Integration Service
- [ ] OpenF1 API client with robust error handling
- [ ] Real-time race calendar synchronization
- [ ] Qualifying results fetching and caching
- [ ] Race results processing automation
- [ ] Driver and team data management

### Advanced League Management
- [ ] League invitation system via email
- [ ] Advanced league settings (custom rules, scoring)
- [ ] League admin controls and moderation tools
- [ ] League statistics and analytics
- [ ] Public/private league discovery

### Results Processing Engine
- [ ] Automated race result processing
- [ ] Survival calculation and elimination logic
- [ ] League standings calculation
- [ ] Historical statistics generation
- [ ] Performance analytics dashboard

### Notification System
- [ ] Email notifications for key events
- [ ] Push notifications for mobile users
- [ ] In-app notification center
- [ ] Customizable notification preferences
- [ ] Multi-channel notification delivery

## Phase 4: User Experience & Platform Enhancement 🌟

### Advanced Dashboard Features
- [ ] Interactive charts and visualizations
- [ ] Detailed player performance analytics
- [ ] Comparative league statistics
- [ ] Historical trend analysis
- [ ] Export functionality for data

### Mobile App Development
- [ ] Progressive Web App (PWA) implementation
- [ ] Mobile-optimized UI components
- [ ] Offline functionality for core features
- [ ] Push notification support
- [ ] App store preparation

### Social Features
- [ ] User profiles and achievements
- [ ] Social sharing integration
- [ ] Friend system and recommendations
- [ ] League discovery and joining
- [ ] Community features and forums

### Advanced Competition Features
- [ ] Multi-season support
- [ ] Tournament brackets and playoffs
- [ ] Custom scoring systems
- [ ] Detailed racing statistics integration
- [ ] Fantasy-style additional features

## Technical Implementation Notes

### Current Local Storage Schema (Phase 1)
```javascript
// User data structure
const userData = {
  userId: "local-user",
  currentSeason: "2025",
  picks: [
    {
      driverId: 5,
      raceId: "mon-2025",
      timestamp: "2025-05-25T10:00:00Z",
      driverName: "George Russell",
      teamName: "Mercedes",
      isAutoPick: false
    }
  ]
};

// League data structure  
const leagueData = {
  leagueId: "league_12345",
  name: "My F1 League",
  ownerId: "user123",
  members: ["user123", "user456"],
  inviteCode: "ABC12345",
  picks: {
    "user123": [/* picks array */],
    "user456": [/* picks array */]
  }
};
```

### AWS Amplify Gen2 Schema (Phase 2+)
```typescript
// GraphQL Schema Definition
const schema = a.schema({
  UserProfile: a.model({
    userId: a.id().required(),
    username: a.string().required(),
    email: a.string().required(),
    totalSurvivedRaces: a.integer().default(0),
    isEliminated: a.boolean().default(false),
    preferredTeam: a.string(),
    joinedAt: a.datetime().required()
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ]),

  League: a.model({
    name: a.string().required(),
    inviteCode: a.string().required(),
    ownerId: a.id().required(),
    maxMembers: a.integer().default(50),
    season: a.string().required(),
    members: a.hasMany('LeagueMember', 'leagueId'),
    picks: a.hasMany('DriverPick', 'leagueId')
  }),

  DriverPick: a.model({
    userId: a.id().required(),
    leagueId: a.id(),
    raceId: a.string().required(),
    driverId: a.integer().required(),
    submittedAt: a.datetime().required(),
    isAutoPick: a.boolean().default(false),
    survived: a.boolean(),
    finalPosition: a.integer()
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ])
});
```

### Development Workflow (Updated)
```bash
# Local Development with Cloud Sandbox
npx ampx sandbox          # Start cloud backend
npm run dev              # Start frontend (Vite)

# Deploy to Production
git push origin master   # Auto-deploys via Amplify
```

## Migration Strategy

### Week 1: Foundation Setup
- AWS Amplify Gen2 project initialization
- Basic schema definition and testing
- Authentication setup and testing

### Week 2: Data Migration
- Implement migration utilities
- Test localStorage → Amplify data transfer
- Validate data integrity and rollback capabilities

### Week 3: Feature Parity
- Replace localStorage calls with Amplify data client
- Maintain existing UI and user experience
- Test all current features with new backend

### Week 4: Enhanced Features
- Real-time league updates
- Server-side auto-pick implementation
- Advanced validation and security

### Week 5: Production Deployment
- End-to-end testing
- Performance optimization
- Production deployment and monitoring

## Timeline Estimates

- **Phase 1:** ✅ Completed (May 2025 - December 2024)
- **Phase 2:** 🚀 IN PROGRESS - Q1 2025 (5-6 weeks, modular implementation)
  - ✅ AWS Amplify Gen2 Project Setup (Completed June 2025)
  - ✅ Critical OpenF1 API integration fixes (Auto-pick foundation ready)
  - 🔄 Next: Core Data Schema Definition & Authentication Integration
  - Each feature can be implemented independently
  - Gradual migration preserving existing functionality
- **Phase 3:** Q2 2025 (8-10 weeks)
- **Phase 4:** Q3-Q4 2025 (12-16 weeks)

## Technology Stack Updates

### Frontend (Unchanged)
- HTML5, CSS3, JavaScript (ES6 modules)
- Vite build system
- Anime.js for animations
- Responsive design principles

### Backend (Updated to AWS Amplify Gen2)
- **Authentication:** Amazon Cognito
- **API:** AWS AppSync (GraphQL)
- **Database:** Amazon DynamoDB
- **Functions:** AWS Lambda
- **Storage:** Amazon S3
- **Real-time:** GraphQL Subscriptions
- **Deployment:** AWS Amplify Hosting

### Integration Points
- OpenF1 API for race data
- Email services for notifications
- Progressive Web App capabilities
- CI/CD via GitHub integration

## Notes

- All Phase 1 functionality will be preserved during migration
- Modular approach allows for independent feature development
- Each Phase 2 feature includes its own implementation plan
- Rollback strategies ensure data safety during migration
- Performance improvements expected with managed AWS services
- Real-time capabilities will enhance user experience significantly 