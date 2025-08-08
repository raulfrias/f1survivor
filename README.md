# F1 Survivor - Survive the Grid

<p align="center">
  <!-- Consider adding a custom logo for your game here -->
  <img src="/assets/images/F1-Logo.png" alt="F1 Survivor Game" width="150"> 
</p>

Welcome to **F1 Survivor**, a web-based game where your Formula 1 knowledge determines if you can outlast the competition:

## How to Play

F1 Survivor is a league-based game where your Formula 1 knowledge determines if you can outlast the competition:

1. **Join or Create a League:** Every game is played within a league. Create your own or join with an invite code.
2. **Pick a Driver:** Before each GP, choose one driver from the official grid.
3. **No Repeats:** You cannot pick the same driver more than once throughout the season (per league).
4. **Change Picks Freely:** Modify your pick unlimited times before the race starts - other players won't see your changes.
5. **Top 10 Finish:** If your chosen driver finishes in the top 10, you survive and advance to the next race.
6. **Forgot to Pick?** Auto-assigned P15 qualifier if you miss the deadline.
7. **Batch Results Processing:** After each race ends (plus 8-hour buffer for penalties), all picks are processed against official F1 results.
8. **Elimination:** Finish outside top 10 = eliminated from the league (but you can still spectate).
9. **Multiple Leagues:** Join multiple leagues simultaneously, each with independent pick histories.
10. **Last One Standing:** Be the last player surviving in your league.

## Development Setup

### Frontend Development
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/f1survivor.git
   cd f1survivor
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Download Driver Images:**
   ```bash
   chmod +x download_driver_images.sh
   ./download_driver_images.sh
   ```

4. **Run Frontend Development Server:**
   ```bash
   npm run dev              # Vite development server
   ```

### AWS Amplify Gen2 Backend Development
1. **Install Amplify CLI:**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Start Cloud Sandbox (for backend development):**
   ```bash
   npx ampx sandbox         # Creates isolated cloud environment
   ```

3. **Full Development Workflow:**
   ```bash
   # Terminal 1: Backend
   npx ampx sandbox
   
   # Terminal 2: Frontend  
   npm run dev
   ```

### Production Deployment
- **Automatic Deployment:** Connected to GitHub via AWS Amplify hosting with branch-based deployments
- **Frontend:** Vite build system with multi-page configuration
- **Backend:** AWS Amplify Gen2 (serverless infrastructure, auto-managed)
- **Build Output:** Optimized `dist/` directory with proper asset bundling

## Project Structure

