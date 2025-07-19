# F1 Survivor Development Roadmap

## Current Focus & Next Steps (as of July 19, 2025)
1. ✅ **Project Structure & Documentation Restructuring (COMPLETED - July 19, 2025)**
   - ✅ Comprehensive reorganization of all code, assets, and documentation into a modern, maintainable structure.
   - ✅ All files moved to modular architecture with clear separation of concerns.
   - ✅ Updated all import paths, HTML references, and documentation.
   - ✅ Created comprehensive developer guides and migration logs.
   - ✅ Build and development server working perfectly.

2. **Technical Debt Cleanup (IMMEDIATE PRIORITY)**
   - Remove solo mode functionality and UI components
   - Remove multiple lives system (simplify to single elimination)
   - Update database schema to reflect simplified game logic
   - Clean up deprecated methods and update test suites
   - **Must be completed before implementing new backend features**

3. **Auto-Pick Lambda Function (HIGH PRIORITY)**
   - Server-side auto-pick processing with OpenF1 API integration
   - P15 fallback system with intelligent driver selection
   - Error handling and retry mechanisms for reliability
   - Integration with batch processing workflow

4. **Batch Results Processing (HIGH PRIORITY)**
   - Race completion detection and 8-hour penalty buffer timer
   - F1 results fetching and league-specific pick processing
   - Single-life elimination logic and status updates
   - Multi-league result processing and standings updates

5. **Pick Validation & Business Logic (HIGH PRIORITY)**
   - Server-side deadline enforcement (no client-side manipulation)
   - Driver validation and pick change logic (unlimited changes before race)
   - League-specific pick isolation (no cross-league conflicts)
   - Comprehensive testing suite for all scenarios

6. **Notification System (MEDIUM PRIORITY)**
   - Email notifications for race results and eliminations
   - Push notifications for mobile users
   - Customizable notification preferences

---

## 🎉 **Project Structure Reorganization COMPLETED** (July 19, 2025)
The project has been successfully reorganized into a modern, modular architecture:
- ✅ **Modular Structure:** Clear separation of components, services, utils, and styles
- ✅ **Path Aliases:** Clean imports using Vite aliases (`@services`, `@components`, etc.)
- ✅ **Organized Testing:** Integration and unit tests properly organized
- ✅ **Comprehensive Documentation:** Developer guides and migration logs created
- ✅ **Build System:** Development and production builds working perfectly
- ✅ **Development Server:** `http://localhost:5173/` serving correctly

**Next Priority:** Technical Debt Cleanup must be completed before implementing new backend features.

---

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

### Real-time League Updates (AppSync Subscriptions) - REMOVED FROM SCOPE
**Date:** July 5, 2025
**Reason:** Scope change during development - F1 Survivor is a batch-based game where players submit picks before races and results are processed after races. Real-time updates add complexity without significant value for this game mechanic.

**What was removed:**
- Live pick submissions within leagues
- Live league member status updates  
- Real-time elimination notifications
- Live countdown synchronization across users
- Multi-user real-time functionality testing

**Impact:** Simplified development focus on core batch processing workflow.

### Auto-Pick Lambda Function - HIGH PRIORITY
**Date:** July 5, 2025
**Status:** Ready for implementation - OpenF1 API integration already completed

- [ ] Convert current JavaScript auto-pick logic to AWS Lambda
- [x] ✅ **COMPLETED:** Integrate with OpenF1 API for qualifying results (Fixed cache-busting bug, successfully fetching real data)
- [x] ✅ **COMPLETED:** Implement P15 fallback system in serverless environment (Tested with Spanish GP 2025: Carlos Sainz P15, Alexander Albon P16 fallback)
- [ ] Add error handling and retry mechanisms
- [ ] Test auto-pick triggers and notifications
- [ ] **NEW:** Integrate with batch processing workflow (race end + 8hr buffer)
- [ ] **NEW:** Ensure auto-pick works for league-based picks only (no solo mode)

**Implementation Notes:** 
- Move from client-side JavaScript to server-side Lambda execution
- Trigger at race deadline automatically
- Handle P15 fallback with intelligent driver selection
- Integrate with new batch results processing system

