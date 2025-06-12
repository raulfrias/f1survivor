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

### League System Prototype ✅ (Completed June 11, 2025)
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

## Phase 1.5: Mobile Responsiveness & UI Polish ✅ (Completed June 2025)

### Mobile-First Responsive Design ✅ (Completed June 2025)
- [x] Audit current mobile experience and identify key issues
- [x] Fix driver selection grid layout for mobile screens (100px min vs 130px for mobile)
- [x] Optimize league modals and forms for touch interfaces
- [x] Improve navigation and menu systems for mobile (fixed stacking issues)
- [x] Enhance dashboard layout for smaller screens
- [x] Test countdown timer and status displays on mobile (reduced from 2rem to 1.5rem)
- [x] Optimize elimination zone component for mobile viewing
- [x] Fix CSS breakpoints and viewport meta configurations (768px, 480px breakpoints)
- [x] Test across multiple device sizes (phone, tablet, desktop)
- [x] Implement mobile-specific interactions and touch gestures
- [x] **UX Enhancement:** Removed distracting track animation for cleaner, focused experience

## Phase 2: AWS Amplify Gen2 Backend Foundation 🚀

### AWS Amplify Gen2 Project Setup ✅ (Completed June 2025)
- [x] Initialize Amplify Gen2 project structure
- [x] Configure build system integration (Vite + Amplify Gen2)
- [x] Set up cloud sandbox for development
- [x] Configure deployment pipeline (GitHub → Vercel auto-deployment)
- [x] Set up environment variables and configurations
- [x] **CRITICAL FIX:** Resolved OpenF1 API integration bug - cache-busting parameters were causing empty responses, now successfully fetching real qualifying data (Spanish GP 2025 verified with Carlos Sainz P15)
- [x] **PRODUCTION FIX:** Resolved 404 issues with Vite multi-page configuration
  - Added proper vite.config.js for index.html and dashboard.html
  - Fixed asset bundling and path resolution
  - Removed incorrect amplify.yml (not needed for Gen2)
  - Fixed dashboard favicon and CSS loading issues
  - All production routing now works correctly

### Core Data Schema Definition ✅ (Completed June 2025)
- [x] Design GraphQL schema mapping current localStorage structures
- [x] Define User, League, DriverPick, and Race models
- [x] Set up model relationships and authorization rules
- [x] Configure DynamoDB table structure
- [x] Test schema with cloud sandbox
- [x] **MAJOR MILESTONE:** Complete 9-model GraphQL schema deployed:
  - UserProfile: User management with game statistics
  - League/LeagueMember: Full league system with authorization
  - Season/Race/Driver: F1 reference data with guest access
  - DriverPick: Core game logic with pick tracking and results
  - RaceResult/QualifyingResult: Results processing and auto-pick support
- [x] **Authorization Architecture:** Dual-mode authentication (API Key for guest F1 data access, User Pool for authenticated game features)
- [x] **Performance Optimized:** Schema designed for efficient DynamoDB queries with proper relationships and indexes

### Authentication Integration (Cognito Setup) ✅ (Completed June 2025)
- [x] Configure Cognito User Pool for F1 Survivor
- [x] Set up authentication UI components (custom modal system)
- [x] Replace "Sign In" placeholder with functional auth
- [x] Implement user session management
- [x] Add user profile management (username, preferences)
- [x] Test authentication flow and user experience
- [x] **Email verification and resend functionality** ⭐ (Discovered during testing)
- [x] **Unverified user sign-in handling** ⭐ (Discovered during testing)
- [x] **Authentication error handling and user feedback** ⭐ (Discovered during testing)
- [x] **Cross-page authentication state management** ⭐ (Discovered during testing)
- [x] **Password reset/forgot password functionality** ⭐ (Discovered during testing - COMPLETED)
- [ ] **Account recovery and advanced email verification**
- [ ] **Session timeout and token refresh handling**
- [ ] **Multi-factor authentication support** (Future enhancement)

### Frontend-Backend Integration 🔄 (In Progress - June 11, 2025)
- [x] Connect pick saving to AWS GraphQL instead of localStorage
- [x] Replace 'local-user' with authenticated AWS user ID
- [x] Update league operations to use DynamoDB via GraphQL
- [x] Implement real-time pick validation using backend
- [x] Test complete authentication + data flow integration
- [x] **Comprehensive Testing Suite:** 7-test integration suite covering all functionality
- [x] **Pick Changing System:** Update existing picks instead of creating duplicates
- [x] **Previous Race Blocking:** Prevent selecting drivers from previous races
- [x] **Data Consistency:** Ensure AWS and application layer data alignment
- [x] **Error Handling:** Robust validation and error management
- [x] **Cross-Browser Persistence:** Data available across browser sessions
- [x] **Architecture Clarification:** Proper separation of user data (AWS) vs application state (localStorage cache)
- [x] **Function Integration:** Fixed amplifyDataService function calls and async/await patterns
- [x] **Solo Mode AWS Backend:** Complete elimination of localStorage for user picks, full AWS integration
- [ ] **Testing & Debugging:** Resolve remaining pick flow issues and complete integration testing
- [ ] **Pick Flow Validation:** End-to-end testing of pick selection, save, and load operations

### League Operations Backend Integration 🔄 (Next Priority)
- [ ] Remove solo mode dependency and localStorage league operations
- [ ] Connect league creation/joining to AWS GraphQL backend
- [ ] Update league member management to use DynamoDB
- [ ] Implement league-specific pick operations via AWS
- [ ] Test multi-user league functionality with AWS backend
- [ ] Validate league standings and member data persistence
- [ ] Remove league-storage-manager.js localStorage dependencies
- [ ] Complete league dashboard AWS integration

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

## Development Strategy

### Week 1: League Operations (Current Priority)
- Implement multi-user league functionality
- Test league creation, joining, and member management
- League-specific pick viewing and standings
- Multi-user scenario testing

### Week 2: Enhanced Features & Real-time
- Real-time league updates via GraphQL subscriptions
- Server-side auto-pick Lambda implementation
- Advanced pick validation and business logic
- League management via backend APIs

### Week 3: Production Features
- Results processing automation
- Notification system implementation
- Performance optimization and caching
- Comprehensive testing of all features

### Week 4: Production Deployment
- End-to-end testing with real F1 data
- Performance monitoring and optimization
- Production deployment and user acceptance testing
- Documentation and user onboarding

## Timeline Estimates

- **Phase 1:** ✅ Completed (May 2025 - June 11, 2025)
- **Phase 1.5:** ✅ Completed (June 2025) - Mobile Responsiveness & Production Fixes
- **Phase 2:** Q2-Q3 2025 (4-5 weeks, streamlined implementation)
  - ✅ AWS Amplify Gen2 Project Setup (Completed June 2025)
  - ✅ Core Data Schema Definition (9-model GraphQL schema deployed)
  - ✅ Authentication Integration (Cognito fully functional)
  - ✅ Critical OpenF1 API integration fixes (Auto-pick foundation ready)
  - ✅ Production deployment fixes (Vite multi-page configuration)
  - ✅ Frontend-Backend Integration (Completed June 11, 2025)
  - 🔄 Next: League Operations (multi-user functionality)
  - Direct transition to AWS backend (no migration needed)
- **Phase 3:** Q3-Q4 2025 (8-10 weeks)
- **Phase 4:** Q4 2025-Q1 2026 (12-16 weeks)

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