```
f1survivor/
├── amplify/                     # AWS Amplify Gen2 Backend
│   ├── backend.ts              # Main backend configuration
│   ├── auth/
│   │   └── resource.ts         # Cognito authentication setup
│   ├── data/
│   │   └── resource.ts         # GraphQL schema & DynamoDB
│   └── functions/              # Lambda functions
│       ├── auto-pick-handler/
│       ├── results-processor/
│       └── league-manager/
├── src/                        # Frontend source code
│   ├── app.js                  # Core game logic
│   ├── components/             # UI components
│   │   ├── auth/
│   │   │   └── AuthUI.js      # Authentication UI
│   │   ├── dashboard/
│   │   │   └── Dashboard.js   # Dashboard component
│   │   ├── elimination/
│   │   │   └── EliminationZone.js # Elimination zone
│   │   └── league/
│   │       ├── LeagueSelector.js
│   │       ├── LeagueModalManager.js
│   │       ├── LeagueDashboard.js
│   │       └── MultiLeagueDashboard.js
│   ├── services/               # Business logic services
│   │   ├── auth/
│   │   │   ├── AuthManager.js
│   │   │   └── OAuthHandler.js
│   │   ├── aws/
│   │   │   └── AmplifyDataService.js
│   │   ├── league/
│   │   │   ├── LeagueManager.js
│   │   │   ├── LeagueStorageManager.js
│   │   │   ├── LeagueIntegration.js
│   │   │   └── MultiLeagueContext.js
│   │   ├── pick/
│   │   │   ├── PickDeadlineManager.js
│   │   │   └── AutoPickManager.js
│   │   ├── race/
│   │   │   ├── RaceStateManager.js
│   │   │   └── QualifyingResultsManager.js
│   │   ├── elimination/
│   │   │   └── LivesEliminationEngine.js
│   │   └── api/
│   │       └── RaceResultsApi.js
│   ├── utils/                  # Utility functions
│   │   ├── DashboardUtils.js
│   │   ├── StorageUtils.js
│   │   ├── EliminationUtils.js
│   │   ├── PickChangeUtils.js
│   │   ├── RaceCountdown.js
│   │   └── LoggerConfig.js
│   ├── styles/                 # CSS stylesheets
│   │   ├── global/
│   │   │   └── styles.css
│   │   ├── pages/
│   │   │   └── dashboard.css
│   │   ├── components/
│   │   │   └── elimination-zone.css
│   │   ├── auth/
│   │   │   └── auth-modal.css
│   │   └── league/
│   │       ├── league-modal.css
│   │       ├── league-selector.css
│   │       └── league-indicator.css
│   ├── pages/                  # HTML pages
│   │   ├── index.html          # Landing page
│   │   └── dashboard.html      # Dashboard page
│   └── data/                   # Static data
│       └── RaceCalendar2025.js
├── tests/                      # Test files
│   ├── integration/            # Integration tests
│   │   ├── test-league-system.html
│   │   ├── test-multi-user-scenarios.html
│   │   ├── test-enhanced-auth.html
│   │   ├── test-lives-system-phase1.html
│   │   ├── test-phase1-multi-league.html
│   │   ├── test-race-state-manager.html
│   │   ├── test-auto-pick-manager.html
│   │   ├── test-countdown.html
│   │   ├── test-qualifying-manager.html
│   │   ├── test-monaco-scenarios.js
│   │   ├── test-post-race.js
│   │   ├── test-frontend-backend-integration.js
│   │   └── test-phase1-multi-league-architecture.js
│   └── unit/                   # Unit tests
│       ├── test-elimination-scenarios.js
│       ├── test-lives-system-api.js
│       └── test-local-storage.js
├── docs/                       # Project documentation
│   ├── ROADMAP.md             # Development roadmap
│   ├── CURRENT_STATE_SUMMARY.md # Current project status
│   ├── testing/                # Testing documentation
│   │   ├── PHASE1_TESTING_GUIDE.md
│   │   └── MULTI_USER_TESTING_GUIDE.md
│   └── implementation-plans/   # Feature implementation plans
├── scripts/                    # Build and utility scripts
│   └── generate-placeholder.js
├── public/                     # Static assets
│   ├── favicon.ico
│   └── assets/
│       ├── images/
│       │   ├── drivers/        # Driver profile images
│       │   └── F1-Logo.png
│       └── sponsors/
├── config/                     # Configuration files
├── index.html                  # Main entry point (redirects to src/pages/index.html)
├── vite.config.js              # Vite build configuration
├── amplify_outputs.json        # Generated backend configuration
├── package.json                # Dependencies and scripts
└── README.md
```

## Current Features

✅ **Interactive UI:**
  - Modern, F1-themed design
  - Dynamic animations and transitions
  - Responsive grid layout
  - Team-colored driver cards

✅ **Driver Selection:**
  - Complete driver grid with team grouping
  - Visual feedback for selection states
  - Loading states and error handling
  - Pick validation logic
  - Prevention of selecting previously picked drivers
  - Fixed tooltip positioning for "already picked" drivers
  - Pick change functionality until 1 hour before race
  - User-friendly deadline display in local timezone