### Pick Validation & Business Logic - MODIFIED SCOPE
**Date:** July 5, 2025
**Reason:** Scope change during development - Simplified to single elimination per league, removed solo mode complexity

- [ ] **Server-side deadline enforcement** (Essential - prevent client-side manipulation)
- [ ] **Driver already-picked validation** (Essential - prevent duplicate picks per league)
- [ ] **Batch race result processing** (NEW - process all picks after race + 8hr buffer)
- [ ] **Single-life elimination logic** (NEW - simplified from multi-life system)
- [ ] **League-specific elimination tracking** (NEW - track elimination per league only)
- [ ] **Result notification system** (NEW - email/push notifications for race outcomes)
- [ ] **Pick change validation** (NEW - allow unlimited changes before race start)
- [ ] **Multi-league pick isolation** (NEW - ensure picks don't conflict across leagues)
- [ ] **Comprehensive validation testing** (Essential - test all scenarios)

**Removed from scope:**
- Multi-life elimination tracking (Simplified to single elimination)
- Solo mode pick validation (Game is league-based only)
- Lives management system (Simplified to ACTIVE/ELIMINATED status)

**Implementation Notes:**
- All picks must be associated with a league (no null leagueId)
- Simple elimination: finish outside top 10 = eliminated from league
- Players can join multiple leagues with independent pick histories
- Batch processing after race completion + 8-hour penalty buffer

### Technical Debt Cleanup - IMMEDIATE PRIORITY
**Date:** July 5, 2025
**Reason:** Scope changes during development require code cleanup and simplification

**IMPORTANT:**
> **Technical Debt Cleanup must be completed before starting Auto-Pick Lambda Function and all new backend logic.** This ensures the codebase and schema are simplified and consistent for all future features.

#### Solo Mode Removal
**Why:** Game scope changed to league-based only during development
**What to remove:**
- Remove "Solo Play" option from league selector dropdown (`league-dashboard.js`)
- Remove solo mode pick saving/loading paths (`league-integration.js`)
- Remove solo mode AWS backend calls (`amplify-data-service.js`)
- Remove solo mode references in multi-league context (`multi-league-context.js`)
- Update authentication flow to require league selection
- Remove solo mode test scenarios from test files
- Update database schema comments about null leagueId for solo play

#### Multiple Lives System Removal  
**Why:** Game complexity reduction - simplified to single elimination per league
**What to remove:**
- Remove lives-related fields from LeagueMember model (`amplify/data/resource.ts`)
  - Remove `remainingLives`, `livesUsed`, `maxLives` fields
  - Remove `LifeEvent` model entirely
- Remove lives management methods from data service (`amplify-data-service.js`)
  - Remove `updateLeagueLivesSettings()`, `getLeagueLivesConfiguration()`
  - Remove `updateMemberLives()`, `getMemberLivesStatus()`, `createLifeEvent()`
- Remove lives UI components (`league-modal-manager.js`)
  - Remove lives configuration in league settings
  - Remove lives display in member management
  - Remove `generateLivesDisplay()` method
- Remove lives test files (`tests/unit/test-lives-system-api.js`)
- Simplify LeagueMember status to ACTIVE/ELIMINATED only

**Implementation Priority:**
- **Complete all technical debt cleanup before implementing Auto-Pick Lambda Function, batch results processing, or any new backend features.**

### Week 1-2: Technical Debt Cleanup (Immediate Priority)
- **Solo Mode Removal:** Remove all solo mode functionality and UI components
- **Multiple Lives System Removal:** Simplify to single elimination per league
- **Code Cleanup:** Remove deprecated methods and update database schema
- **Testing:** Update test suites to reflect simplified game logic

### Week 3-4: Auto-Pick Lambda Function (High Priority)
- **(Depends on completion of Technical Debt Cleanup)**
- Server-side auto-pick processing with OpenF1 API integration
- P15 fallback system with intelligent driver selection
- Error handling and retry mechanisms for reliability
- Integration with batch processing workflow

### Week 5-6: Batch Results Processing (High Priority)
- Race completion detection and 8-hour penalty buffer timer
- F1 results fetching via `race-results-api.js`
- League-specific pick processing against official results
- Single-life elimination logic and status updates
- Multi-league result processing and standings updates

### Week 7-8: Pick Validation & Business Logic (High Priority)
- Server-side deadline enforcement (no client-side manipulation)
- Driver validation and pick change logic (unlimited changes before race)
- League-specific pick isolation (no cross-league conflicts)
- Comprehensive testing suite for all scenarios

### Week 9-10: Notification System (Medium Priority)
- Email notifications for race results and eliminations
- Push notifications for mobile users
- Customizable notification preferences
- Multi-channel notification delivery

### Real-time League Updates (REMOVED FROM SCOPE - July 5, 2025)
**Reason:** Batch-based game doesn't require real-time updates. May be reconsidered in Phase 4 based on user feedback.

### AWS Amplify Gen2 Schema (Phase 2+ - Simplified Single-Life)
```typescript
// GraphQL Schema Definition (Updated July 5, 2025)
const schema = a.schema({
  UserProfile: a.model({
    userId: a.id().required(),
    displayName: a.string().required(),
    username: a.string().required(),
    email: a.string().required(),
    googleId: a.string(),
    activeLeagues: a.string().array(),     // Array of league IDs (unlimited)
    defaultLeague: a.string(),             // Primary league for quick access
    totalSurvivedRaces: a.integer().default(0),
    preferredTeam: a.string(),
    joinedAt: a.datetime().required()
  }),

  LeagueMember: a.model({
    leagueId: a.id().required(),
    userId: a.id().required(),
    status: a.enum(['ACTIVE', 'ELIMINATED', 'LEFT']), // Simplified status
    joinedAt: a.datetime().required(),
    eliminatedAt: a.datetime(),
    leftAt: a.datetime(),
    isOwner: a.boolean().default(false),
    isModerator: a.boolean().default(false),
    eliminationHistory: a.json(), // Retained for audit/history of eliminations per race
  }),

  DriverPick: a.model({
    userId: a.id().required(),
    leagueId: a.id().required(),           // Required - no solo mode
    raceId: a.string().required(),
    driverId: a.string().required(),
    // ... other fields
  }),

  // League settings field is retained for future extensibility (e.g., autoPickEnabled, isPrivate, customRules)
  // settings: a.json(),
});
```

**Changes Made July 5, 2025:**
- Removed `LifeEvent` model (multiple lives system deprecated)
- Removed lives-related fields from `LeagueMember` model
- Made `leagueId` required in `DriverPick` (no solo mode)
- Simplified `LeagueMember` status to ACTIVE/ELIMINATED/LEFT

## Phase 3: Upcoming Work (July–August 2025)

### 1. Technical Debt Cleanup (Immediate, must be completed first)
- **Solo Mode Removal:** Remove all solo mode functionality and UI components
- **Multiple Lives System Removal:** Simplify to single elimination per league
- **Code Cleanup:** Remove deprecated methods and update database schema
- **Testing:** Update test suites to reflect simplified game logic

### 2. Auto-Pick Lambda Function
- Server-side auto-pick processing with OpenF1 API integration
- P15 fallback system with intelligent driver selection
- Error handling and retry mechanisms for reliability
- Integration with batch processing workflow

### 3. Batch Results Processing
- Race completion detection and 8-hour penalty buffer timer
- F1 results fetching via `race-results-api.js`
- League-specific pick processing against official results
- Single-life elimination logic and status updates
- Multi-league result processing and standings updates

### 4. Pick Validation & Business Logic
- Server-side deadline enforcement (no client-side manipulation)
- Driver validation and pick change logic (unlimited changes before race)
- League-specific pick isolation (no cross-league conflicts)
- Comprehensive testing suite for all scenarios

### 5. Notification System
- Email notifications for race results and eliminations
- Push notifications for mobile users
- Customizable notification preferences
- Multi-channel notification delivery

## Deprecated/Historical Features
- Real-time League Updates (removed July 5, 2025)
- Multiple Lives System (removed July 5, 2025)
- Solo Mode (removed July 5, 2025)

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