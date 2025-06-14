# F1 Survivor - Survive the Grid

<p align="center">
  <!-- Consider adding a custom logo for your game here -->
  <img src="dist/assets/images/F1-Logo.png" alt="F1 Survivor Game" width="150"> 
</p>

Welcome to **F1 Survivor**, a web-based game where your Formula 1 knowledge and a bit of luck will determine if you can outlast the competition and survive the entire F1 season!

## How to Play

The rules are designed to be simple yet challenging:

1.  **Pick a Driver:** Before each GP, choose one driver from the official grid.
2.  **No Repeats:** You cannot pick the same driver more than once throughout the season. Strategic planning is key!
3.  **Top 10 Finish:** If your chosen driver finishes in the top 10 in that GP, you survive and advance to the next race.
4.  **Forgot to Pick?** If you forget to make a selection for a GP, the system will automatically assign you the driver who qualified in 15th place (P15) for that race.
5.  **Elimination:** If your chosen (or auto-assigned P15) driver finishes outside the top 10 (or does not finish - DNF), you're out of the game!
6.  **Last One Standing:** The goal is to be the last player surviving in the league.

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
- **Automatic Deployment:** Connected to GitHub, deploys on push to `master` branch via Vercel
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
│   ├── storage/
│   │   └── resource.ts         # S3 storage configuration
│   └── functions/              # Lambda functions
│       ├── auto-pick-handler/
│       ├── results-processor/
│       └── league-manager/
├── assets/
│   └── images/
│       ├── drivers/            # Driver profile images
│       └── F1-Logo.png
├── docs/                       # Project documentation
│   ├── ROADMAP.md             # Development roadmap
│   └── implementation-plans/   # Feature implementation plans
├── src/                        # Frontend source (if restructured)
├── app.js                      # Core game logic
├── auto-pick-manager.js        # Auto-pick system
├── dashboard.js                # Dashboard functionality
├── dashboard.html              # Dashboard page
├── dashboard.css               # Dashboard styles
├── dashboard-utils.js          # Dashboard utilities
├── elimination-utils.js        # Elimination logic
├── elimination-zone.js         # Elimination zone component
├── elimination-zone.css        # Elimination zone styles
├── index.html                  # Main HTML structure
├── league-dashboard.js         # League dashboard integration
├── league-indicator.css        # League indicator styles
├── league-integration.js       # League system integration
├── league-manager.js           # Core league operations
├── league-modal.css            # League modal styles
├── league-modal-manager.js     # League UI modals
├── league-selector.css         # League selector styles
├── league-storage-manager.js   # League data persistence
├── pick-change-utils.js        # Pick change utilities
├── pick-deadline-manager.js    # Deadline management
├── qualifying-results-manager.js # Qualifying data
├── race-calendar-2025.js       # F1 2025 calendar
├── race-countdown.js           # Race countdown timer
├── race-results-api.js         # Race results fetching
├── race-state-manager.js       # Race state tracking
├── storage-utils.js            # Storage utilities
├── styles.css                  # Main styling
├── test-league-system.html     # League testing page
├── vite.config.js              # Vite build configuration (multi-page)
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

✅ **League System (Prototype):**
  - Create private leagues with custom names and settings
  - Join leagues using 8-character invite codes
  - League management interface for owners and members
  - Separate pick tracking per league
  - League standings and member status display
  - Switch between solo play and league modes
  - League-specific dashboard views
  - Multi-user simulation for testing (within same browser)
  - Owner controls: member management, settings updates
  - Persistent league data using localStorage

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

✅ **Enhanced Authentication & User Experience:** ✅ (Completed June 13, 2025)
  - **Google OAuth Integration:** Complete "Continue with Google" and "Sign up with Google" functionality
  - **Enhanced Name Capture:** Sign-up form now captures first and last names for proper user display
  - **Real Name Display:** Users show as "Raul Frias" instead of "google_105701204197643832702" 
  - **Mobile-First Responsive Design:** Touch-friendly authentication with 44px targets, 16px fonts
  - **Professional UX:** CSS spinner animations, enhanced loading states, improved error handling
  - **Cross-Browser Synchronization:** "Make Your Pick" button properly updates across browsers/sessions
  - **OAuth Callback Handling:** Robust callback processing with retry logic for timing issues
  - **Database Schema Enhancements:** Added displayName, firstName, lastName, googleId fields
  - **Authorization Fixes:** Resolved owner field and identity claim issues for OAuth users

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

🔄 **Current Focus:**
  - 🔄 **Multi-League Core Architecture:** Unlimited leagues per user, shareable links, cross-league profiles
  - 🔄 **Advanced League Customization:** Multiple lives system (1-5 lives per league), admin controls

🔄 **Next Priority:**
  - 🔄 **League Operations AWS Migration:** Remove localStorage dependency, complete backend integration
  - 🔄 **Real-time Updates:** GraphQL subscriptions for live league interactions

## Development Roadmap

Our development is organized into manageable phases with modular features:

1. **User Flow Foundation** ✅ (Completed)
   - Driver selection with team-colored cards
   - Race countdown and P15 auto-pick system
   - User dashboard with pick history
   - League system prototype with local storage

1.5. **Mobile Responsiveness & Production Polish** ✅ (Completed June 2025)
   - Complete mobile-first responsive design
   - Production deployment fixes with Vite configuration
   - Enhanced UX with track animation removal
   - All 404 issues resolved (dashboard, favicon, assets)

2. **AWS Amplify Gen2 Backend Foundation** 🚀 (Current Focus)
   - AWS Amplify Gen2 project initialization ✅
   - Core Data Schema Definition (9-model GraphQL schema) ✅
   - Cognito authentication integration ✅
   - OpenF1 API integration fixes ✅
   - Production build and deployment configuration ✅
   - **Next: Frontend-Backend Integration** (connect picks to AWS GraphQL)
   - Replace localStorage operations with DynamoDB via GraphQL
   - Real-time league updates via AppSync subscriptions
   - Serverless auto-pick Lambda functions

3. **Enhanced Game Logic & F1 Integration** 🏎️
   - OpenF1 API integration with robust error handling
   - Advanced league management features
   - Automated results processing engine
   - Multi-channel notification system

4. **User Experience & Platform Enhancement** 🌟
   - Advanced dashboard analytics and visualizations
   - Progressive Web App (PWA) implementation
   - Social features and community building
   - Advanced competition features and tournaments

See [ROADMAP.md](docs/ROADMAP.md) for detailed development plans.

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
*   **CI/CD:** GitHub integration with automatic deployments

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

## License

This project is open source. See LICENSE file for details.