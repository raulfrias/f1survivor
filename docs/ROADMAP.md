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

### League System Prototype
- [ ] Create league creation form interface
- [ ] Build league joining form with code entry
- [ ] Implement local storage for league data
- [ ] Add league member list component

## Phase 2: Backend Foundation 🔌

### Basic API Setup
- [ ] Set up Node.js/Express project structure
- [ ] Create API route configuration
- [ ] Implement CORS and basic middleware
- [ ] Set up error handling framework

### Google Authentication
- [ ] Set up Google OAuth integration
- [ ] Create authentication middleware
- [ ] Implement JWT token handling
- [ ] Add protected routes

### Database Models
- [ ] Design and implement User model
- [ ] Create League model with relations
- [ ] Build DriverPick model for selections
- [ ] Implement RaceResult model

### API Endpoints
- [ ] Create user endpoints (profile, settings)
- [ ] Build league endpoints (create, join, list)
- [ ] Implement pick endpoints (submit, change, view)
- [ ] Add race data endpoints

## Phase 3: Core Game Logic 🎮

### League Management
- [ ] Connect league creation form to API
- [ ] Implement league invitation system
- [ ] Build league admin controls
- [ ] Add league settings management

### Pick System Integration
- [ ] Connect driver selection UI to backend
- [ ] Implement pick validation against deadline
- [ ] Add pick history API integration
- [ ] Build pick confirmation workflow

### F1 Data Integration
- [ ] Set up OpenF1 API client
- [ ] Create race calendar integration
- [ ] Implement driver grid data sync
- [ ] Build qualifying results fetcher

### Results Processing
- [ ] Create race results processor
- [ ] Implement survival calculation logic
- [ ] Build elimination notification system
- [ ] Add league standings updater

## Phase 4: User Experience 🚀

### Email Notifications
- [ ] Set up email delivery service
- [ ] Create email templates for key events
- [ ] Implement race results notification
- [ ] Build elimination notice

### Dashboard Enhancements
- [ ] Create interactive league standings
- [ ] Build player statistics component
- [ ] Implement race countdown widget
- [ ] Add driver performance stats

### Mobile Optimization
- [ ] Optimize responsive layouts
- [ ] Implement touch-friendly controls
- [ ] Add mobile navigation improvements
- [ ] Create offline capabilities

### Social Features
- [ ] Add league chat functionality
- [ ] Implement social sharing
- [ ] Build friend invitation system
- [ ] Create league activity feed

## Technical Implementation Notes

### Local Storage Schema (Phase 1)
```javascript
// User data structure
const userData = {
  id: "user123",
  name: "Player Name",
  email: "player@example.com",
  leagues: ["league1", "league2"],
  picks: {
    "race1": { driverId: 5, result: "survived" },
    "race2": { driverId: 9, result: "eliminated" }
  }
};

// League data structure
const leagueData = {
  id: "league1",
  name: "My F1 League",
  owner: "user123",
  members: ["user123", "user456"],
  inviteCode: "F1LEAGUE2024"
};
```

### Database Schema (Phase 2)
```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leagues
CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  owner_id INTEGER REFERENCES users(id),
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League Members
CREATE TABLE league_members (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id),
  user_id INTEGER REFERENCES users(id),
  is_alive BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(league_id, user_id)
);

-- Driver Picks
CREATE TABLE driver_picks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  league_id INTEGER REFERENCES leagues(id),
  race_id VARCHAR(50) NOT NULL,
  driver_id INTEGER NOT NULL,
  is_auto_pick BOOLEAN DEFAULT FALSE,
  result VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, league_id, race_id)
);
```

## Future Considerations

### Expansion Ideas
- [ ] Mobile app development
- [ ] API marketplace
- [ ] White-label solution
- [ ] Integration with other racing series
- [ ] Fantasy racing platform

### Community Building
- [ ] Developer documentation
- [ ] API documentation
- [ ] Community guidelines
- [ ] Contribution guide
- [ ] Bug bounty program

## Timeline Estimates

- **Phase 1:** Completed
- **Phase 2:** Q2 2024 (2-3 months)
- **Phase 3:** Q3 2024 (2-3 months)
- **Phase 4:** Q4 2024 (3-4 months)
- **Technical Improvements:** Ongoing

## Integration Points

### OpenF1 API Integration
```javascript
const API_CONFIG = {
    BASE_URL: '/api/v1',
    ENDPOINTS: {
        DRIVERS: '/drivers',
        USER_PICKS: '/picks',
        RACE_INFO: '/races/current',
        QUALIFYING: '/qualifying',
        RESULTS: '/results'
    }
};
```

### Authentication Integration
```javascript
// User authentication state
function isUserAuthenticated() {
    const token = localStorage.getItem('userToken');
    return token && !isTokenExpired(token);
}

// API request authentication
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getUserToken()}`
};
```

### Database Schema (Draft)
```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leagues
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Picks
CREATE TABLE picks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    league_id INTEGER REFERENCES leagues(id),
    driver_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Notes

- All timelines are estimates and may be adjusted based on development progress and priorities
- Features may be added, modified, or removed based on user feedback and technical constraints
- Security and performance optimizations will be ongoing throughout all phases
- Documentation will be maintained and updated throughout the development process 