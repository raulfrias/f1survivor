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

### Frontend-Backend Integration ✅ (Completed June 12, 2025)
- [x] Connect pick saving to AWS GraphQL instead of localStorage
- [x] Replace 'local-user' with authenticated AWS user ID
- [x] Update league operations to use DynamoDB via GraphQL
- [x] Implement real-time pick validation using backend
- [x] Test complete authentication + data flow integration
- [x] **Comprehensive Testing Suite:** 7-test integration suite covering all functionality
- [x] **Pick Changing System:** Update existing picks instead of creating duplicates with proper upsert logic
- [x] **Previous Race Blocking:** Prevent selecting drivers from previous races
- [x] **Data Consistency:** Ensure AWS and application layer data alignment
- [x] **Error Handling:** Robust validation and error management
- [x] **Cross-Browser Persistence:** Data available across browser sessions
- [x] **Architecture Clarification:** Proper separation of user data (AWS) vs application state (localStorage cache)
- [x] **Function Integration:** Fixed amplifyDataService function calls and async/await patterns
- [x] **Solo Mode AWS Backend:** Complete elimination of localStorage for user picks, full AWS integration
- [x] **Authentication State Race Condition:** Fixed DOM initialization timing issues for proper auth state management
- [x] **Duplicate Pick Resolution:** Implemented automatic cleanup of duplicate picks with getCurrentRacePick auto-cleanup
- [x] **Console Log Cleanup:** Removed noisy test suite startup logs for cleaner development experience
- [x] **Testing & Validation:** All 7 integration tests passing - pick saving, loading, changing, and validation working correctly
- [x] **PRODUCTION DEPLOYMENT FIXES:**
- [x] **CORS Authentication Resolution:** Fixed Cognito User Pool Client callback URLs for production domains
- [x] **Button Event Listener Fix:** Resolved button click handlers being removed during authentication state changes
- [x] **Amplify Build Issues:** Fixed top-level await and configuration import issues
- [x] **Production Button Functionality:** All buttons now work correctly in deployed environment
- [x] **End-to-End Production Testing:** Complete authentication and pick flow validated in live environment

### Enhanced Authentication & User Experience ✅ (PRODUCTION READY - June 16, 2025)
**CORE FEATURES COMPLETED:**
- [x] Google OAuth integration via Cognito Social Identity Providers (backend ready)
- [x] Enhanced name capture in sign-up flow (first name + last name fields) 
- [x] Real name display instead of Google OAuth usernames ("Raul Frias" vs "google_105701204197643832702")
- [x] Mobile authentication optimization (touch-friendly 44px targets, 16px fonts)
- [x] Enhanced loading states & error handling (professional CSS spinners)
- [x] Social login UI integration in existing auth modal ("Continue with Google", "Sign up with Google")
- [x] Cross-browser button synchronization ("Make Your Pick" updates properly across sessions)
- [x] OAuth callback handling with retry logic for race condition fixes
- [x] Database schema enhancements (displayName, firstName, lastName, googleId, owner fields)
- [x] Authorization and identity claim fixes for OAuth users
- [x] Profile creation with stored user data for email/password vs. Google OAuth users
- [x] Form field styling consistency (white backgrounds, proper borders across all input types)
- [x] **Google OAuth Profile Update Fix:** Resolved database update issue where Amplify GraphQL updates require primary key - fixed user profile updates to properly save Google account data (displayName, email, firstName, lastName) instead of showing user IDs
- [x] Production deployment and cloud environment testing completed
- [x] Console logging cleanup for production readiness

**DEFERRED TO FUTURE PHASES:**
- [ ] Profile completion flows and profile pictures (Phase 3)
- [ ] Additional social providers (Facebook, Apple) (Phase 4)
- [ ] Advanced session management and account linking (Phase 4)

### Multi-League Core Architecture ⭐ (Phase 1 & 2 Completed ✅ - December 2025)

**PHASE 1 COMPLETED TASKS (EXCEEDED SCOPE):**
- [x] **Multi-League Context System:** Implemented MultiLeagueContext class (387 lines) with advanced caching, event system, and AWS error recovery
- [x] **Enhanced Data Service:** Added getUserLeaguesWithCache(), getMultiLeaguePickHistory(), getCrossLeagueStatistics() with comprehensive error handling
- [x] **Refactored League Integration:** Updated league-integration.js for multi-league support with backward compatibility and deprecation warnings
- [x] **Comprehensive Test Suite:** Created 18-test validation suite with 100% pass rate covering performance, error handling, and integration
- [x] **Performance Requirements EXCEEDED:** Multi-League Loading < 2000ms (achieved 369ms - 5x better), League Switching < 500ms (achieved <100ms - 5x better)
- [x] **Unlimited League Support:** Users can participate in unlimited leagues with intelligent 5-minute caching and cross-league validation
- [x] **Advanced Features:** Event listeners, concurrent loading protection, cache management, and AWS error recovery