✅ **Race Countdown Timer:**
  - Real-time countdown to next F1 race
  - Complete 2025 F1 calendar integration (24 races)
  - Automatic next race detection
  - Pick deadline warnings
  - Caching system for performance
  - Deadline enforcement with UI locking
  - Dynamic race state display ("Next Race" vs "Race in Progress")
  - Accurate race status indicators with countdown zeros during live race
  - Clear status messages for different race states

✅ **P15 Auto-pick System:**
  - Automatic assignment of the P15 qualifier from the latest *completed* F1 qualifying session for users who miss the pick deadline.
  - Intelligent fallback (P16-P20, then P14-P1) if the P15 driver (or subsequent fallbacks) has been previously picked by the user in *any* race, adhering to the "no repeat picks" rule.
  - Clear user notifications and UI indicators for auto-picked drivers.
  - Robust fetching and caching of qualifying results, with a fallback for API issues.

✅ **Player Dashboard:**
  - Comprehensive player status display with survival indicators
  - Season progress tracking with races completed and remaining drivers
  - Pick history visualization with race results and survival status
  - Elimination Zone component showing league competition dynamics
  - Responsive design optimized for all device sizes
  - Real-time survival calculations and status updates
  - Navigation between Pick and Dashboard pages
  - Fixed production 404 issues with proper Vite multi-page configuration

✅ **League System:**
  - Create private leagues with custom names and settings
  - Join leagues using 8-character invite codes
  - League management interface for owners and members
  - Independent pick tracking per league
  - League standings and member status display
  - Multi-league participation support
  - Owner controls: member management, settings updates
  - Persistent league data using AWS DynamoDB

✅ **Multi-League Support:**
  - Join unlimited leagues simultaneously
  - Independent pick history per league
  - League-specific survival tracking
  - Cross-league statistics and performance
  - League switching interface in navigation
  - Multi-league dashboard with league tabs

✅ **Mobile Responsiveness & Production Ready:**
  - Complete mobile-first responsive design (768px, 480px breakpoints)
  - Fixed navigation menu stacking issues on mobile devices
  - Optimized countdown timer and driver grid layouts for mobile
  - Enhanced touch targets and mobile-specific interactions
  - Removed distracting track animation for cleaner UX
  - Production deployment fixes with Vite multi-page configuration
  - All 404 issues resolved (dashboard, favicon, asset loading)

✅ **AWS Amplify Gen2 Backend (Phase 2):**
  - ✅ AWS Amplify Gen2 project setup (Cloud sandbox operational)
  - ✅ Core Data Schema Definition (Complete 9-model GraphQL schema with dual authorization)
  - ✅ OpenF1 API integration fixes (Successfully fetching real qualifying data - Spanish GP 2025 verified)
  - ✅ Authentication Integration (Cognito User Pool with custom modal system, email verification, password reset)
  - ✅ **Frontend-Backend Integration (COMPLETE):** Full AWS integration for user picks, authentication flow, CORS resolution, production deployment fixes

✅ **Authentication Integration (Cognito Setup):** ✅ (Completed June 2025)
  - Complete custom modal authentication system
  - Email verification and resend functionality
  - Unverified user sign-in handling
  - Comprehensive error handling and user feedback
  - Cross-page authentication state management
  - Full password reset/forgot password functionality
  - User profile management and session handling

✅ **Enhanced Authentication & User Experience:** ✅ (PRODUCTION READY - June 16, 2025)
  - **Google OAuth Integration:** Complete "Continue with Google" and "Sign up with Google" functionality
  - **Enhanced Name Capture:** Sign-up form captures first and last names for proper user display
  - **Real Name Display:** Users show as "Raul Frias" instead of "google_105701204197643832702"
  - **Mobile-First Responsive Design:** Touch-friendly authentication with 44px targets, 16px fonts
  - **Professional UX:** CSS spinner animations, enhanced loading states, improved error handling
  - **Cross-Browser Synchronization:** "Make Your Pick" button properly updates across browsers/sessions
  - **OAuth Callback Handling:** Robust callback processing with retry logic for timing issues
  - **Database Schema Enhancements:** Added displayName, firstName, lastName, googleId fields
  - **Authorization Fixes:** Resolved owner field and identity claim issues for OAuth users
  - **Form Field Styling:** Consistent white backgrounds and borders across all input types
  - **User Profile Update Fix:** Resolved Google OAuth profile update issue where user IDs were showing instead of names - now properly displays Google account names in all UI elements
  - **Production Deployment:** Successfully tested and deployed in cloud environment