**PHASE 2 COMPLETED TASKS (EXCEEDED SCOPE):**
- [x] ✅ **League selector in navigation** (387-line component with auth awareness, real-time updates, mobile responsiveness)
- [x] ✅ **Multi-league context management** (unlimited leagues, advanced caching, event system, AWS integration)
- [x] ✅ **League switching interface** (full navigation integration with visual feedback and performance optimization)
- [x] ✅ **Multi-league dashboard enhancement** (401-line comprehensive transformation with cross-league stats, league tabs, pick filtering, 30s caching, debouncing)
- [x] ✅ **Performance optimizations** (eliminated 5-second loading delays, implemented debouncing, statistics caching)
- [x] ✅ **Mobile responsiveness** (F1 Survivor branding, touch-friendly interfaces, responsive design)
- [x] ✅ **Production hardening** (real-world testing with 9 leagues, browser compatibility, authentication integration)

**PHASE 2 REMAINING TASKS:**
- [ ] Enhanced league invitation management interface
- [ ] **Shareable league links** for easy friend & family invitations
- [ ] Cross-league statistics and performance visualization (partially completed in dashboard)

### League Operations Backend Integration ✅ (Enhanced Scope) - COMPLETE 🎉
**Started:** July 2025 | **Completed:** July 2025 | **Status:** PRODUCTION READY
- [x] Remove solo mode dependency and localStorage league operations ✅
- [x] Connect league creation/joining to AWS GraphQL backend ✅
- [x] Update league member management to use DynamoDB ✅
- [x] Implement league-specific pick operations via AWS ✅
- [x] Test multi-user league functionality with AWS backend ✅
- [x] Validate league standings and member data persistence ✅
- [x] Remove league-storage-manager.js localStorage dependencies ✅
- [x] Complete league dashboard AWS integration with multi-league support ✅
- [x] **Multi-user concurrent testing validated** ✅ (2 users, data isolation confirmed)

**DELIVERED BEYOND SCOPE:**
- ✅ Comprehensive test suite (15 test scenarios - single & multi-user)
- ✅ Performance benchmarking and validation (concurrent operations < 8s)
- ✅ Data consistency validation tools with real-time monitoring
- ✅ Enhanced error handling and authentication integration
- ✅ API compatibility preservation (zero breaking changes)
- ✅ **True multi-user capability:** Perfect user isolation, no data conflicts
- ✅ **Production-ready:** 346 lines of AWS backend functionality added

**ACHIEVEMENT:** 100% localStorage-free league operations with validated multi-user support

### Advanced League Customization ⭐ ✅ (COMPLETED - July 3, 2025)
**Started:** June 2025 | **Completed:** July 3, 2025 | **Status:** PRODUCTION READY
- [x] Multiple lives system (1-5 lives, configurable per league, default: 1 life)
- [x] League admin controls for lives settings with comprehensive validation
- [x] Lives tracking and display in league standings with visual indicators
- [x] Elimination logic updates for multi-life scenarios 
- [x] Lives-based survival calculations and statistics
- [x] UI indicators for remaining lives per user (❤️/🖤 visual system)
- [x] Enhanced member management with individual lives adjustment
- [x] Admin controls for lives adjustment (add/subtract/reset) with audit trail
- [x] Bulk administrative actions (Reset All Lives, Eliminate Inactive Members)
- [x] Complete audit trail system with event tracking and CSV export
- [x] Professional admin interface with loading states and error handling
- [x] Mobile-responsive design for all admin controls
- [x] Fixed member count display issues across all league interfaces
- [ ] League rules customization interface (Future enhancement - Phase 4)

**DELIVERED BEYOND SCOPE:**
- ✅ Complete Phase 1 + Phase 2 implementation in single development cycle
- ✅ Comprehensive audit trail with export capabilities
- ✅ Enhanced league deletion with proper cleanup (members, picks, events)
- ✅ Professional UI/UX with animations and visual feedback
- ✅ Member count accuracy fixes across manage leagues modal, settings, and dropdowns
- ✅ Advanced error handling and retry logic for DynamoDB consistency
- ✅ Bulk administrative operations for efficient league management

**TECHNICAL ACHIEVEMENTS:**
- ✅ Enhanced GraphQL schema with LifeEvent model for audit tracking
- ✅ Sophisticated lives management API with operation validation
- ✅ Real-time UI updates with optimistic rendering
- ✅ Complete admin workflow: individual adjustment → bulk actions → audit export
- ✅ Production-ready error handling and data consistency validation

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
- [ ] **Public league discovery and browsing system** (Future Enhancement)
- [ ] League categories and tags for organization
- [ ] Featured leagues and community highlights

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

### Mobile App Development
- [ ] Progressive Web App (PWA) implementation
- [ ] Mobile-optimized UI components
- [ ] Offline functionality for core features
- [ ] Push notification support
- [ ] App store preparation

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