🔄 **Frontend-Backend Integration:** ✅ (Completed June 12, 2025)
  - Complete replacement of localStorage with AWS DynamoDB operations
  - Authentication-required pick saving and loading via GraphQL
  - Pick changing functionality with duplicate cleanup
  - Previous race pick blocking system working correctly
  - Cross-browser data persistence via AWS backend
  - Comprehensive error handling and data validation
  - Data consistency between AWS and application layers
  - Full test suite with 7 comprehensive integration tests
  - Proper architecture: User data (AWS) vs Application state (localStorage cache)
  - Fixed amplifyDataService function integration and async patterns
  - Solo mode fully migrated to AWS backend (no localStorage for user picks)

✅ **League Operations Backend Integration:** ✅ (COMPLETE - July 2025)
  - **Complete localStorage removal** for all league operations
  - **Full AWS backend integration** with DynamoDB and GraphQL
  - **Multi-user capability** with concurrent operation support and data isolation
  - **Zero breaking changes** - API compatibility preserved
  - **Production-ready** with comprehensive test suite validation
  - **Performance validated** - Single-user <8s, multi-user concurrent <1s per user

🔄 **Current Focus:**
  - 🔄 **Advanced League Customization:** Multiple lives system (1-5 lives per league), admin controls
  - 🔄 **Real-time Updates:** GraphQL subscriptions for live league interactions

🔄 **Next Priority:**
  - 🔄 **Enhanced League Features:** Shareable league links, advanced admin controls
  - 🔄 **Auto-Pick Lambda Function:** Server-side auto-pick processing

## Development Roadmap

Our development is organized into manageable phases with modular features. See [ROADMAP.md](docs/ROADMAP.md) for details.

**Project Structure:** The project underwent a complete reorganization in July 2025. See [Migration Log](docs/MIGRATION_LOG.md) for detailed changes and [Project Structure Guide](docs/development/project-structure.md) for current architecture.

**Note:**
- Technical debt cleanup (removal of solo mode and multiple lives system) is required before implementing new backend features such as Auto-Pick Lambda and batch results processing. See the updated roadmap for details.

## Technologies Used

### Frontend
*   HTML5, CSS3, JavaScript (ES6 modules)
*   Vite build system for development and production
*   [Anime.js](https://animejs.com/) for animations
*   Responsive design with CSS Grid and Flexbox

### Backend (AWS Amplify Gen2)
*   **Authentication:** Amazon Cognito User Pools
*   **API:** AWS AppSync (GraphQL with real-time subscriptions)  
*   **Database:** Amazon DynamoDB (NoSQL, serverless)
*   **Functions:** AWS Lambda (Node.js/TypeScript)
*   **Storage:** Amazon S3 (driver images, assets)
*   **Hosting:** AWS Amplify Hosting
*   **CI/CD:** AWS Amplify hosting with GitHub integration and automatic branch deployments

### External Integrations
*   **F1 Data:** [OpenF1 API](https://openf1.org/) for real-time race data
*   **Email:** AWS SES (planned for notifications)
*   **Monitoring:** AWS CloudWatch for logging and analytics

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

### Development Guidelines
- Follow the modular architecture established in Phase 1
- Each new feature should include its own implementation plan
- Test locally with Amplify sandbox before pushing
- Focus on direct AWS integration (users start fresh with complete system)
- Document GraphQL operations and backend integrations
- **New developers:** See [Project Structure Guide](docs/development/project-structure.md) for detailed architecture and development workflow

## License

This project is open source. See LICENSE file for details.