### AWS Amplify Gen2 Schema (Phase 2+ - Enhanced Multi-League)
```typescript
// GraphQL Schema Definition (Updated for Multi-League Support)
const schema = a.schema({
  UserProfile: a.model({
    userId: a.id().required(),
    displayName: a.string().required(),    // From Google Auth or manual input
    username: a.string().required(),
    email: a.string().required(),
    googleId: a.string(),                  // Optional Google account link
    activeLeagues: a.string().array(),     // Array of league IDs (unlimited)
    defaultLeague: a.string(),             // Primary league for quick access
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
    inviteCode: a.string().required(),     // 8-character code
    shareableUrl: a.string().required(),   // f1survivor.com/join/league-id
    ownerId: a.id().required(),
    maxMembers: a.integer().default(50),
    season: a.string().required(),
    settings: a.json().required(),         // League customization settings
    members: a.hasMany('LeagueMember', 'leagueId'),
    picks: a.hasMany('DriverPick', 'leagueId')
  }),

  LeagueMember: a.model({
    userId: a.id().required(),
    leagueId: a.id().required(),
    remainingLives: a.integer().default(1), // Configurable per league
    livesUsed: a.integer().default(0),
    isEliminated: a.boolean().default(false),
    eliminationHistory: a.json(),           // Array of elimination events
    joinedAt: a.datetime().required()
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

// League Settings Schema
interface LeagueSettings {
  maxLives: number;          // 1-5 lives per user (default: 1)
  livesEnabled: boolean;     // Enable/disable multiple lives
  autoPickEnabled: boolean;  // P15 auto-pick system
  isPublic: boolean;         // Future: public league discovery
  customRules?: string;      // Future: additional customizations
}
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

### Week 1-2: Enhanced Authentication & User Experience (Immediate Priority - FOCUSED SCOPE)
- Google OAuth integration via Cognito Social Identity Providers (backend already configured)
- Mobile authentication optimization and responsive design fixes
- Enhanced loading states and error handling
- Basic "Remember Me" functionality implementation
- **DEFERRED:** Profile completion flows, additional social providers, advanced features

### Week 3-4: Multi-League Core Architecture (Foundation Feature) ✅ COMPLETED
- [x] ✅ **COMPLETED:** Data model redesign for unlimited league participation per user (MultiLeagueContext class implemented)
- [x] ✅ **COMPLETED:** Enhanced data service with cross-league operations and intelligent caching
- [x] ✅ **COMPLETED:** Comprehensive test suite with 100% pass rate and performance validation
- [ ] League dropdown selector and multi-league UI (Phase 2)
- [ ] Shareable league links for viral growth (Phase 2)
- [ ] Cross-league user profile and statistics UI components (Phase 2)

### Week 5-6: League Operations AWS Migration (Enhanced Scope)
- Migrate league operations to AWS backend with multi-league support
- Test multi-user league functionality with new architecture
- League-specific pick tracking and standings
- Multi-user scenario testing

### ✅ Week 7-8: Advanced League Customization (COMPLETED July 3, 2025)
- [x] Multiple lives system (1-5 lives, configurable per league, default: 1 life)
- [x] League admin controls and customization interface
- [x] Lives tracking and elimination logic updates
- [x] UI indicators for remaining lives per user
- [x] Enhanced member management with audit trail system
- [x] Bulk administrative actions and CSV export capabilities

### Week 9-10: Phase 3 - Production Hardening & Testing (July 2025)
- Comprehensive end-to-end testing of lives system workflow
- Performance validation and optimization (< 500ms dashboard, < 3s race processing)
- Multi-user concurrent testing with lives system edge cases
- Documentation and admin user guides

### Week 11+: Enhanced Features & Real-time (Phase 3 Future)
- Real-time league updates via GraphQL subscriptions
- Server-side auto-pick Lambda implementation  
- Advanced pick validation and business logic
- Results processing automation
- Notification system implementation

## Timeline Estimates

- **Phase 1:** ✅ Completed (May 2025 - June 11, 2025)
- **Phase 1.5:** ✅ Completed (June 2025) - Mobile Responsiveness & Production Fixes
- **Phase 2:** Q2-Q3 2025 ✅ (COMPLETED July 3, 2025 - 8 weeks, exceeded scope)
  - ✅ AWS Amplify Gen2 Project Setup (Completed June 2025)
  - ✅ Core Data Schema Definition (9-model GraphQL schema deployed)
  - ✅ Authentication Integration (Cognito fully functional)
  - ✅ Critical OpenF1 API integration fixes (Auto-pick foundation ready)
  - ✅ Production deployment fixes (Vite multi-page configuration)
  - ✅ Frontend-Backend Integration (Completed June 12, 2025)
  - ✅ Enhanced Authentication & User Experience (Completed June 16, 2025 - Google OAuth, mobile optimization)
  - ✅ **Multi-League Core Architecture Phase 1** (Completed December 2024 - unlimited leagues backend foundation)
  - ✅ **Multi-League Core Architecture Phase 2** (Completed July 2025 - UI components, league switching interface)
  - ✅ **League Operations AWS Migration** (Completed July 2025 - enhanced with multi-league support)
  - ✅ **Advanced League Customization** (Completed July 3, 2025 - multiple lives system, admin controls, audit trail)
  - ✅ Member count accuracy fixes and enhanced UX across all league interfaces
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